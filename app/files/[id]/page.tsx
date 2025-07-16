'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Download, Lock, Shield, AlertTriangle, FileText, Archive, Edit, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import Link from 'next/link';

type Subfile = {
  file_name: string;
  file_path: string;
  size: number;
  mime_type: string;
  file_token: string;
  extracted: boolean;
  downloaded_at: string | null;
};

type TreeNode = {
  [key: string]: TreeNode | (Subfile & { __isLeaf: true });
};

type FlatTreeItem = {
  path: string;
  name: string;
  isLeaf: boolean;
};

function buildTree(files: Subfile[]): TreeNode {
  const root: TreeNode = {};
  for (const file of files) {
    const parts = file.file_path.split('/');
    let node: TreeNode = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!node[part]) {
        node[part] = i === parts.length - 1 ? { ...file, __isLeaf: true } : {};
      }
      node = node[part] as TreeNode;
    }
  }
  return root;
}

function flattenTree(tree: TreeNode, prefix = ''): FlatTreeItem[] {
  let result: FlatTreeItem[] = [];
  for (const key in tree) {
    const node = tree[key];
    const path = prefix ? `${prefix}/${key}` : key;
    if ((node as any).__isLeaf) {
      result.push({ path, name: key, isLeaf: true });
    } else {
      result.push({ path, name: key, isLeaf: false });
      result = result.concat(flattenTree(node as TreeNode, path));
    }
  }
  return result;
}

export default function FileDownloadPage() {
  const params = useParams();
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [fileExists, setFileExists] = useState(true);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [fileTree, setFileTree] = useState<TreeNode>({});
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [showEditToken, setShowEditToken] = useState(false);
  const [editToken, setEditToken] = useState('');

  const fileId = params.id;

  useEffect(() => {
    const fetchMeta = async () => {
      setError('');
      const res = await fetch(`/api/files/metadata/${fileId}`);
      if (res.ok) {
        const data = await res.json();
        setFileInfo(data);
        if (data.files && data.files.length > 0) {
          setFileTree(buildTree(data.files));
        }
        setFileExists(true);
      } else {
        setFileExists(false);
      }
    };
    fetchMeta();
  }, [fileId]);

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString() + ' at ' + d.toLocaleTimeString();
  };

  const handleUnlock = async () => {
    setError('');
    // Try to fetch metadata with password (simulate check)
    setIsUnlocked(true); // In production, validate password server-side
  };

  const handleSelect = (path: string) => {
    setSelectedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const handleSelectAll = () => {
    setSelectedPaths(flattenTree(fileTree).map((f) => f.path));
  };

  const handleDownloadSelected = async () => {
    setDownloading(true);
    setError('');
    try {
      const res = await fetch(`/api/files/download/${fileId}${fileInfo?.isPasswordProtected ? `?password=${encodeURIComponent(password)}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: selectedPaths })
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Download failed');
        setDownloading(false);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileInfo?.name.replace(/\.zip$/, '')}_partial.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setDownloading(false);
    } catch (e) {
      setError('Download failed');
      setDownloading(false);
    }
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

  const FileIcon = fileInfo && fileInfo.type && (fileInfo.type.includes('zip') || fileInfo.type.includes('archive')) ? Archive : FileText;

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
                    <CardTitle className="text-xl">{fileInfo?.name}</CardTitle>
                    <p className="text-muted-foreground">
                      {formatFileSize(fileInfo?.size ?? 0)} • Uploaded {formatDate(fileInfo?.uploadDate)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <Badge variant="default" className="bg-green-100 text-green-800 border border-green-300">
                    <Shield className="h-3 w-3 mr-1 text-green-600 bg-transparent" />
                    Virus Free
                  </Badge>
                  {fileInfo?.isPasswordProtected && (
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
                    {fileInfo ? fileInfo.maxDownloads - fileInfo.downloadCount : 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Downloads Remaining</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-chart-1">
                    {fileInfo ? Math.ceil((new Date(fileInfo.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0}
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
                  onClick={() => window.location.href = `/files/manage/${fileId}`}
                  className="hover:scale-105 transition-transform"
                >
                  {showEditToken ? 'Hide' : 'Manage File'}
                </Button>
              </CardTitle>
            </CardHeader>
          </Card>
          {/* Password Protection */}
          {fileInfo?.isPasswordProtected && !isUnlocked && (
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
              </CardContent>
            </Card>
          )}
          {/* File/Folder Tree Picker */}
          {(!fileInfo?.isPasswordProtected || isUnlocked) && fileInfo?.files && fileInfo.files.length > 0 && (
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Archive className="h-5 w-5 mr-2" />
                  Select Files or Folders to Download
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <Button size="sm" variant="outline" onClick={handleSelectAll} className="mr-2">Select All</Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedPaths([])}>Clear</Button>
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto border rounded p-2 bg-muted/20">
                  {flattenTree(fileTree).map((item) => (
                    <div key={item.path} className="flex items-center gap-2 pl-2">
                      <input
                        type="checkbox"
                        checked={selectedPaths.includes(item.path)}
                        onChange={() => handleSelect(item.path)}
                        id={item.path}
                      />
                      {item.isLeaf ? <FileText className="h-4 w-4 text-muted-foreground" /> : <Folder className="h-4 w-4 text-muted-foreground" />}
                      <label htmlFor={item.path} className="text-sm cursor-pointer select-none">
                        {item.name}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={handleDownloadSelected}
                    disabled={downloading || selectedPaths.length === 0}
                    className="w-full"
                  >
                    {downloading ? <span>Preparing...</span> : <><Download className="mr-2 h-4 w-4" />Download Selected</>}
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                  >
                    <a
                      href={`/api/files/download/${fileId}${fileInfo?.isPasswordProtected ? `?password=${encodeURIComponent(password)}` : ''}`}
                      download={fileInfo?.name}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download All
                    </a>
                  </Button>
                </div>
                {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
              </CardContent>
            </Card>
          )}
          {/* Footer Info */}
          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Downloaded {fileInfo?.downloadCount} times • Expires {formatDate(fileInfo?.expiryDate)}
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