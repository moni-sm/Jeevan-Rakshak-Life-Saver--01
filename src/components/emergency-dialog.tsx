'use client';

import { useEffect, useState } from 'react';
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

export type Geolocation = {
  latitude: number;
  longitude: number;
};

type EmergencyDialogProps = {
  emergencyType: string;
  reason: string;
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
  const hasRequestedLocation =_hasRequestedLocation();

  function _hasRequestedLocation(){
    return isLocating || location || locationError;
  }

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

  const handleAmbulanceClick = (hospitalName: string) => {
    toast({
      title: "Ambulance Dispatched (Simulation)",
      description: `An ambulance has been requested from ${hospitalName}. Help is on the way.`,
    })
  }
  
  useEffect(() => {
    if (!hasRequestedLocation) {
        handleGetLocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRequestedLocation]);

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
           <div className="mt-4 rounded-lg border bg-secondary/50 p-4">
           <h3 className="font-bold text-primary flex items-center gap-2"><HeartPulse/> First Aid Advice</h3>
           <p className="mt-2 text-sm text-muted-foreground">
             {firstAid}
           </p>
         </div>
        )}

        {(isLocating || (location && hospitals && hospitals.length > 0)) && (
           <div className="mt-4 space-y-4">
           <h3 className="font-bold text-primary flex items-center gap-2"><Hospital/> Nearby Hospitals</h3>
            {isLocating &&  (
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  Finding nearby hospitals...
                </p>
              </div>
            )}
            {location && hospitals && hospitals.length > 0 && (
              <div className='space-y-3'>
                {hospitals.map((hospital) => (
                  <div key={hospital.name} className="rounded-lg border bg-secondary/50 p-4 space-y-2">
                    <h4 className='font-semibold'>{hospital.name}</h4>
                    <p className='text-sm text-muted-foreground'>{hospital.address}</p>
                    <p className='text-sm text-muted-foreground flex items-center gap-2'><MapPin size={14}/> {hospital.distance}</p>
                    <div className='flex items-center gap-2 pt-2'>
                      <Button asChild variant="outline" size="sm">
                        <a href={`tel:${hospital.phone}`}>
                          <Phone size={16}/> Call Now
                        </a>
                      </Button>
                      <Button size="sm" onClick={() => handleAmbulanceClick(hospital.name)}>
                        <Ambulance size={16}/> Send Ambulance
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 rounded-lg border bg-secondary/50 p-4">
          <h3 className="font-bold text-primary">Alert Status</h3>
            {location && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              <span>
                Location captured: {location.latitude.toFixed(4)},{' '}
                {location.longitude.toFixed(4)}
              </span>
            </div>
          )}
          {locationError && (
            <p className="mt-2 text-sm text-destructive">{locationError}</p>
          )}
            <p className="mt-3 text-xs text-muted-foreground">
            This is a simulation. In a real emergency, please call your local emergency services directly.
          </p>
        </div>

        <AlertDialogFooter className="mt-4">
          <Button onClick={onClose} className="w-full">Close</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
