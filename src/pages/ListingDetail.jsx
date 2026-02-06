import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, Trash2, ArrowLeft, MapPin, Calendar, ChevronLeft, ChevronRight, Share2, ShieldCheck, Zap, BadgeCheck, Flame, AlertCircle } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { DirectionAwareHover } from '../components/animations/DirectionAwareHover';
import { HoverBorderGradient } from '../components/animations/HoverBorderGradient';
import { MultiStepLoader } from '../components/animations/Loader';

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

    const loadingStates = [
        { text: "Locating listing..." },
        { text: "Fetching details..." },
        { text: "Loading gallery..." },
        { text: "Verifying seller..." },
        { text: "Ready!" },
    ];

    if (loading) return (
        <MultiStepLoader loadingStates={loadingStates} loading={loading} duration={1000} />
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
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">{listing.title}</h1>
                            <div className="flex flex-wrap items-center gap-2">
                                {listing.isFeatured && (!listing.featuredExpiry || listing.featuredExpiry.toDate() > new Date()) && (
                                    <div className="relative group/feat">
                                        <span className="relative bg-black/60 backdrop-blur-xl text-[9px] font-black text-white uppercase tracking-widest px-3 py-2 rounded-xl border border-white/20 shadow-xl group-hover/feat:scale-105 transition-transform flex items-center gap-1.5">
                                            <ShieldCheck size={14} className="text-blue-400 fill-blue-400/10" /> Featured
                                        </span>
                                    </div>
                                )}
                                {listing.isUrgent && (!listing.urgentExpiry || listing.urgentExpiry.toDate() > new Date()) && (
                                    <div className="relative group/urg">
                                        <span className="relative bg-red-600/90 backdrop-blur-xl text-[9px] font-black text-white uppercase tracking-widest px-3 py-2 rounded-xl border border-white/20 shadow-xl animate-pulse group-hover/urg:scale-105 transition-transform flex items-center gap-1.5">
                                            <Zap size={14} className="fill-white" /> Urgent Deal
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
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

            {/* Main Content Grid */}
            <div className="max-w-[1200px] mx-auto px-6 md:px-12 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 xl:gap-16">
                    {/* Left Column: Premium Gallery & Specs */}
                    <div className="space-y-12">
                        {/* BENTO GRID GALLERY */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]">
                            {/* Primary Image - Large Slot */}
                            <div className="md:col-span-4 md:row-span-2 relative group rounded-[2.5rem] overflow-hidden bg-gray-50 dark:bg-gray-800/10 border border-gray-100 dark:border-white/5">
                                <DirectionAwareHover
                                    imageUrl={listing.images[currentImageIndex]}
                                    className="w-full h-full"
                                    imageClassName="object-contain"
                                >
                                    <div className="space-y-2 pointer-events-auto">
                                        <div className="bg-white/90 dark:bg-black/80 backdrop-blur-md text-[10px] font-black uppercase px-4 py-1.5 rounded-xl shadow-md dark:text-white border border-white/10 w-fit">
                                            {listing.category}
                                        </div>
                                        <p className="font-extrabold text-2xl tracking-tight">{listing.title}</p>
                                    </div>

                                    {/* Navigation Arrows embedded in Hover Content */}
                                    {listing.images.length > 1 && (
                                        <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
                                            <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="w-12 h-12 pointer-events-auto bg-black/20 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-2xl">
                                                <ChevronLeft size={24} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="w-12 h-12 pointer-events-auto bg-black/20 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-2xl">
                                                <ChevronRight size={24} />
                                            </button>
                                        </div>
                                    )}
                                </DirectionAwareHover>
                            </div>

                            {/* Secondary Slot 1 */}
                            {listing.images[1] && (
                                <div
                                    onClick={() => setCurrentImageIndex(1)}
                                    className="md:col-span-2 md:row-span-1 cursor-pointer rounded-3xl overflow-hidden border border-white/5 group hover:border-blue-500/30 transition-all"
                                >
                                    <img
                                        src={listing.images[1]}
                                        alt=""
                                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${currentImageIndex === 1 ? 'opacity-40 animate-pulse' : 'opacity-100'}`}
                                    />
                                </div>
                            )}

                            {/* Secondary Slot 2 */}
                            {listing.images[2] && (
                                <div
                                    onClick={() => setCurrentImageIndex(2)}
                                    className="md:col-span-1 md:row-span-1 cursor-pointer rounded-3xl overflow-hidden border border-white/5 group hover:border-blue-500/30 transition-all"
                                >
                                    <img
                                        src={listing.images[2]}
                                        alt=""
                                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${currentImageIndex === 2 ? 'opacity-40 animate-pulse' : 'opacity-100'}`}
                                    />
                                </div>
                            )}

                            {/* More Photos Slot */}
                            {listing.images.length > 3 && (
                                <div
                                    onClick={() => setCurrentImageIndex(3)}
                                    className="md:col-span-1 md:row-span-1 cursor-pointer rounded-3xl overflow-hidden border border-white/5 group relative hover:border-blue-500/30 transition-all bg-gray-950"
                                >
                                    <img
                                        src={listing.images[3]}
                                        alt=""
                                        className={`w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700 ${currentImageIndex === 3 ? 'opacity-20 animate-pulse' : ''}`}
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-1">
                                        <span className="text-xl font-black">+{listing.images.length - 3}</span>
                                        <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Photos</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* DESCRIPTIVE SPECIFICATIONS */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-8 border-y border-gray-100 dark:border-white/5">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Category</span>
                                <p className="text-sm font-bold dark:text-gray-300">{listing.category}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Condition</span>
                                <p className="text-sm font-bold dark:text-gray-300 capitalize">{listing.defects ? 'Pre-owned' : 'Mint'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Listed On</span>
                                <p className="text-sm font-bold dark:text-gray-300">{listing.createdAt ? new Date(listing.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Listing ID</span>
                                <p className="text-sm font-bold font-mono dark:text-gray-300">#{listing.id.slice(-8).toUpperCase()}</p>
                            </div>
                        </div>

                        {/* Large Map Showcase */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-xl font-bold tracking-tight dark:text-white flex items-center gap-2">
                                <MapPin size={20} className="text-blue-500" /> Meeting Point
                            </h3>
                            <div className="h-[200px] md:h-[300px] bg-white dark:bg-gray-900/50 p-1 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-lg relative overflow-hidden group">
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
                            <div className={`p-4 rounded-2xl border space-y-1 transition-all ${listing.isVerified ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/20' : 'bg-gray-50 dark:bg-gray-800/10 border-gray-100 dark:border-gray-800/20 opacity-60'}`}>
                                <ShieldCheck size={20} className={listing.isVerified ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} />
                                <h4 className="font-bold text-xs dark:text-white leading-none">Safe Seller</h4>
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${listing.isVerified ? 'text-blue-800/60' : 'text-gray-400'}`}>
                                    {listing.isVerified ? 'Verified' : 'Standard'}
                                </p>
                            </div>
                            <div className={`p-4 rounded-2xl border space-y-1 transition-all ${(listing.isFeatured && (!listing.featuredExpiry || listing.featuredExpiry.toDate() > new Date())) ||
                                (listing.isUrgent && (!listing.urgentExpiry || listing.urgentExpiry.toDate() > new Date()))
                                ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/20 shadow-lg shadow-amber-500/5'
                                : 'bg-gray-50 dark:bg-gray-800/10 border-gray-100 dark:border-gray-800/20'}`}>
                                <Flame size={20} className={(listing.isFeatured || listing.isUrgent) ? 'text-amber-600 dark:text-amber-500 fill-current' : 'text-gray-400'} />
                                <h4 className="font-bold text-xs dark:text-white leading-none">Listing Rank</h4>
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${(listing.isFeatured || listing.isUrgent) ? 'text-amber-800/60' : 'text-gray-400'}`}>
                                    {listing.isUrgent ? 'Urgent' : (listing.isFeatured ? 'Boosted' : 'Normal')}
                                </p>
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
                                        <div className="flex items-center gap-1.5 leading-none mb-1">
                                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                                {listing.userDisplayName || listing.userEmail?.split('@')[0]}
                                            </p>
                                            {listing.isVerified && (
                                                <BadgeCheck size={16} className="text-blue-500 fill-blue-500/10 shrink-0" title="Verified Seller" />
                                            )}
                                        </div>
                                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Active today</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {currentUser?.uid !== listing.userId ? (
                                        <HoverBorderGradient
                                            as="button"
                                            containerClassName="rounded-2xl w-full"
                                            className="dark:bg-blue-600 bg-blue-600 w-full flex items-center justify-center gap-2 font-bold py-4"
                                            onClick={handleStartChat}
                                        >
                                            <MessageCircle size={20} />
                                            Send a message
                                        </HoverBorderGradient>
                                    ) : (
                                        <HoverBorderGradient
                                            as="button"
                                            containerClassName="rounded-2xl w-full"
                                            className="dark:bg-red-600 bg-red-600 w-full flex items-center justify-center gap-2 font-bold py-4"
                                            onClick={() => setShowDeleteModal(true)}
                                        >
                                            <Trash2 size={16} />
                                            Remove Listing
                                        </HoverBorderGradient>
                                    )}
                                    <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-1">Safety first. Meet in public.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* STICKY MOBILE ACTION BAR */}
            <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
                <AnimatePresence>
                    {!loading && listing && currentUser?.uid !== listing.userId && (
                        <motion.button
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            onClick={handleStartChat}
                            className="bg-blue-600 text-white font-black py-4.5 rounded-[1.5rem] shadow-[0_20px_40px_rgba(37,99,235,0.4)] flex items-center justify-center gap-3 w-full border border-white/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
                        >
                            <MessageCircle size={20} />
                            Send Message
                        </motion.button>
                    )}
                </AnimatePresence>
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
