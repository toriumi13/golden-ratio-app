import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyCiB2mjty-uBw6oapgoP6kGrF3c9MrljBA",
    authDomain: "golden-raito-app.firebaseapp.com",
    projectId: "golden-raito-app",
    storageBucket: "golden-raito-app.firebasestorage.app",
    messagingSenderId: "105811242629",
    appId: "1:105811242629:web:e742d130631b4928c0c3ec",
    measurementId: "G-RWX4ZC1KND"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
