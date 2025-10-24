// view.js
import { firebaseDB } from './firebase-init.js';
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const lootListEl = document.getElementById('loot-list');

const lootCollection = collection(firebaseDB,'lootEntries');
const lootQuery = query(lootCollection, orderBy('date','desc'));

onSnapshot(lootQuery, snapshot=>{
    lootListEl.innerHTML='';
    snapshot.forEach(docSnap=>{
        const entry = docSnap.data();
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
            const li = document.createElement('li');
            li.textContent=m;
            ulMembers.appendChild(li);
        });
        membersDiv.appendChild(ulMembers);
        expandedDiv.appendChild(membersDiv);

        // Loot
        const lootDiv = document.createElement('div');
        lootDiv.innerHTML='<strong>Loot:</strong>';
        const ulLoot = document.createElement('ul');
        ulLoot.className='ml-4 space-y-1';
        entry.loot.forEach(l=>{
            const li = document.createElement('li');
            li.textContent=`${l.name}: ${l.price}`;
            ulLoot.appendChild(li);
        });
        lootDiv.appendChild(ulLoot);
        expandedDiv.appendChild(lootDiv);

        // Total & per-loot share
        const totalPrice = entry.loot.reduce((sum,i)=>sum+i.price,0);
        const totalDiv = document.createElement('div');
        totalDiv.className='font-semibold';
        totalDiv.textContent=`Total Price: ${totalPrice}`;
        expandedDiv.appendChild(totalDiv);

        const perLootDiv = document.createElement('div');
        perLootDiv.innerHTML='<strong>Per Loot Share:</strong>';
        const ulShare = document.createElement('ul');
        ulShare.className='ml-4 list-disc';
        entry.loot.forEach(l=>{
            const share = entry.members.length>0?(l.price/entry.members.length).toFixed(2):0;
            const li=document.createElement('li');
            li.textContent=`${l.name}: ${share} per member`;
            ulShare.appendChild(li);
        });
        perLootDiv.appendChild(ulShare);
        expandedDiv.appendChild(perLootDiv);

        entryDiv.appendChild(expandedDiv);
        headerDiv.addEventListener('click', ()=>{
            expandedDiv.style.display = expandedDiv.style.display==='none'?'block':'none';
        });

        lootListEl.appendChild(entryDiv);
    });
});