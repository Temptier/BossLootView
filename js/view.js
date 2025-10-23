// ===================== FIREBASE SETUP =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  where,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// ⚙️ VIEW FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCgkO44xHVeQv9XJvjIktAQhdet9J-6hvM",
  authDomain: "guildlootsview.firebaseapp.com",
  projectId: "guildlootsview",
  storageBucket: "guildlootsview.firebasestorage.app",
  messagingSenderId: "535298106967",
  appId: "1:535298106967:web:c38f45b23b8782e2026512",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===================== DOM ELEMENTS =====================
const weekSelect = document.getElementById("weekSelect");
const totalDiamonds = document.getElementById("totalDiamonds");
const totalPeso = document.getElementById("totalPeso");
const totalParticipations = document.getElementById("totalParticipations");
const totalMembers = document.getElementById("totalMembers");
const participationList = document.getElementById("participationList");
const bossParticipantsList = document.getElementById("bossParticipantsList");

// ===================== LOAD WEEKS =====================
async function loadWeeks() {
  const weeksRef = collection(db, "weeks");
  const qWeeks = query(weeksRef, orderBy("start", "desc"));
  const snapshot = await getDocs(qWeeks);
  weekSelect.innerHTML = "";

  snapshot.forEach((docSnap) => {
    const week = docSnap.data();
    const opt = document.createElement("option");
    opt.value = docSnap.id;
    opt.textContent = `${week.start} - ${week.end}`;
    weekSelect.appendChild(opt);
  });

  if (weekSelect.options.length > 0) {
    weekSelect.selectedIndex = 0;
    loadWeekData(weekSelect.value);
  }
}

// ===================== LOAD WEEKLY DATA =====================
async function loadWeekData(weekId) {
  const weekDocRef = doc(db, "weeks", weekId);
  const weekDoc = await getDoc(weekDocRef);

  if (!weekDoc.exists()) {
    participationList.innerHTML = `<p class="text-red-400">No data found for this week.</p>`;
    return;
  }

  const weekData = weekDoc.data();
  const totalDia = weekData.totalDiamonds || 0;
  const totalPhp = weekData.totalPeso || 0;

  totalDiamonds.textContent = totalDia;
  totalPeso.textContent = `₱ ${Number(totalPhp).toLocaleString()}`;

  // ===================== MEMBERS =====================
  const membersRef = collection(db, "members");
  const membersSnap = await getDocs(membersRef);
  const members = membersSnap.docs.map((d) => ({
    id: d.id,
    name: d.data().name,
  }));

  // ===================== PARTICIPATION =====================
  const partRef = collection(db, "participation");
  const qParts = query(partRef, where("weekId", "==", weekId));
  const partsSnap = await getDocs(qParts);

  let totalParticipationsCount = 0;
  const memberCountMap = {};
  const bossList = [];

  partsSnap.forEach((docSnap) => {
    const p = docSnap.data();
    totalParticipationsCount++;
    p.members.forEach((mId) => {
      memberCountMap[mId] = (memberCountMap[mId] || 0) + 1;
    });
    bossList.push(p);
  });

  totalParticipations.textContent = totalParticipationsCount;
  totalMembers.textContent = members.length;

  // ===================== DISPLAY MEMBER PARTICIPATION =====================
  participationList.innerHTML = "";
  members.sort((a, b) => a.name.localeCompare(b.name));
  members.forEach((m) => {
    const count = memberCountMap[m.id] || 0;
    const div = document.createElement("div");
    div.className = "flex justify-between bg-gray-700 px-3 py-2 rounded";
    div.innerHTML = `
      <span>${m.name}</span>
      <span class="text-emerald-400">${count} hunts</span>
    `;
    participationList.appendChild(div);
  });

  // ===================== DISPLAY BOSS PARTICIPANTS =====================
  bossParticipantsList.innerHTML = "";
  for (const b of bossList) {
    const date = new Date(b.time).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const memberNames = b.members
      .map((mId) => members.find((mem) => mem.id === mId)?.name || "Unknown")
      .join(", ");

    const div = document.createElement("div");
    div.className = "bg-gray-700 p-3 rounded";
    div.innerHTML = `
      <p class="font-semibold text-yellow-400">${b.bossName}</p>
      <p class="text-sm text-gray-300">${date}</p>
      <p class="text-sm text-gray-200">Participants: ${memberNames}</p>
    `;
    bossParticipantsList.appendChild(div);
  }
}

// ===================== EVENTS =====================
weekSelect.addEventListener("change", (e) => loadWeekData(e.target.value));

// ===================== INITIALIZE =====================
window.onload = loadWeeks;