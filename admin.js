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

// ===== Render Recorded Loot Entries =====
const lootQuery = query(lootCollection, orderBy('date','desc'));
let lootEntries = [];

onSnapshot(lootQuery, snapshot=>{
    lootEntries = [];
    snapshot.forEach(docSnap=>{
        const data = docSnap.data();
        data.id = docSnap.id;
        // Check if all loot items are settled
        data.settled = data.loot.every(l=>l.settled);
        lootEntries.push(data);
    });
    renderLootEntries();
});

function renderLootEntries(filter=''){
    lootListEl.innerHTML='';

    lootEntries.forEach(entry=>{
        const bossMatch = entry.boss.toLowerCase().includes(filter.toLowerCase());
        const memberMatch = entry.members.some(m=>m.toLowerCase().includes(filter.toLowerCase()));
        if(!bossMatch && !memberMatch) return;

        const entryDiv = document.createElement('div');
        entryDiv.className='p-3 border rounded-lg bg-white shadow mb-3';

        // Header
        const headerDiv = document.createElement('div');
        headerDiv.className='flex justify-between items-center cursor-pointer';
        headerDiv.innerHTML = `<div><strong>Boss:</strong> ${entry.boss} | <strong>Date:</strong> ${entry.date}</div>
                               <div><strong>Status:</strong> ${entry.settled?'Settled':'Active'}</div>`;
        entryDiv.appendChild(headerDiv);

        // Expandable Details
        const expandedDiv = document.createElement('div');
        expandedDiv.style.display='none';
        expandedDiv.className='mt-2 pl-2 space-y-2';

        // Participants
        const membersDiv = document.createElement('div');
        membersDiv.innerHTML='<strong>Participants:</strong>';
        const ulMembers = document.createElement('ul');
        ulMembers.className='ml-4 list-disc';
        entry.members.forEach(m=>{
            const li = document.createElement('li'); li.textContent=m; ulMembers.appendChild(li);
        });
        membersDiv.appendChild(ulMembers);
        expandedDiv.appendChild(membersDiv);

        // Loot Items with settle button
        const lootDiv = document.createElement('div');
        lootDiv.innerHTML='<strong>Loot:</strong>';
        const ulLoot = document.createElement('ul');
        ulLoot.className='ml-4 list-disc space-y-1';

        entry.loot.forEach((item, idx)=>{
            const li = document.createElement('li');
            li.className='flex justify-between items-center';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = item.name;

            const rightDiv = document.createElement('div');
            rightDiv.className='flex gap-2';

            const priceBtn = document.createElement('button');
            priceBtn.textContent=item.price;
            priceBtn.className='bg-indigo-200 px-2 py-1 rounded';
            priceBtn.onclick = ()=>{
                lootToEdit={entryId:entry.id, lootIndex:idx, lootItem:item};
                editLootNameSpan.textContent=item.name;
                editLootPriceInput.value=item.price;
                editLootModal.style.display='flex';
            };

            const settleBtn = document.createElement('button');
            settleBtn.textContent='Settle';
            settleBtn.className='bg-green-500 text-white px-2 py-1 rounded';
            settleBtn.onclick = async ()=>{
                const entryRef = doc(firebaseDB,'lootEntries',entry.id);
                item.settled=true;
                await updateDoc(entryRef,{loot:entry.loot});
            };

            rightDiv.appendChild(priceBtn);
            if(!item.settled) rightDiv.appendChild(settleBtn);

            li.appendChild(nameSpan);
            li.appendChild(rightDiv);
            ulLoot.appendChild(li);
        });

        lootDiv.appendChild(ulLoot);
        expandedDiv.appendChild(lootDiv);

        // Total Price
        const total = entry.loot.reduce((sum,i)=>sum+i.price,0);
        const totalDiv = document.createElement('div');
        totalDiv.className='font-semibold';
        totalDiv.textContent = `Total Price: ${total}`;
        expandedDiv.appendChild(totalDiv);

        // Per-loot share
        const shareDiv = document.createElement('div');
        shareDiv.innerHTML='<strong>Per Loot Share:</strong>';
        const ulShare = document.createElement('ul');
        ulShare.className='ml-4 list-disc';
        entry.loot.forEach(l=>{
            const share = entry.members.length>0 ? (l.price/entry.members.length).toFixed(2) : 0;
            const li = document.createElement('li');
            li.textContent = `${l.name}: ${share} per member`;
            ulShare.appendChild(li);
        });
        shareDiv.appendChild(ulShare);
        expandedDiv.appendChild(shareDiv);

        // Toggle expanded
        headerDiv.addEventListener('click', ()=>{expandedDiv.style.display = expandedDiv.style.display==='none'?'block':'none';});

        // Remove Entry
        const removeBtn = document.createElement('button');
        removeBtn.textContent='Remove Entry';
        removeBtn.className='bg-red-500 text-white px-3 py-1 rounded mt-2';
        removeBtn.onclick = async ()=>{
            if(confirm('Remove this loot entry?')) await deleteDoc(doc(firebaseDB,'lootEntries',entry.id));
        };
        expandedDiv.appendChild(removeBtn);

        entryDiv.appendChild(expandedDiv);
        lootListEl.appendChild(entryDiv);
    });
}

// ===== Edit Loot Modal =====
saveLootPriceBtn.addEventListener('click', async ()=>{
    if(!lootToEdit) return;
    const newPrice = parseFloat(editLootPriceInput.value) || 0;
    const entryRef = doc(firebaseDB,'lootEntries',lootToEdit.entryId);
    const updatedLoot = lootToEdit.lootItem;
    lootToEdit.lootItem.price=newPrice;

    const currentDoc = await entryRef.get();
    const currentLoot = currentDoc.data().loot || [];
    const updated = currentLoot.map((l,i)=> i===lootToEdit.lootIndex ? {...l, price:newPrice} : l);
    await updateDoc(entryRef,{loot:updated});

    editLootModal.style.display='none';
    lootToEdit=null;
});

closeLootPriceBtn.addEventListener('click', ()=>{
    editLootModal.style.display='none';
    lootToEdit=null;
});

// ===== Optional: Search Filter in Admin Page =====
const adminSearchInput = document.createElement('input');
adminSearchInput.placeholder='Search by boss/member';
adminSearchInput.className='w-full p-2 mb-2 border rounded shadow focus:outline-none focus:ring-2 focus:ring-indigo-400';
lootListEl.parentElement.prepend(adminSearchInput);
adminSearchInput.addEventListener('input', ()=>{
    renderLootEntries(adminSearchInput.value);
});