import "./globals.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@/providers/theme-provider";
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
			<body 
			// className={`${GeneralSans.className}`}
			>
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
