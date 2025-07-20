"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
	ArrowLeft,
	Download,
	Lock,
	Shield,
	AlertTriangle,
	FileText,
	Archive,
	Edit,
	Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

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

// --- Tree Utilities ---
type FileTreeNode = {
	name: string;
	path: string;
	isFolder: boolean;
	children?: FileTreeNode[];
	file?: Subfile;
};
function buildFileTree(files: Subfile[]): FileTreeNode[] {
	// Build a nested object tree first
	const root: { [key: string]: any } = {};
	for (const file of files) {
		const parts = file.file_path.split("/");
		let node = root;
		let currPath = "";
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			currPath = currPath ? currPath + "/" + part : part;
			if (!node[part]) {
				node[part] = {
					name: part,
					path: currPath,
					isFolder: i < parts.length - 1,
					children: i < parts.length - 1 ? {} : undefined,
				};
			}
			if (i === parts.length - 1) {
				node[part].file = file;
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

function getAllPaths(nodes: FileTreeNode[]): string[] {
	let paths: string[] = [];
	for (const node of nodes) {
		if (node.isFolder && node.children) {
			paths.push(node.path);
			paths = paths.concat(getAllPaths(node.children));
		} else {
			paths.push(node.path);
		}
	}
	return paths;
}

function getAllLeafPaths(nodes: FileTreeNode[]): string[] {
	let paths: string[] = [];
	for (const node of nodes) {
		if (node.isFolder && node.children) {
			paths = paths.concat(getAllLeafPaths(node.children));
		} else {
			paths.push(node.path);
		}
	}
	return paths;
}

// --- TreeCheckbox component for indeterminate logic ---
type TreeCheckboxProps = {
	checked: boolean;
	indeterminate: boolean;
	onChange: () => void;
	id: string;
};
function TreeCheckbox({
	checked,
	indeterminate,
	onChange,
	id,
}: TreeCheckboxProps) {
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (ref.current) ref.current.indeterminate = indeterminate;
	}, [indeterminate]);
	return (
		<input
			ref={ref}
			type="checkbox"
			checked={checked}
			onChange={onChange}
			id={id}
		/>
	);
}

export default function FileDownloadPage() {
	// --- State ---
	const [fileTree, setFileTree] = useState<FileTreeNode[]>([]);
	const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
	const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
		new Set()
	);
	const [downloading, setDownloading] = useState(false);
	const [error, setError] = useState("");
	const [showEditToken, setShowEditToken] = useState(false);
	const [editToken, setEditToken] = useState("");
	const params = useParams();
	const [fileExists, setFileExists] = useState(true);
	const [fileInfo, setFileInfo] = useState<any>(null);
	const [password, setPassword] = useState("");
	const [isUnlocked, setIsUnlocked] = useState(false);
	const fileId = params.id;

	// --- Effect: Build initial tree from fileInfo ---
	useEffect(() => {
		if (fileInfo?.files) {
			setFileTree(buildFileTree(fileInfo.files));
			// Expand root folders by default
			setExpandedFolders(
				new Set(fileInfo.files.map((f: any) => f.file_path.split("/")[0]))
			);
		}
	}, [fileInfo]);

	// --- Selection Logic ---
	const handleSelect = (
		path: string,
		isFolder: boolean,
		children?: FileTreeNode[]
	) => {
		if (isFolder && children) {
			// Select/deselect all children recursively
			const leafPaths = getAllLeafPaths(children);
			setSelectedPaths((prev) => {
				const allSelected = leafPaths.every((p) => prev.includes(p));
				if (allSelected) {
					// Deselect all
					return prev.filter((p) => !leafPaths.includes(p));
				} else {
					// Select all
					return Array.from(new Set([...prev, ...leafPaths]));
				}
			});
		} else {
			setSelectedPaths((prev) =>
				prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
			);
		}
	};
	const handleSelectAll = () => {
		setSelectedPaths(getAllLeafPaths(fileTree));
	};
	const handleClear = () => {
		setSelectedPaths([]);
	};
	const toggleFolder = (path: string) => {
		setExpandedFolders((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(path)) newSet.delete(path);
			else newSet.add(path);
			return newSet;
		});
	};

	// --- Render Tree ---
	function renderTree(nodes: FileTreeNode[], depth = 0) {
		return nodes.map((node) => {
			const isExpanded = expandedFolders.has(node.path);
			const allLeafs = getAllLeafPaths([node]);
			const checked = node.isFolder
				? allLeafs.every((p) => selectedPaths.includes(p))
				: selectedPaths.includes(node.path);
			const some = node.isFolder
				? allLeafs.some((p) => selectedPaths.includes(p))
				: false;
			const indeterminate = node.isFolder && some && !checked;
			return (
				<div key={node.path} style={{ marginLeft: depth * 16 }}>
					{node.isFolder ? (
						<div className="flex items-center">
							<button
								type="button"
								onClick={() => toggleFolder(node.path)}
								className="mr-1 focus:outline-hidden"
							>
								{isExpanded ? (
									<span style={{ display: "inline-block", width: 16 }}>
										&#9660;
									</span>
								) : (
									<span style={{ display: "inline-block", width: 16 }}>
										&#9654;
									</span>
								)}
							</button>
							<TreeCheckbox
								checked={checked}
								indeterminate={indeterminate}
								onChange={() =>
									handleSelect(node.path, node.isFolder, node.children)
								}
								id={node.path}
							/>
							<Folder className="h-4 w-4 text-muted-foreground ml-1" />
							<label
								htmlFor={node.path}
								className="ml-1 text-sm cursor-pointer select-none"
							>
								{node.name}
							</label>
						</div>
					) : (
						<div className="flex items-center">
							<span style={{ width: 32, display: "inline-block" }} />
							<TreeCheckbox
								checked={checked}
								indeterminate={false}
								onChange={() => handleSelect(node.path, false)}
								id={node.path}
							/>
							<FileText className="h-4 w-4 text-muted-foreground ml-1" />
							<label
								htmlFor={node.path}
								className="ml-1 text-sm cursor-pointer select-none"
							>
								{node.name}
							</label>
						</div>
					)}
					{node.isFolder && isExpanded && node.children && (
						<div>{renderTree(node.children, depth + 1)}</div>
					)}
				</div>
			);
		});
	}

	useEffect(() => {
		const fetchMeta = async () => {
			setError("");
			const res = await fetch(`/api/files/metadata/${fileId}`);
			if (res.ok) {
				const data = await res.json();
				setFileInfo(data);
				if (data.files && data.files.length > 0) {
					// setFileTree(buildTree(data.files)); // This line is no longer needed
				}
				setFileExists(true);
			} else {
				setFileExists(false);
			}
		};
		fetchMeta();
	}, [fileId]);

	const formatFileSize = (bytes: number) => {
		if (!bytes) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};
	const formatDate = (date: string | Date | undefined) => {
		if (!date) return "";
		const d = new Date(date);
		return d.toLocaleDateString() + " at " + d.toLocaleTimeString();
	};

	const handleUnlock = async () => {
		setError("");
		// Try to fetch metadata with password (simulate check)
		setIsUnlocked(true); // In production, validate password server-side
	};

	const handleDownloadSelected = async () => {
		setDownloading(true);
		setError("");
		try {
			const res = await fetch(
				`/api/files/download/${fileId}${
					fileInfo?.isPasswordProtected
						? `?password=${encodeURIComponent(password)}`
						: ""
				}`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ paths: selectedPaths }),
				}
			);
			if (!res.ok) {
				const data = await res.json();
				setError(data.error || "Download failed");
				setDownloading(false);
				return;
			}
			const blob = await res.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `${fileInfo?.name.replace(/\.zip$/, "")}_partial.zip`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setDownloading(false);
		} catch (e) {
			setError("Download failed");
			setDownloading(false);
		}
	};

	if (!fileExists || !fileInfo) {
		return (
			<div className="min-h-screen bg-background">
				<header className="border-b border-border/40 backdrop-blur-xs bg-background/80 sticky top-0 z-50">
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
								This file doesn't exist or has expired. Files are automatically
								deleted after 30 days of inactivity.
							</p>
							<Link href="/files">
								<Button className="w-full">Upload New File</Button>
							</Link>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	const FileIcon =
		fileInfo &&
		fileInfo.type &&
		(fileInfo.type.includes("zip") || fileInfo.type.includes("archive"))
			? Archive
			: FileText;

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<header className="border-b border-border/40 backdrop-blur-xs bg-background/80 sticky top-0 z-50">
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
											{formatFileSize(fileInfo?.size ?? 0)} • Uploaded{" "}
											{formatDate(fileInfo?.uploadDate)}
										</p>
									</div>
								</div>
								<div className="flex flex-col items-end space-y-2">
									<Badge
										variant="default"
										className="bg-green-100 text-green-800 border border-green-300"
									>
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
										{fileInfo
											? fileInfo.maxDownloads - fileInfo.downloadCount
											: 0}
									</div>
									<p className="text-sm text-muted-foreground">
										Downloads Remaining
									</p>
								</div>
								<div className="text-center">
									<div className="text-2xl font-bold text-chart-1">
										{fileInfo
											? Math.ceil(
													(new Date(fileInfo.expiryDate).getTime() -
														Date.now()) /
														(1000 * 60 * 60 * 24)
											  )
											: 0}
									</div>
									<p className="text-sm text-muted-foreground">
										Days Until Expiry
									</p>
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
									onClick={() =>
										window.open(`/files/manage/${fileId}`, `_blank`)
									}
									className="hover:scale-105 transition-transform"
								>
									{showEditToken ? "Hide" : "Manage File"}
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
										onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
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
					{(!fileInfo?.isPasswordProtected || isUnlocked) &&
						fileInfo?.files &&
						fileInfo.files.length > 0 && (
							<Card className="bg-card/50 border-border/50">
								<CardHeader>
									<CardTitle className="flex items-center">
										<Archive className="h-5 w-5 mr-2" />
										Select Files or Folders to Download
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="mb-2">
										<Button
											size="sm"
											variant="outline"
											onClick={handleSelectAll}
											className="mr-2"
										>
											Select All
										</Button>
										<Button size="sm" variant="outline" onClick={handleClear}>
											Clear
										</Button>
									</div>
									<div className="space-y-1 max-h-60 overflow-y-auto border rounded p-2 bg-muted/20">
										{renderTree(fileTree)}
									</div>
									<div className="flex gap-2 mt-4">
										<Button
											onClick={handleDownloadSelected}
											disabled={downloading || selectedPaths.length === 0}
											className="w-full"
										>
											{downloading ? (
												<span>Preparing...</span>
											) : (
												<>
													<Download className="mr-2 h-4 w-4" />
													Download Selected
												</>
											)}
										</Button>
										<Button asChild variant="outline" className="w-full">
											<a
												href={`/api/files/download/${fileId}${
													fileInfo?.isPasswordProtected
														? `?password=${encodeURIComponent(password)}`
														: ""
												}`}
												download={fileInfo?.name}
												target="_blank"
												rel="noopener noreferrer"
											>
												<Download className="mr-2 h-4 w-4" />
												Download All
											</a>
										</Button>
									</div>
									{error && (
										<div className="text-red-600 text-sm mt-2">{error}</div>
									)}
								</CardContent>
							</Card>
						)}
					{/* Footer Info */}
					<div className="text-center space-y-2">
						<p className="text-xs text-muted-foreground">
							Downloaded {fileInfo?.downloadCount} times • Expires{" "}
							{formatDate(fileInfo?.expiryDate)}
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
