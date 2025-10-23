// ===================== FIREBASE SETUP =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// ⚙️ ADMIN FIREBASE CONFIG
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

// ===================== DOM ELEMENTS =====================
const passwordScreen = document.getElementById("passwordScreen");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const adminPassword = document.getElementById("adminPassword");

const weekSelect = document.getElementById("weekSelect");
const refreshWeeks = document.getElementById("refreshWeeks");

const addBossBtn = document.getElementById("addBossBtn");
const newBossName = document.getElementById("newBossName");

const addMemberBtn = document.getElementById("addMemberBtn");
const newMemberName = document.getElementById("newMemberName");

const bossSelect = document.getElementById("bossSelect");
const memberList = document.getElementById("memberList");
const addParticipationBtn = document.getElementById("addParticipationBtn");
const deselectAllBtn = document.getElementById("deselectAll");

const totalDiamondsInput = document.getElementById("totalDiamondsInput");
const totalPesoInput = document.getElementById("totalPesoInput");
const updateEarningsBtn = document.getElementById("updateEarningsBtn");

const participationList = document.getElementById("participationList");

// ===================== ADMIN LOGIN =====================
const ADMIN_PASS = "guildadmin"; // 🔒 change this password anytime

loginBtn.addEventListener("click", () => {
  if (adminPassword.value.trim() === ADMIN_PASS) {
    passwordScreen.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    initializeData();
  } else {
    alert("❌ Incorrect password.");
  }
});

// ===================== INIT DATA =====================
async function initializeData() {
  await ensureCurrentWeekExists();
  await loadWeeks();
  await loadBosses();
  await loadMembers();
  await loadParticipation();
}

// ===================== WEEK HANDLING =====================
function getCurrentWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7)); // Monday
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6); // Sunday
  return { monday, sunday };
}

async function ensureCurrentWeekExists() {
  const { monday, sunday } = getCurrentWeekRange();
  const weekId = `${monday.toISOString().split("T")[0]}_${sunday.toISOString().split("T")[0]}`;
  const weekRef = doc(db, "weeks", weekId);
  const q = query(collection(db, "weeks"), where("id", "==", weekId));
  const snap = await getDocs(q);
  if (snap.empty) {
    await setDoc(weekRef, {
      id: weekId,
      start: monday.toDateString(),
      end: sunday.toDateString(),
      totalDiamonds: 0,
      totalPeso: 0,
    });
    console.log("✅ Created new week record:", weekId);
  }
}

async function loadWeeks() {
  weekSelect.innerHTML = "";
  const snap = await getDocs(collection(db, "weeks"));
  const weeks = [];
  snap.forEach(doc => weeks.push(doc.data()));
  weeks.sort((a, b) => new Date(b.start) - new Date(a.start));

  weeks.forEach(week => {
    const opt = document.createElement("option");
    opt.value = week.id;
    opt.textContent = `${week.start} - ${week.end}`;
    weekSelect.appendChild(opt);
  });
}

// ===================== ADD BOSSES =====================
addBossBtn.addEventListener("click", async () => {
  const name = newBossName.value.trim();
  if (!name) return alert("Enter boss name!");
  await addDoc(collection(db, "bosses"), { name });
  newBossName.value = "";
  await loadBosses();
});

async function loadBosses() {
  bossSelect.innerHTML = "";
  const snap = await getDocs(collection(db, "bosses"));
  const bosses = [];
  snap.forEach(doc => bosses.push({ id: doc.id, ...doc.data() }));
  bosses.sort((a, b) => a.name.localeCompare(b.name));

  bosses.forEach(boss => {
    const opt = document.createElement("option");
    opt.value = boss.id;
    opt.textContent = boss.name;
    bossSelect.appendChild(opt);
  });
}

// ===================== ADD MEMBERS =====================
addMemberBtn.addEventListener("click", async () => {
  const name = newMemberName.value.trim();
  if (!name) return alert("Enter member name!");
  const q = query(collection(db, "members"), where("name", "==", name));
  const snap = await getDocs(q);
  if (!snap.empty) return alert("Duplicate member!");

  await addDoc(collection(db, "members"), { name });
  newMemberName.value = "";
  await loadMembers();
});

async function loadMembers() {
  memberList.innerHTML = "";
  const snap = await getDocs(collection(db, "members"));
  const members = [];
  snap.forEach(doc => members.push({ id: doc.id, ...doc.data() }));
  members.sort((a, b) => a.name.localeCompare(b.name));

  members.forEach(member => {
    const div = document.createElement("div");
    div.innerHTML = `
      <label class="flex items-center gap-2">
        <input type="checkbox" value="${member.id}" class="memberCheckbox">
        <span>${member.name}</span>
      </label>
    `;
    memberList.appendChild(div);
  });
}

deselectAllBtn.addEventListener("click", () => {
  document.querySelectorAll(".memberCheckbox").forEach(cb => (cb.checked = false));
});

// ===================== ADD PARTICIPATION =====================
addParticipationBtn.addEventListener("click", async () => {
  const bossId = bossSelect.value;
  const checked = [...document.querySelectorAll(".memberCheckbox:checked")].map(cb => cb.value);
  if (!bossId || checked.length === 0) return alert("Select boss and members!");

  const bossSnap = await getDocs(collection(db, "bosses"));
  let bossName = "";
  bossSnap.forEach(doc => {
    if (doc.id === bossId) bossName = doc.data().name;
  });

  const now = new Date();
  const record = {
    weekId: weekSelect.value,
    bossId,
    bossName,
    members: checked,
    time: now.toISOString(),
  };
  await addDoc(collection(db, "participation"), record);
  await loadParticipation();
});

// ===================== LOAD PARTICIPATION =====================
async function loadParticipation() {
  participationList.innerHTML = "";
  const weekId = weekSelect.value;
  const q = query(collection(db, "participation"), where("weekId", "==", weekId));
  const snap = await getDocs(q);

  for (const docu of snap.docs) {
    const data = docu.data();
    const date = new Date(data.time).toLocaleString();
    const memberNames = [];
    for (const id of data.members) {
      const memSnap = await getDocs(collection(db, "members"));
      memSnap.forEach(d => {
        if (d.id === id) memberNames.push(d.data().name);
      });
    }

    const div = document.createElement("div");
    div.className = "bg-gray-800 p-3 rounded flex justify-between items-center";
    div.innerHTML = `
      <div>
        <p class="text-amber-400 font-semibold">${data.bossName}</p>
        <p class="text-sm text-gray-300">${date}</p>
        <p class="text-sm">${memberNames.join(", ")}</p>
      </div>
      <div class="flex gap-2">
        <button class="bg-blue-500 hover:bg-blue-600 px-2 py-1 rounded text-sm" data-id="${docu.id}" onclick="editParticipation('${docu.id}')">Edit</button>
        <button class="bg-red-500 hover:bg-red-600 px-2 py-1 rounded text-sm" data-id="${docu.id}" onclick="deleteParticipation('${docu.id}')">Delete</button>
      </div>
    `;
    participationList.appendChild(div);
  }
}

// ===================== DELETE & UPDATE EARNINGS =====================
window.deleteParticipation = async function (id) {
  if (confirm("Delete this participation?")) {
    await deleteDoc(doc(db, "participation", id));
    await loadParticipation();
  }
};

updateEarningsBtn.addEventListener("click", async () => {
  const weekId = weekSelect.value;
  const ref = doc(db, "weeks", weekId);
  await updateDoc(ref, {
    totalDiamonds: Number(totalDiamondsInput.value || 0),
    totalPeso: Number(totalPesoInput.value || 0),
  });
  alert("✅ Weekly earnings updated!");
});

// Refresh Button
refreshWeeks.addEventListener("click", initializeData);