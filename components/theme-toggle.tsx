"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";

import { Button } from "@/components/ui/button";


export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	const toggleTheme = () => {
		try {
			console.log("Current theme:", theme);
			const newTheme = theme === "dark" ? "light" : "dark";
			setTheme(newTheme);
			console.log("Switched to theme:", newTheme);
		} catch (error) {
			console.error("Failed to toggle theme:", error);
		}
	};

	// Don't render until mounted to prevent hydration issues
	if (typeof window === "undefined") {
		return (
			<Button
				variant="outline"
				size="icon"
				className="rounded-full cursor-pointer transition-colors duration-300"
				aria-label="Toggle theme"
			>
				<Sun className="h-[1.2rem] w-[1.2rem] transition-all duration-300 ease-in-out" />
				<span className="sr-only">Toggle theme</span>
			</Button>
		);
	}

	return (
		<Button
			variant="outline"
			size="icon"
			onClick={toggleTheme}
			className="rounded-full cursor-pointer transition-colors duration-300"
			aria-label="Toggle theme"
		>
			{theme === "dark" ? (
				<Moon className="h-[1.2rem] w-[1.2rem] transition-all duration-300 ease-in-out" />
			) : (
				<Sun className="h-[1.2rem] w-[1.2rem] transition-all duration-300 ease-in-out" />
			)}
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
