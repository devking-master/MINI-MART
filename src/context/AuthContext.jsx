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
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

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

    function updateUserProfile(user, data) {
        return updateProfile(user, data).then(() => {
            setCurrentUser({ ...user }); // Force state update
        });
    }

    function resetPassword(email) {
        return sendPasswordResetEmail(auth, email);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            setLoading(false);

            if (user) {
                // Presence Heartbeat
                const userRef = doc(db, "users", user.uid);
                await setDoc(userRef, {
                    email: user.email,
                    displayName: user.displayName || user.email.split('@')[0],
                    photoURL: user.photoURL,
                    lastSeen: serverTimestamp(),
                    isOnline: true
                }, { merge: true });
            }
        });

        return unsubscribe;
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
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

