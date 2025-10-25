// admin.js
import { firebaseDB } from './firebase-init.js';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, getDocs, getDoc } 
from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// ===== Navigation / Password =====
const backBtn = document.getElementById('back-btn');
const changePasswordBtn = document.getElementById('change-password-btn');

backBtn.addEventListener('click', () => window.location.href = 'index.html');

changePasswordBtn.addEventListener('click', () => {
  const current = localStorage.getItem('adminPassword');
  const input = prompt("Enter current password/phrase:");
  if (input !== current) return alert("Incorrect current password!");
  const newPass = prompt("Enter new password/phrase:");
  if (!newPass) return alert("Password cannot be empty.");
  localStorage.setItem('adminPassword', newPass);
  alert("Password/phrase updated successfully!");
});

// ===== DOM Elements =====
const addBossBtn = document.getElementById('add-boss-btn');
const addMemberBtn = document.getElementById('add-member-btn');
const newBossInput = document.getElementById('new-boss-name');
const newMemberInput = document.getElementById('new-member-name');
const selectBossBtn = document.getElementById('select-boss-btn');
const editParticipantsBtn = document.getElementById('edit-participants-btn');
const modalBossList = document.getElementById('modal-boss-list');
const modalMemberList = document.getElementById('modal-member-list');
const saveBossBtn = document.getElementById('save-boss-btn');
const closeBossBtn = document.getElementById('close-boss-btn');
const saveParticipantsBtn = document.getElementById('save-participants-btn');
const closeParticipantsBtn = document.getElementById('close-participants-btn');
const selectedBossSpan = document.getElementById('selected-boss');
const selectedParticipantsEl = document.getElementById('selected-participants');
const lootNameInput = document.getElementById('loot-name-input');
const lootPriceInput = document.getElementById('loot-price-input');
const addLootBtn = document.getElementById('add-loot-btn');
const lootItemsContainer = document.getElementById('loot-items-container');
const addNewLootEntryBtn = document.getElementById('add-new-loot-entry-btn');
const lootListEl = document.getElementById('loot-list');
const searchInput = document.getElementById('search-input');

// ===== Edit Loot Modal =====
const editLootModal = document.getElementById('edit-loot-modal');
const editLootNameSpan = document.getElementById('edit-loot-name');
const editLootPriceInput = document.getElementById('edit-loot-price-input');
const saveLootPriceBtn = document.getElementById('save-loot-price-btn');
const closeLootPriceBtn = document.getElementById('close-loot-price-btn');
let lootToEdit = null;

// ===== State =====
let bosses = [];
let members = [];
let selectedBoss = null;
let selectedParticipants = [];
let lootItems = [];
let allLootEntries = [];

// ===== Firestore Collections =====
const bossesCol = collection(firebaseDB, 'bosses');
const membersCol = collection(firebaseDB, 'members');
const lootCollection = collection(firebaseDB, 'lootEntries');

// ===== Load Bosses and Members =====
async function loadBossesAndMembers() {
  const bossDocs = await getDocs(bossesCol);
  bosses = bossDocs.docs.map(d => d.data().name);
  const memberDocs = await getDocs(membersCol);
  members = memberDocs.docs.map(d => d.data().name);
}
loadBossesAndMembers();

// ===== Add Boss =====
addBossBtn.addEventListener('click', async () => {
  const name = newBossInput.value.trim();
  if (!name) return alert('Enter boss name');
  if (bosses.includes(name)) return alert('Boss already exists!');
  await addDoc(bossesCol, { name });
  bosses.push(name);
  newBossInput.value = '';
});

// ===== Add Member =====
addMemberBtn.addEventListener('click', async () => {
  const name = newMemberInput.value.trim();
  if (!name) return alert('Enter member name');
  if (members.includes(name)) return alert('Member already exists!');
  await addDoc(membersCol, { name });
  members.push(name);
  newMemberInput.value = '';
});

// ===== Add Loot Item =====
addLootBtn.addEventListener('click', () => {
  const name = lootNameInput.value.trim();
  const price = parseFloat(lootPriceInput.value) || 0;
  if (!name) return alert('Enter loot name');
  if (lootItems.find(i => i.name.toLowerCase() === name.toLowerCase()))
    return alert('Duplicate loot name!');
  lootItems.push({ name, price, settled: false });
  lootNameInput.value = '';
  lootPriceInput.value = '';
  renderLootItems();
});

// ===== Render Loot Items Preview =====
function renderLootItems() {
  lootItemsContainer.innerHTML = '';
  if (lootItems.length === 0) return;

  lootItems.forEach((item, idx) => {
    const div = document.createElement('div');
    div.className = 'flex justify-between py-1';
    div.innerHTML = `<span>${item.name} - ${item.price}</span>
      <button class="bg-red-500 text-white px-2 py-1 rounded">Remove</button>`;
    div.querySelector('button').onclick = () => {
      lootItems.splice(idx, 1);
      renderLootItems();
    };
    lootItemsContainer.appendChild(div);
  });
}

// ===== Select Boss =====
selectBossBtn.addEventListener('click', () => {
  modalBossList.innerHTML = '';
  [...bosses].sort((a, b) => a.localeCompare(b)).forEach(b => {
    const div = document.createElement('div');
    div.innerHTML = `<input type="radio" name="boss" value="${b}" ${selectedBoss === b ? 'checked' : ''}> ${b}`;
    modalBossList.appendChild(div);
  });
  document.getElementById('boss-modal').style.display = 'flex';
});

saveBossBtn.addEventListener('click', () => {
  const selected = modalBossList.querySelector('input[name="boss"]:checked');
  if (selected) {
    selectedBoss = selected.value;
    selectedBossSpan.textContent = selectedBoss;
  }
  document.getElementById('boss-modal').style.display = 'none';
});
closeBossBtn.addEventListener('click', () => document.getElementById('boss-modal').style.display = 'none');

// ===== Participants Modal =====
editParticipantsBtn.addEventListener('click', () => {
  modalMemberList.innerHTML = '';
  [...members].sort((a, b) => a.localeCompare(b)).forEach(member => {
    const div = document.createElement('div');
    div.innerHTML = `<label><input type="checkbox" value="${member}" ${selectedParticipants.includes(member) ? 'checked' : ''}> ${member}</label>`;
    modalMemberList.appendChild(div);
  });
  document.getElementById('participant-modal').style.display = 'flex';
});

saveParticipantsBtn.addEventListener('click', () => {
  selectedParticipants = Array.from(modalMemberList.querySelectorAll('input:checked')).map(c => c.value);
  selectedParticipantsEl.innerHTML = selectedParticipants.map(p => `<li>${p}</li>`).join('');
  document.getElementById('participant-modal').style.display = 'none';
});
closeParticipantsBtn.addEventListener('click', () => document.getElementById('participant-modal').style.display = 'none');

// ===== Add New Loot Entry =====
addNewLootEntryBtn.addEventListener('click', async () => {
  if (!selectedBoss) return alert('Select a boss');
  if (selectedParticipants.length === 0) return alert('Select participants');
  if (lootItems.length === 0) return alert('Add loot items first');

  const dateStr = new Date().toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
  });

  await addDoc(lootCollection, {
    boss: selectedBoss,
    members: selectedParticipants,
    loot: lootItems,
    date: dateStr,
    settled: false
  });

  selectedBoss = null;
  selectedBossSpan.textContent = 'None';
  selectedParticipants = [];
  selectedParticipantsEl.innerHTML = '';
  lootItems = [];
  renderLootItems();
});

// ===== Render Loot Entries =====
const lootQuery = query(lootCollection, orderBy('date', 'desc'));
onSnapshot(lootQuery, snap => {
  allLootEntries = snap.docs.map(d => ({ id: d.id, data: d.data() }));
  renderLootEntries();
});

async function renderLootEntries(filterText = '') {
  lootListEl.innerHTML = '';

  const filtered = allLootEntries.filter(e => {
    const { boss, members } = e.data;
    return boss.toLowerCase().includes(filterText.toLowerCase()) ||
      members.some(m => m.toLowerCase().includes(filterText.toLowerCase()));
  });

  for (const entryObj of filtered) {
    const entry = entryObj.data;
    const id = entryObj.id;

    const allSettled = entry.loot.every(l => l.settled);
    if (allSettled && !entry.settled) await updateDoc(doc(firebaseDB, 'lootEntries', id), { settled: true });

    const div = document.createElement('div');
    div.className = 'p-3 border rounded-md bg-gray-50 mb-2';
    div.innerHTML = `
      <div class="flex justify-between">
        <div><b>Boss:</b> ${entry.boss} | <b>Date:</b> ${entry.date}</div>
        <div><b>Status:</b> ${entry.settled ? 'Settled' : 'Active'}</div>
      </div>
      <div class="mt-2">
        <div class="flex justify-between items-start">
          <div><b>Participants:</b><ul>${entry.members.map(m => `<li>${m}</li>`).join('')}</ul></div>
          <button class="bg-blue-500 text-white px-2 py-1 rounded edit-participants-btn" data-id="${id}">Edit Participants</button>
        </div>
        <div class="mt-2">${entry.loot.map((l, i) => `
          <div class="flex justify-between items-center">
            <span>${l.name}</span>
            <div class="flex gap-2">
              ${!entry.settled && !l.settled ? `
                <button class="bg-indigo-200 px-2 py-1 rounded edit-loot-btn" data-entry="${id}" data-index="${i}">${l.price}</button>
                <button class="bg-green-500 text-white px-2 py-1 rounded settle-btn" data-entry="${id}" data-index="${i}">Settle</button>` :
                `<span class="text-gray-500 line-through">${l.price}</span>`}
            </div>
          </div>`).join('')}</div>
        <div class="mt-2 font-semibold"><b>Total Price:</b> ${entry.loot.reduce((s, i) => s + i.price, 0)}</div>
        <button class="bg-red-500 text-white px-3 py-1 rounded mt-2 remove-entry-btn" data-id="${id}">Remove Entry</button>
      </div>`;

    lootListEl.appendChild(div);
  }

  // Event Listeners
  lootListEl.querySelectorAll('.edit-loot-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const entryId = e.target.dataset.entry;
      const lootIndex = +e.target.dataset.index;
      const entry = allLootEntries.find(x => x.id === entryId).data;
      const lootItem = entry.loot[lootIndex];
      lootToEdit = { entryId, lootIndex, lootItem };
      editLootNameSpan.textContent = lootItem.name;
      editLootPriceInput.value = lootItem.price;
      editLootModal.style.display = 'flex';
    });
  });

  lootListEl.querySelectorAll('.settle-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      const entryId = e.target.dataset.entry;
      const index = +e.target.dataset.index;
      if (!confirm('Settle this loot item?')) return;
      const ref = doc(firebaseDB, 'lootEntries', entryId);
      const snap = await getDoc(ref);
      const current = snap.data().loot.map((l, i) => i === index ? { ...l, settled: true } : l);
      await updateDoc(ref, { loot: current });
    });
  });

  lootListEl.querySelectorAll('.remove-entry-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      if (confirm('Remove this loot entry?'))
        await deleteDoc(doc(firebaseDB, 'lootEntries', e.target.dataset.id));
    });
  });

  lootListEl.querySelectorAll('.edit-participants-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      const id = e.target.dataset.id;
      const ref = doc(firebaseDB, 'lootEntries', id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return alert('Entry not found');
      const entry = snap.data();
      const allMembers = (await getDocs(membersCol)).docs.map(d => d.data().name).sort((a, b) => a.localeCompare(b));
      const cur = entry.members || [];
      const newList = prompt('Edit Participants (comma-separated):', cur.join(', '));
      if (newList === null) return;
      const cleaned = [...new Set(newList.split(',').map(v => v.trim()).filter(v => v))];
      await updateDoc(ref, { members: cleaned });
      alert('Participants updated!');
    });
  });
}

// ===== Edit Loot Modal =====
saveLootPriceBtn.addEventListener('click', async () => {
  if (!lootToEdit) return;
  const newPrice = parseFloat(editLootPriceInput.value) || 0;
  const ref = doc(firebaseDB, 'lootEntries', lootToEdit.entryId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return alert("Loot entry not found");
  const updated = snap.data().loot.map((l, i) => i === lootToEdit.lootIndex ? { ...l, price: newPrice } : l);
  await updateDoc(ref, { loot: updated });
  editLootModal.style.display = 'none';
  lootToEdit = null;
});
closeLootPriceBtn.addEventListener('click', () => {
  editLootModal.style.display = 'none';
  lootToEdit = null;
});

// ===== Search =====
searchInput.addEventListener('input', () => renderLootEntries(searchInput.value.trim()));