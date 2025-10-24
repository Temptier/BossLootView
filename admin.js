// admin.js
import { firebaseDB } from './firebase-init.js';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

const editLootModal = document.getElementById('edit-loot-modal');
const editLootNameSpan = document.getElementById('edit-loot-name');
const editLootPriceInput = document.getElementById('edit-loot-price-input');
const saveLootPriceBtn = document.getElementById('save-loot-price-btn');
const closeLootPriceBtn = document.getElementById('close-loot-price-btn');

const changePasswordBtn = document.getElementById('change-password-btn');

let lootToEdit = null;

// ===== State =====
let bosses = [];
let members = [];
let selectedBoss = null;
let selectedParticipants = [];
let lootItems = [];

// ===== Firebase Collections =====
const bossesCol = collection(firebaseDB,'bosses');
const membersCol = collection(firebaseDB,'members');
const lootCollection = collection(firebaseDB,'lootEntries');

// ===== Load Bosses and Members =====
async function loadBossesAndMembers() {
    const bossDocs = await getDocs(bossesCol);
    bosses = bossDocs.docs.map(doc=>doc.data().name);

    const memberDocs = await getDocs(membersCol);
    members = memberDocs.docs.map(doc=>doc.data().name);
}
loadBossesAndMembers();

// ===== Add Boss =====
addBossBtn.addEventListener('click', async () => {
    const name = newBossInput.value.trim();
    if(!name) return alert('Enter boss name');
    await addDoc(bossesCol,{name});
    bosses.push(name);
    newBossInput.value='';
});

// ===== Add Member =====
addMemberBtn.addEventListener('click', async () => {
    const name = newMemberInput.value.trim();
    if(!name) return alert('Enter member name');
    await addDoc(membersCol,{name});
    members.push(name);
    newMemberInput.value='';
});

// ===== Change Password/Phrase =====
changePasswordBtn.addEventListener('click', () => {
    const newPassword = prompt("Enter new admin password/phrase:");
    if(!newPassword) return alert("Password cannot be empty!");
    localStorage.setItem('adminPassword', newPassword);
    alert("Password/phrase updated successfully!");
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

// ===== Render Loot Items =====
function renderLootItems() {
    lootItemsContainer.innerHTML='';
    if(lootItems.length===0) return;

    const ul = document.createElement('ul');
    ul.className='space-y-1';
    lootItems.forEach((item,idx)=>{
        const li = document.createElement('div');
        li.className='flex justify-between items-center';
        li.innerHTML = `<span>${item.name} - ${item.price}</span>`;
        const removeBtn = document.createElement('button');
        removeBtn.textContent='Remove';
        removeBtn.className='bg-red-500 text-white px-2 py-1 rounded ml-2 hover:bg-red-600';
        removeBtn.onclick = ()=>{lootItems.splice(idx,1); renderLootItems();};
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
    document.getElementById('boss-modal').classList.remove('hidden');
});

saveBossBtn.addEventListener('click', ()=>{
    const selected = modalBossList.querySelector('input[name="boss"]:checked');
    if(selected){
        selectedBoss = selected.value;
        selectedBossSpan.textContent = selectedBoss;
    }
    document.getElementById('boss-modal').classList.add('hidden');
});

closeBossBtn.addEventListener('click', ()=>{document.getElementById('boss-modal').classList.add('hidden');});

// ===== Participants Modal =====
editParticipantsBtn.addEventListener('click', ()=>{
    modalMemberList.innerHTML='';
    members.forEach(member=>{
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type='checkbox';
        checkbox.value=member;
        if(selectedParticipants.includes(member)) checkbox.checked=true;
        div.appendChild(checkbox);
        div.appendChild(document.createTextNode(' '+member));
        modalMemberList.appendChild(div);
    });
    document.getElementById('participant-modal').classList.remove('hidden');
});

saveParticipantsBtn.addEventListener('click', ()=>{
    selectedParticipants = [];
    const checked = modalMemberList.querySelectorAll('input[type="checkbox"]:checked');
    checked.forEach(c=>selectedParticipants.push(c.value));
    selectedParticipantsEl.innerHTML='';
    selectedParticipants.forEach(p=>{
        const li = document.createElement('li');
        li.textContent=p;
        selectedParticipantsEl.appendChild(li);
    });
    document.getElementById('participant-modal').classList.add('hidden');
});

closeParticipantsBtn.addEventListener('click', ()=>{document.getElementById('participant-modal').classList.add('hidden');});

// ===== Add New Loot Entry =====
addNewLootEntryBtn.addEventListener('click', async () => {
    if(!selectedBoss) return alert('Select a boss');
    if(selectedParticipants.length===0) return alert('Select participants');
    if(lootItems.length===0) return alert('Add at least one loot item');

    const now = new Date();
    const dateStr = now.toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true});

    await addDoc(lootCollection,{
        boss: selectedBoss,
        members: selectedParticipants,
        loot: lootItems,
        date: dateStr,
        settled:false
    });

    // Reset
    selectedBoss=null;
    selectedBossSpan.textContent='None';
    selectedParticipants=[];
    selectedParticipantsEl.innerHTML='';
    lootItems=[];
    renderLootItems();
});

// ===== Render Recorded Loot Entries =====
const lootQuery = query(lootCollection, orderBy('date','desc'));
onSnapshot(lootQuery, snapshot=>{
    lootListEl.innerHTML='';
    snapshot.forEach(docSnap=>{
        const entry = docSnap.data();
        const entryId = docSnap.id;

        const entryDiv = document.createElement('div');
        entryDiv.className='p-3 border rounded-md bg-gray-50 mb-3';

        const headerDiv = document.createElement('div');
        headerDiv.className='flex justify-between items-center cursor-pointer';
        headerDiv.innerHTML = `<div><strong>Boss:</strong> ${entry.boss} | <strong>Date:</strong> ${entry.date}</div>
                               <div><strong>Status:</strong> ${entry.settled?'Settled':'Active'}</div>`;
        entryDiv.appendChild(headerDiv);

        const expandedDiv = document.createElement('div');
        expandedDiv.style.display='none';
        expandedDiv.className='mt-2 pl-2 space-y-2';

        // Members
        const membersDiv = document.createElement('div');
        membersDiv.innerHTML='<strong>Participants:</strong>';
        const ulMembers = document.createElement('ul');
        ulMembers.className='ml-4 list-disc';
        entry.members.forEach(m=>{
            const li = document.createElement('li'); li.textContent=m; ulMembers.appendChild(li);
        });
        membersDiv.appendChild(ulMembers);
        expandedDiv.appendChild(membersDiv);

        // Loot items
        const lootDiv = document.createElement('div');
        lootDiv.innerHTML='<strong>Loot:</strong>';
        const ulLoot = document.createElement('ul');
        ulLoot.className='ml-4 space-y-1';
        entry.loot.forEach((item,index)=>{
            const li = document.createElement('li');
            li.className='flex justify-between items-center';

            const nameSpan = document.createElement('span');
            nameSpan.textContent=item.name;
            li.appendChild(nameSpan);

            const priceBtn = document.createElement('button');
            priceBtn.textContent=item.price;
            priceBtn.className='bg-indigo-200 px-2 py-1 rounded';
            priceBtn.onclick=()=>{
                lootToEdit={entryId, lootIndex:index, lootItem:item};
                editLootNameSpan.textContent=item.name;
                editLootPriceInput.value=item.price;
                editLootModal.classList.remove('hidden');
            };
            li.appendChild(priceBtn);

            ulLoot.appendChild(li);
        });
        lootDiv.appendChild(ulLoot);
        expandedDiv.appendChild(lootDiv);

        // Total price
        const totalPrice = entry.loot.reduce((sum,i)=>sum+i.price,0);
        const totalDiv = document.createElement('div');
        totalDiv.className='font-semibold';
        totalDiv.textContent=`Total Price: ${totalPrice}`;
        expandedDiv.appendChild(totalDiv);

        // Per-loot share
        const perLootDiv = document.createElement('div');
        perLootDiv.innerHTML='<strong>Per Loot Share:</strong>';
        const ulShare=document.createElement('ul');
        ulShare.className='ml-4 list-disc';
        entry.loot.forEach(l=>{
            const share = entry.members.length>0 ? (l.price/entry.members.length).toFixed(2):0;
            const li=document.createElement('li');
            li.textContent=`${l.name}: ${share} per member`;
            ulShare.appendChild(li);
        });
        perLootDiv.appendChild(ulShare);
        expandedDiv.appendChild(perLootDiv);

        // Remove button
        const removeBtn=document.createElement('button');
        removeBtn.textContent='Remove Entry';
        removeBtn.className='bg-red-500 text-white px-3 py-1 rounded mt-2 hover:bg-red-600';
        removeBtn.onclick=async ()=>{
            if(confirm('Remove this loot entry?')){
                await deleteDoc(doc(firebaseDB,'lootEntries',entryId));
            }
        };
        expandedDiv.appendChild(removeBtn);

        entryDiv.appendChild(expandedDiv);
        headerDiv.addEventListener('click', ()=>{expandedDiv.style.display = expandedDiv.style.display==='none'?'block':'none';});

        lootListEl.appendChild(entryDiv);
    });
});

// ===== Edit Loot Price Modal =====
saveLootPriceBtn.addEventListener('click', async ()=>{
    if(!lootToEdit) return;
    const newPrice=parseFloat(editLootPriceInput.value)||0;
    const entryRef=doc(firebaseDB,'lootEntries',lootToEdit.entryId);
    const entrySnap = await getDocs(query(lootCollection));
    const entryDoc=lootToEdit.entryId; // Already have entryId
    const updatedLoot = lootToEdit.lootItem;
    updatedLoot.price=newPrice;
    const currentDoc = await entryRef.get();
    const currentLoot = (currentDoc.data() && currentDoc.data().loot) || [];
    const finalLoot = currentLoot.map((l,i)=>i===lootToEdit.lootIndex?{...l, price:newPrice}:l);
    await updateDoc(entryRef,{loot:finalLoot});
    editLootModal.classList.add('hidden');
    lootToEdit=null;
});

closeLootPriceBtn.addEventListener('click', ()=>{
    editLootModal.classList.add('hidden');
    lootToEdit=null;
});