"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

import { getCookie, setCookie } from 'cookies-next';

export enum ColorMode {
    LIGHT = 'light',
    DARK = 'dark',
}

interface ColorModeContextType {
    mode: ColorMode;
    setMode: (mode: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
    mode: ColorMode.LIGHT,
    setMode: () => {},
});

export const ColorModeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    const [mode, setMode] = useState<ColorMode>(ColorMode.LIGHT); // Start with light to match server

    // Only run this once on mount to set the initial mode
    useEffect(() => {
        const savedTheme = getCookie('theme');
        if (savedTheme) {
            setMode(savedTheme === 'dark' ? ColorMode.DARK : ColorMode.LIGHT);
        } else if (typeof window !== 'undefined') {
            // If no saved theme, use system preference
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setMode(systemDark ? ColorMode.DARK : ColorMode.LIGHT);
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        
        if (mode === ColorMode.DARK) {
            document.documentElement.classList.add('dark');
            setCookie('theme', ColorMode.DARK);
        } else {
            document.documentElement.classList.remove('dark');
            setCookie('theme', ColorMode.LIGHT);
        }
    }, [mode, mounted]);

    // Avoid hydration mismatch by not rendering anything until mounted
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ColorModeContext.Provider value={{ mode, setMode }}>
            {children}
        </ColorModeContext.Provider>
    );
};

export const useColorMode = () => useContext(ColorModeContext);