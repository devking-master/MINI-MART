import React, { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, ShoppingBag, AlertCircle, ShieldCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input, Label } from "../components/animations/Input";
import { AuroraBackground } from "../components/animations/AuroraBackground";
import { Vortex } from "../components/animations/Vortex";

export default function Register() {
    const emailRef = useRef();
    const usernameRef = useRef();
    const passwordRef = useRef();
    const passwordConfirmRef = useRef();
    const { signup, updateUserProfile } = useAuth();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        if (passwordRef.current.value !== passwordConfirmRef.current.value) {
            return setError("Passwords do not match");
        }

        try {
            setError("");
            setLoading(true);

            const username = usernameRef.current.value;
            const email = emailRef.current.value;

            // Check if username already exists
            const q = query(collection(db, "users"), where("username", "==", username));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                setLoading(false);
                return setError("Username is already taken");
            }

            const userCredential = await signup(email, passwordRef.current.value);

            await setDoc(doc(db, "users", userCredential.user.uid), {
                username: username,
                email: email,
                createdAt: new Date()
            });

            await updateUserProfile({
                displayName: username
            });

            navigate("/");
        } catch (error) {
            console.error("Registration error:", error);
            if (error.code === 'auth/email-already-in-use') {
                setError("Email is already currently in use");
            } else {
                setError("Failed to create an account");
            }
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex bg-[#050505] overflow-hidden selection:bg-blue-500/30">
            {/* Left Side: High-Impact Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center border-r border-white/5">
                <Vortex className="opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-blue-600/10" />

                <div className="z-10 text-center space-y-8 px-12">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-4"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                            <Sparkles size={12} /> Join the Revolution
                        </div>
                        <h1 className="text-6xl font-black text-white tracking-tighter leading-tight">
                            Build Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500 italic">Financial Future.</span>
                        </h1>
                        <p className="text-gray-400 font-medium text-lg max-w-md mx-auto leading-relaxed">
                            Join thousands of traders in a marketplace designed for speed, beauty, and absolute transparency.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center justify-center gap-12 pt-12"
                    >
                        <div className="text-center">
                            <p className="text-3xl font-black text-white">5k+</p>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Active Sellers</p>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <div className="text-center">
                            <p className="text-3xl font-black text-white">2.5s</p>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Listing Speed</p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="flex-1 relative flex items-center justify-center p-6 lg:p-12 overflow-hidden">
                <AuroraBackground className="opacity-30" />

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative z-10 w-full max-w-[500px]"
                >
                    <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-[0_24px_80px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                        <div className="space-y-8">
                            {/* Header */}
                            <div className="text-center md:text-left space-y-4">
                                <motion.div
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="inline-flex lg:hidden items-center justify-center w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-2xl mb-4"
                                >
                                    <ShoppingBag size={28} />
                                </motion.div>
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter leading-none mb-2">Create <span className="text-indigo-500 italic">Identity.</span></h2>
                                    <p className="text-gray-400 font-medium text-sm">Join the elite marketplace network</p>
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-[10px] font-black uppercase tracking-widest"
                                    >
                                        <AlertCircle size={18} /> {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Universal Username</Label>
                                        <div className="relative group/field">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/field:text-indigo-500 transition-colors z-10" size={18} />
                                            <Input
                                                ref={usernameRef}
                                                type="text"
                                                required
                                                className="pl-12 pr-4 py-4 bg-white/5 border-transparent focus:border-indigo-500/50 rounded-2xl text-white font-bold placeholder:text-gray-700 transition-all shadow-inner"
                                                placeholder="johndoe"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Communication/Email</Label>
                                        <div className="relative group/field">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/field:text-indigo-500 transition-colors z-10" size={18} />
                                            <Input
                                                ref={emailRef}
                                                type="email"
                                                required
                                                className="pl-12 pr-4 py-4 bg-white/5 border-transparent focus:border-indigo-500/50 rounded-2xl text-white font-bold placeholder:text-gray-700 transition-all shadow-inner"
                                                placeholder="you@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Password</Label>
                                            <div className="relative group/field">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/field:text-indigo-500 transition-colors z-10" size={18} />
                                                <Input
                                                    ref={passwordRef}
                                                    type={showPassword ? "text" : "password"}
                                                    required
                                                    className="pl-12 pr-12 py-4 bg-white/5 border-transparent focus:border-indigo-500/50 rounded-2xl text-white font-bold placeholder:text-gray-700 transition-all shadow-inner"
                                                    placeholder="••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors z-10"
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Repeat</Label>
                                            <div className="relative group/field">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/field:text-indigo-500 transition-colors z-10" size={18} />
                                                <Input
                                                    ref={passwordConfirmRef}
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    required
                                                    className="pl-12 pr-12 py-4 bg-white/5 border-transparent focus:border-indigo-500/50 rounded-2xl text-white font-bold placeholder:text-gray-700 transition-all shadow-inner"
                                                    placeholder="••••••"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors z-10"
                                                >
                                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ y: -2, shadow: "0 20px 40px rgba(79,70,229,0.3)" }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-5 px-6 bg-white text-black hover:bg-indigo-600 hover:text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl disabled:opacity-50 group/btn"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>Begin Journey <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" /></>
                                    )}
                                </motion.button>

                                <div className="text-center pt-4">
                                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">
                                        HAV3 AN IDENTITY?{" "}
                                        <Link to="/login" className="text-white hover:text-indigo-500 underline underline-offset-4 decoration-indigo-500/50 transition-colors">
                                            Authorize Access
                                        </Link>
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
