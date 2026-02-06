
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

const SidebarContext = createContext(undefined);

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
};

export const SidebarProvider = ({
    children,
    open: openProp,
    setOpen: setOpenProp,
    animate = true,
}) => {
    const [openState, setOpenState] = useState(false);
    const open = openProp !== undefined ? openProp : openState;
    const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

    return (
        <SidebarContext.Provider value={{ open, setOpen, animate }}>
            {children}
        </SidebarContext.Provider>
    );
};

export const Sidebar = ({
    children,
    open,
    setOpen,
    animate,
}) => {
    return (
        <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
            {children}
        </SidebarProvider>
    );
};

export const SidebarBody = (props) => {
    return (
        <>
            <DesktopSidebar {...props} />
            <MobileSidebar {...props} />
        </>
    );
};

export const DesktopSidebar = ({
    className,
    children,
    ...props
}) => {
    const { open, setOpen, animate } = useSidebar();
    return (
        <motion.div
            className={`fixed left-0 top-0 h-screen px-3 py-6 hidden md:flex md:flex-col backdrop-blur-2xl bg-gradient-to-b from-white/10 via-white/5 to-transparent flex-shrink-0 border-r border-white/20 overflow-hidden z-50 ${className}`}
            style={{
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
            }}
            initial={{ width: "80px" }}
            animate={{
                width: open ? "300px" : "80px",
            }}
            transition={{
                duration: 0.3,
                ease: "easeInOut"
            }}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            {...props}
        >
            {/* Gradient overlay for extra depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {children}
            </div>
        </motion.div>
    );
};

export const MobileSidebar = ({
    className,
    children,
    ...props
}) => {
    const { open, setOpen } = useSidebar();
    return (
        <div
            className={`h-16 px-6 py-4 flex flex-row md:hidden items-center justify-between backdrop-blur-xl bg-white/10 w-full border-b border-white/20 ${className}`}
            {...props}
        >
            <div className="flex justify-end z-20 w-full">
                <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Menu
                        className="text-white cursor-pointer"
                        onClick={() => setOpen(!open)}
                        size={24}
                    />
                </motion.div>
            </div>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ x: "-100%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "-100%", opacity: 0 }}
                        transition={{
                            duration: 0.3,
                            ease: "easeInOut",
                        }}
                        className="fixed h-full w-full inset-0 backdrop-blur-2xl bg-gradient-to-br from-black/95 via-black/90 to-black/95 p-10 z-[100] flex flex-col justify-between border-r border-white/10"
                        style={{
                            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div
                            className="absolute right-10 top-10 z-50 text-white/80 cursor-pointer hover:text-white transition-colors"
                            onClick={() => setOpen(!open)}
                        >
                            <X size={28} />
                        </div>
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const SidebarLink = ({
    link,
    className,
    ...props
}) => {
    const { open, animate } = useSidebar();
    const Component = link.onClick ? "button" : Link;
    const componentProps = link.onClick ? { onClick: link.onClick } : { to: link.href };

    return (
        <Component
            {...componentProps}
            className={`flex items-center ${open ? 'justify-start' : 'justify-center'} gap-4 group/sidebar py-3 px-2 rounded-xl transition-all duration-300 hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-white/20 hover:shadow-lg hover:shadow-blue-500/10 relative overflow-hidden ${className}`}
            {...props}
        >
            {/* Hover gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300" />

            <div className="flex-shrink-0 text-white/70 group-hover/sidebar:text-blue-400 transition-all duration-300 relative z-10 group-hover/sidebar:scale-110">
                {link.icon}
            </div>

            <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{
                    opacity: open ? 1 : 0,
                    width: open ? "auto" : 0,
                }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="text-white/90 text-sm group-hover/sidebar:text-white transition-colors duration-300 font-medium whitespace-nowrap overflow-hidden relative z-10"
            >
                {link.label}
            </motion.span>
        </Component>
    );
};
