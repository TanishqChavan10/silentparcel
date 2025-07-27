"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	const handleThemeToggle = () => {
		if (theme === "light") {
			setTheme("dark");
		} else if (theme === "dark") {
			setTheme("system");
		} else {
			setTheme("light");
		}
	};

	return (
		<Button
			variant="outline"
			size="icon"
			onClick={handleThemeToggle}
			aria-label="Toggle theme"
			className="rounded-full relative transition-colors duration-300"
		>
			{mounted && (
				<>
					<Sun
						className={`h-[1.2rem] w-[1.2rem] absolute transition-all duration-500 ease-in-out ${
							theme === "light"
								? "opacity-100 scale-100 rotate-0"
								: "opacity-0 scale-75 -rotate-90"
						}`}
					/>

					<Moon
						className={`h-[1.2rem] w-[1.2rem] absolute transition-all duration-500 ease-in-out ${
							theme === "dark"
								? "opacity-100 scale-100 rotate-0"
								: "opacity-0 scale-75 rotate-90"
						}`}
					/>

					<Monitor
						className={`h-[1.2rem] w-[1.2rem] absolute transition-all duration-500 ease-in-out ${
							theme === "system"
								? "opacity-100 scale-100 rotate-0"
								: "opacity-0 scale-75 rotate-180"
						}`}
					/>
				</>
			)}
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
