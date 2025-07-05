'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Shield, AlertTriangle, Edit, Eye, Trash2, Download, Plus, FileText, Archive, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  downloadCount: number;
  maxDownloads: number;
  expiryDate: Date;
  isPasswordProtected: boolean;
  virusScanStatus: 'clean' | 'infected' | 'scanning';
  files?: { name: string; size: number; id: string }[];
}

interface AccessLog {
  id: string;
  ip: string;
  timestamp: Date;
  action: 'download' | 'view';
  userAgent: string;
}

export default function ManageFilePage() {
  const params = useParams();
  const router = useRouter();
  const [editToken, setEditToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const fileId = params.id as string;

  const handleAuthenticate = () => {
    // Simulate token verification
    if (editToken === 'edit_token_abc123' || editToken.length >= 10) {
      setIsAuthenticated(true);
      setError('');
      loadFileData();
    } else {
      setError('Invalid edit token. Try "edit_token_abc123" for demo.');
    }
  };

  const loadFileData = () => {
    // Mock file data
    const mockFile: FileInfo = {
      id: fileId,
      name: 'project-files.zip',
      size: 2.5 * 1024 * 1024,
      type: 'application/zip',
      uploadDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      downloadCount: 3,
      maxDownloads: 10,
      expiryDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
      isPasswordProtected: true,
      virusScanStatus: 'clean',
      files: [
        { id: '1', name: 'README.md', size: 1024 },
        { id: '2', name: 'src/main.js', size: 5120 },
        { id: '3', name: 'package.json', size: 512 },
        { id: '4', name: 'assets/logo.png', size: 2048000 }
      ]
    };

    const mockLogs: AccessLog[] = [
      {
        id: '1',
        ip: '192.168.1.100',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        action: 'download',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        id: '2',
        ip: '10.0.0.50',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        action: 'view',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        id: '3',
        ip: '172.16.0.25',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        action: 'download',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      }
    ];

    setFileInfo(mockFile);
    setAccessLogs(mockLogs);
  };

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

  const handleDeleteFile = (fileId: string) => {
    if (fileInfo?.files) {
      setFileInfo({
        ...fileInfo,
        files: fileInfo.files.filter(f => f.id !== fileId)
      });
    }
  };

  const handleAddFiles = () => {
    // Simulate adding files
    if (newFiles.length > 0 && fileInfo) {
      const newFileEntries = newFiles.map((file, index) => ({
        id: `new_${Date.now()}_${index}`,
        name: file.name,
        size: file.size
      }));

      setFileInfo({
        ...fileInfo,
        files: [...(fileInfo.files || []), ...newFileEntries]
      });
      setNewFiles([]);
    }
  };

  const viewAsReceiver = () => {
    router.push(`/files/${fileId}`);
  };

  if (!isAuthenticated) {
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
              <CardTitle className="flex items-center">
                <Edit className="h-5 w-5 mr-2" />
                Enter Edit Token
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Management Token</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="Enter your edit token"
                  value={editToken}
                  onChange={(e) => setEditToken(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAuthenticate()}
                  className="bg-background/50"
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
              <Button 
                onClick={handleAuthenticate} 
                disabled={!editToken} 
                className="w-full hover:scale-105 transition-transform"
              >
                Access File Management
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Demo token: edit_token_abc123
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!fileInfo) {
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
                This file doesn't exist or has been deleted.
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
          <div className="flex items-center space-x-2">
            <Button 
              onClick={viewAsReceiver}
              variant="outline" 
              size="sm" 
              className="hover:scale-105 transition-transform"
            >
              <Eye className="h-4 w-4 mr-2" />
              View as Receiver
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* File Header */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Archive className="h-6 w-6 text-primary" />
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
                      Protected
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {fileInfo.downloadCount}
                  </div>
                  <p className="text-sm text-muted-foreground">Total Downloads</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-chart-1">
                    {fileInfo.maxDownloads - fileInfo.downloadCount}
                  </div>
                  <p className="text-sm text-muted-foreground">Downloads Remaining</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 border-border/50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-chart-2">
                    {Math.ceil((fileInfo.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <p className="text-sm text-muted-foreground">Days Until Expiry</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Management Tabs */}
          <Tabs defaultValue="files" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50">
              <TabsTrigger value="files">File Management</TabsTrigger>
              <TabsTrigger value="logs">Access Logs</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="space-y-4">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Archive className="h-5 w-5 mr-2" />
                      Archive Contents ({fileInfo.files?.length || 0} files)
                    </span>
                    <Button size="sm" className="hover:scale-105 transition-transform">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Files
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {fileInfo.files?.map((file) => (
                        <div key={file.id} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteFile(file.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Access Logs ({accessLogs.length} entries)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {accessLogs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between py-3 px-3 bg-muted/30 rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Badge variant={log.action === 'download' ? 'default' : 'secondary'}>
                                {log.action === 'download' ? <Download className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                                {log.action}
                              </Badge>
                              <span className="text-sm font-medium">{log.ip}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(log.timestamp)}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground max-w-xs truncate">
                            {log.userAgent}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    File Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Password Protection</p>
                      <p className="text-sm text-muted-foreground">Require password for downloads</p>
                    </div>
                    <Badge variant={fileInfo.isPasswordProtected ? 'default' : 'secondary'}>
                      {fileInfo.isPasswordProtected ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Download Limit</p>
                      <p className="text-sm text-muted-foreground">Maximum number of downloads</p>
                    </div>
                    <span className="text-sm font-medium">{fileInfo.maxDownloads}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Expiry Date</p>
                      <p className="text-sm text-muted-foreground">Automatic deletion date</p>
                    </div>
                    <span className="text-sm font-medium">{fileInfo.expiryDate.toLocaleDateString()}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-border/50">
                    <Button variant="destructive" className="w-full hover:scale-105 transition-transform">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete File Permanently
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}