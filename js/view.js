// ---------------- Firebase Setup ----------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 🔥 Firebase Config (VIEW)
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
const db = getFirestore(app);

// ---------------- DOM Elements ----------------
const weekSelect = document.getElementById("weekSelect");
const earningsDiamond = document.getElementById("earningsDiamond");
const earningsPeso = document.getElementById("earningsPeso");
const participationList = document.getElementById("participationList");
const memberSummary = document.getElementById("memberSummary");
const adminBtn = document.getElementById("adminBtn");

// ---------------- Admin Button ----------------
adminBtn.addEventListener("click", () => {
  window.location.href = "admin.html";
});

// ---------------- Load Weeks ----------------
async function loadWeeks() {
  const weeksRef = collection(db, "weeks");
  const weeksQuery = query(weeksRef, orderBy("startDate", "desc"));
  const snapshot = await getDocs(weeksQuery);

  weekSelect.innerHTML = "";

  if (snapshot.empty) {
    weekSelect.innerHTML = `<option>No weeks found</option>`;
    return;
  }

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const start = formatDate(data.startDate);
    const end = formatDate(data.endDate);
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = `${start} - ${end}`;
    weekSelect.appendChild(option);
  });

  const firstWeek = weekSelect.options[0]?.value;
  if (firstWeek) loadWeekData(firstWeek);
}

// ---------------- Load Week Data ----------------
async function loadWeekData(weekId) {
  const weekDoc = await getDoc(doc(db, "weeks", weekId));

  if (!weekDoc.exists()) {
    earningsDiamond.textContent = "💎 Diamond: 0";
    earningsPeso.textContent = "₱ Peso: 0";
    participationList.innerHTML = "<p class='text-gray-500'>No data found.</p>";
    memberSummary.innerHTML = "<p class='text-gray-500'>No members found.</p>";
    return;
  }

  const weekData = weekDoc.data();
  earningsDiamond.textContent = `💎 Diamond: ${weekData.totalDiamond ?? 0}`;
  earningsPeso.textContent = `₱ Peso: ${weekData.totalPeso ?? 0}`;

  // Load boss participation
  const bossesRef = collection(db, "weeks", weekId, "bossHunts");
  const bossesSnap = await getDocs(bossesRef);

  participationList.innerHTML = "";
  memberSummary.innerHTML = "";

  const memberCount = {};

  if (bossesSnap.empty) {
    participationList.innerHTML = "<p class='text-gray-500'>No boss hunts yet.</p>";
    return;
  }

  bossesSnap.forEach(bossDoc => {
    const boss = bossDoc.data();
    const participants = boss.participants || [];

    const bossDiv = document.createElement("div");
    bossDiv.className = "p-3 rounded-lg bg-gray-700";

    bossDiv.innerHTML = `
      <p class="font-semibold text-emerald-400">${boss.boss}</p>
      <p class="text-sm text-gray-400">${formatDateTime(boss.date)}</p>
      <p class="text-sm text-gray-300">Participants: ${participants.join(", ") || "None"}</p>
    `;

    participationList.appendChild(bossDiv);

    participants.forEach(name => {
      memberCount[name] = (memberCount[name] || 0) + 1;
    });
  });

  // Member summary
  const sortedMembers = Object.entries(memberCount).sort((a, b) => b[1] - a[1]);
  sortedMembers.forEach(([name, count]) => {
    const p = document.createElement("p");
    p.innerHTML = `<span class="text-emerald-400 font-semibold">${name}</span> — ${count} hunts`;
    memberSummary.appendChild(p);
  });
}

// ---------------- Utilities ----------------
function formatDate(date) {
  if (!date) return "Unknown";
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateTime(date) {
  if (!date) return "Unknown";
  const d = new Date(date);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

// ---------------- Event Listeners ----------------
weekSelect.addEventListener("change", (e) => {
  loadWeekData(e.target.value);
});

// ---------------- Initialize ----------------
loadWeeks();