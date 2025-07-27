"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";


export default function ThemeToggle() {
	const { theme, setTheme, resolvedTheme } = useTheme();
	const [mounted, setMounted] = React.useState(false);

	// Don't render until mounted to prevent hydration issues
	React.useEffect(() => {
		setMounted(true);
	}, []);

	// Handle theme cycling
	const handleThemeToggle = () => {
		if (theme === "light") {
			setTheme("dark");
		} else if (theme === "dark") {
			setTheme("system");
		} else {
			setTheme("light");
		}
	};

	if (!mounted) {
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
			onClick={handleThemeToggle}
			className="rounded-full cursor-pointer transition-colors duration-300 relative overflow-hidden"
			aria-label="Toggle theme"
		>
			<div className="relative w-full h-full flex items-center justify-center">
				{/* Light Theme Icon */}
				<Sun 
					className={`h-[1.2rem] w-[1.2rem] transition-all duration-500 ease-in-out absolute ${
						theme === "light" 
							? "opacity-100 scale-100 rotate-0" 
							: "opacity-0 scale-75 -rotate-90"
					}`} 
				/>
				
				{/* Dark Theme Icon */}
				<Moon 
					className={`h-[1.2rem] w-[1.2rem] transition-all duration-500 ease-in-out absolute ${
						theme === "dark" 
							? "opacity-100 scale-100 rotate-0" 
							: "opacity-0 scale-75 rotate-90"
					}`} 
				/>
				
				{/* System Theme Icon */}
				<Monitor 
					className={`h-[1.2rem] w-[1.2rem] transition-all duration-500 ease-in-out absolute ${
						theme === "system" 
							? "opacity-100 scale-100 rotate-0" 
							: "opacity-0 scale-75 rotate-180"
					}`} 
				/>
			</div>
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
