// firebase-init.js
// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCgkO44xHVeQv9XJvjIktAQhdet9J-6hvM",
    authDomain: "guildlootsview.firebaseapp.com",
    projectId: "guildlootsview",
    storageBucket: "guildlootsview.firebasestorage.app",
    messagingSenderId: "535298106967",
    appId: "1:535298106967:web:c38f45b23b8782e2026512"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const firebaseDB = getFirestore(app);