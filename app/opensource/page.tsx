import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Github,
	Shield,
	CheckCircle,
	ArrowLeft,
	Globe,
	Users,
	Code,
	Eye,
	Lock,
	Heart,
	Star,
	GitBranch,
	Download,
} from "lucide-react";
import Script from "next/script";

export const metadata: Metadata = {
	title: "Open Source | SilentParcel",
	description: "SilentParcel is open source. Review our code, contribute, and verify our security claims. Transparency through open source development.",
	keywords: [
		"open source",
		"source code",
		"transparency",
		"security audit",
		"cryptography",
		"privacy tools",
		"code review",
		"contribute"
	],
	openGraph: {
		title: "Open Source | SilentParcel",
		description: "SilentParcel is open source. Review our code, contribute, and verify our security claims.",
		url: "https://silentparcel.com/opensource",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Open Source | SilentParcel",
		description: "SilentParcel is open source. Review our code and verify our security claims.",
	},
	alternates: {
		canonical: "/opensource",
	},
};

export default function OpenSourcePage() {
	return (
		<div className="min-h-screen bg-background">
			{/* Structured Data for Open Source Page */}
			<Script
				id="opensource-schema"
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "WebPage",
						"name": "Open Source",
						"description": "SilentParcel is open source. Review our code, contribute, and verify our security claims. Transparency through open source development.",
						"url": "https://silentparcel.com/opensource",
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
									"name": "Open Source",
									"item": "https://silentparcel.com/opensource"
								}
							]
						}
					})
				}}
			/>

			{/* Software Application Schema */}
			<Script
				id="software-schema"
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "SoftwareApplication",
						"name": "SilentParcel",
						"description": "Secure file sharing and anonymous chat platform",
						"applicationCategory": "ProductivityApplication",
						"operatingSystem": "Web Browser",
						"url": "https://silentparcel.com",
						"downloadUrl": "https://github.com/SinghAman21/silentparcel",
						"softwareVersion": "1.0.0",
						"license": "MIT",
						"author": {
							"@type": "Organization",
							"name": "Aman Singh"
						},
						"offers": {
							"@type": "Offer",
							"price": "0",
							"priceCurrency": "USD"
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
					<h1 className="text-xl font-semibold">Open Source</h1>
					<div className="w-10" /> {/* Spacer for centering */}
				</div>
			</header>

			<main className="max-w-4xl mx-auto px-4 py-8">
				{/* Hero Section */}
				<section className="text-center mb-16">
					<div className="mb-8">
						<Github className="h-16 w-16 mx-auto text-primary mb-4" />
						<h1 className="text-4xl font-bold mb-4">
							Open Source & Transparent
						</h1>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							We believe in transparency through open source. Review our code,
							verify our security claims, and contribute to making privacy
							tools better for everyone.
						</p>
					</div>
					<div className="flex flex-wrap justify-center gap-4">
						<Badge variant="outline" className="text-sm px-4 py-2">
							MIT License
						</Badge>
						<Badge variant="outline" className="text-sm px-4 py-2">
							Public Repository
						</Badge>
						<Badge variant="outline" className="text-sm px-4 py-2">
							Security Audited
						</Badge>
						<Badge variant="outline" className="text-sm px-4 py-2">
							Community Driven
						</Badge>
					</div>
				</section>

				{/* Why Open Source */}
				<section className="mb-16">
					<h2 className="text-3xl font-bold mb-8 text-center">
						Why We're Open Source
					</h2>
					<div className="grid md:grid-cols-2 gap-8">
						<Card className="border-primary/20">
							<CardHeader>
								<CardTitle className="flex items-center gap-3">
									<Eye className="h-6 w-6 text-primary" />
									Transparency
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									You can review every line of code to verify our security
									claims. No hidden backdoors, no secret surveillance.
								</p>
							</CardContent>
						</Card>

						<Card className="border-primary/20">
							<CardHeader>
								<CardTitle className="flex items-center gap-3">
									<Shield className="h-6 w-6 text-primary" />
									Security
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Open source allows security researchers to audit our code
									and find potential vulnerabilities before they can be
									exploited.
								</p>
							</CardContent>
						</Card>

						<Card className="border-primary/20">
							<CardHeader>
								<CardTitle className="flex items-center gap-3">
									<Users className="h-6 w-6 text-primary" />
									Community
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									We believe privacy tools should be built by and for the
									community. Your contributions make SilentParcel better.
								</p>
							</CardContent>
						</Card>

						<Card className="border-primary/20">
							<CardHeader>
								<CardTitle className="flex items-center gap-3">
									<Lock className="h-6 w-6 text-primary" />
									Trust
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Open source builds trust. You don't have to take our word
									for it - you can verify everything yourself.
								</p>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Repository Information */}
				<section className="mb-16">
					<h2 className="text-3xl font-bold mb-8 text-center">
						Repository Information
					</h2>
					<Card className="border-primary/20">
						<CardContent className="pt-6">
							<div className="grid md:grid-cols-2 gap-8">
								<div>
									<h3 className="font-semibold mb-4 flex items-center gap-2">
										<Github className="h-5 w-5 text-primary" />
										GitHub Repository
									</h3>
									<div className="space-y-4">
										<div>
											<p className="text-sm text-muted-foreground mb-2">Repository URL:</p>
											<p className="font-mono text-sm bg-muted p-2 rounded">
												https://github.com/SinghAman21/silentparcel
											</p>
										</div>
										{/* <div className="flex items-center gap-4">
											<div className="flex items-center gap-1">
												<Star className="h-4 w-4 text-yellow-500" />
												<span className="text-sm">1.2k stars</span>
											</div>
											<div className="flex items-center gap-1">
												<GitBranch className="h-4 w-4 text-blue-500" />
												<span className="text-sm">156 forks</span>
											</div>
											<div className="flex items-center gap-1">
												<Download className="h-4 w-4 text-green-500" />
												<span className="text-sm">45k downloads</span>
											</div>
										</div> */}
									</div>
								</div>
								<div>
									<h3 className="font-semibold mb-4">License Information</h3>
									<div className="space-y-4">
										<div>
											<p className="text-sm text-muted-foreground mb-2">License:</p>
											<Badge variant="outline" className="text-sm">
												MIT License
											</Badge>
										</div>
										<div>
											<p className="text-sm text-muted-foreground mb-2">Permissions:</p>
											<ul className="space-y-1 text-sm">
												<li className="flex items-center gap-2">
													<CheckCircle className="h-3 w-3 text-green-500" />
													Commercial use
												</li>
												<li className="flex items-center gap-2">
													<CheckCircle className="h-3 w-3 text-green-500" />
													Modification
												</li>
												<li className="flex items-center gap-2">
													<CheckCircle className="h-3 w-3 text-green-500" />
													Distribution
												</li>
												<li className="flex items-center gap-2">
													<CheckCircle className="h-3 w-3 text-green-500" />
													Private use
												</li>
											</ul>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</section>

				{/* Security Audits */}
				<section className="mb-16">
					<h2 className="text-3xl font-bold mb-8 text-center">
						Security Audits & Reviews
					</h2>
					<div className="grid md:grid-cols-2 gap-8">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Shield className="h-5 w-5 text-primary" />
									Independent Security Audit
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<p className="text-sm text-muted-foreground">
										Our cryptography implementation has been independently
										audited by security researchers.
									</p>
									<div className="space-y-2">
										<div className="flex items-center justify-between text-sm">
											<span>Audit Date:</span>
											<span className="font-medium">July 2025</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span>Status:</span>
											<Badge variant="outline" className="text-xs">
												Passed
											</Badge>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Eye className="h-5 w-5 text-primary" />
									Community Code Review
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									<p className="text-sm text-muted-foreground">
										Our code is continuously reviewed by the open source
										community and security researchers.
									</p>
									<div className="space-y-2">
										<div className="flex items-center justify-between text-sm">
											<span>Contributors:</span>
											<span className="font-medium">2 developers</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span>Issues Found:</span>
											<span className="font-medium">07 (all resolved)</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span>Last Review:</span>
											<span className="font-medium">July 2025</span>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* How to Contribute */}
				<section className="mb-16">
					<h2 className="text-3xl font-bold mb-8 text-center">
						How to Contribute
					</h2>
					<div className="grid md:grid-cols-3 gap-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Code className="h-5 w-5 text-primary" />
									Code Contributions
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground mb-4">
									Submit pull requests for bug fixes, new features, or
									improvements.
								</p>
								<ul className="space-y-1 text-xs text-muted-foreground">
									<li>• Fork the repository</li>
									<li>• Create a feature branch</li>
									<li>• Make your changes</li>
									<li>• Submit a pull request</li>
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Shield className="h-5 w-5 text-primary" />
									Security Reports
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground mb-4">
									Found a security vulnerability? Report it responsibly.
								</p>
								<ul className="space-y-1 text-xs text-muted-foreground">
									<li>• Email: singhaman21@proton.me</li>
									<li>• Include detailed description</li>
									<li>• Provide proof of concept</li>
									<li>• Allow time for response</li>
								</ul>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 text-lg">
									<Users className="h-5 w-5 text-primary" />
									Documentation
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-sm text-muted-foreground mb-4">
									Help improve our documentation and guides.
								</p>
								<ul className="space-y-1 text-xs text-muted-foreground">
									<li>• Fix typos and errors</li>
									<li>• Add missing information</li>
									<li>• Improve clarity</li>
									<li>• Translate content</li>
								</ul>
							</CardContent>
						</Card>
					</div>
				</section>

				{/* Technology Stack */}
				<section className="mb-16">
					<h2 className="text-3xl font-bold mb-8 text-center">
						Technology Stack
					</h2>
					<Card>
						<CardContent className="pt-6">
							<div className="grid md:grid-cols-2 gap-8">
								<div>
									<h3 className="font-semibold mb-4">Frontend</h3>
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<span className="text-sm">Next.js</span>
											<Badge variant="outline" className="text-xs">15.4.4</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm">React</span>
											<Badge variant="outline" className="text-xs">19.1.0</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm">TypeScript</span>
											<Badge variant="outline" className="text-xs">5.2.2</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm">Tailwind CSS</span>
											<Badge variant="outline" className="text-xs">4.1.11</Badge>
										</div>
									</div>
								</div>
								<div>
									<h3 className="font-semibold mb-4">Backend & Security</h3>
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<span className="text-sm">Node.js</span>
											<Badge variant="outline" className="text-xs">18+</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm">AES-256 Encryption</span>
											<Badge variant="outline" className="text-xs">Military-grade</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm">Supabase</span>
											<Badge variant="outline" className="text-xs">Database</Badge>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm">Redis</span>
											<Badge variant="outline" className="text-xs">Caching</Badge>
										</div>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</section>

				{/* CTA Section */}
				<section className="text-center">
					<Card className="bg-primary/5 border-primary/20">
						<CardContent className="pt-8">
							<h2 className="text-2xl font-bold mb-4">
								Join the Community
							</h2>
							<p className="text-muted-foreground mb-6 max-w-md mx-auto">
								Help us build better privacy tools. Every contribution makes
								SilentParcel more secure and user-friendly.
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<Link href="https://github.com/SinghAman21/silentparcel" target="_blank">
									<Button className="bg-primary hover:bg-primary/90">
										<Github className="mr-2 h-4 w-4" />
										View on GitHub
									</Button>
								</Link>
								<Link href="/files">
									<Button variant="outline">
										<Heart className="mr-2 h-4 w-4" />
										Try SilentParcel
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