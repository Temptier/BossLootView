// view.js
import { firebaseDB } from './firebase-init.js';
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// DOM Elements
const lootListEl = document.getElementById('loot-list');

// Firestore Collection
const lootCollection = collection(firebaseDB,'lootEntries');

// ===== Load and Render Loot Entries =====
const lootQuery = query(lootCollection, orderBy('date','desc'));
let lootEntries = [];

onSnapshot(lootQuery, snapshot=>{
    lootEntries = [];
    snapshot.forEach(docSnap=>{
        const data = docSnap.data();
        data.id = docSnap.id;
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

        // Loot Items (read-only)
        const lootDiv = document.createElement('div');
        lootDiv.innerHTML='<strong>Loot:</strong>';
        const ulLoot = document.createElement('ul');
        ulLoot.className='ml-4 list-disc space-y-1';

        entry.loot.forEach(item=>{
            const li = document.createElement('li');
            li.className='flex justify-between items-center';
            const nameSpan = document.createElement('span');
            nameSpan.textContent = item.name;

            const priceSpan = document.createElement('span');
            priceSpan.textContent = item.price;
            if(item.settled){
                priceSpan.style.textDecoration='line-through';
                priceSpan.style.color='#6b7280';
            }

            li.appendChild(nameSpan);
            li.appendChild(priceSpan);
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

        // Per-loot share per member
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

        // Toggle expand
        headerDiv.addEventListener('click', ()=>{expandedDiv.style.display = expandedDiv.style.display==='none'?'block':'none';});

        entryDiv.appendChild(expandedDiv);
        lootListEl.appendChild(entryDiv);
    });
}

// ===== Optional: Search Filter on View Page =====
const viewSearchInput = document.createElement('input');
viewSearchInput.placeholder='Search by boss/member';
viewSearchInput.className='w-full p-2 mb-2 border rounded shadow focus:outline-none focus:ring-2 focus:ring-indigo-400';
lootListEl.parentElement.prepend(viewSearchInput);

viewSearchInput.addEventListener('input', ()=>{
    renderLootEntries(viewSearchInput.value);
});