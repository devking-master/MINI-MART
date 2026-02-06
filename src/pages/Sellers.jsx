import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { Star, ShieldCheck, MapPin, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Sellers() {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSellers = async () => {
            try {
                // 1. Fetch all users
                const usersSnap = await getDocs(collection(db, "users"));
                const listingsSnap = await getDocs(collection(db, "listings"));

                const allListings = listingsSnap.docs.map(doc => doc.data());

                const fetched = usersSnap.docs.map(doc => {
                    const userData = doc.data();
                    // Count items for this user
                    const itemCount = allListings.filter(l => l.userId === doc.id).length;

                    return {
                        id: doc.id,
                        ...userData,
                        itemCount: itemCount
                    };
                })
                    // Hide users with 0 listings unless they are verified
                    .filter(u => u.isVerified || u.itemCount > 0)
                    // Sort verified to top, then by item count
                    .sort((a, b) => {
                        if (a.isVerified && !b.isVerified) return -1;
                        if (!a.isVerified && b.isVerified) return 1;
                        return (b.itemCount || 0) - (a.itemCount || 0);
                    });

                setSellers(fetched);
            } catch (error) {
                console.error("Error fetching sellers:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSellers();
    }, []);

    const MockSellers = [
        { id: 'm1', displayName: 'Sarah Styles', photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop', location: 'New York, NY', rating: 4.9, sales: 124 },
        { id: 'm2', displayName: 'Tech Wizard', photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop', location: 'San Fran, CA', rating: 5.0, sales: 89 },
        { id: 'm3', displayName: 'Antique Jo', photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop', location: 'Austin, TX', rating: 4.8, sales: 342 },
        { id: 'm4', displayName: 'Urban Gear', photoURL: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop', location: 'Chicago, IL', rating: 4.9, sales: 56 },
    ];

    const displaySellers = sellers.length > 0 ? sellers : MockSellers;

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0b] text-gray-900 dark:text-white pt-20 pb-20">
            <section className="px-6 md:px-12 py-12 text-center">
                <h1 className="text-4xl md:text-5xl font-black mb-6">Featured Sellers</h1>
                <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                    Meet the top-rated community members making Mini Mart special.
                </p>
            </section>

            <section className="max-w-[1600px] mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {displaySellers.map((seller, i) => (
                        <motion.div
                            key={seller.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            className="h-full"
                        >
                            <div className={`bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border transition-all relative group shadow-2xl shadow-black/5 h-full ${seller.isVerified ? 'border-blue-500/20 ring-1 ring-blue-500/5' : 'border-gray-100 dark:border-gray-800'}`}>
                                <div className="flex flex-col items-center">
                                    {/* Badge Overlay */}
                                    {seller.isVerified && (
                                        <div className="absolute top-6 right-6">
                                            <div className="bg-blue-600 text-white p-1.5 rounded-xl shadow-lg shadow-blue-500/20">
                                                <ShieldCheck size={16} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-[2rem] overflow-hidden mb-6 group-hover:scale-105 transition-transform duration-500 shadow-2xl relative">
                                        {seller.photoURL ? (
                                            <img src={seller.photoURL} alt={seller.displayName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-3xl font-black">
                                                {(seller.displayName || seller.email)?.[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-center space-y-1 mb-6">
                                        <h3 className="font-black text-xl tracking-tight text-gray-900 dark:text-white flex items-center justify-center gap-2">
                                            {seller.displayName || seller.email?.split('@')[0]}
                                        </h3>
                                        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            <MapPin size={12} className="text-blue-500" />
                                            {seller.location || 'Local Seller'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 w-full bg-gray-50 dark:bg-black/40 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
                                        <div className="text-center border-r border-gray-200 dark:border-gray-800">
                                            <p className="text-lg font-black text-blue-600">{seller.itemCount || 0}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Listings</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-black text-gray-900 dark:text-white">{seller.isVerified ? 'Pro' : 'Std'}</p>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Rank</p>
                                        </div>
                                    </div>

                                    <Link
                                        to="/" // In a real app, link to /store/sellerId
                                        className="w-full mt-6 py-4 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xs uppercase tracking-widest text-center hover:scale-105 transition-all shadow-xl shadow-black/10"
                                    >
                                        Visit Store
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section >
        </div >
    );
}
