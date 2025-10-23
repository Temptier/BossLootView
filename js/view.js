import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your Firebase configuration for view-only
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

const weekSelect = document.getElementById("weekSelect");
const totalDiamondsEl = document.getElementById("totalDiamonds");
const totalPesoEl = document.getElementById("totalPeso");
const memberParticipationEl = document.getElementById("memberParticipation");
const bossParticipantsEl = document.getElementById("bossParticipants");

async function loadWeeks() {
  weekSelect.innerHTML = "";

  const weeksSnapshot = await getDocs(collection(db, "weeks"));
  const weeks = [];
  weeksSnapshot.forEach((docSnap) => {
    weeks.push({ id: docSnap.id, ...docSnap.data() });
  });

  if (weeks.length === 0) {
    weekSelect.innerHTML = `<option>No week records</option>`;
    totalDiamondsEl.textContent = "0";
    totalPesoEl.textContent = "₱0";
    memberParticipationEl.innerHTML = "";
    bossParticipantsEl.innerHTML = "";
    return;
  }

  weeks.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  weeks.forEach((week) => {
    const start = new Date(week.startDate).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    const end = new Date(week.endDate).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    const opt = document.createElement("option");
    opt.value = week.id;
    opt.textContent = `${start} → ${end}`;
    weekSelect.appendChild(opt);
  });

  await loadWeekData(weeks[0].id);

  weekSelect.addEventListener("change", async () => {
    await loadWeekData(weekSelect.value);
  });
}

async function loadWeekData(weekId) {
  const weekDoc = await getDoc(doc(db, "weeks", weekId));
  if (!weekDoc.exists()) return;

  const weekData = weekDoc.data();
  totalDiamondsEl.textContent = weekData.totalDiamonds ?? 0;
  totalPesoEl.textContent = "₱" + (weekData.totalPeso ?? 0);

  const participationCounts = {};
  const bossList = [];

  const bossesSnapshot = await getDocs(collection(db, "weeks", weekId, "bossRecords"));
  bossesSnapshot.forEach((bossSnap) => {
    const boss = bossSnap.data();
    const participants = boss.participants || [];
    participants.forEach((m) => {
      participationCounts[m] = (participationCounts[m] || 0) + 1;
    });
    bossList.push(boss);
  });

  renderParticipation(participationCounts);
  renderBossList(bossList);
}

function renderParticipation(counts) {
  const entries = Object.entries(counts);
  if (entries.length === 0) {
    memberParticipationEl.innerHTML = `<div class="bg-gray-800 p-4 rounded-lg text-center">No participation data.</div>`;
    return;
  }

  let html = `<div class="bg-gray-800 p-4 rounded-lg shadow-md">
                <h2 class="text-lg font-semibold mb-2">Member Participation</h2>
                <ul class="divide-y divide-gray-700">`;
  entries.sort((a, b) => b[1] - a[1]);
  for (const [member, count] of entries) {
    html += `<li class="py-1 flex justify-between"><span>${member}</span><span>${count}</span></li>`;
  }
  html += `</ul></div>`;
  memberParticipationEl.innerHTML = html;
}

function renderBossList(bosses) {
  if (bosses.length === 0) {
    bossParticipantsEl.innerHTML = `<div class="bg-gray-800 p-4 rounded-lg text-center">No boss records yet.</div>`;
    return;
  }

  let html = `<div class="bg-gray-800 p-4 rounded-lg shadow-md">
                <h2 class="text-lg font-semibold mb-2">Boss Participants</h2>
                <ul class="divide-y divide-gray-700">`;
  bosses.forEach((b) => {
    const date = new Date(b.timestamp || Date.now()).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    html += `<li class="py-2">
              <span class="font-semibold">${b.bossName}</span> - ${date}<br>
              <span class="text-sm text-gray-300">${(b.participants || []).join(", ")}</span>
             </li>`;
  });
  html += `</ul></div>`;
  bossParticipantsEl.innerHTML = html;
}

// 🔁 Refresh button
document.getElementById("refreshBtn").addEventListener("click", () => {
  loadWeeks();
});

// 🔐 Admin access button
document.getElementById("adminBtn").addEventListener("click", () => {
  window.location.href = "admin.html";
});

loadWeeks();