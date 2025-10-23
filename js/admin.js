import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, doc, getDocs, setDoc, updateDoc, deleteDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// -------------------
// Firebase Admin Project
const firebaseConfigAdmin = {
  apiKey: "YOUR_PROJECT_A_APIKEY",
  authDomain: "YOUR_PROJECT_A.firebaseapp.com",
  projectId: "YOUR_PROJECT_A",
  storageBucket: "YOUR_PROJECT_A.appspot.com",
  messagingSenderId: "YOUR_PROJECT_A_MSID",
  appId: "YOUR_PROJECT_A_APPID"
};
const appAdmin = initializeApp(firebaseConfigAdmin);
const dbAdmin = getFirestore(appAdmin);

// ------------------- DOM Elements
const weekSelector = document.getElementById("week-selector");
const totalEarningsInput = document.getElementById("total-earnings");
const selectBossContainer = document.getElementById("select-boss-container");
const selectMembersContainer = document.getElementById("select-members-container");
const addParticipationBtn = document.getElementById("add-participation-btn");
const adminDashboard = document.getElementById("admin-dashboard");

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
    const checkbox = document.createElement("input");
    checkbox.type = "radio";
    checkbox.name = "boss";
    checkbox.value = b.id;
    checkbox.id = `boss-${b.id}`;
    const label = document.createElement("label");
    label.htmlFor = `boss-${b.id}`;
    label.textContent = b.name;
    label.className = "mr-2";
    selectBossContainer.appendChild(checkbox);
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

  // Deselect All Button
  const deselectBtn = document.createElement("button");
  deselectBtn.textContent = "Deselect All";
  deselectBtn.className = "bg-red-500 text-white p-1 rounded ml-2";
  deselectBtn.onclick = () => {
    selectMembersContainer.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = false);
  };
  selectMembersContainer.appendChild(deselectBtn);
}

// ------------------- Load Weeks
async function loadWeeks() {
  const weeksSnapshot = await getDocs(collection(dbAdmin, "weeks"));
  weekSelector.innerHTML = "";
  if(weeksSnapshot.empty) return;
  weeksSnapshot.forEach(docSnap=>{
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
  const selectedMembers = Array.from(selectMembersContainer.querySelectorAll("input[type=checkbox]:checked")).map(cb => cb.value);
  if(!bossId || selectedMembers.length===0) return alert("Select boss and members");

  const participationsRef = collection(dbAdmin, "weeks", currentWeekId, "participations");
  await addDoc(participationsRef, {
    bossId,
    members: selectedMembers,
    timestamp: serverTimestamp()
  });
  loadDashboard();
});

// ------------------- Dashboard
async function loadDashboard() {
  if(!currentWeekId) return;

  const participationsRef = collection(dbAdmin, "weeks", currentWeekId, "participations");
  const snapshot = await getDocs(participationsRef);

  // Map memberId => name
  const memberMap = {};
  members.forEach(m=> memberMap[m.id] = m.name);

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
        <span class="text-sm text-gray-600">Participants: ${participantNames}</span>
      </div>
      <div>
        <button class="bg-yellow-500 text-white p-1 rounded edit-btn">Edit</button>
        <button class="bg-red-500 text-white p-1 rounded delete-btn ml-1">Delete</button>
      </div>
    `;
    // Delete
    div.querySelector(".delete-btn").onclick = async ()=>{
      if(confirm("Delete this entry?")) {
        await deleteDoc(doc(dbAdmin, "weeks", currentWeekId, "participations", docSnap.id));
        loadDashboard();
      }
    };

    // Edit
    div.querySelector(".edit-btn").onclick = async ()=>{
      // Check participants
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

// ------------------- Week change
weekSelector.addEventListener("change", e=>{
  currentWeekId = e.target.value;
  loadDashboard();
});

// ------------------- Initial Load
await loadMembers();
await loadBosses();
await loadWeeks();