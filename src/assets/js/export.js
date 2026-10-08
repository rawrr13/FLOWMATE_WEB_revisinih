/** FLOWMATE - Ekspor data: PDF (pasien) & Excel (admin / super admin). Butuh jsPDF & SheetJS (CDN di index.html). */
const pdfSafe = s => String(s ?? '').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/[^\x20-\x7E\u00A0-\u00FF–—•’‘“”]/g, '').replace(/\s+\n/g, '\n');

function downloadPDFAnalysis() {
    const user = getCurrentUser(); if (!user) return;
    const scr = DB.lastScreening(user.username);
    if (!scr) return alert('Belum ada hasil skrining. Isi Skrining WaLIDD dulu ya 🌸');
    if (!window.jspdf) return alert('Library PDF belum termuat. Periksa koneksi internet lalu muat ulang halaman.');
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, M = 16, maxW = W - M * 2; let y = 0;
    const need = h => { if (y + h > 282) { doc.addPage(); y = 18; } };
    const text = (t, size = 10, bold = false, color = [30, 41, 59], indent = 0) => {
        doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(...color);
        doc.splitTextToSize(pdfSafe(t), maxW - indent).forEach(line => { need(size * 0.5); doc.text(line, M + indent, y); y += size * 0.5; });
        y += 1.2;
    };
    const h2 = t => { y += 3; need(12); doc.setFillColor(255, 241, 242); doc.roundedRect(M, y - 5, maxW, 8, 2, 2, 'F'); text(t, 11, true, [190, 18, 60]); y += 1; };
    const bar = (label, pct) => {
        need(9); doc.setFontSize(9); doc.setTextColor(71, 85, 105); doc.setFont('helvetica', 'normal'); doc.text(pdfSafe(label), M, y);
        doc.text(pct + '%', M + maxW, y, { align: 'right' }); y += 2;
        doc.setFillColor(241, 245, 249); doc.roundedRect(M, y, maxW, 2.4, 1, 1, 'F');
        doc.setFillColor(225, 29, 72); if (pct > 0) doc.roundedRect(M, y, maxW * pct / 100, 2.4, 1, 1, 'F'); y += 6;
    };

    doc.setFillColor(225, 29, 72); doc.rect(0, 0, W, 28, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('FLOWMATE', M, 14);
    doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.text('Laporan Hasil Analisis Skrining Dismenore', M, 21); y = 38;

    text(`Nama: ${user.nama}   |   Username: ${user.username}`, 10, true);
    text(`Tanggal skrining: ${fmtDate(scr.date, true)}   |   Dicetak: ${fmtDate(new Date().toISOString(), true)}`, 9, false, [100, 116, 139]);

    h2('1. Hasil Skrining WaLIDD');
    text(`Skor total: ${scr.walidd.score} / ${WALIDD_MAX}  (${scr.walidd.label})`, 12, true);
    text(scr.walidd.plain, 10);
    WALIDD_ITEMS.forEach(it => { const v = it.slider ? `${scr.walidd.ans.i}/10` : it.opts[scr.walidd.ans[it.key]]; text(`• ${it.title}: ${v}`, 9, false, [71, 85, 105], 2); });

    h2('2. Kualitas Hidup Saat Menstruasi');
    text(`Skor keseluruhan: ${scr.qol.total}%  (${scr.qol.level.label})`, 11, true);
    QOL_ASPECTS.forEach(a => bar(a.label, scr.qol.aspects[a.key]));

    h2('3. Tanda Bahaya (Safety Check)');
    if (scr.redFlags.length) { text('Keluhanmu perlu diperiksa lebih lanjut oleh tenaga kesehatan. Tanda yang dipilih:', 10, true, [159, 18, 57]); scr.redFlags.forEach(f => text('• ' + f, 9, false, [71, 85, 105], 2)); }
    else text('Tidak ada tanda bahaya yang dipilih saat skrining.', 10);

    h2('4. Rekomendasi Nonfarmakologis');
    scr.recs.forEach(title => { const r = Object.values(REC_LIB).find(x => x.title === title); text(`• ${title}${r ? ': ' + r.short : ''}`, 10, false, [30, 41, 59], 2); });

    if (scr.pain != null) { h2('5. Perbandingan dengan Data Referensi'); const d = datasetInsight(scr.pain); text(d.text, 9.5); text(d.stress, 9.5); }

    const jr = DB.journal(user.username), ci = cycleInfo(user.username), acts = DB.actions(user.username);
    h2('6. Ringkasan Jurnal & Penerapan');
    if (jr.length) {
        const avg = (jr.reduce((s, j) => s + j.pain, 0) / jr.length).toFixed(1);
        text(`Hari tercatat: ${jr.length}   |   Rata-rata nyeri: ${avg}/10   |   Terapi dilakukan: ${acts.length}x` + (ci.avgLen ? `   |   Rata-rata siklus: ${ci.avgLen} hari` : ''), 10);
    } else text('Belum ada catatan jurnal.', 10);

    y += 4; text('Catatan: dokumen ini adalah hasil SKRINING, bukan diagnosis medis. Bila keluhan berat, berulang, atau ada tanda bahaya, segera konsultasikan ke tenaga kesehatan.', 8.5, false, [100, 116, 139]);
    doc.save(`FLOWMATE_Hasil_${user.username}_${todayStr()}.pdf`);
}

function buildRekapRows() {
    const scrs = DB.screenings().sort((a, b) => a.date.localeCompare(b.date));
    const rekap = scrs.map((s, i) => ({
        'No': i + 1, 'Tanggal Skrining': fmtDate(s.date, true), 'Username': s.username, 'Nama Lengkap': s.nama, 'Usia': s.basic?.usia ?? '',
        'Skor WaLIDD (0-12)': s.walidd.score, 'Kategori Dismenore': s.walidd.label, 'Intensitas Nyeri (0-10)': s.pain ?? '',
        'Skor Kualitas Hidup (%)': s.qol.total, 'Level Kualitas Hidup': s.qol.level.label,
        ...Object.fromEntries(QOL_ASPECTS.map(a => [a.label + ' (%)', s.qol.aspects[a.key]])),
        'Tanda Bahaya': s.redFlags.length ? s.redFlags.join('; ') : 'Tidak ada', 'Rekomendasi Utama': s.mainRec, 'Rekomendasi Lengkap': s.recs.join('; '),
    }));
    const jawaban = scrs.map(s => ({
        'Tanggal': fmtDate(s.date, true), 'Username': s.username, 'Nama': s.nama,
        ...Object.fromEntries(WALIDD_ITEMS.map(it => ['WaLIDD-' + it.key.toUpperCase(), s.walidd.ans[it.key]])),
        ...Object.fromEntries(s.qol.answers.map((v, i) => ['Q' + (i + 1), v])),
    }));
    const pengguna = DB.users().map(u => ({ 'Username': u.username, 'Nama Lengkap': u.nama, 'Peran': u.role, 'No. Telepon': u.phone || '', 'Tanggal Registrasi': fmtDate(u.registerDate), 'Jumlah Skrining': scrs.filter(s => s.username === u.username).length }));
    return { rekap, jawaban, pengguna };
}
function downloadExcelRekap() {
    if (!window.XLSX) return alert('Library Excel belum termuat. Periksa koneksi internet lalu muat ulang halaman.');
    const { rekap, jawaban, pengguna } = buildRekapRows();
    if (!rekap.length) return alert('Belum ada data skrining untuk direkap.');
    const wb = XLSX.utils.book_new();
    const add = (rows, name, widths) => { const ws = XLSX.utils.json_to_sheet(rows); ws['!cols'] = (widths || Object.keys(rows[0] || {}).map(k => Math.min(40, Math.max(10, k.length + 2)))).map(w => ({ wch: w })); XLSX.utils.book_append_sheet(wb, ws, name); };
    add(rekap, 'Rekap Skrining'); add(jawaban, 'Jawaban Item'); add(pengguna, 'Pengguna');
    XLSX.writeFile(wb, `FLOWMATE_Rekap_Skrining_${todayStr()}.xlsx`);
}
