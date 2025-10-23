import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, doc, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ------------------- Firebase View
const firebaseConfigView = {
  apiKey: "AIzaSyCgkO44xHVeQv9XJvjIktAQhdet9J-6hvM",
  authDomain: "guildlootsview.firebaseapp.com",
  projectId: "guildlootsview",
  storageBucket: "guildlootsview.firebasestorage.app",
  messagingSenderId: "535298106967",
  appId: "1:535298106967:web:c38f45b23b8782e2026512"
};
const appView = initializeApp(firebaseConfigView);
const dbView = getFirestore(appView);

// ------------------- DOM Elements
const weekSelector = document.getElementById("week-selector");
const totalDiamondSpan = document.getElementById("total-diamond");
const totalPesoSpan = document.getElementById("total-peso");
const viewDashboard = document.getElementById("view-dashboard");
const adminAccessBtn = document.getElementById("admin-access-btn");

let members = [];
let bosses = [];
let currentWeekId = null;

// ------------------- Admin Access
const ADMIN_PASSWORD = "supersecret"; // Change password here
adminAccessBtn.onclick = () => {
  const pwd = prompt("Enter admin password:");
  if (pwd === ADMIN_PASSWORD) {
    window.location.href = "admin.html";
  } else {
    alert("Incorrect password");
  }
};

// ------------------- Load Members
async function loadMembers() {
  const snapshot = await getDocs(collection(dbView, "members"));
  members = [];
  snapshot.forEach(m => members.push({ id: m.id, name: m.data().name }));
}

// ------------------- Load Bosses
async function loadBosses() {
  const snapshot = await getDocs(collection(dbView, "bosses"));
  bosses = [];
  snapshot.forEach(b => bosses.push({ id: b.id, name: b.data().name }));
}

// ------------------- Load Weeks
async function loadWeeks() {
  const snapshot = await getDocs(collection(dbView, "weeks"));
  weekSelector.innerHTML = "";
  if (snapshot.empty) return;
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const option = document.createElement("option");
    option.value = docSnap.id;
    const start = data.start.toDate ? data.start.toDate() : new Date(data.start);
    const end = data.end.toDate ? data.end.toDate() : new Date(data.end);
    option.textContent = `${start.toDateString()} - ${end.toDateString()}`;
    weekSelector.appendChild(option);
  });
  currentWeekId = weekSelector.options[0]?.value;
  weekSelector.value = currentWeekId;
  loadDashboard();
}

// ------------------- Dashboard
async function loadDashboard() {
  if (!currentWeekId) return;

  const weekRef = doc(dbView, "weeks", currentWeekId);
  const weekSnap = await getDocs(collection(dbView, "weeks")).then(snap => snap.docs.find(d => d.id === currentWeekId));
  const weekData = weekSnap?.data() || {};
  totalDiamondSpan.textContent = weekData.totalDiamond || 0;
  totalPesoSpan.textContent = weekData.totalPeso || 0;

  const snapshot = await getDocs(collection(dbView, "weeks", currentWeekId, "participations"));

  const memberMap = {};
  members.forEach(m => memberMap[m.id] = m.name);

  viewDashboard.innerHTML = "";
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const bossName = bosses.find(b => b.id === data.bossId)?.name || "Unknown Boss";
    const timestamp = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
    const timeStr = timestamp.toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
      hour12: true
    });
    const participantNames = data.members.map(id => memberMap[id] || "Unknown").join(", ");

    const div = document.createElement("div");
    div.className = "border-b py-2";
    div.innerHTML = `
      <strong>${bossName}</strong> - ${timeStr}<br>
      <span class="text-sm text-gray-600">Participants: ${participantNames}</span><br>
      <span class="text-sm text-gray-600">💎 ${data.totalDiamond || 0} | ₱ ${data.totalPeso || 0}</span>
    `;
    viewDashboard.appendChild(div);
  });
}

// ------------------- Week Change
weekSelector.addEventListener("change", e => {
  currentWeekId = e.target.value;
  loadDashboard();
});

// ------------------- Initial Load
(async function init() {
  await loadMembers();
  await loadBosses();
  await loadWeeks();
})();