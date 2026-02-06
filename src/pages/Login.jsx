import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff, ShoppingBag, AlertCircle, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Input, Label } from "../components/animations/Input";
import { AuroraBackground } from "../components/animations/AuroraBackground";
import { Vortex } from "../components/animations/Vortex";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login, currentUser } = useAuth();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            navigate("/");
        }
    }, [currentUser, navigate]);

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setError("");
            setLoading(true);
            await login(email, password);
            navigate("/");
        } catch (error) {
            console.error("Login error:", error);
            setError("Invalid credentials. Please attempt again.");
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex bg-[#050505] overflow-hidden selection:bg-blue-500/30">
            {/* Left Side: High-Impact Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center border-r border-white/5">
                <Vortex className="opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-indigo-600/10" />

                <div className="z-10 text-center space-y-8 px-12">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-4"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                            <Sparkles size={12} /> Premium Marketplace
                        </div>
                        <h1 className="text-6xl font-black text-white tracking-tighter leading-tight">
                            The Future of <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 italic">Local Trading.</span>
                        </h1>
                        <p className="text-gray-400 font-medium text-lg max-w-md mx-auto leading-relaxed">
                            Access Africa's most sophisticated trading hub. Secure, fast, and beautifully crafted for your experience.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex items-center justify-center gap-12 pt-12"
                    >
                        <div className="text-center">
                            <p className="text-3xl font-black text-white">100%</p>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Encrypted</p>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <div className="text-center">
                            <p className="text-3xl font-black text-white">24/7</p>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Monitoring</p>
                        </div>
                    </motion.div>
                </div>

                {/* Floating Elements */}
                <div className="absolute bottom-12 left-12 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                        <ShieldCheck size={18} />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black text-white uppercase tracking-tight">Identity Secured</p>
                        <p className="text-[9px] font-medium text-gray-500 leading-none">Powered by Auth-Pro</p>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="flex-1 relative flex items-center justify-center p-6 lg:p-12 overflow-hidden">
                <AuroraBackground className="opacity-30" />

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="relative z-10 w-full max-w-[450px]"
                >
                    <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-[0_24px_80px_rgba(0,0,0,0.5)] relative group">
                        <div className="space-y-10">
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
                                    <h2 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">Welcome <span className="text-blue-500 italic">Back!</span></h2>
                                    <p className="text-gray-400 font-medium text-sm">Sign in to your premium dashboard</p>
                                </div>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-[11px] font-black uppercase tracking-widest"
                                >
                                    <AlertCircle size={18} /> {error}
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Identity/Email</Label>
                                        <div className="relative group/field">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/field:text-blue-500 transition-colors z-10" size={18} />
                                            <Input
                                                type="email"
                                                required
                                                className="pl-12 pr-4 py-4.5 bg-white/5 border-transparent focus:border-blue-500/50 rounded-2xl text-white font-bold placeholder:text-gray-700 transition-all shadow-inner"
                                                placeholder="your@email.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between ml-1">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Pass-Key</Label>
                                            <Link to="/forgot-password" size="sm" className="text-blue-500 hover:text-blue-400 text-[9px] font-black uppercase tracking-widest transition-colors">
                                                Forgot?
                                            </Link>
                                        </div>
                                        <div className="relative group/field">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/field:text-blue-500 transition-colors z-10" size={18} />
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                className="pl-12 pr-12 py-4.5 bg-white/5 border-transparent focus:border-blue-500/50 rounded-2xl text-white font-bold placeholder:text-gray-700 transition-all shadow-inner"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors z-10 p-1"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ y: -2, shadow: "0 20px 40px rgba(37,99,235,0.3)" }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-5 px-6 bg-white text-black hover:bg-blue-600 hover:text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl disabled:opacity-50 group/btn"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>Authorize Access <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" /></>
                                    )}
                                </motion.button>

                                <div className="text-center pt-4">
                                    <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">
                                        N3W TO THE HUB?{" "}
                                        <Link to="/register" className="text-white hover:text-blue-500 underline underline-offset-4 decoration-blue-500/50 transition-colors">
                                            Create Identity
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