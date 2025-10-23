import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// -------------------
// Firebase Project B (View-Only)
const firebaseConfig = {
  apiKey: "AIzaSyCgkO44xHVeQv9XJvjIktAQhdet9J-6hvM",
  authDomain: "guildlootsview.firebaseapp.com",
  projectId: "guildlootsview",
  storageBucket: "guildlootsview.firebasestorage.app",
  messagingSenderId: "535298106967",
  appId: "1:535298106967:web:c38f45b23b8782e2026512"
};
const appView = initializeApp(firebaseConfigView);
const dbView = getFirestore(appView);

// -------------------
// DOM Elements
const weekSelector = document.getElementById("week-selector");
const dashboardContent = document.getElementById("dashboard-content");
const bossParticipantsContent = document.getElementById("boss-participants-content");

let members = [];
let bosses = [];
let currentWeekId = null;

// -------------------
// Currency rates
const diamondRate = 10; // diamonds per participation
const pesoRate = 100;   // ₱ per participation

// -------------------
// Load Members
async function loadMembers() {
  const snapshot = await getDocs(collection(dbView, "members"));
  members = [];
  snapshot.forEach(m => members.push({ id: m.id, name: m.data().name }));
  members.sort((a, b) => a.name.localeCompare(b.name));
}

// -------------------
// Load Bosses
async function loadBosses() {
  const snapshot = await getDocs(collection(dbView, "bosses"));
  bosses = [];
  snapshot.forEach(b => bosses.push({ id: b.id, name: b.data().name }));
  bosses.sort((a, b) => a.name.localeCompare(b.name));
}

// -------------------
// Load Weeks
async function loadWeeks() {
  const weeksSnapshot = await getDocs(collection(dbView, "weeks"));
  weekSelector.innerHTML = "";

  if (weeksSnapshot.empty) return;

  weeksSnapshot.forEach(docSnap => {
    const data = docSnap.data();
    const option = document.createElement("option");
    option.value = docSnap.id;
    const start = new Date(data.start);
    const end = new Date(data.end);
    option.textContent = `${start.toDateString()} - ${end.toDateString()}`;
    weekSelector.appendChild(option);
  });

  currentWeekId = weekSelector.options[0].value;
  weekSelector.value = currentWeekId;
  loadDashboard();
}

// -------------------
// Load Dashboard
async function loadDashboard() {
  if (!currentWeekId) return;

  // Map members for name lookup
  const memberMap = {};
  members.forEach(m => memberMap[m.id] = m.name);

  // Participation entries
  const participationsRef = collection(dbView, "weeks", currentWeekId, "participations");
  const participationsSnapshot = await getDocs(participationsRef);

  // Count participation per member
  const memberCount = {};
  participationsSnapshot.forEach(docSnap => {
    const data = docSnap.data();
    data.members.forEach(m => {
      memberCount[m] = (memberCount[m] || 0) + 1;
    });
  });

  // ------------------- Dashboard – Member Participation & Earnings
  dashboardContent.innerHTML = Object.entries(memberCount)
    .map(([id, count]) => {
      const name = memberMap[id] || "Unknown";
      const totalDiamond = count * diamondRate;
      const totalPeso = count * pesoRate;
      return `<div class="flex justify-between border-b py-1">
        <span>${name}</span>
        <span>${count} runs | 💎 ${totalDiamond} | ₱ ${totalPeso}</span>
      </div>`;
    }).join("");

  // ------------------- Boss Participants Section
  bossParticipantsContent.innerHTML = participationsSnapshot.docs
    .map(docSnap => {
      const data = docSnap.data();
      const bossName = bosses.find(b => b.id === data.bossId)?.name || "Unknown Boss";
      const timestamp = data.timestamp?.toDate();
      const timeStr = timestamp ? timestamp.toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true
      }) : "Unknown Time";

      const participantNames = data.members.map(id => memberMap[id] || "Unknown").join(", ");
      return `<div class="border-b py-2">
        <strong>${bossName}</strong> - ${timeStr}<br>
        <span class="text-sm text-gray-600">Participants: ${participantNames}</span>
      </div>`;
    }).join("");
}

// ------------------- Week change
weekSelector.addEventListener("change", (e) => {
  currentWeekId = e.target.value;
  loadDashboard();
});

// -------------------
// Initial Load
await loadMembers();
await loadBosses();
await loadWeeks();