// admin.js
import { firebaseDB } from './firebase-init.js';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// ===== DOM Elements =====
const backBtn = document.getElementById('back-btn');
const changePhraseBtn = document.getElementById('change-password-btn');

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

let lootToEdit = null;
let bosses = [];
let members = [];
let selectedBoss = null;
let selectedParticipants = [];
let lootItems = [];

// ===== Firestore Collections =====
const bossesCol = collection(firebaseDB, 'bosses');
const membersCol = collection(firebaseDB, 'members');
const lootCollection = collection(firebaseDB, 'lootEntries');

// ===== Load Bosses & Members =====
async function loadBossesAndMembers() {
    try {
        const bossDocs = await getDocs(bossesCol);
        bosses = bossDocs.docs.map(d=>d.data().name);
        const memberDocs = await getDocs(membersCol);
        members = memberDocs.docs.map(d=>d.data().name);
    } catch(e) {
        console.error('Error loading bosses/members:', e);
    }
}
window.addEventListener('DOMContentLoaded', loadBossesAndMembers);

// ===== Back & Change Phrase =====
backBtn.addEventListener('click', ()=>{ window.location.href='index.html'; });
changePhraseBtn.addEventListener('click', ()=>{
    const current = localStorage.getItem('adminPhrase')||'';
    const newPhrase = prompt('Enter new Admin Phrase:', current);
    if(newPhrase && newPhrase.trim()!==''){
        localStorage.setItem('adminPhrase', newPhrase.trim());
        alert('Admin phrase updated successfully.');
    } else { alert('Phrase not changed.'); }
});

// ===== Add Boss =====
addBossBtn.addEventListener('click', async ()=>{
    const name = newBossInput.value.trim();
    if(!name) return alert('Enter boss name');
    try {
        await addDoc(bossesCol,{name});
        bosses.push(name);
        newBossInput.value='';
        alert(`Boss "${name}" added`);
    } catch(e){
        console.error('Error adding boss:', e);
        alert('Error adding boss.');
    }
});

// ===== Add Member =====
addMemberBtn.addEventListener('click', async ()=>{
    const name = newMemberInput.value.trim();
    if(!name) return alert('Enter member name');
    try {
        await addDoc(membersCol,{name});
        members.push(name);
        newMemberInput.value='';
        alert(`Member "${name}" added`);
    } catch(e){
        console.error('Error adding member:', e);
        alert('Error adding member.');
    }
});

// ===== Add Loot Item =====
addLootBtn.addEventListener('click', ()=>{
    const name = lootNameInput.value.trim();
    const price = parseFloat(lootPriceInput.value)||0;
    if(!name) return alert('Enter loot name');
    lootItems.push({name, price});
    lootNameInput.value=''; lootPriceInput.value='';
    renderLootItems();
});

function renderLootItems(){
    lootItemsContainer.innerHTML='';
    if(lootItems.length===0) return;
    const ul = document.createElement('ul');
    ul.style.listStyle='none'; ul.style.padding='0';
    lootItems.forEach((item,idx)=>{
        const li = document.createElement('li');
        li.className='flex justify-between items-center p-1';
        const span = document.createElement('span');
        span.textContent=`${item.name} - ${item.price}`;
        const removeBtn = document.createElement('button');
        removeBtn.textContent='Remove';
        removeBtn.className='bg-red-500 text-white px-2 py-1 rounded';
        removeBtn.onclick=()=>{lootItems.splice(idx,1); renderLootItems();};
        li.appendChild(span); li.appendChild(removeBtn); ul.appendChild(li);
    });
    lootItemsContainer.appendChild(ul);
}

// ===== Select Boss Modal =====
selectBossBtn.addEventListener('click', ()=>{
    modalBossList.innerHTML='';
    if(bosses.length===0) alert('No bosses available. Add first.');
    bosses.forEach(boss=>{
        const div = document.createElement('div');
        const radio = document.createElement('input');
        radio.type='radio'; radio.name='boss'; radio.value=boss;
        if(selectedBoss===boss) radio.checked=true;
        div.appendChild(radio);
        div.appendChild(document.createTextNode(' '+boss));
        modalBossList.appendChild(div);
    });
    document.getElementById('boss-modal').style.display='flex';
});

// ===== Save / Close Boss Modal =====
saveBossBtn.addEventListener('click', ()=>{
    const selected = modalBossList.querySelector('input[name="boss"]:checked');
    if(selected){
        selectedBoss = selected.value;
        selectedBossSpan.textContent = selectedBoss;
    }
    document.getElementById('boss-modal').style.display='none';
});
closeBossBtn.addEventListener('click', ()=>{ document.getElementById('boss-modal').style.display='none'; });

// ===== Participants Modal =====
editParticipantsBtn.addEventListener('click', ()=>{
    modalMemberList.innerHTML='';
    if(members.length===0) alert('No members available. Add first.');
    members.forEach(member=>{
        const div = document.createElement('div');
        const checkbox = document.createElement('input');
        checkbox.type='checkbox'; checkbox.value=member;
        if(selectedParticipants.includes(member)) checkbox.checked=true;
        div.appendChild(checkbox);
        div.appendChild(document.createTextNode(' '+member));
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
        const li = document.createElement('li'); li.textContent=p;
        selectedParticipantsEl.appendChild(li);
    });
    document.getElementById('participant-modal').style.display='none';
});
closeParticipantsBtn.addEventListener('click', ()=>{ document.getElementById('participant-modal').style.display='none'; });

// ===== Add New Loot Entry =====
addNewLootEntryBtn.addEventListener('click', async ()=>{
    if(!selectedBoss) return alert('Select a boss');
    if(selectedParticipants.length===0) return alert('Select participants');
    if(lootItems.length===0) return alert('Add at least one loot item');

    const now = new Date();
    const dateStr = now.toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true });

    try {
        await addDoc(lootCollection,{
            boss: selectedBoss,
            members: selectedParticipants,
            loot: lootItems,
            date: dateStr,
            settled: false
        });

        // Reset form
        selectedBoss=null; selectedBossSpan.textContent='None';
        selectedParticipants=[]; selectedParticipantsEl.innerHTML='';
        lootItems=[]; renderLootItems();
        alert('Loot entry added successfully.');
    } catch(e){
        console.error('Error adding loot entry:', e);
        alert('Error saving loot entry.');
    }
});

// ===== Render Recorded Loot Entries =====
const lootQuery = query(lootCollection, orderBy('date','desc'));
onSnapshot(lootQuery, snapshot=>{
    lootListEl.innerHTML='';
    snapshot.forEach(docSnap=>{
        const entry = docSnap.data();
        const entryId = docSnap.id;

        const entryDiv = document.createElement('div');
        entryDiv.className='p-3 border rounded-md bg-gray-50';
        entryDiv.style.borderColor='#4f46e5';

        // Collapsible header
        const headerDiv = document.createElement('div');
        headerDiv.className='flex justify-between items-center cursor-pointer';
        headerDiv.innerHTML = `<div><strong>Boss:</strong> ${entry.boss} | <strong>Date:</strong> ${entry.date}</div>
                               <div><strong>Status:</strong> ${entry.settled?'Settled':'Active'}</div>`;
        entryDiv.appendChild(headerDiv);

        const expandedDiv = document.createElement('div');
        expandedDiv.style.display='none'; expandedDiv.className='mt-2 pl-2';

        // Participants
        const membersDiv = document.createElement('div');
        membersDiv.innerHTML=`<strong>Participants:</strong>`;
        const ulMembers = document.createElement('ul');
        entry.members.forEach(m=>{
            const li = document.createElement('li'); li.textContent=m;
            ulMembers.appendChild(li);
        });
        membersDiv.appendChild(ulMembers); membersDiv.className='mb-2';
        expandedDiv.appendChild(membersDiv);

        // Loot items
        const lootContainer = document.createElement('div'); lootContainer.className='space-y-1';
        entry.loot.forEach((item,index)=>{
            const lootRow = document.createElement('div'); lootRow.className='flex justify-between items-center';
            const nameSpan = document.createElement('span'); nameSpan.textContent=item.name;

            if(entry.settled){
                const priceSpan = document.createElement('span'); priceSpan.textContent=item.price;
                priceSpan.style.textDecoration='line-through'; priceSpan.style.color='#6b7280';
                lootRow.appendChild(nameSpan); lootRow.appendChild(priceSpan);
            } else {
                const priceBtn = document.createElement('button');
                priceBtn.textContent=item.price;
                priceBtn.className='bg-indigo-200 px-2 py-1 rounded';
                priceBtn.onclick=()=>{
                    lootToEdit={entryId, lootIndex:index, lootItem:item};
                    editLootNameSpan.textContent=item.name;
                    editLootPriceInput.value=item.price;
                    editLootModal.style.display='flex';
                };
                lootRow.appendChild(nameSpan); lootRow.appendChild(priceBtn);
            }
            lootContainer.appendChild(lootRow);
        });
        expandedDiv.appendChild(lootContainer);

        // Total price
        const totalPrice = entry.loot.reduce((sum,i)=>sum+i.price,0);
        const summaryDiv = document.createElement('div');
        summaryDiv.className='mt-2 font-semibold';
        summaryDiv.innerHTML=`<strong>Total Price:</strong> ${totalPrice}`;
        expandedDiv.appendChild(summaryDiv);

        // Per loot member share
        const perLootDiv = document.createElement('div'); perLootDiv.className='mt-2';
        perLootDiv.innerHTML='<strong>Per Loot Share:</strong>';
        const ulShares = document.createElement('ul');
        entry.loot.forEach(l=>{
            const share = entry.members.length>0?(l.price/entry.members.length).toFixed(2):0;
            const li = document.createElement('li');
            li.textContent=`${l.name}: ${share} per member`;
            ulShares.appendChild(li);
        });
        perLootDiv.appendChild(ulShares); expandedDiv.appendChild(perLootDiv);

        entryDiv.appendChild(expandedDiv);

        // Toggle
        headerDiv.addEventListener('click', ()=>{expandedDiv.style.display = expandedDiv.style.display==='none'?'block':'none';});

        // Action buttons
        const actionDiv = document.createElement('div'); actionDiv.style.marginTop='5px';
        if(!entry.settled){
            const settleBtn = document.createElement('button'); settleBtn.textContent='Settle';
            settleBtn.style.backgroundColor='#10b981'; settleBtn.style.color='#fff'; settleBtn.style.marginRight='5px';
            settleBtn.onclick=async ()=>{ await updateDoc(doc(firebaseDB,'lootEntries',entryId),{settled:true}); };
            actionDiv.appendChild(settleBtn);
        }
        const removeBtn = document.createElement('button'); removeBtn.textContent='Remove';
        removeBtn.style.backgroundColor='#ef4444'; removeBtn.style.color='#fff';
        removeBtn.onclick=async ()=>{ if(confirm('Remove this loot entry?')) await deleteDoc(doc(firebaseDB,'lootEntries',entryId)); };
        actionDiv.appendChild(removeBtn);
        entryDiv.appendChild(actionDiv);

        lootListEl.appendChild(entryDiv);
    });
});

// ===== Edit Loot Price Modal =====
saveLootPriceBtn.addEventListener('click', async ()=>{
    if(!lootToEdit) return;
    const newPrice = parseFloat(editLootPriceInput.value)||0;
    const entryRef = doc(firebaseDB,'lootEntries',lootToEdit.entryId);
    const currentDoc = await entryRef.get();
    const currentLoot = (currentDoc.data() && currentDoc.data().loot) || [];
    const updatedLoot = currentLoot.map((l,i)=> i===lootToEdit.lootIndex? {...l,price:newPrice}:l);
    await updateDoc(entryRef,{loot:updatedLoot});
    editLootModal.style.display='none'; lootToEdit=null;
});
closeLootPriceBtn.addEventListener('click', ()=>{ editLootModal.style.display='none'; lootToEdit=null; });