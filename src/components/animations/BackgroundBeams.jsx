import React from "react";
import { motion } from "framer-motion";

export const BackgroundBeams = ({ className = "" }) => {
    return (
        <div className={`absolute inset-0 z-0 opacity-30 pointer-events-none overflow-hidden ${className}`}>
            <svg
                className="h-full w-full"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
            >
                <motion.path
                    d="M0 500 Q 250 250 500 500 T 1000 500"
                    stroke="rgba(37, 99, 235, 0.2)"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                />
                <motion.path
                    d="M0 300 Q 250 550 500 300 T 1000 300"
                    stroke="rgba(147, 51, 234, 0.2)"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
                />
                <motion.path
                    d="M0 700 Q 250 450 500 700 T 1000 700"
                    stroke="rgba(59, 130, 246, 0.1)"
                    strokeWidth="2"
                    fill="none"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 5 }}
                />
            </svg>
        </div>
    );
};
