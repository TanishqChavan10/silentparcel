'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileText, Lock, Shield, Check, AlertTriangle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { FileDropzone } from '@/components/file-dropzone';
import { CaptchaModal } from '@/components/captcha-modal';
import { LinkResultModal } from '@/components/link-result-modal';

type UploadStage = 'select' | 'captcha' | 'uploading' | 'complete';

interface FileData {
  name: string;
  size: number;
  type: string;
  file: File;
}

export default function FilesPage() {
  const router = useRouter();
  const [stage, setStage] = useState<UploadStage>('select');
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [virusScanStatus, setVirusScanStatus] = useState<'scanning' | 'clean' | 'infected' | null>(null);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  const [editToken, setEditToken] = useState('');

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile({
      name: file.name,
      size: file.size,
      type: file.type,
      file
    });
  }, []);

  const handleCaptchaComplete = () => {
    setStage('uploading');
    simulateUpload();
  };

  const simulateUpload = () => {
    setVirusScanStatus('scanning');
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setVirusScanStatus('clean');
        const fileId = Math.random().toString(36).substring(2, 12);
        setDownloadLink(`https://secureshare.app/files/${fileId}`);
        setEditToken('edit_token_abc123');
        setTimeout(() => setStage('complete'), 500);
      }
      setUploadProgress(Math.min(progress, 100));
    }, 200);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="hover:bg-accent/50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {stage === 'select' && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Upload a File</h1>
              <p className="text-muted-foreground">
                Securely share files up to 700MB with automatic virus scanning
              </p>
            </div>

            <FileDropzone onFileSelect={handleFileSelect} />

            {selectedFile && (
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Selected File
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                      </p>
                    </div>
                    <Badge variant={selectedFile.size > 700 * 1024 * 1024 ? 'destructive' : 'secondary'}>
                      {selectedFile.size > 700 * 1024 * 1024 ? 'Too Large' : 'Valid'}
                    </Badge>
                  </div>

                  {/* Settings */}
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="flex items-center">
                          <Lock className="h-4 w-4 mr-2" />
                          Password Protection
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Require a password to download
                        </p>
                      </div>
                      <Switch
                        checked={passwordProtected}
                        onCheckedChange={setPasswordProtected}
                      />
                    </div>

                    {passwordProtected && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Download Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="bg-background/50"
                        />
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={() => setStage('captcha')}
                    className="w-full hover:scale-105 transition-transform"
                    disabled={selectedFile.size > 700 * 1024 * 1024}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Continue to Upload
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {stage === 'uploading' && selectedFile && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2" />
                Uploading {selectedFile.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Upload Progress</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>

              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm">
                  {virusScanStatus === 'scanning' && 'Scanning for viruses...'}
                  {virusScanStatus === 'clean' && (
                    <span className="text-green-600 flex items-center">
                      <Check className="h-4 w-4 mr-1" />
                      File is clean and safe
                    </span>
                  )}
                  {virusScanStatus === 'infected' && (
                    <span className="text-red-600 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Virus detected - upload blocked
                    </span>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <CaptchaModal 
          isOpen={stage === 'captcha'}
          fileName={selectedFile?.name || ''}
          fileSize={selectedFile?.size || 0}
          onComplete={handleCaptchaComplete}
          onClose={() => setStage('select')}
        />

        <LinkResultModal
          isOpen={stage === 'complete'}
          downloadLink={downloadLink}
          editToken={editToken}
          fileName={selectedFile?.name || ''}
          onClose={() => router.push('/')}
        />
      </div>
    </div>
  );
}