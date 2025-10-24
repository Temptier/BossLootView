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

// Edit Loot Modal
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
const bossesCol = collection(firebaseDB,'bosses');
const membersCol = collection(firebaseDB,'members');
const lootCollection = collection(firebaseDB,'lootEntries');

// ===== Load Bosses & Members from Firebase =====
async function loadBossesAndMembers(){
    const bossDocs = await getDocs(bossesCol);
    bosses = bossDocs.docs.map(d=>d.data().name);
    const memberDocs = await getDocs(membersCol);
    members = memberDocs.docs.map(d=>d.data().name);
}
loadBossesAndMembers();

// ===== Add Boss =====
addBossBtn.addEventListener('click', async ()=>{
    const name = newBossInput.value.trim();
    if(!name) return alert('Enter boss name');
    await addDoc(bossesCol,{name});
    bosses.push(name);
    newBossInput.value='';
});

// ===== Add Member =====
addMemberBtn.addEventListener('click', async ()=>{
    const name = newMemberInput.value.trim();
    if(!name) return alert('Enter member name');
    await addDoc(membersCol,{name});
    members.push(name);
    newMemberInput.value='';
});

// ===== Add Loot Item =====
addLootBtn.addEventListener('click', ()=>{
    const name = lootNameInput.value.trim();
    const price = parseFloat(lootPriceInput.value) || 0;
    if(!name) return alert('Enter loot name');
    lootItems.push({name, price, settled:false});
    lootNameInput.value='';
    lootPriceInput.value='';
    renderLootItems();
});

// ===== Render Loot Items Preview =====
function renderLootItems(){
    lootItemsContainer.innerHTML='';
    if(lootItems.length===0) return;

    const ul = document.createElement('ul');
    ul.className='list-disc ml-4';
    lootItems.forEach((item, idx)=>{
        const li = document.createElement('li');
        li.className='flex justify-between items-center';
        li.textContent = `${item.name} - ${item.price}`;
        ul.appendChild(li);
    });
    lootItemsContainer.appendChild(ul);
}

// ===== Select Boss Modal =====
selectBossBtn.addEventListener('click', ()=>{
    modalBossList.innerHTML='';
    bosses.forEach(b=>{
        const div = document.createElement('div');
        const radio = document.createElement('input');
        radio.type='radio'; radio.name='boss'; radio.value=b;
        if(selectedBoss===b) radio.checked=true;
        div.appendChild(radio);
        div.appendChild(document.createTextNode(' ' + b));
        modalBossList.appendChild(div);
    });
    document.getElementById('boss-modal').style.display='flex';
});

saveBossBtn.addEventListener('click', ()=>{
    const selected = modalBossList.querySelector('input[name="boss"]:checked');
    if(selected){
        selectedBoss = selected.value;
        selectedBossSpan.textContent = selectedBoss;
    }
    document.getElementById('boss-modal').style.display='none';
});

closeBossBtn.addEventListener('click', ()=>document.getElementById('boss-modal').style.display='none');

// ===== Participants Modal =====
editParticipantsBtn.addEventListener('click', ()=>{
    modalMemberList.innerHTML='';
    members.forEach(m=>{
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type='checkbox';
        checkbox.value = m;
        if(selectedParticipants.includes(m)) checkbox.checked=true;
        div.appendChild(checkbox);
        div.appendChild(document.createTextNode(' ' + m));
        modalMemberList.appendChild(div);
    });
    document.getElementById('participant-modal').style.display='flex';
});

saveParticipantsBtn.addEventListener('click', ()=>{
    selectedParticipants = [];
    const checked = modalMemberList.querySelectorAll('input[type="checkbox"]:checked');
    checked.forEach(c=>selectedParticipants.push(c.value));
    selectedParticipantsEl.innerHTML='';
    selectedParticipants.forEach(p=>{
        const li = document.createElement('li'); li.textContent=p; selectedParticipantsEl.appendChild(li);
    });
    document.getElementById('participant-modal').style.display='none';
});

closeParticipantsBtn.addEventListener('click', ()=>document.getElementById('participant-modal').style.display='none');

// ===== Add New Loot Entry =====
addNewLootEntryBtn.addEventListener('click', async ()=>{
    if(!selectedBoss) return alert('Select a boss');
    if(selectedParticipants.length===0) return alert('Select participants');
    if(lootItems.length===0) return alert('Add at least one loot item');

    const now = new Date();
    const dateStr = now.toLocaleString('en-US',{month:'short', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true});

    await addDoc(lootCollection,{
        boss:selectedBoss,
        members:selectedParticipants,
        loot:lootItems,
        date:dateStr,
        settled:false
    });

    // reset
    selectedBoss=null;
    selectedBossSpan.textContent='None';
    selectedParticipants=[]; selectedParticipantsEl.innerHTML='';
    lootItems=[]; renderLootItems();
});