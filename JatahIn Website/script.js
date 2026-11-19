// =========================================================
// JATAHIN — sesuai Spesifikasi Fitur
// Data awal KOSONG. Semua angka diturunkan dari: pemasukan, pengeluaran wajib, transaksi, dan tanggal hari ini.
// Catatan: akun & data tersimpan di localStorage browser (prototipe). Produksi perlu backend + hash di server.
// =========================================================
const COIN_PER_DAY = 10; // koin per hari yang jatahnya masih bersisa
const USERS_KEY = "jatahin_users_v1", SESSION_KEY = "jatahin_session_v1", DAY = 864e5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CATS = [["Makan & Minum", "🍴"], ["Transportasi", "🛵"], ["Jajan/Reward", "☕"], ["Belanja Kos", "💼"], ["Tabungan", "🐷"], ["Kuliah & Tugas", "🎓"], ["Lain-lain", "•••"]];
const CAT_BADGE = { "Makan & Minum": "Makan", "Transportasi": "Transport", "Jajan/Reward": "Jajan", "Belanja Kos": "Belanja Kos", "Tabungan": "Tabungan", "Kuliah & Tugas": "Kuliah", "Lain-lain": "Lain-lain" };

const COSMETICS = {
  hat: [
    { id: "none", name: "Tanpa aksesoris", cost: 0, icon: "—" },
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
    { id: "coat", name: "Hoodie hangat", cost: 35, icon: "🤎" },
    { id: "scarf", name: "Syal hangat", cost: 17, icon: "🧣" }
  ]
};

const makeDefault = () => ({
  incomes: [],      // { id, tanggal, nominal, jenis: bulanan|tambahan, tujuan: kosong|harian|tabungan }
  wajib: [],        // { id, name, amount, paidMonth }
  transactions: [], // { id, ts, title, amount, category, sumberDana: bank|tunai, note, fromSavings }
  wishlist: [], coins: 0, streak: 0, settledUntil: null, override: null, photo: null, dayOffset: 0, // photo = foto profil (data URL)
  bear: { name: "", hat: "none", acc: "none", outfit: "none" }
});
let user = null, state = makeDefault(), draftBear = { ...state.bear }, draftWajib = [];
let activeHistoryFilter = "Semua", selectedExpPos = "Makan & Minum", selectedSource = "bank";

// "Hari ini" aplikasi = tanggal asli + dayOffset (hari yang dilompati untuk simulasi)
function appNow() { const d = new Date(); d.setDate(d.getDate() + ((state && state.dayOffset) || 0)); return d; }
const getUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch (e) { return []; } };
const putUsers = u => localStorage.setItem(USERS_KEY, JSON.stringify(u));
const dataKey = () => "jatahin_data_v1_" + user.id;
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(dataKey()));
    if (s) {
      const d = makeDefault(), st = { ...d, ...s, bear: { ...d.bear, ...s.bear } };
      // item yang sudah dihapus dari katalog (mis. data lama) dikembalikan ke "none"
      ["hat", "acc", "outfit"].forEach(sl => { if (!COSMETICS[sl].some(x => x.id === st.bear[sl])) st.bear[sl] = "none"; });
      return st;
    }
  } catch (e) {}
  return makeDefault();
}
function saveState() { if (user) try { localStorage.setItem(dataKey(), JSON.stringify(state)); } catch (e) {} }
const firstName = () => user ? user.namaLengkap.split(" ")[0] : "";

async function hashPw(pw, salt) {
  try {
    if (window.crypto && crypto.subtle) {
      const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + pw));
      return "s256:" + [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
    }
  } catch (e) {}
  let h = 5381; const s = salt + pw; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return "d33:" + (h >>> 0).toString(16);
}

// =========================================================
// HELPERS
// =========================================================
const $ = id => document.getElementById(id);
const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
const sumBy = (a, f) => a.reduce((s, x) => s + f(x), 0);
const num = id => Math.max(0, parseInt($(id).value, 10) || 0);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const formatRp = n => "Rp " + Math.max(0, Math.round(n)).toLocaleString("id-ID");
const fmtS = n => (n < 0 ? "-" : "") + formatRp(Math.abs(n));
const fmtD = (d, o) => new Date(d).toLocaleDateString("id-ID", o);
const timeOf = ts => new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".") + " WIB";
const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a, b) => startOfDay(new Date(a)).getTime() === startOfDay(new Date(b)).getTime();
const ym = d => { d = new Date(d); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };
const daysIn = d => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
const dailyPart = t => t.amount - (t.fromSavings || 0);
const isPaid = w => w.paidMonth === ym(appNow());
function showToast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(window._toastTimer); window._toastTimer = setTimeout(() => t.classList.add("hidden"), 3200);
}
function showErr(id, msg) { const e = $(id); e.textContent = msg || ""; e.classList.toggle("hidden", !msg); return false; }

// Status jatah harian: Aman <80% · Hampir habis 80–<100% · Habis =100% · Melewati batas >100%
function statusOf(spent, limit) {
  if (spent > limit) return "Melewati batas";
  if (limit > 0 && spent === limit) return "Habis";
  if (limit > 0 && spent >= limit * 0.8) return "Hampir habis";
  return "Aman";
}

// Satu sumber kebenaran. Aturan spesifikasi:
// uang bebas = pemasukan bulan ini (tanpa tabungan) − pengeluaran wajib · jatah harian = uang bebas / jumlah hari bulan itu
// sisa jatah = jatah − pengeluaran hari itu · sisa saldo = uang bebas − pengeluaran harian bulan ini
function calc(date = appNow()) {
  const m = ym(date), days = daysIn(date);
  const incomes = state.incomes.filter(i => ym(i.tanggal) === m && i.tujuan !== "tabungan");
  const totalIncome = sumBy(incomes, i => i.nominal), locked = sumBy(state.wajib, w => w.amount), free = totalIncome - locked;
  const tx = state.transactions.filter(t => ym(t.ts) === m);
  const spentMonth = sumBy(tx, dailyPart), spentToday = sumBy(tx.filter(t => sameDay(t.ts, date)), dailyPart);
  const ov = state.override && state.override.ym === m ? state.override.value : null;
  const limit = ov != null ? ov : Math.floor(Math.max(0, free) / days);
  const saving = sumBy(state.incomes.filter(i => i.tujuan === "tabungan"), i => i.nominal) - sumBy(state.transactions, t => t.fromSavings || 0);
  return { m, days, left: days - date.getDate() + 1, hasIncome: incomes.length > 0, totalIncome, locked, free, spentMonth, spentToday,
    limit, remaining: limit - spentToday, freeLeft: free - spentMonth, saving, monthTx: tx, status: statusOf(spentToday, limit) };
}

// Koin & streak (dihitung saat hari berganti):
//   jatah hari itu masih bersisa (terpakai < jatah) = +COIN_PER_DAY koin · tidak melebihi jatah = streak +1 · melebihi = streak 0 (koin tidak berkurang).
function settleDays() {
  if (!state.settledUntil) return;
  const t0 = startOfDay(appNow()), d = new Date(state.settledUntil); d.setDate(d.getDate() + 1);
  for (let n = 0; d < t0 && n < 62; n++, d.setDate(d.getDate() + 1)) {
    const k = calc(d); if (!k.hasIncome) continue;
    if (k.spentToday < k.limit) state.coins += COIN_PER_DAY;
    if (k.spentToday <= k.limit) state.streak++; else state.streak = 0;
  }
  const y = new Date(t0); y.setDate(y.getDate() - 1); state.settledUntil = y.toISOString(); saveState();
}
// =========================================================
// ASSET PNG — taruh file di folder assets/ (tanpa ubah kode) ATAU upload lewat menu profil.
//   assets/logo.png · assets/avatar.png · assets/bear.png
//   assets/hat/<id>.png · assets/acc/<id>.png · assets/outfit/<id>.png   (id = id di COSMETICS, mis. crown)
// Jika file tidak ada, gambar bawaan (SVG/emoji) dipakai. Foto profil pengguna diunggah lewat halaman Profil.
// =========================================================
const imgOk = {};
const pathOf = k => k.includes(":") ? `assets/${k.replace(":", "/")}.png` : `assets/${k}.png`;
const getImg = k => imgOk[pathOf(k)] ? pathOf(k) : null;
const probe = url => new Promise(r => { const i = new Image(); i.onload = () => r(imgOk[url] = true); i.onerror = () => r(imgOk[url] = false); i.src = url; });
function allAssetKeys() {
  const keys = ["logo", "avatar", "bear"];
  Object.keys(COSMETICS).forEach(slot => COSMETICS[slot].forEach(it => it.id !== "none" && keys.push(slot + ":" + it.id)));
  return keys;
}
async function probeAssets() { await Promise.all(allAssetKeys().map(k => probe(pathOf(k)))); renderAll(); if ($("page-avatar").classList.contains("active")) renderAvatarEditor(); }

function applyBranding() {
  const logo = getImg("logo");
  document.querySelectorAll(".brand-circle,.logo-badge").forEach(el => {
    if (el.dataset.svg === undefined) el.dataset.svg = el.innerHTML;
    el.innerHTML = logo ? `<img src="${logo}" alt="JatahIn" class="logo-img">` : el.dataset.svg;
  });
  const av = document.querySelector(".user-photo-avatar img");
  if (av) { if (!av.dataset.def) av.dataset.def = av.getAttribute("src"); av.src = state.photo || getImg("avatar") || av.dataset.def; }
  // foto profil di kartu sidebar
  const sb = document.querySelector(".profile-avatar-icon");
  if (sb) {
    if (sb.dataset.svg === undefined) sb.dataset.svg = sb.innerHTML;
    sb.innerHTML = state.photo ? `<img src="${state.photo}" alt="Foto profil" class="profile-photo-img">` : sb.dataset.svg;
  }
  // pratinjau di halaman Profil
  const pv = $("prof-photo-img"); if (pv && av) pv.src = av.src;
  const rm = $("prof-photo-remove"); if (rm) rm.classList.toggle("hidden", !state.photo);
  let ic = document.querySelector("link[rel=icon]");
  if (!ic) { ic = document.createElement("link"); ic.rel = "icon"; document.head.appendChild(ic); }
  logo ? ic.href = logo : ic.removeAttribute("href");
}


// =========================================================
// NAVIGASI & AUTH
// =========================================================
function navigateTo(pageId) {
  if (!user) return openAuth("login");
  $("auth-view").classList.add("hidden"); $("app-shell").classList.remove("hidden");
  document.querySelectorAll(".page-view").forEach(p => p.classList.remove("active"));
  const target = $("page-" + pageId); if (target) target.classList.add("active");
  document.querySelectorAll(".nav-item").forEach(b => b.classList.toggle("active", b.dataset.page === pageId));
  if (pageId === "avatar") { draftBear = { ...state.bear }; $("bear-name-input").value = draftBear.name; updateBearNamePreview(); renderAvatarEditor(); }
  if (pageId === "uang-saku") syncIncomeForm();
  if (pageId === "profil") fillProfile();
  document.querySelector(".sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
const toggleSidebar = () => document.querySelector(".sidebar").classList.toggle("open");
const toggleProfileMenu = () => $("profile-dropdown").classList.toggle("hidden");
function openAuth(mode) {
  $("profile-dropdown").classList.add("hidden"); $("app-shell").classList.add("hidden"); $("auth-view").classList.remove("hidden");
  $("login-form").classList.toggle("hidden", mode === "register"); $("register-form").classList.toggle("hidden", mode !== "register");
  showErr("login-error"); showErr("reg-error");
}
function startSession(u) {
  user = u; localStorage.setItem(SESSION_KEY, u.id); state = loadState();
  if (!state.bear.name) state.bear.name = "Beruang " + firstName();
  draftBear = { ...state.bear }; syncIncomeForm(); renderAll();
}
function resetDemoData() {
  if (!confirm("Hapus semua akun dan data JatahIn di browser ini?")) return;
  Object.keys(localStorage).filter(k => k.startsWith("jatahin_")).forEach(k => localStorage.removeItem(k));
  user = null; state = makeDefault(); draftBear = { ...state.bear }; draftWajib = [];
  document.querySelectorAll("form").forEach(f => f.reset());
  renderAll(); openAuth("login"); showToast("Data direset. Silakan daftar lagi.");
}
function logout() { localStorage.removeItem(SESSION_KEY); user = null; state = makeDefault(); openAuth("login"); }

$("to-register").addEventListener("click", e => { e.preventDefault(); openAuth("register"); });
$("to-login").addEventListener("click", e => { e.preventDefault(); openAuth("login"); });
$("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const em = $("login-email").value.trim().toLowerCase(), pw = $("login-pass").value;
  if (!em || !pw) return showErr("login-error", "Email dan password wajib diisi.");
  if (!EMAIL_RE.test(em)) return showErr("login-error", "Format email tidak valid.");
  const u = getUsers().find(x => x.email === em);
  if (!u || (await hashPw(pw, u.id)) !== u.passwordHash) return showErr("login-error", "Email atau password salah");
  showErr("login-error"); $("login-form").reset(); startSession(u);
  navigateTo(state.incomes.length ? "beranda" : "uang-saku"); // pengguna baru diarahkan mengisi pemasukan
  showToast("Selamat datang, " + firstName() + "!");
});
$("register-form").addEventListener("submit", async e => {
  e.preventDefault();
  const name = $("reg-name").value.trim(), wa = $("reg-wa").value.trim(), em = $("reg-email").value.trim().toLowerCase(), pw = $("reg-pass").value, cf = $("reg-confirm").value;
  if (!name || !wa || !em || !pw || !cf) return showErr("reg-error", "Semua kolom wajib diisi.");
  if (!/^\d+$/.test(wa)) return showErr("reg-error", "Nomor WhatsApp hanya boleh angka.");
  if (!EMAIL_RE.test(em)) return showErr("reg-error", "Format email tidak valid.");
  if (getUsers().some(u => u.email === em)) return showErr("reg-error", "Email sudah terdaftar.");
  if (pw.length < 8) return showErr("reg-error", "Password minimal 8 karakter.");
  if (pw !== cf) return showErr("reg-error", "Konfirmasi password tidak sama.");
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  putUsers([...getUsers(), { id, namaLengkap: name, noWhatsApp: wa, email: em, passwordHash: await hashPw(pw, id) }]);
  $("register-form").reset(); openAuth("login"); $("login-email").value = em;
  showToast("Akun berhasil dibuat. Silakan masuk.");
});

// Profil
function fillProfile() { $("prof-name").value = user.namaLengkap; $("prof-email").value = user.email; $("prof-wa").value = user.noWhatsApp; showErr("prof-error"); }
$("profile-form").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("prof-name").value.trim(), em = $("prof-email").value.trim().toLowerCase(), wa = $("prof-wa").value.trim();
  if (!name || !em || !wa) return showErr("prof-error", "Semua kolom wajib diisi.");
  if (!EMAIL_RE.test(em)) return showErr("prof-error", "Format email tidak valid.");
  if (!/^\d+$/.test(wa)) return showErr("prof-error", "Nomor handphone hanya boleh angka.");
  if (getUsers().some(u => u.email === em && u.id !== user.id)) return showErr("prof-error", "Email sudah dipakai akun lain.");
  user = { ...user, namaLengkap: name, email: em, noWhatsApp: wa };
  putUsers(getUsers().map(u => u.id === user.id ? user : u));
  showErr("prof-error"); renderAll(); showToast("Perubahan profil tersimpan!");
});

// Foto profil: dipotong persegi, dikecilkan 256px, disimpan di data akun (localStorage)
const PHOTO_MAX_BYTES = 5 * 1024 * 1024, PHOTO_SIZE = 256;
function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height), c = document.createElement("canvas");
      c.width = c.height = PHOTO_SIZE;
      c.getContext("2d").drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
      URL.revokeObjectURL(url); resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
    img.src = url;
  });
}
$("prof-photo-input").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = "";
  if (!f || !user) return;
  if (!f.type.startsWith("image/")) return showErr("prof-error", "File harus berupa gambar (JPG/PNG).");
  if (f.size > PHOTO_MAX_BYTES) return showErr("prof-error", "Ukuran foto maksimal 5 MB.");
  try { state.photo = await resizePhoto(f); showErr("prof-error"); saveState(); renderAll(); showToast("Foto profil diperbarui!"); }
  catch (err) { showErr("prof-error", "Foto tidak bisa dibaca. Coba file lain."); }
});
function removeProfilePhoto() { state.photo = null; saveState(); renderAll(); showToast("Foto profil dihapus."); }

// =========================================================
// RENDER
// =========================================================
function renderAll() {
  applyBranding();
  if (!user) return;
  settleDays();
  const k = calc(), now = appNow();
  const pct = k.limit > 0 ? Math.round(k.spentToday / k.limit * 100) : (k.spentToday > 0 ? 100 : 0);
  const st = k.hasIncome ? k.status : "Belum ada pemasukan";

  set("top-month", fmtD(now, { month: "long", year: "numeric" }));
  set("sim-offset-label", state.dayOffset ? `Simulasi +${state.dayOffset} hari` : "Simulasi");
  set("meta-date", `${fmtD(now, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} • Sisa ${k.left} Hari`);
  set("exp-today", fmtD(now, { weekday: "long", day: "numeric", month: "short", year: "numeric" }));
  set("sidebar-user-name", firstName()); set("hero-user-name", firstName());
  set("beranda-coins", state.coins); set("avatar-coins-display", state.coins); set("streak-val", state.streak);
  $("no-income-note").classList.toggle("hidden", k.hasIncome);

  set("sb-status-pill", k.hasIncome ? st : "—");
  $("top-status-badge").innerHTML = `<span class="dot-dark"></span> STATUS: ${st.toUpperCase()}`;
  set("daily-status-pill", "● " + st);
  set("today-status-note", k.hasIncome ? { "Aman": "Di bawah 80% jatah harian", "Hampir habis": "Mendekati batas jatah harian", "Habis": "Jatah hari ini tepat habis", "Melewati batas": "Melewati jatah harian" }[k.status] : "Isi pemasukan dulu");

  const sbPct = k.free > 0 ? Math.max(0, Math.min(100, Math.round(k.freeLeft / k.free * 100))) : 0;
  set("sb-remaining", fmtS(k.freeLeft)); set("sb-pct", `Tersisa ${sbPct}%`); set("sb-days-left", `${k.left} hari lagi`);
  $("sb-progress").style.width = sbPct + "%";

  set("daily-remaining", fmtS(k.remaining)); set("daily-target-label", formatRp(k.limit));
  $("daily-progress-fill").style.width = Math.min(100, pct) + "%";
  set("daily-used-label", `Terpakai ${pct}% (${formatRp(k.spentToday)})`); set("daily-left-pct", `Sisa ${Math.max(0, 100 - pct)}%`);

  set("free-balance-val", fmtS(k.freeLeft)); set("total-allowance-text", formatRp(k.totalIncome)); set("locked-kos-text", formatRp(k.locked));
  set("safe-until", "Aman hingga " + fmtD(new Date(now.getFullYear(), now.getMonth(), k.days), { day: "numeric", month: "long" }));
  set("safe-daily-rate", fmtS(k.freeLeft / k.left) + " / hari");
  $("beranda-bear-canvas").innerHTML = buildBearSVG(state.bear, 145);

  const today = k.monthTx.filter(t => sameDay(t.ts, now)).sort((a, b) => new Date(b.ts) - new Date(a.ts));
  set("today-tx-count", today.length + " Transaksi"); set("today-total-val", formatRp(k.spentToday)); set("today-limit-val", formatRp(k.limit));
  $("today-expense-list").innerHTML = today.length ? today.map(t => `<div class="today-item"><div><div class="today-item-title">${esc(t.title)}</div>
    <div class="today-item-meta">${CAT_BADGE[t.category] || "Lain-lain"} • ${timeOf(t.ts)}</div></div><div class="today-item-amount">-${formatRp(t.amount)}</div></div>`).join("")
    : `<div class="today-item-meta" style="padding:14px 0">Belum ada pengeluaran hari ini (Rp0).</div>`;

  const unpaid = state.wajib.filter(w => !isPaid(w));
  set("bill-count", unpaid.length ? unpaid.length + " Belum Dibayar" : "Semua Lunas");
  $("bill-list").innerHTML = state.wajib.length ? (unpaid.length ? unpaid.map(w => `<div class="today-item"><div><div class="today-item-title">${esc(w.name)}</div>
    <div class="today-item-meta">Belum dibayar</div></div><div><strong>${formatRp(w.amount)}</strong>
    <button type="button" class="btn btn-outlined-sm" onclick="togglePaid(${w.id})">Tandai dibayar</button></div></div>`).join("")
    : `<div class="today-item-meta" style="padding:14px 0">Semua tagihan bulan ini sudah dibayar ✓</div>`)
    : `<div class="today-item-meta" style="padding:14px 0">Belum ada pengeluaran wajib. Tambahkan di Input Pemasukan.</div>`;

  set("exp-vault", formatRp(k.locked)); set("exp-days-left", `${k.left} Hari Tersisa Bulan Ini`);
  set("hist-month", "📅 " + fmtD(now, { month: "long", year: "numeric" }));
  renderMandatoryList(); recalcAllowancePreview(); updateExpensePreview(); updateSimulation(); renderAlloc(); renderHistoryTable();
  $("btn-autopilot").classList.toggle("hidden", !(state.override && state.override.ym === k.m));
}
// Simulasi: lompat n hari ke depan. Hari yang terlewati langsung dihitung (koin & streak).
function skipDays(n) {
  if (!user) return;
  if (!state.settledUntil) return showToast("Isi pemasukan dulu sebelum simulasi lompat hari.");
  const c0 = state.coins, s0 = state.streak;
  state.dayOffset = (state.dayOffset || 0) + n; saveState(); renderAll();
  const gain = state.coins - c0;
  showToast(`Lompat ${n} hari → ${fmtD(appNow(), { day: "numeric", month: "long" })}. Koin ${gain >= 0 ? "+" : ""}${gain}, streak ${s0} → ${state.streak}.`);
}
function togglePaid(id) { const w = state.wajib.find(x => x.id === id); if (w) { w.paidMonth = isPaid(w) ? null : ym(appNow()); saveState(); renderAll(); } }
function addTx(title, amount, category, note, sumber = "bank", fromSavings = 0) {
  state.transactions.unshift({ id: Date.now(), ts: appNow().toISOString(), title, amount, category, sumberDana: sumber, note, fromSavings });
}

// =========================================================
// INPUT PENGELUARAN
// =========================================================
function renderPosGrid() {
  $("exp-pos-grid").innerHTML = CATS.map(([c, ic]) => `<button type="button" class="pos-btn ${c === selectedExpPos ? "active" : ""}" data-cat="${c}" onclick="selectExpensePos(this)">${ic} ${c}</button>`).join("");
  $("sim-category").innerHTML = CATS.map(([c, ic]) => `<option value="${c}">${ic} ${c}</option>`).join("");
}
function quickAddExpense(title, amount, category) { addTx(title, amount, category, "Shortcut Cepat"); saveState(); renderAll(); expenseToast(amount); }
function expenseToast(amount) {
  const k = calc(); showToast(k.status === "Melewati batas" ? `⚠ Pengeluaran ${formatRp(amount)} tersimpan, jatah hari ini terlewati!` : `Pengeluaran ${formatRp(amount)} tersimpan. Status: ${k.status}`);
}
function setExpensePreset(val, btn) {
  $("exp-amount").value = val; document.querySelectorAll("#page-catat-pengeluaran .preset-chip").forEach(c => c.classList.remove("active"));
  if (btn) btn.classList.add("active"); updateExpensePreview();
}
function selectExpensePos(btn) { document.querySelectorAll(".pos-btn").forEach(b => b.classList.remove("active")); btn.classList.add("active"); selectedExpPos = btn.dataset.cat; }
function selectPayMethod(btn, m) { document.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active")); btn.classList.add("active"); selectedSource = m; }
function updateExpensePreview() {
  const k = calc(), v = num("exp-amount"), after = k.remaining - v, st = statusOf(k.spentToday + v, k.limit);
  const pct = k.limit > 0 ? Math.min(100, (k.spentToday + v) / k.limit * 100) : (k.spentToday + v > 0 ? 100 : 0);
  set("exp-prev-daily", fmtS(k.remaining)); set("exp-after-daily", fmtS(after));
  $("exp-impact-bar").style.width = pct.toFixed(1) + "%";
  set("exp-impact-used", `Terpakai: ${formatRp(k.spentToday + v)} (${pct.toFixed(0)}%)`); set("exp-impact-left", `Sisa: ${fmtS(after)}`);
  $("exp-impact-advice").innerHTML = { "Aman": "✅ Status: <strong>Aman</strong>, masih di bawah 80% jatah hari ini.", "Hampir habis": "⚠️ Status: <strong>Hampir habis</strong>, hemat di transaksi berikutnya ya.",
    "Habis": "⚠️ Status: <strong>Habis</strong>, jatah hari ini tepat terpakai semua.", "Melewati batas": "🚨 Status: <strong>Melewati batas</strong>. Tetap bisa disimpan, tapi jatah hari ini terlewati." }[st];
}
$("exp-amount").addEventListener("input", updateExpensePreview);
$("expense-form").addEventListener("submit", e => {
  e.preventDefault();
  const amount = num("exp-amount"), title = $("exp-title").value.trim();
  if (amount <= 0) return showToast("Nominal harus lebih dari 0.");
  if (!title) return showToast("Nama pengeluaran wajib diisi.");
  addTx(title, amount, selectedExpPos, $("exp-note").value.trim(), selectedSource); saveState();
  $("expense-form").reset(); document.querySelectorAll("#page-catat-pengeluaran .preset-chip").forEach(c => c.classList.remove("active"));
  renderAll(); navigateTo("beranda"); expenseToast(amount);
});

// =========================================================
// INPUT PEMASUKAN
// =========================================================
function syncIncomeForm() {
  draftWajib = state.wajib.map(w => ({ ...w })); $("allowance-input").value = ""; $("inc-type").value = "bulanan"; $("inc-purpose").value = "harian";
  $("inc-purpose-wrap").classList.add("hidden"); renderMandatoryList(); recalcAllowancePreview();
}
function toggleIncType() { $("inc-purpose-wrap").classList.toggle("hidden", $("inc-type").value !== "tambahan"); recalcAllowancePreview(); }
function renderMandatoryList() {
  $("mandatory-list").innerHTML = draftWajib.length ? draftWajib.map(i => `<div class="mandatory-item"><div class="mandatory-left"><div>
    <div class="mandatory-name">${esc(i.name)}</div><div class="mandatory-due">Wajib bulanan</div></div></div>
    <div class="mandatory-amount">${formatRp(i.amount)}</div><button type="button" class="clear-x" title="Hapus" onclick="removeMandatory(${i.id})">✕</button></div>`).join("")
    : `<div class="mandatory-due" style="padding:8px 0">Belum ada item. Contoh: kos, paket data, galon, tabungan.</div>`;
}
function removeMandatory(id) { draftWajib = draftWajib.filter(w => w.id !== id); renderMandatoryList(); recalcAllowancePreview(); }
function addMandatoryItem() {
  const name = $("new-mandatory-name").value.trim(), amount = num("new-mandatory-amount");
  if (!name || amount <= 0) return showToast("Isi nama dan nominal (lebih dari 0) dulu ya!");
  draftWajib.push({ id: Date.now(), name, amount, paidMonth: null });
  $("new-mandatory-name").value = ""; $("new-mandatory-amount").value = ""; renderMandatoryList(); recalcAllowancePreview();
}
function addAllowance(d) { $("allowance-input").value = num("allowance-input") + d; recalcAllowancePreview(); }
function resetAllowanceInput() { syncIncomeForm(); }
function recalcAllowancePreview() {
  if (!user) return;
  const k = calc(), counts = $("inc-type").value === "bulanan" || $("inc-purpose").value === "harian";
  const total = k.totalIncome + (counts ? num("allowance-input") : 0), locked = sumBy(draftWajib, w => w.amount), free = total - locked, days = daysIn(appNow());
  set("mandatory-total-label", formatRp(locked)); set("prev-total-allowance", formatRp(total)); set("prev-locked-kos", "- " + formatRp(locked));
  set("prev-free-allowance", fmtS(free)); set("prev-smart-daily", formatRp(Math.max(0, free) / days));
  set("prev-formula-text", `${fmtS(free)} ÷ ${days} Hari = Jatah aman jajan harian`);
  const over = locked > total; showErr("inc-warn", over ? "⚠ Total pengeluaran wajib melebihi total pemasukan." : ""); return over;
}
function saveAllowanceSettings() {
  const nominal = num("allowance-input"), type = $("inc-type").value;
  if (nominal <= 0 && !state.incomes.length) return showToast("Nominal pemasukan wajib lebih dari 0.");
  if (recalcAllowancePreview()) return showToast("Pengeluaran wajib melebihi pemasukan, perbaiki dulu.");
  if (nominal > 0) {
    state.incomes.push({ id: Date.now(), tanggal: appNow().toISOString(), nominal, jenis: type, tujuan: type === "bulanan" ? "kosong" : $("inc-purpose").value });
    if (!state.settledUntil) { const y = startOfDay(appNow()); y.setDate(y.getDate() - 1); state.settledUntil = y.toISOString(); }
  }
  state.wajib = draftWajib.map(w => ({ ...w })); state.override = null; saveState(); renderAll(); navigateTo("beranda"); showToast("Pemasukan tersimpan!");
}

// =========================================================
// SIMULASI & CEK SEBELUM BELI
// =========================================================
function adjustSimPrice(val, isAdd) { $("sim-item-price").value = isAdd ? num("sim-item-price") + val : val; updateSimulation(); }
function simCalc() {
  const k = calc(), price = num("sim-item-price"), dailyUse = Math.max(0, Math.min(price, k.remaining)), fromSav = price - dailyUse;
  return { k, price, dailyUse, fromSav, usable: k.saving + k.remaining - price, ok: price > 0 && fromSav <= k.saving };
}
function updateSimulation() {
  if (!user) return;
  const { k, price, dailyUse, fromSav, usable, ok } = simCalc();
  set("sim-days", `${k.left} Hari Tersisa bulan ini`); set("sim-proj", "Proyeksi uang bebas sampai akhir bulan");
  const box = (l, a, b) => `<div class="sim-box"><div class="sim-box-label">${l}</div><div class="sim-box-val" style="font-size:15px">${a} → ${b}</div></div>`;
  $("sim-compare").innerHTML = box("Tabungan", formatRp(k.saving), formatRp(k.saving - fromSav)) + box("Sisa jatah hari ini", fmtS(k.remaining), fmtS(k.remaining - dailyUse)) + box("Jatah harian", formatRp(k.limit), formatRp(k.limit));
  set("sim-usable", price > 0 ? `Sisa uang yang bisa dipakai hari ini: ${fmtS(usable)} (tabungan + sisa jatah − harga)` : "Isi harga barang untuk melihat dampaknya.");
  set("sim-load-badge", price <= 0 ? "—" : !ok ? "🚨 Tidak cukup" : price <= k.remaining ? "✅ Aman" : "⚠ Pakai tabungan");
  $("btn-buy").disabled = !ok;
  // 6b: sisa uang = uang bebas tersisa − harga; jatah baru = sisa uang / sisa hari
  const bal = k.freeLeft - price, newLimit = Math.max(0, Math.floor(bal / k.left)), canApply = price > 0 && price <= k.freeLeft;
  set("curve-real-balance", fmtS(bal)); set("curve-critical-date", formatRp(k.limit)); set("curve-safe-rec", formatRp(newLimit));
  set("curve-avg", "per hari"); set("curve-critical-foot", "sebelum membeli"); set("curve-new-foot", `selama ${k.left} hari`);
  set("sim-advice", price <= 0 ? "Isi harga barang dulu." : !canApply ? "⚠ Harga melebihi saldo bebas bulan ini. Penerapan dinonaktifkan." :
    `Jika dibeli, jatah harian ${newLimit < k.limit ? "turun" : "menjadi"} dari ${formatRp(k.limit)} ke ${formatRp(newLimit)} per hari (sisa ${k.left} hari).`);
  $("btn-apply").disabled = !canApply;
  const top = Math.max(k.freeLeft, 1), y = v => 105 - Math.max(0, Math.min(1, v / top)) * 80;
  $("curve-safe-path").setAttribute("d", `M 20 ${y(k.freeLeft)} L 340 105`); $("curve-impulsive-path").setAttribute("d", `M 20 ${y(bal)} L 340 105`);
  $("curve-dot").setAttribute("cy", y(bal));
  set("curve-l1", fmtD(appNow(), { day: "numeric", month: "short" })); set("curve-l2", ""); set("curve-l3", fmtD(new Date(k.days && appNow().getFullYear(), appNow().getMonth(), k.days), { day: "numeric", month: "short" }));
  renderWishlist();
}
function saveToWishlist() {
  const name = $("sim-item-name").value.trim(), price = num("sim-item-price");
  if (!name || price <= 0) return showToast("Isi nama barang dan harganya dulu ya!");
  state.wishlist.push({ id: Date.now(), name, price, ts: appNow().toISOString() }); saveState(); renderAll(); showToast(`"${name}" masuk daftar tunda.`);
}
function removeWish(id) { state.wishlist = state.wishlist.filter(w => w.id !== id); saveState(); renderWishlist(); }
function renderWishlist() {
  $("wishlist-section").classList.toggle("hidden", !state.wishlist.length);
  $("wishlist-items").innerHTML = state.wishlist.map(w => `<div class="wishlist-row"><span><strong>${esc(w.name)}</strong> — ${formatRp(w.price)}</span>
    <button type="button" class="clear-x" onclick="removeWish(${w.id})">✕</button></div>`).join("");
}
function buyAndAdjust() {
  const name = $("sim-item-name").value.trim(), { price, fromSav, ok } = simCalc();
  if (!name || price <= 0) return showToast("Isi nama barang dan harganya dulu ya!");
  if (!ok) return showToast("Tabungan dan sisa jatah tidak cukup.");
  addTx(name, price, $("sim-category").value, "Via Cek Beli", "bank", fromSav); saveState(); cancelSim(); renderAll(); navigateTo("riwayat"); showToast("Pembelian dicatat, tabungan & jatah disesuaikan.");
}
function applySafeDailyLimit() {
  const { k, price } = simCalc(); if (price <= 0 || price > k.freeLeft) return;
  state.override = { ym: k.m, value: Math.max(0, Math.floor((k.freeLeft - price) / k.left)) }; saveState(); cancelSim(); renderAll();
  showToast(`Jatah harian baru ${formatRp(state.override.value)} diterapkan di Beranda.`);
}
function cancelSim() { $("sim-item-name").value = ""; $("sim-item-price").value = ""; document.querySelectorAll("#page-simulasi .preset-chip").forEach(c => c.classList.remove("active")); updateSimulation(); }
function resetToAutopilot() { state.override = null; saveState(); renderAll(); showToast("Kembali ke jatah harian otomatis."); }

// =========================================================
// RIWAYAT & ALOKASI
// =========================================================
function renderAlloc() {
  const k = calc(), paid = state.wajib.filter(isPaid), unpaid = state.wajib.filter(w => !isPaid(w));
  set("riwayat-plafon-val", formatRp(k.limit) + " / hari"); set("alloc-paid", formatRp(sumBy(paid, w => w.amount))); set("alloc-unpaid", formatRp(sumBy(unpaid, w => w.amount)));
  $("alloc-list").innerHTML = state.wajib.length ? state.wajib.map(w => `<div class="mandatory-item"><div class="mandatory-left"><div><div class="mandatory-name">${esc(w.name)}</div>
    <div class="mandatory-due">${isPaid(w) ? "✓ Sudah dibayar" : "Belum dibayar"}</div></div></div><div class="mandatory-amount">${formatRp(w.amount)}</div>
    <button type="button" class="btn btn-outlined-sm" onclick="togglePaid(${w.id})">${isPaid(w) ? "Batalkan" : "Tandai dibayar"}</button></div>`).join("")
    : `<div class="mandatory-due">Belum ada pengeluaran wajib.</div>`;
}
function renderFilterTabs() {
  $("history-filter-tabs").innerHTML = ["Semua", ...CATS.map(c => c[0])].map(c => `<button type="button" class="filter-pill ${c === activeHistoryFilter ? "active" : ""}" data-cat="${c}" onclick="setHistoryFilter('${c}', this)">${c}</button>`).join("");
}
function setHistoryFilter(cat, btn) { activeHistoryFilter = cat; document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active")); btn.classList.add("active"); renderHistoryTable(); }
function deleteTx(id) { state.transactions = state.transactions.filter(t => t.id !== id); saveState(); renderAll(); showToast("Transaksi dihapus."); }
function renderHistoryTable() {
  const k = calc(), q = ($("history-search").value || "").toLowerCase();
  const rows = k.monthTx.slice().sort((a, b) => new Date(b.ts) - new Date(a.ts));
  const filtered = rows.filter(t => (activeHistoryFilter === "Semua" || t.category === activeHistoryFilter) && (t.title + " " + t.note + " " + t.category).toLowerCase().includes(q));
  $("history-table-body").innerHTML = filtered.length ? filtered.map(t => {
    const st = statusOf(sumBy(rows.filter(r => sameDay(r.ts, t.ts)), dailyPart), k.limit);
    return `<tr><td><strong>${fmtD(t.ts, { day: "2-digit", month: "short", year: "numeric" })}</strong><br/><span class="sub-xs">${timeOf(t.ts)}</span></td>
      <td><div class="tx-title-cell"><span class="tx-icon-pill">🧾</span><span>${esc(t.title)}</span></div></td><td><span class="cat-badge">${esc(t.category)}</span></td>
      <td class="sub-xs">${esc(t.note || "-")}</td><td><strong class="text-primary">-${formatRp(t.amount)}</strong></td>
      <td><span class="${st === "Aman" ? "status-pill-ok" : "status-pill-warn"}">${st}</span><button type="button" class="clear-x" title="Hapus" onclick="deleteTx(${t.id})">✕</button></td></tr>`;
  }).join("") : `<tr><td colspan="6" style="text-align:center;padding:28px;color:#64748B">Belum ada transaksi.</td></tr>`;
  set("riwayat-month-total", formatRp(sumBy(rows, t => t.amount))); set("riwayat-month-left", fmtS(k.freeLeft));
  set("tsf-sub", k.hasIncome ? `${k.free > 0 ? Math.round(k.spentMonth / k.free * 100) : 0}% dari uang bebas bulan ini sudah terpakai.` : "Belum ada pemasukan bulan ini.");
}

// =========================================================
// BEAR SVG (gambar bawaan + overlay PNG)
// =========================================================
const BOX = { hat: [34, 0, 52, 34], acc: [78, 48, 36, 46], outfit: [30, 50, 60, 45], bear: [12, 4, 96, 104] }; // x,y,w,h dalam viewBox 120x115
function pngLayer(slot, id) {
  if (!id || id === "none") return "";
  const u = getImg(slot + ":" + id); if (!u) return "";
  const [x, y, w, h] = BOX[slot];
  return `<image href="${u}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
}
function buildBearSVG(bearConfig, size = 140) {
  const bu = getImg("bear"), baseImg = bu ? `<image href="${bu}" x="${BOX.bear[0]}" y="${BOX.bear[1]}" width="${BOX.bear[2]}" height="${BOX.bear[3]}" preserveAspectRatio="xMidYMid meet"/>` : "";
  const L = s => pngLayer(s, bearConfig[s]);
  const hatSvg = {
    none: "",
    duck: `<ellipse cx="60" cy="15" rx="11" ry="8" fill="#FACC15" stroke="#422006" stroke-width="2"/><circle cx="64" cy="13" r="1.5" fill="#1E293B"/><polygon points="70,15 76,17 70,19" fill="#F97316"/>`,
    flower: `<circle cx="42" cy="24" r="7" fill="#FFFFFF" stroke="#422006" stroke-width="1.5"/><circle cx="42" cy="24" r="3" fill="#FACC15"/>`,
    ribbon: `<polygon points="60,18 47,11 47,25" fill="#EF4444" stroke="#450A0A" stroke-width="1.8"/><polygon points="60,18 73,11 73,25" fill="#EF4444" stroke="#450A0A" stroke-width="1.8"/><circle cx="60" cy="18" r="3.5" fill="#FCA5A5" stroke="#450A0A" stroke-width="1.5"/>`,
    crown: `<polygon points="46,21 49,10 55,16 60,8 65,16 71,10 74,21" fill="#FACC15" stroke="#713F12" stroke-width="2"/>`
  }[bearConfig.hat] || "";

  const outfitSvg = {
    none: "",
    coat: `<rect x="42" y="63" width="36" height="28" rx="8" fill="#78350F" stroke="#271104" stroke-width="2.5"/><line x1="60" y1="63" x2="60" y2="91" stroke="#FDE68A" stroke-width="2"/>`,
    scarf: `<rect x="44" y="59" width="32" height="9" rx="4" fill="#DC2626" stroke="#450A0A" stroke-width="2"/><rect x="62" y="66" width="8" height="16" rx="3" fill="#DC2626" stroke="#450A0A" stroke-width="2"/>`
  }[bearConfig.outfit] || "";

  const accSvg = {
    none: "",
    wand: `<line x1="84" y1="84" x2="98" y2="54" stroke="#78350F" stroke-width="3.5" stroke-linecap="round"/><polygon points="98,46 100,52 106,52 101,56 103,62 98,58 93,62 95,56 90,52 96,52" fill="#FACC15" stroke="#854D0E" stroke-width="1.5"/>`,
    plush: `<circle cx="90" cy="76" r="10" fill="#B47B56" stroke="#3E2314" stroke-width="2"/><circle cx="84" cy="68" r="3.5" fill="#B47B56" stroke="#3E2314" stroke-width="1.5"/><circle cx="96" cy="68" r="3.5" fill="#B47B56" stroke="#3E2314" stroke-width="1.5"/>`,
    boba: `<rect x="83" y="64" width="14" height="20" rx="3" fill="#FDE68A" stroke="#451A03" stroke-width="2"/><line x1="90" y1="56" x2="90" y2="66" stroke="#042C8F" stroke-width="3"/><circle cx="87" cy="80" r="1.5" fill="#1E293B"/><circle cx="92" cy="79" r="1.5" fill="#1E293B"/>`,
    fish: `<ellipse cx="90" cy="75" rx="11" ry="6" fill="#4891E7" stroke="#042C8F" stroke-width="2"/><polygon points="100,75 107,69 107,81" fill="#4891E7" stroke="#042C8F" stroke-width="2"/>`,
    carrot: `<polygon points="84,84 98,62 104,68" fill="#F97316" stroke="#7C2D12" stroke-width="2"/><path d="M100 63 L106 56 M102 66 L109 62" stroke="#65A30D" stroke-width="2.5"/>`
  }[bearConfig.acc] || "";

  const hatOverlay = L("hat") || (getImg("hat:"+bearConfig.hat) ? "" : hatSvg), outfitOverlay = L("outfit") || (getImg("outfit:"+bearConfig.outfit) ? "" : outfitSvg), accOverlay = L("acc") || (getImg("acc:"+bearConfig.acc) ? "" : accSvg);
  return `
    <svg viewBox="0 0 120 115" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      ${baseImg || `<!-- Ears -->
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
`}
      ${outfitOverlay}
      ${baseImg ? "" : `<!-- Head -->
      <rect x="33" y="21" width="54" height="42" rx="19" fill="#A46B49" stroke="#3E2314" stroke-width="3"/>
      <!-- Eyes & Cheeks -->
      <circle cx="47" cy="41" r="3" fill="#2A160C"/>
      <circle cx="73" cy="41" r="3" fill="#2A160C"/>
      <ellipse cx="42" cy="46" rx="4.5" ry="2.5" fill="#F4978E" opacity="0.8"/>
      <ellipse cx="78" cy="46" rx="4.5" ry="2.5" fill="#F4978E" opacity="0.8"/>
      <!-- Muzzle -->
      <ellipse cx="60" cy="47" rx="10" ry="8" fill="#F5DFCE"/>
      <ellipse cx="60" cy="44" rx="3.2" ry="2.2" fill="#2A160C"/>
      <path d="M57 49 Q60 52 63 49" fill="none" stroke="#2A160C" stroke-width="2" stroke-linecap="round"/>`}
      ${hatOverlay}
      ${accOverlay}
    </svg>
  `;
}

// =========================================================
// AVATAR EDITOR
// =========================================================
function updateBearNamePreview() {
  const v = $("bear-name-input").value; draftBear.name = v;
  set("preview-bear-name", v || "Beruang " + firstName()); set("bear-name-count", `${v.length}/20`);
}
function getSelectedCosmeticCost() {
  return ["hat", "acc", "outfit"].reduce((s, slot) => s + (draftBear[slot] !== state.bear[slot] ? (COSMETICS[slot].find(x => x.id === draftBear[slot]) || { cost: 0 }).cost : 0), 0);
}
function selectCosmetic(slot, id) { draftBear[slot] = id; renderAvatarEditor(); }
function renderAvatarEditor() {
  $("editor-bear-canvas").innerHTML = buildBearSVG(draftBear, 175);
  ["hat", "acc", "outfit"].forEach(slot => {
    $("grid-" + slot).innerHTML = COSMETICS[slot].map(item => {
      const key = slot + ":" + item.id, u = item.id !== "none" && getImg(key);
      const tools = "";
      return `<div class="cosmetic-item ${draftBear[slot] === item.id ? "selected" : ""}" onclick="selectCosmetic('${slot}','${item.id}')">
        ${tools}<div class="cosmetic-box">${u ? `<img class="cosmetic-img" src="${u}" alt="">` : item.icon}</div>
        <div class="cosmetic-name">${item.name}</div>${item.cost ? `<span class="cosmetic-cost">${item.cost} Koin</span>` : ""}</div>`;
    }).join("");
  });
  const cost = getSelectedCosmeticCost(), rem = state.coins - cost;
  set("avatar-selected-cost", cost);
  set("avatar-coin-status", rem >= 0 ? `Sisa koinmu ${rem}. Siap menemani hari-harimu!` : `Koin kurang ${-rem} lagi! Catat pengeluaran hemat untuk dapat koin.`);
}
function saveAvatarCustomization() {
  // item yang sudah dimiliki (tersimpan) tidak ditagih ulang
  const cost = getSelectedCosmeticCost();
  if (cost > state.coins) return showToast("Koin belum cukup untuk kombinasi item ini!");
  state.coins -= cost; state.bear = { ...draftBear, name: draftBear.name.trim() || "Beruang " + firstName() };
  saveState(); renderAll(); navigateTo("beranda"); showToast(`Tampilan ${state.bear.name} berhasil disimpan!`);
}


// =========================================================
// INIT
// =========================================================
document.addEventListener("visibilitychange", () => { if (!document.hidden && user) renderAll(); });
renderPosGrid(); renderFilterTabs();
(() => {
  const u = getUsers().find(x => x.id === localStorage.getItem(SESSION_KEY));
  if (u) { startSession(u); navigateTo("beranda"); } else openAuth("login");
})();
probeAssets();
