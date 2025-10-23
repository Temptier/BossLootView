// ===================== FIREBASE INIT =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase config (VIEW)
const firebaseConfig = {
  apiKey: "AIzaSyCgkO44xHVeQv9XJvjIktAQhdet9J-6hvM",
  authDomain: "guildlootsview.firebaseapp.com",
  projectId: "guildlootsview",
  storageBucket: "guildlootsview.firebasestorage.app",
  messagingSenderId: "535298106967",
  appId: "1:535298106967:web:c38f45b23b8782e2026512"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===================== LOAD WEEK OPTIONS =====================
async function loadWeeks() {
  const weekSelect = document.getElementById("weekSelect");
  weekSelect.innerHTML = "";

  const weekSnap = await getDocs(collection(db, "weeks"));
  const weeks = [];

  weekSnap.forEach(docSnap => {
    const data = docSnap.data();
    const date = new Date(data.weekId);
    const formatted = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    weeks.push({ id: docSnap.id, label: formatted });
  });

  // Sort by newest first
  weeks.sort((a, b) => new Date(b.label) - new Date(a.label));

  weeks.forEach(w => {
    const option = document.createElement("option");
    option.value = w.id;
    option.textContent = w.label;
    weekSelect.appendChild(option);
  });

  if (weeks.length > 0) {
    weekSelect.value = weeks[0].id;
    loadWeekData(weeks[0].id);
  }

  weekSelect.addEventListener("change", e => loadWeekData(e.target.value));
}

// ===================== LOAD WEEK DATA =====================
async function loadWeekData(weekId) {
  if (!weekId) return;

  const pesoDisplay = document.getElementById("pesoDisplay");
  const diamondDisplay = document.getElementById("diamondDisplay");
  const memberContainer = document.getElementById("memberParticipation");
  const bossContainer = document.getElementById("bossParticipants");

  // Reset displays
  pesoDisplay.textContent = "₱0";
  diamondDisplay.textContent = "💎 0";
  memberContainer.innerHTML = `<p class="text-gray-500 text-sm">Loading...</p>`;
  bossContainer.innerHTML = `<p class="text-gray-500 text-sm">Loading...</p>`;

  // Get weekly earnings
  const weekRef = doc(db, "weeks", weekId);
  const weekSnap = await getDoc(weekRef);
  if (weekSnap.exists()) {
    const data = weekSnap.data();
    pesoDisplay.textContent = `₱${data.totalPeso || 0}`;
    diamondDisplay.textContent = `💎 ${data.totalDiamond || 0}`;
  }

  // Load participations
  const partSnap = await getDocs(collection(db, "participations"));
  const membersSnap = await getDocs(collection(db, "members"));

  const memberCounts = {};
  const bossRecords = [];

  membersSnap.forEach(docSnap => {
    const name = docSnap.data().name;
    memberCounts[name] = 0;
  });

  partSnap.forEach(docSnap => {
    const data = docSnap.data();
    if (data.weekId === weekId) {
      data.members.forEach(m => {
        if (memberCounts[m] !== undefined) memberCounts[m]++;
      });
      const dt = new Date(data.timestamp);
      const formatted = dt.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      bossRecords.push({
        boss: data.boss,
        time: formatted,
        members: data.members
      });
    }
  });

  // Display member participation
  const sortedMembers = Object.entries(memberCounts).sort((a, b) => b[1] - a[1]);
  if (sortedMembers.length === 0) {
    memberContainer.innerHTML = `<p class="text-gray-500 text-sm">No participation records for this week.</p>`;
  } else {
    memberContainer.innerHTML = sortedMembers
      .map(([name, count]) => `
        <div class="flex justify-between border-b py-1">
          <span>${name}</span>
          <span>${count}</span>
        </div>
      `)
      .join("");
  }

  // Display boss participants
  if (bossRecords.length === 0) {
    bossContainer.innerHTML = `<p class="text-gray-500 text-sm">No boss participation records found.</p>`;
  } else {
    bossContainer.innerHTML = bossRecords
      .map(rec => `
        <div class="border-b py-1">
          <strong>${rec.boss}</strong> - ${rec.time}<br>
          <span class="text-sm text-gray-600">${rec.members.join(", ")}</span>
        </div>
      `)
      .join("");
  }
}

// ===================== INIT =====================
window.addEventListener("DOMContentLoaded", () => {
  loadWeeks();
});