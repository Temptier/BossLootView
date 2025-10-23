// ================= FIREBASE SETUP =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, getDoc, setDoc, doc, updateDoc, deleteDoc 
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

// ================= ELEMENTS =================
const statusMessage = document.getElementById("statusMessage");
const addMemberBtn = document.getElementById("addMemberBtn");
const addBossBtn = document.getElementById("addBossBtn");
const updateEarningsBtn = document.getElementById("updateEarningsBtn");

// ================= HELPERS =================
function showStatus(msg, color = "emerald") {
  statusMessage.textContent = msg;
  statusMessage.className = `text-${color}-400 font-semibold mb-3`;
  setTimeout(() => (statusMessage.textContent = ""), 3000);
}

// ================= AUTO CREATE WEEK RECORD =================
async function ensureCurrentWeekExists() {
  const now = new Date();
  const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
  const weekLabel = `${firstDayOfWeek.getFullYear()}-${firstDayOfWeek.getMonth() + 1}-${firstDayOfWeek.getDate()}`;

  const weekDoc = doc(db, "weeks", weekLabel);
  const weekSnap = await getDoc(weekDoc);

  if (!weekSnap.exists()) {
    await setDoc(weekDoc, {
      createdAt: new Date().toISOString(),
      totalDiamond: 0,
      totalPeso: 0,
    });
    showStatus(`✅ Created new week record: ${weekLabel}`);
  }
}

// ================= ADD GUILD MEMBER =================
async function addGuildMember() {
  const name = prompt("Enter new guild member name:");
  if (!name) return;

  const membersRef = collection(db, "members");
  const snapshot = await getDocs(membersRef);

  const duplicate = snapshot.docs.find((doc) => doc.data().name.toLowerCase() === name.toLowerCase());
  if (duplicate) {
    showStatus("⚠️ Member already exists.", "amber");
    return;
  }

  await addDoc(membersRef, { name });
  showStatus(`✅ Added member: ${name}`);
}

// ================= ADD BOSS =================
async function addBoss() {
  const bossName = prompt("Enter new boss name:");
  if (!bossName) return;

  const bossesRef = collection(db, "bosses");
  const snapshot = await getDocs(bossesRef);

  const duplicate = snapshot.docs.find((doc) => doc.data().name.toLowerCase() === bossName.toLowerCase());
  if (duplicate) {
    showStatus("⚠️ Boss already exists.", "amber");
    return;
  }

  await addDoc(bossesRef, { name: bossName });
  showStatus(`✅ Added boss: ${bossName}`);
}

// ================= UPDATE WEEKLY EARNINGS =================
async function updateWeeklyEarnings() {
  const diamond = parseFloat(prompt("Enter total diamond for the week:"));
  const peso = parseFloat(prompt("Enter total peso for the week:"));

  if (isNaN(diamond) || isNaN(peso)) {
    showStatus("⚠️ Invalid input.", "amber");
    return;
  }

  const now = new Date();
  const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
  const weekLabel = `${firstDayOfWeek.getFullYear()}-${firstDayOfWeek.getMonth() + 1}-${firstDayOfWeek.getDate()}`;

  const weekDoc = doc(db, "weeks", weekLabel);
  await updateDoc(weekDoc, { totalDiamond: diamond, totalPeso: peso });
  showStatus(`💰 Updated weekly earnings: ${diamond} 💎 / ₱${peso}`);
}

// ================= INITIALIZATION =================
window.addEventListener("DOMContentLoaded", async () => {
  await ensureCurrentWeekExists();

  addMemberBtn.addEventListener("click", addGuildMember);
  addBossBtn.addEventListener("click", addBoss);
  updateEarningsBtn.addEventListener("click", updateWeeklyEarnings);
});
// ================= DELETE MEMBER =================
async function deleteMember() {
  const name = prompt("Enter member name to delete:");
  if (!name) return;

  const membersRef = collection(db, "members");
  const snapshot = await getDocs(membersRef);

  const target = snapshot.docs.find((doc) => doc.data().name.toLowerCase() === name.toLowerCase());
  if (!target) {
    showStatus("⚠️ Member not found.", "amber");
    return;
  }

  await deleteDoc(doc(db, "members", target.id));
  showStatus(`🗑️ Deleted member: ${name}`);
}

// ================= DELETE BOSS =================
async function deleteBoss() {
  const name = prompt("Enter boss name to delete:");
  if (!name) return;

  const bossesRef = collection(db, "bosses");
  const snapshot = await getDocs(bossesRef);

  const target = snapshot.docs.find((doc) => doc.data().name.toLowerCase() === name.toLowerCase());
  if (!target) {
    showStatus("⚠️ Boss not found.", "amber");
    return;
  }

  await deleteDoc(doc(db, "bosses", target.id));
  showStatus(`🗑️ Deleted boss: ${name}`);
}

// ================= RELOAD DASHBOARD =================
async function loadDashboardSummary() {
  const weeksRef = collection(db, "weeks");
  const snapshot = await getDocs(weeksRef);

  const summaryDiv = document.getElementById("weekSummary");
  if (!summaryDiv) return;

  summaryDiv.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const week = docSnap.data();
    const div = document.createElement("div");
    div.className = "bg-gray-800 p-3 rounded-lg shadow mb-2";
    div.textContent = `📅 ${docSnap.id}: 💎 ${week.totalDiamond} | ₱ ${week.totalPeso}`;
    summaryDiv.appendChild(div);
  });
  showStatus("📊 Dashboard refreshed!");
}

// ================= SAFE WEEK CREATION =================
async function ensureWeek(weekLabel) {
  const weekDoc = doc(db, "weeks", weekLabel);
  const snap = await getDoc(weekDoc);
  if (!snap.exists()) {
    await setDoc(weekDoc, {
      createdAt: new Date().toISOString(),
      totalDiamond: 0,
      totalPeso: 0,
    });
    showStatus(`✅ Auto-created week: ${weekLabel}`);
  }
}

// ================= ADMIN ACTIONS =================
const deleteMemberBtn = document.getElementById("deleteMemberBtn");
const deleteBossBtn = document.getElementById("deleteBossBtn");
const refreshBtn = document.getElementById("refreshBtn");

deleteMemberBtn.addEventListener("click", deleteMember);
deleteBossBtn.addEventListener("click", deleteBoss);
refreshBtn.addEventListener("click", loadDashboardSummary);

// ================= PASSWORD GATEKEEPER =================
const adminPanel = document.getElementById("adminPanel");
const loginSection = document.getElementById("loginSection");
const loginBtn = document.getElementById("loginBtn");
const passwordInput = document.getElementById("passwordInput");

loginBtn.addEventListener("click", () => {
  const pass = passwordInput.value.trim();
  if (pass === "1") {
    loginSection.style.display = "none";
    adminPanel.style.display = "block";
    showStatus("🔓 Admin access granted!");
    ensureCurrentWeekExists();
    loadDashboardSummary();
  } else {
    alert("❌ Incorrect password");
  }
});

// ================= INIT =================
window.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ Admin system ready");
});