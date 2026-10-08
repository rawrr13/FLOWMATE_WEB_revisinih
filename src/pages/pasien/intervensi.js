/** FLOWMATE - Pasien: Intervensi mandiri (survei -> hasil analisis -> rekomendasi -> kirim ke FEM AI) */
let IV = null;
const IV_SYMPTOMS = ['Pusing', 'Mual', 'Kembung / perut begah', 'Pegal punggung', 'Sakit kepala', 'Lemas', 'Mood swing', 'Diare / sembelit'];
const IV_LOC = ['Perut bagian bawah', 'Pinggang / punggung bawah', 'Paha / selangkangan'];
function ivReset() { IV = { pain: 5, loc: [0], symptoms: [], act: null, pref: [], result: null }; }

function renderRekomendasiIntervensi() { if (!IV || IV.result) ivReset(); return `<div id="iv-root" class="max-w-4xl mx-auto py-8 px-4 space-y-6 animate-fade-in">${ivBody()}</div>`; }
function ivRefresh() { $('iv-root').innerHTML = ivBody(); }
const chipBtn = (on, label, click) => `<button type="button" class="opt !w-auto !py-2 ${on ? 'on' : ''}" onclick="${click}">${esc(label)}</button>`;

function ivBody() {
    const head = `<div class="border-b border-slate-200 pb-4"><span class="text-[10px] font-bold text-brand-600 uppercase tracking-wider">Panduan Nonfarmakologis (tanpa obat)</span>
      <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">✨ Survei Keluhan & Intervensi Mandiri</h2>
      <p class="text-xs text-slate-500 mt-1">Isi survei singkat → dapatkan hasil analisis → ikuti rekomendasi → bahas lebih lanjut dengan FEM AI.</p></div>`;
    if (IV.result) return head + ivResult(IV.result);
    const prefs = [['kompres', '♨️ Kompres hangat'], ['gerak', '🚶‍♀️ Gerak ringan'], ['pijat', '💆‍♀️ Pijat ringan'], ['relaks', '🧘‍♀️ Relaksasi napas']];
    return head + `<div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-md space-y-6 text-xs">
      <h3 class="font-extrabold text-slate-800 text-sm">📋 1. Survei keluhan hari ini</h3>
      <div class="space-y-2"><label class="font-bold text-slate-700">Seberapa kuat nyerimu sekarang? (0–10)</label>
        <input type="range" min="0" max="10" value="${IV.pain}" oninput="IV.pain=+this.value;$('iv-pain').textContent=this.value" class="w-full">
        <p class="text-center text-brand-600 font-extrabold text-xl"><span id="iv-pain">${IV.pain}</span><span class="text-xs text-slate-400">/10</span></p></div>
      <div class="space-y-2"><p class="font-bold text-slate-700">Di mana nyerinya terasa? <span class="font-normal text-slate-400">(boleh lebih dari satu)</span></p>
        <div class="flex flex-wrap gap-2">${IV_LOC.map((l, i) => chipBtn(IV.loc.includes(i), l, `ivTog('loc',${i})`)).join('')}</div></div>
      <div class="space-y-2"><p class="font-bold text-slate-700">Gejala tambahan <span class="font-normal text-slate-400">(boleh dikosongkan)</span></p>
        <div class="flex flex-wrap gap-2">${IV_SYMPTOMS.map(s => chipBtn(IV.symptoms.includes(s), s, `ivTog('symptoms','${s}')`)).join('')}</div></div>
      <div class="space-y-2"><p class="font-bold text-slate-700">Apakah aktivitasmu terganggu hari ini?</p>
        <div class="flex gap-2">${chipBtn(IV.act === true, 'Ya, terganggu', 'IV.act=true;ivRefresh()')}${chipBtn(IV.act === false, 'Tidak terganggu', 'IV.act=false;ivRefresh()')}</div></div>
      <div class="space-y-2"><p class="font-bold text-slate-700">Cara apa yang ingin kamu coba? <span class="font-normal text-slate-400">(kosongkan bila ingin disarankan otomatis)</span></p>
        <div class="flex flex-wrap gap-2">${prefs.map(([k, l]) => chipBtn(IV.pref.includes(k), l, `ivTog('pref','${k}')`)).join('')}</div></div>
      <p id="iv-err" class="hidden text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3"></p>
      <button onclick="ivSubmit()" class="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition">Dapatkan Analisis & Rekomendasi →</button></div>`;
}
function ivTog(k, v) { const a = IV[k]; IV[k] = a.includes(v) ? a.filter(x => x !== v) : [...a, v]; ivRefresh(); }

function ivSubmit() {
    if (IV.act === null) { const e = $('iv-err'); e.textContent = 'Pilih apakah aktivitasmu terganggu hari ini.'; e.classList.remove('hidden'); return; }
    const u = getCurrentUser(), last = DB.lastScreening(u.username);
    const level = IV.pain >= 7 ? 'berat' : IV.pain >= 4 ? 'sedang' : 'ringan';
    const flag = IV.pain >= 8 || (last && last.redFlags.length > 0);
    const lokasi = IV.loc.some(i => i >= 1) ? 1 : 0;
    let recs = buildRecs(IV.pain === 0 ? 'tidak' : level, lokasi, flag);
    if (IV.pref.length) { const must = recs.filter(r => IV.pref.includes(r.id) || r.id === 'periksa'); const rest = recs.filter(r => !must.includes(r) && r.id === 'gaya'); recs = [...must, ...rest]; }
    if (/Lemas|Pusing/.test(IV.symptoms.join()) && IV.pain >= 6) recs = recs.filter(r => r.id !== 'gerak' || IV.pref.includes('gerak'));
    IV.result = { pain: IV.pain, level, flag, recs: recs.map(r => r.id), symptoms: [...IV.symptoms], loc: IV.loc.map(i => IV_LOC[i]), act: IV.act, last };
    ivRefresh(); $('iv-root').scrollIntoView({ behavior: 'smooth' });
}

function ivResult(r) {
    const u = getCurrentUser(), tone = { ringan: 'emerald', sedang: 'amber', berat: 'rose' }[r.level], t = TONE[tone];
    const text = { ringan: 'Nyerimu tergolong ringan. Kram biasanya terjadi karena rahim berkontraksi untuk meluruhkan dinding rahim, dan umumnya cukup ditangani dengan perawatan mandiri.',
        sedang: 'Nyerimu tergolong sedang. Perawatan mandiri yang rutin biasanya membantu. Pantau perkembangannya di jurnal.',
        berat: 'Nyerimu tergolong berat. Mulailah dengan langkah di bawah, dan bila tidak membaik atau makin parah, sebaiknya periksa ke tenaga kesehatan.' }[r.level];
    const recs = r.recs.map(id => REC_LIB[id]);
    const done = DB.actions(u.username).filter(a => a.date.slice(0, 10) === todayStr());
    return `<div class="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-md space-y-6 animate-fade-in">
      <div class="bg-rose-50/60 p-5 rounded-2xl border border-rose-100 space-y-2"><span class="text-[10px] font-bold text-brand-600 uppercase">2. Hasil Analisis</span>
        <div class="flex flex-wrap items-center gap-2"><h4 class="font-extrabold text-slate-800 text-sm">Nyeri ${r.pain}/10</h4><span class="${t.bg} ${t.text} text-[10px] font-extrabold px-2.5 py-0.5 rounded-full capitalize">${r.level}</span>${r.act ? '<span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full">Aktivitas terganggu</span>' : ''}</div>
        <p class="text-xs text-slate-600 leading-relaxed">${text}</p>
        ${r.symptoms.length ? `<p class="text-[11px] text-slate-500">Gejala tambahan: <b>${r.symptoms.map(esc).join(', ')}</b></p>` : ''}
        ${r.flag ? `<p class="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 mt-1">🚩 Keluhanmu perlu diperiksa lebih lanjut. Segera hubungi tenaga kesehatan bila nyeri hebat, pingsan, atau perdarahan sangat banyak.</p>` : ''}</div>
      <div class="space-y-3"><span class="text-[10px] font-bold text-slate-400 uppercase">3. Rekomendasi Terapi Mandiri</span>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${recs.map(rc => `
          <div class="p-5 rounded-2xl border border-slate-100 bg-slate-50 space-y-3"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-xl">${rc.icon}</div><h4 class="font-bold text-slate-800 text-sm">${esc(rc.title)}</h4></div>
            <p class="text-[11px] text-slate-500">${esc(rc.short)}</p>
            <details class="text-[11px] text-slate-600"><summary class="cursor-pointer font-bold text-brand-600">Lihat langkah-langkah</summary><ol class="list-decimal pl-4 mt-2 space-y-1 leading-relaxed">${rc.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>${rc.caution ? `<p class="mt-2 text-amber-700 bg-amber-50 rounded-lg p-2">⚠️ ${esc(rc.caution)}</p>` : ''}</details>
            ${rc.id !== 'periksa' ? `<div class="flex items-center gap-2 pt-1"><select id="dur-${rc.id}" class="text-[11px] p-2 rounded-lg border border-slate-200 bg-white"><option value="5">5 menit</option><option value="10">10 menit</option><option value="15" selected>15 menit</option><option value="20">20 menit</option><option value="30">30 menit</option></select>
              <button id="act-${rc.id}" onclick="ivLogAction('${rc.id}')" class="flex-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 font-bold text-[11px] py-2 rounded-lg transition">☐ Sudah saya lakukan</button></div>` : ''}
          </div>`).join('')}</div>
        ${done.length ? `<p class="text-[11px] text-emerald-700 font-semibold">✅ Hari ini kamu sudah mencatat ${done.length} terapi.</p>` : ''}</div>
      <div class="pt-3 border-t border-slate-100 flex justify-between items-center flex-wrap gap-4">
        <p class="text-xs text-slate-600 font-medium">Mau bahas lebih lanjut rekomendasi ini?</p>
        <div class="flex gap-2"><button onclick="ivReset();ivRefresh()" class="px-4 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50">↻ Isi ulang</button>
        <button onclick="ivSendBot()" class="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition">🤖 Kirim ke FEM AI</button></div></div></div>`;
}
function ivLogAction(id) {
    const u = getCurrentUser(), btn = $('act-' + id); if (btn.dataset.done) return;
    DB.addAction({ id: 'a' + Date.now(), username: u.username, date: new Date().toISOString(), recId: id, title: REC_LIB[id].title, duration: +$('dur-' + id).value, painBefore: IV.result.pain });
    btn.dataset.done = 1; btn.textContent = '✅ Tercatat!'; btn.className = 'flex-1 bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold text-[11px] py-2 rounded-lg';
}
function ivSendBot() { const r = IV.result; sendInterventionToBot({ pain: r.pain, symptoms: r.symptoms, recs: r.recs.map(id => REC_LIB[id].title) }); }
