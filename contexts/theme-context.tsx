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
};

const initialState: ThemeProviderState = {
	theme: "system",
	setTheme: () => null,
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
	storageKey = "ui-theme",
	...props
}: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(defaultTheme);
	const [mounted, setMounted] = useState(false);

	// Initialize theme on mount
	useEffect(() => {
		setMounted(true);
		const storedTheme = getStoredTheme(storageKey);
		if (storedTheme) {
			setTheme(storedTheme);
		}
	}, [storageKey]);

	// Apply theme to document
	useEffect(() => {
		if (!mounted) return;

		const root = window.document.documentElement;
		root.classList.remove("light", "dark");

		let themeToApply: "light" | "dark";

		if (theme === "system") {
			themeToApply = window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light";
		} else {
			themeToApply = theme as "light" | "dark";
		}

		root.classList.add(themeToApply);
		
		// Add data attribute for additional styling if needed
		root.setAttribute("data-theme", themeToApply);
		
		console.log("Applied theme:", themeToApply, "from:", theme);
	}, [theme, mounted]);

	const value = {
		theme,
		setTheme: (newTheme: Theme) => {
			setStoredTheme(storageKey, newTheme);
			setTheme(newTheme);
		},
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
