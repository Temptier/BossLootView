// view.js
import { firebaseDB } from './firebase-init.js';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// ===== DOM Elements =====
const lootListEl = document.getElementById('loot-list');

// ===== Firestore Collections =====
const lootCollection = collection(firebaseDB, 'lootEntries');

// ===== Render Loot Entries =====
const lootQuery = query(lootCollection, orderBy('date', 'desc'));
onSnapshot(lootQuery, snapshot => {
    lootListEl.innerHTML = '';

    snapshot.forEach(docSnap => {
        const entry = docSnap.data();
        const entryId = docSnap.id;

        const entryDiv = document.createElement('div');
        entryDiv.className = 'p-3 border rounded-md bg-gray-50 mb-2';
        entryDiv.style.borderColor = '#4f46e5';

        // Header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex justify-between items-center cursor-pointer';
        headerDiv.innerHTML = `<div><strong>Boss:</strong> ${entry.boss} | <strong>Date:</strong> ${entry.date}</div>
                               <div><strong>Status:</strong> ${entry.settled?'Settled':'Active'}</div>`;
        entryDiv.appendChild(headerDiv);

        const expandedDiv = document.createElement('div');
        expandedDiv.style.display = 'none';
        expandedDiv.className = 'mt-2 pl-2';

        // Participants
        const membersDiv = document.createElement('div');
        membersDiv.innerHTML = `<strong>Participants:</strong>`;
        const ulMembers = document.createElement('ul');
        entry.members.forEach(m => {
            const li = document.createElement('li');
            li.textContent = m;
            ulMembers.appendChild(li);
        });
        membersDiv.appendChild(ulMembers);
        membersDiv.className = 'mb-2';
        expandedDiv.appendChild(membersDiv);

        // Loot items
        const lootContainer = document.createElement('div');
        lootContainer.className = 'space-y-1';
        entry.loot.forEach(item => {
            const lootRow = document.createElement('div');
            lootRow.className = 'flex justify-between items-center';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = item.name;

            const priceSpan = document.createElement('span');
            priceSpan.textContent = item.price;
            if(entry.settled){
                priceSpan.style.textDecoration = 'line-through';
                priceSpan.style.color = '#6b7280';
            }

            lootRow.appendChild(nameSpan);
            lootRow.appendChild(priceSpan);
            lootContainer.appendChild(lootRow);
        });
        expandedDiv.appendChild(lootContainer);

        // Total price
        const totalPrice = entry.loot.reduce((sum,i)=>sum+i.price,0);
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'mt-2 font-semibold';
        summaryDiv.innerHTML = `<strong>Total Price:</strong> ${totalPrice}`;
        expandedDiv.appendChild(summaryDiv);

        // Per loot share per member
        const perLootDiv = document.createElement('div');
        perLootDiv.className = 'mt-2';
        perLootDiv.innerHTML = '<strong>Per Loot Share:</strong>';
        const ulShares = document.createElement('ul');
        entry.loot.forEach(l => {
            const share = entry.members.length>0 ? (l.price/entry.members.length).toFixed(2) : 0;
            const li = document.createElement('li');
            li.textContent = `${l.name}: ${share} per member`;
            ulShares.appendChild(li);
        });
        perLootDiv.appendChild(ulShares);
        expandedDiv.appendChild(perLootDiv);

        entryDiv.appendChild(expandedDiv);

        // Toggle details
        headerDiv.addEventListener('click', ()=>{
            expandedDiv.style.display = expandedDiv.style.display==='none'?'block':'none';
        });

        // Action buttons (optional: remove or settle if allowed)
        const actionDiv = document.createElement('div');
        actionDiv.style.marginTop = '5px';

        if(!entry.settled){
            const settleBtn = document.createElement('button');
            settleBtn.textContent = 'Settle';
            settleBtn.style.backgroundColor = '#10b981';
            settleBtn.style.color = '#fff';
            settleBtn.style.marginRight = '5px';
            settleBtn.onclick = async ()=>{
                await updateDoc(doc(firebaseDB,'lootEntries',entryId), {settled:true});
            };
            actionDiv.appendChild(settleBtn);
        }

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.style.backgroundColor = '#ef4444';
        removeBtn.style.color = '#fff';
        removeBtn.onclick = async ()=>{
            if(confirm('Remove this loot entry?')){
                await deleteDoc(doc(firebaseDB,'lootEntries',entryId));
            }
        };
        actionDiv.appendChild(removeBtn);

        entryDiv.appendChild(actionDiv);
        lootListEl.appendChild(entryDiv);
    });
});