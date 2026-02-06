import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';
import { FileUpload } from '../components/animations/FileUpload';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, LayersControl, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { DollarSign, Tag, Image as ImageIcon, MapPin, AlignLeft, Type, Loader, Crosshair, ArrowRight, UploadCloud, AlertCircle } from 'lucide-react';
import { Input, Label, Textarea, Select } from "../components/animations/Input";
import emailjs from '@emailjs/browser';

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


// Component to programmatically move map
function RecenterAutomatically({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.flyTo([lat, lng], 13);
        }
    }, [lat, lng, map]);
    return null;
}

export default function CreateListing() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [locating, setLocating] = useState(false);
    const [accuracy, setAccuracy] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        defects: "",
        price: "",
        category: "General",
    });
    const [imageUrls, setImageUrls] = useState([]);
    const [location, setLocation] = useState(null); // { lat, lng }
    const [address, setAddress] = useState("");

    // Default center (e.g., London)
    const [mapCenter, setMapCenter] = useState([51.505, -0.09]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const fetchAddress = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();
            if (data && data.display_name) {
                setAddress(data.display_name);
            } else {
                setAddress("Address not found");
            }
        } catch (error) {
            console.error("Error fetching address:", error);
            setAddress("Error fetching address");
        }
    };

    function LocationMarker({ position, setPosition, accuracy, address }) {
        useMapEvents({
            click(e) {
                setPosition(e.latlng);
                setAccuracy(null); // Clear accuracy radius on manual click
                fetchAddress(e.latlng.lat, e.latlng.lng);
            },
        });

        return position === null ? null : (
            <>
                <Marker position={position}>
                    {address && (
                        <Popup minWidth={90}>
                            <span className="font-bold text-blue-600">Verified Location</span><br />
                            {address}
                        </Popup>
                    )}
                </Marker>
                {accuracy && (
                    <Circle
                        center={position}
                        radius={accuracy}
                        pathOptions={{
                            fillColor: '#3b82f6',
                            fillOpacity: 0.15,
                            color: '#3b82f6',
                            weight: 1,
                            dashArray: '5, 5'
                        }}
                    />
                )}
            </>
        );
    }

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setLocation({ lat: latitude, lng: longitude });
                setAccuracy(accuracy);
                setMapCenter([latitude, longitude]);
                fetchAddress(latitude, longitude);
                setLocating(false);
            },
            (err) => {
                console.error(err);
                setError("Unable to retrieve your location. Please check your permissions.");
                setLocating(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation for Minimum 3 Images
        if (imageUrls.length < 3) {
            return setError(`Please upload at least 3 images. You have only uploaded ${imageUrls.length}.`);
        }

        if (!location) return setError("Please select a location on the map.");

        setLoading(true);
        setError("");

        try {
            await addDoc(collection(db, "listings"), {
                ...formData,
                price: Number(formData.price),
                imageUrls,
                imageUrl: imageUrls[0],
                location: { lat: location.lat, lng: location.lng },
                address: address,
                userId: currentUser.uid,
                userEmail: currentUser.email,
                userDisplayName: currentUser.displayName || currentUser.email.split('@')[0], // Save display name
                userPhotoURL: currentUser.photoURL || null, // Save profile picture
                createdAt: serverTimestamp(),
            });

            // --- NEWSLETTER NOTIFICATION SIMULATION ---
            // In a real app with EmailJS, you would fetch subscribers and trigger send
            try {
                const subscribersSnapshot = await getDocs(collection(db, "subscribers"));
                const subscriberCount = subscribersSnapshot.size;

                if (subscriberCount > 0) {
                    // Send to EACH subscriber (Note: EmailJS Free tier has limits, so be careful with loops)
                    subscribersSnapshot.docs.forEach((doc) => {
                        const subData = doc.data();
                        // Send email to subscriber
                        emailjs.send(
                            "service_jvxaw3m",
                            "template_rrqm5tl",
                            {
                                to_email: subData.email,
                                item_title: formData.title,
                                item_price: formData.price,
                                item_category: formData.category,
                                item_link: window.location.origin
                            },
                            "DI7a1vO-5XVQKcNua" // Public Key
                        ).then(
                            // Notification sent
                        );
                    });

                }
            } catch (err) {
                console.error("Error notifying subscribers:", err);
            }
            // -------------------------------------------

            navigate("/");
        } catch (err) {
            console.error("Error adding document: ", err);
            setError("Failed to create listing.");
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-[#0a0a0b] pb-20 pt-32 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-12 text-center md:text-left relative">
                    <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter mb-4 relative z-10"
                    >
                        List an <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Item.</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-500 dark:text-gray-400 text-lg font-medium max-w-xl"
                    >
                        Share your items with the community. Create a stunning listing in seconds.
                    </motion.p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* LEFT COLUMN: Input Fields */}
                        <div className="flex-1 space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl shadow-blue-500/5 border border-white/20 dark:border-gray-800 space-y-8"
                            >
                                <div className="space-y-6">
                                    <div className="relative group">
                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">Title</Label>
                                        <div className="relative group">
                                            <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors z-10" size={20} />
                                            <Input
                                                type="text"
                                                name="title"
                                                required
                                                className="pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/40 border-gray-200 dark:border-gray-800 rounded-xl focus:ring-blue-500/50 focus:border-blue-500 font-bold text-lg text-gray-900 dark:text-white placeholder:font-normal placeholder:text-gray-400"
                                                placeholder="e.g. vintage camera lens"
                                                value={formData.title}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">Description</Label>
                                        <div className="relative group">
                                            <AlignLeft className="absolute left-4 top-6 text-gray-400 group-focus-within:text-blue-500 transition-colors z-10" size={20} />
                                            <Textarea
                                                name="description"
                                                required
                                                rows={5}
                                                className="pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/40 border-gray-200 dark:border-gray-800 rounded-xl focus:ring-blue-500/50 focus:border-blue-500 font-medium text-gray-900 dark:text-white placeholder:font-normal placeholder:text-gray-400 min-h-[120px]"
                                                placeholder="Tell buyers what makes your item special..."
                                                value={formData.description}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">Item Condition & Defects (Optional)</Label>
                                        <div className="relative group">
                                            <AlertCircle className="absolute left-4 top-4 text-gray-400 group-focus-within:text-amber-500 transition-colors z-10" size={20} />
                                            <Textarea
                                                name="defects"
                                                rows={3}
                                                className="pl-12 pr-4 py-4 bg-amber-50/5 dark:bg-amber-900/5 border-gray-200 dark:border-gray-800 rounded-xl focus:ring-amber-500/50 focus:border-amber-500 font-medium text-gray-900 dark:text-white placeholder:font-normal placeholder:text-gray-400 min-h-[80px]"
                                                placeholder="List any scratches, broken parts, or issues here to inform buyers..."
                                                value={formData.defects}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="relative group">
                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">Price</Label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors font-black text-lg z-10">₦</div>
                                                <Input
                                                    type="number"
                                                    name="price"
                                                    required
                                                    min="0"
                                                    step="0.01"
                                                    className="pl-12 pr-4 py-4 bg-gray-50 dark:bg-black/40 border-gray-200 dark:border-gray-800 rounded-xl focus:ring-green-500/50 focus:border-green-500 font-bold text-lg text-gray-900 dark:text-white placeholder:font-normal placeholder:text-gray-400"
                                                    placeholder="0.00"
                                                    value={formData.price}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="relative group">
                                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">Category</Label>
                                            <div className="relative group">
                                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors z-10" size={20} />
                                                <Select
                                                    name="category"
                                                    className="pl-12 pr-10 py-4 bg-gray-50 dark:bg-black/40 border-gray-200 dark:border-gray-800 rounded-xl focus:ring-blue-500/50 focus:border-blue-500 font-bold text-gray-900 dark:text-white h-auto"
                                                    value={formData.category}
                                                    onChange={handleChange}
                                                >
                                                    {["General", "Electronics", "Furniture", "Clothing", "Vehicles", "Books", "Services", "Other"].map(opt => (
                                                        <option key={opt} value={opt} className="bg-white dark:bg-gray-900">{opt}</option>
                                                    ))}
                                                </Select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                                    <ArrowRight className="rotate-90 text-gray-400" size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white dark:bg-gray-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl shadow-blue-500/5 border border-white/20 dark:border-gray-800"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                                        <UploadCloud size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Upload Photos</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Add at least 3 photos (Cover first)</p>
                                    </div>
                                </div>
                                <div className="w-full mx-auto min-h-96 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-3xl">
                                    <FileUpload onUploadComplete={setImageUrls} />
                                </div>
                            </motion.div>
                        </div>

                        {/* RIGHT COLUMN: Map & Submit */}
                        <div className="w-full lg:w-[450px] space-y-8">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white dark:bg-gray-900/80 backdrop-blur-xl p-2 rounded-[2.5rem] shadow-xl shadow-blue-500/5 border border-white/20 dark:border-gray-800 h-[500px] flex flex-col relative"
                            >
                                <div className="absolute top-6 left-6 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg flex items-center gap-2">
                                    <MapPin size={16} className="text-red-500" />
                                    <span className="text-xs font-bold text-gray-900 dark:text-white">Location Required</span>
                                </div>

                                <div className="flex-1 rounded-[2rem] overflow-hidden relative z-0">
                                    <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                                        <LayersControl position="bottomright">
                                            <LayersControl.BaseLayer checked name="Satellite">
                                                <TileLayer
                                                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                                    attribution='&copy; Esri'
                                                />
                                            </LayersControl.BaseLayer>
                                            <LayersControl.BaseLayer name="Street">
                                                <TileLayer
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    attribution='&copy; OpenStreetMap'
                                                />
                                            </LayersControl.BaseLayer>
                                        </LayersControl>
                                        <LocationMarker position={location} setPosition={setLocation} accuracy={accuracy} address={address} />
                                        <RecenterAutomatically lat={location?.lat} lng={location?.lng} />
                                    </MapContainer>

                                    {/* Action Buttons Overlay */}
                                    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
                                        <button
                                            onClick={handleUseCurrentLocation}
                                            disabled={locating}
                                            type="button"
                                            className="w-12 h-12 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center hover:scale-105 transition-transform active:scale-95 disabled:opacity-50"
                                            title="Use Current Location"
                                        >
                                            {locating ? <Loader size={20} className="animate-spin" /> : <Crosshair size={20} />}
                                        </button>
                                    </div>

                                    {location && (
                                        <div className="absolute top-4 right-4 left-auto max-w-[200px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl z-[1000]">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Selected</span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                                                {address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-bold border border-red-100 dark:border-red-900/30 flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0">!</div>
                                    {error}
                                </motion.div>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmit}
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-6 px-8 rounded-3xl shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 text-xl relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                {loading ? <Loader className="animate-spin" size={24} /> : "Publish Listing"}
                                {!loading && <ArrowRight size={24} />}
                            </motion.button>
                        </div>
                    </div>
                </form >
            </div >
        </div >

    );
}
