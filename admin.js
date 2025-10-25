// admin.js (PART 1 of 2)
import { firebaseDB } from './firebase-init.js';
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  query, orderBy, onSnapshot, getDocs, getDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

/* ========================
   DOM & Navigation
   ======================== */
const backBtn = document.getElementById('back-btn');
const changePasswordBtn = document.getElementById('change-password-btn');

backBtn?.addEventListener('click', () => { window.location.href = 'index.html'; });

changePasswordBtn?.addEventListener('click', () => {
  const current = localStorage.getItem('adminPassword') || '';
  const input = prompt("Enter current password/phrase:");
  if (current && input !== current) return alert("Incorrect current password!");
  const newPass = prompt("Enter new password/phrase:");
  if (!newPass) return alert("Password cannot be empty.");
  localStorage.setItem('adminPassword', newPass);
  alert("Password/phrase updated successfully!");
});

/* ========================
   DOM Elements
   ======================== */
const addBossBtn = document.getElementById('add-boss-btn');
const addMemberBtn = document.getElementById('add-member-btn');
const newBossInput = document.getElementById('new-boss-name');
const newMemberInput = document.getElementById('new-member-name');

const selectBossBtn = document.getElementById('select-boss-btn');
const editParticipantsBtn = document.getElementById('edit-participants-btn');
const modalBossList = document.getElementById('modal-boss-list');
const modalMemberList = document.getElementById('modal-member-list');
const saveBossBtn = document.getElementById('save-boss-btn');
const closeBossBtn = document.getElementById('close-boss-btn');
const saveParticipantsBtn = document.getElementById('save-participants-btn');
const closeParticipantsBtn = document.getElementById('close-participants-btn');

const selectedBossSpan = document.getElementById('selected-boss');
const selectedParticipantsEl = document.getElementById('selected-participants');

const lootNameInput = document.getElementById('loot-name-input');
const lootPriceInput = document.getElementById('loot-price-input');
const addLootBtn = document.getElementById('add-loot-btn');
const lootItemsContainer = document.getElementById('loot-items-container');
const addNewLootEntryBtn = document.getElementById('add-new-loot-entry-btn');

const lootListEl = document.getElementById('loot-list');
const searchInput = document.getElementById('search-input');

/* Edit Loot Price Modal */
const editLootModal = document.getElementById('edit-loot-modal');
const editLootNameSpan = document.getElementById('edit-loot-name');
const editLootPriceInput = document.getElementById('edit-loot-price-input');
const saveLootPriceBtn = document.getElementById('save-loot-price-btn');
const closeLootPriceBtn = document.getElementById('close-loot-price-btn');

/* Participant-Edit-for-entry: we'll reuse participant-modal for both creating entry and editing an existing entry */
let editingEntryIdForParticipants = null; // null => creating entry participants; otherwise set to entryId
/* loot being edited */
let lootToEdit = null;

/* ========================
   State & Collections
   ======================== */
let bosses = [];
let members = [];
let selectedBoss = null;
let selectedParticipants = [];
let lootItems = [];
let allLootEntries = []; // [{id, data}, ...]

const bossesCol = collection(firebaseDB, 'bosses');
const membersCol = collection(firebaseDB, 'members');
const lootCollection = collection(firebaseDB, 'lootEntries');

/* ========================
   Utilities
   ======================== */
function alphabetize(arr){ return [...arr].sort((a,b)=>a.localeCompare(b)); }

/* ========================
   Load bosses & members
   ======================== */
async function loadBossesAndMembers(){
  const b = await getDocs(bossesCol);
  bosses = b.docs.map(d=>d.data().name || '').filter(Boolean);
  const m = await getDocs(membersCol);
  members = m.docs.map(d=>d.data().name || '').filter(Boolean);
}
loadBossesAndMembers();

/* ========================
   Add Boss (prevent duplicates)
   ======================== */
addBossBtn?.addEventListener('click', async ()=>{
  const name = (newBossInput.value || '').trim();
  if (!name) return alert('Enter boss name');
  if (bosses.some(b => b.toLowerCase() === name.toLowerCase())) return alert('This boss already exists');
  await addDoc(bossesCol, { name });
  bosses.push(name);
  newBossInput.value='';
  // keep local list sorted for modal display
  bosses = alphabetize(bosses);
});

/* ========================
   Add Member (prevent duplicates)
   ======================== */
addMemberBtn?.addEventListener('click', async ()=>{
  const name = (newMemberInput.value || '').trim();
  if (!name) return alert('Enter member name');
  if (members.some(m => m.toLowerCase() === name.toLowerCase())) return alert('This member already exists');
  await addDoc(membersCol, { name });
  members.push(name);
  members = alphabetize(members);
  newMemberInput.value='';
});

/* ========================
   Add Loot Item to preview list (prevent duplicate loot name within the preview)
   ======================== */
addLootBtn?.addEventListener('click', ()=>{
  const name = (lootNameInput.value || '').trim();
  const price = parseFloat(lootPriceInput.value) || 0;
  if (!name) return alert('Enter loot name');
  if (lootItems.some(li => li.name.toLowerCase() === name.toLowerCase())) return alert('Duplicate loot name in this entry');
  lootItems.push({ name, price, settled:false });
  lootNameInput.value=''; lootPriceInput.value='';
  renderLootItems();
});

/* ========================
   Render Loot Items Preview (in Boss Loot Panel)
   ======================== */
function renderLootItems(){
  lootItemsContainer.innerHTML='';
  if (!lootItems.length) return;
  const ul = document.createElement('ul');
  ul.className='list-none p-0';
  lootItems.forEach((it, idx)=>{
    const li = document.createElement('li');
    li.className='flex justify-between items-center py-1';
    li.innerHTML = `<span>${it.name} - ${it.price}</span>`;
    const btn = document.createElement('button');
    btn.className='bg-red-500 text-white px-2 py-1 rounded';
    btn.textContent='Remove';
    btn.onclick = ()=>{ lootItems.splice(idx,1); renderLootItems(); };
    li.appendChild(btn);
    ul.appendChild(li);
  });
  lootItemsContainer.appendChild(ul);
}

/* ========================
   Select Boss Modal (sorted)
   ======================== */
selectBossBtn?.addEventListener('click', ()=>{
  modalBossList.innerHTML='';
  alphabetize(bosses).forEach(b=>{
    const div = document.createElement('div');
    div.className='py-1';
    const radio = document.createElement('input');
    radio.type='radio'; radio.name='boss'; radio.value=b;
    if (selectedBoss === b) radio.checked = true;
    div.appendChild(radio);
    div.appendChild(document.createTextNode(' ' + b));
    modalBossList.appendChild(div);
  });
  editingEntryIdForParticipants = null; // not editing entry here
  document.getElementById('boss-modal').style.display='flex';
});

saveBossBtn?.addEventListener('click', ()=>{
  const sel = modalBossList.querySelector('input[name="boss"]:checked');
  if (sel) {
    selectedBoss = sel.value;
    selectedBossSpan.textContent = selectedBoss;
  }
  document.getElementById('boss-modal').style.display='none';
});
closeBossBtn?.addEventListener('click', ()=>document.getElementById('boss-modal').style.display='none');

/* ========================
   Participants modal (used for both creating entry and editing existing entry)
   - When opened from Boss Loot Panel: editingEntryIdForParticipants === null
   - When opened from a recorded entry's Edit Participants button: editingEntryIdForParticipants = entryId
   ======================== */
editParticipantsBtn?.addEventListener('click', async ()=>{
  editingEntryIdForParticipants = null; // using it for create flow
  openParticipantsModalWithSelection(selectedParticipants);
});

/* helper to open modal and populate checkboxes with sorted members and given selected array */
function openParticipantsModalWithSelection(selectedArr = []){
  modalMemberList.innerHTML = '';
  alphabetize(members).forEach(m=>{
    const row = document.createElement('div');
    row.className='py-1';
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type='checkbox';
    cb.value = m;
    if (selectedArr.includes(m)) cb.checked = true;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(' ' + m));
    row.appendChild(label);
    modalMemberList.appendChild(row);
  });
  document.getElementById('participant-modal').style.display='flex';
}

/* Save participants: either save to create-flow (selectedParticipants) or update existing entry members if editingEntryIdForParticipants is set */
saveParticipantsBtn?.addEventListener('click', async ()=>{
  const checked = Array.from(modalMemberList.querySelectorAll('input[type="checkbox"]:checked')).map(n=>n.value);
  // dedupe & sort
  const cleaned = alphabetize(Array.from(new Set(checked)));
  if (!editingEntryIdForParticipants) {
    // create-flow: set selectedParticipants
    selectedParticipants = cleaned;
    selectedParticipantsEl.innerHTML = selectedParticipants.map(p=>`<li>${p}</li>`).join('');
  } else {
    // editing an existing recorded entry - update Firestore
    const entryRef = doc(firebaseDB, 'lootEntries', editingEntryIdForParticipants);
    await updateDoc(entryRef, { members: cleaned });
    // clear flag
    editingEntryIdForParticipants = null;
  }
  document.getElementById('participant-modal').style.display='none';
});
closeParticipantsBtn?.addEventListener('click', ()=>{
  editingEntryIdForParticipants = null;
  document.getElementById('participant-modal').style.display='none';
});

// admin.js (PART 2 of 2)

/* ========================
   Add New Loot Entry
   ======================== */
addNewLootEntryBtn?.addEventListener('click', async ()=>{
  if (!selectedBoss) return alert('Select a boss');
  if (!selectedParticipants.length) return alert('Select participants');
  if (!lootItems.length) return alert('Add at least one loot item');

  const dateStr = new Date().toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true });
  await addDoc(lootCollection, {
    boss: selectedBoss,
    members: selectedParticipants,
    loot: lootItems,
    date: dateStr,
    settled: false
  });

  // reset
  selectedBoss = null;
  selectedBossSpan.textContent = 'None';
  selectedParticipants = [];
  selectedParticipantsEl.innerHTML = '';
  lootItems = [];
  renderLootItems();
});

/* ========================
   Firestore listener & render entries
   ======================== */
const lootQuery = query(lootCollection, orderBy('date','desc'));
onSnapshot(lootQuery, snapshot=>{
  allLootEntries = snapshot.docs.map(d=>({ id: d.id, data: d.data() }));
  renderLootEntries(searchInput?.value?.trim() || '');
});

/* render function */
async function renderLootEntries(filterText = ''){
  lootListEl.innerHTML = '';

  const filtered = allLootEntries.filter(e=>{
    const entry = e.data;
    const bossMatch = (entry.boss || '').toLowerCase().includes(filterText.toLowerCase());
    const memberMatch = (entry.members || []).some(m => m.toLowerCase().includes(filterText.toLowerCase()));
    return bossMatch || memberMatch;
  });

  for (const entryObj of filtered){
    const entry = entryObj.data;
    const entryId = entryObj.id;

    // auto-settle entire entry if all loot items are settled
    const allLootSettled = (entry.loot || []).every(l => l.settled);
    if (allLootSettled && !entry.settled) {
      await updateDoc(doc(firebaseDB, 'lootEntries', entryId), { settled: true });
      entry.settled = true;
    }

    // container
    const entryDiv = document.createElement('div');
    entryDiv.className = 'p-3 border rounded-md bg-white mb-3';

    // header
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center cursor-pointer';
    header.innerHTML = `<div><strong>Boss:</strong> ${entry.boss} | <strong>Date:</strong> ${entry.date}</div>
                        <div><strong>Status:</strong> ${entry.settled ? 'Settled' : 'Active'}</div>`;

    // expanded area (hidden by default)
    const expanded = document.createElement('div');
    expanded.style.display = 'none';
    expanded.className = 'mt-2';

    // participants block with Edit Participants button
    const participantsBlock = document.createElement('div');
    participantsBlock.className = 'mb-2 flex justify-between items-start';

    const participantsList = document.createElement('div');
    participantsList.innerHTML = `<strong>Participants:</strong>
      <ul class="ml-4">${(entry.members || []).map(m => `<li>${m}</li>`).join('')}</ul>`;

    const editPartBtn = document.createElement('button');
    editPartBtn.textContent = 'Edit Participants';
    editPartBtn.className = 'bg-blue-500 text-white px-2 py-1 rounded';
    editPartBtn.onclick = async ()=>{
      // prepare modal with members and pre-check current participants
      editingEntryIdForParticipants = entryId;
      openParticipantsModalWithSelection(entry.members || []);
    };

    participantsBlock.appendChild(participantsList);
    participantsBlock.appendChild(editPartBtn);
    expanded.appendChild(participantsBlock);

    // loot items list with Edit Price and Settle per item (if not settled)
    const lootContainer = document.createElement('div');
    lootContainer.className = 'space-y-2';
    const lootHeader = document.createElement('div'); lootHeader.innerHTML = '<strong>Loot Items:</strong>';
    lootContainer.appendChild(lootHeader);

    (entry.loot || []).forEach((item, idx)=>{
      const row = document.createElement('div');
      row.className = 'flex justify-between items-center';

      const left = document.createElement('div');
      left.textContent = item.name;

      const right = document.createElement('div');
      right.className = 'flex gap-2 items-center';

      if (!entry.settled && !item.settled){
        // edit price button
        const priceBtn = document.createElement('button');
        priceBtn.className = 'bg-indigo-200 px-2 py-1 rounded';
        priceBtn.textContent = item.price;
        priceBtn.onclick = ()=>{
          lootToEdit = { entryId, lootIndex: idx, lootItem: item };
          editLootNameSpan.textContent = item.name;
          editLootPriceInput.value = item.price;
          editLootModal.style.display = 'flex';
        };
        // settle with confirmation
        const settleBtn = document.createElement('button');
        settleBtn.className = 'bg-green-500 text-white px-2 py-1 rounded';
        settleBtn.textContent = 'Settle';
        settleBtn.onclick = async ()=>{
          if (!confirm(`Mark "${item.name}" as settled?`)) return;
          const ref = doc(firebaseDB, 'lootEntries', entryId);
          const curSnap = await getDoc(ref);
          if (!curSnap.exists()) return alert('Entry not found');
          const curLoot = (curSnap.data().loot || []).map((l,i)=> i===idx ? {...l, settled:true} : l);
          await updateDoc(ref, { loot: curLoot });
        };
        right.append(priceBtn, settleBtn);
      } else {
        const span = document.createElement('span');
        span.textContent = item.price;
        span.className = 'text-gray-500 line-through';
        right.appendChild(span);
      }

      row.append(left, right);
      lootContainer.appendChild(row);
    });

    expanded.appendChild(lootContainer);

    // total price
    const total = (entry.loot || []).reduce((s,l)=>s + (l.price || 0), 0);
    const totalDiv = document.createElement('div');
    totalDiv.className = 'mt-2 font-semibold';
    totalDiv.textContent = `Total Price: ${total}`;
    expanded.appendChild(totalDiv);

    // per-loot share
    const perDiv = document.createElement('div');
    perDiv.className = 'mt-2';
    perDiv.innerHTML = '<strong>Per Loot Share:</strong>';
    const ulShares = document.createElement('ul');
    ulShares.className = 'ml-4';
    (entry.loot || []).forEach(l=>{
      const share = (entry.members && entry.members.length) ? (l.price / entry.members.length).toFixed(2) : '0.00';
      const li = document.createElement('li');
      li.textContent = `${l.name}: ${share} per member`;
      ulShares.appendChild(li);
    });
    perDiv.appendChild(ulShares);
    expanded.appendChild(perDiv);

    // remove entry button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'bg-red-500 text-white px-3 py-1 rounded mt-3';
    removeBtn.textContent = 'Remove Entry';
    removeBtn.onclick = async ()=>{
      if (!confirm('Remove this loot entry?')) return;
      await deleteDoc(doc(firebaseDB, 'lootEntries', entryId));
    };
    expanded.appendChild(removeBtn);

    // append header + expanded
entryDiv.appendChild(header);
entryDiv.appendChild(expanded);

// Toggle expand/collapse on click, except when clicking buttons inside
header.addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') return; // prevent toggle when clicking a button
  expanded.style.display = expanded.style.display === 'none' ? 'block' : 'none';
});

    lootListEl.appendChild(entryDiv);
  }
}

/* ========================
   Edit Loot Price Modal save/close
   ======================== */
saveLootPriceBtn?.addEventListener('click', async ()=>{
  if (!lootToEdit) return;
  const newPrice = parseFloat(editLootPriceInput.value) || 0;
  const ref = doc(firebaseDB, 'lootEntries', lootToEdit.entryId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return alert('Entry not found');
  const updatedLoot = (snap.data().loot || []).map((l, i) => i === lootToEdit.lootIndex ? {...l, price: newPrice} : l);
  await updateDoc(ref, { loot: updatedLoot });
  lootToEdit = null;
  editLootModal.style.display = 'none';
});
closeLootPriceBtn?.addEventListener('click', ()=>{ lootToEdit = null; editLootModal.style.display = 'none'; });

/* ========================
   Edit Participants button inside each entry now uses participant-modal (handled above)
   Search binding
   ======================== */
searchInput?.addEventListener('input', e => renderLootEntries(e.target.value.trim()));

/* ========================
   End of file
   ======================== */