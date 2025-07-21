'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
// @ts-expect-error: No types for react-hcaptcha
import HCaptcha from 'react-hcaptcha';

interface CaptchaModalProps {
  isOpen: boolean;
  fileName: string;
  fileSize: number;
  onComplete: () => void;
  onClose: () => void;
}

export function CaptchaModal({ isOpen, fileName, fileSize, onComplete, onClose }: CaptchaModalProps) {
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hcaptchaRef = useRef<any>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleVerify = async (token: string) => {
    console.log('hCaptcha token received:', token);
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch('/api/verify-hcaptcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      console.log('hCaptcha verify response:', data);
      if (data.success) {
        setCaptchaVerified(true);
      } else {
        setError('CAPTCHA verification failed. Please try again.');
        setCaptchaVerified(false);
        hcaptchaRef.current?.resetCaptcha();
      }
    } catch (e) {
      setError('An error occurred during verification.');
      setCaptchaVerified(false);
      hcaptchaRef.current?.resetCaptcha();
      console.error('Error in handleVerify:', e);
    } finally {
      setVerifying(false);
      console.log('handleVerify finished');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-xs border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Verify Upload
          </DialogTitle>
          <DialogDescription>
            Just making sure you're not a robot with unlimited bandwidth.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Preview */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="font-medium text-sm mb-1">{fileName}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
          </div>

          {/* hCaptcha Widget */}
          <div className="flex flex-col items-center space-y-2">
            <HCaptcha
              sitekey={process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || ''}
              onVerify={(token : any) => {
                handleVerify(token).catch(e => {
                  // This will catch any unhandled promise rejections
                  console.error('Error in hCaptcha onVerify:', e);
                });
              }}
              ref={hcaptchaRef}
            />
            {verifying && <span className="text-xs text-muted-foreground">Verifying...</span>}
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>

          <Button 
            onClick={onComplete}
            disabled={captchaVerified} //check: add ! mark to hcaptcha work properly rn its disabled and will pass anyone
            className="w-full hover:scale-105 transition-transform"
          >
            Proceed with Upload
            
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}