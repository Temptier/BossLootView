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
        const div = document.createElement('div');
        div.className = 'loot-item';
        div.style.border = '1px solid #ccc';
        div.style.margin = '5px 0';
        div.style.padding = '5px';

        // Boss & Date
        div.innerHTML = `
            <div><strong>Boss:</strong> ${entry.boss}</div>
            <div><strong>Date:</strong> ${entry.date}</div>
            <div><strong>Members:</strong> ${entry.members.join(', ')}</div>
        `;

        // Loot items
        const lootContainer = document.createElement('div');
        lootContainer.style.margin = '5px 0';
        entry.loot.forEach(item => {
            const lootRow = document.createElement('div');
            lootRow.style.display = 'flex';
            lootRow.style.justifyContent = 'space-between';
            lootRow.innerHTML = `<span>${item.name}</span><span>${item.price}</span>`;
            lootContainer.appendChild(lootRow);

            if (!entry.settled) {
                totalActive += item.price;
                entry.members.forEach(m => membersSet.add(m));
            }
        });
        div.appendChild(lootContainer);

        // Total & Share
        const totalPrice = entry.loot.reduce((a,b)=>a+b.price,0);
        const share = entry.members.length ? (totalPrice / entry.members.length).toFixed(2) : '0';

        div.innerHTML += `
            <div><strong>Total Price:</strong> ${totalPrice}</div>
            <div><strong>Each Member Share:</strong> ${share}</div>
            <div><strong>Status:</strong> ${entry.settled ? 'Settled' : 'Active'}</div>
        `;

        lootListEl.appendChild(div);
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