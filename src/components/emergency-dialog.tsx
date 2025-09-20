'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
import { Ambulance, HeartPulse, Hospital, LoaderCircle, MapPin, Phone, Siren } from 'lucide-react';
import { User } from 'firebase/auth';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import type { EmergencyDetectionOutput } from '@/ai/flows/emergency-detection';
import { dispatchAmbulance } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useAuth } from '@/hooks/use-auth';

export type Geolocation = {
  latitude: number;
  longitude: number;
};

type Hospital = NonNullable<EmergencyDetectionOutput['hospitals']>[0];

type EmergencyDialogProps = {
  emergencyType: string;
  reason:string;
  firstAid?: string;
  hospitals?: EmergencyDetectionOutput['hospitals'];
  onClose: () => void;
  onLocationFound: (location: Geolocation) => void;
};


export function EmergencyDialog({
  emergencyType,
  reason,
  firstAid,
  hospitals,
  onClose,
  onLocationFound,
}: EmergencyDialogProps) {
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);
  const [location, setLocation] = useState<Geolocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isDispatching, startDispatchTransition] = useTransition();
  const user = useAuth();


  useEffect(() => {
    // Automatically try to get location once when the dialog opens
    if (!location && !isLocating && !locationError) {
      handleGetLocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetLocation = () => {
    setIsLocating(true);
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocation(newLocation);
        onLocationFound(newLocation);
        setIsLocating(false);
      },
      () => {
        setLocationError('Unable to retrieve your location. Please grant permission.');
        setIsLocating(false);
      }
    );
  };
  
  const sortedHospitals = useMemo(() => {
    if (!hospitals) return [];
    return [...hospitals].sort((a, b) => {
      const distA = parseFloat(a.distance.split(' ')[0]);
      const distB = parseFloat(b.distance.split(' ')[0]);
      return distA - distB;
    });
  }, [hospitals]);


  const handleAmbulanceClick = (hospital?: Hospital) => {
    const targetHospital = hospital || sortedHospitals[0];

    if (!targetHospital) {
        toast({
            variant: 'destructive',
            title: "No hospital available",
            description: "Could not find a hospital to dispatch an ambulance from.",
        });
        return;
    }

    if (!location) {
        toast({
            variant: 'destructive',
            title: "Location required",
            description: "Cannot dispatch an ambulance without your location. Please enable location services.",
        });
        handleGetLocation();
        return;
    }
    startDispatchTransition(async () => {
        const result = await dispatchAmbulance(targetHospital, location, user?.uid || null);
        if (result.success) {
            toast({
                title: "Ambulance Dispatched (Simulation)",
                description: `An ambulance has been requested from ${targetHospital.name}. Help is on the way.`,
            });
        } else {
            toast({
                variant: 'destructive',
                title: "Dispatch Failed",
                description: result.error,
            });
        }
    });
  }

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Siren className="h-6 w-6" />
            Potential Emergency Detected
          </AlertDialogTitle>
          <AlertDialogDescription className="text-lg font-semibold text-foreground">
            {emergencyType}
          </AlertDialogDescription>
          <AlertDialogDescription>{reason}</AlertDialogDescription>
        </AlertDialogHeader>

        {firstAid && (
           <Card className="bg-secondary/50">
            <CardHeader className='p-4'>
                <CardTitle className="flex items-center gap-2 text-base text-primary"><HeartPulse/> First Aid Advice</CardTitle>
            </CardHeader>
            <CardContent className='p-4 pt-0 text-sm text-muted-foreground'>
             {firstAid}
           </CardContent>
         </Card>
        )}

        <Card className="bg-secondary/50">
            <CardHeader className='p-4'>
                <CardTitle className="flex items-center gap-2 text-base text-primary"><Hospital/> Nearby Hospitals</CardTitle>
            </CardHeader>
            <CardContent className='p-4 pt-0 space-y-4'>
            {isLocating &&  !location && (
              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">
                  Finding nearby hospitals...
                </p>
              </div>
            )}

            {locationError && (
             <div className="text-center py-2">
                <p className="text-sm text-destructive">{locationError}</p>
                <Button variant="link" size="sm" className='p-0 h-auto' onClick={handleGetLocation}>Try again</Button>
             </div>
            )}

            {location && sortedHospitals.length > 0 && (
                <>
                <Button size="lg" className='w-full' onClick={() => handleAmbulanceClick()} disabled={isDispatching}>
                    {isDispatching ? <LoaderCircle className="animate-spin" /> : <Ambulance/>}
                    Request Ambulance from Nearest Hospital
                </Button>
                 <div className='space-y-3 pt-2'>
                    {sortedHospitals.map((hospital) => (
                    <div key={hospital.name} className="rounded-lg border bg-background/50 p-3 space-y-1">
                        <h4 className='font-semibold'>{hospital.name}</h4>
                        <p className='text-sm text-muted-foreground'>{hospital.address}</p>
                        <p className='text-sm text-muted-foreground flex items-center gap-2'><MapPin size={14}/> {hospital.distance}</p>
                        <div className='flex items-center gap-2 pt-2'>
                        <Button asChild variant="outline" size="sm">
                            <a href={`tel:${hospital.phone}`}>
                            <Phone size={16}/> Call
                            </a>
                        </Button>
                        </div>
                    </div>
                    ))}
                </div>
              </>
            )}
             {location && (!hospitals || hospitals.length === 0) && !isLocating && (
                <p className='text-sm text-muted-foreground text-center py-4'>No hospitals found nearby.</p>
             )}
            </CardContent>
        </Card>


        <div className="mt-2 rounded-lg border bg-secondary/50 p-4">
            <p className="text-xs text-muted-foreground">
            This is a simulation. In a real emergency, please call your local emergency services directly.
          </p>
        </div>

        <AlertDialogFooter className="mt-2">
          <Button onClick={onClose} className="w-full" variant="outline">Close</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
