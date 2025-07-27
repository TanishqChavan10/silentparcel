import "./globals.css";
import type { Metadata } from "next";
// import { ThemeProvider } from "@/providers/theme-provider";
import { ThemeProvider } from "@/contexts/theme-context";
import localFont from "next/font/local";

// Metadata"
export const metadata: Metadata = {
	title: "SilentParcel - Privacy-Focused File Sharing & Anonymous Chat",
	description:
		"Share files securely and chat anonymously with ephemeral rooms. No registration required.",
};
// const GeneralSans = localFont({
// 	src: [
// 		{ path: "fonts/GeneralSans/GeneralSans-Variable.woff2", style: "normal" },
// 		{
// 			path: "fonts/GeneralSans/GeneralSans-VariableItalic.woff2",
// 			style: "italic",
// 		},
// 	],
// 	display: "swap",
// 	preload: true,
// });

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script
					dangerouslySetInnerHTML={{
						__html: `
							(function() {
								try {
									var theme = localStorage.getItem('ui-theme');
									var systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
									var finalTheme = theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : systemTheme;
									document.documentElement.classList.add(finalTheme);
									document.documentElement.setAttribute('data-theme', finalTheme);
								} catch (e) {
									console.warn('Theme initialization failed:', e);
								}
							})();
						`,
					}}
				/>
			</head>
			<body 
			// className={`${GeneralSans.className}`}
			>
				<ThemeProvider
					defaultTheme="system"
					storageKey="ui-theme"
				>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
