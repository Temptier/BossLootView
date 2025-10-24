// admin.js
import {
    getFirestore, collection, addDoc, doc, updateDoc, query, orderBy, onSnapshot, deleteDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const db = getFirestore();

// DOM Elements
const lootListEl = document.getElementById('loot-list');
const addBossBtn = document.getElementById('add-boss-btn');
const addMemberBtn = document.getElementById('add-member-btn');
const newBossInput = document.getElementById('new-boss-name');
const newMemberInput = document.getElementById('new-member-name');
const lootNameInput = document.getElementById('loot-name-input');
const lootPriceInput = document.getElementById('loot-price-input');
const addLootBtn = document.getElementById('add-loot-btn');
const addNewLootEntryBtn = document.getElementById('add-new-loot-entry-btn');
const selectedBossSpan = document.getElementById('selected-boss');
const selectedParticipantsEl = document.getElementById('selected-participants');
const participantModal = document.getElementById('participant-modal');
const modalMemberList = document.getElementById('modal-member-list');
const editParticipantsBtn = document.getElementById('edit-participants-btn');
const saveParticipantsBtn = document.getElementById('save-participants-btn');
const closeParticipantsBtn = document.getElementById('close-participants-btn');

// Local state
let bosses = [];
let members = [];
let selectedBoss = null;
let selectedParticipants = [];
let lootItems = [];

// ===== Add Boss =====
addBossBtn.addEventListener('click', async () => {
    const name = newBossInput.value.trim();
    if (!name) return alert('Enter boss name');
    bosses.push(name);
    selectedBoss = name;
    selectedBossSpan.textContent = name;
    newBossInput.value = '';
});

// ===== Add Member =====
addMemberBtn.addEventListener('click', async () => {
    const name = newMemberInput.value.trim();
    if (!name) return alert('Enter member name');
    members.push(name);
    newMemberInput.value = '';
});

// ===== Add Loot Item =====
addLootBtn.addEventListener('click', () => {
    const name = lootNameInput.value.trim();
    const price = parseFloat(lootPriceInput.value) || 0;
    if (!name) return alert('Enter loot name');
    lootItems.push({name, price});
    lootNameInput.value = '';
    lootPriceInput.value = '';
    renderLootItems();
});

// ===== Render Loot Items =====
function renderLootItems() {
    const ul = document.createElement('ul');
    lootItems.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.name} - ${item.price}`;
        ul.appendChild(li);
    });
    const container = document.getElementById('loot-items-container');
    if(container) container.innerHTML = '';
    else {
        const div = document.createElement('div');
        div.id = 'loot-items-container';
        document.querySelector('.panel').appendChild(div);
    }
    document.getElementById('loot-items-container').appendChild(ul);
}

// ===== Participants Modal =====
editParticipantsBtn.addEventListener('click', () => {
    modalMemberList.innerHTML = '';
    members.forEach(m => {
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = m;
        if (selectedParticipants.includes(m)) checkbox.checked = true;
        div.appendChild(checkbox);
        div.appendChild(document.createTextNode(' ' + m));
        modalMemberList.appendChild(div);
    });
    participantModal.style.display = 'flex';
});

saveParticipantsBtn.addEventListener('click', () => {
    selectedParticipants = [];
    modalMemberList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if(cb.checked) selectedParticipants.push(cb.value);
    });
    renderSelectedParticipants();
    participantModal.style.display = 'none';
});

closeParticipantsBtn.addEventListener('click', () => {
    participantModal.style.display = 'none';
});

function renderSelectedParticipants() {
    selectedParticipantsEl.innerHTML = '';
    selectedParticipants.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        selectedParticipantsEl.appendChild(li);
    });
}

// ===== Add New Loot Entry =====
addNewLootEntryBtn.addEventListener('click', async () => {
    if(!selectedBoss) return alert('Select a boss');
    if(selectedParticipants.length === 0) return alert('Select participants');
    if(lootItems.length === 0) return alert('Add loot items');

    await addDoc(collection(db, 'lootEntries'), {
        boss: selectedBoss,
        members: selectedParticipants,
        loot: lootItems,
        date: new Date().toLocaleString(),
        settled: false,
        createdAt: new Date()
    });

    // Reset
    selectedBoss = null;
    selectedParticipants = [];
    lootItems = [];
    selectedBossSpan.textContent = 'None';
    selectedParticipantsEl.innerHTML = '';
    renderLootItems();
});

// ===== Render Recorded Loot Entries =====
const lootQuery = query(collection(db, 'lootEntries'), orderBy('createdAt','desc'));

onSnapshot(lootQuery, snapshot => {
    lootListEl.innerHTML = '';
    snapshot.forEach(docSnap => {
        const entry = {id: docSnap.id, ...docSnap.data()};
        const entryDiv = document.createElement('div');
        entryDiv.className = `loot-item ${entry.settled ? 'settled' : 'active'}`;
        entryDiv.style.margin = '5px 0';
        entryDiv.style.padding = '5px';

        // Collapsed header
        const collapsedDiv = document.createElement('div');
        collapsedDiv.className = 'collapsed-header';
        const totalPrice = entry.loot.reduce((a,b)=>a+b.price,0);
        const share = entry.members.length ? (totalPrice/entry.members.length).toFixed(2) : '0';
        collapsedDiv.innerHTML = `
            <div><strong>Boss:</strong> ${entry.boss} | <strong>Date:</strong> ${entry.date}</div>
            <div><strong>Status:</strong> ${entry.settled ? 'Settled' : 'Active'}</div>
        `;

        // Expanded content
        const expandedDiv = document.createElement('div');
        expandedDiv.style.display = 'none';
        expandedDiv.style.marginTop = '5px';

        // Members
        const membersDiv = document.createElement('div');
        membersDiv.innerHTML = `<strong>Members:</strong> ${entry.members.join(', ')}`;
        expandedDiv.appendChild(membersDiv);

        // Loot items
        const lootContainer = document.createElement('div');
        lootContainer.className = 'loot-list-container';
        entry.loot.forEach((item, idx) => {
            const lootRow = document.createElement('div');
            lootRow.className = 'loot-row';
            lootRow.style.display = 'flex';
            lootRow.style.justifyContent = 'space-between';
            lootRow.style.padding = '2px 0';

            if(entry.settled) {
                lootRow.innerHTML = `<span>${item.name}</span><span>${item.price}</span>`;
                lootRow.style.color = '#6b7280';
                lootRow.style.textDecoration = 'line-through';
            } else {
                const priceInput = document.createElement('input');
                priceInput.type = 'number';
                priceInput.value = item.price;
                priceInput.style.width = '60px';
                priceInput.addEventListener('change', async () => {
                    const newPrice = parseFloat(priceInput.value) || 0;
                    const updatedLoot = entry.loot.map((l,i)=> i===idx ? {...l, price:newPrice} : l);
                    await updateDoc(doc(db, 'lootEntries', entry.id), {loot: updatedLoot});
                });
                lootRow.appendChild(document.createTextNode(item.name));
                lootRow.appendChild(priceInput);
            }
            lootContainer.appendChild(lootRow);
        });
        expandedDiv.appendChild(lootContainer);

        // Toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = 'Show Details';
        toggleBtn.style.marginTop = '5px';
        toggleBtn.onclick = () => {
            if(expandedDiv.style.display==='none'){
                expandedDiv.style.display='block';
                toggleBtn.textContent='Hide Details';
            } else {
                expandedDiv.style.display='none';
                toggleBtn.textContent='Show Details';
            }
        };

        // Settle / Remove buttons
        const actionDiv = document.createElement('div');
        actionDiv.style.marginTop='5px';
        if(!entry.settled){
            const settleBtn = document.createElement('button');
            settleBtn.textContent = 'Settle';
            settleBtn.onclick = async () => {
                await updateDoc(doc(db, 'lootEntries', entry.id), {settled:true});
            };
            actionDiv.appendChild(settleBtn);
        }
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.style.marginLeft='5px';
        removeBtn.onclick = async () => {
            if(confirm('Remove this loot entry?')){
                await deleteDoc(doc(db, 'lootEntries', entry.id));
            }
        };
        actionDiv.appendChild(removeBtn);

        entryDiv.appendChild(collapsedDiv);
        entryDiv.appendChild(toggleBtn);
        entryDiv.appendChild(expandedDiv);
        entryDiv.appendChild(actionDiv);
        lootListEl.appendChild(entryDiv);
    });
});