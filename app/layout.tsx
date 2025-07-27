import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/providers/theme-provider";
import localFont from "next/font/local";

export const metadata: Metadata = {
	title: "SilentParcel - Privacy-Focused File Sharing & Anonymous Chat",
	description:
		"Share files securely and chat anonymously with ephemeral rooms. No registration required.",
};
const Inter = localFont({
	src: [
		{ path: "fonts/InterVariable.woff2", style: "normal" },
		{
			path: "fonts/InterVariable-Italic.woff2",
			style: "italic",
		},
	],
	display: "swap",
	preload: true,
	variable: "--font-inter",
});

const JetbrainsMono = localFont({
	src: "fonts/JetBrainsMonoVariable.woff2",
	display: "swap",
	variable: "--font-jetbrains",
	preload: true,
});

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${Inter.variable} ${JetbrainsMono.variable}`}>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
