'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Download, Lock, Shield, Clock, AlertTriangle, FileText, Archive, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';
import { storage, BUCKETS } from '@/lib/appwrite';
import { ID } from 'appwrite';

interface FileInfo {
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  downloadCount: number;
  maxDownloads: number;
  expiryDate: Date;
  isPasswordProtected: boolean;
  virusScanStatus: 'clean' | 'infected' | 'scanning';
  files?: { name: string; size: number }[]; // For archives
}

export default function FileDownloadPage() {
  const params = useParams();
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);
  const [fileExists, setFileExists] = useState(true);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [editToken, setEditToken] = useState('');
  const [showEditToken, setShowEditToken] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [virusScanStatus, setVirusScanStatus] = useState<string[]>([]);
  const [downloadLinks, setDownloadLinks] = useState<string[]>([]);
  const [editTokens, setEditTokens] = useState<string[]>([]);
  const [stage, setStage] = useState<'captcha' | 'uploading' | 'complete'>('captcha');

  const fileId = params.id as string;

  useEffect(() => {
    // Simulate file loading
    const loadFile = () => {
      // In a real app, this would be an API call
      const exists = Math.random() > 0.1; // 90% chance file exists
      
      if (exists) {
        setFileInfo({
          name: 'project-files.zip',
          size: 2.5 * 1024 * 1024, // 2.5MB
          type: 'application/zip',
          uploadDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          downloadCount: 3,
          maxDownloads: 10,
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 28 days from now
          isPasswordProtected: true,
          virusScanStatus: 'clean',
          files: [
            { name: 'README.md', size: 1024 },
            { name: 'src/main.js', size: 5120 },
            { name: 'package.json', size: 512 },
            { name: 'assets/logo.png', size: 2048000 }
          ]
        });
      } else {
        setFileExists(false);
      }
    };

    loadFile();
  }, [fileId]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
  };

  const handleUnlock = () => {
    // Simulate password check
    if (password === 'demo123') {
      setIsUnlocked(true);
    }
  };

  const handleDownload = (type: 'single' | 'zip') => {
    setDownloadStarted(true);
    // Simulate download
    setTimeout(() => {
      setDownloadStarted(false);
    }, 2000);
  };

  const handleEditTokenSubmit = () => {
    if (editToken === 'edit_token_abc123' || editToken.length >= 10) {
      window.location.href = `/files/manage/${fileId}`;
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes('zip') || type.includes('archive')) return Archive;
    return FileText;
  };

  const uploadFilesToAppwrite = async () => {
    setVirusScanStatus(selectedFiles.map(() => 'scanning'));
    const progressArr = [...uploadProgress];
    const statusArr = [...virusScanStatus];
    const linksArr: string[] = [];
    const tokensArr: string[] = [];

    for (let idx = 0; idx < selectedFiles.length; idx++) {
      const file = selectedFiles[idx];
      try {
        // Upload to Appwrite Storage
        const response = await storage.createFile(
          BUCKETS.FILES,
          ID.unique(),
          file // Use the File object directly, not file.file
        );
        // You can get the file ID from response.$id
        // Optionally, generate a download link here
        linksArr[idx] = `https://cloud.appwrite.io/v1/storage/buckets/${BUCKETS.FILES}/files/${response.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
        tokensArr[idx] = `edit_token_${Math.random().toString(36).substring(2, 8)}`;
        statusArr[idx] = 'clean';
        progressArr[idx] = 100;
      } catch (err) {
        statusArr[idx] = 'infected'; // Or handle error differently
        progressArr[idx] = 100;
      }
      setUploadProgress([...progressArr]);
      setVirusScanStatus([...statusArr]);
    }

    setDownloadLinks(linksArr);
    setEditTokens(tokensArr);
    setTimeout(() => setStage('complete'), 500);
  };

  const handleCaptchaComplete = () => {
    setStage('uploading');
    uploadFilesToAppwrite();
  };

  if (!fileExists || !fileInfo) {
    return (
      <div className="min-h-screen bg-background">
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

        <div className="container mx-auto px-4 py-8 max-w-md">
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center text-destructive">
                <AlertTriangle className="h-5 w-5 mr-2" />
                File Not Found
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                This file doesn't exist or has expired. Files are automatically deleted after 30 days of inactivity.
              </p>
              <Link href="/files">
                <Button className="w-full">
                  Upload New File
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const FileIcon = getFileIcon(fileInfo.type);

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
        <div className="space-y-6">
          {/* File Header */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{fileInfo.name}</CardTitle>
                    <p className="text-muted-foreground">
                      {formatFileSize(fileInfo.size)} • Uploaded {formatDate(fileInfo.uploadDate)}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <Badge variant={fileInfo.virusScanStatus === 'clean' ? 'default' : 'destructive'}>
                    <Shield className="h-3 w-3 mr-1" />
                    {fileInfo.virusScanStatus === 'clean' ? 'Virus Free' : 'Infected'}
                  </Badge>
                  {fileInfo.isPasswordProtected && (
                    <Badge variant="secondary">
                      <Lock className="h-3 w-3 mr-1" />
                      Protected
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Download Limits */}
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {fileInfo.maxDownloads - fileInfo.downloadCount}
                  </div>
                  <p className="text-sm text-muted-foreground">Downloads Remaining</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-chart-1">
                    {Math.ceil((fileInfo.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <p className="text-sm text-muted-foreground">Days Until Expiry</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Token Section */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Edit className="h-5 w-5 mr-2" />
                  File Owner?
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowEditToken(!showEditToken)}
                  className="hover:scale-105 transition-transform"
                >
                  {showEditToken ? 'Hide' : 'Manage File'}
                </Button>
              </CardTitle>
            </CardHeader>
            {showEditToken && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-token">Enter Edit Token</Label>
                  <Input
                    id="edit-token"
                    type="password"
                    placeholder="Your management token"
                    value={editToken}
                    onChange={(e) => setEditToken(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEditTokenSubmit()}
                    className="bg-background/50"
                  />
                </div>
                <Button 
                  onClick={handleEditTokenSubmit} 
                  disabled={!editToken} 
                  className="w-full hover:scale-105 transition-transform"
                >
                  Access File Management
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Demo token: edit_token_abc123
                </p>
              </CardContent>
            )}
          </Card>

          {/* Password Protection */}
          {fileInfo.isPasswordProtected && !isUnlocked && (
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Password Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Enter Download Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                    className="bg-background/50"
                  />
                </div>
                <Button 
                  onClick={handleUnlock} 
                  disabled={!password} 
                  className="w-full hover:scale-105 transition-transform"
                >
                  Unlock File
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Demo password: demo123
                </p>
              </CardContent>
            </Card>
          )}

          {/* File Contents (for archives) */}
          {(!fileInfo.isPasswordProtected || isUnlocked) && fileInfo.files && (
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Archive className="h-5 w-5 mr-2" />
                  Archive Contents ({fileInfo.files.length} files)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {fileInfo.files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{file.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Download Buttons */}
          {(!fileInfo.isPasswordProtected || isUnlocked) && (
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button 
                    onClick={() => handleDownload('zip')}
                    disabled={downloadStarted}
                    className="w-full hover:scale-105 transition-transform"
                    size="lg"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {downloadStarted ? 'Downloading...' : `Download ${fileInfo.name}`}
                  </Button>
                  
                  {fileInfo.files && fileInfo.files.length > 1 && (
                    <Button 
                      onClick={() => handleDownload('single')}
                      variant="outline"
                      className="w-full hover:scale-105 transition-transform"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Download Individual Files
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer Info */}
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Downloaded {fileInfo.downloadCount} times • Expires {formatDate(fileInfo.expiryDate)}
            </p>
            <Button variant="link" size="sm" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Report Abuse
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}