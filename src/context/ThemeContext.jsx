import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const { currentUser } = useAuth();
    const [theme, setTheme] = useState('light');

    // Load initial theme and sync with Firestore
    useEffect(() => {
        if (currentUser?.theme) {
            setTheme(currentUser.theme);
        } else {
            // Default to system preference
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            setTheme(systemTheme);
        }
    }, [currentUser?.theme]);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            document.body.classList.add('dark');
        } else {
            root.classList.remove('dark');
            document.body.classList.remove('dark');
        }
    }, [theme]);


    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);

        // Persist to Firestore if user is logged in
        if (currentUser?.uid) {
            try {
                await updateDoc(doc(db, "users", currentUser.uid), {
                    theme: newTheme
                });
            } catch (error) {
                console.error("Error saving theme preference:", error);
            }
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
