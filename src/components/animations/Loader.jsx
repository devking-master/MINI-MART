
import { cn } from "../../lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";

const LoaderCore = ({
    loadingStates,
    value = 0,
}) => {
    return (
        <div className="flex relative max-w-xl mx-auto flex-col mt-40">
            {loadingStates.map((loadingState, index) => {
                const distance = Math.abs(index - value);
                const opacity = Math.max(1 - distance * 0.2, 0); // Fade out distant states

                return (
                    <motion.div
                        key={index}
                        className={cn("text-left flex gap-2 mb-4")}
                        initial={{ opacity: 0, y: -(value * 40) }}
                        animate={{ opacity: opacity, y: -(value * 40) }}
                        transition={{ duration: 0.5 }}
                    >
                        <div>
                            {index > value && (
                                <div className="border border-neutral-200 dark:border-neutral-800 rounded-full w-5 h-5" />
                            )}
                            {index <= value && (
                                <div
                                    className={cn(
                                        "border border-neutral-200 dark:border-neutral-800 rounded-full w-5 h-5",
                                        index === value &&
                                        "bg-blue-500 border-blue-500 shadow-md shadow-blue-500/20"
                                    )}
                                />
                            )}
                        </div>
                        <span
                            className={cn(
                                "text-black dark:text-white text-sm font-medium",
                                index === value && "text-blue-500 font-bold"
                            )}
                        >
                            {loadingState.text}
                        </span>
                    </motion.div>
                );
            })}
        </div>
    );
};

export const MultiStepLoader = ({
    loadingStates,
    loading,
    duration = 2000,
    loop = true,
}) => {
    const [currentState, setCurrentState] = useState(0);

    useEffect(() => {
        if (!loading) {
            setCurrentState(0);
            return;
        }
        const timeout = setTimeout(() => {
            setCurrentState((prevState) =>
                loop
                    ? (prevState + 1) % loadingStates.length
                    : Math.min(prevState + 1, loadingStates.length - 1)
            );
        }, duration);

        return () => clearTimeout(timeout);
    }, [currentState, loading, loop, loadingStates.length, duration]);

    return (
        <AnimatePresence mode="wait">
            {loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-3xl"
                >
                    <div className="h-96 relative">
                        <LoaderCore value={currentState} loadingStates={loadingStates} />
                    </div>
                    <div className="bg-gradient-to-t inset-x-0 z-20 bottom-0 bg-white dark:bg-black h-full absolute [mask-image:radial-gradient(900px_at_center,transparent_30%,white)]" />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
