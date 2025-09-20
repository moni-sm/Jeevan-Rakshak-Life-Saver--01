'use client';

import { useEffect, useState, useTransition, useMemo } from 'react';
import { Ambulance, HeartPulse, Hospital, LoaderCircle, MapPin, Phone, Siren } from 'lucide-react';
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
  isFindingHospitals?: boolean;
};


export function EmergencyDialog({
  emergencyType,
  reason,
  firstAid,
  hospitals,
  onClose,
  onLocationFound,
  isFindingHospitals,
}: EmergencyDialogProps) {
  const { toast } = useToast();
  const [isLocating, setIsLocating] = useState(false);
  const [location, setLocation] = useState<Geolocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isDispatching, startDispatchTransition] = useTransition();

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
        setLocationError('Could not get your location. Please grant permission and try again.');
        setIsLocating(false);
      }
    );
  };
  
  useEffect(() => {
    // Only attempt to get location if we don't have it and we don't have hospitals yet.
    if (!location && !hospitals) {
      handleGetLocation();
    }
    // We only want this to run when the dialog mounts and `hospitals` isn't available yet.
    // The handleGetLocation function is stable and doesn't need to be a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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
        return;
    }
    startDispatchTransition(async () => {
        const result = await dispatchAmbulance(targetHospital, location);
        if (result.success) {
            toast({
                title: "Ambulance Dispatched",
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

  const handleRetryLocation = () => {
    handleGetLocation();
  };

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
            {isLocating && (
              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">
                  Getting your location...
                </p>
              </div>
            )}

            {locationError && !isLocating &&(
             <div className="text-center py-2">
                <p className="text-sm text-destructive">{locationError}</p>
                <Button variant="link" size="sm" className='p-0 h-auto' onClick={handleRetryLocation}>Try again</Button>
             </div>
            )}

            {sortedHospitals.length > 0 && (
                <>
                <Button size="lg" className='w-full' onClick={() => handleAmbulanceClick()} disabled={isDispatching || !location}>
                    {isDispatching ? <LoaderCircle className="animate-spin" /> : <><Ambulance className='mr-2'/> Request Ambulance from Nearest Hospital</>}
                </Button>
                 <div className='space-y-3 pt-2'>
                    {sortedHospitals.map((hospital) => (
                    <div key={hospital.name} className="rounded-lg border bg-background/50 p-3 space-y-1">
                        <h4 className='font-semibold'>{hospital.name}</h4>
                        <p className='text-sm text-muted-foreground'>{hospital.address}</p>
                        <div className='flex items-center gap-4 pt-2 text-sm'>
                            <div className='flex items-center gap-2'><MapPin size={14}/> {hospital.distance}</div>
                            <div className='flex items-center gap-2'><Phone size={14}/> {hospital.phone}</div>
                        </div>
                        <div className='flex items-center gap-2 pt-2'>
                          <Button asChild variant="outline" size="sm" className="flex-1">
                              <a href={`tel:${hospital.phone}`}>
                                <Phone size={16} className="mr-2"/> Call Hospital
                              </a>
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleAmbulanceClick(hospital)}
                            disabled={isDispatching || !location}
                           >
                            <Ambulance size={16} className="mr-2"/> Send Ambulance
                          </Button>
                        </div>
                    </div>
                    ))}
                </div>
              </>
            )}
             {location && !isLocating && isFindingHospitals && (
                <div className="flex flex-col items-center justify-center gap-2 py-4">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">
                        Finding hospitals...
                    </p>
                </div>
             )}
             {location && !isLocating && !isFindingHospitals && hospitals && hospitals.length === 0 && (
                <p className='text-sm text-muted-foreground text-center py-4'>No hospitals found nearby.</p>
             )}
            </CardContent>
        </Card>


        <div className="mt-2 rounded-lg border bg-secondary/50 p-4">
            <p className="text-xs text-muted-foreground">
            This is a real-time system. Dispatching an ambulance will create a request in our system. Only use in a genuine emergency.
          </p>
        </div>

        <AlertDialogFooter className="mt-2">
          <Button onClick={onClose} className="w-full" variant="outline">Close</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
