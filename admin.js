// admin.js
import { firebaseDB } from './firebase-init.js';
import { collection, doc, setDoc, getDoc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// ===== References =====
const bossInput = document.getElementById('boss-input');
const memberInput = document.getElementById('member-input');
const addBossBtn = document.getElementById('add-boss-btn');
const addMemberBtn = document.getElementById('add-member-btn');
const selectedBossEl = document.getElementById('selected-boss');
const participantsListEl = document.getElementById('participants-list');
const addLootBtn = document.getElementById('add-loot-btn');
const lootItemInput = document.getElementById('loot-item-input');
const lootPriceInput = document.getElementById('loot-price-input');
const addLootEntryBtn = document.getElementById('add-loot-entry-btn');
const lootListEl = document.getElementById('loot-list');

let selectedBoss = '';
let participants = [];
let lootItems = [];

// ===== Add Boss =====
addBossBtn.addEventListener('click', ()=>{
    const boss = bossInput.value.trim();
    if(!boss) return alert("Enter boss name");
    selectedBoss = boss;
    selectedBossEl.textContent = boss;
    bossInput.value='';
});

// ===== Add Member =====
addMemberBtn.addEventListener('click', ()=>{
    const member = memberInput.value.trim();
    if(!member) return;
    if(participants.includes(member)) return alert("Member already added");
    participants.push(member);
    participantsListEl.textContent = participants.join(', ');
    memberInput.value='';
});

// ===== Add Loot Item =====
addLootBtn.addEventListener('click', ()=>{
    const item = lootItemInput.value.trim();
    const price = parseFloat(lootPriceInput.value);
    if(!item || isNaN(price)) return alert("Enter loot name and price");
    lootItems.push({name:item, price});
    lootItemInput.value=''; lootPriceInput.value='';
    renderLootItems();
});

function renderLootItems(){
    const lootContainer = document.getElementById('loot-items-list');
    lootContainer.innerHTML='';
    lootItems.forEach((l,i)=>{
        const div = document.createElement('div');
        div.className='flex justify-between';
        div.innerHTML=`<span>${l.name}</span><span>${l.price}</span> <button data-index="${i}" class="remove-loot-btn text-red-500">Remove</button>`;
        lootContainer.appendChild(div);
    });

    document.querySelectorAll('.remove-loot-btn').forEach(btn=>{
        btn.addEventListener('click', e=>{
            const index = parseInt(btn.dataset.index);
            lootItems.splice(index,1);
            renderLootItems();
        });
    });
}

// ===== Add Loot Entry =====
addLootEntryBtn.addEventListener('click', async ()=>{
    if(!selectedBoss) return alert("Select a boss");
    if(participants.length===0) return alert("Add participants");
    if(lootItems.length===0) return alert("Add loot items");

    const date = new Date().toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit', hour12:true});
    const newEntry = {
        boss: selectedBoss,
        date,
        members: participants,
        loot: lootItems,
        settled:false
    };

    try{
        const docRef = doc(collection(firebaseDB,'lootEntries'));
        await setDoc(docRef,newEntry);
        // Reset
        selectedBoss=''; participants=[]; lootItems=[];
        selectedBossEl.textContent='';
        participantsListEl.textContent='';
        document.getElementById('loot-items-list').innerHTML='';
    }catch(e){console.error(e); alert("Error adding loot entry");}
});

// ===== Display Recorded Loot Entries =====
const lootCollection = collection(firebaseDB,'lootEntries');
onSnapshot(lootCollection, snapshot=>{
    lootListEl.innerHTML='';
    snapshot.forEach(docSnap=>{
        const entry = docSnap.data();
        const div = document.createElement('div');
        div.className='p-2 border rounded mb-2';
        div.innerHTML=`<strong>${entry.boss}</strong> (${entry.date})<br>
                       Members: ${entry.members.join(', ')}<br>
                       Loot: ${entry.loot.map(l=>`${l.name}: ${l.price}`).join(', ')}<br>
                       <button data-id="${docSnap.id}" class="settle-btn bg-green-500 text-white px-2 py-1 rounded mt-1">Settle</button>`;
        lootListEl.appendChild(div);

        div.querySelector('.settle-btn').addEventListener('click', async ()=>{
            try{
                await updateDoc(doc(firebaseDB,'lootEntries',docSnap.id),{settled:true});
            }catch(e){console.error(e);}
        });
    });
});