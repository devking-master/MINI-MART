import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Package,
    Flame,
    BadgeCheck,
    Trash2,
    Search,
    ArrowLeft,
    LayoutDashboard,
    TrendingUp,
    ShieldAlert,
    RefreshCw,
    X,
    Filter,
    BarChart3,
    Settings,
    LogOut,
    Eye,
    CheckCircle2,
    Bell,
    Clock,
    DollarSign,
    Activity,
    Menu,
    ArrowUpRight,
    ShieldCheck
} from 'lucide-react';
import { Sidebar, SidebarBody, SidebarLink } from '../components/animations/Sidebar';
import { MultiStepLoader } from '../components/animations/Loader';

export default function Admin() {
    const { currentUser, logout } = useAuth();
    const [listings, setListings] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'inventory' | 'users' | 'summary' | 'logs' | 'ledger'
    const [stats, setStats] = useState({ total: 0, featured: 0, verified: 0, revenue: 0 });
    const [notifications, setNotifications] = useState([]);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    // SECURITY: Define Admin Emails
    const adminEmails = ['oluwaseyioluwatobi77@gmail.com'];
    const isAdmin = adminEmails.includes(currentUser?.email);

    useEffect(() => {
        if (!isAdmin) return;

        const qListings = query(collection(db, "listings"), orderBy("createdAt", "desc"));
        const qUsers = query(collection(db, "users"), orderBy("createdAt", "desc"));

        const unsubListings = onSnapshot(qListings, (snapshot) => {
            const listingsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setListings(listingsData);
            setStats(prev => ({ ...prev, total: listingsData.length, featured: listingsData.filter(l => l.isFeatured).length }));
            setLoading(false);
        });

        const unsubUsers = onSnapshot(qUsers, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                uid: doc.id,
                ...doc.data()
            }));
            setUsers(usersData);
            setStats(prev => ({ ...prev, verified: usersData.filter(u => u.isVerified).length }));
        });

        return () => {
            unsubListings();
            unsubUsers();
        };
    }, [isAdmin]);

    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        if (!isAdmin) return;

        const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const txData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(txData);
            const totalRevenue = txData.reduce((sum, tx) => sum + (tx.amount || 0), 0);
            setStats(prev => ({ ...prev, revenue: totalRevenue }));
        });

        return () => unsubscribe();
    }, [isAdmin]);

    const monthlyRevenue = React.useMemo(() => {
        const months = new Array(12).fill(0);
        const now = new Date();
        const currentYear = now.getFullYear();

        transactions.forEach(tx => {
            if (!tx.createdAt) return;
            const date = new Date(tx.createdAt.seconds * 1000);
            if (date.getFullYear() === currentYear) {
                const monthIndex = date.getMonth();
                months[monthIndex] += tx.amount || 0;
            }
        });

        const maxRev = Math.max(...months, 1000);
        return months.map(rev => (rev / maxRev) * 100);
    }, [transactions]);

    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    useEffect(() => {
        if (!isAdmin) return;

        const q = query(collection(db, "admin_notifications"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setNotifications(notifs);
        });

        return () => unsubscribe();
    }, [isAdmin]);

    if (!isAdmin) return <Navigate to="/" />;


    const loadingStates = [
        { text: "Verifying Admin Privileges..." },
        { text: "Syncing Market Inventory..." },
        { text: "Analysing Revenue Streams..." },
        { text: "Fetching User Data..." },
        { text: "Loading Dashboard..." },
    ];

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <MultiStepLoader loadingStates={loadingStates} loading={loading} duration={800} />
        </div>
    );

    const toggleFeatured = async (id, currentStatus) => {
        try {
            await updateDoc(doc(db, "listings", id), {
                isFeatured: !currentStatus
            });
        } catch (error) {
            console.error("Error updating featured status:", error);
        }
    };

    const toggleVerified = async (userId, currentStatus) => {
        try {
            await updateDoc(doc(db, "users", userId), {
                isVerified: !currentStatus
            });
        } catch (error) {
            console.error("Error updating verified status:", error);
        }
    };

    const markAsRead = async (notifId) => {
        try {
            await updateDoc(doc(db, "admin_notifications", notifId), {
                read: true
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const clearAllLogs = async () => {
        if (!window.confirm("Are you sure you want to clear all activity logs?")) return;
        try {
            const q = query(collection(db, "admin_notifications"));
            const snapshot = await getDocs(q);
            const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);
        } catch (error) {
            console.error("Error clearing logs:", error);
        }
    };

    const deleteListing = async (id) => {
        if (window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, "listings", id));
            } catch (error) {
                console.error("Error deleting listing:", error);
            }
        }
    };

    const filteredListings = listings;

    return (
        <div className="flex flex-col md:flex-row bg-[#050505] w-full min-h-screen overflow-hidden">
            <Sidebar open={mobileSidebarOpen} setOpen={setMobileSidebarOpen}>
                <SidebarBody className="justify-between gap-10">
                    <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                        <div className="flex items-center gap-3 mb-8 px-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0 shadow-lg shadow-blue-500/30">
                                M
                            </div>
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                className="font-black text-white tracking-tight text-xl whitespace-nowrap bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent overflow-hidden"
                            >
                                MINI MART
                            </motion.span>
                        </div>
                        <div className="flex flex-col gap-1">
                            {[
                                { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
                                { id: 'inventory', label: 'Inventory', icon: <Package size={20} /> },
                                { id: 'ledger', label: 'Monetization', icon: <DollarSign size={20} /> },
                                { id: 'users', label: 'User Verification', icon: <Users size={20} /> },
                                { id: 'logs', label: 'Activity Logs', icon: <Bell size={20} /> },
                            ].map((item) => (
                                <SidebarLink
                                    key={item.id}
                                    link={{
                                        label: item.label,
                                        icon: item.icon,
                                        onClick: () => setActiveTab(item.id)
                                    }}
                                    className={activeTab === item.id ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/30 shadow-lg shadow-blue-500/20" : ""}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <SidebarLink
                            link={{
                                label: "Exit Console",
                                href: "/",
                                icon: <ArrowLeft size={20} />
                            }}
                        />
                        <SidebarLink
                            link={{
                                label: "Logout",
                                onClick: logout,
                                icon: <LogOut size={20} />
                            }}
                            className="text-red-500 hover:text-red-400"
                        />
                    </div>
                </SidebarBody>
            </Sidebar>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 overflow-y-auto h-screen md:ml-[80px] p-6 md:p-10 relative z-10 custom-scrollbar">
                <div className="p-4 md:p-10">
                    <AnimatePresence mode="wait">
                        {activeTab === 'inventory' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                                    <div>
                                        <h3 className="text-3xl font-black tracking-tight">Market Inventory</h3>
                                        <p className="text-gray-500 text-sm font-medium">Manage and moderate platform listings</p>
                                    </div>
                                </div>

                                {/* Quick Stats Section */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                                    {[
                                        { label: "Market Volume", value: stats.total, icon: Package, color: "blue" },
                                        { label: "Featured Ads", value: stats.featured, icon: Flame, color: "orange" },
                                        { label: "Total Revenue", value: `₦${(stats.revenue || 0).toLocaleString()}`, icon: DollarSign, color: "green" },
                                        { label: "System Uptime", value: "99.9%", icon: ShieldAlert, color: "purple" },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-[#0a0a0b] border border-white/5 p-6 rounded-3xl group hover:border-blue-500/30 transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`p-2 rounded-lg bg-${stat.color}-500/10 text-${stat.color}-500`}>
                                                    <stat.icon size={20} />
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-bold">Live</div>
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</p>
                                            <h4 className="text-3xl font-black mt-1">{stat.value}</h4>
                                        </div>
                                    ))}
                                </div>

                                {/* Main Table - HIDDEN ON SMALLER SCREENS */}
                                <div className="hidden lg:block bg-[#0a0a0b] border border-white/5 rounded-[2.5rem] overflow-x-auto shadow-2xl">
                                    <table className="w-full min-w-[800px]">
                                        <thead>
                                            <tr className="bg-white/5 text-left border-b border-white/5">
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Listing Asset</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Provider Information</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Featured</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Verified</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Moderation</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredListings.map((l) => (
                                                <tr key={l.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0">
                                                                <img src={l.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-white leading-tight mb-1">{l.title}</p>
                                                                <p className="text-blue-500 font-black text-xs uppercase tracking-tighter">₦{(l.price || 0).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-sm font-bold text-white">{l.userDisplayName}</p>
                                                        <p className="text-[10px] text-gray-500 truncate">{l.userEmail}</p>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <button
                                                            onClick={() => toggleFeatured(l.id, l.isFeatured)}
                                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto transition-all ${l.isFeatured ? 'bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-white/5 text-gray-600 hover:text-amber-500 hover:bg-white/10'}`}
                                                        >
                                                            <Flame size={22} className={l.isFeatured ? 'fill-current' : ''} />
                                                        </button>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <button
                                                            onClick={() => toggleVerified(l.id, l.isVerified)}
                                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto transition-all ${l.isVerified ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-white/5 text-gray-600 hover:text-blue-500 hover:bg-white/10'}`}
                                                        >
                                                            <BadgeCheck size={22} className={l.isVerified ? 'fill-current' : ''} />
                                                        </button>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Link to={`/listing/${l.id}`} className="p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                                                                <Eye size={18} />
                                                            </Link>
                                                            <button
                                                                onClick={() => deleteListing(l.id)}
                                                                className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* MOBILE/TABLET CARD VIEW - INVENTORY */}
                                <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    {filteredListings.map((l) => (
                                        <div key={l.id} className="bg-[#0a0a0b] border border-white/5 p-5 rounded-3xl space-y-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/5">
                                                    <img src={l.imageUrl} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-white leading-tight">{l.title}</h4>
                                                    <p className="text-blue-500 font-black text-[10px] uppercase mt-1 tracking-widest">₦{(l.price || 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                                                <button
                                                    onClick={() => toggleFeatured(l.id, l.isFeatured)}
                                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${l.isFeatured ? 'bg-amber-500 text-white' : 'bg-white/5 text-gray-500'}`}
                                                >
                                                    <Flame size={14} /> Featured
                                                </button>
                                                <button
                                                    onClick={() => toggleVerified(l.id, l.isVerified)}
                                                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${l.isVerified ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-500'}`}
                                                >
                                                    <BadgeCheck size={14} /> Verified
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between pt-2">
                                                <Link to={`/listing/${l.id}`} className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">View Listing</Link>
                                                <button onClick={() => deleteListing(l.id)} className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Delete Asset</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'logs' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-8"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                                    <div>
                                        <h3 className="text-3xl font-black tracking-tight">System Activity</h3>
                                        <p className="text-gray-500 text-sm font-medium">Real-time feed of platform transactions and events</p>
                                    </div>
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={clearAllLogs}
                                            className="px-6 py-3 bg-red-500/10 text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20 shadow-xl shadow-red-500/5 flex items-center gap-2"
                                        >
                                            <Trash2 size={16} /> Clear All Logs
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {notifications.length === 0 ? (
                                        <div className="bg-[#0a0a0b] border border-dashed border-white/10 rounded-[2.5rem] py-20 text-center">
                                            <Activity className="mx-auto text-gray-700 mb-4" size={48} />
                                            <p className="text-gray-500 font-bold">No activity recorded yet.</p>
                                        </div>
                                    ) : (
                                        notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                className={`p-6 rounded-3xl border transition-all flex items-center justify-between group ${notif.read ? 'bg-transparent border-white/5 opacity-60' : 'bg-white/5 border-blue-500/30 shadow-lg shadow-blue-500/5'}`}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${notif.type === 'payment' ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                        {notif.type === 'payment' ? <CheckCircle2 size={24} /> : <Bell size={24} />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-white text-lg">{notif.title}</h4>
                                                        <p className="text-gray-400 font-medium">{notif.message}</p>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                                                <Clock size={12} /> {new Date(notif.createdAt?.seconds * 1000).toLocaleString()}
                                                            </div>
                                                            {notif.read && (
                                                                <div className="text-[10px] text-green-500 font-black uppercase tracking-widest flex items-center gap-1">
                                                                    <CheckCircle2 size={10} /> Handled
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {!notif.read && (
                                                    <button
                                                        onClick={() => markAsRead(notif.id)}
                                                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                                                    >
                                                        Acknowledge
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'dashboard' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-12"
                            >
                                <div className="flex items-end justify-between">
                                    <div className="space-y-2">
                                        <h3 className="text-4xl font-black tracking-tighter">Business <span className="text-blue-500">Summary.</span></h3>
                                        <p className="text-gray-500 font-medium">Platform performance and financial health</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl">
                                        <div className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Monthly</div>
                                        <div className="px-4 py-2 text-gray-500 text-[10px] font-black uppercase tracking-widest">Yearly</div>
                                    </div>
                                </div>

                                {/* Bento Grid Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                                    {/* Main Revenue Card - Large (4 cols) */}
                                    <div className="md:col-span-4 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[3rem] shadow-2xl shadow-blue-500/20 text-white relative overflow-hidden group min-h-[300px] flex flex-col justify-between">
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                                                <DollarSign size={32} />
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black uppercase tracking-widest opacity-60">Gross Revenue</p>
                                                <h4 className="text-5xl font-black mt-1">₦{(stats.revenue || 0).toLocaleString()}</h4>
                                            </div>
                                        </div>
                                        <div className="relative z-10 flex items-end justify-between">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-xs font-black bg-white/10 w-fit px-4 py-2 rounded-full uppercase tracking-tighter">
                                                    <TrendingUp size={14} /> +24% from last month
                                                </div>
                                                <p className="text-sm opacity-60 font-medium max-w-xs">Our monetization engine is performing at peak efficiency with higher conversion rates.</p>
                                            </div>
                                            <ArrowUpRight size={48} className="opacity-20 group-hover:opacity-100 transition-opacity group-hover:translate-x-1 group-hover:-translate-y-1 duration-500" />
                                        </div>
                                    </div>

                                    {/* System Stats - Tall (2 cols) */}
                                    <div className="md:col-span-2 bg-[#0a0a0b] border border-white/5 p-8 rounded-[3rem] flex flex-col justify-between relative overflow-hidden group">
                                        <div>
                                            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl w-fit mb-6">
                                                <Activity size={24} />
                                            </div>
                                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Platform Velocity</p>
                                            <h4 className="text-4xl font-black mt-1">8.4k</h4>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-gray-500">
                                                <span>Server Load</span>
                                                <span>12%</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: '12%' }}
                                                    className="h-full bg-purple-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Conversion Card - Small (3 cols) */}
                                    <div className="md:col-span-3 bg-[#0a0a0b] border border-white/5 p-8 rounded-[3rem] group">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
                                                <TrendingUp size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Conversion</p>
                                                <h4 className="text-2xl font-black">{Math.round((notifications.filter(n => n.type === 'payment').length / (listings.length || 1)) * 100)}%</h4>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 h-12 items-end">
                                            {[30, 50, 40, 60, 45, 70, 55].map((h, i) => (
                                                <div key={i} className={`flex-1 rounded-sm ${i === 5 ? 'bg-green-500' : 'bg-green-500/20'}`} style={{ height: `${h}%` }} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* User Growth - Small (3 cols) */}
                                    <div className="md:col-span-3 bg-[#0a0a0b] border border-white/5 p-8 rounded-[3rem]">
                                        <div className="flex items-center gap-4 mb-6">
                                            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Total Users</p>
                                                <h4 className="text-2xl font-black">{users.length}</h4>
                                            </div>
                                        </div>
                                        <div className="flex items-center -space-x-3">
                                            {users.slice(0, 5).map((u, i) => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0a0b] bg-blue-600 flex items-center justify-center text-[10px] font-black overflow-hidden bg-cover bg-center" style={{ backgroundImage: u.photoURL ? `url(${u.photoURL})` : 'none' }}>
                                                    {!u.photoURL && (u.displayName?.[0] || 'U')}
                                                </div>
                                            ))}
                                            <div className="w-8 h-8 rounded-full border-2 border-[#0a0a0b] bg-white/5 flex items-center justify-center text-[10px] font-black text-gray-500">
                                                +{users.length > 5 ? users.length - 5 : 0}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Graph Section - Full Width */}
                                <div className="bg-[#0a0a0b] border border-white/5 p-10 rounded-[3rem] relative overflow-hidden group">
                                    <div className="flex items-center justify-between mb-10">
                                        <h4 className="text-lg font-bold flex items-center gap-2">
                                            <BarChart3 size={20} className="text-blue-500" /> Revenue Velocity
                                        </h4>
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                                <div className="w-2 h-2 rounded-full bg-blue-600" /> Current Year
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                                <div className="w-2 h-2 rounded-full bg-white/10" /> Projected
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-end justify-between h-56 gap-2 md:gap-4 px-2 md:px-4 mb-4">
                                        {monthlyRevenue.map((h, i) => (
                                            <div key={i} className="flex-1 group relative h-full flex flex-col justify-end">
                                                <motion.div
                                                    initial={{ height: 0 }}
                                                    whileInView={{ height: `${h}%` }}
                                                    viewport={{ once: true, margin: "-50px" }}
                                                    transition={{ delay: i * 0.05, duration: 0.8, ease: "easeOut" }}
                                                    className={`w-full rounded-t-xl relative ${h >= 90
                                                        ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                                                        : 'bg-gradient-to-t from-white/10 to-white/5 group-hover:from-white/20 group-hover:to-white/10'
                                                        }`}
                                                />
                                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-500 uppercase tracking-tighter">{monthLabels[i]}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'ledger' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <h3 className="text-3xl font-black tracking-tight text-white">Monetization Ledger</h3>
                                        <p className="text-gray-500 text-sm font-medium">Tracking all premium package sales and revenue</p>
                                    </div>
                                    <div className="bg-blue-600/10 border border-blue-600/20 px-6 py-4 rounded-[2rem] flex items-center gap-4 shadow-2xl">
                                        <div className="p-2 bg-blue-600 rounded-xl text-white">
                                            <DollarSign size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Gross Revenue</p>
                                            <h4 className="text-2xl font-black text-white">₦{(stats.revenue || 0).toLocaleString()}</h4>
                                        </div>
                                    </div>
                                </div>

                                {/* Ledger Table - HIDDEN ON SMALLER SCREENS */}
                                <div className="hidden lg:block bg-[#0a0a0b] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-white/5 border-b border-white/5">
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Transaction ID</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Package / Type</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="px-8 py-20 text-center text-gray-500 font-bold">
                                                        No transactions recorded yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                transactions.map((tx) => (
                                                    <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-lg ${tx.type === 'verified' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                                    <DollarSign size={14} />
                                                                </div>
                                                                <span className="text-xs font-mono text-gray-500">#{tx.id.slice(-6).toUpperCase()}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <p className="font-bold text-white text-sm">{tx.userName || 'Unknown Seller'}</p>
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-tighter">UID: {tx.userId?.slice(-6)}</p>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${tx.type === 'verified' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' :
                                                                tx.type === 'urgent' ? 'bg-red-600/20 text-red-400 border border-red-500/20' :
                                                                    'bg-amber-600/20 text-amber-400 border border-amber-500/20'
                                                                }`}>
                                                                {tx.tier} {tx.type}
                                                            </span>
                                                            <p className="text-[10px] text-gray-500 mt-1 truncate max-w-[150px]">{tx.itemTitle || 'Profile Update'}</p>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <p className="text-lg font-black text-green-500">₦{tx.amount?.toLocaleString()}</p>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <p className="text-xs font-bold text-gray-400">{tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}</p>
                                                            <p className="text-[10px] text-gray-600">{tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}</p>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* MOBILE/TABLET CARD VIEW - LEDGER */}
                                <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    {transactions.map((tx) => (
                                        <div key={tx.id} className="bg-[#0a0a0b] border border-white/5 p-6 rounded-3xl space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-mono text-gray-500">#{tx.id.slice(-6).toUpperCase()}</span>
                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-white mb-1">{tx.userName || 'Unknown Seller'}</p>
                                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${tx.type === 'verified' ? 'bg-blue-600/20 text-blue-400' : 'bg-amber-600/20 text-amber-400'}`}>
                                                    {tx.tier} {tx.type}
                                                </span>
                                            </div>
                                            <p className="text-lg font-black text-green-500">₦{tx.amount?.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'users' && (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                    <div className="space-y-2">
                                        <h3 className="text-4xl font-black tracking-tighter">Identity <span className="text-blue-500">Center.</span></h3>
                                        <p className="text-gray-500 font-medium">Verify and manage platform user credentials</p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-[2rem] shadow-2xl">
                                        <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-600/10 text-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                                            <Users size={14} /> Total: {users.length}
                                        </div>
                                        <div className="flex items-center gap-2 px-5 py-2.5 bg-green-500/10 text-green-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                                            <BadgeCheck size={14} /> Verified: {users.filter(u => u.isVerified).length}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {users.map((user) => (
                                        <motion.div
                                            key={user.uid}
                                            whileHover={{ y: -5 }}
                                            className="bg-[#0a0a0b] border border-white/5 p-8 rounded-[3rem] relative overflow-hidden group transition-all hover:bg-[#111112] hover:border-blue-500/30"
                                        >
                                            {/* Decorative Background Glow */}
                                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/5 rounded-full blur-[100px] group-hover:bg-blue-600/10 transition-all duration-700" />

                                            <div className="relative z-10">
                                                <div className="flex items-start justify-between mb-8">
                                                    <div className="relative">
                                                        <div className={`w-24 h-24 rounded-[2.5rem] p-1 ${user.isVerified ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20' : 'bg-white/5'}`}>
                                                            <div className="w-full h-full rounded-[2.3rem] overflow-hidden bg-[#0a0a0b] flex items-center justify-center">
                                                                {user.photoURL ? (
                                                                    <img src={user.photoURL} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                ) : (
                                                                    <span className="text-3xl font-black text-gray-700">{user.displayName?.[0] || 'U'}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {user.isVerified && (
                                                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white border-4 border-[#0a0a0b] shadow-xl">
                                                                <BadgeCheck size={18} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${user.isVerified ? 'bg-blue-600/10 text-blue-500 border-blue-500/20' : 'bg-gray-500/10 text-gray-500 border-white/5'}`}>
                                                        {user.isVerified ? 'Verified Account' : 'Standard User'}
                                                    </div>
                                                </div>

                                                <div className="space-y-1 mb-8">
                                                    <h5 className="text-2xl font-black text-white tracking-tight truncate leading-tight">
                                                        {user.displayName || 'Anonymous User'}
                                                    </h5>
                                                    <p className="text-xs font-medium text-gray-500 truncate flex items-center gap-2 italic">
                                                        <Clock size={12} className="opacity-50" /> Joined {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-bold text-gray-400 border border-white/5">
                                                            ID: {user.uid.slice(0, 8).toUpperCase()}
                                                        </span>
                                                        <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-bold text-gray-400 border border-white/5">
                                                            {user.email}
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => toggleVerified(user.uid, user.isVerified)}
                                                    className={`w-full py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all relative overflow-hidden group/btn ${user.isVerified
                                                        ? 'bg-transparent text-gray-400 border border-white/10 hover:border-red-500/50 hover:text-red-500'
                                                        : 'bg-white text-black hover:bg-blue-600 hover:text-white shadow-xl hover:shadow-blue-500/20'
                                                        }`}
                                                >
                                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                                        {user.isVerified ? (
                                                            <>
                                                                <X size={14} /> Revoke Verification
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ShieldCheck size={14} /> Verify Account
                                                            </>
                                                        )}
                                                    </span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}
