import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc, addDoc, collection, getDoc, serverTimestamp, increment } from 'firebase/firestore';
import { Video, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react';

// WebRTC Configuration
const servers = {
    iceServers: [
        {
            urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
                'stun:stun.l.google.com:19302',
                'stun:stun3.l.google.com:19302',
                'stun:stun4.l.google.com:19302',
            ],
        },
    ],
    iceCandidatePoolSize: 10,
};

export default function VideoCall({ chatId, currentUser, targetUser, callType = 'video', onClose }) {
    const [, setPc] = useState(null);
    const [, setLocalStream] = useState(null); // Keep state but unused in render for now
    const [, setRemoteStream] = useState(null); // Keep state for consistency
    const [status, setStatus] = useState("initializing"); // initializing, calling, connected, incoming, offering, answered
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
    const [isCaller, setIsCaller] = useState(false);

    const localVideoRef = useRef();
    const remoteVideoRef = useRef();

    // Refs for state that needs to be accessed in async callbacks/cleanup without stale closures
    const pcRef = useRef(null);
    const localStreamRef = useRef(null);
    const candidateQueue = useRef([]); // Queue for ICE candidates

    useEffect(() => {
        let unsubscribeDoc = null;
        let unsubscribeCandidates = null;
        let canceled = false;

        const startCall = async () => {
            const pc = new RTCPeerConnection(servers);
            pcRef.current = pc;
            setPc(pc);

            // Get Local Stream
            const constraints = {
                audio: true,
                video: callType === 'video'
            };

            try {
                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                if (canceled) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                localStreamRef.current = stream;
                setLocalStream(stream);

                if (localVideoRef.current && callType === 'video') {
                    localVideoRef.current.srcObject = stream;
                }

                stream.getTracks().forEach(track => pc.addTrack(track, stream));
            } catch (err) {
                console.error("Error accessing media devices:", err);
                if (!canceled) {
                    alert("Could not access camera/microphone. Please check permissions.");
                    onClose();
                }
                return;
            }

            // Handle Remote Stream
            pc.ontrack = (event) => {
                const stream = event.streams[0] || new MediaStream();
                if (!event.streams[0]) stream.addTrack(event.track);

                setRemoteStream(stream);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = stream;
                }
            };

            const callDocRef = doc(db, "chats", chatId, "calls", "active_call");
            const offerCandidates = collection(callDocRef, 'offerCandidates');
            const answerCandidates = collection(callDocRef, 'answerCandidates');

            const callDocSnapshot = await getDoc(callDocRef);
            if (canceled) return;

            if (!callDocSnapshot.exists()) {
                // --- CALLER LOGIC ---
                setIsCaller(true);
                setStatus("calling");

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        addDoc(offerCandidates, event.candidate.toJSON());
                    }
                };

                const offerDescription = await pc.createOffer();
                await pc.setLocalDescription(offerDescription);

                await setDoc(callDocRef, {
                    offer: { type: offerDescription.type, sdp: offerDescription.sdp },
                    callerId: currentUser.uid,
                    callerName: currentUser.displayName || 'Seller',
                    calleeId: targetUser.uid,
                    calleeName: targetUser.name,
                    callType: callType,
                    status: "offering",
                    createdAt: serverTimestamp()
                });

                // Listen for Answer
                unsubscribeDoc = onSnapshot(callDocRef, async (snapshot) => {
                    if (canceled) return;
                    if (!snapshot.exists()) {
                        onClose();
                        return;
                    }

                    const data = snapshot.data();
                    if (!pc.currentRemoteDescription && data?.answer) {
                        const answerDescription = new RTCSessionDescription(data.answer);
                        await pc.setRemoteDescription(answerDescription);
                        setStatus("connected");

                        // Flush ICE candidates
                        while (candidateQueue.current.length > 0) {
                            const candidate = candidateQueue.current.shift();
                            pc.addIceCandidate(candidate).catch(e => console.error("Error flushing candidate", e));
                        }
                    }
                });

                // Listen for Answer Candidates
                unsubscribeCandidates = onSnapshot(answerCandidates, (snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            const candidate = new RTCIceCandidate(change.doc.data());
                            if (pc.remoteDescription) {
                                pc.addIceCandidate(candidate).catch(e => console.error("Error adding candidate", e));
                            } else {
                                candidateQueue.current.push(candidate);
                            }
                        }
                    });
                });

            } else {
                // --- CALLEE LOGIC ---
                setIsCaller(false);
                setStatus("connecting");
                const data = callDocSnapshot.data();

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        addDoc(answerCandidates, event.candidate.toJSON());
                    }
                };

                // Listen for Hangup
                unsubscribeDoc = onSnapshot(callDocRef, (snapshot) => {
                    if (canceled) return;
                    if (!snapshot.exists()) onClose();
                });

                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

                // Flush candidates
                while (candidateQueue.current.length > 0) {
                    const candidate = candidateQueue.current.shift();
                    pc.addIceCandidate(candidate).catch(e => console.error("Error flushing candidate", e));
                }

                const answerDescription = await pc.createAnswer();
                await pc.setLocalDescription(answerDescription);

                await updateDoc(callDocRef, {
                    answer: { type: answerDescription.type, sdp: answerDescription.sdp },
                    status: "answered"
                });

                setStatus("connected");

                // Listen for Offer Candidates
                unsubscribeCandidates = onSnapshot(offerCandidates, (snapshot) => {
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            const candidate = new RTCIceCandidate(change.doc.data());
                            if (pc.remoteDescription) {
                                pc.addIceCandidate(candidate).catch(e => console.error("Error adding candidate", e));
                            } else {
                                candidateQueue.current.push(candidate);
                            }
                        }
                    });
                });
            }
        };

        startCall();

        return () => {
            canceled = true;
            if (localStreamRef.current) localStreamRef.current.getTracks().forEach(track => track.stop());
            if (pcRef.current) pcRef.current.close();
            if (unsubscribeDoc) unsubscribeDoc();
            if (unsubscribeCandidates) unsubscribeCandidates();
        }
    }, [chatId, callType, currentUser, targetUser, onClose]);

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
                    className={`w-full h-full object-cover transition-opacity duration-500 ${(status === 'connected' || status === 'connecting') ? 'opacity-100' : 'opacity-0'}`}
                />

                {status !== 'connected' && (
                    <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40 animate-pulse" />
                        <div className="relative z-10 mb-8">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl bg-gray-800 flex items-center justify-center text-4xl font-bold">
                                {targetUser.name?.[0]?.toUpperCase()}
                            </div>
                            <div className="absolute inset-0 -z-10 rounded-full border border-white/20 scale-125 animate-[ping_2s_ease-out_infinite]" />
                        </div>
                        <div className="relative z-10 text-center space-y-2">
                            <h2 className="text-3xl font-bold">{targetUser.name}</h2>
                            <p className="text-lg text-blue-200 font-medium animate-pulse">
                                {status === 'calling' ? 'Calling...' : status === 'initializing' ? 'Initializing...' : 'Connecting...'}
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
