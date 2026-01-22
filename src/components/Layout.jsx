import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, MessageSquare, PlusCircle, LogOut, User, Menu, X, ShoppingBag, Sun, Moon } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarContent = ({ navItems, location, setIsMobileMenuOpen, unreadCount, toggleTheme, theme, currentUser, handleLogout }) => (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
                    M
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                    Mini Mart
                </span>
            </div>
            <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group ${isActive
                            ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r-full"
                            />
                        )}

                        <div className="relative">
                            <item.icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                            {item.name === 'Messages' && unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                            )}
                        </div>
                        <span className="font-medium">{item.name}</span>
                    </NavLink>
                );
            })}
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-gray-800 shadow-md overflow-hidden">
                    {currentUser?.photoURL ? (
                        <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        currentUser?.email?.[0].toUpperCase()
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {currentUser?.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        Online
                    </p>
                </div>
            </div>
            <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm font-medium"
            >
                <LogOut size={18} />
                Sign Out
            </button>
        </div>
    </div>
);

export default function Layout({ children }) {
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch {
            console.error("Failed to log out");
        }
    };

    // Calculate unread messages
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let totalUnread = 0;
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.unreadCounts && data.unreadCounts[currentUser.uid]) {
                    totalUnread += data.unreadCounts[currentUser.uid];
                }
            });
            setUnreadCount(totalUnread);
        });

        return unsubscribe;
    }, [currentUser]);

    const navItems = [
        { name: 'Browse', path: '/', icon: ShoppingBag },
        { name: 'Sell Item', path: '/create-listing', icon: PlusCircle },
        { name: 'Messages', path: '/chat', icon: MessageSquare },
        { name: 'Profile', path: '/profile', icon: User },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 flex transition-colors duration-300">
            {/* Desktop Sidebar */}
            <div className="hidden md:block w-64 h-screen sticky top-0 z-50">
                <SidebarContent
                    navItems={navItems}
                    location={location}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    unreadCount={unreadCount}
                    toggleTheme={toggleTheme}
                    theme={theme}
                    currentUser={currentUser}
                    handleLogout={handleLogout}
                />
            </div>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between transition-colors">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        M
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">Mini Mart</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg"
                    >
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                    </button>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg relative"
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        {!isMobileMenuOpen && unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="md:hidden fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-gray-900 z-50 shadow-2xl"
                        >
                            <SidebarContent
                                navItems={navItems}
                                location={location}
                                setIsMobileMenuOpen={setIsMobileMenuOpen}
                                unreadCount={unreadCount}
                                toggleTheme={toggleTheme}
                                theme={theme}
                                currentUser={currentUser}
                                handleLogout={handleLogout}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 min-w-0 md:p-8 p-4 pt-20 md:pt-8">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-6xl mx-auto"
                >
                    {children}
                </motion.div>
            </main>
        </div>
    );
}
