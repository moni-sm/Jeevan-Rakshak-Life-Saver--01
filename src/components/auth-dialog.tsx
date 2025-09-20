'use client';

import { useState } from 'react';
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

type AuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
      });
    }
  };

  const handleSendOtp = async () => {
    if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
        toast({
          variant: 'destructive',
          title: 'Invalid Phone Number',
          description: 'Please enter a valid phone number including the country code (e.g., +919876543210).',
        });
        return;
      }
    setIsSendingOtp(true);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier!;
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );
      window.confirmationResult = confirmationResult;
      setOtpSent(true);
      toast({
        title: 'OTP Sent',
        description: `An OTP has been sent to ${phoneNumber}.`,
      });
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to send OTP',
        description: error.message || 'Please try again.',
      });
      // Reset reCAPTCHA
      window.recaptchaVerifier?.render().then((widgetId) => {
        // @ts-ignore
        grecaptcha.reset(widgetId);
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
        toast({
          variant: 'destructive',
          title: 'Invalid OTP',
          description: 'Please enter the 6-digit OTP.',
        });
        return;
      }
    setIsVerifyingOtp(true);
    try {
      const confirmationResult = window.confirmationResult;
      if (confirmationResult) {
        await confirmationResult.confirm(otp);
        toast({
          title: 'Success!',
          description: "You've been signed in successfully.",
        });
        onOpenChange(false);
      } else {
        throw new Error('No confirmation result found.');
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to verify OTP',
        description: error.message || 'Please check the OTP and try again.',
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            {otpSent
              ? 'Enter the 6-digit OTP sent to your phone.'
              : 'Enter your phone number to receive an OTP.'}
          </DialogDescription>
        </DialogHeader>
        <div id="recaptcha-container"></div>
        <div className="space-y-4">
          {!otpSent ? (
            <div className="space-y-2">
              <Input
                type="tel"
                placeholder="Phone number with country code (e.g. +91...)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <Button onClick={handleSendOtp} className="w-full" disabled={isSendingOtp}>
                {isSendingOtp ? <LoaderCircle className="animate-spin" /> : 'Send OTP'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <Button onClick={handleVerifyOtp} className="w-full" disabled={isVerifyingOtp}>
                {isVerifyingOtp ? <LoaderCircle className="animate-spin" /> : 'Verify OTP & Sign In'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
