import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, updateDoc, increment } from "firebase/firestore";
import { Send, ArrowLeft, MoreVertical, Video, Phone, MessageCircle } from "lucide-react";
import { motion } from 'framer-motion';

export default function Chat() {
    const { currentUser } = useAuth();
    const { setInCall, setCallType, setActiveCall } = useCall();
    const location = useLocation();

    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [targetUserStatus, setTargetUserStatus] = useState(null);

    const messagesEndRef = useRef(null);
    const selectedChatRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Keep ref in sync with state for background notifications
    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    // Listen for Chats List & Local Notifications
    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const data = change.doc.data();
                if (change.type === 'modified') {
                    const isNewMessage = data.lastMessageSenderId && data.lastMessageSenderId !== currentUser.uid;
                    const isNotFocused = document.visibilityState === 'hidden' || selectedChatRef.current?.id !== change.doc.id;
                    const isRecent = data.lastMessageTimestamp?.toMillis() > Date.now() - 5000;

                    if (isNewMessage && isNotFocused && isRecent && Notification.permission === 'granted') {
                        new Notification("New Message", {
                            body: data.lastMessage,
                            icon: '/pwa-192x192.png'
                        });
                    }
                }
            });

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

    // Handle initial chat selection from navigation state
    useEffect(() => {
        if (location.state?.targetUser) {
            const { targetUser } = location.state;
            const participants = [currentUser.uid, targetUser.uid].sort();
            const chatId = participants.join('_');

            const participantData = {
                [currentUser.uid]: {
                    email: currentUser.email,
                    name: currentUser.displayName || currentUser.email.split('@')[0],
                    photo: currentUser.photoURL || null
                },
                [targetUser.uid]: {
                    email: targetUser.email,
                    name: targetUser.displayName || targetUser.email.split('@')[0],
                    photo: targetUser.photoURL || null
                }
            };

            const existingChat = chats.find(c => c.id === chatId);
            const sortedEmails = participants.map(uid => participantData[uid].email);
            const sortedNames = participants.map(uid => participantData[uid].name);
            const sortedPhotos = participants.map(uid => participantData[uid].photo);

            if (existingChat) {
                // Background update metadata if it changed
                const chatDocRef = doc(db, "chats", chatId);
                updateDoc(chatDocRef, {
                    participantNames: sortedNames,
                    participantPhotos: sortedPhotos
                }).catch(err => console.error("Error updating chat metadata:", err));

                setSelectedChat({
                    ...existingChat,
                    participantNames: sortedNames,
                    participantPhotos: sortedPhotos
                });
            } else {
                setSelectedChat({
                    id: chatId,
                    participants: participants,
                    participantEmails: sortedEmails,
                    participantNames: sortedNames,
                    participantPhotos: sortedPhotos,
                    listingData: location.state?.listingData || null,
                    isNew: true
                });
            }
        }
    }, [location.state, chats, currentUser]);

    // Listen for Messages in selected chat
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

        // Clear unread count
        const chatRef = doc(db, "chats", selectedChat.id);
        updateDoc(chatRef, {
            [`unreadCounts.${currentUser.uid}`]: 0
        }).catch(() => { });

        return unsubscribe;
    }, [selectedChat, currentUser.uid]);

    // Listen for Presence of target user
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
        return chat.participantNames?.[1 - myIndex] || chat.participantEmails?.find(e => e !== currentUser.email) || "User";
    };

    const getOtherPhoto = (chat) => {
        if (!chat) return null;
        const myIndex = chat.participants.indexOf(currentUser.uid);
        return chat.participantPhotos?.[1 - myIndex];
    };

    const getStatusText = () => {
        if (!targetUserStatus?.lastSeen) return "Offline";
        const lastSeen = targetUserStatus.lastSeen.toDate();
        const diffMinutes = (new Date() - lastSeen) / 60000;

        if (diffMinutes < 5) return "Online";
        if (diffMinutes < 60) return `Last seen ${Math.floor(diffMinutes)}m ago`;
        if (diffMinutes < 1440) return `Last seen ${Math.floor(diffMinutes / 60)}h ago`;
        return `Last seen ${lastSeen.toLocaleDateString()}`;
    };

    const isOnline = targetUserStatus?.lastSeen && (new Date() - targetUserStatus.lastSeen.toDate()) / 60000 < 5;

    const startCall = (type) => {
        if (!selectedChat) return;

        const otherIndex = 1 - selectedChat.participants.indexOf(currentUser.uid);
        const targetUid = selectedChat.participants[otherIndex];
        const targetName = selectedChat.participantNames[otherIndex];

        setCallType(type);
        setActiveCall({
            chatId: selectedChat.id,
            callerId: currentUser.uid,
            callerName: currentUser.displayName || currentUser.email.split('@')[0],
            calleeId: targetUid,
            calleeName: targetName,
            status: "offering"
        });
        setInCall(true);
    };

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-colors duration-300">
            {/* Sidebar List */}
            <div className={`w-full md:w-96 border-r border-gray-100 dark:border-gray-800 flex flex-col bg-gray-50/50 dark:bg-gray-950/50 ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {chats.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400 flex flex-col items-center">
                            <MessageCircle className="mb-2 text-gray-300 dark:text-gray-700" size={40} />
                            <p>No conversations yet.</p>
                        </div>
                    ) : (
                        chats.map(chat => (
                            <button
                                key={chat.id}
                                onClick={() => setSelectedChat(chat)}
                                className={`w-full p-4 rounded-xl text-left transition-all duration-200 group relative ${selectedChat?.id === chat.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-white dark:bg-gray-900 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md border border-transparent hover:border-gray-100 dark:hover:border-gray-700 text-gray-900 dark:text-gray-100'
                                    }`}
                            >
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                        {getOtherPhoto(chat) ? (
                                            <img src={getOtherPhoto(chat)} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                                {getOtherName(chat)[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-sm flex justify-between items-center ${selectedChat?.id === chat.id ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                                            <span className="truncate">{getOtherName(chat)}</span>
                                            {chat.unreadCounts && chat.unreadCounts[currentUser.uid] > 0 && (
                                                <span className="flex-shrink-0 ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
                                            )}
                                        </h3>
                                    </div>
                                </div>
                                <p className={`text-xs truncate opacity-80 ${selectedChat?.id === chat.id ? 'text-blue-100' : (chat.unreadCounts && chat.unreadCounts[currentUser.uid] > 0 ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500 dark:text-gray-400')}`}>
                                    {chat.lastMessageSenderId === currentUser.uid ? 'You: ' : ''}{chat.lastMessage}
                                </p>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-white dark:bg-gray-900 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
                {selectedChat ? (
                    <>
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur z-10">
                            <button className="md:hidden p-2 -ml-2 text-gray-600 dark:text-gray-400" onClick={() => setSelectedChat(null)}>
                                <ArrowLeft size={20} />
                            </button>
                            <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-800">
                                {getOtherPhoto(selectedChat) ? (
                                    <img src={getOtherPhoto(selectedChat)} alt={getOtherName(selectedChat)} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                        {getOtherName(selectedChat)[0]?.toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">{getOtherName(selectedChat)}</h3>
                                <p className={`text-xs font-medium flex items-center gap-1 ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400 dark:bg-gray-600'}`}></span>
                                    {getStatusText()}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                                <button
                                    onClick={() => startCall('audio')}
                                    className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                                >
                                    <Phone size={20} />
                                </button>
                                <button
                                    onClick={() => startCall('video')}
                                    className="p-2.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                                >
                                    <Video size={20} />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-gray-950/50">
                            {selectedChat.listingData && (
                                <div className="flex justify-center mb-6">
                                    <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4 max-w-sm">
                                        <img src={selectedChat.listingData.image} alt="" className="w-16 h-16 rounded-lg object-cover" />
                                        <div>
                                            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-0.5">Inquiry about</p>
                                            <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1">{selectedChat.listingData.title}</h4>
                                            <p className="text-sm font-medium text-gray-500">${selectedChat.listingData.price}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {messages.map((msg, index) => {
                                const isMe = msg.senderId === currentUser.uid;
                                return (
                                    <div key={index} className={`flex ${msg.isSystemMessage ? 'justify-center my-4' : (isMe ? 'justify-end' : 'justify-start')}`}>
                                        {msg.isSystemMessage ? (
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                                                {msg.text}
                                            </span>
                                        ) : (
                                            <div className={`max-w-[75%] px-6 py-3 rounded-2xl shadow-sm text-sm ${isMe
                                                ? 'bg-blue-600 text-white rounded-tr-none'
                                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'
                                                }`}>
                                                {msg.text}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex gap-2 items-center bg-gray-50 dark:bg-gray-800 rounded-full px-2 py-2 border border-gray-200 dark:border-gray-700">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-transparent border-none px-4 py-2 focus:ring-0 text-sm text-gray-900 dark:text-white"
                                />
                                <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 text-white rounded-full p-2 h-10 w-10 flex items-center justify-center disabled:opacity-50">
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 bg-slate-50/50 dark:bg-gray-950/20 font-medium">
                        <MessageCircle size={48} className="mb-2 opacity-20" />
                        <p>Pick a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}
