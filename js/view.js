// ✅ Firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// 🔥 Your view-only Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCgkO44xHVeQv9XJvjIktAQhdet9J-6hvM",
  authDomain: "guildlootsview.firebaseapp.com",
  projectId: "guildlootsview",
  storageBucket: "guildlootsview.firebasestorage.app",
  messagingSenderId: "535298106967",
  appId: "1:535298106967:web:c38f45b23b8782e2026512"
};

// Initialize Firebase + Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 📅 HTML Elements
const weekSelect = document.getElementById("weekSelect");
const diamondDisplay = document.getElementById("diamondDisplay");
const pesoDisplay = document.getElementById("pesoDisplay");
const summaryContainer = document.getElementById("summaryContainer");
const bossLog = document.getElementById("bossLog");

// 🧭 Load available weeks
async function loadWeeks() {
  const weeksRef = collection(db, "weeks");
  const q = query(weeksRef, orderBy("weekId", "desc"));
  const snapshot = await getDocs(q);

  weekSelect.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = data.weekLabel || docSnap.id;
    weekSelect.appendChild(option);
  });

  if (weekSelect.options.length > 0) {
    weekSelect.selectedIndex = 0;
    loadWeekData(weekSelect.value);
  } else {
    weekSelect.innerHTML = `<option>No weeks found</option>`;
  }
}

// 📊 Load selected week's data
async function loadWeekData(weekId) {
  const weekDocRef = doc(db, "weeks", weekId);
  const weekSnap = await getDoc(weekDocRef);

  if (!weekSnap.exists()) {
    diamondDisplay.textContent = "💎 Diamond: —";
    pesoDisplay.textContent = "₱ Peso: —";
    summaryContainer.innerHTML = `<p class='text-gray-400'>No data available</p>`;
    bossLog.innerHTML = `<p class='text-gray-400'>No records found</p>`;
    return;
  }

  const weekData = weekSnap.data();

  // 💰 Display totals
  diamondDisplay.textContent = `💎 Diamond: ${weekData.totalDiamond || 0}`;
  pesoDisplay.textContent = `₱ Peso: ${weekData.totalPeso || 0}`;

  // 🧾 Participation Summary
  if (weekData.members && Object.keys(weekData.members).length > 0) {
    summaryContainer.innerHTML = "";
    Object.entries(weekData.members).forEach(([name, info]) => {
      const div = document.createElement("div");
      div.className = "flex justify-between border-b border-gray-700 pb-1";
      div.innerHTML = `
        <span>${name}</span>
        <span>${info.hunts || 0} hunts</span>
      `;
      summaryContainer.appendChild(div);
    });
  } else {
    summaryContainer.innerHTML = `<p class='text-gray-400'>No participation yet</p>`;
  }

  // ⚔️ Boss Logs
  if (weekData.bossLogs && weekData.bossLogs.length > 0) {
    bossLog.innerHTML = "";
    weekData.bossLogs.forEach((log) => {
      const card = document.createElement("div");
      card.className = "bg-gray-700 p-3 rounded-lg";
      card.innerHTML = `
        <p class="font-semibold text-emerald-300">${log.bossName}</p>
        <p class="text-gray-300 text-sm">${log.date || "No date"}</p>
        <p class="text-gray-400 text-sm">Participants: ${log.participants?.join(", ") || "None"}</p>
      `;
      bossLog.appendChild(card);
    });
  } else {
    bossLog.innerHTML = `<p class='text-gray-400'>No boss logs recorded</p>`;
  }
}

// 🔁 Change week event
weekSelect.addEventListener("change", () => loadWeekData(weekSelect.value));

// 🚀 Initialize on load
loadWeeks();