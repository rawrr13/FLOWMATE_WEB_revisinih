/** FLOWMATE - Pasien: Jurnal harian (catat -> grafik -> riwayat), dibandingkan dengan data referensi */
let JR = null;
const JR_FLOW = [['none', 'Tidak ada'], ['spotting', 'Flek'], ['light', 'Ringan'], ['medium', 'Sedang'], ['heavy', 'Deras']];
const JR_SYM = ['Kram', 'Pegal punggung', 'Sakit kepala', 'Mual', 'Kembung', 'Lemas', 'Jerawat', 'Payudara nyeri', 'Mood swing'];
const JR_ACT = ['Kompres hangat', 'Aktivitas ringan', 'Pijat ringan', 'Relaksasi napas', 'Minum air cukup'];
const JR_MOOD = ['😭', '😕', '😐', '🙂', '😄'];
function jrDraft(date) {
    const u = getCurrentUser(), ex = DB.journal(u.username).find(j => j.date === date);
    return ex ? { ...ex, symptoms: [...ex.symptoms], actions: [...ex.actions] } : { username: u.username, date, pain: 0, flow: 'none', periodStart: false, mood: 3, sleep: 7, stress: 5, symptoms: [], actions: [], note: '' };
}
function renderJurnalHarian() { JR = jrDraft(todayStr()); return `<div id="jr-root" class="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-fade-in">${jrBody()}</div>`; }
function jrRefresh() { $('jr-root').innerHTML = jrBody(); }

function jrChart(list) {
    const pts = list.slice(0, 14).reverse(); if (pts.length < 2) return '<p class="text-xs text-slate-400 py-8 text-center">Grafik muncul setelah kamu mencatat minimal 2 hari.</p>';
    const W = 560, H = 160, px = 28, py = 14, x = i => px + i * (W - px * 2) / (pts.length - 1), y = v => H - py - v * (H - py * 2) / 10;
    const ref = y(REF.pain.mean);
    return `<svg viewBox="0 0 ${W} ${H + 18}" class="w-full"><g stroke="#f1f5f9">${[0, 5, 10].map(v => `<line x1="${px}" x2="${W - px}" y1="${y(v)}" y2="${y(v)}"/>`).join('')}</g>
      <g font-size="9" fill="#94a3b8">${[0, 5, 10].map(v => `<text x="4" y="${y(v) + 3}">${v}</text>`).join('')}</g>
      <line x1="${px}" x2="${W - px}" y1="${ref}" y2="${ref}" stroke="#38bdf8" stroke-dasharray="4 4"/><text x="${W - px}" y="${ref - 3}" font-size="9" fill="#0ea5e9" text-anchor="end">rata-rata data referensi ${REF.pain.mean}</text>
      <polyline fill="none" stroke="#e11d48" stroke-width="2.5" stroke-linejoin="round" points="${pts.map((p, i) => `${x(i)},${y(p.pain)}`).join(' ')}"/>
      ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.pain)}" r="3.5" fill="#e11d48"/><text x="${x(i)}" y="${H + 12}" font-size="8" fill="#94a3b8" text-anchor="middle">${p.date.slice(8)}/${p.date.slice(5, 7)}</text>`).join('')}</svg>`;
}
function jrBody() {
    const u = getCurrentUser(), list = DB.journal(u.username), ci = cycleInfo(u.username), acts = DB.actions(u.username);
    const avg = list.length ? (list.reduce((s, j) => s + j.pain, 0) / list.length) : null;
    const last30 = Array.from({ length: 30 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; });
    const cons = Math.round(last30.filter(d => list.some(j => j.date === d)).length / 30 * 100);
    const stat = (l, v, s) => `<div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"><p class="text-[10px] font-bold text-slate-400 uppercase">${l}</p><p class="text-2xl font-extrabold text-slate-800 mt-1">${v}</p><p class="text-[10px] text-slate-400">${s}</p></div>`;
    const j = JR, chip = (on, l, c) => chipBtn(on, l, c);
    return `
    <div class="border-b border-slate-200 pb-4"><h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900">📊 Jurnal Harian</h2><p class="text-xs text-slate-500 mt-1">Catat kondisimu tiap hari. Perubahan nyeri dan terapi yang kamu lakukan akan terlihat di sini.</p></div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      ${stat('Hari siklus', ci.day ? 'Ke-' + ci.day : '–', ci.lastStart ? 'Haid terakhir ' + fmtDate(ci.lastStart) : 'Tandai hari pertama haid')}
      ${stat('Rata-rata nyeri', avg !== null ? avg.toFixed(1) + '/10' : '–', `Data referensi: ${REF.pain.mean}/10`)}
      ${stat('Siklus rata-rata', ci.avgLen ? ci.avgLen + ' hari' : '–', `Data referensi: ${REF.cycleLen.mean} hari`)}
      ${stat('Hari tercatat', cons + '%', `30 hari terakhir • ${acts.length} terapi dilakukan`)}
    </div>

    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-md space-y-5 text-xs">
      <div class="flex flex-wrap justify-between items-center gap-3"><h3 class="font-extrabold text-slate-800 text-sm">📝 Catatan untuk tanggal</h3>
        <input type="date" value="${j.date}" max="${todayStr()}" onchange="JR=jrDraft(this.value);jrRefresh()" class="p-2 rounded-xl border border-slate-200 text-xs font-bold"></div>
      <div class="grid md:grid-cols-2 gap-5">
        <div class="space-y-2"><label class="font-bold text-slate-700">Nyeri hari ini: <span class="text-brand-600 text-sm" id="jr-pain">${j.pain}</span>/10</label><input type="range" min="0" max="10" value="${j.pain}" oninput="JR.pain=+this.value;$('jr-pain').textContent=this.value" class="w-full"></div>
        <div class="space-y-2"><label class="font-bold text-slate-700">Darah haid</label><div class="flex flex-wrap gap-1.5">${JR_FLOW.map(([k, l]) => chip(j.flow === k, l, `JR.flow='${k}';jrRefresh()`)).join('')}</div></div>
        <div class="space-y-2"><label class="font-bold text-slate-700">Mood</label><div class="flex gap-1.5">${JR_MOOD.map((e, i) => `<button type="button" class="opt !w-12 !text-lg !text-center !px-0 ${j.mood === i + 1 ? 'on' : ''}" onclick="JR.mood=${i + 1};jrRefresh()">${e}</button>`).join('')}</div></div>
        <div class="space-y-2"><label class="font-bold text-slate-700">Tidur semalam: <span class="text-brand-600" id="jr-sleep">${j.sleep}</span> jam</label><input type="range" min="2" max="12" step="0.5" value="${j.sleep}" oninput="JR.sleep=+this.value;$('jr-sleep').textContent=this.value" class="w-full"></div>
        <div class="space-y-2"><label class="font-bold text-slate-700">Tingkat stres: <span class="text-brand-600" id="jr-stress">${j.stress}</span>/10</label><input type="range" min="0" max="10" value="${j.stress}" oninput="JR.stress=+this.value;$('jr-stress').textContent=this.value" class="w-full"></div>
        <div class="space-y-2"><label class="font-bold text-slate-700">Hari pertama haid?</label>${chip(j.periodStart, '🩸 Ya, hari ini mulai haid', `JR.periodStart=!JR.periodStart;jrRefresh()`)}</div>
      </div>
      <div class="space-y-2"><p class="font-bold text-slate-700">Gejala</p><div class="flex flex-wrap gap-1.5">${JR_SYM.map(s => chip(j.symptoms.includes(s), s, `jrTog('symptoms','${s}')`)).join('')}</div></div>
      <div class="space-y-2"><p class="font-bold text-slate-700">Yang sudah kamu lakukan</p><div class="flex flex-wrap gap-1.5">${JR_ACT.map(s => chip(j.actions.includes(s), s, `jrTog('actions','${s}')`)).join('')}</div></div>
      <div><label class="font-bold text-slate-700">Catatan singkat</label><textarea maxlength="300" oninput="JR.note=this.value" rows="2" class="mt-1 w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Opsional">${esc(j.note)}</textarea></div>
      <div class="flex items-center gap-3"><button onclick="jrSave()" class="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 rounded-xl shadow-md transition">💾 Simpan catatan</button><span id="jr-msg" class="text-emerald-600 font-semibold hidden">Tersimpan ✓</span></div>
    </div>

    <div class="grid lg:grid-cols-5 gap-6">
      <div class="lg:col-span-3 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"><h3 class="font-extrabold text-slate-800 text-sm mb-3">📈 Grafik nyeri (14 catatan terakhir)</h3>${jrChart(list)}</div>
      <div class="lg:col-span-2 bg-sky-50 border border-sky-100 p-6 rounded-3xl text-xs text-sky-900 space-y-2"><h3 class="font-extrabold text-sm">💡 Insight dari data referensi</h3>
        <p>${REF.pain.pctSevere7plus}% siklus di data referensi bernyeri berat (≥7/10).</p>
        <p>Stres tinggi → nyeri rata-rata <b>${REF.stressPain.tinggi}/10</b>; stres rendah → <b>${REF.stressPain.rendah}/10</b>.</p>
        <p>Tidur &lt;6 jam → nyeri <b>${REF.sleepPain.kurang}/10</b>; tidur cukup → <b>${REF.sleepPain.cukup}/10</b>.</p>
        ${avg !== null ? `<p class="font-bold pt-1">Rata-rata nyerimu ${avg.toFixed(1)}/10, ${avg > REF.pain.mean ? 'sedikit di atas' : 'di bawah / setara'} rata-rata data referensi.</p>` : ''}</div>
    </div>

    <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3"><h3 class="font-extrabold text-slate-800 text-sm">🗂️ Riwayat catatan</h3>
      ${list.length ? `<div class="overflow-x-auto"><table class="w-full text-left text-xs"><thead class="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]"><tr><th class="p-3">Tanggal</th><th class="p-3">Nyeri</th><th class="p-3">Darah</th><th class="p-3">Mood</th><th class="p-3">Gejala & terapi</th><th class="p-3"></th></tr></thead><tbody class="divide-y divide-slate-100">
        ${list.slice(0, 30).map(e => `<tr><td class="p-3 font-bold whitespace-nowrap">${fmtDate(e.date)}${e.periodStart ? ' 🩸' : ''}</td><td class="p-3 font-extrabold text-brand-600">${e.pain}/10</td><td class="p-3">${JR_FLOW.find(f => f[0] === e.flow)?.[1] || '-'}</td><td class="p-3 text-base">${JR_MOOD[e.mood - 1]}</td><td class="p-3 text-slate-500">${[...e.symptoms, ...e.actions.map(a => '✔ ' + a)].map(esc).join(', ') || '-'}</td>
        <td class="p-3 whitespace-nowrap"><button onclick="JR=jrDraft('${e.date}');jrRefresh();window.scrollTo({top:0,behavior:'smooth'})" class="text-brand-600 font-bold mr-2">Ubah</button><button onclick="jrDelete('${e.date}')" class="text-slate-400 hover:text-rose-600 font-bold">Hapus</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="text-xs text-slate-400 py-4">Belum ada catatan. Simpan catatan pertamamu di atas 🌸</p>'}</div>`;
}
function jrTog(k, v) { const a = JR[k]; JR[k] = a.includes(v) ? a.filter(x => x !== v) : [...a, v]; jrRefresh(); }
function jrSave() { if (DB.saveJournal({ ...JR })) { const d = JR.date; jrRefresh(); const m = $('jr-msg'); m.classList.remove('hidden'); setTimeout(() => m && m.classList.add('hidden'), 2500); } }
function jrDelete(date) { if (confirm('Hapus catatan tanggal ' + fmtDate(date) + '?')) { DB.deleteJournal(getCurrentUser().username, date); JR = jrDraft(todayStr()); jrRefresh(); } }
