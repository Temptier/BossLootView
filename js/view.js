import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ------------------- Firebase View-Only
const firebaseConfigView = {
  apiKey: "AIzaSyCgkO44xHVeQv9XJvjIktAQhdet9J-6hvM",
  authDomain: "guildlootsview.firebaseapp.com",
  projectId: "guildlootsview",
  storageBucket: "guildlootsview.firebasestorage.app",
  messagingSenderId: "535298106967",
  appId: "1:535298106967:web:c38f45b23b8782e2026512"
};
const appView = initializeApp(firebaseConfigView);
const dbView = getFirestore(appView);

// ------------------- Admin Login
const adminPassword = "YOUR_SECRET_PASSWORD"; // change this
document.getElementById("admin-login-btn").onclick = () => {
  const input = prompt("Enter admin password:");
  if(input === adminPassword){
    window.location.href = "admin.html"; // redirect to admin page
  } else {
    alert("Incorrect password");
  }
};

// ------------------- DOM Elements
const weekSelector = document.getElementById("week-selector");
const dashboardContent = document.getElementById("dashboard-content");
const bossParticipantsContent = document.getElementById("boss-participants-content");

let members = [];
let bosses = [];
let currentWeekId = null;

// ------------------- Load Members
async function loadMembers() {
  const snapshot = await getDocs(collection(dbView, "members"));
  members = [];
  snapshot.forEach(m => members.push({ id: m.id, name: m.data().name }));
  members.sort((a,b)=> a.name.localeCompare(b.name));
}

// ------------------- Load Bosses
async function loadBosses() {
  const snapshot = await getDocs(collection(dbView, "bosses"));
  bosses = [];
  snapshot.forEach(b => bosses.push({ id: b.id, name: b.data().name }));
  bosses.sort((a,b)=> a.name.localeCompare(b.name));
}

// ------------------- Load Weeks
async function loadWeeks() {
  const snapshot = await getDocs(collection(dbView, "weeks"));
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

// ------------------- Load Dashboard
async function loadDashboard() {
  if(!currentWeekId) return;

  const snapshot = await getDocs(collection(dbView, "weeks", currentWeekId, "participations"));
  const memberMap = {};
  members.forEach(m => memberMap[m.id] = m.name);

  dashboardContent.innerHTML = "";
  bossParticipantsContent.innerHTML = "";

  snapshot.forEach(docSnap=>{
    const data = docSnap.data();
    const bossName = bosses.find(b=>b.id===data.bossId)?.name || "Unknown Boss";
    const timestamp = data.timestamp?.toDate();
    const timeStr = timestamp ? timestamp.toLocaleString("en-US", {
      month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", hour12:true
    }) : "Unknown Time";

    const participantNames = data.members.map(id=>memberMap[id]||"Unknown").join(", ");

    // --- Dashboard: members & participation count
    data.members.forEach(id=>{
      const memberDiv = dashboardContent.querySelector(`#member-${id}`);
      if(memberDiv){
        const countSpan = memberDiv.querySelector(".count");
        countSpan.textContent = parseInt(countSpan.textContent)+1;
      } else {
        const div = document.createElement("div");
        div.id = `member-${id}`;
        div.innerHTML = `<strong>${memberMap[id]}</strong> - Participation: <span class="count">1</span> | 💎 ${data.totalDiamond} | ₱ ${data.totalPeso}`;
        dashboardContent.appendChild(div);
      }
    });

    // --- Boss Participants per Entry
    const bossDiv = document.createElement("div");
    bossDiv.className = "border-b py-2";
    bossDiv.innerHTML = `<strong>${bossName}</strong> - ${timeStr}<br>Participants: ${participantNames} | 💎 ${data.totalDiamond} | ₱ ${data.totalPeso}`;
    bossParticipantsContent.appendChild(bossDiv);
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
await loadWeeks();