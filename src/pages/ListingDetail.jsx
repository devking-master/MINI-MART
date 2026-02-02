import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Trash2, ArrowLeft, MapPin, Calendar, ChevronLeft, ChevronRight, Share2, ShieldCheck, Zap } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
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
        window.scrollTo(0, 0);
        async function fetchListing() {
            try {
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
            } catch (err) {
                console.error("Error fetching listing:", err);
            }
            setLoading(false);
        }
        fetchListing();
    }, [id]);

    const handleStartChat = () => {
        if (!currentUser) return navigate('/login');
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

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteDoc(doc(db, "listings", id));
            navigate("/");
        } catch (error) {
            console.error("Error deleting listing:", error);
            // Optionally set an error state here too
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
            />
        </div>
    );

    if (!listing) return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white">Listing not found.</h2>
            <button onClick={() => navigate('/')} className="text-blue-600 font-bold hover:underline">Back to marketplace</button>
        </div>
    );

    return (
        <div className="pb-24">
            {/* Header / Breadcrumb */}
            <div className="bg-gray-50/50 dark:bg-gray-950/50 border-b border-gray-100 dark:border-gray-800 pt-32 pb-6 px-6 md:px-12">
                <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-400 hover:text-blue-600 transition-all font-bold text-[10px] uppercase tracking-widest mb-2 group text-left">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Browse
                        </button>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">{listing.title}</h1>
                        <div className="flex flex-wrap items-center gap-3 text-gray-500 dark:text-gray-400 font-medium text-xs">
                            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-blue-500" /> {listing.address || 'Regional'}</span>
                            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {listing.createdAt ? new Date(listing.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-blue-600 transition-all shadow-sm"><Share2 size={18} /></button>
                        <div className="h-10 border-l border-gray-200 dark:border-gray-800 mx-1 hidden md:block" />
                        <div className="text-right">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Asking Price</p>
                            <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight leading-none">₦{listing.price?.toLocaleString() || listing.price}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-6 md:px-12 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 xl:gap-12">
                    {/* Left Side: Visuals */}
                    <div className="space-y-6">
                        {/* Main Image View */}
                        <div className="relative group">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="rounded-3xl overflow-hidden bg-gray-50 dark:bg-gray-800/10 border border-gray-100 dark:border-gray-800 shadow-xl relative aspect-[16/10]"
                            >
                                <AnimatePresence mode='wait'>
                                    <motion.img
                                        key={currentImageIndex}
                                        src={listing.images[currentImageIndex]}
                                        alt={listing.title}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="w-full h-full object-cover"
                                    />
                                </AnimatePresence>

                                {/* Gallery Navigation */}
                                {listing.images.length > 1 && (
                                    <>
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                                            <button onClick={prevImage} className="w-10 h-10 bg-white/20 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-xl group/btn opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <ChevronLeft size={24} />
                                            </button>
                                        </div>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                                            <button onClick={nextImage} className="w-10 h-10 bg-white/20 backdrop-blur-xl border border-white/20 rounded-xl flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-xl group/btn opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                <ChevronRight size={24} />
                                            </button>
                                        </div>
                                    </>
                                )}

                                <div className="absolute top-6 left-6">
                                    <span className="bg-white/90 dark:bg-black/80 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase px-4 py-1.5 rounded-xl shadow-md dark:text-white border border-white/10">
                                        {listing.category}
                                    </span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Thumbnails Grid */}
                        {listing.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {listing.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`flex-shrink-0 w-20 aspect-square rounded-2xl overflow-hidden border-2 transition-all ${idx === currentImageIndex
                                            ? "border-blue-600 shadow-lg scale-95"
                                            : "border-transparent opacity-60 hover:opacity-100"
                                            }`}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Large Map Showcase */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-xl font-bold tracking-tight dark:text-white flex items-center gap-2">
                                <MapPin size={20} className="text-blue-500" /> Meeting Point
                            </h3>
                            <div className="h-[300px] bg-white dark:bg-gray-900/50 p-1 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-lg relative overflow-hidden group">
                                {listing.location ? (
                                    <MapContainer
                                        center={[listing.location.lat, listing.location.lng]}
                                        zoom={14}
                                        style={{ height: '100%', width: '100%', borderRadius: '1.5rem' }}
                                        dragging={true}
                                        scrollWheelZoom={false}
                                        zoomControl={false}
                                        className="z-0"
                                    >
                                        <TileLayer
                                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                            attribution='Tiles &copy; Esri'
                                        />
                                        <Marker position={[listing.location.lat, listing.location.lng]}></Marker>
                                    </MapContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-500 font-bold uppercase tracking-widest text-[10px] opacity-40">Local pickup preferred</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: High-Impact Panel */}
                    <div className="space-y-6">
                        {/* Highlights */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/20 space-y-1">
                                <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400" />
                                <h4 className="font-bold text-xs dark:text-white leading-none">Safe Seller</h4>
                                <p className="text-[10px] text-blue-800/60 font-bold uppercase tracking-wider">Verified</p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-2xl border border-green-100 dark:border-green-800/20 space-y-1">
                                <Zap size={20} className="text-green-600 dark:text-green-400" />
                                <h4 className="font-bold text-xs dark:text-white leading-none">Fast Reply</h4>
                                <p className="text-[10px] text-green-800/60 font-bold uppercase tracking-wider">Responsive</p>
                            </div>
                        </div>

                        {/* Description Panel */}
                        <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</h3>
                                <div className="text-base font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {listing.description}
                                </div>
                            </div>

                            {/* Defects/Condition Section */}
                            {listing.defects && (
                                <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20 space-y-2">
                                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                        <AlertCircle size={18} />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest">Reported Defects</h4>
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                        "{listing.defects}"
                                    </p>
                                </div>
                            )}

                            {/* Seller Action Point */}
                            <div className="pt-6 border-t border-gray-50 dark:border-gray-800">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                        {listing.userPhotoURL ? (
                                            <img src={listing.userPhotoURL} alt="Seller" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-gray-400">
                                                {(listing.userDisplayName || listing.userEmail || "?").charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white leading-none truncate">{listing.userDisplayName || listing.userEmail?.split('@')[0]}</p>
                                        <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase tracking-wider">Active today</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {currentUser?.uid !== listing.userId ? (
                                        <button
                                            onClick={handleStartChat}
                                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-95 text-base"
                                        >
                                            <MessageCircle size={20} />
                                            Send a message
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowDeleteModal(true)}
                                            className="w-full bg-red-50 dark:bg-red-900/10 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Trash2 size={16} />
                                            Remove Listing
                                        </button>
                                    )}
                                    <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-1">Safety first. Meet in public.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Delete Listing"
                message="Are you sure you want to remove this listing? This action cannot be undone."
                confirmText="Yes, Delete it"
                isDestructive={true}
                loading={deleting}
            />
        </div>
    );
}
