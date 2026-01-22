import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/ImageUpload';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, LayersControl, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { DollarSign, Tag, Image as ImageIcon, MapPin, AlignLeft, Type, Loader, Crosshair } from 'lucide-react';

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
                timeout: 5000,
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
            navigate("/");
        } catch (err) {
            console.error("Error adding document: ", err);
            setError("Failed to create listing.");
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sell an Item</h1>
                <p className="text-gray-500 dark:text-gray-400">Reach buyers in your community.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Form Section */}
                <div className="flex-1 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-4 transition-colors"
                    >
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                <Type size={16} /> Title
                            </label>
                            <input
                                type="text"
                                name="title"
                                required
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                                placeholder="What are you selling?"
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                <AlignLeft size={16} /> Description
                            </label>
                            <textarea
                                name="description"
                                required
                                rows="4"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-gray-900 dark:text-white"
                                placeholder="Describe the condition, features, etc..."
                                value={formData.description}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    ₦ Price
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                                    placeholder="0.00"
                                    value={formData.price}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    <Tag size={16} /> Category
                                </label>
                                <select
                                    name="category"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-900 dark:text-white"
                                    value={formData.category}
                                    onChange={handleChange}
                                >
                                    {["General", "Electronics", "Furniture", "Clothing", "Vehicles", "Books", "Services", "Other"].map(opt => (
                                        <option key={opt} value={opt} className="bg-white dark:bg-gray-900">{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors"
                    >
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
                            <ImageIcon size={16} /> Photos
                        </div>
                        <ImageUpload onUploadComplete={setImageUrls} />
                    </motion.div>
                </div>

                {/* Map Section */}
                <div className="w-full lg:w-1/3 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 h-96 flex flex-col transition-colors"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                <MapPin size={16} /> Location
                            </div>
                            <button
                                onClick={handleUseCurrentLocation}
                                disabled={locating}
                                type="button"
                                className="text-xs flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md font-bold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                            >
                                {locating ? <Loader size={12} className="animate-spin" /> : <Crosshair size={12} />}
                                Use Current Location
                            </button>
                        </div>

                        <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative z-0">
                            <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                                <LayersControl position="topright">
                                    <LayersControl.BaseLayer checked name="Satellite (Realistic)">
                                        <TileLayer
                                            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                                        />
                                    </LayersControl.BaseLayer>
                                    <LayersControl.BaseLayer name="Street Map">
                                        <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        />
                                    </LayersControl.BaseLayer>
                                </LayersControl>
                                <LocationMarker position={location} setPosition={setLocation} accuracy={accuracy} address={address} />
                                <RecenterAutomatically lat={location?.lat} lng={location?.lng} />
                            </MapContainer>
                            {location && (
                                <div className="absolute bottom-2 left-2 right-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur px-4 py-3 rounded-xl text-xs shadow-2xl border border-gray-200 dark:border-gray-700 z-[1000] space-y-2 transition-all">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-1.5 font-mono text-gray-500 dark:text-gray-400">
                                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                        </div>
                                        <span className="text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
                                            Pinned
                                        </span>
                                    </div>
                                    {address && (
                                        <p className="text-gray-900 dark:text-white font-medium leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-2">
                                            {address}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30">{error}</div>}

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading && <Loader className="animate-spin" size={20} />}
                        {loading ? "Publishing..." : "Publish Listing"}
                    </button>
                </div>
            </div>
        </div>

    );
}
