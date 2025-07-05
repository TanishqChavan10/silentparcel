'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, ExternalLink, Edit, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LinkResultModalProps {
  isOpen: boolean;
  downloadLink: string;
  editToken: string;
  fileName: string;
  onClose: () => void;
}

export function LinkResultModal({ isOpen, downloadLink, editToken, fileName, onClose }: LinkResultModalProps) {
  const [copiedDownload, setCopiedDownload] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);

  const copyToClipboard = async (text: string, type: 'download' | 'edit') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'download') {
        setCopiedDownload(true);
        setTimeout(() => setCopiedDownload(false), 2000);
      } else {
        setCopiedEdit(true);
        setTimeout(() => setCopiedEdit(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg bg-background/95 backdrop-blur-sm border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl">Upload Complete! 🎉</DialogTitle>
          <DialogDescription>
            Your file "{fileName}" has been uploaded successfully and is ready to share.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download Link */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <ExternalLink className="h-4 w-4 mr-2" />
                Public Download Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex space-x-2">
                <Input 
                  value={downloadLink} 
                  readOnly 
                  className="font-mono text-sm bg-background/50"
                />
                <Button
                  onClick={() => copyToClipboard(downloadLink, 'download')}
                  variant="outline"
                  size="icon"
                  className="hover:scale-105 transition-transform"
                >
                  {copiedDownload ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with anyone to let them download your file
              </p>
            </CardContent>
          </Card>

          {/* Edit Token */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                Management Token
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex space-x-2">
                <Input 
                  value={editToken} 
                  readOnly 
                  className="font-mono text-sm bg-background/50"
                />
                <Button
                  onClick={() => copyToClipboard(editToken, 'edit')}
                  variant="outline"
                  size="icon"
                  className="hover:scale-105 transition-transform"
                >
                  {copiedEdit ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this token to manage your file, view access logs, or delete it
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex space-x-2">
            <Button onClick={onClose} className="flex-1 hover:scale-105 transition-transform">
              Done
            </Button>
            <Button variant="outline" className="flex-1 hover:scale-105 transition-transform">
              <Eye className="h-4 w-4 mr-2" />
              View File Page
            </Button>
          </div>

          <div className="text-center text-xs text-muted-foreground border-t border-border/50 pt-4">
            Files are automatically deleted after 30 days of inactivity
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}