// view.js
import {
    getFirestore, collection, query, orderBy, onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const db = getFirestore();

const lootListEl = document.getElementById('loot-list');
const totalActiveLootEl = document.getElementById('total-active-loot');
const activeShareEl = document.getElementById('active-share-per-member');

// Render entries
function renderEntries(entries) {
    lootListEl.innerHTML = '';
    let totalActive = 0;
    const membersSet = new Set();

    entries.forEach(entry => {
        const entryDiv = document.createElement('div');
        entryDiv.className = `loot-item ${entry.settled ? 'settled' : 'active'}`;
        entryDiv.style.margin = '5px 0';
        entryDiv.style.padding = '5px';

        // Collapsed header
        const collapsedDiv = document.createElement('div');
        collapsedDiv.className = 'collapsed-header';
        const totalPrice = entry.loot.reduce((a,b)=>a+b.price,0);
        const share = entry.members.length ? (totalPrice / entry.members.length).toFixed(2) : '0';
        collapsedDiv.innerHTML = `
            <div><strong>Boss:</strong> ${entry.boss} | <strong>Date:</strong> ${entry.date}</div>
            <div><strong>Status:</strong> ${entry.settled ? 'Settled' : 'Active'}</div>
        `;

        // Expanded content
        const expandedDiv = document.createElement('div');
        expandedDiv.style.display = 'none';
        expandedDiv.style.marginTop = '5px';

        // Members
        const membersDiv = document.createElement('div');
        membersDiv.innerHTML = `<strong>Members:</strong> ${entry.members.join(', ')}`;
        expandedDiv.appendChild(membersDiv);

        // Loot items
        const lootContainer = document.createElement('div');
        lootContainer.className = 'loot-list-container';
        entry.loot.forEach(item => {
            const lootRow = document.createElement('div');
            lootRow.className = 'loot-row';
            lootRow.style.display = 'flex';
            lootRow.style.justifyContent = 'space-between';
            lootRow.style.padding = '2px 0';
            lootRow.innerHTML = `<span>${item.name}</span><span>${item.price}</span>`;
            if (entry.settled) {
                lootRow.style.color = '#6b7280';
                lootRow.style.textDecoration = 'line-through';
            }
            lootContainer.appendChild(lootRow);
        });
        expandedDiv.appendChild(lootContainer);

        // Toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = 'Show Details';
        toggleBtn.style.marginTop = '5px';
        toggleBtn.onclick = () => {
            if (expandedDiv.style.display === 'none') {
                expandedDiv.style.display = 'block';
                toggleBtn.textContent = 'Hide Details';
            } else {
                expandedDiv.style.display = 'none';
                toggleBtn.textContent = 'Show Details';
            }
        };

        entryDiv.appendChild(collapsedDiv);
        entryDiv.appendChild(toggleBtn);
        entryDiv.appendChild(expandedDiv);
        lootListEl.appendChild(entryDiv);

        // Add active loot to totals
        if (!entry.settled) {
            totalActive += totalPrice;
            entry.members.forEach(m => membersSet.add(m));
        }
    });

    totalActiveLootEl.textContent = totalActive;
    activeShareEl.textContent = membersSet.size ? (totalActive / membersSet.size).toFixed(2) : '0';
}

// Firestore query: lootEntries collection, ordered by createdAt descending
const lootQuery = query(collection(db, 'lootEntries'), orderBy('createdAt', 'desc'));

// Listen for real-time updates
onSnapshot(lootQuery, snapshot => {
    const entries = [];
    snapshot.forEach(docSnap => entries.push({ id: docSnap.id, ...docSnap.data() }));
    renderEntries(entries);
});