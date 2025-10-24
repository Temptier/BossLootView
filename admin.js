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
    lootItems.push({name, price, settled:false});
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
    if(!selectedBoss) return alert('Select a boss');
    if(selectedParticipants.length===0) return alert('Select participants');
    if(lootItems.length===0) return alert('Add at least one loot item');

    const now = new Date();
    const dateStr = now.toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true });

    await addDoc(lootCollection, {
        boss: selectedBoss,
        members: selectedParticipants,
        loot: lootItems,
        date: dateStr
    });

    // Reset form
    selectedBoss = null;
    selectedBossSpan.textContent = 'None';
    selectedParticipants = [];
    selectedParticipantsEl.innerHTML='';
    lootItems = [];
    renderLootItems();
});

// ===== Render Recorded Loot Entries =====
const lootQuery = query(lootCollection, orderBy('date','desc'));

onSnapshot(lootQuery, snapshot => {
    lootListEl.innerHTML='';
    snapshot.forEach(docSnap=>{
        const entry = docSnap.data();
        const entryId = docSnap.id;

        const entryDiv = document.createElement('div');
        entryDiv.className='p-3 border rounded-md bg-gray-50';
        entryDiv.style.borderColor='#4f46e5';

        // Header
        const headerDiv = document.createElement('div');
        headerDiv.className='flex justify-between items-center cursor-pointer';
        headerDiv.innerHTML = `<div><strong>Boss:</strong> ${entry.boss} | <strong>Date:</strong> ${entry.date}</div>`;
        entryDiv.appendChild(headerDiv);

        // Expanded
        const expandedDiv = document.createElement('div');
        expandedDiv.style.display='none';
        expandedDiv.className='mt-2 pl-2';

        // Members
        const membersDiv = document.createElement('div');
        membersDiv.innerHTML=`<strong>Participants:</strong> ${entry.members.join(', ')}`;
        membersDiv.className='mb-2';
        expandedDiv.appendChild(membersDiv);

        // Loot items with per-item settle
        const lootContainer = document.createElement('div');
        lootContainer.className='space-y-1';
        entry.loot.forEach((item, idx)=>{
            const lootRow = document.createElement('div');
            lootRow.className='flex justify-between items-center';

            const lootNameSpan = document.createElement('span');
            lootNameSpan.textContent = item.name;
            if(item.settled){
                lootNameSpan.style.textDecoration='line-through';
                lootNameSpan.style.color='#6b7280';
            }
            lootRow.appendChild(lootNameSpan);

            const lootPriceInput = document.createElement('input');
            lootPriceInput.type='number';
            lootPriceInput.value = item.price;
            lootPriceInput.style.width='60px';
            lootPriceInput.disabled = item.settled || false;

            lootPriceInput.addEventListener('change', async ()=>{
                const newPrice = parseFloat(lootPriceInput.value) || 0;
                const updatedLoot = entry.loot.map((l,i)=>i===idx ? {...l,price:newPrice} : l);
                await updateDoc(doc(firebaseDB,'lootEntries',entryId), {loot:updatedLoot});
            });

            lootRow.appendChild(lootPriceInput);

            // Settle button per loot item
            if(!item.settled){
                const settleBtn = document.createElement('button');
                settleBtn.textContent='Settle';
                settleBtn.style.backgroundColor='#10b981';
                settleBtn.style.color='#fff';
                settleBtn.style.marginLeft='5px';
                settleBtn.style.padding='2px 6px';
                settleBtn.style.borderRadius='5px';
                settleBtn.onclick = async ()=>{
                    const updatedLoot = entry.loot.map((l,i)=>i===idx? {...l, settled:true}:l);
                    await updateDoc(doc(firebaseDB,'lootEntries',entryId), {loot:updatedLoot});
                };
                lootRow.appendChild(settleBtn);
            }

            lootContainer.appendChild(lootRow);
        });

        expandedDiv.appendChild(lootContainer);

        // Total & per member (active items only)
        const activeLoot = entry.loot.filter(i=>!i.settled);
        const totalPrice = activeLoot.reduce((sum,i)=>sum+i.price,0);
        const perMember = entry.members.length>0 ? (totalPrice/entry.members.length).toFixed(2):0;

        const summaryDiv = document.createElement('div');
        summaryDiv.className='mt-2';
        summaryDiv.innerHTML = `<strong>Total Price (active):</strong> ${totalPrice} | <strong>Each Member Share:</strong> ${perMember}`;
        expandedDiv.appendChild(summaryDiv);

        entryDiv.appendChild(expandedDiv);

        // Toggle details
        headerDiv.addEventListener('click', ()=>{
            expandedDiv.style.display = expandedDiv.style.display==='none'?'block':'none';
        });

        // Remove entire entry
        const removeBtn = document.createElement('button');
        removeBtn.textContent='Remove Entry';
        removeBtn.style.backgroundColor='#ef4444';
        removeBtn.style.color='#fff';
        removeBtn.style.marginTop='5px';
        removeBtn.style.padding='2px 6px';
        removeBtn.style.borderRadius='5px';
        removeBtn.onclick=async ()=>{
            if(confirm('Remove this loot entry?')){
                await deleteDoc(doc(firebaseDB,'lootEntries',entryId));
            }
        };
        entryDiv.appendChild(removeBtn);

        lootListEl.appendChild(entryDiv);
    });
});