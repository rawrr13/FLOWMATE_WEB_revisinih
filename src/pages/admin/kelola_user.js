/** FLOWMATE - Admin / Super Admin: Kelola pengguna (admin & pasien dipisah). Super admin tidak ditampilkan. */
function renderKelolaUserAdmin() { return `<div id="ku-root" class="max-w-6xl mx-auto py-8 px-4 space-y-6 animate-fade-in">${kuBody()}</div>`; }
function kuRefresh() { $('ku-root').innerHTML = kuBody(); }

function kuBody() {
    const me = getCurrentUser(), users = DB.users(), admins = users.filter(u => u.role === 'admin'), pas = users.filter(u => u.role === 'pasien');
    const del = u => u.username === me.username ? '' : `<button onclick="kuDelete('${esc(u.username)}')" class="text-rose-600 hover:underline font-bold">Hapus</button>`;
    const reset = u => `<button onclick="kuReset('${esc(u.username)}')" class="text-brand-600 hover:underline font-bold mr-3">Reset sandi</button>`;
    return `
    <div class="border-b border-slate-200 pb-5 flex justify-between items-center flex-wrap gap-4">
      <div><h2 class="text-2xl font-extrabold text-slate-900">🛡️ Kelola Pengguna & Akun</h2><p class="text-xs text-slate-500 mt-1">Informasi admin dan pasien ditampilkan terpisah.</p></div>
      <button onclick="kuModal(true)" class="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition">+ Tambah Akun Baru</button>
    </div>

    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3"><h3 class="font-extrabold text-slate-800 text-sm">⚙️ Informasi Admin</h3>
      <div class="overflow-x-auto">${admins.length ? `<table class="w-full text-left text-xs"><thead class="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]"><tr><th class="p-3">Username</th><th class="p-3">Password</th><th class="p-3">Tanggal Register</th><th class="p-3">Aksi</th></tr></thead><tbody class="divide-y divide-slate-100">
        ${admins.map(u => `<tr><td class="p-3 font-bold">${esc(u.username)}</td><td class="p-3 tracking-widest text-slate-400">••••••••</td><td class="p-3">${fmtDate(u.registerDate)}</td><td class="p-3 whitespace-nowrap">${reset(u)}${del(u)}</td></tr>`).join('')}</tbody></table>` : '<p class="text-xs text-slate-400 py-3">Belum ada akun admin.</p>'}</div></div>

    <div class="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-3"><div class="flex justify-between items-center flex-wrap gap-2"><h3 class="font-extrabold text-slate-800 text-sm">🌸 Informasi Pasien</h3>
      <button onclick="downloadExcelRekap()" class="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100">📊 Unduh rekap Excel</button></div>
      <div class="overflow-x-auto">${pas.length ? `<table class="w-full text-left text-xs"><thead class="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]"><tr><th class="p-3">Username</th><th class="p-3">Nama Lengkap</th><th class="p-3">No. Telepon</th><th class="p-3">Password</th><th class="p-3">Hasil Skrining Terakhir</th><th class="p-3">Aksi</th></tr></thead><tbody class="divide-y divide-slate-100">
        ${pas.map(u => { const s = DB.lastScreening(u.username), t = s && TONE[s.walidd.tone]; return `<tr><td class="p-3 font-bold">${esc(u.username)}</td><td class="p-3">${esc(u.nama)}</td><td class="p-3">${esc(u.phone) || '<span class="text-slate-300">–</span>'}</td><td class="p-3 tracking-widest text-slate-400">••••••••</td>
          <td class="p-3">${s ? `<b class="text-brand-600">${s.walidd.score}/${WALIDD_MAX}</b> <span class="${t.bg} ${t.text} px-2 py-0.5 rounded-full font-bold text-[10px]">${esc(s.walidd.label)}</span> <span class="text-slate-400">• QoL ${s.qol.total}%</span>` : '<span class="text-slate-400">Belum skrining</span>'}</td>
          <td class="p-3 whitespace-nowrap">${reset(u)}${del(u)}</td></tr>`; }).join('')}</tbody></table>` : '<p class="text-xs text-slate-400 py-3">Belum ada pasien.</p>'}</div>
      <p class="text-[10px] text-slate-400">Kata sandi disimpan dalam bentuk ter-hash sehingga tidak bisa ditampilkan. Gunakan “Reset sandi” bila pengguna lupa.</p></div>

    <div id="ku-modal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] hidden items-center justify-center p-4 overflow-y-auto">
      <form onsubmit="kuAdd(event)" class="bg-white rounded-3xl p-7 max-w-sm w-full shadow-2xl space-y-4 animate-fade-in my-auto text-xs" autocomplete="off">
        <div class="flex justify-between items-center"><h3 class="font-extrabold text-slate-800 text-base">Tambah Akun Baru</h3><button type="button" onclick="kuModal(false)" class="text-slate-400 hover:text-slate-600">✕</button></div>
        <div><label class="block font-bold text-slate-700 mb-1">Username</label><input id="ku-usn" required pattern="[a-zA-Z0-9._]{3,20}" title="3–20 karakter: huruf, angka, titik, garis bawah" class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"></div>
        <div><label class="block font-bold text-slate-700 mb-1">Nama Lengkap</label><input id="ku-nama" required maxlength="60" class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"></div>
        <div><label class="block font-bold text-slate-700 mb-1">Peran</label><select id="ku-role" class="w-full p-3 rounded-xl border border-slate-200"><option value="pasien">Pasien</option><option value="admin">Admin</option></select></div>
        <div><label class="block font-bold text-slate-700 mb-1">Password</label><input id="ku-pwd" type="password" required minlength="6" placeholder="Minimal 6 karakter" class="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"></div>
        <p id="ku-err" class="hidden font-semibold text-rose-600 bg-rose-50 rounded-xl p-2.5"></p>
        <button class="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl shadow-md transition">Simpan Akun</button>
      </form></div>`;
}
function kuModal(show) { const m = $('ku-modal'); m.classList.toggle('hidden', !show); m.classList.toggle('flex', show); if (show) setTimeout(() => $('ku-usn').focus(), 50); }
async function kuAdd(e) {
    e.preventDefault();
    const usn = $('ku-usn').value.trim().toLowerCase(), err = $('ku-err');
    if (DB.user(usn)) { err.textContent = 'Username sudah dipakai.'; err.classList.remove('hidden'); return; }
    const users = DB.users();
    users.push({ username: usn, nama: $('ku-nama').value.trim(), role: $('ku-role').value, phone: '', registerDate: todayStr(), pwdHash: await hashPwd($('ku-pwd').value) });
    DB.saveUsers(users); kuRefresh();
}
function kuDelete(usn) {
    const me = getCurrentUser(); const u = DB.user(usn);
    if (!u || u.role === 'superadmin' || u.username === me.username) return;
    if (!confirm(`Hapus akun “${u.username}”? Data skrining yang sudah tersimpan tetap ada untuk rekap.`)) return;
    DB.saveUsers(DB.users().filter(x => x.username !== u.username)); kuRefresh();
}
async function kuReset(usn) {
    const np = prompt(`Kata sandi baru untuk “${usn}” (minimal 6 karakter):`); if (np === null) return;
    if (np.length < 6) return alert('Kata sandi minimal 6 karakter.');
    const users = DB.users(); users.find(x => x.username === usn).pwdHash = await hashPwd(np); DB.saveUsers(users); alert('Kata sandi berhasil diubah.');
}
