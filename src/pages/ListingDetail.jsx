import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Trash2, ArrowLeft, MapPin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

let DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function ListingDetail() {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        async function fetchListing() {
            const docRef = doc(db, "listings", id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                let images = [];
                if (data.imageUrls && Array.isArray(data.imageUrls)) {
                    images = data.imageUrls;
                } else if (data.imageUrl) {
                    images = [data.imageUrl];
                }

                setListing({ id: docSnap.id, ...data, images });
            }
            setLoading(false);
        }
        fetchListing();
    }, [id]);

    const handleStartChat = () => {
        if (listing.userId === currentUser.uid) return;
        navigate('/chat', {
            state: {
                targetUser: {
                    uid: listing.userId,
                    email: listing.userEmail,
                    displayName: listing.userDisplayName || listing.userEmail.split('@')[0]
                },
                listingId: listing.id
            }
        });
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this listing?")) {
            await deleteDoc(doc(db, "listings", id));
            navigate("/");
        }
    };

    const nextImage = () => {
        if (!listing?.images) return;
        setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
    };

    const prevImage = () => {
        if (!listing?.images) return;
        setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
    };

    if (loading) return <div className="h-96 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (!listing) return <div className="h-96 flex items-center justify-center text-gray-500">Listing not found</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">
                <ArrowLeft size={20} /> Back to Browse
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Image Section - Carousel */}
                <div className="space-y-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="rounded-3xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none aspect-[4/3] lg:aspect-auto lg:h-[500px] relative group"
                    >
                        <AnimatePresence mode='wait'>
                            <motion.img
                                key={currentImageIndex}
                                src={listing.images[currentImageIndex]}
                                alt={listing.title}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full h-full object-cover"
                            />
                        </AnimatePresence>

                        <div className="absolute top-4 left-4 z-10">
                            <span className="bg-white/90 dark:bg-gray-900/90 backdrop-blur px-4 py-2 rounded-full font-bold shadow-sm text-gray-900 dark:text-white">
                                {listing.category}
                            </span>
                        </div>

                        {/* Navigation Buttons */}
                        {listing.images.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 p-2 rounded-full shadow-lg backdrop-blur transition-all opacity-0 group-hover:opacity-100 text-gray-900 dark:text-white"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 p-2 rounded-full shadow-lg backdrop-blur transition-all opacity-0 group-hover:opacity-100 text-gray-900 dark:text-white"
                                >
                                    <ChevronRight size={24} />
                                </button>

                                {/* Dots Indicator */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    {listing.images.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentImageIndex(idx)}
                                            className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/75"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>

                    {/* Thumbnails */}
                    {listing.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {listing.images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${idx === currentImageIndex ? "border-blue-600 ring-2 ring-blue-600/20" : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                                        }`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col h-full space-y-6"
                >
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex-1 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Calendar size={14} /> Posted {new Date(listing.createdAt?.seconds * 1000).toLocaleDateString()}
                            </span>
                            {listing.location && (
                                <div className="text-sm text-blue-600 dark:text-blue-400 flex flex-col items-end gap-1 font-medium">
                                    <span className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full flex items-center gap-1">
                                        <MapPin size={14} /> {listing.address ? "Location Verified" : "Nearby"}
                                    </span>
                                </div>
                            )}
                        </div>

                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 leading-tight">{listing.title}</h1>

                        {listing.address && (
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 flex items-start gap-2">
                                <MapPin size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />
                                <span>{listing.address}</span>
                            </p>
                        )}

                        <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-6">
                            ₦{listing.price}
                        </p>

                        <div className="prose prose-gray dark:prose-invert max-w-none mb-8 text-gray-600 dark:text-gray-300 leading-relaxed transition-colors">
                            {listing.description}
                        </div>

                        <div className="flex items-center gap-4 py-6 border-t border-b border-gray-100 dark:border-gray-800 mb-8 transition-colors">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                {listing.userPhotoURL ? (
                                    <img src={listing.userPhotoURL} alt="Seller" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="font-bold text-gray-500 dark:text-gray-400">{(listing.userDisplayName || listing.userEmail || "?").charAt(0).toUpperCase()}</span>
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Seller</p>
                                <p className="font-bold text-gray-900 dark:text-white">{listing.userDisplayName || listing.userEmail?.split('@')[0]}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            {currentUser.uid !== listing.userId ? (
                                <button
                                    onClick={handleStartChat}
                                    className="flex-1 bg-gray-900 dark:bg-blue-600 text-white font-bold py-4 px-6 rounded-2xl hover:bg-black dark:hover:bg-blue-700 transition-all shadow-lg shadow-gray-900/20 dark:shadow-blue-500/20 flex items-center justify-center gap-2 transform active:scale-95"
                                >
                                    <MessageCircle size={20} />
                                    Chat with Seller
                                </button>
                            ) : (
                                <button
                                    onClick={handleDelete}
                                    className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold py-4 px-6 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={20} />
                                    Delete Listing
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Map Preview */}
                    <div className="h-64 bg-white dark:bg-gray-900 p-2 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden transition-colors">
                        {listing.location ? (
                            <MapContainer
                                center={[listing.location.lat, listing.location.lng]}
                                zoom={13}
                                style={{ height: '100%', width: '100%', borderRadius: '1.5rem' }}
                                dragging={false}
                                scrollWheelZoom={false}
                                zoomControl={false}
                            >
                                <LayersControl position="topright">
                                    <LayersControl.BaseLayer checked name="Satellite">
                                        <TileLayer
                                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                                        />
                                    </LayersControl.BaseLayer>
                                    <LayersControl.BaseLayer name="Street">
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                    </LayersControl.BaseLayer>
                                </LayersControl>
                                <Marker position={[listing.location.lat, listing.location.lng]}></Marker>
                            </MapContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600 font-medium">No Location Data</div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>

    );
}
