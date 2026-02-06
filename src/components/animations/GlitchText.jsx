import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";

export const GlitchText = ({ text, className = "" }) => {
    const [displayText, setDisplayText] = useState(text);
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";

    useEffect(() => {
        let iteration = 0;
        const interval = setInterval(() => {
            setDisplayText((prev) =>
                text
                    .split("")
                    .map((char, index) => {
                        if (index < iteration) {
                            return text[index];
                        }
                        return characters[Math.floor(Math.random() * characters.length)];
                    })
                    .join("")
            );

            if (iteration >= text.length) {
                clearInterval(interval);
            }

            iteration += 1 / 3;
        }, 30);

        return () => clearInterval(interval);
    }, [text]);

    return (
        <motion.span
            className={`inline-block font-mono ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            {displayText}
        </motion.span>
    );
};
