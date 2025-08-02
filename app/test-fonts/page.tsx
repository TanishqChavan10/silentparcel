export default function TestFontsPage() {
	return (
		<div className="min-h-screen bg-background text-foreground p-8">
			<div className="max-w-4xl mx-auto space-y-8">
				<h1 className="text-4xl font-bold">Font Test Page</h1>
				
				<div className="space-y-6">
					<div>
						<h2 className="text-2xl font-semibold mb-4">Inter Variable Font (Sans-serif)</h2>
						<div className="space-y-2">
							<p className="text-xs">Extra Small (12px) - The quick brown fox jumps over the lazy dog</p>
							<p className="text-sm">Small (14px) - The quick brown fox jumps over the lazy dog</p>
							<p className="text-base">Base (16px) - The quick brown fox jumps over the lazy dog</p>
							<p className="text-lg">Large (18px) - The quick brown fox jumps over the lazy dog</p>
							<p className="text-xl">Extra Large (20px) - The quick brown fox jumps over the lazy dog</p>
							<p className="text-2xl">2XL (24px) - The quick brown fox jumps over the lazy dog</p>
							<p className="text-3xl">3XL (30px) - The quick brown fox jumps over the lazy dog</p>
							<p className="text-4xl">4XL (36px) - The quick brown fox jumps over the lazy dog</p>
						</div>
					</div>

					<div>
						<h2 className="text-2xl font-semibold mb-4">JetBrains Mono Font (Monospace)</h2>
						<div className="space-y-2 font-mono">
							<p className="text-xs">Extra Small (12px) - const hello = "world";</p>
							<p className="text-sm">Small (14px) - function test() return true;</p>
							<p className="text-base">Base (16px) - import React from 'react';</p>
							<p className="text-lg">Large (18px) - export default function App() {}</p>
							<p className="text-xl">Extra Large (20px) - console.log("Hello, World!");</p>
						</div>
					</div>

					<div>
						<h2 className="text-2xl font-semibold mb-4">Font Loading Status</h2>
						<div className="p-4 bg-card border rounded-lg space-y-2">
							<p><strong>CSS Variables:</strong></p>
							<p>--font-inter: {typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--font-inter') : 'N/A'}</p>
							<p>--font-jetbrains: {typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--font-jetbrains') : 'N/A'}</p>
							<p><strong>Font Family:</strong> {typeof window !== 'undefined' ? getComputedStyle(document.body).fontFamily : 'N/A'}</p>
						</div>
					</div>

					<div>
						<h2 className="text-2xl font-semibold mb-4">Font Feature Tests</h2>
						<div className="space-y-4">
							<div>
								<h3 className="text-lg font-medium mb-2">Inter Variable Features</h3>
								<p className="text-2xl" style={{ fontFeatureSettings: '"cv03" 1, "cv04" 1, "cv09" 1' }}>
									Inter Variable Font with Open Features: 1234567890
								</p>
							</div>
							<div>
								<h3 className="text-lg font-medium mb-2">JetBrains Mono Features</h3>
								<p className="text-2xl font-mono">
									JetBrains Mono: 1234567890 ABCDEFGHIJKLMNOPQRSTUVWXYZ
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
} 