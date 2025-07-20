'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Shield, AlertTriangle, Edit, Eye, Trash2, Download, Plus, FileText, Archive, Users, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

interface Subfile {
  file_name: string;
  file_path: string;
  size: number;
  mime_type: string;
  file_token: string;
  extracted: boolean;
  downloaded_at: string | null;
}

interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  downloadCount: number;
  maxDownloads: number;
  expiryDate: string;
  isPasswordProtected: boolean;
  virusScanStatus: string;
  files: Subfile[];
  appwrite_id: string;
  isActive: boolean;
}

interface AccessLog {
  id: string;
  ip: string;
  timestamp: Date;
  action: 'download' | 'view';
  userAgent: string;
}

// --- Tree Utilities ---
type FileTreeNode = {
  name: string;
  path: string;
  isFolder: boolean;
  children?: FileTreeNode[];
  file?: Subfile | File;
  status: 'existing' | 'to-add' | 'to-delete';
  file_token?: string; // for existing files
};

function buildFileTree(files: (Subfile | File & { webkitRelativePath?: string })[], status: 'existing' | 'to-add'): FileTreeNode[] {
  // Build a nested object tree first
  const root: { [key: string]: any } = {};
  for (const file of files) {
    const relPath = (file as any).file_path || (file as any).webkitRelativePath || (file as any).name;
    const parts = relPath.split('/');
    let node = root;
    let currPath = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currPath = currPath ? currPath + '/' + part : part;
      if (!node[part]) {
        node[part] = {
          name: part,
          path: currPath,
          isFolder: i < parts.length - 1,
          children: i < parts.length - 1 ? {} : undefined,
          status: i === parts.length - 1 ? status : 'existing',
        };
      }
      if (i === parts.length - 1) {
        node[part].file = file;
        if ((file as any).file_token) node[part].file_token = (file as any).file_token;
      }
      node = node[part].children || {};
    }
  }
  // Convert object tree to array tree for rendering
  function toArrayTree(obj: any): FileTreeNode[] {
    return Object.values(obj).map((n: any) => ({
      ...n,
      children: n.children ? toArrayTree(n.children) : undefined,
    }));
  }
  return toArrayTree(root);
}

function mergeFileTrees(existing: FileTreeNode[], toAdd: FileTreeNode[]): FileTreeNode[] {
  // Recursively merge two trees, preferring to-add status for new files
  const map = new Map<string, FileTreeNode>();
  for (const node of existing) map.set(node.path, { ...node });
  for (const node of toAdd) {
    if (map.has(node.path)) {
      const exist = map.get(node.path)!;
      if (exist.isFolder && node.children && exist.children) {
        exist.children = mergeFileTrees(exist.children, node.children);
      } else {
        exist.status = node.status; // to-add overrides
        exist.file = node.file;
      }
    } else {
      map.set(node.path, { ...node });
    }
  }
  return Array.from(map.values());
}

// --- Fix markNodeAndChildrenForDelete/unmarkNodeAndChildrenForDelete ---
function markNodeAndChildrenForDelete(node: FileTreeNode): FileTreeNode {
  node.status = 'to-delete';
  if (node.children) node.children = node.children.map(markNodeAndChildrenForDelete);
  return node;
}
function unmarkNodeAndChildrenForDelete(node: FileTreeNode): FileTreeNode {
  node.status = node.file ? 'existing' : 'to-add';
  if (node.children) node.children = node.children.map(unmarkNodeAndChildrenForDelete);
  return node;
}



export default function ManageFilePage() {
  const params = useParams();
  const router = useRouter();
    // --- State ---
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editToken, setEditToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]); // file_token of files to delete
  const [updateLoading, setUpdateLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileId = params.id as string;

  // Fetch metadata from API
  const loadFileData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/files/metadata/${fileId}`);
      if (!res.ok) {
        setError('File not found or has been deleted.');
        setFileInfo(null);
      } else {
        const data = await res.json();
        setFileInfo(data);
      }
    } catch (e) {
      setError('Failed to fetch file metadata.');
      setFileInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // --- Effect: Build initial tree from fileInfo ---
  useEffect(() => {
    if (fileInfo?.files) {
      setFileTree(buildFileTree(fileInfo.files, 'existing'));
      // Expand root folders by default
      setExpandedFolders(new Set(fileInfo.files.map((f: any) => (f.file_path || f.webkitRelativePath || f.name).split('/')[0])));
    }
  }, [fileInfo]);

  useEffect(() => {
    if (isAuthenticated) {
      loadFileData();
    }
    // eslint-disable-next-line
  }, [isAuthenticated, fileId]);

  const handleAuthenticate = () => {
    // Simulate token verification (replace with real check if needed)
    if (editToken && editToken.length >= 10) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid edit token.');
    }
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
        files: fileInfo.files.filter(f => f.file_token !== fileId)
      });
    }
  };

  // --- Add Files ---
  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files ?? []);
    const toAddTree = buildFileTree(filesArray, 'to-add');
    setFileTree(prev => mergeFileTrees(prev, toAddTree));
    e.target.value = '';
  };

  // --- Handler functions for tree actions ---
  const handleUndoDeleteNode = (path: string) => {
    setFileTree(prev => prev.map(node => {
      if (node.path === path) {
        return unmarkNodeAndChildrenForDelete({ ...node });
      } else if (node.children) {
        return { ...node, children: node.children.map(child => child.path === path ? unmarkNodeAndChildrenForDelete({ ...child }) : child) };
      }
      return node;
    }));
  };
  const handleDeleteNode = (path: string) => {
    setFileTree(prev => prev.map(node => {
      if (node.path === path) {
        return markNodeAndChildrenForDelete({ ...node });
      } else if (node.children) {
        return { ...node, children: node.children.map(child => child.path === path ? markNodeAndChildrenForDelete({ ...child }) : child) };
      }
      return node;
    }));
  };
  const handleRemovePendingFile = (path: string) => {
    setFileTree(prev => prev.filter(node => node.path !== path));
  };

  // Handler for marking an existing file for deletion
  const handleDeleteExistingFile = (fileToken: string) => {
    setFilesToDelete(prev => [...prev, fileToken]);
  };

  // Handler for undoing delete on an existing file
  const handleUndoDeleteExistingFile = (fileToken: string) => {
    setFilesToDelete(prev => prev.filter(token => token !== fileToken));
  };

  // --- Folder expand/collapse logic ---
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) newSet.delete(path);
      else newSet.add(path);
      return newSet;
    });
  };

  // --- Handler for viewing as receiver ---
  const viewAsReceiver = () => {
    router.push(`/files/${fileId}`);
  };

  // --- Update Files Handler ---
  const handleUpdateFiles = async () => {
    // Gather files to add and tokens to delete
    const filesToAdd: File[] = [];
    const relPathsToAdd: string[] = [];
    const filesToDelete: string[] = [];
    function traverse(nodes: FileTreeNode[]) {
      for (const node of nodes) {
        if (node.status === 'to-add' && node.file instanceof File) {
          filesToAdd.push(node.file);
          relPathsToAdd.push(node.path);
        }
        if (node.status === 'to-delete' && node.file_token) {
          filesToDelete.push(node.file_token);
        }
        if (node.children) traverse(node.children);
      }
    }
    traverse(fileTree);
    if (filesToAdd.length === 0 && filesToDelete.length === 0) return;
    setUpdateLoading(true);
    setError('');
    try {
      const formData = new FormData();
      filesToAdd.forEach((file, i) => {
        formData.append('files', file);
        formData.append('relativePaths', relPathsToAdd[i]);
      });
      formData.append('editToken', editToken);
      formData.append('filesToDelete', JSON.stringify(filesToDelete));
      const res = await fetch(`/api/files/manage/${fileId}`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update file');
      } else {
        await loadFileData();
        setFileTree([]); // will be rebuilt from fileInfo
      }
    } catch (err) {
      setError('Failed to update file');
    } finally {
      setUpdateLoading(false);
    }
  };

  // --- Render Tree ---
  function renderTree(nodes: FileTreeNode[], depth = 0) {
    return nodes.map(node => {
      const isExpanded = expandedFolders.has(node.path);
      return (
        <div key={node.path} style={{ marginLeft: depth * 16 }}>
          {node.isFolder ? (
            <div className="flex items-center">
              <button type="button" onClick={() => toggleFolder(node.path)} className="mr-1 focus:outline-none">
                {isExpanded ? <span style={{ display: 'inline-block', width: 16 }}>&#9660;</span> : <span style={{ display: 'inline-block', width: 16 }}>&#9654;</span>}
              </button>
              <Archive className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className={`flex-1 text-sm ${node.status === 'to-delete' ? 'line-through text-red-600' : node.status === 'to-add' ? 'text-yellow-700' : ''}`}>{node.name}</span>
              {node.status === 'to-delete' ? (
                <Button variant="ghost" size="sm" onClick={() => handleUndoDeleteNode(node.path)} className="text-green-600 hover:text-green-800">Undo</Button>
              ) : node.status === 'existing' ? (
                <Button variant="ghost" size="sm" onClick={() => handleDeleteNode(node.path)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => handleRemovePendingFile(node.path)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><X className="h-4 w-4" /></Button>
              )}
            </div>
          ) : (
            <div className="flex items-center">
              <span style={{ width: 32, display: 'inline-block' }} />
              <FileText className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className={`flex-1 text-sm ${node.status === 'to-delete' ? 'line-through text-red-600' : node.status === 'to-add' ? 'text-yellow-700' : ''}`}>{node.name}</span>
              {node.status === 'to-delete' ? (
                <Button variant="ghost" size="sm" onClick={() => handleUndoDeleteNode(node.path)} className="text-green-600 hover:text-green-800">Undo</Button>
              ) : node.status === 'existing' ? (
                <Button variant="ghost" size="sm" onClick={() => handleDeleteNode(node.path)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => handleRemovePendingFile(node.path)} className="text-destructive hover:text-destructive hover:bg-destructive/10"><X className="h-4 w-4" /></Button>
              )}
            </div>
          )}
          {node.isFolder && isExpanded && node.children && (
            <div>{renderTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  }

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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading file info...</div>
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
                      {formatFileSize(fileInfo.size)} • Uploaded {new Date(fileInfo.uploadDate).toLocaleDateString()}
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
                    {Math.ceil((new Date(fileInfo.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
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
                    <div className="flex items-center gap-2">
                      <div
                        onDrop={e => {
                          e.preventDefault();
                          const items = e.dataTransfer.items;
                          if (items) {
                            const files: File[] = [];
                            let pending = items.length;
                            for (let i = 0; i < items.length; i++) {
                              let entry: FileSystemEntry | null = null;
                              if (typeof items[i].webkitGetAsEntry === 'function') {
                                entry = items[i].webkitGetAsEntry();
                              }
                              if (entry) {
                                if (entry.isDirectory) {
                                  // Recursively read directory (not supported in all browsers)
                                  // For production, use a library like browser-fs-access or similar for full support
                                  pending--;
                                } else if (entry.isFile) {
                                  // Get the File from the entry
                                  (entry as FileSystemFileEntry).file((file: File) => {
                                    files.push(file);
                                    pending--;
                                    if (pending === 0 && files.length > 0) {
                                      const toAddTree = buildFileTree(files, 'to-add');
                                      setFileTree(prev => mergeFileTrees(prev, toAddTree));
                                    }
                                  });
                                  continue; // Wait for async file callback
                                } else {
                                  pending--;
                                }
                              } else {
                                // Fallback: treat as File
                                const file = typeof items[i].getAsFile === 'function' ? items[i].getAsFile() : null;
                                if (file) files.push(file);
                                pending--;
                              }
                            }
                            // If all are sync (no async file callbacks), update immediately
                            if (pending === 0 && files.length > 0) {
                              const toAddTree = buildFileTree(files, 'to-add');
                              setFileTree(prev => mergeFileTrees(prev, toAddTree));
                            }
                          }
                        }}
                        onDragOver={e => e.preventDefault()}
                        className="border-2 border-dashed border-muted-foreground rounded-lg p-4 mb-4 text-center cursor-pointer bg-muted/10 hover:bg-muted/20"
                        style={{ minHeight: 60 }}
                        title="Drag and drop files or folders here"
                      >
                        Drag and drop files or folders here, or use the Add Files button below.
                      </div>
                      <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        accept="*"
                        onChange={handleAddFiles}
                        disabled={updateLoading}
                        style={{ display: 'none' }}
                        id="add-files-input"
                        // @ts-ignore
                        webkitdirectory="true"
                        directory="true"
                      />
                      <label htmlFor="add-files-input">
                        <Button size="sm" className="hover:scale-105 transition-transform" asChild>
                          <span>Add Files or Folders</span>
                        </Button>
                      </label>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">{renderTree(fileTree)}</ScrollArea>
                  {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
                  <Button
                    onClick={handleUpdateFiles}
                    className="w-full mt-4"
                    disabled={updateLoading}
                  >
                    {updateLoading ? 'Updating...' : 'Update Archive'}
                  </Button>
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
                    <span className="text-sm font-medium">{new Date(fileInfo.expiryDate).toLocaleDateString()}</span>
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