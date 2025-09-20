'use client';

import { useEffect, useState } from 'react';
import { LoaderCircle, MapPin, Siren } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from './ui/button';

export type Geolocation = {
  latitude: number;
  longitude: number;
};

type EmergencyDialogProps = {
  emergencyType: string;
  reason: string;
  onClose: () => void;
  onLocationFound: (location: Geolocation) => void;
};


export function EmergencyDialog({
  emergencyType,
  reason,
  onClose,
  onLocationFound,
}: EmergencyDialogProps) {
  const [step, setStep] = useState<'confirm' | 'locating' | 'notified'>('confirm');
  const [location, setLocation] = useState<Geolocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleGetLocation = () => {
    setStep('locating');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setStep('notified'); // Move to final step with error
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
        setStep('notified');
      },
      () => {
        setLocationError('Unable to retrieve your location.');
        setStep('notified'); // Move to final step with error
      }
    );
  };
  
  useEffect(() => {
    if (step === 'confirm' && emergencyType) {
        // Automatically request location for a smoother UX in an emergency.
        // The browser will still prompt for permission.
        handleGetLocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, emergencyType]);

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent>
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

        {step === 'locating' && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">
              Attempting to get your location to alert the nearest hospital...
            </p>
          </div>
        )}

        {step === 'notified' && (
          <div className="mt-4 rounded-lg border bg-secondary/50 p-4">
            <h3 className="font-bold text-primary">Hospital Alert Sent (Mock)</h3>
            <p className="mt-2 text-sm">
              The nearest hospital has been notified of a potential{' '}
              <span className="font-semibold">{emergencyType}</span>.
            </p>
            {location && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                <span>
                  Location: {location.latitude.toFixed(4)},{' '}
                  {location.longitude.toFixed(4)}
                </span>
              </div>
            )}
            {locationError && (
              <p className="mt-2 text-sm text-destructive">{locationError}</p>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Please remain calm. Help is on the way. This is a simulation.
            </p>
          </div>
        )}

        <AlertDialogFooter className="mt-4">
          {step === 'notified' ? (
             <Button onClick={onClose} className="w-full">Close</Button>
          ) : (
             <Button onClick={onClose} variant="outline" className="w-full">Close</Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
