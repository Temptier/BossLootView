// ===================== FIREBASE INIT =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase config (ADMIN)
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

// ===================== LOGIN CONTROL =====================
const loginSection = document.getElementById("loginSection");
const adminSection = document.getElementById("adminSection");
const loginBtn = document.getElementById("loginBtn");
const passwordInput = document.getElementById("passwordInput");

const ADMIN_PASSWORD = "guildadmin123"; // Change this if needed
adminSection.style.display = "none";

loginBtn.addEventListener("click", () => {
  const enteredPassword = passwordInput.value.trim();
  if (enteredPassword === ADMIN_PASSWORD) {
    loginSection.style.display = "none";
    adminSection.style.display = "block";
    alert("✅ Access granted! Welcome, Admin.");
    loadWeeks();
  } else {
    alert("❌ Incorrect password. Please try again.");
    passwordInput.value = "";
  }
});

// ===================== AUTO WEEK CREATION =====================
async function ensureCurrentWeekExists() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  const weekId = startOfWeek.toISOString().split("T")[0];

  const weekRef = doc(db, "weeks", weekId);
  const weekSnap = await getDoc(weekRef);

  if (!weekSnap.exists()) {
    await setDoc(weekRef, {
      weekId,
      createdAt: new Date().toISOString(),
      totalPeso: 0,
      totalDiamond: 0,
    });
    console.log(`🆕 Created new week: ${weekId}`);
  }
}

// ===================== LOAD WEEKS =====================
async function loadWeeks() {
  await ensureCurrentWeekExists();
  const weekSelect = document.getElementById("weekSelect");
  weekSelect.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "weeks"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const option = document.createElement("option");
    const date = new Date(data.weekId);
    option.value = docSnap.id;
    option.textContent = date.toDateString();
    weekSelect.appendChild(option);
  });
}

// ===================== ADD MEMBER =====================
document.getElementById("addMemberBtn").addEventListener("click", async () => {
  const name = document.getElementById("memberName").value.trim();
  if (!name) return alert("Enter a member name");

  const membersRef = collection(db, "members");
  const snapshot = await getDocs(membersRef);
  const exists = snapshot.docs.some(doc => doc.data().name.toLowerCase() === name.toLowerCase());
  if (exists) return alert("⚠️ Member already exists!");

  await addDoc(membersRef, { name });
  alert("✅ Member added!");
  document.getElementById("memberName").value = "";
  loadMembers();
});

// ===================== ADD BOSS =====================
document.getElementById("addBossBtn").addEventListener("click", async () => {
  const name = document.getElementById("bossName").value.trim();
  if (!name) return alert("Enter a boss name");

  const bossesRef = collection(db, "bosses");
  const snapshot = await getDocs(bossesRef);
  const exists = snapshot.docs.some(doc => doc.data().name.toLowerCase() === name.toLowerCase());
  if (exists) return alert("⚠️ Boss already exists!");

  await addDoc(bossesRef, { name });
  alert("✅ Boss added!");
  document.getElementById("bossName").value = "";
  loadBosses();
});

// ===================== LOAD BOSSES & MEMBERS =====================
async function loadBosses() {
  const bossSelect = document.getElementById("bossSelect");
  bossSelect.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "bosses"));
  const bosses = querySnapshot.docs.map(doc => doc.data().name).sort((a, b) => a.localeCompare(b));
  bosses.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    bossSelect.appendChild(option);
  });
}

async function loadMembers() {
  const memberList = document.getElementById("memberList");
  memberList.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "members"));
  const members = querySnapshot.docs.map(doc => doc.data().name).sort((a, b) => a.localeCompare(b));

  members.forEach(name => {
    const div = document.createElement("div");
    div.className = "flex items-center gap-2";
    div.innerHTML = `
      <input type="checkbox" class="memberCheckbox" value="${name}">
      <label>${name}</label>
    `;
    memberList.appendChild(div);
  });

  // Add deselect all button
  const deselectBtn = document.createElement("button");
  deselectBtn.textContent = "Deselect All";
  deselectBtn.className = "mt-2 px-2 py-1 bg-gray-400 text-white rounded";
  deselectBtn.addEventListener("click", () => {
    document.querySelectorAll(".memberCheckbox").forEach(cb => (cb.checked = false));
  });
  memberList.appendChild(deselectBtn);
}

// ===================== ADD PARTICIPATION =====================
document.getElementById("addParticipationBtn").addEventListener("click", async () => {
  const boss = document.getElementById("bossSelect").value;
  const weekId = document.getElementById("weekSelect").value;
  const selectedMembers = Array.from(document.querySelectorAll(".memberCheckbox:checked")).map(cb => cb.value);

  if (!boss || selectedMembers.length === 0) {
    return alert("⚠️ Please select a boss and at least one member!");
  }

  await addDoc(collection(db, "participations"), {
    boss,
    members: selectedMembers,
    weekId,
    timestamp: new Date().toISOString(),
  });

  alert("✅ Participation added!");
  loadDashboard();
});

// ===================== UPDATE WEEKLY EARNINGS =====================
document.getElementById("updateEarningsBtn").addEventListener("click", async () => {
  const weekId = document.getElementById("weekSelect").value;
  const peso = parseFloat(document.getElementById("pesoEarnings").value) || 0;
  const diamond = parseFloat(document.getElementById("diamondEarnings").value) || 0;

  const weekRef = doc(db, "weeks", weekId);
  await updateDoc(weekRef, { totalPeso: peso, totalDiamond: diamond });
  alert("💰 Weekly earnings updated!");
  loadDashboard();
});

// ===================== LOAD DASHBOARD =====================
async function loadDashboard() {
  const weekId = document.getElementById("weekSelect").value;
  const dashContainer = document.getElementById("dashboard");
  dashContainer.innerHTML = "";

  const partSnap = await getDocs(collection(db, "participations"));
  const membersSnap = await getDocs(collection(db, "members"));

  const memberData = {};
  membersSnap.forEach(docSnap => (memberData[docSnap.data().name] = 0));

  partSnap.forEach(docSnap => {
    const data = docSnap.data();
    if (data.weekId === weekId) {
      data.members.forEach(name => {
        if (memberData[name] !== undefined) memberData[name]++;
      });
    }
  });

  const list = Object.entries(memberData)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `<div class="flex justify-between"><span>${name}</span><span>${count}</span></div>`)
    .join("");

  dashContainer.innerHTML = `<div class="p-4 bg-gray-100 rounded">${list}</div>`;
}

// ===================== INITIAL LOAD =====================
window.addEventListener("DOMContentLoaded", async () => {
  loadWeeks();
  loadBosses();
  loadMembers();
});