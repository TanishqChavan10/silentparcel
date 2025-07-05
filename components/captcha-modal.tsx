'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, RefreshCw } from 'lucide-react';

interface CaptchaModalProps {
  isOpen: boolean;
  fileName: string;
  fileSize: number;
  onComplete: () => void;
  onClose: () => void;
}

export function CaptchaModal({ isOpen, fileName, fileSize, onComplete, onClose }: CaptchaModalProps) {
  const [captchaCompleted, setCaptchaCompleted] = useState(false);
  const [captchaCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-sm border-border/50">
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

          {/* Simple CAPTCHA */}
          <Card className="p-6 bg-gradient-to-br from-muted/50 to-muted/30 border-border/50">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="font-mono text-2xl font-bold tracking-wider bg-background px-4 py-2 rounded-lg border-2 border-dashed border-border/50">
                  {captchaCode}
                </div>
                <Button variant="ghost" size="sm" className="hover:bg-accent/50">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              
              <Button
                onClick={() => setCaptchaCompleted(true)}
                variant="outline"
                className="w-full hover:scale-105 transition-transform"
              >
                I'm not a robot
              </Button>
            </div>
          </Card>

          <Button 
            onClick={onComplete}
            disabled={!captchaCompleted}
            className="w-full hover:scale-105 transition-transform"
          >
            Proceed with Upload
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}