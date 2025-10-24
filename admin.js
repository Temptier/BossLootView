// admin.js
import {
    collection, addDoc, getDocs, query, onSnapshot, orderBy, updateDoc, doc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Elements
const bossListEl = document.getElementById('boss-list');
const memberListEl = document.getElementById('member-list');
const selectedBossEl = document.getElementById('selected-boss');
const selectedParticipantsEl = document.getElementById('selected-participants');
const lootNameInput = document.getElementById('loot-name-input');
const lootPriceInput = document.getElementById('loot-price-input');
const lootListEl = document.getElementById('loot-list');

const participantModal = document.getElementById('participant-modal');
const modalMemberList = document.getElementById('modal-member-list');
const saveParticipantsBtn = document.getElementById('save-participants-btn');
const closeParticipantsBtn = document.getElementById('close-participants-btn');

const newBossInput = document.getElementById('new-boss-name');
const addBossBtn = document.getElementById('add-boss-btn');
const newMemberInput = document.getElementById('new-member-name');
const addMemberBtn = document.getElementById('add-member-btn');
const addLootBtn = document.getElementById('add-loot-btn');
const addNewLootEntryBtn = document.getElementById('add-new-loot-entry-btn');

// State
let bosses = [];
let members = [];
let selectedBoss = null;
let selectedParticipants = [];
let lootItems = [];

// Firestore collections
const bossesCol = collection(window.firebaseDB, 'bosses');
const membersCol = collection(window.firebaseDB, 'members');
const lootEntriesCol = collection(window.firebaseDB, 'lootEntries');

// ===== Load Bosses and Members =====
async function loadBosses() {
    const snapshot = await getDocs(bossesCol);
    bosses = snapshot.docs.map(d => ({ id: d.id, name: d.data().name }));
    renderBosses();
}

async function loadMembers() {
    const snapshot = await getDocs(membersCol);
    members = snapshot.docs.map(d => ({ id: d.id, name: d.data().name }));
    renderMembers();
}

// ===== Render Lists =====
function renderBosses() {
    bossListEl.innerHTML = '';
    bosses.forEach(b => {
        const li = document.createElement('li');
        li.textContent = b.name;
        li.style.cursor = 'pointer';
        li.onclick = () => {
            selectedBoss = b;
            selectedBossEl.textContent = b.name;
        };
        bossListEl.appendChild(li);
    });
}

function renderMembers() {
    memberListEl.innerHTML = '';
    members.forEach(m => {
        const li = document.createElement('li');
        li.textContent = m.name;
        memberListEl.appendChild(li);
    });
}

// ===== Add Boss / Member =====
addBossBtn.addEventListener('click', async () => {
    const name = newBossInput.value.trim();
    if (!name) return;
    const docRef = await addDoc(bossesCol, { name });
    bosses.push({ id: docRef.id, name });
    renderBosses();
    newBossInput.value = '';
});

addMemberBtn.addEventListener('click', async () => {
    const name = newMemberInput.value.trim();
    if (!name) return;
    const docRef = await addDoc(membersCol, { name });
    members.push({ id: docRef.id, name });
    renderMembers();
    newMemberInput.value = '';
});

// ===== Add Loot Item =====
addLootBtn.addEventListener('click', () => {
    const name = lootNameInput.value.trim();
    const price = parseFloat(lootPriceInput.value);
    if (!name || isNaN(price)) return;
    lootItems.push({ name, price });
    lootNameInput.value = '';
    lootPriceInput.value = '';
    renderLootItems();
});

function renderLootItems() {
    // Optionally show loot items in Boss Loot Panel (not implemented in HTML here)
    console.log('Current loot items:', lootItems);
}

// ===== Participants Modal =====
document.getElementById('edit-participants-btn').addEventListener('click', () => {
    modalMemberList.innerHTML = '';
    members.forEach(m => {
        const div = document.createElement('div');
        div.innerHTML = `<input type="checkbox" data-id="${m.id}" ${selectedParticipants.find(p=>p.id===m.id)?'checked':''}> ${m.name}`;
        modalMemberList.appendChild(div);
    });
    participantModal.style.display = 'flex';
});

saveParticipantsBtn.addEventListener('click', () => {
    selectedParticipants = [];
    modalMemberList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.checked) {
            const member = members.find(m => m.id === cb.dataset.id);
            if (member) selectedParticipants.push(member);
        }
    });
    renderSelectedParticipants();
    participantModal.style.display = 'none';
});

closeParticipantsBtn.addEventListener('click', () => {
    participantModal.style.display = 'none';
});

function renderSelectedParticipants() {
    selectedParticipantsEl.innerHTML = '';
    selectedParticipants.forEach(m => {
        const li = document.createElement('li');
        li.textContent = m.name;
        selectedParticipantsEl.appendChild(li);
    });
}

// ===== Add New Loot Entry =====
addNewLootEntryBtn.addEventListener('click', async () => {
    if (!selectedBoss) return alert('Select a boss');
    if (selectedParticipants.length === 0) return alert('Select participants');
    if (lootItems.length === 0) return alert('Add at least one loot item');

    const entryObj = {
        boss: selectedBoss.name,
        date: new Date().toLocaleString(),
        members: selectedParticipants.map(m => m.name),
        loot: lootItems.map(l => ({ name: l.name, price: l.price })),
        settled: false,
        createdAt: new Date()
    };

    try {
        await addDoc(lootEntriesCol, entryObj);
        // Clear panel
        selectedBoss = null;
        selectedBossEl.textContent = 'None';
        selectedParticipants = [];
        renderSelectedParticipants();
        lootItems = [];
        alert('Loot entry added!');
    } catch (err) {
        console.error(err);
        alert('Failed to add entry: ' + err.message);
    }
});

// ===== Load and Render Recorded Loot Entries (Live) =====
const lootQuery = query(lootEntriesCol, orderBy('createdAt', 'desc'));
onSnapshot(lootQuery, snapshot => {
    lootListEl.innerHTML = '';
    snapshot.forEach(docSnap => {
        const entry = docSnap.data();
        const entryDiv = document.createElement('div');
        entryDiv.className = 'loot-item';
        entryDiv.style.border = '1px solid #ccc';
        entryDiv.style.margin = '5px 0';
        entryDiv.style.padding = '5px';

        // Boss and Date
        entryDiv.innerHTML = `
            <div><strong>Boss:</strong> ${entry.boss}</div>
            <div><strong>Date:</strong> ${entry.date}</div>
            <div><strong>Members:</strong> ${entry.members.join(', ')}</div>
        `;

        // Loot list
        entryDiv.innerHTML += `<div class="loot-list-container"></div>`;
        const lootContainer = entryDiv.querySelector('.loot-list-container');

        entry.loot.forEach((item, idx) => {
            const lootRow = document.createElement('div');
            lootRow.style.display = 'flex';
            lootRow.style.justifyContent = 'space-between';
            lootRow.style.marginBottom = '2px';
            lootRow.innerHTML = `
                <span>${item.name}</span>
                <input type="number" data-loot-idx="${idx}" value="${item.price}" style="width:60px;">
            `;
            lootContainer.appendChild(lootRow);

            // Update Firestore when price changes
            const priceInput = lootRow.querySelector('input');
            priceInput.addEventListener('change', async () => {
                const newPrice = parseFloat(priceInput.value) || 0;
                const docRef = doc(window.firebaseDB, 'lootEntries', docSnap.id);
                const updatedLoot = entry.loot.map((l, i) => i === idx ? {...l, price: newPrice} : l);
                await updateDoc(docRef, { loot: updatedLoot });
            });
        });

        // Total and Share
        const totalPrice = entry.loot.reduce((a,b)=>a+b.price,0);
        const share = entry.members.length ? (totalPrice / entry.members.length).toFixed(2) : '0';

        entryDiv.innerHTML += `
            <div><strong>Total Price:</strong> ${totalPrice}</div>
            <div><strong>Each Member Share:</strong> ${share}</div>
        `;

        // Buttons
        const btnContainer = document.createElement('div');
        btnContainer.style.marginTop = '5px';
        const settleBtn = document.createElement('button');
        settleBtn.textContent = entry.settled ? 'Settled' : 'Settle';
        settleBtn.disabled = entry.settled;
        settleBtn.style.marginRight = '5px';
        settleBtn.onclick = async () => {
            const docRef = doc(window.firebaseDB, 'lootEntries', docSnap.id);
            await updateDoc(docRef, { settled: true });
        };

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove Entry';
        removeBtn.onclick = async () => {
            const docRef = doc(window.firebaseDB, 'lootEntries', docSnap.id);
            await docRef.delete?.(); // optional chaining in case delete is unsupported
            try {
                await updateDoc(docRef, {}); // fallback
            } catch {}
        };

        btnContainer.appendChild(settleBtn);
        btnContainer.appendChild(removeBtn);
        entryDiv.appendChild(btnContainer);

        lootListEl.appendChild(entryDiv);
    });
});

// ===== Initialize =====
loadBosses();
loadMembers();