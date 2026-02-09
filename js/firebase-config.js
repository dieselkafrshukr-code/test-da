// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD_kCij187JbHoHcZwO5Ln3js5Ji86tSUw",
    authDomain: "test-97ecc.firebaseapp.com",
    projectId: "test-97ecc",
    storageBucket: "test-97ecc.firebasestorage.app",
    messagingSenderId: "743949460905",
    appId: "1:743949460905:web:09146ac145dd42eb75d0b8",
    measurementId: "G-31DYDV721K"
};

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, collection, getDocs, doc, getDoc, addDoc, serverTimestamp };
