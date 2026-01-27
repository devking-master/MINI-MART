import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collectionGroup, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const CallContext = createContext();

export const CallProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [incomingCall, setIncomingCall] = useState(null);
    const [activeCall, setActiveCall] = useState(null);
    const [inCall, setInCall] = useState(false);
    const [callType, setCallType] = useState('video');


    useEffect(() => {
        if (!currentUser) {
            setIncomingCall(null);
            setActiveCall(null);
            setInCall(false);
            return;
        }

        // collectionGroup query to find any active_call where we are the callee
        const q = query(
            collectionGroup(db, "calls"),
            where("calleeId", "==", currentUser.uid),
            where("status", "==", "offering")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setIncomingCall(null);
                return;
            }

            // Get the first offering call (assuming single call support for now)
            const doc = snapshot.docs[0];
            const data = doc.data();

            // Extract chatId from the document path: chats/{chatId}/calls/active_call
            // Parent of active_call is 'calls', parent of 'calls' is 'chats/{chatId}'
            const chatId = doc.ref.parent.parent.id;

            setIncomingCall({ ...data, chatId, id: doc.id });

            // Show browser notification if possible
            if (document.visibilityState === 'hidden' && Notification.permission === 'granted') {
                new Notification("Incoming Call", {
                    body: `Call from ${data.callerName || 'Someone'}`,
                    tag: 'incoming-call',
                    icon: '/vite.svg' // Optional: Add an icon if available
                });
            }
        }, (error) => {
            console.error("Global Call Listener Error:", error);
        });

        // Request notification permission on mount
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return unsubscribe;
    }, [currentUser]);

    const acceptCall = () => {
        if (incomingCall) {
            setCallType(incomingCall.callType || 'video');
            setActiveCall(incomingCall);
            setInCall(true);
            setIncomingCall(null);
        }
    };

    const declineCall = async () => {
        if (incomingCall) {
            try {
                const callDocRef = doc(db, "chats", incomingCall.chatId, "calls", "active_call");
                await deleteDoc(callDocRef);
                setIncomingCall(null);
            } catch (err) {
                console.error("Error declining call:", err);
            }
        }
    };

    const endCall = () => {
        setActiveCall(null);
        setInCall(false);
    };

    return (
        <CallContext.Provider value={{
            incomingCall,
            activeCall,
            inCall,
            callType,
            setCallType,
            acceptCall,
            declineCall,
            endCall,
            setActiveCall,
            setInCall
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = () => useContext(CallContext);
