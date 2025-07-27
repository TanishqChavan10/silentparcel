"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";

import { Button } from "@/components/ui/button";


export default function ThemeToggle() {
	const { setTheme } = useTheme();

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
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon">
					<Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
					<Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => setTheme("light")}>
					Light
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("dark")}>
					Dark
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("system")}>
					System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
