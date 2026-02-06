import React from "react";
import { motion } from "framer-motion";

export const AuroraBackground = ({ className = "" }) => {
    return (
        <div className={`absolute inset-0 z-0 overflow-hidden pointer-events-none ${className}`}>
            <div
                className="absolute inset-0 opacity-50"
                style={{
                    background: `
            radial-gradient(circle at 50% 50%, #3b82f6 0%, transparent 50%),
            radial-gradient(circle at 100% 0%, #8b5cf6 0%, transparent 50%),
            radial-gradient(circle at 0% 100%, #1d4ed8 0%, transparent 50%)
          `,
                    filter: "blur(100px)",
                }}
            />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-inherit to-transparent" />
        </div>
    );
};
