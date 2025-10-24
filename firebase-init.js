// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCgkO44xHVeQv9XJvjIktAQhdet9J-6hvM",
  authDomain: "guildlootsview.firebaseapp.com",
  projectId: "guildlootsview",
  storageBucket: "guildlootsview.appspot.com",
  messagingSenderId: "535298106967",
  appId: "1:535298106967:web:c38f45b23b8782e2026512"
};

const app = initializeApp(firebaseConfig);
export const firebaseDB = getFirestore(app);