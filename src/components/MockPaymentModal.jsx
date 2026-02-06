import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ShieldCheck,
    CreditCard,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Lock,
    Smartphone,
    ArrowRight
} from 'lucide-react';
import { db } from '../firebase';
import { Meteors } from './animations/Meteors';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export default function MockPaymentModal({ isOpen, onClose, type, data, onSuccess }) {
    const { currentUser } = useAuth();

    const [step, setStep] = useState('review'); // review | processing | success | error
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedTier, setSelectedTier] = useState(null);

    // Default Tiers
    const tiers = {
        featured: [
            { id: 'feat_7', label: '7 Days Boost', days: 7, price: 5000, desc: 'Keep your ad at the top of results for a full week.' },
            { id: 'feat_30', label: '30 Days Boost', days: 30, price: 15000, desc: 'Maximum visibility for a month with 2x more views.' }
        ],
        urgent: [
            { id: 'urg_3', label: '3 Days Urgent', days: 3, price: 2500, desc: 'A bright high-contrast label to sell your item fast.' },
            { id: 'urg_7', label: '7 Days Urgent', days: 7, price: 4500, desc: 'Extend your urgent status for a week of quick sales.' }
        ],
        verified: [
            { id: 'ver_lifetime', label: 'Life-time Badge', days: 9999, price: 15000, desc: 'Professional blue checkmark for your store profile.' }
        ]
    };

    // Auto-select first tier on open
    useEffect(() => {
        if (isOpen && type) {
            setSelectedTier(tiers[type][0]);
        }
    }, [isOpen, type]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('review');
            setIsProcessing(false);
        }
    }, [isOpen]);

    const currentAmount = selectedTier?.price || 0;
    const currentTitle = type === 'verified' ? 'Verified Seller' : (type === 'featured' ? 'Feature Listing' : 'Urgent Sale');

    const handlePayment = async () => {
        setIsProcessing(true);
        setStep('processing');

        // Simulate network delay
        setTimeout(async () => {
            try {
                // 1. Update the actual document (Automation)
                const now = new Date();
                const expiry = new Date(now.getTime() + (selectedTier.days * 24 * 60 * 60 * 1000));

                if (type === 'featured' && data?.id) {
                    await updateDoc(doc(db, "listings", data.id), {
                        isFeatured: true,
                        featuredExpiry: expiry,
                        lastBumpedAt: serverTimestamp()
                    });
                } else if (type === 'urgent' && data?.id) {
                    await updateDoc(doc(db, "listings", data.id), {
                        isUrgent: true,
                        urgentExpiry: expiry,
                        lastBumpedAt: serverTimestamp()
                    });
                } else if (type === 'verified') {
                    // Update user profile
                    await updateDoc(doc(db, "users", currentUser.uid), {
                        isVerified: true,
                        verifiedAt: serverTimestamp(),
                        verifiedType: selectedTier.id
                    });
                }

                // 2. Create Transaction Record
                await addDoc(collection(db, "transactions"), {
                    userId: currentUser.uid,
                    userEmail: currentUser.email,
                    userName: currentUser.displayName,
                    amount: currentAmount,
                    type: type,
                    tier: selectedTier.id,
                    itemId: data?.id || null,
                    itemTitle: data?.title || null,
                    status: 'completed',
                    createdAt: serverTimestamp()
                });

                // 3. Notify Admin (Internal Notification System)
                await addDoc(collection(db, "admin_notifications"), {
                    type: 'payment',
                    title: `New Payment: ₦${currentAmount.toLocaleString()}`,
                    message: `${currentUser.displayName} paid for ${currentTitle} (${selectedTier.label})`,
                    severity: 'success',
                    read: false,
                    createdAt: serverTimestamp(),
                    metadata: {
                        userId: currentUser.uid,
                        type: type,
                        amount: currentAmount
                    }
                });

                setStep('success');
                setIsProcessing(false);

                // Trigger callback after delay
                setTimeout(() => {
                    onSuccess?.();
                    onClose();
                }, 3000);

            } catch (error) {
                console.error("Payment Automation Error:", error);
                setStep('error');
                setIsProcessing(false);
            }
        }, 3000);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-white dark:bg-[#0a0a0b] rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden"
                >
                    {/* Header */}
                    <div className="relative p-8 pb-0 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-widest">
                            <ShieldCheck size={14} /> Secure Checkout
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    <div className="p-8">
                        {step === 'review' && (
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mb-2">Select <span className="text-blue-600">Package.</span></h2>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Choose the best visibility option for your listing.</p>
                                </div>

                                {/* Tier Selection */}
                                <div className="space-y-3">
                                    {(tiers[type] || []).map((tier) => (
                                        <button
                                            key={tier.id}
                                            onClick={() => setSelectedTier(tier)}
                                            className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center justify-between group ${selectedTier?.id === tier.id
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                : 'bg-white dark:bg-black/40 border-gray-100 dark:border-gray-800 hover:border-blue-500/30'}`}
                                        >
                                            <div className="flex-1">
                                                <p className={`font-bold text-sm ${selectedTier?.id === tier.id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{tier.label}</p>
                                                <p className={`text-[10px] mt-0.5 line-clamp-1 ${selectedTier?.id === tier.id ? 'text-blue-100' : 'text-gray-500'}`}>{tier.desc}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-black ${selectedTier?.id === tier.id ? 'text-white' : 'text-blue-600'}`}>₦{tier.price.toLocaleString()}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-gray-800 p-6 rounded-3xl space-y-4">
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-gray-400">Recipient</span>
                                        <span className="text-gray-900 dark:text-white">Mini Mart Ads</span>
                                    </div>
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-end">
                                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Amount</span>
                                        <span className="text-3xl font-black text-blue-600">₦{currentAmount.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-900/50">
                                        <Lock size={14} className="text-blue-500" />
                                        Payments are encrypted and simulated for testing.
                                    </div>

                                    <button
                                        onClick={handlePayment}
                                        disabled={!selectedTier}
                                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 transition-all active:scale-95 group"
                                    >
                                        Pay Successfully <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 'processing' && (
                            <div className="py-12 flex flex-col items-center text-center space-y-8">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse" />
                                    <Loader2 className="animate-spin text-blue-600 relative z-10" size={64} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Authenticating...</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Please do not close this window or refresh the page.</p>
                                </div>
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="py-12 flex flex-col items-center text-center space-y-8">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-green-500/40 relative"
                                >
                                    <Meteors number={10} className="fixed" />
                                    <CheckCircle2 size={40} className="relative z-10" />
                                </motion.div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Receipt <span className="text-green-500">Confirmed.</span></h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Your account has been updated automatically. Building the future of commerce!</p>
                                </div>
                                <div className="w-full bg-green-50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-100 dark:border-green-900/30">
                                    <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Transaction ID: MM-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                                </div>
                            </div>
                        )}

                        {step === 'error' && (
                            <div className="py-12 flex flex-col items-center text-center space-y-8">
                                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white">
                                    <AlertCircle size={40} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Transaction <span className="text-red-500">Aborted.</span></h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Something went wrong with the simulation. Please try again.</p>
                                </div>
                                <button
                                    onClick={() => setStep('review')}
                                    className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold"
                                >
                                    Retry Payment
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
