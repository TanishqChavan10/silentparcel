import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Shield,
	Lock,
	Eye,
	Zap,
	CheckCircle,
	AlertTriangle,
	ArrowLeft,
	Globe,
	Users,
	FileText,
	Server,
	Key,
	Fingerprint,
	Clock,
	Trash2,
} from "lucide-react";
import Script from "next/script";

export const metadata: Metadata = {
	title: "Security & Privacy | SilentParcel",
	description: "Learn about SilentParcel's military-grade security features including AES-256 encryption, zero-knowledge architecture, virus scanning, and privacy protection.",
	keywords: [
		"security",
		"privacy",
		"encryption",
		"zero-knowledge",
		"AES-256",
		"virus scanning",
		"data protection",
		"anonymous sharing",
		"end-to-end encryption"
	],
	openGraph: {
		title: "Security & Privacy | SilentParcel",
		description: "Military-grade security with AES-256 encryption, zero-knowledge architecture, and automatic virus scanning.",
		url: "https://silentparcel.com/security",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Security & Privacy | SilentParcel",
		description: "Military-grade security with AES-256 encryption and zero-knowledge architecture.",
	},
	alternates: {
		canonical: "/security",
	},
};

export default function SecurityPage() {
	return (
		<div className="min-h-screen bg-background">
			{/* Structured Data for Security Page */}
			<Script
				id="security-schema"
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "WebPage",
						"name": "Security & Privacy",
						"description": "Learn about SilentParcel's military-grade security features including AES-256 encryption, zero-knowledge architecture, virus scanning, and privacy protection.",
						"url": "https://silentparcel.com/security",
						"breadcrumb": {
							"@type": "BreadcrumbList",
							"itemListElement": [
								{
									"@type": "ListItem",
									"position": 1,
									"name": "Home",
									"item": "https://silentparcel.com"
								},
								{
									"@type": "ListItem",
									"position": 2,
									"name": "Security",
									"item": "https://silentparcel.com/security"
								}
							]
						}
					})
				}}
			/>

			{/* FAQ Schema for Security */}
			<Script
				id="security-faq-schema"
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "FAQPage",
						"mainEntity": [
							{
								"@type": "Question",
								"name": "What encryption does SilentParcel use?",
								"acceptedAnswer": {
									"@type": "Answer",
									"text": "SilentParcel uses AES-256 encryption, which is the same standard used by governments and financial institutions worldwide. Files are encrypted in your browser before upload."
								}
							},
							{
								"@type": "Question",
								"name": "Can SilentParcel access my files?",
								"acceptedAnswer": {
									"@type": "Answer",
									"text": "No, SilentParcel uses zero-knowledge architecture. Files are encrypted in your browser before upload, and we cannot decrypt or access your data even if we wanted to."
								}
							},
							{
								"@type": "Question",
								"name": "How does virus scanning work?",
								"acceptedAnswer": {
									"@type": "Answer",
									"text": "All uploaded files are automatically scanned for viruses and malware using industry-leading antivirus engines before being made available for download."
								}
							},
							{
								"@type": "Question",
								"name": "What happens to my data after sharing?",
								"acceptedAnswer": {
									"@type": "Answer",
									"text": "Files are automatically deleted after download or when they expire. No traces are left behind on our servers, ensuring complete privacy."
								}
							}
						]
					})
				}}
			/>

			{/* Header */}
			<header className="border-b border-border/30 bg-background/80 sticky top-0 z-50 shadow-sm">
				<div className="w-full max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
					<Link href="/">
						<Button
							variant="ghost"
							size="icon"
							className="rounded-full hover:bg-accent/60 transition"
						>
							<ArrowLeft className="h-5 w-5" />
							<span className="sr-only">Back to Home</span>
						</Button>
					</Link>
					<h1 className="text-xl font-semibold">Security & Privacy</h1>
					<div className="w-10" /> {/* Spacer for centering */}
				</div>
			</header>

			<main className="max-w-4xl mx-auto px-4 py-8">
				{/* Hero Section */}
				<section className="text-center mb-16">
					<div className="mb-8">
						<Shield className="h-16 w-16 mx-auto text-primary mb-4" />
						<h1 className="text-4xl font-bold mb-4">
							Military-Grade Security
						</h1>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Your privacy is our top priority. Every aspect of SilentParcel is
							designed with security-first principles.
						</p>
					</div>
					<div className="flex flex-wrap justify-center gap-4">
						<Badge variant="outline" className="text-sm px-4 py-2">
							AES-256 Encryption
						</Badge>
						<Badge variant="outline" className="text-sm px-4 py-2">
							Zero-Knowledge
						</Badge>
						<Badge variant="outline" className="text-sm px-4 py-2">
							Virus Scanning
						</Badge>
						<Badge variant="outline" className="text-sm px-4 py-2">
							No Registration
						</Badge>
					</div>
				</section>

				{/* Security Features Grid */}
				<section className="grid md:grid-cols-2 gap-8 mb-16">
					<Card className="border-primary/20">
						<CardHeader>
							<CardTitle className="flex items-center gap-3">
								<Lock className="h-6 w-6 text-primary" />
								End-to-End Encryption
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground mb-4">
								Files are encrypted in your browser using AES-256 before they
								ever leave your device. Only you and your intended recipients
								can decrypt the content.
							</p>
							<ul className="space-y-2 text-sm">
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									Military-grade AES-256 encryption
								</li>
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									Perfect forward secrecy
								</li>
							</ul>
						</CardContent>
					</Card>

					<Card className="border-primary/20">
						<CardHeader>
							<CardTitle className="flex items-center gap-3">
								<Eye className="h-6 w-6 text-primary" />
								Zero-Knowledge Architecture
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground mb-4">
								We literally cannot see your data, even if we wanted to. Your
								privacy is mathematically guaranteed through zero-knowledge
								architecture.
							</p>
							<ul className="space-y-2 text-sm">
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									No access to file contents
								</li>
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									No user tracking
								</li>
							</ul>
						</CardContent>
					</Card>

					<Card className="border-primary/20">
						<CardHeader>
							<CardTitle className="flex items-center gap-3">
								<Shield className="h-6 w-6 text-primary" />
								Virus Scanning
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground mb-4">
								All uploaded files are automatically scanned for viruses and
								malware using industry-leading antivirus engines.
							</p>
							<ul className="space-y-2 text-sm">
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									Real-time virus detection
								</li>
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									Multiple antivirus engines
								</li>
							</ul>
						</CardContent>
					</Card>

					<Card className="border-primary/20">
						<CardHeader>
							<CardTitle className="flex items-center gap-3">
								<Clock className="h-6 w-6 text-primary" />
								Ephemeral Files
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-muted-foreground mb-4">
								Files automatically self-destruct after download or expiry,
								ensuring no traces are left behind on our servers.
							</p>
							<ul className="space-y-2 text-sm">
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									Automatic deletion
								</li>
								<li className="flex items-center gap-2">
									<CheckCircle className="h-4 w-4 text-green-500" />
									No data retention
								</li>
							</ul>
						</CardContent>
					</Card>
				</section>

				{/* Technical Details */}
				<section className="mb-16">
					<h2 className="text-3xl font-bold mb-8 text-center">
						Technical Security Details
					</h2>
					<div className="grid md:grid-cols-3 gap-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Key className="h-5 w-5 text-primary" />
									Encryption
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2 text-sm">
									<li>• AES-256-GCM encryption</li>
									<li>• PBKDF2 key derivation</li>
									<li>• Random IV generation</li>
									<li>• Authenticated encryption</li>
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Server className="h-5 w-5 text-primary" />
									Infrastructure
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2 text-sm">
									<li>• TLS 1.3 encryption</li>
									<li>• HSTS headers</li>
									<li>• CSP protection</li>
									<li>• Rate limiting</li>
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Fingerprint className="h-5 w-5 text-primary" />
									Privacy
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2 text-sm">
									<li>• No cookies</li>
									<li>• No analytics</li>
									<li>• No fingerprinting</li>
									<li>• Anonymous sharing</li>
								</ul>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Security Comparison */}
				<section className="mb-16">
					<h2 className="text-3xl font-bold mb-8 text-center">
						Why Choose SilentParcel?
					</h2>
					<div className="overflow-x-auto">
						<table className="w-full border-collapse">
							<thead>
								<tr className="border-b border-border">
									<th className="text-left p-4 font-semibold">Feature</th>
									<th className="text-center p-4 font-semibold">SilentParcel</th>
									<th className="text-center p-4 font-semibold text-muted-foreground">
										Other Services
									</th>
								</tr>
							</thead>
							<tbody>
								<tr className="border-b border-border/50">
									<td className="p-4 font-medium">Registration Required</td>
									<td className="p-4 text-center">
										<CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
									</td>
									<td className="p-4 text-center">
										<AlertTriangle className="h-5 w-5 text-red-500 mx-auto" />
									</td>
								</tr>
								<tr className="border-b border-border/50">
									<td className="p-4 font-medium">End-to-End Encryption</td>
									<td className="p-4 text-center">
										<CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
									</td>
									<td className="p-4 text-center">
										<AlertTriangle className="h-5 w-5 text-red-500 mx-auto" />
									</td>
								</tr>
								<tr className="border-b border-border/50">
									<td className="p-4 font-medium">Virus Scanning</td>
									<td className="p-4 text-center">
										<CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
									</td>
									<td className="p-4 text-center">
										<AlertTriangle className="h-5 w-5 text-red-500 mx-auto" />
									</td>
								</tr>
								<tr className="border-b border-border/50">
									<td className="p-4 font-medium">Automatic Deletion</td>
									<td className="p-4 text-center">
										<CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
									</td>
									<td className="p-4 text-center">
										<AlertTriangle className="h-5 w-5 text-red-500 mx-auto" />
									</td>
								</tr>
								<tr>
									<td className="p-4 font-medium">Zero-Knowledge</td>
									<td className="p-4 text-center">
										<CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
									</td>
									<td className="p-4 text-center">
										<AlertTriangle className="h-5 w-5 text-red-500 mx-auto" />
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>

				{/* CTA Section */}
				<section className="text-center">
					<Card className="bg-primary/5 border-primary/20">
						<CardContent className="pt-8">
							<h2 className="text-2xl font-bold mb-4">
								Ready to Experience True Privacy?
							</h2>
							<p className="text-muted-foreground mb-6 max-w-md mx-auto">
								Join thousands of users who trust SilentParcel for their
								sensitive file sharing needs.
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<Link href="/files">
									<Button className="bg-primary hover:bg-primary/90">
										<FileText className="mr-2 h-4 w-4" />
										Start Sharing Securely
									</Button>
								</Link>
								<Link href="/">
									<Button variant="outline">
										<Globe className="mr-2 h-4 w-4" />
										Learn More
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				</section>
			</main>
		</div>
	);
} 