import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";

export const EvervaultCard = ({ text, className = "" }) => {
    let mouseX = useMotionValue(0);
    let mouseY = useMotionValue(0);

    function onMouseMove({ currentTarget, clientX, clientY }) {
        let { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
    }

    const [randomString, setRandomString] = useState("");

    useEffect(() => {
        let str = "";
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+";
        for (let i = 0; i < 1500; i++) {
            str += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setRandomString(str);
    }, []);

    let maskImage = useMotionTemplate`radial-gradient(250px at ${mouseX}px ${mouseY}px, white, transparent)`;
    let style = { maskImage, WebkitMaskImage: maskImage };

    return (
        <div
            onMouseMove={onMouseMove}
            className={`group/card relative flex items-center justify-center h-full w-full overflow-hidden bg-transparent rounded-3xl border border-white/5 ${className}`}
        >
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-transparent [mask-image:radial-gradient(200px_at_50%_50%,white,transparent)]" />
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover/card:opacity-10 transition duration-500"
                    style={style}
                />
                <motion.div
                    className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition duration-500 text-[10px] text-blue-500/30 font-mono break-all leading-none select-none"
                    style={style}
                >
                    {randomString}
                </motion.div>
            </div>
            <div className="relative z-10 flex items-center justify-center">
                <div className="relative h-24 w-24 rounded-full flex items-center justify-center text-white font-bold text-4xl">
                    <div className="absolute w-full h-full bg-white/[0.05] blur-sm rounded-full" />
                    <span className="dark:text-white text-black z-20">{text}</span>
                </div>
            </div>
        </div>
    );
};
