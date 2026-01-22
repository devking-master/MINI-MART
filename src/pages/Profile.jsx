import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { User, Package, Calendar, MapPin, ArrowRight, Plus, Camera, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const IMGBB_API_KEY = "5c96460dbce35dbdb36e2e26b2dad63e";

export default function Profile() {
    const { currentUser, updateUserProfile } = useAuth();
    const [myListings, setMyListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

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
            await updateUserProfile(currentUser, { photoURL: imageUrl });
        } catch (err) {
            console.error("Failed to upload profile picture:", err);
            alert("Failed to update profile picture.");
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
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden border border-gray-100 dark:border-gray-800 transition-colors"
            >
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
                    <div className="absolute -bottom-12 left-8">
                        <div className="relative group">
                            <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-2xl p-1 shadow-lg transition-colors">
                                <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden">
                                    {currentUser?.photoURL ? (
                                        <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-4xl text-gray-400">👤</div>
                                    )}
                                </div>
                            </div>

                            {/* Upload Overlay */}
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                {uploading ? <Loader className="animate-spin text-white" /> : <Camera className="text-white" />}
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} disabled={uploading} />
                            </label>
                        </div>
                    </div>
                </div>
                <div className="pt-16 pb-8 px-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentUser?.displayName || currentUser?.email?.split('@')[0]}</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">{currentUser?.email}</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-900/30 transition-colors">
                            <span className="block text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Active Listings</span>
                            <span className="text-2xl font-black text-gray-900 dark:text-white">{myListings.length}</span>
                        </div>
                        <Link to="/create-listing" className="bg-gray-900 dark:bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-black dark:hover:bg-blue-700 transition-colors shadow-lg shadow-gray-900/20 dark:shadow-blue-500/20">
                            <Plus size={20} /> New Listing
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Listings Section */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Package className="text-blue-600 dark:text-blue-400" /> My Inventory
                </h2>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl h-80 animate-pulse shadow-sm border border-gray-100 dark:border-gray-800"></div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {myListings.length === 0 ? (
                            <div className="col-span-full py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 transition-colors">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 dark:text-gray-600">
                                    <Package size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">No listings yet</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-6">Start selling your items today!</p>
                                <Link to="/create-listing" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:underline">
                                    Create your first listing <ArrowRight size={16} />
                                </Link>
                            </div>
                        ) : (
                            myListings.map(listing => (
                                <motion.div key={listing.id} variants={item}>
                                    <Link to={`/listing/${listing.id}`} className="group block bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 overflow-hidden h-full flex flex-col">
                                        <div className="aspect-[4/3] bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                                            <img
                                                src={listing.imageUrl}
                                                alt={listing.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            <div className="absolute top-3 right-3">
                                                <span className="bg-white/90 dark:bg-gray-900/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-lg shadow-sm text-gray-900 dark:text-white">
                                                    {listing.category}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-5 flex flex-col flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">{listing.title}</h3>
                                                <span className="text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md text-sm transition-colors">
                                                    ₦{listing.price}
                                                </span>
                                            </div>

                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1 transition-colors">
                                                {listing.description}
                                            </p>

                                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3 transition-colors">
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 min-w-0">
                                                    <MapPin size={14} className="text-blue-500 flex-shrink-0" />
                                                    <span className="truncate">{listing.address || (listing.location ? 'Map Available' : 'No Location')}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs font-medium text-gray-400 dark:text-gray-500">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar size={14} />
                                                        {new Date(listing.createdAt?.seconds * 1000).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full transition-colors">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                        Active
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                )}
            </div>
        </div>

    );
}
