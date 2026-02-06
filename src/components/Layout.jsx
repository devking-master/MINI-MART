import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, MessageSquare, PlusCircle, User, Moon, Sun, LogOut, Menu, X, Bell, LayoutGrid, ArrowRight } from 'lucide-react';
import Footer from './Footer';

export default function Layout({ children }) {
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Handle scroll for glassmorphism
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch {
            console.error("Failed to log out");
        }
    };

    // Message Notifications State
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeToast, setActiveToast] = useState(null);
    const prevChatsRef = React.useRef({});

    // Request browser notification permission
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let totalUnread = 0;
            const currentChats = {};

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const chatId = doc.id;
                currentChats[chatId] = data;

                if (data.unreadCounts && data.unreadCounts[currentUser.uid]) {
                    const count = data.unreadCounts[currentUser.uid];
                    totalUnread += count;

                    // Detect new message arrival
                    const prevData = prevChatsRef.current[chatId];
                    const prevCount = prevData?.unreadCounts?.[currentUser.uid] || 0;

                    // If unread count increased and we aren't currently in this chat
                    if (count > prevCount && location.pathname !== '/chat') {
                        const senderName = data.participantNames[1 - data.participants.indexOf(currentUser.uid)];
                        const messageText = data.lastMessage || "Sent you a message";
                        const senderPhoto = data.participantPhotos[1 - data.participants.indexOf(currentUser.uid)];

                        // Browser Notification
                        if (document.visibilityState !== 'visible' && Notification.permission === "granted") {
                            new Notification(`New Message from ${senderName}`, {
                                body: messageText,
                                icon: senderPhoto || '/vite.svg'
                            });
                        }

                        // In-App Toast
                        setActiveToast({
                            id: Date.now(),
                            senderName,
                            messageText,
                            senderPhoto,
                            chatId
                        });

                        // Auto-hide toast after 5 seconds
                        setTimeout(() => setActiveToast(null), 5000);
                    }
                }
            });

            setUnreadCount(totalUnread);
            prevChatsRef.current = currentChats;
        });

        return unsubscribe;
    }, [currentUser, location.pathname]);

    const adminEmails = ['oluwaseyioluwatobi77@gmail.com'];
    const isAdmin = currentUser && adminEmails.includes(currentUser.email);

    const navItems = [
        { name: 'Browse', path: '/', icon: ShoppingBag },
        { name: 'Sell', path: '/create-listing', icon: PlusCircle },
        { name: 'Messages', path: '/chat', icon: MessageSquare },
        { name: 'Profile', path: '/profile', icon: User },
        ...(isAdmin ? [{ name: 'Admin', path: '/admin', icon: LayoutGrid }] : []),
    ];



    const isHome = location.pathname === '/';

    return (
        <div className={`bg-white dark:bg-[#0a0a0b] flex flex-col transition-all duration-500 ${location.pathname === '/chat' ? 'h-screen overflow-hidden' : 'min-h-screen'
            }`}>
            {/* --- PREMIUM TOP NAVIGATION --- */}
            <nav
                className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled
                    ? 'py-2.5 bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50 shadow-lg'
                    : 'py-5 bg-transparent'
                    }`}
            >
                <div className="max-w-[1600px] mx-auto px-6 md:px-12 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group z-10 flex-shrink-0">
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-[0_8px_20px_-4px_rgba(37,99,235,0.4)]"
                        >
                            M
                        </motion.div>
                        <AnimatePresence>
                            {!scrolled && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className={`text-2xl font-black tracking-tighter transition-colors ${isHome && !scrolled
                                        ? (theme === 'dark' ? 'text-white' : 'text-blue-950')
                                        : 'text-gray-900 dark:text-white'
                                        }`}
                                >
                                    Mini Mart.
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>

                    {/* Desktop Nav Items */}
                    <div className="hidden lg:flex items-center gap-6">
                        <div className="flex items-center gap-2 bg-gray-100/50 dark:bg-gray-800/30 p-1.5 rounded-[1.5rem] backdrop-blur-md border border-gray-200/20 dark:border-gray-700/20">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${isActive
                                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-white shadow-md ring-1 ring-black/5'
                                            : (isHome && !scrolled
                                                ? (theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-blue-900/70 hover:text-blue-950')
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white')
                                            }`}
                                    >
                                        <div className="relative">
                                            <item.icon size={16} className={isActive ? 'stroke-[2px]' : 'stroke-2'} />
                                            {item.name === 'Messages' && unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                </span>
                                            )}
                                        </div>
                                        {item.name}
                                    </NavLink>
                                );
                            })}
                        </div>


                    </div>

                    {/* Right Section: Theme + Profile + Logout */}
                    <div className="hidden lg:flex items-center gap-4 z-10">
                        <button
                            onClick={toggleTheme}
                            className={`p-3 rounded-2xl transition-all duration-300 border ${!scrolled && isHome
                                ? (theme === 'dark'
                                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                    : 'bg-blue-900/10 border-blue-900/20 text-blue-950 hover:bg-blue-900/20')
                                : 'bg-gray-50 dark:bg-gray-900 border-gray-200/50 dark:border-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>

                        {currentUser && (
                            <div className="flex items-center gap-3 pl-4 border-l border-gray-200/50 dark:border-gray-800/50">
                                <Link to="/profile" className="flex items-center gap-3 group">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-gray-800 shadow-lg group-hover:scale-110 transition-transform overflow-hidden">
                                        {currentUser?.photoURL ? (
                                            <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            currentUser?.email?.[0].toUpperCase()
                                        )}
                                    </div>
                                    <div className="text-left hidden xl:block">
                                        <p className={`text-sm font-black transition-colors ${isHome && !scrolled
                                            ? (theme === 'dark' ? 'text-white' : 'text-blue-950')
                                            : 'text-gray-900 dark:text-white'
                                            }`}>
                                            {currentUser?.email?.split('@')[0]}
                                        </p>
                                        <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Premium</p>
                                    </div>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className={`p-3 rounded-2xl transition-all duration-300 border ${!scrolled && isHome
                                        ? (theme === 'dark'
                                            ? 'bg-red-500/10 border-red-500/20 text-red-100 hover:bg-red-500/20'
                                            : 'bg-red-600/10 border-red-600/20 text-red-700 hover:bg-red-600/20')
                                        : 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30'
                                        }`}
                                    title="Sign Out"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Only: Menu Toggle */}
                    <div className="lg:hidden flex items-center gap-3">
                        <button
                            onClick={toggleTheme}
                            className={`p-2.5 rounded-xl border transition-all duration-300 ${!scrolled && isHome
                                ? (theme === 'dark'
                                    ? 'bg-white/10 border-white/20 text-white'
                                    : 'bg-blue-900/10 border-blue-900/20 text-blue-950')
                                : 'bg-gray-50 dark:bg-gray-900 border-gray-200/50 dark:border-gray-800/50 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`p-2.5 rounded-xl border transition-all duration-300 ${!scrolled && isHome
                                ? (theme === 'dark'
                                    ? 'bg-white/10 border-white/20 text-white'
                                    : 'bg-blue-900/10 border-blue-900/20 text-blue-950')
                                : 'bg-gray-50 dark:bg-gray-900 border-gray-200/50 dark:border-gray-800/50 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* In-App Notification Toast */}
            <AnimatePresence>
                {activeToast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        onClick={() => {
                            navigate('/chat');
                            setActiveToast(null);
                        }}
                        className="fixed top-24 right-6 z-[200] max-w-sm w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-4 flex items-center gap-4 cursor-pointer hover:border-blue-500/50 transition-all border-l-4 border-l-blue-600 group"
                    >
                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                            {activeToast.senderPhoto ? (
                                <img src={activeToast.senderPhoto} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">
                                    {activeToast.senderName[0]}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">New Message</p>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm leading-none mb-1">{activeToast.senderName}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">{activeToast.messageText}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all">
                            <ArrowRight size={14} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-[150]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="lg:hidden fixed inset-y-0 right-0 w-[300px] bg-white dark:bg-[#0a0a0b] z-[200] p-8 shadow-2xl flex flex-col"
                        >
                            <div className="flex items-center gap-3 mb-12">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">M</div>
                                <span className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">Mini Mart.</span>
                            </div>

                            <div className="flex-1 space-y-4">
                                {navItems.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={({ isActive }) => `flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${isActive
                                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30'
                                            : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                                            }`}
                                    >
                                        <item.icon size={20} />
                                        {item.name}
                                        {item.name === 'Messages' && unreadCount > 0 && (
                                            <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{unreadCount}</span>
                                        )}
                                    </NavLink>
                                ))}
                            </div>

                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-red-50 dark:bg-red-900/10 text-red-600 font-bold transition-all"
                            >
                                <LogOut size={20} />
                                Sign Out
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col pt-0">
                <div className="flex-1">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        {children}
                    </motion.div>
                </div>

                {/* Global Footer - Hidden on Chat page for app-like fee */}
                {location.pathname !== '/chat' && <Footer />}
            </main>
        </div>
    );
}
