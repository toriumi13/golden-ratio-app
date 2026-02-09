import {
    signInAnonymously,
    onAuthStateChanged,
    signOut,
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    linkWithCredential,
    EmailAuthProvider,
    signInWithCredential
} from 'firebase/auth';
import { auth } from './firebase';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export const observeAuth = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

export const loginAnonymously = async () => {
    try {
        await signInAnonymously(auth);
    } catch (error) {
        console.error("Anonymous login failed", error);
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed", error);
    }
};

// --- Authentication Methods ---

export const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Google login failed", error);
        throw error;
    }
};

export const signUpWithEmail = async (email: string, pass: string) => {
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        console.error("Email registration failed", error);
        throw error;
    }
};

export const loginWithEmail = async (email: string, pass: string) => {
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        console.error("Email login failed", error);
        throw error;
    }
};

export const linkUserWithEmail = async (email: string, pass: string) => {
    if (!auth.currentUser) return;
    const credential = EmailAuthProvider.credential(email, pass);
    try {
        await linkWithCredential(auth.currentUser, credential);
    } catch (error) {
        console.error("Email linking failed", error);
        throw error;
    }
};

export const loginWithGoogleCredential = async (idToken: string) => {
    try {
        const credential = GoogleAuthProvider.credential(idToken);
        return await signInWithCredential(auth, credential);
    } catch (error) {
        console.error("Google credential login failed", error);
        throw error;
    }
};

export const linkWithGoogleCredential = async (idToken: string) => {
    if (!auth.currentUser) return;
    try {
        const credential = GoogleAuthProvider.credential(idToken);
        return await linkWithCredential(auth.currentUser, credential);
    } catch (error) {
        console.error("Google credential linking failed", error);
        throw error;
    }
};
