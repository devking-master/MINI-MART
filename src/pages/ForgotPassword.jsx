import React, { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, CheckCircle, ArrowLeft, ShoppingBag, AlertCircle, ShieldCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input, Label } from "../components/animations/Input";
import { AuroraBackground } from "../components/animations/AuroraBackground";
import { Vortex } from "../components/animations/Vortex";

export default function ForgotPassword() {
    const emailRef = useRef();
    const { resetPassword } = useAuth();
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setMessage("");
            setError("");
            setLoading(true);
            await resetPassword(emailRef.current.value);
            setMessage("Check your inbox for further instructions");
        } catch (error) {
            console.error("Reset password error:", error);
            setError("Failed to reset password. Please verify your email.");
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex bg-[#050505] overflow-hidden selection:bg-blue-500/30">
            {/* Left Side: High-Impact Visual */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center border-r border-white/5">
                <Vortex className="opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-bl from-teal-600/20 via-transparent to-blue-600/10" />

                <div className="z-10 text-center space-y-8 px-12">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-4"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                            <ShieldCheck size={12} /> Secure Recovery
                        </div>
                        <h1 className="text-6xl font-black text-white tracking-tighter leading-tight">
                            Restore Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500 italic">Access.</span>
                        </h1>
                        <p className="text-gray-400 font-medium text-lg max-w-md mx-auto leading-relaxed">
                            Don't worry, your assets are safe. Follow the verification steps to regain control of your dashboard.
                        </p>
                    </motion.div>

                    <div className="flex items-center justify-center gap-4 text-white/20">
                        <ShieldCheck size={40} strokeWidth={1} />
                        <div className="w-12 h-px bg-white/10" />
                        <Mail size={40} strokeWidth={1} />
                        <div className="w-12 h-px bg-white/10" />
                        <CheckCircle size={40} strokeWidth={1} />
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
                                    className="inline-flex lg:hidden items-center justify-center w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-2xl mb-4"
                                >
                                    <ShoppingBag size={28} />
                                </motion.div>
                                <div>
                                    <h2 className="text-4xl font-black text-white tracking-tighter leading-none mb-2">Forgot <span className="text-teal-500 italic">Key?</span></h2>
                                    <p className="text-gray-400 font-medium text-sm">Enter identity for recovery instructions</p>
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-[11px] font-black uppercase tracking-widest"
                                    >
                                        <AlertCircle size={18} /> {error}
                                    </motion.div>
                                )}
                                {message && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center gap-3 text-teal-400 text-[11px] font-black uppercase tracking-widest"
                                    >
                                        <CheckCircle size={18} /> {message}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Identity/Email</Label>
                                        <div className="relative group/field">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within/field:text-teal-500 transition-colors z-10" size={18} />
                                            <Input
                                                ref={emailRef}
                                                type="email"
                                                required
                                                className="pl-12 pr-4 py-4.5 bg-white/5 border-transparent focus:border-teal-500/50 rounded-2xl text-white font-bold placeholder:text-gray-700 transition-all shadow-inner"
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ y: -2, shadow: "0 20px 40px rgba(20,184,166,0.3)" }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-5 px-6 bg-white text-black hover:bg-teal-600 hover:text-white rounded-[1.8rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl disabled:opacity-50 group/btn"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>Request Recovery <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" /></>
                                    )}
                                </motion.button>

                                <div className="text-center pt-4">
                                    <Link to="/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-white font-black text-[10px] uppercase tracking-widest transition-colors group/back text-left">
                                        <ArrowLeft size={16} className="group-hover/back:-translate-x-1 transition-transform" /> Auth Portal
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
