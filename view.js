import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Firebase Config for VIEW ---
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

// --- DOM Elements ---
const weekSelect = document.getElementById("weekSelect");
const totalDiamondsEl = document.getElementById("totalDiamonds");
const totalPesoEl = document.getElementById("totalPeso");
const memberParticipationEl = document.getElementById("memberParticipation");
const bossParticipantsEl = document.getElementById("bossParticipants");
const refreshBtn = document.getElementById("refreshBtn");

// --- Load Weeks ---
async function loadWeeks() {
  const weeksSnapshot = await getDocs(collection(db, "weeks"));
  const weeks = [];
  weeksSnapshot.forEach((docSnap) => {
    weeks.push({ id: docSnap.id, ...docSnap.data() });
  });

  weekSelect.innerHTML = "";
  weeks.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  weeks.forEach((week) => {
    const start = new Date(week.startDate).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    const end = new Date(week.endDate).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    const opt = document.createElement("option");
    opt.value = week.id;
    opt.textContent = `${start} → ${end}`;
    weekSelect.appendChild(opt);
  });

  if (weeks.length > 0) {
    await loadWeekData(weeks[0].id);
  }
}

// --- Load Week Data ---
async function loadWeekData(weekId) {
  const weekDoc = await getDoc(doc(db, "weeks", weekId));
  if (!weekDoc.exists()) return;
  const data = weekDoc.data();

  totalDiamondsEl.textContent = data.totalDiamonds || 0;
  totalPesoEl.textContent = `₱${data.totalPeso || 0}`;

  await renderDashboard(weekId);
}

// --- Render Dashboard ---
async function renderDashboard(weekId) {
  const participationCounts = {};
  const bossList = [];

  const bossesSnapshot = await getDocs(collection(db, "weeks", weekId, "bossRecords"));
  bossesSnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const id = docSnap.id;
    bossList.push({ id, ...data });

    (data.participants || []).forEach((m) => {
      participationCounts[m] = (participationCounts[m] || 0) + 1;
    });
  });

  // Member Participation
  let html = `<div class="bg-gray-800 p-4 rounded-lg shadow-md mb-4">
                <h2 class="text-lg font-semibold mb-2">Member Participation</h2>
                <ul class="divide-y divide-gray-700">`;
  Object.entries(participationCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([member, count]) => {
      html += `<li class="py-1 flex justify-between"><span>${member}</span><span>${count}</span></li>`;
    });
  html += `</ul></div>`;
  memberParticipationEl.innerHTML = html;

  // Boss Participants List
  let bossHtml = `<div class="bg-gray-800 p-4 rounded-lg shadow-md">
                    <h2 class="text-lg font-semibold mb-2">Boss Participants</h2>
                    <ul class="divide-y divide-gray-700">`;
  bossList.forEach((b) => {
    const date = new Date(b.timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    bossHtml += `<li class="py-2">
                  <span class="font-semibold">${b.bossName}</span> - ${date}<br>
                  <span class="text-sm text-gray-300">${b.participants.join(", ")}</span>
                </li>`;
  });
  bossHtml += `</ul></div>`;
  bossParticipantsEl.innerHTML = bossHtml;
}

// --- Event Listeners ---
weekSelect.addEventListener("change", async () => {
  await loadWeekData(weekSelect.value);
});

refreshBtn.addEventListener("click", async () => {
  await loadWeekData(weekSelect.value);
});

// --- Initialize ---
loadWeeks();