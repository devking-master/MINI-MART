import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import MockPaymentModal from '../components/MockPaymentModal';
import { User, Package, Calendar, MapPin, ArrowRight, Plus, Camera, Loader, Edit2, Save, X, BadgeCheck, LayoutDashboard, Zap, Flame, Share2, Copy, Check, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import AlertModal from '../components/AlertModal';

const IMGBB_API_KEY = "5c96460dbce35dbdb36e2e26b2dad63e";

export default function Profile() {
    const { currentUser, updateUserProfile } = useAuth();
    const [myListings, setMyListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [alertState, setAlertState] = useState({ isOpen: false, title: "", message: "", type: "error" });

    const adminEmails = ['oluwaseyioluwatobi77@gmail.com'];
    const isAdmin = adminEmails.includes(currentUser?.email);

    // Name Editing State
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(currentUser?.displayName || "");

    // Payment/Automation State
    const [paymentModal, setPaymentModal] = useState({
        isOpen: false,
        type: null,
        data: null
    });

    const triggerVerification = () => {
        if (currentUser?.isVerified) return;
        setPaymentModal({
            isOpen: true,
            type: 'verified',
            data: null
        });
    };

    const triggerBoost = (listing) => {
        setPaymentModal({
            isOpen: true,
            type: 'featured',
            data: listing
        });
    };

    const triggerUrgent = (listing) => {
        setPaymentModal({
            isOpen: true,
            type: 'urgent',
            data: listing
        });
    };

    const handleShareStore = () => {
        const url = window.location.href; // In a real app this might be /store/userId
        navigator.clipboard.writeText(url);
        setAlertState({
            isOpen: true,
            title: "Link Copied!",
            message: "Your professional store link is now in your clipboard. Share it anywhere!",
            type: "success"
        });
    };

    const handlePaymentSuccess = () => {
        setAlertState({
            isOpen: true,
            title: "Success!",
            message: paymentModal.type === 'verified' ? "You are now a Verified Seller!" :
                (paymentModal.type === 'urgent' ? "Urgent label applied!" : "Your listing is now Featured!"),
            type: "success"
        });
        // We could refresh listings here, but Firestore onSnapshot or manual refetch is better
        if (paymentModal.type === 'featured') {
            setMyListings(prev => prev.map(l => l.id === paymentModal.data.id ? { ...l, isFeatured: true } : l));
        } else if (paymentModal.type === 'urgent') {
            setMyListings(prev => prev.map(l => l.id === paymentModal.data.id ? { ...l, isUrgent: true } : l));
        }
    };

    useEffect(() => {
        if (currentUser?.displayName) {
            setNewName(currentUser.displayName);
        }
    }, [currentUser]);

    const handleSaveName = async () => {
        if (!newName.trim() || newName === currentUser?.displayName) {
            setIsEditingName(false);
            return;
        }

        try {
            await updateUserProfile({ displayName: newName });
            setAlertState({
                isOpen: true,
                title: "Nice to meet you!",
                message: "Your username has been updated successfully.",
                type: "success"
            });
            setIsEditingName(false);
        } catch (err) {
            console.error("Failed to update name:", err);
            setAlertState({
                isOpen: true,
                title: "Update Failed",
                message: "Could not update your username. Please try again.",
                type: "error"
            });
        }
    };

    useEffect(() => {
        async function fetchMyListings() {
            const q = query(
                collection(db, "listings"),
                where("userId", "==", currentUser.uid)
            );

            const querySnapshot = await getDocs(q);
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
            setMyListings(data);
            setLoading(false);
        }

        if (currentUser) {
            fetchMyListings();
        }
    }, [currentUser]);

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("image", file);
        formData.append("key", IMGBB_API_KEY);

        try {
            const response = await axios.post("https://api.imgbb.com/1/upload", formData);
            const imageUrl = response.data.data.display_url;
            await updateUserProfile({ photoURL: imageUrl });
            setAlertState({
                isOpen: true,
                title: "Profile Updated",
                message: "Your profile picture has been updated successfully!",
                type: "success"
            });
        } catch (err) {
            console.error("Failed to upload profile picture:", err);
            setAlertState({
                isOpen: true,
                title: "Upload Failed",
                message: "Failed to update profile picture. Please try again.",
                type: "error"
            });
        }
        setUploading(false);
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 md:space-y-10 pt-20 md:pt-28 pb-20 md:pb-28 px-4 md:px-6">
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 relative group"
            >
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 opacity-50" />

                <div className="h-40 md:h-48 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 dark:to-gray-900/90" />

                    <div className="absolute -bottom-14 md:-bottom-16 left-0 md:left-12 w-full md:w-auto flex flex-col md:flex-row items-center md:items-end gap-3 md:gap-6 z-20 px-4 md:px-0">
                        {/* Avatar */}
                        <div className="relative group/avatar">
                            <div className="w-28 h-28 md:w-36 md:h-36 bg-white dark:bg-gray-900 rounded-[1.75rem] md:rounded-[2.25rem] p-1 shadow-2xl md:rotate-2 group-hover/avatar:rotate-0 transition-all duration-300">
                                <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-[1.25rem] md:rounded-[1.75rem] flex items-center justify-center overflow-hidden border-2 border-gray-50 dark:border-gray-700 relative">
                                    {currentUser?.photoURL ? (
                                        <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-3xl md:text-4xl text-gray-300 dark:text-gray-600 font-black tracking-tighter">
                                            {currentUser?.email?.[0].toUpperCase()}
                                        </div>
                                    )}

                                    {/* Loading Overlay */}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                            <Loader className="animate-spin text-white" size={20} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Upload Button */}
                            <label className="absolute bottom-1 right-1 md:bottom-2 md:right-2 flex items-center justify-center w-7 h-7 md:w-9 md:h-9 bg-blue-600 text-white rounded-lg md:rounded-xl shadow-lg cursor-pointer hover:bg-blue-700 hover:scale-110 transition-all z-10">
                                <Camera size={12} className="md:size-16" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} disabled={uploading} />
                            </label>
                        </div>

                        {/* User Info - Editable */}
                        <div className="mb-0 md:mb-2 relative z-10 text-center md:text-left w-full md:w-auto">
                            <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-3 mb-0.5">
                                {isEditingName ? (
                                    <div className="flex items-center gap-2 bg-white/50 dark:bg-black/80 backdrop-blur-md p-1 rounded-xl border border-blue-200 dark:border-blue-800 w-full md:w-auto">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="bg-transparent border-none outline-none text-lg md:text-xl font-black text-gray-900 dark:text-white flex-1 md:w-40 px-2"
                                            autoFocus
                                        />
                                        <div className="flex gap-1">
                                            <button onClick={handleSaveName} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                                <Save size={14} />
                                            </button>
                                            <button onClick={() => setIsEditingName(false)} className="p-1.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
                                        <h1 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tighter truncate max-w-[180px] md:max-w-none">
                                            {currentUser?.displayName || currentUser?.email?.split('@')[0]}
                                        </h1>
                                        <div className="flex items-center gap-2">
                                            {currentUser?.isVerified && (
                                                <BadgeCheck size={24} className="text-blue-500 fill-blue-500/10 shrink-0" title="Verified Seller" />
                                            )}
                                            <button onClick={() => setIsEditingName(true)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                                                <Edit2 size={16} className="md:size-18" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <span className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-[8px] md:text-[9px] font-black uppercase tracking-widest text-white rounded-full shadow-lg shadow-blue-500/20">Premium</span>
                            </div>
                            <p className="text-xs md:text-base text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center md:justify-start gap-1.5">
                                <span className="truncate max-w-[180px] md:max-w-none">{currentUser?.email}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                            </p>

                            {!currentUser?.isVerified ? (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={triggerVerification}
                                    className="mt-4 px-4 py-2 bg-blue-600/10 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-600/20 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                                >
                                    <BadgeCheck size={14} /> Get Verified Seller Badge
                                </motion.button>
                            ) : (
                                <div className="flex items-center gap-2 mt-4">
                                    <button
                                        onClick={handleShareStore}
                                        className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 hover:scale-105 transition-all shadow-lg"
                                    >
                                        <Share2 size={12} /> Share Store
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-20 md:pt-20 pb-6 md:pb-6 px-4 md:px-12 flex flex-col md:flex-row justify-end items-center gap-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm relative z-0">
                    <div className="flex flex-wrap justify-center md:justify-end gap-3 md:gap-4 w-full md:w-auto">

                        <div className="bg-white dark:bg-gray-800 p-3 md:p-3 rounded-2xl md:rounded-[1.25rem] border border-gray-100 dark:border-gray-700 shadow-sm flex-1 md:flex-none min-w-[100px] md:min-w-[120px] text-center md:text-left">
                            <span className="block text-[7px] md:text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Seller Rank</span>
                            <span className={`text-base md:text-xl font-black ${currentUser?.isVerified ? 'text-blue-600' : 'text-gray-400'}`}>
                                {currentUser?.isVerified ? 'Verified Pro' : 'Standard'}
                            </span>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-2.5 md:p-3 rounded-xl md:rounded-[1.25rem] border border-gray-100 dark:border-gray-700 shadow-sm flex-1 md:flex-none min-w-[90px] md:min-w-[120px] text-center md:text-left">
                            <span className="block text-[7px] md:text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Listings</span>
                            <span className="text-base md:text-xl font-black text-blue-600 dark:text-blue-400">{myListings.length}</span>
                        </div>
                        {isAdmin && (
                            <Link to="/admin" className="bg-blue-600 text-white px-5 md:px-7 py-2.5 md:py-3 rounded-xl md:rounded-[1.25rem] font-black text-sm md:text-base flex items-center gap-2 hover:scale-105 transition-all shadow-xl w-full md:w-auto justify-center">
                                <LayoutDashboard size={18} /> Admin Console
                            </Link>
                        )}
                        <Link to="/create-listing" className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 md:px-7 py-2.5 md:py-3 rounded-xl md:rounded-[1.25rem] font-black text-sm md:text-base flex items-center gap-2 hover:scale-105 transition-all shadow-xl w-full md:w-auto justify-center">
                            <Plus size={18} /> New
                        </Link>
                    </div>
                </div>

                <MockPaymentModal
                    isOpen={paymentModal.isOpen}
                    onClose={() => setPaymentModal({ ...paymentModal, isOpen: false })}
                    type={paymentModal.type}
                    data={paymentModal.data}
                    onSuccess={handlePaymentSuccess}
                />
            </motion.div >

            {/* Listings Section */}
            < div className="space-y-8" >
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-3">
                        <Package className="text-blue-600 dark:text-blue-400" size={28} /> My Collection
                    </h2>
                </div>

                {
                    loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-gray-100 dark:bg-gray-800/10 rounded-[3rem] h-[450px] animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            variants={container}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {myListings.length === 0 ? (
                                <div className="col-span-full py-32 text-center bg-gray-50 dark:bg-gray-900/30 rounded-[4rem] border border-dashed border-gray-200 dark:border-gray-800 transition-all space-y-6">
                                    <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-sm border border-gray-100 dark:border-gray-800">
                                        <Package size={40} className="text-gray-300 dark:text-gray-700" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Your market is empty.</h3>
                                        <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xs mx-auto">Start sharing your items with the community and earn today.</p>
                                    </div>
                                    <Link to="/create-listing" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:gap-3 transition-all">
                                        Post your first item <ArrowRight size={20} />
                                    </Link>
                                </div>
                            ) : (
                                myListings.map(listing => (
                                    <motion.div key={listing.id} variants={item}>
                                        <div className="group block bg-white dark:bg-gray-900 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_40px_80px_-15px_rgba(37,99,235,0.15)] hover:-translate-y-4 transition-all duration-700 border border-gray-100/50 dark:border-gray-800/20 overflow-hidden h-full flex flex-col relative">
                                            <Link to={`/listing/${listing.id}`} className="aspect-[16/11] bg-gray-50 dark:bg-gray-800/10 relative overflow-hidden block">
                                                <img
                                                    src={listing.imageUrl}
                                                    alt={listing.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                                                />
                                                <div className="absolute top-6 left-6 flex flex-col gap-2">
                                                    <span className="bg-white/95 dark:bg-black/60 backdrop-blur-xl text-[10px] font-black tracking-[0.15em] uppercase px-4 py-2 rounded-2xl shadow-sm dark:text-white border border-white/20">
                                                        {listing.category}
                                                    </span>
                                                    <div className="flex flex-col gap-1.5">
                                                        {listing.isFeatured && (!listing.featuredExpiry || listing.featuredExpiry.toDate() > new Date()) && (
                                                            <span className="bg-blue-600 text-white text-[9px] font-black tracking-widest uppercase px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border border-white/20">
                                                                <ShieldCheck size={10} className="text-blue-200 fill-blue-200/20" /> Featured
                                                            </span>
                                                        )}
                                                        {listing.isUrgent && (!listing.urgentExpiry || listing.urgentExpiry.toDate() > new Date()) && (
                                                            <span className="bg-red-600 text-white text-[9px] font-black tracking-widest uppercase px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border border-white/20 animate-pulse">
                                                                <Zap size={10} className="fill-white" /> Urgent
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                            <div className="p-8 flex flex-col flex-1">
                                                <div className="flex justify-between items-start mb-4">
                                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1 tracking-tighter leading-none">{listing.title}</h3>
                                                    <span className="text-blue-600 dark:text-blue-400 font-[1000] text-xl tracking-tighter">₦{listing.price?.toLocaleString()}</span>
                                                </div>

                                                <p className="text-[15px] text-gray-500 dark:text-gray-400 line-clamp-2 mb-6 font-medium leading-snug">
                                                    {listing.description}
                                                </p>

                                                <div className="mt-auto pt-6 border-t border-gray-50 dark:border-gray-800/50 flex flex-col gap-3">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 mb-2">
                                                        <MapPin size={14} className="text-blue-500 flex-shrink-0" />
                                                        <span className="truncate">{listing.location?.address || 'Location Hidden'}</span>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <button
                                                            onClick={() => triggerBoost(listing)}
                                                            className={`py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn ${listing.isFeatured && (!listing.featuredExpiry || listing.featuredExpiry.toDate() > new Date())
                                                                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 border border-blue-200 dark:border-blue-800/30'
                                                                : 'bg-blue-600/5 hover:bg-blue-600 text-blue-600 hover:text-white border border-blue-600/20'
                                                                }`}
                                                        >
                                                            <ShieldCheck size={14} className="group-hover/btn:fill-current" />
                                                            {listing.isFeatured ? 'Boosted' : 'Boost'}
                                                        </button>
                                                        <button
                                                            onClick={() => triggerUrgent(listing)}
                                                            className={`py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn ${listing.isUrgent && (!listing.urgentExpiry || listing.urgentExpiry.toDate() > new Date())
                                                                ? 'bg-red-100 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800/30'
                                                                : 'bg-red-600/5 hover:bg-red-600 text-red-600 hover:text-white border border-red-600/20'
                                                                }`}
                                                        >
                                                            <Zap size={14} className="group-hover/btn:fill-current" />
                                                            {listing.isUrgent ? 'Urgent' : 'Sell Fast'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )
                }
            </div >

            <AlertModal
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />
        </div >
    );
}

