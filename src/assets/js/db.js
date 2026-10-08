/**
 * FLOWMATE - Penyimpanan data (sementara: localStorage browser).
 * Semua akses data lewat objek DB supaya nanti mudah diganti ke API backend.
 */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);
const pad2 = n => String(n).padStart(2, '0');
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
const fmtDate = (iso, withTime) => {
    if (!iso) return '-';
    const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
    if (isNaN(d)) return '-';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) +
        (withTime ? ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':') : '');
};
const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);

const K = { users: 'flowmate_users', scr: 'flowmate_screenings', jr: 'flowmate_journal', act: 'flowmate_actions', ses: 'flowmate_session' };

const DB = {
    read(key, fallback) { try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } },
    write(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { alert('Penyimpanan browser penuh / diblokir.'); return false; } },

    // ---- Pengguna ----
    users() { return DB.read(K.users, []); },
    saveUsers(list) { return DB.write(K.users, list); },
    user(username) { const u = String(username || '').trim().toLowerCase(); return DB.users().find(x => x.username.toLowerCase() === u) || null; },

    // ---- Skrining (disimpan per pasien, dibaca juga oleh admin) ----
    screenings(username) { const all = DB.read(K.scr, []); return (username ? all.filter(s => s.username === username) : all).sort((a, b) => b.date.localeCompare(a.date)); },
    addScreening(rec) { const all = DB.read(K.scr, []); all.push(rec); return DB.write(K.scr, all); },
    lastScreening(username) { return DB.screenings(username)[0] || null; },

    // ---- Jurnal harian (satu catatan per tanggal) ----
    journal(username) { return DB.read(K.jr, []).filter(j => j.username === username).sort((a, b) => b.date.localeCompare(a.date)); },
    allJournal() { return DB.read(K.jr, []); },
    saveJournal(entry) {
        const all = DB.read(K.jr, []).filter(j => !(j.username === entry.username && j.date === entry.date));
        all.push(entry); return DB.write(K.jr, all);
    },
    deleteJournal(username, date) { return DB.write(K.jr, DB.read(K.jr, []).filter(j => !(j.username === username && j.date === date))); },

    // ---- Log intervensi (apa yang disarankan -> apa yang dilakukan) ----
    actions(username) { return DB.read(K.act, []).filter(a => a.username === username).sort((a, b) => b.date.localeCompare(a.date)); },
    allActions() { return DB.read(K.act, []); },
    addAction(rec) { const all = DB.read(K.act, []); all.push(rec); return DB.write(K.act, all); },

    // ---- Sesi ----
    session() { return DB.read(K.ses, null); },
    setSession(username) { DB.write(K.ses, { username, at: Date.now() }); },
    clearSession() { localStorage.removeItem(K.ses); },
};

/** Hash kata sandi (SHA-256). Catatan: ini untuk prototipe front-end; di backend gunakan bcrypt/argon2. */
async function hashPwd(p) {
    if (window.crypto && crypto.subtle) {
        const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('flowmate::' + p));
        return 'h1:' + [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
    }
    return 'p0:' + btoa(unescape(encodeURIComponent(p)));
}

/** Akun awal. Ubah / hapus di sini sebelum dipakai sungguhan. */
async function seedUsers() {
    if (DB.users().length) return;
    DB.saveUsers([
        { username: 'superadmin', nama: 'Super Admin', role: 'superadmin', phone: '', registerDate: '2026-01-01', pwdHash: await hashPwd('Flowmate@2026') },
        { username: 'sitirahma', nama: 'Siti Rahma', role: 'pasien', phone: '', registerDate: '2026-01-10', pwdHash: await hashPwd('Pasien@2026') },
    ]);
}
const isAdminRole = r => r === 'admin' || r === 'superadmin';
