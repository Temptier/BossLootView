// view.js

import { getFirestore, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Firestore database
const db = getFirestore();

// Elements
const lootList = document.getElementById('loot-list');
const totalActiveLootEl = document.getElementById('total-active-loot');
const activeShareEl = document.getElementById('active-share-per-member');

// Render function
function renderEntries(entries) {
    lootList.innerHTML = '';
    let totalActive = 0;
    const membersSet = new Set();

    entries.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'loot-item';

        const memberStr = entry.members.join(', ');

        div.innerHTML = `
            <div><span>Boss :</span> ${entry.boss}</div>
            <div><span>Date :</span> ${entry.date}</div>
            <div><span>Members :</span> ${memberStr}</div>
            <div class="loot-list-container"></div>
            <div><span>Total Price :</span> <span class="total-price">0</span></div>
            <div><span>Each Member Share :</span> <span class="share">0</span></div>
        `;

        const lootContainer = div.querySelector('.loot-list-container');

        if(entry.loot && Array.isArray(entry.loot)) {
            entry.loot.forEach(item => {
                const lootRow = document.createElement('div');
                lootRow.className = 'loot-row';
                lootRow.innerHTML = `
                    Loot: <span class="loot-name-input">${item.name}</span>
                    Price: <span class="loot-price-input">${item.price}</span>
                `;
                lootContainer.appendChild(lootRow);

                totalActive += item.price;
                entry.members.forEach(m => membersSet.add(m));
            });
        }

        // Update total and share
        const totalPrice = entry.loot ? entry.loot.reduce((a,b)=>a+b.price,0) : 0;
        div.querySelector('.total-price').textContent = totalPrice;
        const share = entry.members.length ? (totalPrice / entry.members.length).toFixed(2) : '0';
        div.querySelector('.share').textContent = share;

        lootList.appendChild(div);
    });

    totalActiveLootEl.textContent = totalActive;
    activeShareEl.textContent = membersSet.size ? (totalActive / membersSet.size).toFixed(2) : '0';
}

// Firestore query: lootEntries collection, ordered by createdAt descending
const q = query(collection(db, 'lootEntries'), orderBy('createdAt', 'desc'));

// Listen for real-time updates
onSnapshot(q, snapshot => {
    const entries = [];
    snapshot.forEach(doc => entries.push({ id: doc.id, ...doc.data() }));
    renderEntries(entries);
});