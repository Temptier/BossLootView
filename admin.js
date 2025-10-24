// admin.js
import { firebaseDB } from './firebase-init.js';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

// ===== Load Bosses and Members from Firebase =====
async function loadBossesAndMembers() {
    const bossDocs = await getDocs(bossesCol);
    bosses = bossDocs.docs.map(doc => doc.data().name);

    const memberDocs = await getDocs(membersCol);
    members = memberDocs.docs.map(doc => doc.data().name);
}
loadBossesAndMembers();

// ===== Add Boss =====
addBossBtn.addEventListener('click', async () => {
    const name = newBossInput.value.trim();
    if(!name) return alert('Enter boss name');
    await addDoc(bossesCol, {name});
    bosses.push(name);
    newBossInput.value='';
});

// ===== Add Member =====
addMemberBtn.addEventListener('click', async () => {
    const name = newMemberInput.value.trim();
    if(!name) return alert('Enter member name');
    await addDoc(membersCol, {name});
    members.push(name);
    newMemberInput.value='';
});

// ===== Add Loot Item =====
addLootBtn.addEventListener('click', () => {
    const name = lootNameInput.value.trim();
    const price = parseFloat(lootPriceInput.value) || 0;
    if(!name) return alert('Enter loot name');
    lootItems.push({name, price});
    lootNameInput.value='';
    lootPriceInput.value='';
    renderLootItems();
});

// ===== Render Loot Items Preview =====
function renderLootItems() {
    lootItemsContainer.innerHTML='';
    if(lootItems.length===0) return;

    const ul = document.createElement('ul');
    ul.style.listStyle='none';
    ul.style.padding='0';

    lootItems.forEach((item,idx)=>{
        const li = document.createElement('li');
        li.style.display='flex';
        li.style.justifyContent='space-between';
        li.style.alignItems='center';
        li.style.padding='3px 0';

        const span = document.createElement('span');
        span.textContent=`${item.name} - ${item.price}`;

        const removeBtn = document.createElement('button');
        removeBtn.textContent='Remove';
        removeBtn.style.backgroundColor='#ef4444';
        removeBtn.style.color='#fff';
        removeBtn.style.padding='2px 6px';
        removeBtn.style.borderRadius='5px';
        removeBtn.onclick=()=>{lootItems.splice(idx,1); renderLootItems();};

        li.appendChild(span);
        li.appendChild(removeBtn);
        ul.appendChild(li);
    });

    lootItemsContainer.appendChild(ul);
}

// ===== Select Boss Modal =====
selectBossBtn.addEventListener('click', () => {
    modalBossList.innerHTML='';
    bosses.forEach(boss=>{
        const div = document.createElement('div');
        const radio = document.createElement('input');
        radio.type='radio';
        radio.name='boss';
        radio.value=boss;
        if(selectedBoss===boss) radio.checked=true;
        div.appendChild(radio);
        div.appendChild(document.createTextNode(' ' + boss));
        modalBossList.appendChild(div);
    });
    document.getElementById('boss-modal').style.display='flex';
});

saveBossBtn.addEventListener('click', () => {
    const selected = modalBossList.querySelector('input[name="boss"]:checked');
    if(selected){
        selectedBoss = selected.value;
        selectedBossSpan.textContent = selectedBoss;
    }
    document.getElementById('boss-modal').style.display='none';
});

closeBossBtn.addEventListener('click', ()=>{document.getElementById('boss-modal').style.display='none';});

// ===== Participants Modal =====
editParticipantsBtn.addEventListener('click', () => {
    modalMemberList.innerHTML='';
    members.forEach(member=>{
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type='checkbox';
        checkbox.value = member;
        if(selectedParticipants.includes(member)) checkbox.checked=true;
        div.appendChild(checkbox);
        div.appendChild(document.createTextNode(' '+member));
        modalMemberList.appendChild(div);
    });
    document.getElementById('participant-modal').style.display='flex';
});

saveParticipantsBtn.addEventListener('click', () => {
    selectedParticipants = [];
    const checked = modalMemberList.querySelectorAll('input[type="checkbox"]:checked');
    checked.forEach(c=>selectedParticipants.push(c.value));
    selectedParticipantsEl.innerHTML='';
    selectedParticipants.forEach(p=>{
        const li = document.createElement('li');
        li.textContent = p;
        selectedParticipantsEl.appendChild(li);
    });
    document.getElementById('participant-modal').style.display='none';
});

closeParticipantsBtn.addEventListener('click', ()=>{document.getElementById('participant-modal').style.display='none';});

// ===== Add New Loot Entry =====
addNewLootEntryBtn.addEventListener('click', async () => {
    if (!selectedBoss) return alert('Select a boss');
    if (selectedParticipants.length === 0) return alert('Select participants');
    if (lootItems.length === 0) return alert('Add at least one loot item');

    // Validate existence
    if (!bosses.includes(selectedBoss)) return alert('Selected boss does not exist');
    const invalidMembers = selectedParticipants.filter(p => !members.includes(p));
    if (invalidMembers.length > 0) return alert(`Invalid participants: ${invalidMembers.join(', ')}`);

    const date = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const lootEntry = {
        boss: selectedBoss,
        date: date,
        members: selectedParticipants,
        loot: lootItems,
        settled: false
    };

    try {
        await addDoc(lootCollection, lootEntry);

        // Clear temp selections
        lootItems=[];
        renderLootItems();
        selectedBoss=null;
        selectedBossSpan.textContent='None';
        selectedParticipants=[];
        selectedParticipantsEl.innerHTML='';
        alert('Loot entry added successfully!');
    } catch (err) {
        console.error(err);
        alert('Failed to add loot entry');
    }
});

// ===== Render Recorded Loot Entries =====
const lootQuery = query(lootCollection, orderBy('date','desc'));
onSnapshot(lootQuery, snapshot=>{
    lootListEl.innerHTML='';
    snapshot.forEach(docSnap=>{
        const entry = {id: docSnap.id, ...docSnap.data()};
        const entryDiv = document.createElement('div');
        entryDiv.style.padding='10px';
        entryDiv.style.border='1px solid #4f46e5';
        entryDiv.style.borderRadius='8px';
        entryDiv.style.backgroundColor = entry.settled?'#f3f4f6':'#ffffff';

        // Collapsed Header
        const collapsedDiv = document.createElement('div');
        collapsedDiv.style.display='flex';
        collapsedDiv.style.justifyContent='space-between';
        collapsedDiv.style.alignItems='center';
        collapsedDiv.innerHTML = `<div><strong>Boss:</strong> ${entry.boss} | <strong>Date:</strong> ${entry.date}</div>
                                 <div><strong>Status:</strong> ${entry.settled?'Settled':'Active'}</div>`;

        // Expanded content
        const expandedDiv = document.createElement('div');
        expandedDiv.style.display='none';
        expandedDiv.style.marginTop='10px';
        expandedDiv.style.paddingLeft='5px';

        const membersDiv = document.createElement('div');
        membersDiv.innerHTML=`<strong>Members:</strong> ${entry.members.join(', ')}`;
        expandedDiv.appendChild(membersDiv);

        const lootContainer = document.createElement('div');
        entry.loot.forEach((item,idx)=>{
            const lootRow=document.createElement('div');
            lootRow.style.display='flex';
            lootRow.style.justifyContent='space-between';
            lootRow.style.alignItems='center';
            lootRow.style.padding='3px 0';

            if(entry.settled){
                lootRow.innerHTML=`<span>${item.name}</span><span>${item.price}</span>`;
                lootRow.style.color='#6b7280';
                lootRow.style.textDecoration='line-through';
            } else {
                const nameSpan = document.createElement('span');
                nameSpan.textContent = item.name;

                const priceInput = document.createElement('input');
                priceInput.type = 'number';
                priceInput.value = item.price;
                priceInput.style.width = '60px';
                priceInput.addEventListener('change', async () => {
                    const newPrice = parseFloat(priceInput.value) || 0;
                    const updatedLoot = entry.loot.map((l,i) => i===idx ? {...l, price:newPrice} : l);
                    await updateDoc(doc(firebaseDB,'lootEntries',entry.id), {loot: updatedLoot});
                });

                lootRow.appendChild(nameSpan);
                lootRow.appendChild(priceInput);
            }
            lootContainer.appendChild(lootRow);
        });
        expandedDiv.appendChild(lootContainer);

        // Toggle details button
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = 'Show Details';
        toggleBtn.style.marginTop='5px';
        toggleBtn.onclick = () => {
            if(expandedDiv.style.display === 'none'){
                expandedDiv.style.display='block';
                toggleBtn.textContent='Hide Details';
            } else {
                expandedDiv.style.display='none';
                toggleBtn.textContent='Show Details';
            }
        };

        // Action buttons
        const actionDiv = document.createElement('div');
        actionDiv.style.marginTop='5px';

        if(!entry.settled){
            const settleBtn = document.createElement('button');
            settleBtn.textContent='Settle';
            settleBtn.style.backgroundColor='#10b981';
            settleBtn.style.color='#fff';
            settleBtn.style.marginRight='5px';
            settleBtn.onclick = async () => {
                await updateDoc(doc(firebaseDB,'lootEntries',entry.id), {settled:true});
            };
            actionDiv.appendChild(settleBtn);
        }

        const removeBtn = document.createElement('button');
        removeBtn.textContent='Remove';
        removeBtn.style.backgroundColor='#ef4444';
        removeBtn.style.color='#fff';
        removeBtn.onclick = async () => {
            if(confirm('Remove this loot entry?')){
                await deleteDoc(doc(firebaseDB,'lootEntries',entry.id));
            }
        };
        actionDiv.appendChild(removeBtn);

        // Append everything
        entryDiv.appendChild(collapsedDiv);
        entryDiv.appendChild(toggleBtn);
        entryDiv.appendChild(expandedDiv);
        entryDiv.appendChild(actionDiv);
        lootListEl.appendChild(entryDiv);
    });
});