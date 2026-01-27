import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, updateDoc, increment } from "firebase/firestore";
import { Send, ArrowLeft, MoreVertical, Video, Phone, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

export default function Chat() {
    const { currentUser } = useAuth();
    const { setInCall, setCallType, setActiveCall } = useCall();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [targetUserStatus, setTargetUserStatus] = useState(null);

    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const selectedChatRef = useRef(null);

    const scrollToBottom = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).sort((a, b) => {
                const timeA = b.lastMessageTimestamp?.seconds || b.createdAt?.seconds || 0;
                const timeB = a.lastMessageTimestamp?.seconds || a.createdAt?.seconds || 0;
                return timeA - timeB;
            });
            setChats(chatsData);
        });

        return unsubscribe;
    }, [currentUser]);

    useEffect(() => {
        if (location.state?.targetUser) {
            const { targetUser } = location.state;
            const participants = [currentUser.uid, targetUser.uid].sort();
            const chatId = participants.join('_');

            const existingChat = chats.find(c => c.id === chatId);

            if (existingChat) {
                setSelectedChat(existingChat);
            } else {
                setSelectedChat({
                    id: chatId,
                    participants: participants,
                    participantEmails: [currentUser.email, targetUser.email],
                    participantNames: [
                        currentUser.displayName || currentUser.email.split('@')[0],
                        targetUser.displayName || targetUser.email.split('@')[0]
                    ],
                    participantPhotos: [currentUser.photoURL || null, targetUser.photoURL || null],
                    listingData: location.state?.listingData || null,
                    isNew: true
                });
            }
        }
    }, [location.state, chats, currentUser]);

    useEffect(() => {
        if (!selectedChat || selectedChat.isNew) {
            if (selectedChat?.isNew) setMessages([]);
            return;
        }

        const q = query(
            collection(db, "chats", selectedChat.id, "messages"),
            orderBy("timestamp", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => doc.data());
            setMessages(msgs);
            setTimeout(scrollToBottom, 50);
        });

        const chatRef = doc(db, "chats", selectedChat.id);
        updateDoc(chatRef, {
            [`unreadCounts.${currentUser.uid}`]: 0
        }).catch(() => { });

        return unsubscribe;
    }, [selectedChat, currentUser.uid]);

    useEffect(() => {
        if (!selectedChat) return;

        const targetUid = selectedChat.participants.find(p => p !== currentUser.uid);
        if (!targetUid) return;

        const unsubscribe = onSnapshot(doc(db, "users", targetUid), (doc) => {
            if (doc.exists()) {
                setTargetUserStatus(doc.data());
            }
        });

        return unsubscribe;
    }, [selectedChat, currentUser.uid]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat) return;

        const chatDocRef = doc(db, "chats", selectedChat.id);
        const text = newMessage;
        setNewMessage("");

        try {
            if (selectedChat.isNew) {
                await setDoc(chatDocRef, {
                    participants: selectedChat.participants,
                    participantEmails: selectedChat.participantEmails,
                    participantNames: selectedChat.participantNames,
                    participantPhotos: selectedChat.participantPhotos,
                    unreadCounts: {
                        [selectedChat.participants[0]]: 0,
                        [selectedChat.participants[1]]: 0
                    },
                    createdAt: serverTimestamp(),
                    lastMessage: text,
                    lastMessageSenderId: currentUser.uid,
                    lastMessageTimestamp: serverTimestamp()
                });

                const otherUser = selectedChat.participants.find(p => p !== currentUser.uid);
                await updateDoc(chatDocRef, {
                    [`unreadCounts.${otherUser}`]: increment(1)
                });

                setSelectedChat(prev => ({ ...prev, isNew: false }));
            } else {
                await updateDoc(chatDocRef, {
                    lastMessage: text,
                    lastMessageSenderId: currentUser.uid,
                    lastMessageTimestamp: serverTimestamp(),
                    [`unreadCounts.${selectedChat.participants.find(p => p !== currentUser.uid)}`]: increment(1)
                });
            }

            await addDoc(collection(db, "chats", selectedChat.id, "messages"), {
                text: text,
                senderId: currentUser.uid,
                timestamp: serverTimestamp()
            });

            scrollToBottom();
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const getOtherName = (chat) => {
        if (!chat) return "Unknown";
        const myIndex = chat.participants.indexOf(currentUser.uid);
        return chat.participantNames?.[1 - myIndex] || "User";
    };

    const getOtherPhoto = (chat) => {
        if (!chat) return null;
        const myIndex = chat.participants.indexOf(currentUser.uid);
        return chat.participantPhotos?.[1 - myIndex];
    };

    const isOnline = targetUserStatus?.lastSeen && (new Date() - targetUserStatus.lastSeen.toDate()) / 60000 < 5;

    const startCall = (type) => {
        if (!selectedChat) return;
        const otherIndex = 1 - selectedChat.participants.indexOf(currentUser.uid);
        setCallType(type);
        setActiveCall({
            chatId: selectedChat.id,
            callerId: currentUser.uid,
            callerName: currentUser.displayName || currentUser.email.split('@')[0],
            calleeId: selectedChat.participants[otherIndex],
            calleeName: selectedChat.participantNames[otherIndex],
            status: "offering"
        });
        setInCall(true);
    };

    return (
        <div className="max-w-[1400px] mx-auto pt-20 md:pt-24 pb-4 md:pb-8 px-4 md:px-6 overflow-hidden">
            <div className="flex h-[calc(100dvh-110px)] md:h-[calc(100vh-140px)] bg-white dark:bg-gray-950 rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-500">
                {/* Sidebar List */}
                <div className={`w-full md:w-80 border-r border-gray-100 dark:border-gray-800 flex flex-col bg-gray-50/30 dark:bg-gray-900/10 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Messages</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
                        {chats.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 dark:text-gray-400 flex flex-col items-center">
                                <MessageCircle className="mb-2 text-gray-300 dark:text-gray-700" size={32} />
                                <p className="text-sm">No conversations yet.</p>
                            </div>
                        ) : (
                            chats.map(chat => (
                                <button
                                    key={chat.id}
                                    onClick={() => setSelectedChat(chat)}
                                    className={`w-full p-3 rounded-xl text-left transition-all duration-200 group relative ${selectedChat?.id === chat.id
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5 mb-1">
                                        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800">
                                            {getOtherPhoto(chat) ? (
                                                <img src={getOtherPhoto(chat)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                                    {getOtherName(chat)[0]?.toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 font-bold text-sm truncate flex justify-between items-center">
                                            <span>{getOtherName(chat)}</span>
                                            {chat.unreadCounts?.[currentUser.uid] > 0 && (
                                                <span className="bg-red-500 text-white text-[10px] px-1.5 h-5 min-w-[20px] rounded-full flex items-center justify-center ml-2">
                                                    {chat.unreadCounts[currentUser.uid]}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className={`text-[11px] truncate opacity-70 ${selectedChat?.id === chat.id ? 'text-blue-50' : 'text-gray-500'}`}>
                                        {chat.lastMessage}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className={`flex-1 flex flex-col bg-white dark:bg-gray-950 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                    {selectedChat ? (
                        <>
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl z-10">
                                <button className="md:hidden p-1.5 -ml-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full" onClick={() => setSelectedChat(null)}>
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
                                    {getOtherPhoto(selectedChat) ? (
                                        <img src={getOtherPhoto(selectedChat)} alt={getOtherName(selectedChat)} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold">
                                            {getOtherName(selectedChat)[0]?.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm tracking-tight">{getOtherName(selectedChat)}</h3>
                                    <p className={`text-[10px] font-medium flex items-center gap-1 ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                        <span className={`w-1 h-1 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                        {isOnline ? 'Online' : 'Offline'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 ml-auto">
                                    <button onClick={() => startCall('audio')} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                        <Phone size={18} />
                                    </button>
                                    <button onClick={() => startCall('video')} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                        <Video size={18} />
                                    </button>
                                </div>
                            </div>

                            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50 dark:bg-gray-900/20">
                                {messages.map((msg, index) => {
                                    const isMe = msg.senderId === currentUser.uid;
                                    return (
                                        <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm text-sm font-medium leading-relaxed ${isMe
                                                ? 'bg-blue-600 text-white rounded-tr-none'
                                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700/50 rounded-tl-none'
                                                }`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={sendMessage} className="p-3 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex gap-2 items-center bg-gray-50 dark:bg-gray-900 rounded-xl px-2 py-1.5 border border-gray-100 dark:border-gray-800">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 bg-transparent border-none px-3 py-1.5 focus:ring-0 text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
                                    />
                                    <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 text-white rounded-lg p-2 h-9 w-9 flex items-center justify-center disabled:opacity-50 transition-colors hover:bg-blue-500">
                                        <Send size={16} />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 bg-gray-50/20 font-medium">
                            <MessageCircle size={40} className="mb-2 opacity-10" />
                            <p className="text-sm">Pick a conversation</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
