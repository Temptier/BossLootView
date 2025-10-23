const lootList = document.getElementById('loot-list');
const totalActiveLootEl = document.getElementById('total-active-loot');
const activeShareEl = document.getElementById('active-share-per-member');

// --- Load recorded entries from localStorage ---
function getRecordedEntries() {
    const data = localStorage.getItem('guildLootEntries');
    return data ? JSON.parse(data) : [];
}

// --- Render the entries ---
function renderEntries() {
    const recordedEntries = getRecordedEntries();
    lootList.innerHTML = '';

    let total = 0;
    let membersSet = new Set();

    recordedEntries.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'loot-item';

        const lootHTML = entry.loot.map(l => `<div>${l.name} : ${l.price}</div>`).join('');

        div.innerHTML = `
            <div>Boss : ${entry.boss}</div>
            <div>Date : ${entry.date}</div>
            <div>Members : ${entry.members.join(', ')}</div>
            <div class="loot-list-container">${lootHTML}</div>
            <div>Total Price : <span>${entry.loot.reduce((a,b)=>a+b.price,0)}</span></div>
            <div>Each Member Share : <span>${(entry.loot.reduce((a,b)=>a+b.price,0)/entry.members.length).toFixed(2)}</span></div>
        `;

        lootList.appendChild(div);

        total += entry.loot.reduce((a,b)=>a+b.price,0);
        entry.members.forEach(m => membersSet.add(m));
    });

    totalActiveLootEl.textContent = total;
    activeShareEl.textContent = (total / (membersSet.size || 1)).toFixed(2);
}

// --- Initialize ---
renderEntries();