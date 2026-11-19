// =========================================================
// MONEYPILOT STATE & PERSISTENCE
// =========================================================
const DEFAULT_STATE = {
  userName: "Dinda",
  monthlyAllowance: 1500000,
  dailyLimit: 40000,
  daysRemaining: 21,
  coins: 45,
  billReady: false,
  mandatoryItems: [
    { id: 1, name: "Iuran Kos, Sampah & Keamanan", due: "Jatuh tempo tgl 5 tiap bulan", amount: 180000, checked: true },
    { id: 2, name: "Paket Data & Wifi Kos Patungan", due: "Prioritas tugas kuliah daring", amount: 75000, checked: true },
    { id: 3, name: "Galon Air & Gas Bersama", due: "Dapur lantai 2", amount: 45000, checked: true }
  ],
  allocations: [
    { name: "Iuran Kos, Sampah & Keamanan", pct: 70, amount: 180000, stepK: 28 },
    { name: "Paket Data & Wifi Kos Patungan", pct: 12, amount: 75000, stepK: 5 },
    { name: "Galon Air & Gas Bersama", pct: 18, amount: 45000, stepK: 7 }
  ],
  transactions: [
    { id: 101, date: "10 Okt 2024", time: "12:40 WIB", title: "Nasi Uduk & Es Teh Manis", category: "Makan & Minum", catBadge: "Makan", note: "Warteg Berkah", amount: 12000, status: "Sesuai Jatah", isToday: true },
    { id: 102, date: "10 Okt 2024", time: "09:15 WIB", title: "Print Makalah Bab 3 (4 Lembar)", category: "Lain-lain", catBadge: "Lain-lain", note: "Fotokopi Kampus", amount: 2000, status: "Wajib Kuliah", isToday: true },
    { id: 103, date: "09 Okt 2024", time: "17:30 WIB", title: "Isi Bensin Motor Beat", category: "Transportasi", catBadge: "Transport", note: "SPBU Margonda", amount: 20000, status: "Alokasi Mingguan", isToday: false },
    { id: 104, date: "09 Okt 2024", time: "12:10 WIB", title: "Paket Ayam Geprek Sambal Korek", category: "Makan & Minum", catBadge: "Makan", note: "Makan Siang", amount: 15000, status: "Sesuai Jatah", isToday: false },
    { id: 105, date: "08 Okt 2024", time: "10:00 WIB", title: "Refill Air Galon Kosan", category: "Rutin Kos", catBadge: "Rutin Kos", note: "Pos Wajib", amount: 7000, status: "Kebutuhan Utama", isToday: false },
    { id: 106, date: "08 Okt 2024", time: "15:45 WIB", title: "Es Kopi Susu Gula Aren", category: "Jajan & Reward", catBadge: "Jajan", note: "Self-Reward Nugas", amount: 18000, status: "Sedikit Lewat", isToday: false }
  ],
  wishlist: [],
  bear: {
    name: "Beruang Dinda",
    hat: "none",
    acc: "none",
    outfit: "none"
  }
};

const COSMETICS = {
  hat: [
    { id: "none", name: "Tanpa aksesoris", cost: 0, icon: "—" },
    { id: "leaf", name: "Daun", cost: 10, icon: "🌱" },
    { id: "duck", name: "Bebek", cost: 30, icon: "🐥" },
    { id: "flower", name: "Bunga", cost: 15, icon: "🌼" },
    { id: "ribbon", name: "Pita", cost: 40, icon: "🎀" },
    { id: "crown", name: "Mahkota", cost: 15, icon: "👑" }
  ],
  acc: [
    { id: "none", name: "Tanpa aksesoris", cost: 0, icon: "—" },
    { id: "wand", name: "Tongkat Sihir", cost: 15, icon: "🪄" },
    { id: "plush", name: "Boneka", cost: 60, icon: "🧸" },
    { id: "boba", name: "Boba", cost: 100, icon: "🧋" },
    { id: "fish", name: "Ikan", cost: 15, icon: "🐟" },
    { id: "carrot", name: "Wortel", cost: 60, icon: "🥕" }
  ],
  outfit: [
    { id: "none", name: "Tanpa aksesoris", cost: 0, icon: "—" },
    { id: "hoodie", name: "Hoodie", cost: 23, icon: "🧥" },
    { id: "uniform", name: "Seragam", cost: 30, icon: "👔" },
    { id: "overall", name: "Celana atasan", cost: 20, icon: "🎽" },
    { id: "coat", name: "Hoodie hangat", cost: 35, icon: "🤎" },
    { id: "scarf", name: "Syal hangat", cost: 17, icon: "🧣" }
  ]
};

let state = loadState();
let draftBear = { ...state.bear };
let activeHistoryFilter = "Semua";
let selectedExpPos = "Makan & Minum";
let selectedPayMethod = "QRIS / GoPay";

function loadState() {
  try {
    const saved = localStorage.getItem("moneypilot_state_v2");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function saveState() {
  try {
    localStorage.setItem("moneypilot_state_v2", JSON.stringify(state));
  } catch (e) {}
}

function resetDemoData() {
  state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  draftBear = { ...state.bear };
  saveState();
  renderAll();
  showToast("Data demo berhasil dikembalikan ke awal!");
}

// =========================================================
// FORMATTERS & HELPERS
// =========================================================
function formatRp(num) {
  return "Rp " + Math.max(0, Math.round(num)).toLocaleString("id-ID");
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.remove("hidden");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3000);
}

// =========================================================
// NAVIGATION & AUTH
// =========================================================
function navigateTo(pageId) {
  document.getElementById("auth-view").classList.add("hidden");
  document.getElementById("app-shell").classList.remove("hidden");

  document.querySelectorAll(".page-view").forEach(p => p.classList.remove("active"));
  const target = document.getElementById("page-" + pageId);
  if (target) target.classList.add("active");

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.page === pageId);
  });

  if (pageId === "avatar") {
    draftBear = { ...state.bear };
    document.getElementById("bear-name-input").value = draftBear.name;
    updateBearNamePreview();
    renderAvatarEditor();
  }

  document.querySelector(".sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleSidebar() {
  document.querySelector(".sidebar").classList.toggle("open");
}

function toggleProfileMenu() {
  document.getElementById("profile-dropdown").classList.toggle("hidden");
}

function openAuth(mode) {
  document.getElementById("profile-dropdown").classList.add("hidden");
  document.getElementById("app-shell").classList.add("hidden");
  document.getElementById("auth-view").classList.remove("hidden");

  if (mode === "register") {
    document.getElementById("login-form").classList.add("hidden");
    document.getElementById("register-form").classList.remove("hidden");
    document.getElementById("auth-brand-name").textContent = "MoneyPilot";
  } else {
    document.getElementById("register-form").classList.add("hidden");
    document.getElementById("login-form").classList.remove("hidden");
    document.getElementById("auth-brand-name").textContent = "MoneyPilot";
  }
}

function enterDashboard() {
  navigateTo("beranda");
  showToast("Selamat datang kembali, " + state.userName + "!");
}

document.getElementById("to-register").addEventListener("click", (e) => {
  e.preventDefault();
  openAuth("register");
});

document.getElementById("to-login").addEventListener("click", (e) => {
  e.preventDefault();
  openAuth("login");
});

document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  enterDashboard();
});

document.getElementById("register-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const nameVal = document.getElementById("reg-name").value.trim();
  if (nameVal) {
    state.userName = nameVal;
    state.bear.name = "Beruang " + nameVal;
    saveState();
    renderAll();
  }
  enterDashboard();
});

// =========================================================
// PIXEL ART BEAR SVG RENDERER
// =========================================================
function buildBearSVG(bearConfig, size = 140) {
  const hatOverlay = {
    none: "",
    leaf: `<path d="M58 18 C58 8, 70 8, 66 20" fill="#84CC16" stroke="#253300" stroke-width="2"/><line x1="60" y1="22" x2="60" y2="15" stroke="#253300" stroke-width="2.5"/>`,
    duck: `<ellipse cx="60" cy="15" rx="11" ry="8" fill="#FACC15" stroke="#422006" stroke-width="2"/><circle cx="64" cy="13" r="1.5" fill="#1E293B"/><polygon points="70,15 76,17 70,19" fill="#F97316"/>`,
    flower: `<circle cx="42" cy="24" r="7" fill="#FFFFFF" stroke="#422006" stroke-width="1.5"/><circle cx="42" cy="24" r="3" fill="#FACC15"/>`,
    ribbon: `<polygon points="60,18 47,11 47,25" fill="#EF4444" stroke="#450A0A" stroke-width="1.8"/><polygon points="60,18 73,11 73,25" fill="#EF4444" stroke="#450A0A" stroke-width="1.8"/><circle cx="60" cy="18" r="3.5" fill="#FCA5A5" stroke="#450A0A" stroke-width="1.5"/>`,
    crown: `<polygon points="46,21 49,10 55,16 60,8 65,16 71,10 74,21" fill="#FACC15" stroke="#713F12" stroke-width="2"/>`
  }[bearConfig.hat] || "";

  const outfitOverlay = {
    none: "",
    hoodie: `<rect x="43" y="64" width="34" height="26" rx="8" fill="#F1F5F9" stroke="#334155" stroke-width="2.5"/><line x1="60" y1="64" x2="60" y2="90" stroke="#94A3B8" stroke-width="2"/>`,
    uniform: `<rect x="43" y="64" width="34" height="26" rx="6" fill="#042C8F" stroke="#1E293B" stroke-width="2.5"/><polygon points="52,64 60,74 68,64" fill="#FFFFFF"/>`,
    overall: `<rect x="44" y="68" width="32" height="24" rx="6" fill="#65A30D" stroke="#253300" stroke-width="2.5"/><line x1="49" y1="62" x2="49" y2="69" stroke="#65A30D" stroke-width="4"/><line x1="71" y1="62" x2="71" y2="69" stroke="#65A30D" stroke-width="4"/>`,
    coat: `<rect x="42" y="63" width="36" height="28" rx="8" fill="#78350F" stroke="#271104" stroke-width="2.5"/><line x1="60" y1="63" x2="60" y2="91" stroke="#FDE68A" stroke-width="2"/>`,
    scarf: `<rect x="44" y="59" width="32" height="9" rx="4" fill="#DC2626" stroke="#450A0A" stroke-width="2"/><rect x="62" y="66" width="8" height="16" rx="3" fill="#DC2626" stroke="#450A0A" stroke-width="2"/>`
  }[bearConfig.outfit] || "";

  const accOverlay = {
    none: "",
    wand: `<line x1="84" y1="84" x2="98" y2="54" stroke="#78350F" stroke-width="3.5" stroke-linecap="round"/><polygon points="98,46 100,52 106,52 101,56 103,62 98,58 93,62 95,56 90,52 96,52" fill="#FACC15" stroke="#854D0E" stroke-width="1.5"/>`,
    plush: `<circle cx="90" cy="76" r="10" fill="#B47B56" stroke="#3E2314" stroke-width="2"/><circle cx="84" cy="68" r="3.5" fill="#B47B56" stroke="#3E2314" stroke-width="1.5"/><circle cx="96" cy="68" r="3.5" fill="#B47B56" stroke="#3E2314" stroke-width="1.5"/>`,
    boba: `<rect x="83" y="64" width="14" height="20" rx="3" fill="#FDE68A" stroke="#451A03" stroke-width="2"/><line x1="90" y1="56" x2="90" y2="66" stroke="#042C8F" stroke-width="3"/><circle cx="87" cy="80" r="1.5" fill="#1E293B"/><circle cx="92" cy="79" r="1.5" fill="#1E293B"/>`,
    fish: `<ellipse cx="90" cy="75" rx="11" ry="6" fill="#4891E7" stroke="#042C8F" stroke-width="2"/><polygon points="100,75 107,69 107,81" fill="#4891E7" stroke="#042C8F" stroke-width="2"/>`,
    carrot: `<polygon points="84,84 98,62 104,68" fill="#F97316" stroke="#7C2D12" stroke-width="2"/><path d="M100 63 L106 56 M102 66 L109 62" stroke="#65A30D" stroke-width="2.5"/>`
  }[bearConfig.acc] || "";

  return `
    <svg viewBox="0 0 120 115" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- Ears -->
      <circle cx="38" cy="28" r="11" fill="#A46B49" stroke="#3E2314" stroke-width="3"/>
      <circle cx="38" cy="28" r="5.5" fill="#E8C3A8"/>
      <circle cx="82" cy="28" r="11" fill="#A46B49" stroke="#3E2314" stroke-width="3"/>
      <circle cx="82" cy="28" r="5.5" fill="#E8C3A8"/>
      <!-- Arms -->
      <ellipse cx="38" cy="74" rx="9" ry="13" transform="rotate(18 38 74)" fill="#A46B49" stroke="#3E2314" stroke-width="3"/>
      <ellipse cx="82" cy="74" rx="9" ry="13" transform="rotate(-18 82 74)" fill="#A46B49" stroke="#3E2314" stroke-width="3"/>
      <!-- Legs -->
      <rect x="44" y="86" width="13" height="17" rx="6" fill="#A46B49" stroke="#3E2314" stroke-width="3"/>
      <rect x="63" y="86" width="13" height="17" rx="6" fill="#A46B49" stroke="#3E2314" stroke-width="3"/>
      <!-- Body -->
      <rect x="42" y="58" width="36" height="34" rx="14" fill="#A46B49" stroke="#3E2314" stroke-width="3"/>
      <ellipse cx="60" cy="76" rx="11" ry="10" fill="#E8C3A8"/>
      ${outfitOverlay}
      <!-- Head -->
      <rect x="33" y="21" width="54" height="42" rx="19" fill="#A46B49" stroke="#3E2314" stroke-width="3"/>
      <!-- Eyes & Cheeks -->
      <circle cx="47" cy="41" r="3" fill="#2A160C"/>
      <circle cx="73" cy="41" r="3" fill="#2A160C"/>
      <ellipse cx="42" cy="46" rx="4.5" ry="2.5" fill="#F4978E" opacity="0.8"/>
      <ellipse cx="78" cy="46" rx="4.5" ry="2.5" fill="#F4978E" opacity="0.8"/>
      <!-- Muzzle -->
      <ellipse cx="60" cy="47" rx="10" ry="8" fill="#F5DFCE"/>
      <ellipse cx="60" cy="44" rx="3.2" ry="2.2" fill="#2A160C"/>
      <path d="M57 49 Q60 52 63 49" fill="none" stroke="#2A160C" stroke-width="2" stroke-linecap="round"/>
      ${hatOverlay}
      ${accOverlay}
    </svg>
  `;
}

// =========================================================
// RENDER ALL VIEWS
// =========================================================
function renderAll() {
  const lockedTotal = state.mandatoryItems
    .filter(m => m.checked)
    .reduce((sum, item) => sum + item.amount, 0);

  const monthSpent = state.transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const freeBalance = Math.max(0, state.monthlyAllowance - lockedTotal - monthSpent + 74000);
  const todayTxs = state.transactions.filter(tx => tx.isToday);
  const todaySpent = todayTxs.reduce((sum, tx) => sum + tx.amount, 0);
  const dailyRemaining = Math.max(0, state.dailyLimit - todaySpent);
  const usedPct = Math.min(100, Math.round((todaySpent / state.dailyLimit) * 100));
  const leftPct = Math.max(0, 100 - usedPct);

  // User & Coins
  document.getElementById("sidebar-user-name").textContent = state.userName;
  document.getElementById("hero-user-name").textContent = state.userName;
  document.getElementById("beranda-coins").textContent = state.coins;
  document.getElementById("avatar-coins-display").textContent = state.coins;

  // Sidebar Budget Card
  const sbRem = Math.max(0, state.monthlyAllowance - lockedTotal - monthSpent - 276000);
  const sbPct = Math.max(5, Math.min(100, Math.round((sbRem / state.monthlyAllowance) * 100)));
  document.getElementById("sb-remaining").textContent = formatRp(sbRem);
  document.getElementById("sb-progress").style.width = sbPct + "%";
  document.getElementById("sb-pct").textContent = "Tersisa " + sbPct + "%";

  // Beranda Hero Card
  document.getElementById("daily-remaining").textContent = formatRp(dailyRemaining);
  document.getElementById("daily-target-label").textContent = formatRp(state.dailyLimit);
  document.getElementById("daily-progress-fill").style.width = usedPct + "%";
  document.getElementById("daily-used-label").textContent = `Terpakai ${usedPct}% (${formatRp(todaySpent)})`;
  document.getElementById("daily-left-pct").textContent = `Sisa ${leftPct}%`;

  const isOver = todaySpent > state.dailyLimit;
  document.getElementById("daily-status-pill").textContent = isOver ? "⚠ Melebihi Batas" : "● Aman Terkendali";
  document.getElementById("today-status-note").textContent = isOver ? "Melebihi batas aman harian" : "Di bawah batas aman harian";

  // Beranda Free Balance
  document.getElementById("free-balance-val").textContent = formatRp(freeBalance);
  document.getElementById("total-allowance-text").textContent = formatRp(state.monthlyAllowance);
  document.getElementById("locked-kos-text").textContent = formatRp(lockedTotal);
  document.getElementById("safe-daily-rate").textContent = formatRp(Math.round(freeBalance / state.daysRemaining)) + " / hari";

  // Beranda Bear
  document.getElementById("beranda-bear-canvas").innerHTML = buildBearSVG(state.bear, 145);

  // Beranda Today List
  document.getElementById("today-tx-count").textContent = todayTxs.length + " Transaksi";
  document.getElementById("today-total-val").textContent = formatRp(todaySpent);
  document.getElementById("today-limit-val").textContent = formatRp(state.dailyLimit);

  const listEl = document.getElementById("today-expense-list");
  listEl.innerHTML = todayTxs.map(tx => `
    <div class="today-item">
      <div>
        <div class="today-item-title">${tx.title}</div>
        <div class="today-item-meta">${tx.catBadge} • ${tx.time}</div>
      </div>
      <div class="today-item-amount">-${formatRp(tx.amount)}</div>
    </div>
  `).join("");

  // Bill button state
  const btnBill = document.getElementById("btn-ready-pay");
  if (state.billReady) {
    btnBill.textContent = "✓ Siap Dibayar";
    btnBill.style.background = "#F1F9CF";
    btnBill.style.color = "#253300";
    document.getElementById("bill-vault-status").textContent = "Tagihan ditandai siap dibayar tepat waktu.";
  }

  // Render Sub-modules
  renderMandatoryList();
  recalcAllowancePreview();
  updateExpensePreview();
  updateSimulation();
  renderAllocations();
  renderHistoryTable();
}

// =========================================================
// BERANDA QUICK ACTIONS
// =========================================================
function quickAddExpense(title, amount, category) {
  const catBadgeMap = {
    "Makan & Minum": "Makan",
    "Transportasi": "Transport",
    "Lain-lain": "Lain-lain",
    "Rutin Kos": "Rutin Kos",
    "Jajan & Reward": "Jajan"
  };

  state.transactions.unshift({
    id: Date.now(),
    date: "10 Okt 2024",
    time: "Baru saja",
    title,
    category,
    catBadge: catBadgeMap[category] || "Lain-lain",
    note: "Shortcut Cepat",
    amount,
    status: amount <= 20000 ? "Sesuai Jatah" : "Alokasi Mingguan",
    isToday: true
  });

  state.coins += 2;
  saveState();
  renderAll();
  showToast(`Tercatat: ${title} (-${formatRp(amount)}) • +2 Koin!`);
}

function markBillReady() {
  state.billReady = !state.billReady;
  saveState();
  renderAll();
  showToast(state.billReady ? "Tagihan Patungan Galon & WiFi ditandai siap bayar!" : "Status tagihan dikembalikan.");
}

// =========================================================
// CATAT PENGELUARAN LOGIC
// =========================================================
function setExpensePreset(val, btn) {
  document.getElementById("exp-amount").value = val;
  document.querySelectorAll("#page-catat-pengeluaran .preset-chip").forEach(c => c.classList.remove("active"));
  if (btn) btn.classList.add("active");
  updateExpensePreview();
}

function selectExpensePos(btn) {
  document.querySelectorAll(".pos-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  selectedExpPos = btn.dataset.cat;
}

function selectPayMethod(btn, method) {
  document.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  selectedPayMethod = method;
}

function updateExpensePreview() {
  const inputVal = parseInt(document.getElementById("exp-amount").value, 10) || 0;
  const limit = state.dailyLimit;
  const after = Math.max(0, limit - inputVal);
  const usedPct = Math.min(100, ((inputVal / limit) * 100)).toFixed(1);
  const leftPct = Math.max(0, (100 - usedPct)).toFixed(1);

  document.getElementById("exp-prev-daily").textContent = formatRp(limit);
  document.getElementById("exp-after-daily").textContent = formatRp(after);
  document.getElementById("exp-impact-bar").style.width = usedPct + "%";
  document.getElementById("exp-impact-used").textContent = `Terpakai: ${formatRp(inputVal)} (${usedPct}%)`;
  document.getElementById("exp-impact-left").textContent = `Sisa: ${formatRp(after)} (${leftPct}%)`;

  const adviceEl = document.getElementById("exp-impact-advice");
  if (inputVal <= limit * 0.6) {
    adviceEl.innerHTML = `✅ Status: <strong>Masih Aman Terkendali</strong> untuk makan malam &amp; jajan ringan!`;
  } else if (inputVal <= limit) {
    adviceEl.innerHTML = `⚠️ Status: <strong>Mendekati Batas Harian</strong>, hemat di transaksi berikutnya ya.`;
  } else {
    adviceEl.innerHTML = `🚨 Status: <strong>Melebihi Jatah Harian</strong>, autopilot akan menyesuaikan jatah besok.`;
  }
}

document.getElementById("exp-amount").addEventListener("input", updateExpensePreview);

document.getElementById("expense-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const amount = parseInt(document.getElementById("exp-amount").value, 10) || 0;
  const title = document.getElementById("exp-title").value.trim() || "Pengeluaran Harian";
  const note = document.getElementById("exp-note").value.trim() || selectedPayMethod;

  const badgeMap = {
    "Makan & Minum": "Makan",
    "Transportasi": "Transport",
    "Lain-lain": "Lain-lain",
    "Jajan & Reward": "Jajan",
    "Rutin Kos": "Rutin Kos"
  };

  state.transactions.unshift({
    id: Date.now(),
    date: "10 Okt 2024",
    time: "13:05 WIB",
    title,
    category: selectedExpPos,
    catBadge: badgeMap[selectedExpPos] || "Lain-lain",
    note,
    amount,
    status: amount <= state.dailyLimit ? "Sesuai Jatah" : "Sedikit Lewat",
    isToday: true
  });

  state.coins += 3;
  saveState();
  renderAll();
  navigateTo("beranda");
  showToast(`Pengeluaran ${formatRp(amount)} disimpan! (+3 Koin Kebiasaan Baik)`);
});

// =========================================================
// INPUT UANG SAKU BULANAN
// =========================================================
function renderMandatoryList() {
  const container = document.getElementById("mandatory-list");
  container.innerHTML = state.mandatoryItems.map(item => `
    <div class="mandatory-item">
      <div class="mandatory-left">
        <input type="checkbox" class="mandatory-check" ${item.checked ? "checked" : ""} onchange="toggleMandatory(${item.id})" />
        <div>
          <div class="mandatory-name">${item.name}</div>
          <div class="mandatory-due">${item.due}</div>
        </div>
      </div>
      <div class="mandatory-amount">${formatRp(item.amount)}</div>
    </div>
  `).join("");
}

function toggleMandatory(id) {
  const item = state.mandatoryItems.find(m => m.id === id);
  if (item) {
    item.checked = !item.checked;
    saveState();
    renderAll();
  }
}

function addMandatoryItem() {
  const nameEl = document.getElementById("new-mandatory-name");
  const amtEl = document.getElementById("new-mandatory-amount");
  const name = nameEl.value.trim();
  const amount = parseInt(amtEl.value, 10) || 0;

  if (!name || amount <= 0) {
    showToast("Isi nama pos wajib dan nominalnya dulu ya!");
    return;
  }

  state.mandatoryItems.push({
    id: Date.now(),
    name,
    due: "Pos wajib bulanan baru",
    amount,
    checked: true
  });

  nameEl.value = "";
  amtEl.value = "";
  saveState();
  renderAll();
  showToast("Pos wajib baru ditambahkan & dikunci!");
}

function addAllowance(delta) {
  const el = document.getElementById("allowance-input");
  el.value = (parseInt(el.value, 10) || 0) + delta;
  recalcAllowancePreview();
}

function resetAllowanceInput() {
  document.getElementById("allowance-input").value = 1500000;
  recalcAllowancePreview();
}

function recalcAllowancePreview() {
  const total = parseInt(document.getElementById("allowance-input").value, 10) || 0;
  const locked = state.mandatoryItems.filter(m => m.checked).reduce((s, i) => s + i.amount, 0);
  const free = Math.max(0, total - locked);
  const daily = Math.round(free / 31);

  document.getElementById("mandatory-total-label").textContent = formatRp(locked);
  document.getElementById("prev-total-allowance").textContent = formatRp(total);
  document.getElementById("prev-locked-kos").textContent = "- " + formatRp(locked);
  document.getElementById("prev-free-allowance").textContent = formatRp(free);
  document.getElementById("prev-smart-daily").textContent = formatRp(daily);
  document.getElementById("prev-formula-text").textContent = `${formatRp(free)} ÷ 31 Hari = Jatah aman jajan harian`;
}

function saveAllowanceSettings() {
  const total = parseInt(document.getElementById("allowance-input").value, 10) || 1500000;
  const locked = state.mandatoryItems.filter(m => m.checked).reduce((s, i) => s + i.amount, 0);
  const free = Math.max(0, total - locked);

  state.monthlyAllowance = total;
  state.dailyLimit = Math.round(free / 31);
  saveState();
  renderAll();
  navigateTo("beranda");
  showToast("Anggaran bulanan & Autopilot berhasil diperbarui!");
}

// =========================================================
// SIMULASI & CEK BELI
// =========================================================
function adjustSimPrice(val, isAdd) {
  const el = document.getElementById("sim-item-price");
  const cur = parseInt(el.value, 10) || 0;
  el.value = isAdd ? cur + val : val;
  updateSimulation();
}

function updateSimulation() {
  const price = parseInt(document.getElementById("sim-item-price").value, 10) || 0;
  const remDays = 24;
  const currentDaily = state.dailyLimit;
  const dailyDrop = Math.round(price / remDays);
  const newDaily = Math.max(0, currentDaily - dailyDrop);

  document.getElementById("sim-current-daily").innerHTML = `${formatRp(currentDaily)}<span>/hari</span>`;
  document.getElementById("sim-new-daily").innerHTML = `${formatRp(newDaily)}<span>/hari</span>`;
  document.getElementById("sim-diff-note").textContent = `📉 -${formatRp(dailyDrop)}/hari (${remDays} hari)`;

  const badge = document.getElementById("sim-load-badge");
  if (price < 75000) {
    badge.textContent = "✅ Beban: Ringan";
  } else if (price <= 200000) {
    badge.textContent = "⚠ Beban: Sedang";
  } else {
    badge.textContent = "🚨 Beban: Berat";
  }

  // Curve projection
  const realBal = Math.max(0, 850000 - price);
  const safeDaily = Math.max(15000, Math.round(realBal / 20));
  document.getElementById("curve-real-balance").textContent = formatRp(realBal);
  document.getElementById("curve-safe-rec").innerHTML = `${formatRp(safeDaily)}<span>/hr</span>`;
  document.getElementById("btn-safe-limit-text").textContent = formatRp(safeDaily);
  document.getElementById("curve-critical-date").textContent = price > 250000 ? "19 Oktober" : "24 Oktober";

  renderWishlist();
}

function saveToWishlist() {
  const name = document.getElementById("sim-item-name").value.trim() || "Barang Impian";
  const price = parseInt(document.getElementById("sim-item-price").value, 10) || 0;
  state.wishlist.push({ id: Date.now(), name, price });
  state.coins += 5;
  saveState();
  renderWishlist();
  document.getElementById("beranda-coins").textContent = state.coins;
  showToast(`"${name}" masuk Wishlist 48 Jam! Kamu dapat +5 Koin anti-impulsif!`);
}

function renderWishlist() {
  const box = document.getElementById("wishlist-section");
  const list = document.getElementById("wishlist-items");
  if (!state.wishlist.length) {
    box.classList.add("hidden");
    return;
  }
  box.classList.remove("hidden");
  list.innerHTML = state.wishlist.map(w => `
    <div class="wishlist-row">
      <span><strong>${w.name}</strong> — ${formatRp(w.price)}</span>
      <span class="pill-tertiary-sm">Ditunda 48 Jam</span>
    </div>
  `).join("");
}

function buyAndAdjust() {
  const name = document.getElementById("sim-item-name").value.trim() || "Belanja Simulasi";
  const price = parseInt(document.getElementById("sim-item-price").value, 10) || 0;
  const cat = document.getElementById("sim-category").value;

  state.transactions.unshift({
    id: Date.now(),
    date: "10 Okt 2024",
    time: "Baru saja",
    title: name,
    category: cat,
    catBadge: cat === "Makan & Minum" ? "Makan" : cat === "Lain-lain" ? "Lain-lain" : "Jajan",
    note: "Via Cek Beli",
    amount: price,
    status: "Disesuaikan",
    isToday: true
  });

  state.dailyLimit = Math.max(15000, state.dailyLimit - Math.round(price / 24));
  saveState();
  renderAll();
  navigateTo("riwayat");
  showToast(`Transaksi dicatat & jatah harian otomatis disesuaikan!`);
}

function applySafeDailyLimit() {
  const price = parseInt(document.getElementById("sim-item-price").value, 10) || 0;
  const realBal = Math.max(0, 850000 - price);
  state.dailyLimit = Math.max(15000, Math.round(realBal / 20));
  saveState();
  renderAll();
  showToast(`Batas harian aman ${formatRp(state.dailyLimit)}/hari diterapkan!`);
}

// =========================================================
// RIWAYAT & ALOKASI
// =========================================================
function renderAllocations() {
  const totalStepK = state.allocations.reduce((s, a) => s + a.stepK, 0) || 40;
  state.allocations.forEach((a, idx) => {
    a.pct = Math.round((a.stepK / totalStepK) * 100);
    const n = idx + 1;
    document.getElementById(`alloc-bar-${n}`).style.width = a.pct + "%";
    document.getElementById(`leg-p${n}`).textContent = a.pct + "%";
    document.getElementById(`card-p${n}`).textContent = a.pct + "%";
    document.getElementById(`alloc-val-${n}`).innerHTML = `${formatRp(a.amount)} <span>/ hari</span>`;
    document.getElementById(`step-label-${n}`).textContent = a.stepK + "k";
  });

  document.getElementById("riwayat-plafon-val").innerHTML = `${formatRp(totalStepK * 1000)} <span>/ hari</span>`;
}

function stepAllocation(index, delta) {
  const item = state.allocations[index];
  item.amount = Math.max(5000, item.amount + delta);
  item.stepK = Math.max(1, item.stepK + (delta > 0 ? 1 : -1));
  saveState();
  renderAllocations();
}

function setHistoryFilter(cat, btn) {
  activeHistoryFilter = cat;
  document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  renderHistoryTable();
}

function renderHistoryTable() {
  const query = (document.getElementById("history-search").value || "").toLowerCase();
  const allTab = document.querySelector('.filter-pill[data-cat="Semua"]');
  if (allTab) allTab.textContent = `Semua (${state.transactions.length})`;

  const filtered = state.transactions.filter(tx => {
    const matchCat = activeHistoryFilter === "Semua" || tx.category === activeHistoryFilter;
    const matchText =
      tx.title.toLowerCase().includes(query) ||
      tx.note.toLowerCase().includes(query) ||
      tx.catBadge.toLowerCase().includes(query);
    return matchCat && matchText;
  });

  const tbody = document.getElementById("history-table-body");
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:28px; color:#64748B;">Belum ada transaksi pada filter ini.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(tx => {
    const warnClass = tx.status === "Sedikit Lewat" ? "status-pill-warn" : "status-pill-ok";
    return `
      <tr>
        <td>
          <strong>${tx.date}</strong><br/>
          <span class="sub-xs">${tx.time}</span>
        </td>
        <td>
          <div class="tx-title-cell">
            <span class="tx-icon-pill">🧾</span>
            <span>${tx.title}</span>
          </div>
        </td>
        <td><span class="cat-badge">${tx.catBadge}</span></td>
        <td class="sub-xs">${tx.note}</td>
        <td><strong class="text-primary">-${formatRp(tx.amount)}</strong></td>
        <td><span class="${warnClass}">${tx.status}</span></td>
      </tr>
    `;
  }).join("");

  const totalMonth = 250000 + state.transactions.reduce((s, t) => s + t.amount, 0);
  const leftMonth = Math.max(0, state.monthlyAllowance - 300000 - totalMonth);
  document.getElementById("riwayat-month-total").textContent = formatRp(totalMonth);
  document.getElementById("riwayat-month-left").textContent = formatRp(leftMonth);
}

// =========================================================
// AVATAR EDITOR
// =========================================================
function updateBearNamePreview() {
  const val = document.getElementById("bear-name-input").value;
  draftBear.name = val;
  document.getElementById("preview-bear-name").textContent = val || "Beruang Dinda";
  document.getElementById("bear-name-count").textContent = `${val.length}/20`;
}

function getSelectedCosmeticCost() {
  const hatCost = (COSMETICS.hat.find(x => x.id === draftBear.hat) || { cost: 0 }).cost;
  const accCost = (COSMETICS.acc.find(x => x.id === draftBear.acc) || { cost: 0 }).cost;
  const outCost = (COSMETICS.outfit.find(x => x.id === draftBear.outfit) || { cost: 0 }).cost;
  return hatCost + accCost + outCost;
}

function selectCosmetic(slot, id) {
  draftBear[slot] = id;
  renderAvatarEditor();
}

function renderAvatarEditor() {
  document.getElementById("editor-bear-canvas").innerHTML = buildBearSVG(draftBear, 175);

  ["hat", "acc", "outfit"].forEach(slot => {
    const grid = document.getElementById("grid-" + slot);
    grid.innerHTML = COSMETICS[slot].map(item => {
      const isSelected = draftBear[slot] === item.id;
      const costText = item.cost === 0 ? "" : `<span class="cosmetic-cost">${item.cost} Koin</span>`;
      return `
        <div class="cosmetic-item ${isSelected ? "selected" : ""}" onclick="selectCosmetic('${slot}', '${item.id}')">
          <div class="cosmetic-box">${item.icon}</div>
          <div class="cosmetic-name">${item.name}</div>
          ${costText}
        </div>
      `;
    }).join("");
  });

  const totalCost = getSelectedCosmeticCost();
  const remCoins = state.coins - totalCost;
  document.getElementById("avatar-selected-cost").textContent = totalCost;
  document.getElementById("avatar-coin-status").textContent =
    remCoins >= 0
      ? `Sisa koinmu ${remCoins}. Siap menemani hari-harimu!`
      : `Koin kurang ${Math.abs(remCoins)} lagi! Catat pengeluaran hemat untuk dapat koin.`;
}

function saveAvatarCustomization() {
  const totalCost = getSelectedCosmeticCost();
  if (totalCost > state.coins) {
    showToast("Koin belum cukup untuk kombinasi item ini!");
    return;
  }
  state.bear = { ...draftBear };
  saveState();
  renderAll();
  navigateTo("beranda");
  showToast(`Tampilan ${state.bear.name} berhasil disimpan!`);
}

// =========================================================
// INITIALIZE APP
// =========================================================
renderAll();
