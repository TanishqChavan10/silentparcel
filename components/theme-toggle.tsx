"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<Button
			variant="outline"
			size="icon"
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			className="rounded-full cursor-pointer transition-colors duration-300"
			aria-label="Toggle theme"
		>
			<Sun className="h-[1.2rem] w-[1.2rem] transition-all duration-300 ease-in-out dark:scale-0 dark:-rotate-90" />
			<Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all duration-300 ease-in-out text-foreground dark:scale-100 dark:rotate-0" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
