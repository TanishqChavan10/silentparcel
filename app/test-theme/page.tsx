"use client";

import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme-toggle";

export default function TestThemePage() {
	const { theme, setTheme } = useTheme();

	return (
		<div className="min-h-screen bg-background text-foreground p-8">
			<div className="max-w-2xl mx-auto space-y-8">
				<h1 className="text-3xl font-bold">Theme System Test</h1>
				
				<div className="space-y-4">
					<h2 className="text-xl font-semibold">Current Theme State</h2>
					<div className="p-4 bg-card border rounded-lg">
						<p><strong>Theme:</strong> {theme}</p>
						<p><strong>Document Classes:</strong> {typeof document !== 'undefined' ? document.documentElement.className : 'system'}</p>
						<p><strong>Data Theme:</strong> {typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') : 'system'}</p>
						<p><strong>localStorage:</strong> {typeof window !== 'undefined' ? localStorage.getItem('theme') : 'system'}</p>
					</div>
				</div>

				<div className="space-y-4">
					<h2 className="text-xl font-semibold">Theme Controls</h2>
					<div className="flex gap-4">
						<Button onClick={() => setTheme('light')}>Set Light</Button>
						<Button onClick={() => setTheme('dark')}>Set Dark</Button>
						<ThemeToggle />
					</div>
				</div>

				<div className="space-y-4">
					<h2 className="text-xl font-semibold">Test Content</h2>
					<div className="p-6 bg-card border rounded-lg space-y-4">
						<p>This is a test paragraph to see if the theme is working.</p>
						<Button>Test Button</Button>
						<div className="h-20 bg-muted rounded flex items-center justify-center">
							Muted Background
						</div>
					</div>
				</div>

				<div className="space-y-4">
					<h2 className="text-xl font-semibold">Debug Info</h2>
					<div className="p-4 bg-card border rounded-lg text-sm">
						<p><strong>Window:</strong> {typeof window !== 'undefined' ? 'Available' : 'Not Available'}</p>
						<p><strong>Document:</strong> {typeof document !== 'undefined' ? 'Available' : 'Not Available'}</p>
						<p><strong>localStorage:</strong> {typeof localStorage !== 'undefined' ? 'Available' : 'Not Available'}</p>
						<p><strong>matchMedia:</strong> {typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? 'Available' : 'Not Available'}</p>
					</div>
				</div>
			</div>
		</div>
	);
} 