
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

export const FloatingDock = ({
    items,
    desktopClassName,
    mobileClassName,
}) => {
    return (
        <>
            <FloatingDockDesktop items={items} className={desktopClassName} />
            <FloatingDockMobile items={items} className={mobileClassName} />
        </>
    );
};

const FloatingDockMobile = ({
    items,
    className,
}) => {
    const [open, setOpen] = useState(false);
    return (
        <div className={`relative block md:hidden ${className}`}>
            <div className="absolute bottom-full mb-2 inset-x-0 w-full flex flex-col gap-2">
                {items.map((item, idx) => (
                    <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{
                            opacity: open ? 1 : 0,
                            y: open ? 0 : 10,
                        }}
                        transition={{
                            delay: idx * 0.05,
                        }}
                    >
                        <Link
                            to={item.href}
                            key={item.title}
                            className="h-10 w-10 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center border border-gray-200 dark:border-gray-800 shadow-md mx-auto"
                        >
                            <div className="text-gray-500 dark:text-gray-400">{item.icon}</div>
                        </Link>
                    </motion.div>
                ))}
            </div>
            <button
                onClick={() => setOpen(!open)}
                className="h-14 w-14 rounded-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 flex items-center justify-center shadow-lg"
            >
                <div className="text-gray-500 dark:text-gray-400">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`h-6 w-6 transition-transform ${open ? "rotate-45" : ""}`}
                    >
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                    </svg>
                </div>
            </button>
        </div>
    );
};

const FloatingDockDesktop = ({
    items,
    className,
}) => {
    let mouseX = useMotionValue(Infinity);
    return (
        <motion.div
            onMouseMove={(e) => mouseX.set(e.pageX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            className={`hidden md:flex h-16 gap-4 items-end rounded-2xl bg-gray-50 dark:bg-gray-900 px-4 pb-3 border border-gray-200 dark:border-gray-800 shadow-xl ${className}`}
        >
            {items.map((item) => (
                <IconContainer mouseX={mouseX} key={item.title} {...item} />
            ))}
        </motion.div>
    );
};

function IconContainer({
    mouseX,
    title,
    icon,
    href,
}) {
    let ref = useRef(null);

    let distance = useTransform(mouseX, (val) => {
        let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    let widthTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
    let heightTransform = useTransform(distance, [-150, 0, 150], [40, 80, 40]);

    let width = useSpring(widthTransform, {
        mass: 0.1,
        stiffness: 150,
        damping: 12,
    });
    let height = useSpring(heightTransform, {
        mass: 0.1,
        stiffness: 150,
        damping: 12,
    });

    return (
        <Link to={href}>
            <motion.div
                ref={ref}
                style={{ width, height }}
                className="aspect-square rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center relative group"
            >
                <div className="text-gray-500 dark:text-gray-400 h-5 w-5 group-hover:text-blue-500 transition-colors duration-300 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
                    {icon}
                </div>

                {/* Tooltip */}
                <motion.div
                    initial={{ opacity: 0, y: 10, x: "-50%" }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-0.5 whitespace-nowrap rounded-md bg-gray-800 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                >
                    {title}
                </motion.div>
            </motion.div>
        </Link>
    );
}
