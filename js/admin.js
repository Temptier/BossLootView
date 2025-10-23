// ---------- Firebase Setup ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, doc, setDoc,
  updateDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

// ---------- DOM Elements ----------
const loginScreen = document.getElementById("loginScreen");
const adminPanel = document.getElementById("adminPanel");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginError = document.getElementById("loginError");
const adminPassword = document.getElementById("adminPassword");

const weekSelect = document.getElementById("weekSelect");
const createWeekBtn = document.getElementById("createWeekBtn");
const totalDiamond = document.getElementById("totalDiamond");
const totalPeso = document.getElementById("totalPeso");
const updateEarningsBtn = document.getElementById("updateEarningsBtn");

const newMemberName = document.getElementById("newMemberName");
const addMemberBtn = document.getElementById("addMemberBtn");
const memberList = document.getElementById("memberList");
const memberSelectList = document.getElementById("memberSelectList");
const deselectAllBtn = document.getElementById("deselectAllBtn");

const bossName = document.getElementById("bossName");
const bossDate = document.getElementById("bossDate");
const addBossBtn = document.getElementById("addBossBtn");
const bossList = document.getElementById("bossList");

// ---------- Login / Logout ----------
const ADMIN_PASS = "1"; // simple password; can be stored in env later

loginBtn.onclick = () => {
  if (adminPassword.value === ADMIN_PASS) {
    loginScreen.classList.add("hidden");
    adminPanel.classList.remove("hidden");
  } else {
    loginError.classList.remove("hidden");
    setTimeout(() => loginError.classList.add("hidden"), 2000);
  }
};

logoutBtn.onclick = () => {
  adminPanel.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  adminPassword.value = "";
};

// ---------- Week Management ----------
async function loadWeeks() {
  const q = query(collection(db, "weeks"), orderBy("startDate"));
  const snap = await getDocs(q);
  weekSelect.innerHTML = "";
  snap.forEach(docSnap => {
    const data = docSnap.data();
    const start = new Date(data.startDate?.toDate ? data.startDate.toDate() : data.startDate);
    const end = new Date(data.endDate?.toDate ? data.endDate.toDate() : data.endDate);
    const label = `${start.toDateString()} - ${end.toDateString()}`;
    const opt = document.createElement("option");
    opt.value = docSnap.id;
    opt.textContent = label;
    weekSelect.appendChild(opt);
  });
}

async function createWeekIfMissing() {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const q = query(collection(db, "weeks"));
  const snap = await getDocs(q);
  let exists = false;

  snap.forEach(d => {
    const data = d.data();
    const s = new Date(data.startDate?.toDate ? data.startDate.toDate() : data.startDate);
    const e = new Date(data.endDate?.toDate ? data.endDate.toDate() : data.endDate);
    if (monday >= s && monday <= e) exists = true;
  });

  if (!exists) {
    await addDoc(collection(db, "weeks"), {
      startDate: monday,
      endDate: sunday,
      totalDiamond: 0,
      totalPeso: 0,
      createdAt: serverTimestamp()
    });
    alert("✅ New week automatically created!");
    loadWeeks();
  } else {
    alert("✅ Current week already exists.");
  }
}

createWeekBtn.onclick = createWeekIfMissing;

// ---------- Update Weekly Earnings ----------
updateEarningsBtn.onclick = async () => {
  const weekId = weekSelect.value;
  if (!weekId) return alert("Select a week first!");
  const ref = doc(db, "weeks", weekId);
  await updateDoc(ref, {
    totalDiamond: Number(totalDiamond.value) || 0,
    totalPeso: Number(totalPeso.value) || 0
  });
  alert("✅ Weekly earnings updated!");
};

// ---------- Members ----------
async function loadMembers() {
  const snap = await getDocs(collection(db, "members"));
  let members = [];
  snap.forEach(d => members.push({ id: d.id, ...d.data() }));
  members.sort((a, b) => a.name.localeCompare(b.name));

  memberList.innerHTML = "";
  memberSelectList.innerHTML = "";

  members.forEach(mem => {
    const li = document.createElement("li");
    li.textContent = mem.name;
    li.className = "flex justify-between items-center py-1";
    const del = document.createElement("button");
    del.textContent = "🗑️";
    del.className = "text-red-400 hover:text-red-600";
    del.onclick = async () => {
      await deleteDoc(doc(db, "members", mem.id));
      loadMembers();
    };
    li.appendChild(del);
    memberList.appendChild(li);

    // checkbox for participation
    const box = document.createElement("label");
    box.className = "flex items-center space-x-2 text-sm";
    box.innerHTML = `<input type='checkbox' value='${mem.name}' class='memberCheck accent-emerald-500'/> <span>${mem.name}</span>`;
    memberSelectList.appendChild(box);
  });
}

addMemberBtn.onclick = async () => {
  const name = newMemberName.value.trim();
  if (!name) return alert("Enter a name!");
  const all = await getDocs(collection(db, "members"));
  let exists = false;
  all.forEach(d => { if (d.data().name.toLowerCase() === name.toLowerCase()) exists = true; });
  if (exists) return alert("❌ Member already exists!");

  await addDoc(collection(db, "members"), { name });
  newMemberName.value = "";
  loadMembers();
};

// ---------- Boss Hunts ----------
addBossBtn.onclick = async () => {
  const weekId = weekSelect.value;
  if (!weekId) return alert("Select a week first!");
  const boss = bossName.value.trim();
  const date = bossDate.value;
  if (!boss || !date) return alert("Enter boss and date!");

  const selected = [...document.querySelectorAll(".memberCheck:checked")].map(i => i.value);
  if (!selected.length) return alert("Select at least one member!");

  await addDoc(collection(db, "weeks", weekId, "bossHunts"), {
    boss,
    date,
    participants: selected,
    createdAt: serverTimestamp()
  });

  bossName.value = "";
  bossDate.value = "";
  document.querySelectorAll(".memberCheck").forEach(c => c.checked = false);
};

async function loadBosses() {
  const weekId = weekSelect.value;
  if (!weekId) return;
  const q = query(collection(db, "weeks", weekId, "bossHunts"), orderBy("createdAt"));
  onSnapshot(q, snap => {
    bossList.innerHTML = "";
    snap.forEach(d => {
      const data = d.data();
      const div = document.createElement("div");
      div.className = "bg-gray-800 p-3 rounded-lg";
      div.innerHTML = `
        <div class='flex justify-between items-center'>
          <span class='font-semibold text-emerald-400'>${data.boss}</span>
          <button class='text-red-400 hover:text-red-600 text-sm' id='del-${d.id}'>Delete</button>
        </div>
        <div class='text-gray-400 text-sm'>
          ${new Date(data.date).toLocaleString()}
        </div>
        <div class='text-sm text-gray-300 mt-1'>
          Participants: ${data.participants.join(", ")}
        </div>`;
      bossList.appendChild(div);
      document.getElementById(`del-${d.id}`).onclick = async () => {
        await deleteDoc(doc(db, "weeks", weekId, "bossHunts", d.id));
      };
    });
  });
}

weekSelect.onchange = () => loadBosses();
deselectAllBtn.onclick = () => document.querySelectorAll(".memberCheck").forEach(c => (c.checked = false));

// ---------- Initial Load ----------
loadWeeks();
loadMembers();