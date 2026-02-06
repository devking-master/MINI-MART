import { createContext, useContext, useEffect, useState } from "react";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import GlobalLoader from "../components/GlobalLoader";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    function signup(email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    async function updateUserProfile(data) {
        if (!auth.currentUser) return Promise.reject("No user logged in");
        return updateProfile(auth.currentUser, data).then(() => {
            // We use spread to trigger re-render in React. 
            // The components will receive a plain object which is fine for rendering.
            setCurrentUser({ ...auth.currentUser });
        });
    }

    function resetPassword(email) {
        return sendPasswordResetEmail(auth, email);
    }

    useEffect(() => {
        let unsubscribeProfile = null;

        const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Set immediately to prevent PrivateRoute from redirecting back to login
                // while we wait for the Firestore profile to sync.
                setCurrentUser(user);

                // 1. Initial Heartbeat/Presence Update
                const userRef = doc(db, "users", user.uid);
                await setDoc(userRef, {
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    photoURL: user.photoURL,
                    lastSeen: serverTimestamp(),
                    isOnline: true
                }, { merge: true });

                // 2. Real-time Profile Listener
                unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
                    if (snapshot.exists()) {
                        const userData = snapshot.data();
                        // Merge auth user with firestore data
                        setCurrentUser({
                            ...user,
                            ...userData,
                            uid: user.uid,
                            email: user.email,
                            displayName: userData.displayName || user.displayName || user.email.split('@')[0],
                            photoURL: userData.photoURL || user.photoURL
                        });
                    }
                    setLoading(false);
                });
            } else {
                setCurrentUser(null);
                setLoading(false);
                if (unsubscribeProfile) unsubscribeProfile();
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);

    // Periodic Heartbeat
    useEffect(() => {
        if (!currentUser) return;

        const interval = setInterval(async () => {
            try {
                await setDoc(doc(db, "users", currentUser.uid), {
                    lastSeen: serverTimestamp(),
                    isOnline: true
                }, { merge: true });
            } catch (err) {
                console.error("Heartbeat error:", err);
            }
        }, 120000); // 2 minutes

        return () => clearInterval(interval);
    }, [currentUser]);

    const value = {
        currentUser,
        signup,
        login,
        logout,
        updateUserProfile,
        resetPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? <GlobalLoader loading={loading} /> : children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

