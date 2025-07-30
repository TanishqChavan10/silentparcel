import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Shield,
	Eye,
	Lock,
	ArrowLeft,
	CheckCircle,
	FileText,
	Globe,
	Users,
	Clock,
	Trash2,
} from "lucide-react";
import Script from "next/script";

export const metadata: Metadata = {
	title: "Privacy Policy | SilentParcel",
	description: "Learn how SilentParcel protects your privacy with zero-knowledge architecture, no data collection, and complete anonymity.",
	keywords: [
		"privacy policy",
		"data protection",
		"zero-knowledge",
		"no tracking",
		"anonymous sharing",
		"privacy protection",
		"data privacy"
	],
	openGraph: {
		title: "Privacy Policy | SilentParcel",
		description: "Zero-knowledge architecture ensures your privacy is protected. No data collection, no tracking, complete anonymity.",
		url: "https://silentparcel.com/privacy",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Privacy Policy | SilentParcel",
		description: "Zero-knowledge architecture ensures your privacy is protected.",
	},
	alternates: {
		canonical: "/privacy",
	},
};

export default function PrivacyPage() {
	return (
		<div className="min-h-screen bg-background">
			{/* Structured Data for Privacy Page */}
			<Script
				id="privacy-schema"
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "WebPage",
						"name": "Privacy Policy",
						"description": "Learn how SilentParcel protects your privacy with zero-knowledge architecture, no data collection, and complete anonymity.",
						"url": "https://silentparcel.com/privacy",
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
									"name": "Privacy Policy",
									"item": "https://silentparcel.com/privacy"
								}
							]
						}
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
					<h1 className="text-xl font-semibold">Privacy Policy</h1>
					<div className="w-10" /> {/* Spacer for centering */}
				</div>
			</header>

			<main className="max-w-4xl mx-auto px-4 py-8">
				{/* Hero Section */}
				<section className="text-center mb-16">
					<div className="mb-8">
						<Eye className="h-16 w-16 mx-auto text-primary mb-4" />
						<h1 className="text-4xl font-bold mb-4">
							Your Privacy is Sacred
						</h1>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							We believe privacy is a fundamental human right. This policy
							explains how we protect yours.
						</p>
					</div>
					<div className="flex flex-wrap justify-center gap-4">
						<Badge variant="outline" className="text-sm px-4 py-2">
							Zero Data Collection
						</Badge>
						<Badge variant="outline" className="text-sm px-4 py-2">
							No Tracking
						</Badge>
						<Badge variant="outline" className="text-sm px-4 py-2">
							Anonymous Sharing
						</Badge>
						<Badge variant="outline" className="text-sm px-4 py-2">
							No Registration
						</Badge>
					</div>
				</section>

				{/* Privacy Principles */}
				<section className="mb-16">
					<h2 className="text-3xl font-bold mb-8 text-center">
						Our Privacy Principles
					</h2>
					<div className="grid md:grid-cols-2 gap-8">
						<Card className="border-primary/20">
							<CardHeader>
								<CardTitle className="flex items-center gap-3">
									<Lock className="h-6 w-6 text-primary" />
									Zero-Knowledge Architecture
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									We cannot see, access, or decrypt your files. They are
									encrypted in your browser before upload, and we have no
									ability to decrypt them.
								</p>
							</CardContent>
						</Card>

						<Card className="border-primary/20">
							<CardHeader>
								<CardTitle className="flex items-center gap-3">
									<Eye className="h-6 w-6 text-primary" />
									No Data Collection
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									We don't collect personal information, usage data, or any
									identifying information about our users.
								</p>
							</CardContent>
						</Card>

						<Card className="border-primary/20">
							<CardHeader>
								<CardTitle className="flex items-center gap-3">
									<Globe className="h-6 w-6 text-primary" />
									No Tracking
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									No cookies, no analytics, no fingerprinting. We don't track
									your activity or behavior.
								</p>
							</CardContent>
						</Card>

						<Card className="border-primary/20">
							<CardHeader>
								<CardTitle className="flex items-center gap-3">
									<Clock className="h-6 w-6 text-primary" />
									Ephemeral Data
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Files are automatically deleted after download or expiry.
									No traces are left behind.
								</p>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* What We Don't Collect */}
				<section className="mb-16">
					<h2 className="text-3xl font-bold mb-8 text-center">
						What We Don't Collect
					</h2>
					<Card className="border-destructive/20">
						<CardContent className="pt-6">
							<div className="grid md:grid-cols-2 gap-6">
								<div>
									<h3 className="font-semibold mb-4 text-destructive">
										Personal Information
									</h3>
									<ul className="space-y-2 text-sm text-muted-foreground">
										<li className="flex items-center gap-2">
											<CheckCircle className="h-4 w-4 text-green-500" />
											No names or email addresses
										</li>
										<li className="flex items-center gap-2">
											<CheckCircle className="h-4 w-4 text-green-500" />
											No phone numbers
										</li>
										<li className="flex items-center gap-2">
											<CheckCircle className="h-4 w-4 text-green-500" />
											No addresses
										</li>
										<li className="flex items-center gap-2">
											<CheckCircle className="h-4 w-4 text-green-500" />
											No account information
										</li>
									</ul>
								</div>
								<div>
									<h3 className="font-semibold mb-4 text-destructive">
										Usage Data
									</h3>
									<ul className="space-y-2 text-sm text-muted-foreground">
										<li className="flex items-center gap-2">
											<CheckCircle className="h-4 w-4 text-green-500" />
											No browsing history
										</li>
										<li className="flex items-center gap-2">
											<CheckCircle className="h-4 w-4 text-green-500" />
											No analytics or tracking
										</li>
										<li className="flex items-center gap-2">
											<CheckCircle className="h-4 w-4 text-green-500" />
											No device information
										</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
				</section>

				{/* What We Do Collect (Minimal) */}
				<section className="mb-16">
					<h2 className="text-3xl font-bold mb-8 text-center">
						What We Do Collect (Minimal)
					</h2>
					<Card className="border-primary/20">
						<CardContent className="pt-6">
							<div className="space-y-6">
								<div>
									<h3 className="font-semibold mb-4 text-primary">
										Technical Data (Temporary)
									</h3>
									<ul className="space-y-2 text-sm text-muted-foreground">
										<li>• File metadata (name, size, type) - encrypted and deleted after file expiry</li>
										<li>• Upload/download timestamps - deleted after file expiry</li>
										<li>• Virus scan results - deleted after file expiry</li>
									</ul>
								</div>
								<div>
									<h3 className="font-semibold mb-4 text-primary">
										Security Data
									</h3>
									<ul className="space-y-2 text-sm text-muted-foreground">
										<li>• Rate limiting data - automatically deleted after 24 hours</li>
										<li>• Security logs - automatically deleted after 7 days</li>
									</ul>
								</div>
							</div>
						</CardContent>
					</Card>
				</section>

				{/* Data Retention */}
				<section className="mb-16">
					<h2 className="text-3xl font-bold mb-8 text-center">
						Data Retention Policy
					</h2>
					<div className="grid md:grid-cols-3 gap-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<FileText className="h-5 w-5 text-primary" />
									Uploaded Files
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Files are automatically deleted after download or when they
									expire (default: 07 days). No exceptions.
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Clock className="h-5 w-5 text-primary" />
									Metadata
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									File metadata is deleted immediately after the file is
									deleted. No long-term storage.
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Trash2 className="h-5 w-5 text-primary" />
									Logs
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground">
									Security and access logs are automatically deleted after
									7 days maximum.
								</p>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Your Rights */}
				<section className="mb-16">
					<h2 className="text-3xl font-bold mb-8 text-center">
						Your Privacy Rights
					</h2>
					<div className="grid md:grid-cols-2 gap-8">
						<Card className="border-primary/20">
							<CardHeader>
								<CardTitle className="flex items-center gap-3">
									<Shield className="h-6 w-6 text-primary" />
									Right to Anonymity
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									You have the right to use our service completely anonymously.
									No registration or personal information required.
								</p>
							</CardContent>
						</Card>

						<Card className="border-primary/20">
							<CardHeader>
								<CardTitle className="flex items-center gap-3">
									<Eye className="h-6 w-6 text-primary" />
									Right to Deletion
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									All data is automatically deleted. You don't need to request
									deletion - it happens automatically.
								</p>
							</CardContent>
						</Card>

						<Card className="border-primary/20">
							<CardHeader>
								<CardTitle className="flex items-center gap-3">
									<Lock className="h-6 w-6 text-primary" />
									Right to Encryption
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									All your data is encrypted by default. You don't need to
									opt-in to encryption - it's always enabled.
								</p>
							</CardContent>
						</Card>

						<Card className="border-primary/20">
							<CardHeader>
								<CardTitle className="flex items-center gap-3">
									<Globe className="h-6 w-6 text-primary" />
									Right to Transparency
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Our code is open source. You can verify our privacy claims
									by reviewing the source code.
								</p>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Contact Information */}
				<section className="mb-16">
					<h2 className="text-3xl font-bold mb-8 text-center">
						Contact Us
					</h2>
					<Card className="bg-primary/5 border-primary/20">
						<CardContent className="pt-6">
							<div className="text-center">
								<p className="text-muted-foreground mb-4">
									If you have questions about this privacy policy or our
									privacy practices, please contact us:
								</p>
								<div className="space-y-2">
									<p className="font-medium">Email: privacy@silentparcel.com</p>
									<p className="text-sm text-muted-foreground">
										We typically respond within 24 hours.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</section>

				{/* Last Updated */}
				<section className="text-center">
					<p className="text-sm text-muted-foreground">
						Last updated: {new Date().toLocaleDateString('en-US', { 
							year: 'numeric', 
							month: 'long', 
							day: 'numeric' 
						})}
					</p>
				</section>
			</main>
		</div>
	);
} 