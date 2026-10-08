/**
 * FLOWMATE - Logika skrining: WaLIDD, kuesioner kualitas hidup, red flag, rekomendasi (berbasis aturan).
 * PENTING: bobot skor & batas kategori WaLIDD di bawah adalah DRAFT. Samakan dengan pedoman resmi
 * dan validasi pakar sebelum dipakai untuk penelitian (cukup ubah WALIDD_ITEMS / WALIDD_CUTOFF).
 */
const WALIDD_ITEMS = [
    { key: 'w', title: 'Kemampuan beraktivitas (Working ability)', q: 'Saat haid, seberapa terganggu aktivitas sekolah/kuliah/kerjamu?', max: 3, opts: [
        'Tidak terganggu sama sekali', 'Sedikit terganggu, masih bisa beraktivitas', 'Cukup terganggu, perlu sering istirahat', 'Tidak bisa beraktivitas sama sekali'] },
    { key: 'l', title: 'Lokasi nyeri (Location)', q: 'Di mana nyeri haid biasanya terasa?', max: 2, opts: [
        'Hanya perut bagian bawah', 'Perut bawah dan menjalar ke pinggang/punggung bawah', 'Perut bawah, pinggang, hingga paha / seluruh badan'] },
    { key: 'i', title: 'Tingkat nyeri (Intensity)', q: 'Seberapa kuat nyeri terburuk saat haid? (0 = tidak nyeri, 10 = paling sakit)', max: 3, slider: true },
    { key: 'd', title: 'Lama nyeri (Days of pain)', q: 'Berapa hari nyeri haid biasanya berlangsung?', max: 3, opts: [
        'Kurang dari 1 hari', '1–2 hari', '3–4 hari', '5 hari atau lebih'] },
    { key: 'dys', title: 'Keteraturan nyeri (Dysmenorrhea)', q: 'Apakah nyeri haid muncul di hampir setiap siklus?', max: 1, opts: [
        'Tidak / hanya sesekali', 'Ya, hampir setiap siklus'] },
];
const WALIDD_MAX = 12;
const WALIDD_CUTOFF = [ // skor minimum -> kategori (urut besar ke kecil)
    { min: 8, key: 'berat', label: 'Dismenore Berat', tone: 'rose', plain: 'Nyeri haidmu tergolong berat dan sangat memengaruhi aktivitas. Mulailah dengan langkah mandiri di bawah, dan sebaiknya konsultasikan ke tenaga kesehatan.' },
    { min: 5, key: 'sedang', label: 'Dismenore Sedang', tone: 'amber', plain: 'Nyeri haidmu tergolong sedang: cukup mengganggu tapi umumnya bisa dibantu dengan langkah mandiri yang rutin.' },
    { min: 1, key: 'ringan', label: 'Dismenore Ringan', tone: 'emerald', plain: 'Nyeri haidmu tergolong ringan. Pertahankan kebiasaan sehat dan pantau lewat jurnal.' },
    { min: 0, key: 'tidak', label: 'Tidak Ada Dismenore', tone: 'emerald', plain: 'Saat ini tidak ada tanda nyeri haid yang mengganggu. Tetap catat siklusmu ya.' },
];
const TONE = {
    rose: { bg: 'bg-rose-100', text: 'text-rose-800', bar: '#e11d48' },
    amber: { bg: 'bg-amber-100', text: 'text-amber-800', bar: '#f59e0b' },
    emerald: { bg: 'bg-emerald-100', text: 'text-emerald-800', bar: '#10b981' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-700', bar: '#64748b' },
};

function intensityPoints(nrs) { return nrs === 0 ? 0 : nrs <= 3 ? 1 : nrs <= 6 ? 2 : 3; }
function scoreWalidd(a) { // a: {w,l,i(nrs 0-10),d,dys}
    const pts = { w: a.w, l: a.l, i: intensityPoints(a.i), d: a.d, dys: a.dys };
    const score = Object.values(pts).reduce((s, v) => s + v, 0);
    const cat = WALIDD_CUTOFF.find(c => score >= c.min);
    return { pts, score, cat: cat.key, label: cat.label, tone: cat.tone, plain: cat.plain };
}
const catInfo = key => WALIDD_CUTOFF.find(c => c.key === key) || WALIDD_CUTOFF[3];

/* ---------- Kuesioner kualitas hidup (15 butir, skala 1-5) ---------- */
const QOL_ASPECTS = [
    { key: 'fisik', label: 'Aspek Fisik', icon: '💪', from: 0, to: 3 },
    { key: 'psiko', label: 'Aspek Psikologis', icon: '🧠', from: 3, to: 6 },
    { key: 'akademik', label: 'Aspek Akademik', icon: '📚', from: 6, to: 9 },
    { key: 'sosial', label: 'Aspek Sosial', icon: '👥', from: 9, to: 12 },
    { key: 'kualitas', label: 'Kualitas Hidup Umum', icon: '🌟', from: 12, to: 15 },
];
const QOL_ITEMS = [
    'Nyeri menstruasi mengganggu aktivitas sehari-hari saya.',
    'Saya merasa mudah lelah selama menstruasi.',
    'Keluhan menstruasi (nyeri, mual, sakit kepala) memengaruhi kesehatan saya.',
    'Saya merasa lebih mudah marah atau emosional selama menstruasi.',
    'Menstruasi memengaruhi suasana hati saya.',
    'Saya merasa cemas atau stres menjelang atau selama menstruasi.',
    'Menstruasi mengganggu konsentrasi saya saat mengikuti perkuliahan.',
    'Menstruasi memengaruhi kemampuan saya menyelesaikan tugas akademik.',
    'Saya pernah tidak masuk kuliah atau praktik karena keluhan menstruasi.',
    'Menstruasi membatasi interaksi saya dengan teman atau keluarga.',
    'Saya merasa kurang nyaman mengikuti kegiatan sosial selama menstruasi.',
    'Keluhan menstruasi memengaruhi hubungan saya dengan orang lain.',
    'Secara umum saya tetap dapat menjalankan aktivitas sehari-hari meskipun sedang menstruasi.',
    'Saya merasa memiliki kualitas hidup yang baik selama siklus menstruasi.',
    'Siklus menstruasi saya tidak mengganggu kesejahteraan hidup saya secara keseluruhan.',
];
const LIKERT = ['Sangat tidak setuju', 'Tidak setuju', 'Netral / ragu-ragu', 'Setuju', 'Sangat setuju'];
const QOL_POSITIVE_FROM = 12; // butir 13-15 bernada positif; butir 1-12 dibalik agar skor tinggi = kualitas hidup baik
function scoreQol(ans) { // ans: array 15 nilai 1-5
    const adj = ans.map((v, i) => i >= QOL_POSITIVE_FROM ? v : 6 - v);
    const pct = arr => Math.round(((arr.reduce((s, v) => s + v, 0) / arr.length) - 1) / 4 * 100);
    const aspects = {}; QOL_ASPECTS.forEach(a => aspects[a.key] = pct(adj.slice(a.from, a.to)));
    const total = pct(adj);
    const level = total >= 67 ? { key: 'baik', label: 'Baik', tone: 'emerald' } : total >= 34 ? { key: 'sedang', label: 'Sedang', tone: 'amber' } : { key: 'rendah', label: 'Rendah', tone: 'rose' };
    return { aspects, total, level };
}

/* ---------- Red flag (safety net) ---------- */
const RED_FLAGS = [
    'Nyeri sangat berat atau jauh lebih parah dari biasanya',
    'Darah haid sangat banyak (ganti pembalut tiap 1–2 jam, atau gumpalan besar)',
    'Pingsan, lemas berat, atau pandangan gelap',
    'Demam, atau keputihan berbau / gejala tidak biasa lainnya',
    'Nyeri hebat di satu sisi perut, atau nyeri muncul saat haid terlambat',
    'Nyeri tidak membaik dengan cara mandiri selama beberapa siklus berturut-turut',
];

/* ---------- Pustaka rekomendasi nonfarmakologis ---------- */
const REC_LIB = {
    kompres: { id: 'kompres', icon: '♨️', title: 'Kompres hangat', short: 'Kompres perut bawah atau punggung bawah 15–20 menit.',
        steps: ['Siapkan botol/kantong hangat (kira-kira 40°C, hangat nyaman, bukan panas).', 'Bungkus dengan kain agar kulit tidak melepuh.', 'Tempelkan di perut bawah atau punggung bawah selama 15–20 menit.', 'Ulangi saat nyeri datang lagi.'],
        caution: 'Hentikan jika kulit terasa panas, merah, atau perih.' },
    gerak: { id: 'gerak', icon: '🚶‍♀️', title: 'Aktivitas fisik ringan', short: 'Jalan santai, peregangan, atau yoga/senam haid 10–15 menit.',
        steps: ['Mulai dengan jalan santai 10 menit.', 'Lakukan Child’s Pose (posisi sujud, tangan dijulurkan) 30–60 detik.', 'Lanjutkan Cat-Cow perlahan 8–10 kali.', 'Berhenti bila nyeri bertambah.'],
        caution: 'Jangan memaksakan diri. Istirahat lebih baik daripada olahraga berat saat nyeri kuat.' },
    pijat: { id: 'pijat', icon: '💆‍♀️', title: 'Pijat ringan', short: 'Usap melingkar pelan di perut bawah / punggung bawah.',
        steps: ['Oleskan sedikit minyak/lotion hangat.', 'Usap melingkar searah jarum jam di perut bawah dengan tekanan ringan.', 'Lanjutkan di punggung bawah (minta bantuan jika perlu).', 'Lakukan 5–10 menit.'],
        caution: 'Tekanan harus nyaman. Jangan memijat bila ada nyeri tajam hebat atau perdarahan sangat banyak.' },
    relaks: { id: 'relaks', icon: '🧘‍♀️', title: 'Relaksasi napas', short: 'Tarik napas dalam pelan-pelan selama 5 menit.',
        steps: ['Duduk atau berbaring nyaman.', 'Tarik napas lewat hidung 4 hitungan, tahan 2 hitungan.', 'Hembuskan pelan lewat mulut 6 hitungan.', 'Ulangi 5 menit sambil mengendurkan bahu dan perut.'],
        caution: 'Jika pusing, kembali bernapas normal.' },
    gaya: { id: 'gaya', icon: '💧', title: 'Minum cukup & tidur cukup', short: 'Air hangat, makan teratur, tidur 7–9 jam.',
        steps: ['Minum air putih/hangat sepanjang hari.', 'Pilih makanan bergizi (sayur, buah, protein) dan kurangi kafein serta makanan sangat asin.', 'Usahakan tidur cukup dan jam tidur teratur.'],
        caution: '' },
    periksa: { id: 'periksa', icon: '🩺', title: 'Periksa ke tenaga kesehatan', short: 'Keluhanmu perlu diperiksa lebih lanjut.',
        steps: ['Catat sejak kapan keluhan muncul dan seberapa parah.', 'Datang ke puskesmas, bidan, atau dokter kandungan.', 'Bawa catatan jurnal & hasil skrining FLOWMATE.'],
        caution: 'Jika pingsan, perdarahan sangat deras, atau nyeri hebat mendadak, segera ke IGD.' },
};
/** Aturan rekomendasi. Berdasarkan kategori, lokasi nyeri, dan ada tidaknya red flag. */
function buildRecs(cat, lokasi, hasRedFlag) {
    const R = REC_LIB, list = [];
    if (hasRedFlag) list.push(R.periksa);
    list.push(R.kompres);
    if (cat !== 'tidak') list.push(R.relaks);
    if (!hasRedFlag || cat === 'ringan') list.push(R.gerak);
    if (!hasRedFlag && lokasi >= 1 && cat !== 'tidak') list.push(R.pijat);
    list.push(R.gaya);
    if (cat === 'berat' && !hasRedFlag) list.unshift(R.periksa);
    return list;
}
function mainRecText(cat, hasRedFlag) {
    if (hasRedFlag) return 'Periksa ke tenaga kesehatan + kompres hangat';
    return { berat: 'Kompres hangat + istirahat, dan disarankan periksa', sedang: 'Kompres hangat + relaksasi napas', ringan: 'Kompres hangat + aktivitas ringan', tidak: 'Pertahankan gaya hidup sehat' }[cat];
}
function todayRec(scr) {
    if (!scr) return { title: 'Mulai dari skrining', text: 'Isi skrining WaLIDD dulu supaya rekomendasimu sesuai kondisimu.', cta: 'Mulai skrining', go: 'walidd_screening' };
    if (scr.redFlags.length) return { title: 'Periksa ke tenaga kesehatan', text: 'Ada keluhan yang perlu diperiksa lebih lanjut. Sambil menunggu, kompres hangat 15–20 menit bisa membantu.', cta: 'Buka panduan', go: 'rekomendasi' };
    const t = { berat: ['Kompres hangat & istirahat', 'Kompres perut bawah 15–20 menit, istirahat cukup, dan latihan napas dalam.'],
        sedang: ['Kompres hangat & hidrasi', 'Kompres perut bawah 15–20 menit dan minum air hangat/teh jahe hangat.'],
        ringan: ['Gerak ringan & hidrasi', 'Jalan santai atau peregangan 10 menit, plus minum air yang cukup.'],
        tidak: ['Jaga kebiasaan sehat', 'Tidur cukup, minum air, dan catat siklusmu di jurnal.'] }[scr.walidd.cat];
    return { title: t[0], text: t[1], cta: 'Buka panduan intervensi', go: 'rekomendasi' };
}

/* ---------- Pembanding dengan dataset ---------- */
function datasetInsight(pain) {
    const p = Math.max(1, Math.min(10, Math.round(pain)));
    const below = REF.pain.pctAtOrBelow[p], lvl = REF.pain.byLevel[p];
    return {
        pctLower: below, avg: REF.pain.mean, severePct: REF.pain.pctSevere7plus, hoursLost: lvl.work_hours_lost,
        text: `Nyeri ${pain}/10 setara atau lebih tinggi dari sekitar ${Math.round(below)}% catatan siklus di data referensi (${REF.n_log.toLocaleString('id-ID')} catatan dari ${REF.n_user.toLocaleString('id-ID')} perempuan). Pada tingkat nyeri ini, rata-rata sekitar ${lvl.work_hours_lost} jam aktivitas terganggu per siklus.`,
        stress: `Di data yang sama, siklus dengan stres tinggi rata-rata nyerinya ${REF.stressPain.tinggi}/10, sedangkan stres rendah ${REF.stressPain.rendah}/10. Kurang tidur (<6 jam) rata-rata ${REF.sleepPain.kurang}/10 vs ${REF.sleepPain.cukup}/10 bila tidur cukup.`,
    };
}

/* ---------- Siklus dari jurnal ---------- */
function cycleInfo(username) {
    const starts = DB.journal(username).filter(j => j.periodStart).map(j => j.date).sort();
    if (!starts.length) return { day: null, avgLen: null, lastStart: null };
    const last = starts[starts.length - 1], day = daysBetween(last, todayStr()) + 1;
    const gaps = starts.slice(1).map((d, i) => daysBetween(starts[i], d)).filter(g => g >= 15 && g <= 60);
    return { day: day >= 1 ? day : null, lastStart: last, avgLen: gaps.length ? Math.round(gaps.reduce((s, v) => s + v, 0) / gaps.length) : null, n: gaps.length };
}
