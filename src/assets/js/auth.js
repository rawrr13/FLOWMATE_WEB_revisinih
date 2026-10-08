/** FLOWMATE - Login, sesi, profil. Peran ditentukan otomatis dari akun (tanpa pilihan role). */
let captchaAnswer = 0, failCount = 0, lockUntil = 0;

function generateCaptcha() {
    const a = Math.floor(Math.random() * 15) + 1;          // 1..15
    const b = Math.floor(Math.random() * (20 - a)) + 1;    // a + b <= 20
    captchaAnswer = a + b;
    const el = $('captcha-question'); if (el) el.textContent = `${a} + ${b} = ?`;
}
function getCurrentUser() { const s = DB.session(); return s ? DB.user(s.username) : null; }
function togglePwd(id, btn) { const i = $(id); i.type = i.type === 'password' ? 'text' : 'password'; btn.textContent = i.type === 'password' ? 'Lihat' : 'Sembunyi'; }

function openLoginModal() {
    generateCaptcha();
    const m = $('login-modal'); m.classList.remove('hidden'); m.classList.add('flex');
    $('login-error').classList.add('hidden'); $('login-captcha').value = '';
    setTimeout(() => $('login-username').focus(), 50);
}
function closeLoginModal() { const m = $('login-modal'); m.classList.add('hidden'); m.classList.remove('flex'); }
function loginError(msg) { const e = $('login-error'); e.textContent = msg; e.classList.remove('hidden'); }

async function handleLoginSubmit(e) {
    e.preventDefault();
    if (Date.now() < lockUntil) return loginError(`Terlalu banyak percobaan. Coba lagi dalam ${Math.ceil((lockUntil - Date.now()) / 1000)} detik.`);
    if (parseInt($('login-captcha').value, 10) !== captchaAnswer) { generateCaptcha(); $('login-captcha').value = ''; return loginError('Jawaban verifikasi salah. Silakan coba lagi.'); }
    const user = DB.user($('login-username').value);
    const ok = user && user.pwdHash === await hashPwd($('login-password').value);
    if (!ok) {
        failCount++; generateCaptcha(); $('login-captcha').value = '';
        if (failCount >= 5) { lockUntil = Date.now() + 30000; failCount = 0; return loginError('Terlalu banyak percobaan. Tunggu 30 detik.'); }
        return loginError('Username atau kata sandi salah.');
    }
    failCount = 0;
    DB.setSession(user.username);
    $('login-password').value = ''; closeLoginModal(); updateUserUI();
    navigateTo(homeFor(user));
}
const homeFor = u => (u && isAdminRole(u.role)) ? 'dashboard_admin' : (u ? 'beranda' : 'landing');
function goHome() { navigateTo(homeFor(getCurrentUser())); }
function logoutUser() { DB.clearSession(); toggleFloatingBot(false); updateUserUI(); navigateTo('landing'); }

/* ---------- Profil ---------- */
function openProfileModal() {
    const u = getCurrentUser(); if (!u) return;
    const roleLabel = { pasien: 'Pasien', admin: 'Admin', superadmin: 'Super Admin' }[u.role];
    const row = (l, v) => `<div class="p-3 bg-slate-50 rounded-2xl border border-slate-100"><p class="text-[10px] text-slate-400 font-bold uppercase">${l}</p><p class="font-bold text-slate-800 text-sm">${v}</p></div>`;
    document.body.insertAdjacentHTML('beforeend', `
    <div id="profile-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-3 animate-fade-in my-auto">
        <div class="flex justify-between items-center border-b pb-3">
          <h3 class="font-extrabold text-slate-800 text-sm">👤 Informasi Profil</h3>
          <button onclick="closeProfileModal()" class="text-slate-400 hover:text-slate-600">✕</button>
        </div>
        <div class="space-y-2 text-xs text-slate-700">
          ${row('Nama lengkap', esc(u.nama))}${row('Username', esc(u.username))}${row('Peran', roleLabel)}${row('Tanggal registrasi', fmtDate(u.registerDate))}
          <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <p class="text-[10px] text-slate-400 font-bold uppercase">Nomor telepon <span class="normal-case font-medium">(opsional)</span></p>
            <input id="profile-phone" type="tel" value="${esc(u.phone || '')}" placeholder="Contoh: 0812xxxxxxx" class="mt-1 w-full text-sm font-bold bg-transparent focus:outline-none">
          </div>
          <div class="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <p class="text-[10px] text-slate-400 font-bold uppercase">Kata sandi</p>
            <div class="flex justify-between items-center"><p class="font-bold text-slate-800 text-sm">••••••••</p>
            <button onclick="$('pwd-change').classList.toggle('hidden')" class="text-[11px] font-bold text-brand-600">Ubah</button></div>
            <div id="pwd-change" class="hidden mt-2 space-y-2">
              <input id="pwd-old" type="password" placeholder="Kata sandi lama" class="w-full text-xs p-2.5 rounded-xl border border-slate-200">
              <input id="pwd-new" type="password" placeholder="Kata sandi baru (min. 6 karakter)" class="w-full text-xs p-2.5 rounded-xl border border-slate-200">
            </div>
          </div>
        </div>
        <p id="profile-msg" class="hidden text-xs font-semibold rounded-xl p-2.5"></p>
        <div class="grid grid-cols-2 gap-2">
          <button onclick="closeProfileModal()" class="bg-slate-100 text-slate-700 font-bold text-xs py-2.5 rounded-xl">Tutup</button>
          <button onclick="saveProfile()" class="bg-brand-600 text-white font-bold text-xs py-2.5 rounded-xl">Simpan</button>
        </div>
      </div>
    </div>`);
}
function closeProfileModal() { const m = $('profile-modal'); if (m) m.remove(); }
async function saveProfile() {
    const users = DB.users(), u = getCurrentUser(), me = users.find(x => x.username === u.username), msg = $('profile-msg');
    const show = (t, ok) => { msg.textContent = t; msg.className = `text-xs font-semibold rounded-xl p-2.5 ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`; };
    const phone = $('profile-phone').value.trim();
    if (phone && !/^[0-9+\-\s]{8,16}$/.test(phone)) return show('Nomor telepon tidak valid.', false);
    me.phone = phone;
    const np = $('pwd-new').value;
    if (np || $('pwd-old').value) {
        if (me.pwdHash !== await hashPwd($('pwd-old').value)) return show('Kata sandi lama salah.', false);
        if (np.length < 6) return show('Kata sandi baru minimal 6 karakter.', false);
        me.pwdHash = await hashPwd(np);
    }
    DB.saveUsers(users); show('Profil tersimpan ✓', true);
}

/* ---------- Navigasi sesuai peran ---------- */
const NAV = {
    guest: [['landing', 'Tentang FLOWMATE'], ['#panduan', 'Panduan Layanan']],
    pasien: [['beranda', '🌸 Beranda'], ['walidd_screening', '🩸 Skrining WaLIDD'], ['rekomendasi', '✨ Intervensi'], ['catatan_harian', '📊 Jurnal Harian']],
    admin: [['dashboard_admin', '📊 Overview System'], ['intervensi_akun', '🛡️ Kelola User']],
};
function navButton([target, label], mobile) {
    const act = target.startsWith('#') ? `goPanduan()` : `navigateTo('${target}')`;
    return `<button data-nav="${target}" onclick="${act}" class="${mobile ? 'whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100' : ''} hover:text-brand-600 transition">${label}</button>`;
}
function updateUserUI() {
    const user = getCurrentUser();
    const role = !user ? 'guest' : (isAdminRole(user.role) ? 'admin' : 'pasien');
    $('main-nav').innerHTML = NAV[role].map(n => navButton(n)).join('');
    $('mobile-nav').innerHTML = NAV[role].map(n => navButton(n, true)).join('');

    // Bot hanya untuk pasien yang login
    const fab = $('floating-ai-btn');
    fab.classList.toggle('hidden', role !== 'pasien'); fab.classList.toggle('flex', role === 'pasien');
    if (role !== 'pasien') $('floating-fembot-widget').classList.add('hidden');

    $('auth-nav-action').innerHTML = user ? `
        <button onclick="openProfileModal()" class="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-full border border-rose-200 transition">
            <span class="text-base">🌸</span>
            <span class="text-left text-xs"><span class="block font-bold text-slate-800 leading-none max-w-[110px] truncate">${esc(user.nama)}</span>
            <span class="block text-[10px] text-brand-600 leading-none mt-0.5 font-bold">${{ pasien: 'Pasien', admin: 'Admin', superadmin: 'Super Admin' }[user.role]}</span></span>
        </button>
        <button onclick="logoutUser()" class="text-xs text-slate-500 hover:text-brand-600 font-bold">Keluar</button>` : `
        <button onclick="openLoginModal()" class="text-xs font-bold text-slate-700 hover:text-brand-600 px-3 py-2 transition">Masuk</button>
        <button onclick="openLoginModal()" class="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 sm:px-5 py-2.5 rounded-full shadow-md transition">Mulai Skrining</button>`;
}
