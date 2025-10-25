// admin.js (Part 1)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCgkO44xHVeQv9XJvjIktAQhdet9J-6hvM",
  authDomain: "guildlootsview.firebaseapp.com",
  projectId: "guildlootsview",
  storageBucket: "guildlootsview.firebasestorage.app",
  messagingSenderId: "535298106967",
  appId: "1:535298106967:web:c38f45b23b8782e2026512"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Firestore Collections
const bossesCol = collection(db, "bosses");
const membersCol = collection(db, "members");
const lootsCol = collection(db, "loots");

// UI Elements
const lootList = document.getElementById("loot-list");
const newBossInput = document.getElementById("new-boss");
const addBossBtn = document.getElementById("add-boss-btn");
const newMemberInput = document.getElementById("new-member");
const addMemberBtn = document.getElementById("add-member-btn");
const changePassBtn = document.getElementById("change-pass");
const backBtn = document.getElementById("back-btn");

let bosses = [];
let members = [];

// Load Bosses and Members
async function loadBosses() {
  const querySnap = await getDocs(bossesCol);
  bosses = querySnap.docs.map(d => d.data().name);
}

async function loadMembers() {
  const querySnap = await getDocs(membersCol);
  members = querySnap.docs.map(d => d.data().name);
  members.sort((a, b) => a.localeCompare(b));
}

// Prevent duplicate + Add Boss
addBossBtn.addEventListener("click", async () => {
  const name = newBossInput.value.trim();
  if (!name) return alert("Enter boss name");
  const exists = bosses.some(b => b.toLowerCase() === name.toLowerCase());
  if (exists) return alert("This boss already exists!");

  await addDoc(bossesCol, { name });
  bosses.push(name);
  newBossInput.value = "";
  alert("Boss added successfully!");
  renderBossAndMemberLists();
});

// Prevent duplicate + Add Member
addMemberBtn.addEventListener("click", async () => {
  const name = newMemberInput.value.trim();
  if (!name) return alert("Enter member name");
  const exists = members.some(m => m.toLowerCase() === name.toLowerCase());
  if (exists) return alert("This member already exists!");

  await addDoc(membersCol, { name });
  members.push(name);
  members.sort((a, b) => a.localeCompare(b));
  newMemberInput.value = "";
  alert("Member added successfully!");
  renderBossAndMemberLists();
});

// Password + Back buttons
changePassBtn.addEventListener("click", () => {
  const newPass = prompt("Enter new admin password/phrase:");
  if (newPass) {
    localStorage.setItem("adminPassword", newPass);
    alert("Password updated successfully!");
  }
});

backBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});

// Live Loot Updates
onSnapshot(lootsCol, (snapshot) => {
  const loots = [];
  snapshot.forEach(docSnap => {
    loots.push({ id: docSnap.id, ...docSnap.data() });
  });
  renderLoots(loots);
});

// Render Loot Entries
function renderLoots(loots) {
  lootList.innerHTML = "";
  loots.forEach(loot => {
    const isSettled = loot.status === "Settled";
    const div = document.createElement("div");
    div.className = `border rounded p-3 mb-3 bg-white shadow ${isSettled ? "border-green-400" : "border-indigo-300"}`;
    div.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center">
        <h3 class="text-lg font-semibold text-indigo-700">${loot.boss}</h3>
        <span class="text-sm ${isSettled ? "text-green-600" : "text-gray-600"}">Status: ${loot.status || "Unsettled"}</span>
      </div>
      <p class="text-sm text-gray-500">Date: ${loot.date}</p>
      <p class="text-sm"><strong>Loot:</strong> ${loot.loot}</p>
      <p class="text-sm"><strong>Price:</strong> ₱${loot.price ?? 0}</p>
      <p class="text-sm"><strong>Participants:</strong> ${loot.participants?.join(", ") || "None"}</p>
      <p class="text-sm mt-1 text-indigo-600">Each Member’s Share: ₱${loot.participants?.length ? Math.floor((loot.price || 0) / loot.participants.length) : 0}</p>
      <div class="flex flex-wrap gap-2 mt-3">
        <button class="bg-yellow-500 text-white px-2 py-1 rounded edit-loot" data-id="${loot.id}">Edit Price</button>
        <button class="bg-blue-500 text-white px-2 py-1 rounded edit-participants" data-id="${loot.id}">Edit Participants</button>
        <button class="bg-green-600 text-white px-2 py-1 rounded settle-loot" data-id="${loot.id}">Settle</button>
        <button class="bg-red-500 text-white px-2 py-1 rounded remove-loot" data-id="${loot.id}">Remove</button>
      </div>
    `;
    lootList.appendChild(div);
  });

  document.querySelectorAll(".edit-loot").forEach(btn =>
    btn.addEventListener("click", openEditLootModal)
  );
  document.querySelectorAll(".edit-participants").forEach(btn =>
    btn.addEventListener("click", openEditParticipantsModal)
  );
  document.querySelectorAll(".settle-loot").forEach(btn =>
    btn.addEventListener("click", settleLoot)
  );
  document.querySelectorAll(".remove-loot").forEach(btn =>
    btn.addEventListener("click", removeLoot)
  );
}

// admin.js (Part 2)

// ===== Edit Loot Modal =====
const editLootModal = document.getElementById("edit-loot-modal");
const editLootPriceInput = document.getElementById("edit-loot-price");
const saveLootPriceBtn = document.getElementById("save-loot-price");
const closeLootPriceBtn = document.getElementById("close-loot-modal");

let currentEditLoot = null;

// Open Edit Loot Modal
async function openEditLootModal(e) {
  const lootId = e.target.dataset.id;
  currentEditLoot = lootId;

  const lootRef = doc(db, "loots", lootId);
  const snapshot = await getDocs(lootsCol);
  const target = snapshot.docs.find(d => d.id === lootId)?.data();
  if (!target) return alert("Loot not found!");

  editLootPriceInput.value = target.price ?? 0;
  editLootModal.style.display = "flex";
}

// Save Updated Loot Price
saveLootPriceBtn.addEventListener("click", async () => {
  if (!currentEditLoot) return;
  const newPrice = parseFloat(editLootPriceInput.value) || 0;

  await updateDoc(doc(db, "loots", currentEditLoot), { price: newPrice });
  editLootModal.style.display = "none";
  currentEditLoot = null;
  alert("Loot price updated!");
});

closeLootPriceBtn.addEventListener("click", () => {
  editLootModal.style.display = "none";
  currentEditLoot = null;
});

// ===== Edit Participants Modal =====
const editParticipantsModal = document.getElementById("edit-participants-modal");
const participantsList = document.getElementById("participants-list");
const saveParticipantsBtn = document.getElementById("save-participants-btn");
const closeParticipantsBtn = document.getElementById("close-participants-modal");

let currentEditParticipants = null;

async function openEditParticipantsModal(e) {
  const lootId = e.target.dataset.id;
  currentEditParticipants = lootId;

  const snapshot = await getDocs(lootsCol);
  const target = snapshot.docs.find(d => d.id === lootId)?.data();
  if (!target) return alert("Loot not found!");

  participantsList.innerHTML = "";
  members.sort((a, b) => a.localeCompare(b)).forEach(member => {
    const label = document.createElement("label");
    label.className = "flex items-center gap-2 py-1";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = member;
    if (target.participants?.includes(member)) input.checked = true;
    label.appendChild(input);
    label.appendChild(document.createTextNode(member));
    participantsList.appendChild(label);
  });

  editParticipantsModal.style.display = "flex";
}

saveParticipantsBtn.addEventListener("click", async () => {
  if (!currentEditParticipants) return;
  const selected = Array.from(
    participantsList.querySelectorAll("input[type='checkbox']:checked")
  ).map(i => i.value);

  await updateDoc(doc(db, "loots", currentEditParticipants), {
    participants: selected
  });

  editParticipantsModal.style.display = "none";
  currentEditParticipants = null;
  alert("Participants updated!");
});

closeParticipantsBtn.addEventListener("click", () => {
  editParticipantsModal.style.display = "none";
  currentEditParticipants = null;
});

// ===== Settle Loot =====
async function settleLoot(e) {
  const id = e.target.dataset.id;
  if (!confirm("Are you sure you want to mark this loot as settled?")) return;
  await updateDoc(doc(db, "loots", id), { status: "Settled" });
  alert("Loot settled!");
}

// ===== Remove Loot =====
async function removeLoot(e) {
  const id = e.target.dataset.id;
  if (!confirm("Are you sure you want to delete this loot record?")) return;
  await deleteDoc(doc(db, "loots", id));
  alert("Loot record removed!");
}

// ===== Utility: Render lists =====
async function renderBossAndMemberLists() {
  await loadBosses();
  await loadMembers();
}

// ===== Auto-Mark Entry as Settled =====
onSnapshot(lootsCol, async (snapshot) => {
  const updates = [];
  snapshot.forEach(async docSnap => {
    const data = docSnap.data();
    if (data.lootItems && data.lootItems.every(l => l.status === "Settled")) {
      const ref = doc(db, "loots", docSnap.id);
      updates.push(updateDoc(ref, { status: "Settled" }));
    }
  });
  await Promise.all(updates);
});

// ===== Initialize =====
renderBossAndMemberLists();