import { firebaseDB } from './firebase-init.js';
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const lootListEl = document.getElementById('loot-list');
const lootCollection = collection(firebaseDB, 'lootEntries');

const filterBossInput = document.getElementById('filter-boss');
const filterMemberInput = document.getElementById('filter-member');
const clearFiltersBtn = document.getElementById('clear-filters');

let allLootEntries = [];

// Render loot entries with filters and per-item settled calculation
function renderLootEntries() {
    const bossFilter = filterBossInput.value.toLowerCase();
    const memberFilter = filterMemberInput.value.toLowerCase();

    lootListEl.innerHTML = '';

    allLootEntries.forEach(entry => {
        // Apply filters
        if (bossFilter && !entry.boss.toLowerCase().includes(bossFilter)) return;
        if (memberFilter && !entry.members.some(m => m.toLowerCase().includes(memberFilter))) return;

        const entryDiv = document.createElement('div');
        entryDiv.className = 'p-3 border rounded-md bg-gray-50';
        entryDiv.style.borderColor = '#4f46e5';

        // Header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex justify-between items-center cursor-pointer';
        headerDiv.innerHTML = `<div><strong>Boss:</strong> ${entry.boss} | <strong>Date:</strong> ${entry.date}</div>`;
        entryDiv.appendChild(headerDiv);

        // Expanded content
        const expandedDiv = document.createElement('div');
        expandedDiv.style.display = 'none';
        expandedDiv.className = 'mt-2 pl-2';

        // Participants
        const membersDiv = document.createElement('div');
        membersDiv.innerHTML = `<strong>Participants:</strong> ${entry.members.join(', ')}`;
        membersDiv.className = 'mb-2';
        expandedDiv.appendChild(membersDiv);

        // Loot items
        const lootContainer = document.createElement('div');
        lootContainer.className = 'space-y-1';
        entry.loot.forEach(item => {
            const lootRow = document.createElement('div');
            lootRow.className = 'flex justify-between items-center';

            const lootNameSpan = document.createElement('span');
            lootNameSpan.textContent = item.name;
            if(item.settled){
                lootNameSpan.style.textDecoration='line-through';
                lootNameSpan.style.color='#6b7280';
            }
            lootRow.appendChild(lootNameSpan);

            const lootPriceSpan = document.createElement('span');
            lootPriceSpan.textContent = item.price;
            if(item.settled){
                lootPriceSpan.style.textDecoration='line-through';
                lootPriceSpan.style.color='#6b7280';
            }
            lootRow.appendChild(lootPriceSpan);

            lootContainer.appendChild(lootRow);
        });
        expandedDiv.appendChild(lootContainer);

        // Total price & per-member share only for unsettled items
        const activeLoot = entry.loot.filter(i=>!i.settled);
        const totalPrice = activeLoot.reduce((sum,i)=>sum+i.price,0);
        const perMember = entry.members.length>0 ? (totalPrice / entry.members.length).toFixed(2) : 0;

        const summaryDiv = document.createElement('div');
        summaryDiv.className='mt-2';
        summaryDiv.innerHTML = `<strong>Total Price (active):</strong> ${totalPrice} | <strong>Each Member Share:</strong> ${perMember}`;
        expandedDiv.appendChild(summaryDiv);

        entryDiv.appendChild(expandedDiv);

        // Toggle details
        headerDiv.addEventListener('click', () => {
            expandedDiv.style.display = expandedDiv.style.display === 'none' ? 'block' : 'none';
        });

        lootListEl.appendChild(entryDiv);
    });
}

// Listen to Firestore
const lootQuery = query(lootCollection, orderBy('date','desc'));
onSnapshot(lootQuery, snapshot => {
    allLootEntries = snapshot.docs.map(docSnap => docSnap.data());
    renderLootEntries();
});

// Filters
filterBossInput.addEventListener('input', renderLootEntries);
filterMemberInput.addEventListener('input', renderLootEntries);

// Clear filters
clearFiltersBtn.addEventListener('click', () => {
    filterBossInput.value='';
    filterMemberInput.value='';
    renderLootEntries();
});