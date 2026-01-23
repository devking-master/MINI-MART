import React, { useMemo } from 'react';
import { useCall } from './context/CallContext';
import { Video, Phone, PhoneOff } from "lucide-react";
import { AnimatePresence, motion } from 'framer-motion';
import VideoCall from './components/VideoCall';
import { useAuth } from './context/AuthContext';

export default function GlobalCallUI() {
    const { currentUser } = useAuth();
    const { incomingCall, activeCall, inCall, callType, acceptCall, declineCall, endCall } = useCall();

    const targetUser = useMemo(() => {
        if (!activeCall || !currentUser) return null;
        return {
            uid: activeCall.callerId === currentUser.uid ? activeCall.calleeId : activeCall.callerId,
            name: activeCall.callerId === currentUser.uid ? activeCall.calleeName : activeCall.callerName
        };
    }, [activeCall, currentUser]);

    if (!currentUser) return null;

    return (
        <>
            {/* Incoming Call Modal */}
            <AnimatePresence>
                {incomingCall && !inCall && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center border border-gray-100 dark:border-gray-800"
                        >
                            <div className="w-24 h-24 mx-auto bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                {incomingCall.callType === 'video' ?
                                    <Video size={40} className="text-blue-600 dark:text-blue-400" /> :
                                    <Phone size={40} className="text-blue-600 dark:text-blue-400" />
                                }
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Incoming {incomingCall.callType === 'video' ? 'Video' : 'Audio'} Call
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-8">
                                from {incomingCall.callerName || 'Someone'}
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={declineCall}
                                    className="flex-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold py-4 rounded-2xl hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
                                >
                                    <PhoneOff size={20} /> Decline
                                </button>
                                <button
                                    onClick={acceptCall}
                                    className="flex-1 bg-green-500 text-white font-bold py-4 rounded-2xl hover:bg-green-600 transition-colors shadow-xl shadow-green-500/30 flex items-center justify-center gap-2 animate-pulse"
                                >
                                    <Phone size={20} /> Accept
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Video Call Overlay */}
            {inCall && activeCall && targetUser && (
                <VideoCall
                    chatId={activeCall.chatId}
                    currentUser={currentUser}
                    targetUser={targetUser}
                    callType={callType}
                    onClose={endCall}
                />
            )}
        </>
    );
}
