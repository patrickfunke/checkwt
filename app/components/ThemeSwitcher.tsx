"use client";

import { useState, useEffect } from "react";

export default function ThemeSwitcher() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
        const theme = localStorage.getItem("theme");
        if (theme === "dark") {
            setIsDarkMode(true);
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, []);

    useEffect(() => {
        if (hasMounted) {
            if (isDarkMode) {
                document.documentElement.classList.add("dark");
                localStorage.setItem("theme", "dark");
            } else {
                document.documentElement.classList.remove("dark");
                localStorage.setItem("theme", "light");
            }
        }
    }, [isDarkMode, hasMounted]);

    if (!hasMounted) {
        return null; // Avoid rendering until the client has mounted
    }

    return (
        <label className="inline-flex items-center cursor-pointer">
            <input
                type="checkbox"
                checked={isDarkMode}
                onChange={() => setIsDarkMode((prev) => !prev)}
                className="hidden"
            />
            <div className="w-10 h-6 flex items-center bg-gray-300 dark:bg-gray-100 rounded-full p-1">
                <div
                    className={`bg-white dark:bg-gray-900 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        isDarkMode ? "translate-x-4" : "translate-x-0"
                    }`}
                >
                    {isDarkMode ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 p-1">
                            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 p-1">
                            <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 2v1M12 21v1M4.22 4.22l.7.7M18.08 18.08l.7.7M2 12h1M21 12h1M4.22 19.78l.7-.7M18.08 5.92l.7-.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </div>
            </div>
        </label>
    );
}