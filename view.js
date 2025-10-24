import { firebaseDB } from './firebase-init.js';
import { collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const lootListEl = document.getElementById('loot-list');
const lootCollection = collection(firebaseDB, 'lootEntries');

const filterBossInput = document.getElementById('filter-boss');
const filterMemberInput = document.getElementById('filter-member');
const clearFiltersBtn = document.getElementById('clear-filters');

let allLootEntries = [];

// Render loot entries with per-item member share
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

        // Collapsed Header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'flex justify-between items-center cursor-pointer';
        headerDiv.innerHTML = `<div><strong>Boss:</strong> ${entry.boss} | <strong>Date:</strong> ${entry.date}</div>
                               <div><strong>Status:</strong> ${entry.settled ? 'Settled' : 'Active'}</div>`;
        entryDiv.appendChild(headerDiv);

        // Expanded Content
        const expandedDiv = document.createElement('div');
        expandedDiv.style.display = 'none';
        expandedDiv.className = 'mt-2 pl-2';

        // Participants
        const membersDiv = document.createElement('div');
        membersDiv.innerHTML=`<strong>Participants:</strong> ${entry.members.join(', ')}`;
        membersDiv.className = 'mb-2';
        expandedDiv.appendChild(membersDiv);

        // Loot list with per-member share
        const lootContainer = document.createElement('div');
        lootContainer.className = 'space-y-1';

        entry.loot.forEach(item => {
            const lootRow = document.createElement('div');
            lootRow.className = 'flex flex-col md:flex-row justify-between items-start md:items-center gap-1';

            const namePriceDiv = document.createElement('div');
            namePriceDiv.className = 'flex justify-between w-full md:w-auto gap-4';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = item.name;

            const priceSpan = document.createElement('span');
            priceSpan.textContent = item.price;

            namePriceDiv.appendChild(nameSpan);
            namePriceDiv.appendChild(priceSpan);

            lootRow.appendChild(namePriceDiv);

            // Per-member share
            const perMemberDiv = document.createElement('div');
            const perMember = entry.members.length > 0 ? (item.price / entry.members.length).toFixed(2) : 0;
            perMemberDiv.innerHTML = `<small>Each Member Share: ${perMember}</small>`;
            perMemberDiv.className = 'text-gray-600 ml-1';
            lootRow.appendChild(perMemberDiv);

            // Gray out if settled
            if(entry.settled){
                lootRow.style.textDecoration='line-through';
                lootRow.style.color='#6b7280';
            }

            lootContainer.appendChild(lootRow);
        });

        expandedDiv.appendChild(lootContainer);

        // Total price & per-member summary
        const totalPrice = entry.loot.reduce((sum,i)=>sum+i.price,0);
        const perMemberOverall = entry.members.length>0 ? (totalPrice/entry.members.length).toFixed(2) : 0;

        const summaryDiv = document.createElement('div');
        summaryDiv.className='mt-2 font-semibold';
        summaryDiv.innerHTML = `<strong>Total Price:</strong> ${totalPrice} | <strong>Each Member Share Overall:</strong> ${perMemberOverall}`;
        expandedDiv.appendChild(summaryDiv);

        entryDiv.appendChild(expandedDiv);

        // Toggle details on click
        headerDiv.addEventListener('click', () => {
            expandedDiv.style.display = expandedDiv.style.display === 'none' ? 'block' : 'none';
        });

        lootListEl.appendChild(entryDiv);
    });
}

// Listen for loot entries from Firebase
const lootQuery = query(lootCollection, orderBy('date', 'desc'));
onSnapshot(lootQuery, snapshot => {
    allLootEntries = snapshot.docs.map(docSnap => docSnap.data());
    renderLootEntries();
});

// Filter inputs
filterBossInput.addEventListener('input', renderLootEntries);
filterMemberInput.addEventListener('input', renderLootEntries);

// Clear filters
clearFiltersBtn.addEventListener('click', () => {
    filterBossInput.value='';
    filterMemberInput.value='';
    renderLootEntries();
});