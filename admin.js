// ===== Import Firebase =====
import { firebaseDB } from './firebase-init.js';
import {
    collection, addDoc, updateDoc, deleteDoc, doc,
    query, orderBy, onSnapshot, getDocs, getDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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
const changePasswordBtn = document.getElementById('change-password-btn');
const backBtn = document.getElementById('back-btn');

// ===== Edit Loot Modal Elements =====
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

// ===== Firestore Collections =====
const bossesCol = collection(firebaseDB, 'bosses');
const membersCol = collection(firebaseDB, 'members');
const lootCollection = collection(firebaseDB, 'lootEntries');

// ===== Helper: Update Loot Item + Auto-settle =====
async function updateLootItem(entryId, lootIndex, changes) {
    try {
        const entryRef = doc(firebaseDB, 'lootEntries', entryId);
        const entrySnap = await getDoc(entryRef);
        if (!entrySnap.exists()) throw new Error('Loot entry not found');

        const currentLoot = entrySnap.data().loot || [];
        const updatedLoot = currentLoot.map((item, i) =>
            i === lootIndex ? { ...item, ...changes } : item
        );

        await updateDoc(entryRef, { loot: updatedLoot });

        // auto-mark entry settled if all loot are settled
        const allSettled = updatedLoot.length > 0 && updatedLoot.every(l => l.settled);
        if (allSettled && !entrySnap.data().settled) {
            await updateDoc(entryRef, { settled: true });
        }
    } catch (err) {
        console.error('updateLootItem error:', err);
        alert('Failed to update loot item.');
    }
}

// ===== Load Bosses & Members =====
async function loadBossesAndMembers() {
    const bossDocs = await getDocs(bossesCol);
    bosses = bossDocs.docs.map(doc => doc.data().name);

    const memberDocs = await getDocs(membersCol);
    members = memberDocs.docs.map(doc => doc.data().name);
    members.sort((a, b) => a.localeCompare(b)); // sort alphabetically
}
loadBossesAndMembers();

// ===== Add Boss =====
addBossBtn.addEventListener('click', async () => {
    const name = newBossInput.value.trim();
    if (!name) return alert('Enter boss name');
    await addDoc(bossesCol, { name });
    bosses.push(name);
    newBossInput.value = '';
});

// ===== Add Member =====
addMemberBtn.addEventListener('click', async () => {
    const name = newMemberInput.value.trim();
    if (!name) return alert('Enter member name');
    await addDoc(membersCol, { name });
    members.push(name);
    members.sort((a, b) => a.localeCompare(b));
    newMemberInput.value = '';
});

// ===== Add Loot Item =====
addLootBtn.addEventListener('click', () => {
    const name = lootNameInput.value.trim();
    const price = parseFloat(lootPriceInput.value) || 0;
    if (!name) return alert('Enter loot name');
    lootItems.push({ name, price, settled: false });
    lootNameInput.value = '';
    lootPriceInput.value = '';
    renderLootItems();
});

// ===== Render Loot Items (Preview) =====
function renderLootItems() {
    lootItemsContainer.innerHTML = '';
    if (lootItems.length === 0) return;

    const ul = document.createElement('ul');
    ul.className = 'divide-y divide-gray-200';

    lootItems.forEach((item, idx) => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center py-2';

        const span = document.createElement('span');
        span.textContent = `${item.name} - ₱${item.price}`;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.className = 'bg-red-500 text-white px-3 py-1 rounded text-sm';
        removeBtn.onclick = () => {
            lootItems.splice(idx, 1);
            renderLootItems();
        };

        li.appendChild(span);
        li.appendChild(removeBtn);
        ul.appendChild(li);
    });

    lootItemsContainer.appendChild(ul);
}

// ===== Select Boss Modal =====
selectBossBtn.addEventListener('click', () => {
    modalBossList.innerHTML = '';
    bosses.forEach(boss => {
        const div = document.createElement('div');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'boss';
        radio.value = boss;
        if (selectedBoss === boss) radio.checked = true;
        div.appendChild(radio);
        div.appendChild(document.createTextNode(' ' + boss));
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

closeBossBtn.addEventListener('click', () => {
    document.getElementById('boss-modal').style.display = 'none';
});

// ===== Participants Modal =====
editParticipantsBtn.addEventListener('click', () => {
    modalMemberList.innerHTML = '';
    members.forEach(member => {
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = member;
        if (selectedParticipants.includes(member)) checkbox.checked = true;
        div.appendChild(checkbox);
        div.appendChild(document.createTextNode(' ' + member));
        modalMemberList.appendChild(div);
    });
    document.getElementById('participant-modal').style.display = 'flex';
});

saveParticipantsBtn.addEventListener('click', () => {
    selectedParticipants = [];
    const checked = modalMemberList.querySelectorAll('input[type="checkbox"]:checked');
    checked.forEach(c => selectedParticipants.push(c.value));
    selectedParticipantsEl.innerHTML = '';
    selectedParticipants.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        selectedParticipantsEl.appendChild(li);
    });
    document.getElementById('participant-modal').style.display = 'none';
});

closeParticipantsBtn.addEventListener('click', () => {
    document.getElementById('participant-modal').style.display = 'none';
});

// ===== Add New Loot Entry =====
addNewLootEntryBtn.addEventListener('click', async () => {
    if (!selectedBoss) return alert('Please select a boss first.');
    if (selectedParticipants.length === 0) return alert('Select at least one participant.');
    if (lootItems.length === 0) return alert('Add at least one loot.');

    const totalLootPrice = lootItems.reduce((sum, l) => sum + l.price, 0);
    const perLootShare = totalLootPrice / selectedParticipants.length;

    const newEntry = {
        boss: selectedBoss,
        participants: selectedParticipants,
        loot: lootItems,
        date: new Date().toISOString(),
        settled: false,
        totalLootPrice,
        perLootShare,
    };

    await addDoc(lootCollection, newEntry);
    lootItems = [];
    renderLootItems();
    selectedBoss = null;
    selectedBossSpan.textContent = 'None';
    selectedParticipants = [];
    selectedParticipantsEl.innerHTML = '';
    alert('Loot entry added!');
});

// ===== Render Loot Entries =====
function renderLootEntries(entries) {
    lootListEl.innerHTML = '';
    entries.forEach((entry, entryIdx) => {
        const div = document.createElement('div');
        div.className = 'border rounded-lg p-3 mb-3 bg-white shadow-sm';

        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-2';
        header.innerHTML = `
            <h3 class="font-semibold text-lg">${entry.boss}</h3>
            <span class="text-sm ${entry.settled ? 'text-green-600' : 'text-gray-500'}">
                ${entry.settled ? '✅ Settled' : '⏳ Unsettled'}
            </span>
        `;
        div.appendChild(header);

        const participantList = document.createElement('p');
        participantList.className = 'text-sm mb-2';
        participantList.textContent = `Participants: ${entry.participants.join(', ')}`;
        div.appendChild(participantList);

        const lootList = document.createElement('ul');
        lootList.className = 'divide-y divide-gray-200';
        entry.loot.forEach((loot, lootIndex) => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center py-1';

            const lootText = document.createElement('span');
            lootText.innerHTML = `
                ${loot.name} - ₱${loot.price} 
                ${loot.settled ? '<span class="text-green-600 text-sm">(Settled)</span>' : ''}
            `;

            const btnGroup = document.createElement('div');
            btnGroup.className = 'space-x-2';

            const settleBtn = document.createElement('button');
            settleBtn.textContent = 'Settle';
            settleBtn.className = 'bg-green-500 text-white px-2 py-1 rounded text-xs';
            settleBtn.disabled = loot.settled;

            settleBtn.addEventListener('click', async () => {
                const confirmSettle = confirm(`Mark "${loot.name}" as settled?`);
                if (!confirmSettle) return;

                await updateLootItem(entry.id, lootIndex, { settled: true });
            });

            btnGroup.appendChild(settleBtn);
            li.appendChild(lootText);
            li.appendChild(btnGroup);
            lootList.appendChild(li);
        });
        div.appendChild(lootList);

        const summary = document.createElement('p');
        summary.className = 'text-sm mt-2';
        summary.innerHTML = `
            <strong>Total Loot:</strong> ₱${entry.totalLootPrice.toFixed(2)} |
            <strong>Per Loot Share:</strong> ₱${entry.perLootShare.toFixed(2)}
        `;
        div.appendChild(summary);

        lootListEl.appendChild(div);
    });
}

// ===== Realtime Updates =====
onSnapshot(query(lootCollection, orderBy('date', 'desc')), (snapshot) => {
    const entries = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
    }));
    renderLootEntries(entries);
});

// ===== Back Button =====
backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});

// ===== Change Password Button =====
changePasswordBtn.addEventListener('click', () => {
    window.location.href = 'change-password.html';
});