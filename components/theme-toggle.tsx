"use client";

import * as React from "react";
import { Moon, Sun, LoaderCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	const Icon = () => {
		if (!mounted) {
			return (
				<LoaderCircle
					className={cn(
						"h-[1.2rem] w-[1.2rem] animate-spin text-muted-foreground"
					)}
				/>
			);
		}

		return theme === "dark" ? (
			<Moon className="h-[1.2rem] w-[1.2rem] transition-all duration-300" />
		) : (
			<Sun className="h-[1.2rem] w-[1.2rem] transition-all duration-300" />
		);
	};

	return (
		<Button
			variant="outline"
			size="icon"
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
		>
			<Icon />
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
