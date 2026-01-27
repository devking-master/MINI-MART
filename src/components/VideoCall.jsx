import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc, addDoc, collection, getDoc, serverTimestamp, increment, query, orderBy } from 'firebase/firestore';
import { Video, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react';
import Peer from 'simple-peer';

// ICE Servers configuration
const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
];

export default function VideoCall({ chatId, currentUser, targetUser, callType = 'video', isCaller: amInitiatorProp, onClose }) {
    const [status, setStatus] = useState("initializing"); // initializing, calling, connected
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
    const [isCaller, setIsCaller] = useState(amInitiatorProp);
    const [hasRemoteStream, setHasRemoteStream] = useState(false);

    const localVideoRef = useRef();
    const remoteVideoRef = useRef();

    const peerRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);

    useEffect(() => {
        let canceled = false;
        let unsubCall = null;
        let unsubSignals = null;

        const initPeer = async () => {
            const constraints = {
                audio: true,
                video: callType === 'video'
            };

            try {
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (canceled) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                localStreamRef.current = stream;
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;

                const callDocRef = doc(db, "chats", chatId, "calls", "active_call");
                const callerSignals = collection(callDocRef, "callerSignals");
                const calleeSignals = collection(callDocRef, "calleeSignals");

                // Use the prop to determine if we are the initiator
                // This avoids async race conditions with getDoc
                const amInitiator = amInitiatorProp;

                const peer = new Peer({
                    initiator: amInitiator,
                    trickle: true,
                    stream: stream,
                    config: { iceServers }
                });

                peerRef.current = peer;

                peer.on('signal', async (data) => {
                    if (canceled) return;
                    const signalColl = amInitiator ? callerSignals : calleeSignals;
                    await addDoc(signalColl, {
                        signal: JSON.stringify(data),
                        timestamp: serverTimestamp()
                    });
                });

                peer.on('stream', (remoteStream) => {
                    console.log("Remote stream received");
                    remoteStreamRef.current = remoteStream;
                    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
                    setHasRemoteStream(true);
                    setStatus("connected");
                });

                peer.on('error', err => {
                    console.error("Peer error:", err);
                    // Don't close immediately on non-fatal errors, but for SDP mismatch we might have to
                });

                peer.on('close', () => onClose());

                if (amInitiator) {
                    setStatus("calling");
                    // Create call doc
                    await setDoc(callDocRef, {
                        callerId: currentUser.uid,
                        callerName: currentUser.displayName || currentUser.email.split('@')[0],
                        calleeId: targetUser.uid,
                        calleeName: targetUser.name,
                        callType,
                        status: "offering",
                        createdAt: serverTimestamp()
                    });

                    // Listen for callee signals
                    unsubSignals = onSnapshot(query(calleeSignals, orderBy("timestamp", "asc")), (snapshot) => {
                        snapshot.docChanges().forEach(change => {
                            if (change.type === 'added') {
                                const data = JSON.parse(change.doc.data().signal);
                                peer.signal(data);
                            }
                        });
                    });
                } else {
                    setStatus("connecting");
                    // Listen for caller signals
                    unsubSignals = onSnapshot(query(callerSignals, orderBy("timestamp", "asc")), (snapshot) => {
                        snapshot.docChanges().forEach(change => {
                            if (change.type === 'added') {
                                const data = JSON.parse(change.doc.data().signal);
                                peer.signal(data);
                            }
                        });
                    });
                }

                // Listen for call deletion (hangup)
                unsubCall = onSnapshot(callDocRef, (snap) => {
                    if (!snap.exists()) onClose();
                });

            } catch (err) {
                console.error("Call initialization failed:", err);
                onClose();
            }
        };

        initPeer();

        return () => {
            canceled = true;
            if (peerRef.current) peerRef.current.destroy();
            if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop());
            if (unsubCall) unsubCall();
            if (unsubSignals) unsubSignals();
        };
    }, [chatId, currentUser.uid, currentUser.displayName, currentUser.email, targetUser.uid, targetUser.name, callType, onClose, amInitiatorProp]);

    const toggleMute = () => {
        if (localStreamRef.current) {
            const enabled = !isMuted;
            setIsMuted(enabled);
            localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !enabled);
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const enabled = !isVideoOff;
            setIsVideoOff(enabled);
            localStreamRef.current.getVideoTracks().forEach(track => track.enabled = !enabled);
        }
    };

    const handleEndCall = async () => {
        if (isCaller && status === 'calling') {
            try {
                // Log missed call
                await addDoc(collection(db, "chats", chatId, "messages"), {
                    text: `Missed ${callType} call`,
                    senderId: currentUser.uid,
                    isSystemMessage: true,
                    timestamp: serverTimestamp()
                });

                await updateDoc(doc(db, "chats", chatId), {
                    lastMessage: `Missed ${callType} call`,
                    lastMessageSenderId: currentUser.uid,
                    lastMessageTimestamp: serverTimestamp(),
                    [`unreadCounts.${targetUser.uid}`]: increment(1)
                });
            } catch (error) {
                console.error("Error logging missed call:", error);
            }
        }

        try {
            await deleteDoc(doc(db, "chats", chatId, "calls", "active_call"));
        } catch (_e) { /* empty catch */ }

        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-gray-900 text-white overflow-hidden">
            <div className="absolute inset-0 w-full h-full">
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full object-cover transition-opacity duration-1000 ${(hasRemoteStream && callType === 'video') ? 'opacity-100' : 'opacity-0'}`}
                />

                {(!hasRemoteStream || callType === 'audio') && (
                    <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40" />

                        {/* Status ring for audio calls */}
                        {hasRemoteStream && callType === 'audio' && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-64 h-64 rounded-full border border-blue-500/30 animate-[ping_3s_ease-out_infinite]" />
                                <div className="w-80 h-80 rounded-full border border-blue-500/20 animate-[ping_4s_ease-out_infinite]" />
                            </div>
                        )}

                        <div className="relative z-10 mb-8">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl bg-gray-800 flex items-center justify-center text-4xl font-bold">
                                {targetUser.name?.[0]?.toUpperCase()}
                                {remoteStreamRef.current && (
                                    <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />
                                )}
                            </div>
                            {!hasRemoteStream && (
                                <div className="absolute inset-0 -z-10 rounded-full border border-white/20 scale-125 animate-[ping_2s_ease-out_infinite]" />
                            )}
                        </div>
                        <div className="relative z-10 text-center space-y-2">
                            <h2 className="text-3xl font-bold">{targetUser.name}</h2>
                            <p className="text-lg text-blue-200 font-medium">
                                {!hasRemoteStream ?
                                    (status === 'calling' ? 'Calling...' : 'Connecting...') :
                                    (callType === 'audio' ? 'Voice Call Connected' : 'Video Connecting...')
                                }
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {status === 'connected' && (
                <div className="absolute top-0 left-0 right-0 p-6 pt-12 bg-gradient-to-b from-black/70 to-transparent z-20 flex justify-between items-start pointer-events-none">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700/50 backdrop-blur border border-white/20 flex items-center justify-center font-bold">
                            {targetUser.name?.[0]}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">{targetUser.name}</h3>
                            <p className="text-xs text-white/70">Connected</p>
                        </div>
                    </div>
                </div>
            )}

            {callType === 'video' && (
                <div className="absolute top-4 right-4 z-30 w-32 md:w-48 aspect-[3/4] md:aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-gray-800">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                    />
                    {isVideoOff && (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-500 gap-2">
                            <VideoOff size={24} />
                            <span className="text-[10px] uppercase font-bold">Camera Off</span>
                        </div>
                    )}
                </div>
            )}

            <div className="absolute bottom-10 left-0 right-0 z-30 flex justify-center items-end pb-8 px-4">
                <div className="flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 p-3 rounded-3xl shadow-2xl pointer-events-auto">
                    <button
                        onClick={toggleMute}
                        className={`p-4 rounded-full transition-all ${isMuted ? 'bg-white text-gray-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>

                    {callType === 'video' && (
                        <button
                            onClick={toggleVideo}
                            className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-white text-gray-900' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                        </button>
                    )}

                    <button
                        onClick={handleEndCall}
                        className="p-4 rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 active:scale-95 transition-all mx-2"
                    >
                        <PhoneOff size={28} />
                    </button>
                </div>
            </div>
        </div>
    );
}
