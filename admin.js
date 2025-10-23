import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Admin Access Guard ---
if (localStorage.getItem("guild_admin_logged_in") !== "true") {
  window.location.href = "login.html";
}

// --- Firebase Config for ADMIN ---
const firebaseConfig = {
  apiKey: "AIzaSyBd1oHWW3HoQ6o9f3FP9W9aV1mqwEifQzw",
  authDomain: "guildlootsadmin.firebaseapp.com",
  projectId: "guildlootsadmin",
  storageBucket: "guildlootsadmin.firebasestorage.app",
  messagingSenderId: "895884983655",
  appId: "1:895884983655:web:2588fbb854394fb3ed43c2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- DOM Elements ---
const weekSelect = document.getElementById("weekSelect");
const bossSelect = document.getElementById("bossSelect");
const memberSelect = document.getElementById("memberSelect");
const addParticipationBtn = document.getElementById("addParticipation");
const addBossBtn = document.getElementById("addBossBtn");
const addMemberBtn = document.getElementById("addMemberBtn");
const totalDiamondsInput = document.getElementById("totalDiamondsInput");
const totalPesoInput = document.getElementById("totalPesoInput");
const updateEarningsBtn = document.getElementById("updateEarningsBtn");
const weekInfo = document.getElementById("weekInfo");
const deselectAllBtn = document.getElementById("deselectAllBtn");
const logoutBtn = document.getElementById("logoutBtn");

// --- Logout Function ---
logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("guild_admin_logged_in");
  window.location.href = "login.html";
});

// --- Ensure Current Week Exists ---
async function ensureCurrentWeekExists() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const weeksRef = collection(db, "weeks");
  const snapshot = await getDocs(weeksRef);
  let found = false;

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (now >= start && now <= end) {
      found = true;
    }
  });

  if (!found) {
    const newWeek = {
      startDate: monday.toISOString(),
      endDate: sunday.toISOString(),
      totalDiamonds: 0,
      totalPeso: 0
    };
    await addDoc(weeksRef, newWeek);
  }
}

// --- Load Weeks ---
async function loadWeeks() {
  await ensureCurrentWeekExists();

  const weeksSnapshot = await getDocs(collection(db, "weeks"));
  const weeks = [];
  weeksSnapshot.forEach((docSnap) => {
    weeks.push({ id: docSnap.id, ...docSnap.data() });
  });

  weekSelect.innerHTML = "";
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
}

// --- Load Week Data ---
async function loadWeekData(weekId) {
  const weekDoc = await getDoc(doc(db, "weeks", weekId));
  if (!weekDoc.exists()) return;
  const data = weekDoc.data();

  totalDiamondsInput.value = data.totalDiamonds || 0;
  totalPesoInput.value = data.totalPeso || 0;
  weekInfo.textContent = `Editing week: ${new Date(data.startDate).toLocaleDateString()} - ${new Date(data.endDate).toLocaleDateString()}`;

  await loadBosses();
  await loadMembers();
}

// --- Load Bosses ---
async function loadBosses() {
  const bossesSnapshot = await getDocs(collection(db, "bosses"));
  bossSelect.innerHTML = "";
  bossesSnapshot.forEach((bossSnap) => {
    const data = bossSnap.data();
    const opt = document.createElement("option");
    opt.value = data.name;
    opt.textContent = data.name;
    bossSelect.appendChild(opt);
  });
}

// --- Load Members ---
async function loadMembers() {
  const membersSnapshot = await getDocs(collection(db, "members"));
  memberSelect.innerHTML = "";
  const members = [];

  membersSnapshot.forEach((memberSnap) => {
    const data = memberSnap.data();
    members.push(data.name);
  });

  members.sort((a, b) => a.localeCompare(b));

  members.forEach((name) => {
    const label = document.createElement("label");
    label.classList.add("block", "text-sm");
    label.innerHTML = `<input type="checkbox" class="mr-1" value="${name}"> ${name}`;
    memberSelect.appendChild(label);
  });
}

// --- Deselect All Members ---
deselectAllBtn.addEventListener("click", () => {
  memberSelect.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
});

// --- Add Boss ---
addBossBtn.addEventListener("click", async () => {
  const bossName = prompt("Enter new boss name:");
  if (!bossName) return;
  const bossesRef = collection(db, "bosses");
  const snapshot = await getDocs(bossesRef);
  const exists = snapshot.docs.some((docSnap) => docSnap.data().name.toLowerCase() === bossName.toLowerCase());
  if (exists) {
    alert("Boss already exists!");
    return;
  }
  await addDoc(bossesRef, { name: bossName });
  await loadBosses();
  alert("Boss added!");
});

// --- Add Member ---
addMemberBtn.addEventListener("click", async () => {
  const memberName = prompt("Enter new member name:");
  if (!memberName) return;
  const membersRef = collection(db, "members");
  const snapshot = await getDocs(membersRef);
  const exists = snapshot.docs.some((docSnap) => docSnap.data().name.toLowerCase() === memberName.toLowerCase());
  if (exists) {
    alert("Member already exists!");
    return;
  }
  await addDoc(membersRef, { name: memberName });
  await loadMembers();
  alert("Member added!");
});

// --- Add Boss Participation ---
addParticipationBtn.addEventListener("click", async () => {
  const weekId = weekSelect.value;
  const bossName = bossSelect.value;
  if (!weekId || !bossName) {
    alert("Select week and boss first!");
    return;
  }

  const selected = Array.from(memberSelect.querySelectorAll("input[type='checkbox']:checked")).map(cb => cb.value);
  if (selected.length === 0) {
    alert("Select at least one participant!");
    return;
  }

  const bossRecordsRef = collection(db, "weeks", weekId, "bossRecords");
  await addDoc(bossRecordsRef, {
    bossName,
    participants: selected,
    timestamp: new Date().toISOString(),
  });

  alert("Participation recorded!");
  await renderDashboard(weekId);
});

// --- Update Weekly Earnings ---
updateEarningsBtn.addEventListener("click", async () => {
  const weekId = weekSelect.value;
  const docRef = doc(db, "weeks", weekId);
  const diamonds = parseFloat(totalDiamondsInput.value) || 0;
  const peso = parseFloat(totalPesoInput.value) || 0;
  await updateDoc(docRef, {
    totalDiamonds: diamonds,
    totalPeso: peso,
  });
  alert("Earnings updated!");
});

// --- Delete Boss Record ---
async function deleteBossRecord(weekId, recordId) {
  await deleteDoc(doc(db, "weeks", weekId, "bossRecords", recordId));
  alert("Record deleted!");
  await renderDashboard(weekId);
}

// --- Edit Participants for a Boss Record ---
async function editBossRecord(weekId, recordId, oldData) {
  const currentMembers = oldData.participants.join(", ");
  const newMembers = prompt(`Edit participants (comma separated):`, currentMembers);
  if (newMembers === null) return;

  const newList = newMembers.split(",").map((m) => m.trim()).filter(Boolean);
  await updateDoc(doc(db, "weeks", weekId, "bossRecords", recordId), {
    participants: newList,
  });
  alert("Participants updated!");
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

  const dashboardEl = document.getElementById("dashboard");
  const bossListEl = document.getElementById("bossList");

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
  dashboardEl.innerHTML = html;

  // Boss Participants List
  let bossHtml = `<div class="bg-gray-800 p-4 rounded-lg shadow-md">
                    <h2 class="text-lg font-semibold mb-2">Boss Participants</h2>
                    <ul class="divide-y divide-gray-700">`;
  bossList.forEach((b) => {
    const date = new Date(b.timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    bossHtml += `<li class="py-2">
                  <span class="font-semibold">${b.bossName}</span> - ${date}<br>
                  <span class="text-sm text-gray-300">${b.participants.join(", ")}</span><br>
                  <button class="bg-blue-600 text-white px-2 py-1 rounded text-xs mr-2" onclick="editBossRecord('${weekId}','${b.id}', ${JSON.stringify(b).replace(/"/g, '&quot;')})">Edit</button>
                  <button class="bg-red-600 text-white px-2 py-1 rounded text-xs" onclick="deleteBossRecord('${weekId}','${b.id}')">Delete</button>
                </li>`;
  });
  bossHtml += `</ul></div>`;
  bossListEl.innerHTML = bossHtml;
}

// --- Initialize ---
loadWeeks();