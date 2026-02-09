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
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, getDocs };
