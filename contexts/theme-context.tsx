"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	resolvedTheme: "light" | "dark";
	systemTheme: "light" | "dark";
};

const initialState: ThemeProviderState = {
	theme: "system",
	setTheme: () => null,
	resolvedTheme: "light",
	systemTheme: "light",
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

// Safe localStorage access
const getStoredTheme = (key: string): Theme | null => {
	if (typeof window === "undefined") return null;
	try {
		const stored = localStorage.getItem(key);
		return stored as Theme;
	} catch (error) {
		console.warn("Failed to read theme from localStorage:", error);
		return null;
	}
};

const setStoredTheme = (key: string, theme: Theme): void => {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(key, theme);
	} catch (error) {
		console.warn("Failed to save theme to localStorage:", error);
	}
};

export function ThemeProvider({
	children,
	defaultTheme = "dark",
	storageKey = "theme",
	...props
}: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(defaultTheme);
	const [mounted, setMounted] = useState(false);
	const [systemTheme, setSystemTheme] = useState<"light" | "dark">("dark");

	// Initialize theme on mount
	useEffect(() => {
		setMounted(true);
		const storedTheme = getStoredTheme(storageKey);
		if (storedTheme) {
			setTheme(storedTheme);
		}
	}, [storageKey]);

	// Track system theme changes
	useEffect(() => {
		if (typeof window === "undefined") return;

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		setSystemTheme(mediaQuery.matches ? "dark" : "light");

		const handleChange = (e: MediaQueryListEvent) => {
			setSystemTheme(e.matches ? "dark" : "light");
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	// Apply theme to document
	useEffect(() => {
		if (!mounted) return;

		const root = window.document.documentElement;
		root.classList.remove("light", "dark");

		let themeToApply: "light" | "dark";

		if (theme === "system") {
			themeToApply = systemTheme;
		} else {
			themeToApply = theme as "light" | "dark";
		}

		root.classList.add(themeToApply);
		
		// Add data attribute for additional styling if needed
		root.setAttribute("data-theme", themeToApply);
		
		console.log("Applied theme:", themeToApply, "from:", theme);
	}, [theme, mounted, systemTheme]);

	// Calculate resolved theme
	const resolvedTheme = theme === "system" ? systemTheme : theme as "light" | "dark";

	const value = {
		theme,
		setTheme: (newTheme: Theme) => {
			setStoredTheme(storageKey, newTheme);
			setTheme(newTheme);
		},
		resolvedTheme,
		systemTheme,
	};

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined)
		throw new Error("useTheme must be used within a ThemeProvider");

	return context;
};
