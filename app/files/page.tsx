'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileText, Lock, Shield, Check, AlertTriangle, Eye, X, Loader2 } from 'lucide-react';
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
import { storage, BUCKETS } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { Readable } from 'stream';

type UploadStage = 'select' | 'captcha' | 'uploading' | 'complete' | 'virus-error';

interface FileData {
  name: string;
  size: number;
  type: string;
  file: File;
}

export default function FilesPage() {
  const router = useRouter();
  const [stage, setStage] = useState<UploadStage>('select');
  const [selectedFiles, setSelectedFiles] = useState<FileData[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [virusScanStatus, setVirusScanStatus] = useState<(null | 'scanning' | 'clean' | 'infected')[]>([]);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [downloadLinks, setDownloadLinks] = useState<string[]>([]);
  const [editTokens, setEditTokens] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = useCallback((files: File[]) => {
    const fileDataArr = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file
    }));
    setSelectedFiles(fileDataArr);
    setUploadProgress(new Array(fileDataArr.length).fill(0));
    setVirusScanStatus(new Array(fileDataArr.length).fill(null));
  }, []);

  const uploadFilesToServer = async () => {
    setVirusScanStatus(selectedFiles.map(() => 'scanning'));
    setUploadProgress(selectedFiles.map(() => 0));
    setUploadError(null);

    // Prepare FormData for all files at once
    const formData = new FormData();
    selectedFiles.forEach((fileData) => {
      formData.append('files', fileData.file);
      // Use webkitRelativePath if available, else fallback to file name
      formData.append(
        'relativePaths',
        (fileData.file as any).webkitRelativePath || fileData.name
      );
    });
    if (passwordProtected && password) {
      formData.append('password', password);
    }

    try {
      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.downloadUrl && data.editUrl) {
        setVirusScanStatus(selectedFiles.map(() => 'clean'));
        setDownloadLinks([data.downloadUrl]);
        setEditTokens([data.editUrl.split('/').pop()]);
        setUploadProgress(selectedFiles.map(() => 100));
        setTimeout(() => setStage('complete'), 500);
      } else {
        setVirusScanStatus(selectedFiles.map(() => 'infected'));
        setUploadError(data.error || 'File contains a virus and cannot be shared.');
        setStage('virus-error');
      }
    } catch (err) {
      setVirusScanStatus(selectedFiles.map(() => 'infected'));
      setUploadError('File contains a virus and cannot be shared.');
      setStage('virus-error');
    }
  };

  const handleCaptchaComplete = () => {
    setStage('uploading');
    uploadFilesToServer();
  };

  const handleBackToSelect = () => {
    setStage('select');
    setSelectedFiles([]);
    setUploadProgress([]);
    setVirusScanStatus([]);
    setDownloadLinks([]);
    setEditTokens([]);
    setUploadError(null);
    setPassword('');
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
                Securely share files up to 50000 with automatic virus scanning
              </p>
            </div>

            <FileDropzone onFileSelect={handleFileSelect} multiple/>

            {selectedFiles.length > 0 && (
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Selected Files
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {selectedFiles.map((file, idx) => (
                      <div key={file.name + file.size} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={file.size > 50 * 1024 * 1024 ? 'destructive' : 'secondary'}>
                            {file.size > 50 * 1024 * 1024 ? 'Too Large' : 'Valid'}
                          </Badge>
                          <button
                            type="button"
                            aria-label="Remove file"
                            className="ml-2 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                            onClick={() => {
                              setSelectedFiles(selectedFiles.filter((_, i) => i !== idx));
                              setUploadProgress(uploadProgress.filter((_, i) => i !== idx));
                              setVirusScanStatus(virusScanStatus.filter((_, i) => i !== idx));
                            }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
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
                    onClick={() => {
                      setStage('captcha');
                      console.log('hCaptcha sitekey:', process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY);
                    }}
                    className="w-full hover:scale-105 transition-transform"
                    disabled={selectedFiles.some(file => file.size > 50 * 1024 * 1024)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Continue to Upload
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {stage === 'uploading' && selectedFiles.length > 0 && !uploadError && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Uploading & Scanning Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {selectedFiles.map((file, idx) => (
                  <div key={file.name + file.size} className="mb-2">
                    <div className="flex justify-between text-sm">
                      <span>{file.name}</span>
                      <span>{Math.round(uploadProgress[idx] || 0)}%</span>
                    </div>
                    <Progress value={uploadProgress[idx] || 0} className="h-2" />
                    <div className="flex items-center space-x-2 mt-1">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">
                        {virusScanStatus[idx] === 'scanning' && 'Scanning for viruses...'}
                        {virusScanStatus[idx] === 'clean' && (
                          <span className="text-green-600 flex items-center">
                            <Check className="h-4 w-4 mr-1" />
                            File is clean and safe
                          </span>
                        )}
                        {virusScanStatus[idx] === 'infected' && (
                          <span className="text-red-600 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Virus detected - upload blocked
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {stage === 'virus-error' && uploadError && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-red-600 font-semibold">
                {uploadError}
              </div>
              <Button onClick={handleBackToSelect} className="w-full hover:scale-105 transition-transform">
                Go Back to File Upload
              </Button>
            </CardContent>
          </Card>
        )}

        <CaptchaModal 
          isOpen={stage === 'captcha'}
          fileName={selectedFiles.length === 1 ? selectedFiles[0].name : selectedFiles.length > 1 ? `${selectedFiles.length} files` : ''}
          fileSize={selectedFiles.reduce((acc, f) => acc + f.size, 0)}
          onComplete={handleCaptchaComplete}
          onClose={() => setStage('select')}
        />

        <LinkResultModal
          isOpen={stage === 'complete'}
          downloadLink={downloadLinks.length === 1 ? downloadLinks[0] : ''}
          editToken={editTokens.length === 1 ? editTokens[0] : ''}
          fileName={selectedFiles.length === 1 ? selectedFiles[0].name : selectedFiles.length > 1 ? `${selectedFiles.length} files` : ''}
          onClose={() => router.push('/')}
        />
      </div>
    </div>
  );
}