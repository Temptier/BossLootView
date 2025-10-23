// Elements
const selectedBossList = document.getElementById('selected-boss');
const participantList = document.getElementById('participant-list');
const lootList = document.getElementById('loot-list');
const tempLootItemsDiv = document.getElementById('temp-loot-items');
const totalActiveLootEl = document.getElementById('total-active-loot');
const activeShareEl = document.getElementById('active-share-per-member');

const modalBoss = document.getElementById('modal-boss');
const modalMember = document.getElementById('modal-member');

const allMembers = ['Member A','Member B','Member C','Member D'];
let currentBoss = '';
let currentParticipants = [];
let tempLootItems = [];

// --- Populate boss/member dropdowns on page load ---
function populateDropdowns() {
    modalBoss.innerHTML = '';
    ['1st Boss','2nd Boss','3rd Boss','4th Boss'].forEach(b=>{
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b;
        modalBoss.appendChild(opt);
    });

    modalMember.innerHTML = '';
    allMembers.forEach(m=>{
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        modalMember.appendChild(opt);
    });
}
populateDropdowns();

// --- Confirm Selection (inline) ---
function confirmSelection() {
    const boss = modalBoss.value;
    const participants = Array.from(modalMember.selectedOptions).map(o=>o.value);
    if(!boss || participants.length===0) return alert("Select boss and participants.");

    currentBoss = boss;
    currentParticipants = participants;

    selectedBossList.innerHTML = '';
    selectedBossList.textContent = boss;

    participantList.innerHTML = '';
    participants.forEach(p=>{
        const li = document.createElement('li');
        li.textContent = p;
        participantList.appendChild(li);
    });
}

// --- Temporary Loot ---
function addLootItem() {
    const name = document.getElementById('loot-name').value.trim();
    const price = parseFloat(document.getElementById('loot-price').value);
    if(!name || isNaN(price)) return alert("Enter loot name and price.");

    tempLootItems.push({name, price});
    renderTempLoot();

    document.getElementById('loot-name').value = '';
    document.getElementById('loot-price').value = '';
}

function renderTempLoot() {
    tempLootItemsDiv.innerHTML = '';
    tempLootItems.forEach((item,i)=>{
        const div = document.createElement('div');
        div.textContent = `${item.name} : ${item.price}`;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = ()=>{ tempLootItems.splice(i,1); renderTempLoot(); }
        div.appendChild(removeBtn);
        tempLootItemsDiv.appendChild(div);
    });
}

// --- Add New Loot Entry ---
function addNewLootEntry() {
    if(!currentBoss) return alert("Select boss first.");
    if(tempLootItems.length === 0) return alert("Add at least one loot item.");

    const entryDiv = document.createElement('div');
    entryDiv.className = 'loot-item';
    const dateStr = new Date().toLocaleString('en-US',{month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:true});
    const memberInputStr = currentParticipants.join(', ');

    entryDiv.innerHTML = `
        <div><span>Boss :</span> ${currentBoss}</div>
        <div><span>Date :</span> ${dateStr}</div>
        <div><span>Members :</span> <input type="text" value="${memberInputStr}" class="member-input"></div>
        <div class="loot-list-container"></div>
        <div><span>Total Price :</span> <span class="total-price">0</span></div>
        <div><span>Each Member Share :</span> <span class="share">0</span></div>
        <div class="loot-buttons">
            <button onclick="removeEntry(this)">Remove Entry</button>
        </div>
    `;

    const lootContainer = entryDiv.querySelector('.loot-list-container');

    tempLootItems.forEach((item)=>{
        const div = document.createElement('div');
        div.className = 'loot-row';
        div.innerHTML = `
            Loot: <span class="loot-name-input">${item.name}</span>
            Price: <input type="number" value="${item.price}" class="loot-price-input">
            <button class="settle-loot-btn">Settle</button>
        `;
        lootContainer.appendChild(div);

        const priceInput = div.querySelector('.loot-price-input');
        const settleBtn = div.querySelector('.settle-loot-btn');

        function updateEntryTotal() {
            let prices = Array.from(entryDiv.querySelectorAll('.loot-price-input')).map(inp=>{
                const rowDiv = inp.closest('.loot-row');
                return rowDiv.classList.contains('settled') ? 0 : parseFloat(inp.value)||0;
            });
            const total = prices.reduce((a,b)=>a+b,0);
            entryDiv.querySelector('.total-price').textContent = total;

            let members = entryDiv.querySelector('.member-input').value.split(',').map(m=>m.trim()).filter(m=>m);
            let share = members.length ? (total/members.length).toFixed(2) : '0';
            entryDiv.querySelector('.share').textContent = share;

            updateSummary();
            saveEntries();
        }

        priceInput.addEventListener('input', updateEntryTotal);

        settleBtn.addEventListener('click', ()=>{
            div.classList.add('settled');
            div.querySelector('.loot-price-input').disabled = true;
            updateEntryTotal();
        });
    });

    const memberInput = entryDiv.querySelector('.member-input');
    memberInput.addEventListener('input', ()=>{
        let total = Array.from(entryDiv.querySelectorAll('.loot-price-input')).reduce((sum, inp)=>{
            const rowDiv = inp.closest('.loot-row');
            return rowDiv.classList.contains('settled') ? sum : sum + (parseFloat(inp.value)||0);
        }, 0);
        let members = memberInput.value.split(',').map(m=>m.trim()).filter(m=>m);
        entryDiv.querySelector('.total-price').textContent = total;
        entryDiv.querySelector('.share').textContent = members.length ? (total/members.length).toFixed(2) : '0';
        updateSummary();
        saveEntries();
    });

    lootList.appendChild(entryDiv);
    tempLootItems = [];
    renderTempLoot();
    saveEntries();
}

// --- Remove Entry ---
function removeEntry(btn) {
    const entry = btn.closest('.loot-item');
    entry.remove();
    updateSummary();
    saveEntries();
}

// --- Update Summary ---
function updateSummary() {
    const entries = document.querySelectorAll('.loot-item');
    let totalActive = 0;
    let membersSet = new Set();

    entries.forEach(entry=>{
        Array.from(entry.querySelectorAll('.loot-price-input')).forEach(inp=>{
            const rowDiv = inp.closest('.loot-row');
            if(!rowDiv.classList.contains('settled')){
                totalActive += parseFloat(inp.value)||0;
                entry.querySelector('.member-input').value.split(',').map(m=>m.trim()).filter(m=>m).forEach(m=>membersSet.add(m));
            }
        });
    });

    totalActiveLootEl.textContent = totalActive;
    activeShareEl.textContent = (totalActive / (membersSet.size||1)).toFixed(2);
}

// --- Save entries to localStorage ---
function saveEntries() {
    const entries = [];
    document.querySelectorAll('.loot-item').forEach(entryDiv => {
        const boss = entryDiv.querySelector('div:nth-child(1)').textContent.replace('Boss : ','');
        const date = entryDiv.querySelector('div:nth-child(2)').textContent.replace('Date : ','');
        const members = entryDiv.querySelector('.member-input').value.split(',').map(m=>m.trim()).filter(m=>m);
        const loot = Array.from(entryDiv.querySelectorAll('.loot-row')).map(l => ({
            name: l.querySelector('.loot-name-input').textContent,
            price: parseFloat(l.querySelector('.loot-price-input').value)||0
        }));
        entries.push({boss, date, members, loot});
    });
    localStorage.setItem('guildLootEntries', JSON.stringify(entries));
}

// --- Add New Boss dynamically ---
function addNewBoss() {
    const name = document.getElementById('new-boss-name').value.trim();
    if(!name) return alert("Enter boss name.");
    if(!Array.from(modalBoss.options).some(o => o.value === name)){
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        modalBoss.appendChild(opt);
        modalBoss.value = name; // select immediately
        alert(`Boss "${name}" added.`);
        document.getElementById('new-boss-name').value = '';
    } else alert("Boss already exists.");
}

// --- Add New Member dynamically ---
function addNewMember() {
    const name = document.getElementById('new-member-name').value.trim();
    if(!name) return alert("Enter member name.");
    if(!allMembers.includes(name)){
        allMembers.push(name);
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        modalMember.appendChild(opt);
        opt.selected = true; // select immediately
        alert(`Member "${name}" added.`);
        document.getElementById('new-member-name').value = '';
    } else alert("Member already exists.");
}