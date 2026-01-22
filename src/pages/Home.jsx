import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Search, MapPin, Tag } from 'lucide-react';
import CategoryPills from '../components/CategoryPills';
import { motion } from 'framer-motion';

export default function Home() {
    useAuth();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    useEffect(() => {
        const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const listingsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setListings(listingsData);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const filteredListings = listings.filter(listing => {
        const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "All" || listing.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

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
        <div className="space-y-8">
            {/* Hero / Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Discover</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Found {filteredListings.length} items near you</p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search for items..."
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all text-gray-900 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <CategoryPills selected={selectedCategory} onSelect={setSelectedCategory} />

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl h-64 animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <motion.div
                    key={selectedCategory + searchTerm} // Force re-animation on filter change
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                >
                    {filteredListings.length === 0 ? (
                        <div className="col-span-full py-20 text-center">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="text-gray-400 dark:text-gray-500" size={40} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No items found</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search or category.</p>
                        </div>
                    ) : (
                        filteredListings.map(listing => (
                            <motion.div key={listing.id} variants={item}>
                                <Link to={`/listing/${listing.id}`} className="group block bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-800 overflow-hidden h-full flex flex-col">
                                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
                                        <img
                                            src={listing.imageUrl}
                                            alt={listing.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-3 right-3">
                                            <span className="bg-white/90 dark:bg-gray-900/90 backdrop-blur text-xs font-bold px-2 py-1 rounded-lg shadow-sm dark:text-white">
                                                {listing.category}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col flex-1">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">{listing.title}</h3>
                                                <p className="text-blue-600 dark:text-blue-400 font-bold whitespace-nowrap">₦{listing.price}</p>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{listing.description}</p>
                                        </div>
                                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center gap-1 min-w-0 flex-1">
                                                <MapPin size={14} className="text-blue-500 flex-shrink-0" />
                                                <span className="truncate">{listing.address || (listing.location ? 'Map Available' : 'No Location')}</span>
                                            </div>
                                            <span className="ml-2 flex-shrink-0">{new Date(listing.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))
                    )}
                </motion.div>
            )}

        </div>
    );
}
