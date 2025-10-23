import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ------------------- Firebase Admin
const firebaseConfig = {
  apiKey: "AIzaSyBd1oHWW3HoQ6o9f3FP9W9aV1mqwEifQzw",
  authDomain: "guildlootsadmin.firebaseapp.com",
  projectId: "guildlootsadmin",
  storageBucket: "guildlootsadmin.firebasestorage.app",
  messagingSenderId: "895884983655",
  appId: "1:895884983655:web:2588fbb854394fb3ed43c2"
};
const appAdmin = initializeApp(firebaseConfigAdmin);
const dbAdmin = getFirestore(appAdmin);

// ------------------- DOM Elements
const weekSelector = document.getElementById("week-selector");
const totalDiamondInput = document.getElementById("total-earnings-diamond");
const totalPesoInput = document.getElementById("total-earnings-peso");
const selectBossContainer = document.getElementById("select-boss-container");
const selectMembersContainer = document.getElementById("select-members-container");
const addParticipationBtn = document.getElementById("add-participation-btn");
const deselectAllBtn = document.getElementById("deselect-all-btn");
const adminDashboard = document.getElementById("admin-dashboard");
const addBossInput = document.getElementById("add-boss-input");
const addBossBtn = document.getElementById("add-boss-btn");
const addMemberInput = document.getElementById("add-member-input");
const addMemberBtn = document.getElementById("add-member-btn");

let members = [];
let bosses = [];
let currentWeekId = null;

// ------------------- Load Members
async function loadMembers() {
  const snapshot = await getDocs(collection(dbAdmin, "members"));
  members = [];
  snapshot.forEach(m => members.push({ id: m.id, name: m.data().name }));
  members.sort((a,b)=> a.name.localeCompare(b.name));
  renderMembers();
}

// ------------------- Load Bosses
async function loadBosses() {
  const snapshot = await getDocs(collection(dbAdmin, "bosses"));
  bosses = [];
  snapshot.forEach(b => bosses.push({ id: b.id, name: b.data().name }));
  bosses.sort((a,b)=> a.name.localeCompare(b.name));
  renderBosses();
}

// ------------------- Render Bosses
function renderBosses() {
  selectBossContainer.innerHTML = "";
  bosses.forEach(b => {
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "boss";
    radio.value = b.id;
    radio.id = `boss-${b.id}`;
    const label = document.createElement("label");
    label.htmlFor = `boss-${b.id}`;
    label.textContent = b.name;
    label.className = "mr-2";
    selectBossContainer.appendChild(radio);
    selectBossContainer.appendChild(label);
  });
}

// ------------------- Render Members
function renderMembers() {
  selectMembersContainer.innerHTML = "";
  members.forEach(m => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = m.id;
    checkbox.id = `member-${m.id}`;
    const label = document.createElement("label");
    label.htmlFor = `member-${m.id}`;
    label.textContent = m.name;
    label.className = "mr-2";
    selectMembersContainer.appendChild(checkbox);
    selectMembersContainer.appendChild(label);
  });
}

// ------------------- Deselect All Members
deselectAllBtn.onclick = () => {
  selectMembersContainer.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
};

// ------------------- Add Boss
addBossBtn.onclick = async () => {
  const name = addBossInput.value.trim();
  if(!name) return alert("Enter boss name");
  await addDoc(collection(dbAdmin, "bosses"), { name });
  addBossInput.value = "";
  await loadBosses();
};

// ------------------- Add Member
addMemberBtn.onclick = async () => {
  const name = addMemberInput.value.trim();
  if(!name) return alert("Enter member name");
  // Prevent duplicate
  if(members.find(m=>m.name.toLowerCase()===name.toLowerCase())) return alert("Member already exists");
  await addDoc(collection(dbAdmin, "members"), { name });
  addMemberInput.value = "";
  await loadMembers();
};

// ------------------- Auto-create current week if missing
async function ensureCurrentWeek() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
  startOfWeek.setHours(0,0,0,0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
  endOfWeek.setHours(23,59,59,999);

  const weeksRef = collection(dbAdmin, "weeks");
  const q = query(weeksRef, where("start", "<=", now), where("end", ">=", now));
  const snapshot = await getDocs(q);

  if(snapshot.empty) {
    const docRef = await addDoc(weeksRef, { start: startOfWeek, end: endOfWeek });
    console.log("Created new week:", docRef.id);
  }
}

// ------------------- Load Weeks
async function loadWeeks() {
  const snapshot = await getDocs(collection(dbAdmin, "weeks"));
  weekSelector.innerHTML = "";
  if(snapshot.empty) return;
  snapshot.forEach(docSnap=>{
    const data = docSnap.data();
    const option = document.createElement("option");
    option.value = docSnap.id;
    const start = new Date(data.start);
    const end = new Date(data.end);
    option.textContent = `${start.toDateString()} - ${end.toDateString()}`;
    weekSelector.appendChild(option);
  });
  currentWeekId = weekSelector.options[0]?.value;
  weekSelector.value = currentWeekId;
  loadDashboard();
}

// ------------------- Add Participation
addParticipationBtn.addEventListener("click", async()=>{
  const bossId = selectBossContainer.querySelector("input[name=boss]:checked")?.value;
  const selectedMembers = Array.from(selectMembersContainer.querySelectorAll("input[type=checkbox]:checked")).map(cb=>cb.value);
  if(!bossId || selectedMembers.length===0) return alert("Select boss and members");

  const totalDiamond = parseFloat(totalDiamondInput.value) || 0;
  const totalPeso = parseFloat(totalPesoInput.value) || 0;

  await addDoc(collection(dbAdmin, "weeks", currentWeekId, "participations"), {
    bossId,
    members: selectedMembers,
    totalDiamond,
    totalPeso,
    timestamp: serverTimestamp()
  });

  loadDashboard();
});

// ------------------- Dashboard
async function loadDashboard() {
  if(!currentWeekId) return;
  const snapshot = await getDocs(collection(dbAdmin, "weeks", currentWeekId, "participations"));

  const memberMap = {};
  members.forEach(m => memberMap[m.id] = m.name);

  adminDashboard.innerHTML = "";
  snapshot.forEach(docSnap=>{
    const data = docSnap.data();
    const bossName = bosses.find(b=>b.id===data.bossId)?.name || "Unknown Boss";
    const timestamp = data.timestamp?.toDate();
    const timeStr = timestamp ? timestamp.toLocaleString("en-US", {
      month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", hour12:true
    }) : "Unknown Time";
    const participantNames = data.members.map(id=>memberMap[id]||"Unknown").join(", ");

    const div = document.createElement("div");
    div.className = "border-b py-2 flex justify-between items-center";
    div.innerHTML = `
      <div>
        <strong>${bossName}</strong> - ${timeStr}<br>
        <span class="text-sm text-gray-600">Participants: ${participantNames}</span><br>
        <span class="text-sm text-gray-600">💎 ${data.totalDiamond || 0} | ₱ ${data.totalPeso || 0}</span>
      </div>
      <div>
        <button class="bg-yellow-500 text-white p-1 rounded edit-btn">Edit</button>
        <button class="bg-red-500 text-white p-1 rounded delete-btn ml-1">Delete</button>
      </div>
    `;

    // Delete
    div.querySelector(".delete-btn").onclick = async()=>{
      if(confirm("Delete this entry?")){
        await deleteDoc(doc(dbAdmin, "weeks", currentWeekId, "participations", docSnap.id));
        loadDashboard();
      }
    };

    // Edit
    div.querySelector(".edit-btn").onclick = async()=>{
      const newMembers = prompt("Edit member IDs (comma-separated):", data.members.join(","));
      if(newMembers){
        const newArray = newMembers.split(",").map(s=>s.trim()).filter(s=>s!=="");
        await updateDoc(doc(dbAdmin, "weeks", currentWeekId, "participations", docSnap.id), { members: newArray });
        loadDashboard();
      }
    };

    adminDashboard.appendChild(div);
  });
}

// ------------------- Week Change
weekSelector.addEventListener("change", e=>{
  currentWeekId = e.target.value;
  loadDashboard();
});

// ------------------- Initial Load
await loadMembers();
await loadBosses();
await ensureCurrentWeek();
await loadWeeks();