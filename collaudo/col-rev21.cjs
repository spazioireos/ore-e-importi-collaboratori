// col-rev21.cjs — prova delle sei correzioni della rev 21 di Collaboratori, con confronto diretto sulla rev 20.
// SOLO DATI INVENTATI (repository pubblico).
//   COL_URL   = rev 21 (predefinito http://127.0.0.1:8340/col/index.html)
//   COL20_URL = copia congelata della rev 20 localizzata nel banco (predefinito: stessa origine, /col20/index.html)
//   COL_PNG   = cartella in cui salvare le anteprime (facoltativo)
// 1 ritenuta del TOTALE = somma delle righe · 2 omonimi identici «TS ?» · 3 import rotti rifiutati + rete di sicurezza
// 4 date impossibili rifiutate · 5 anno/mese testo letti dai Fogli ore · 6 rimborso = 80% anche nei report.
const L = require('./col-a01-lib.cjs');
const { rec, num } = L;
const fs = require('fs');
const path = require('path');
const XLSX = require('/home/user/rendicontazione-usoint/collaudo/comune/.banco/lib/xlsx-0.18.5.js');
const URL21 = L.URL;
const URL20 = process.env.COL20_URL || URL21.replace('/col/', '/col20/');
const PNG = process.env.COL_PNG || '';
const R2 = (v) => { const s = v < 0 ? -1 : 1; v = Math.abs(v); return s * Math.round(Number((v * 100).toPrecision(12))) / 100; };
const z12 = () => [0,0,0,0,0,0,0,0,0,0,0,0];

// generatore deterministico di dati inventati
function prng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const TARIFFE = [10.03, 18, 18.37, 20.5, 22.99, 23.75, 24.15, 30];
function datiCasuali(n, seed) {
  const rnd = prng(seed); const ops = [];
  for (let i = 0; i < n; i++) {
    const years = {};
    for (const y of ['2025', '2026']) {
      if (y === '2025' && rnd() < 0.3) continue;
      const services = []; const ns = 1 + Math.floor(rnd() * 3);
      for (let s = 0; s < ns; s++) {
        const hrs = z12(); for (let m = 0; m < 12; m++) if (rnd() < 0.5) hrs[m] = Math.round(rnd() * 4000) / 100;
        services.push({ name: 'SERVIZIO ' + s, residual: rnd() < 0.2 ? Math.round(rnd() * 1000) / 100 : 0, hours: hrs, rate: TARIFFE[Math.floor(rnd() * TARIFFE.length)] });
      }
      const payments = []; const np = Math.floor(rnd() * 6);
      for (let p = 0; p < np; p++) {
        const g = 1 + Math.floor(rnd() * 28), mm = 1 + Math.floor(rnd() * 12);
        payments.push({ date: (g < 10 ? '0' : '') + g + '/' + (mm < 10 ? '0' : '') + mm + '/' + y, hours: Math.round(rnd() * 6000) / 100, rate: services[Math.floor(rnd() * services.length)].rate, attrib: 'SERVIZIO 0', rimborso: false });
      }
      years[y] = { default_rate: services[0].rate, services, payments };
    }
    if (!Object.keys(years).length) years['2026'] = { default_rate: 18, services: [L.svc('S', 18)], payments: [] };
    ops.push(L.op('PROVA ' + String.fromCharCode(65 + (i % 26)) + ' ' + i, years));
  }
  return ops;
}
// calcola nella pagina tutto quello che il motore produce, per confrontare rev 20 e rev 21
const calcolaTutto = (page, dati) => page.evaluate(d => {
  const salva = A.d; A.d = JSON.parse(JSON.stringify(d)); const out = [];
  for (let i = 0; i < A.d.length; i++) { const op = A.d[i]; for (const y of gY(op)) {
    const cl = compLiq(op, y); const co = compOre(op, y); const bk = bkResid(op, y);
    out.push({ op: op.name, y, cl, co, bk });
  } }
  const men = calcMensile(); A.d = salva; return { out, men };
}, dati);

(async () => {
  const browser = await L.chromium.launch();

  // ===================== 1 · RITENUTA DEL TOTALE (somma delle righe) + NON REGRESSIONE =====================
  const ctxA = await L.nuovoContesto(browser, { id: 'r21-a', dati: [] });
  const p21 = await L.nuovaPagina(ctxA); await L.apri(p21);
  const ctxB = await L.nuovoContesto(browser, { id: 'r21-b', dati: [] });
  const p20 = await L.nuovaPagina(ctxB); await p20.goto(URL20, { waitUntil: 'load' }); await p20.waitForTimeout(300); await L.sblocca(p20, '123456');
  let anni = 0, ritDiv = 0, cohDiv = 0, righeDiv = 0, credDiv = 0, bkDiv = 0, altriDiv = 0, cambi20 = 0, menDiv = 0, esempio = '';
  for (let k = 0; k < 12; k++) {
    const dati = datiCasuali(20, 1000 + k);
    const a = await calcolaTutto(p21, dati), b = await calcolaTutto(p20, dati);
    for (let j = 0; j < a.out.length; j++) {
      const x = a.out[j], z = b.out[j]; anni++;
      const somma = R2(x.cl.rows.reduce((s, r) => R2(s + r.rit), 0));
      if (x.cl.totRit !== somma) ritDiv++;
      if (R2(x.cl.totLordo - x.cl.totRit) !== R2(x.cl.totNetto - x.cl.totRimborso)) cohDiv++;
      if (JSON.stringify(x.cl.rows) !== JSON.stringify(z.cl.rows)) righeDiv++;
      if (x.cl.oreRes !== z.cl.oreRes || x.cl.impRes !== z.cl.impRes) credDiv++;
      if (JSON.stringify(x.bk) !== JSON.stringify(z.bk) || JSON.stringify(x.co) !== JSON.stringify(z.co)) bkDiv++;
      const ca = Object.assign({}, x.cl, { totRit: 0, rows: 0 }), cb = Object.assign({}, z.cl, { totRit: 0, rows: 0 });
      if (JSON.stringify(ca) !== JSON.stringify(cb)) altriDiv++;
      if (x.cl.totRit !== z.cl.totRit) { cambi20++; if (!esempio) esempio = `${x.op} ${x.y}: ${String(z.cl.totRit).replace('.', ',')} → ${String(x.cl.totRit).replace('.', ',')}`; }
    }
    if (JSON.stringify(a.men) !== JSON.stringify(b.men)) menDiv++;
  }
  rec('A01', `Ritenuta del TOTALE = somma delle ritenute di riga (${anni} anni casuali)`, '0 diversi', `${ritDiv} diversi`, ritDiv === 0);
  rec('A02', 'Coerenza sui totali: lordo − ritenuta = netto (al netto dei rimborsi)', '0 diversi', `${cohDiv} diversi`, cohDiv === 0);
  rec('A03', 'Le RIGHE non cambiano rispetto alla rev 20', '0 diverse', `${righeDiv} diverse`, righeDiv === 0);
  rec('A04', 'Credito (ore e importo residui) identico alla rev 20', '0 diversi', `${credDiv} diversi`, credDiv === 0);
  rec('A05', 'Motore a secchi (bkResid) e ore (compOre) identici alla rev 20', '0 diversi', `${bkDiv} diversi`, bkDiv === 0);
  rec('A06', 'Tutti gli altri totali di compLiq identici alla rev 20 (cambia solo totRit)', '0 diversi', `${altriDiv} diversi`, altriDiv === 0);
  rec('A07', 'Quanti totali di ritenuta cambiano rispetto alla rev 20', 'qualcuno (di 1-2 centesimi)', `${cambi20} su ${anni}; es. ${esempio}`, cambi20 > 0, 'INFORMATIVO');
  rec('A08', 'Per mese (calcMensile) senza rimborsi: identico alla rev 20', '0 insiemi diversi', `${menDiv} su 12`, menDiv === 0);

  // caso del collaudo: 1+1+1 h a 10,03, 7,5 e 67,5 h a 22,99 → 350,87 (rev 20) / 350,89 (rev 21)
  const gamma = [L.op('GAMMA PROVA', { '2026': { default_rate: 10.03, services: [L.svc('SERV G', 10.03, [3,0,0,0,0,0,0,0,0,0,0,0]), L.svc('SERV G2', 22.99, [0,75,0,0,0,0,0,0,0,0,0,0])], payments: [
    { date: '10/01/2026', hours: 1, rate: 10.03 }, { date: '10/02/2026', hours: 1, rate: 10.03 }, { date: '10/03/2026', hours: 1, rate: 10.03 },
    { date: '20/03/2026', hours: 7.5, rate: 22.99 }, { date: '21/03/2026', hours: 67.5, rate: 22.99 }] } })];
  const leggiTot = async (pg) => { await pg.evaluate(d => { A.d = d; openS(0); }, gamma); await pg.waitForTimeout(150);
    return pg.evaluate(() => { const t = document.querySelectorAll('.year-block')[0].querySelectorAll('table.tbl-dense')[1]; const r = Array.from(t.querySelectorAll('tbody tr')); return Array.from(r[r.length - 1].querySelectorAll('td')).map(td => td.textContent.trim()); }); };
  const t21 = await leggiTot(p21), t20 = await leggiTot(p20);
  rec('A09', 'Scheda, riga TOTALE (caso del collaudo): ritenuta', 'rev 20 € 350,87 → rev 21 € 350,89; lordo − rit = netto', `rev 20 ${t20[5]} · rev 21 ${t21[5]} (lordo ${t21[4]}, netto ${t21[6]})`, num(t20[5]) === 350.87 && num(t21[5]) === 350.89 && R2(num(t21[4]) - num(t21[5])) === num(t21[6]));
  rec('A10', 'Scheda, riga TOTALE: lordo, netto e credito identici alla rev 20', 'identici', `rev 20 ${t20[4]}|${t20[6]}|${t20[9]}|${t20[10]} · rev 21 ${t21[4]}|${t21[6]}|${t21[9]}|${t21[10]}`, t20[4] === t21[4] && t20[6] === t21[6] && t20[9] === t21[9] && t20[10] === t21[10]);
  if (PNG) { const tb = await p21.$$('.year-block table.tbl-dense'); await tb[1].screenshot({ path: path.join(PNG, 'rev21-totale-ritenuta.png') }); }
  // Excel dell'anno: Liquidazioni (SALDO) e Certificazioni
  const fy = await L.scarica(p21, () => p21.evaluate(() => exportYear('2026')));
  const wb = XLSX.read(fs.readFileSync(fy.percorso));
  const liq = XLSX.utils.sheet_to_json(wb.Sheets['Liquidazioni 2026'], { header: 1 });
  const saldo = liq.find(r => typeof r[1] === 'string' && /SALDO/.test(r[1]));
  const sommaRit = R2(liq.filter(r => typeof r[0] === 'number').reduce((s, r) => s + (r[6] || 0), 0));
  rec('A11', 'Excel, foglio Liquidazioni: Rit. del SALDO = somma delle righe', `${sommaRit}`, saldo ? saldo[6] : 'assente', saldo && saldo[6] === sommaRit && sommaRit === 350.89);
  const cert = XLSX.utils.sheet_to_json(wb.Sheets['Certificazioni 2026'], { header: 1 });
  const rc = cert.find(r => r[1] === 'GAMMA PROVA');
  rec('A12', 'Excel, foglio Certificazioni: Ritenuta 20% = 350,89 e Lordo − Ritenuta = Netto', '350,89 · coerente', rc ? `lordo ${rc[3]} rit ${rc[4]} netto ${rc[5]}` : 'assente', rc && rc[4] === 350.89 && R2(rc[3] - rc[4]) === rc[5]);
  const rie = XLSX.utils.sheet_to_json(wb.Sheets['Riepilogo 2026'], { header: 1 });
  const rr = rie.find(r => r[1] === 'GAMMA PROVA');
  rec('A13', 'Excel, foglio Riepilogo: Rit.20% = 350,89', '350,89', rr ? rr[20] : 'assente', rr && rr[20] === 350.89);
  // Per mese: totale generale della ritenuta = somma delle ritenute di riga
  const gm = await p21.evaluate(() => { A.modal = 'mensile'; render(); const tr = Array.from(document.querySelectorAll('.modal tr')).find(t => /TOTALE GENERALE/.test(t.textContent)); const v = tr ? Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim()) : []; A.modal = null; render(); return v; });
  rec('A14', 'Per mese, TOTALE GENERALE: ritenuta = somma delle righe, lordo − rit = netto', '€ 350,89 · coerente', gm.join(' | '), num(gm[2]) === 350.89 && R2(num(gm[1]) - num(gm[2])) === num(gm[3]));
  await ctxB.close();

  // ===================== 6 · RIMBORSO = 80% ANCHE NEI REPORT =====================
  const datiR = [
    L.op('DELTA PROVA', { '2026': { default_rate: 20, services: [L.svc('SERV D', 20, [10,0,0,0,0,0,0,0,0,0,0,0])], payments: [{ date: '05/02/2026', hours: 10, rate: 20, rimborso: true }] } }),
    L.op('EPSILON PROVA', { '2026': { default_rate: 20.5, services: [L.svc('SERV E', 20.5, [0,12,0,0,0,0,0,0,0,0,0,0])], payments: [{ date: '05/02/2026', hours: 7.3, rate: 20.5 }] } }),
  ];
  const ctxR = await L.nuovoContesto(browser, { id: 'r21-r', dati: datiR });
  const pR = await L.nuovaPagina(ctxR); await L.apri(pR);
  const ctxR0 = await L.nuovoContesto(browser, { id: 'r21-r0', dati: datiR });
  const pR0 = await L.nuovaPagina(ctxR0); await pR0.goto(URL20, { waitUntil: 'load' }); await pR0.waitForTimeout(300); await L.sblocca(pR0, '123456');
  const scheda = async (pg) => { await pg.evaluate(() => openS(A.d.findIndex(o => o.name === 'DELTA PROVA'))); await pg.waitForTimeout(100);
    return pg.evaluate(() => { const t = document.querySelectorAll('.year-block')[0].querySelectorAll('table.tbl-dense')[1]; return Array.from(t.querySelectorAll('tbody tr')[0].querySelectorAll('td')).map(td => td.querySelector('input') ? td.querySelector('input').value : td.textContent.trim()); }); };
  const sR = await scheda(pR), sR0 = await scheda(pR0);
  rec('B01', 'Scheda: 10 h × 20 € col pallino → netto 160 (come la rev 20)', '€ 160,00 in entrambe', `rev 20 ${sR0[6]} · rev 21 ${sR[6]}`, num(sR[6]) === 160 && num(sR0[6]) === 160);
  rec('B02', 'Scheda: credito dopo il rimborso identico alla rev 20', 'identico', `rev 20 ${sR0[9]} / ${sR0[10]} · rev 21 ${sR[9]} / ${sR[10]}`, sR[9] === sR0[9] && sR[10] === sR0[10]);
  const pdR = async (pg) => { const f = await L.scarica(pg, () => pg.evaluate(() => exportByDate('05/02/2026', '05/02/2026'))); return XLSX.utils.sheet_to_json(XLSX.read(fs.readFileSync(f.percorso)).Sheets['Report liquidazioni'], { header: 1 }); };
  const ar = await pdR(pR), ar0 = await pdR(pR0);
  const rD = ar.find(r => r[2] === 'DELTA PROVA'), rD0 = ar0.find(r => r[2] === 'DELTA PROVA');
  const rE = ar.find(r => r[2] === 'EPSILON PROVA'), rE0 = ar0.find(r => r[2] === 'EPSILON PROVA');
  rec('B03', 'Per data (Excel): rimborso → lordo 0, rit 0, netto 160 (rev 20: 200)', 'netto 160', `rev 20 ${rD0[7]}/${rD0[8]}/${rD0[9]} · rev 21 ${rD[7]}/${rD[8]}/${rD[9]}`, rD[7] === 0 && rD[8] === 0 && rD[9] === 160 && rD0[9] === 200);
  rec('B04', 'Per data (Excel): pagamento SENZA pallino identico alla rev 20', 'identico', `rev 20 ${rE0.slice(7, 10).join('/')} · rev 21 ${rE.slice(7, 10).join('/')}`, JSON.stringify(rE.slice(5, 11)) === JSON.stringify(rE0.slice(5, 11)));
  const tD = ar.find(r => typeof r[2] === 'string' && /^TOTALI/.test(r[2]));
  rec('B05', 'Per data (Excel): TOTALI con il netto nuovo', 'lordo 149,65 rit 29,93 netto 279,72', `${tD[7]} / ${tD[8]} / ${tD[9]}`, tD[7] === 149.65 && tD[8] === 29.93 && tD[9] === R2(160 + 119.72));
  const men = async (pg) => pg.evaluate(() => { A.modal = 'mensile'; render(); const rows = Array.from(document.querySelectorAll('.modal tbody tr')).map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim())); const nota = (Array.from(document.querySelectorAll('.modal p')).pop() || {}).textContent; return { rows, nota }; });
  const m21 = await men(pR), m20 = await men(pR0);
  const feb = m21.rows.find(r => /^Feb\S* 2026/.test(r[0])), feb0 = m20.rows.find(r => /^Feb\S* 2026/.test(r[0]));
  rec('B06', 'Per mese: febbraio, netto = 119,72 + 160 e «di cui rimborsi» 160', 'Netto € 279,72 · di cui rimborsi € 160,00', `rev 20 ${feb0.slice(1, 5).join(' | ')} · rev 21 ${feb.slice(1, 5).join(' | ')}`, num(feb[3]) === 279.72 && num(feb[4]) === 160 && num(feb[1]) === num(feb0[1]) && num(feb[2]) === num(feb0[2]));
  rec('B07', 'Per mese: la nota in fondo NON è stata toccata (resta vera)', 'identica alla rev 20', m21.nota, m21.nota === m20.nota && /il loro netto è incluso nella colonna Netto/.test(m21.nota));
  const fm = await L.scarica(pR, () => pR.evaluate(() => exportMensile()));
  const am = XLSX.utils.sheet_to_json(XLSX.read(fs.readFileSync(fm.percorso)).Sheets['Riepilogo mensile'], { header: 1 });
  const fx = am.find(r => /^Feb\S* 2026/.test(String(r[0])));
  rec('B08', 'Per mese (Excel): netto 279,72 e di cui rimborsi 160', '279,72 · 160', fx ? fx.join(' | ') : 'assente', fx && fx[3] === 279.72 && fx[4] === 160);
  await pR.evaluate(() => { A.modal = null; render(); });
  const fyR = await L.scarica(pR, () => pR.evaluate(() => exportYear('2026')));
  const lq = XLSX.utils.sheet_to_json(XLSX.read(fs.readFileSync(fyR.percorso)).Sheets['Liquidazioni 2026'], { header: 1 });
  const lqD = lq.find(r => r[1] === 'DELTA PROVA');
  rec('B09', 'Excel dell\'anno (scheda): rimborso netto 160, come prima', '160', lqD ? `${lqD[5]}/${lqD[6]}/${lqD[7]} rimborso ${lqD[8]}` : 'assente', lqD && lqD[7] === 160);
  await ctxR0.close(); await ctxR.close();

  // ===================== 2 + 5 · FOGLI ORE: omonimi «TS ?», light sommati, anno testo =====================
  const P = 'spazio-ireos-foglio-ore';
  const z13 = () => [0,0,0,0,0,0,0,0,0,0,0,0,0];
  const lh = (m) => { const a = z13(); for (const k in m) a[k] = m[k]; return a; };
  const docs = {
    'users/ADMIN0001': { role: 'admin', name: 'AMMINISTRAZIONE PROVA', email: 'spazioireos@gmail.com' },
    'users/U5': { role: 'worker', cognome: 'BIANCHI', nome: 'ANNA', name: 'BIANCHI ANNA' },
    'users/U6': { role: 'worker', cognome: 'BIANCHI', nome: 'ANNA', name: 'BIANCHI ANNA' },
    'users/U9': { role: 'worker', cognome: 'GIALLI', nome: 'ELIA', name: 'GIALLI ELIA' },
    'users/U10': { role: 'worker', cognome: 'ROSA', nome: 'IVO', name: 'ROSA IVO' },
    'users/U11': { role: 'editor', cognome: 'ROSA', nome: 'IVO', name: 'ROSA IVO' },
    'users/U12': { role: 'worker', cognome: 'TESTO', nome: 'ANNO', name: 'TESTO ANNO' },
    'timesheets/U5__2026_2_0': { workerUid: 'U5', year: 2026, month: 2, days: { 3: { t1f: '9:00', t1t: '12:00' } } },
    'timesheets/U6__2026_2_0': { workerUid: 'U6', year: 2026, month: 2, days: { 4: { t1f: '9:00', t1t: '14:00' } } },
    'timesheets/U9__2026_3_0': { workerUid: 'U9', year: 2026, month: 3, days: { 2: { t1f: '9:00', t1t: '11:00' } } },
    'timesheets/U12__2026_3_0': { workerUid: 'U12', year: '2026', month: '3', days: { 2: { t1f: '9:00', t1t: '12:30' } } },
    'timesheets/U12__2026_4_0': { workerUid: 'U12', year: '2026', month: '04', days: { 7: { t1f: '8:00', t1t: '10:00' } } },
    'timesheets/U12__2026_5_0': { workerUid: 'U12', year: 2026, month: 5, days: { 7: { t1f: '8:00', t1t: '9:00' } } },
    'lightsheets/L1': { name: 'VERDI GIULIA', materia: 'MATEMATICA', hours: { 2026: lh({ 0: 2, 5: 3, 7: 4 }) } },
    'lightsheets/L2': { name: 'VERDI GIULIA', materia: 'ITALIANO', hours: { 2026: lh({ 0: 4, 6: 2 }) } },
    'lightsheets/L3': { name: 'GIALLI ELIA', materia: 'INGLESE', hours: { 2026: lh({ 2: 5 }) } },
  };
  const fakeSeed = { id: 'r21-ts', [P]: { reset: true, users: [{ email: 'spazioireos@gmail.com', password: 'prova123', uid: 'ADMIN0001' }], docs, session: { email: 'spazioireos@gmail.com', app: 'fogliore' } } };
  const yr = () => ({ '2026': { default_rate: 18, services: [L.svc('S', 18)], payments: [] } });
  const nomiTS = ['BIANCHI ANNA', 'VERDI GIULIA', 'GIALLI ELIA', 'ROSA IVO', 'TESTO ANNO'];
  const tsTest = async (url, id) => {
    const ctx = await L.nuovoContesto(browser, { id, dati: nomiTS.map(n => L.op(n, yr())), fakeSeed });
    const pg = await L.nuovaPagina(ctx); await pg.goto(url, { waitUntil: 'load' }); await pg.waitForTimeout(300); await L.sblocca(pg, '123456'); await pg.waitForTimeout(500);
    const r = {};
    for (const n of nomiTS) {
      r[n] = await pg.evaluate(async n => { openS(A.d.findIndex(o => o.name === n));
        for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 100)); if (!Object.keys(FOpending).some(k => FOpending[k]) && Object.keys(FOcacheAnno).length) break; }
        await new Promise(r => setTimeout(r, 150));
        return Array.from(document.querySelectorAll('.year-block th.month-hdr')).map(t => { const s = t.querySelector('.fo-sugg'); return s ? s.textContent : ''; }); }, n);
    }
    const st = await pg.evaluate(() => foStato);
    const scr = await pg.evaluate(() => __fakefb.log.filter(o => /set|update|delete|batch|add/.test(o.op)).length);
    return { r, st, scr, ctx, pg };
  };
  const T21 = await tsTest(URL21, 'r21-ts-21'), T20 = await tsTest(URL20, 'r21-ts-20');
  const mostra = (a) => a.map((x, i) => x ? `${['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'][i]} ${x}` : '').filter(x => x).join(' · ') || 'nessuno';
  rec('C00', 'Collegato a Fogli ore (finta Firebase)', 'collegato', `rev 21 ${T21.st} · rev 20 ${T20.st}`, T21.st === 'collegato' && T20.st === 'collegato');
  rec('C01', 'Due ACCOUNT con nome IDENTICO «BIANCHI ANNA» → «TS ?»', 'rev 20: TS 8 (sommati) → rev 21: TS ? su tutti i mesi', `rev 20 ${mostra(T20.r['BIANCHI ANNA'])} · rev 21 ${T21.r['BIANCHI ANNA'].filter(x => x)[0]} ×${T21.r['BIANCHI ANNA'].filter(x => x).length}`, T21.r['BIANCHI ANNA'].every(x => x === 'TS ?') && T20.r['BIANCHI ANNA'][1] === 'TS 8');
  rec('C02', 'Light con DUE righe-materia (stesso nome) → si sommano ancora', 'Gen TS 6 · Giu TS 5 · Lug TS 4', mostra(T21.r['VERDI GIULIA']), mostra(T21.r['VERDI GIULIA']) === 'Gen TS 6 · Giu TS 5 · Lug TS 4');
  rec('C03', 'Un account + una riga light con lo stesso nome → si sommano (non è un omonimo fra account)', 'Mar TS 7 (2 + 5), come la rev 20', `rev 20 ${mostra(T20.r['GIALLI ELIA'])} · rev 21 ${mostra(T21.r['GIALLI ELIA'])}`, mostra(T21.r['GIALLI ELIA']) === 'Mar TS 7' && mostra(T20.r['GIALLI ELIA']) === 'Mar TS 7');
  rec('C04', 'Due account omonimi SENZA ore nell\'anno → niente (nessun «TS ?» inutile)', 'nessuno', mostra(T21.r['ROSA IVO']), T21.r['ROSA IVO'].every(x => !x));
  rec('C05', 'Anno scritto come testo ("2026") e mese testo ("3", "04") → letti', 'rev 20: solo Mag TS 1 → rev 21: Mar TS 3,5 · Apr TS 2 · Mag TS 1', `rev 20 ${mostra(T20.r['TESTO ANNO'])} · rev 21 ${mostra(T21.r['TESTO ANNO'])}`, mostra(T21.r['TESTO ANNO']) === 'Mar TS 3,5 · Apr TS 2 · Mag TS 1');
  rec('C06', 'Nessuna scrittura su Fogli ore', '0', `rev 21 ${T21.scr}`, T21.scr === 0);
  if (PNG) { await T21.pg.evaluate(() => openS(A.d.findIndex(o => o.name === 'BIANCHI ANNA'))); await T21.pg.waitForTimeout(200);
    const thead = await T21.pg.$('.year-block table.tbl-dense thead'); if (thead) await thead.screenshot({ path: path.join(PNG, 'rev21-ts-omonimi.png') }); }
  rec('C99', 'Nessun errore di pagina (Fogli ore)', '0', T21.pg._errori.join('|') || '0', T21.pg._errori.length === 0);
  await T21.ctx.close(); await T20.ctx.close();

  // ===================== 3 · IMPORT: rotti rifiutati, veri accettati, rete di sicurezza =====================
  const base = [L.op('ALFA PROVA', { '2026': { default_rate: 20.5, services: [L.svc('SERVIZIO A', 20.5, [4,0,0,0,0,0,0,0,0,0,0,0])], payments: [] } })];
  const importa = async (cont, risposte, prepara) => {
    const ctx = await L.nuovoContesto(browser, { id: 'imp-' + Math.random(), dati: base });
    const pg = await L.nuovaPagina(ctx); await L.apri(pg);
    if (prepara) await pg.evaluate(prepara);
    const prima = await L.ls(pg, 'spazioireos_opoc');
    (risposte || [true]).forEach(r => pg._risposte.push(r));
    const [fc] = await Promise.all([pg.waitForEvent('filechooser'), pg.evaluate(() => impJSON())]);
    await fc.setFiles({ name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(cont) });
    await pg.waitForTimeout(500);
    const dopo = await L.ls(pg, 'spazioireos_opoc');
    const msgs = pg._dialoghi.map(d => d.msg.replace(/\n+/g, ' '));
    const cover = !!(await pg.$('.cover-header'));
    let scheda = false; try { await pg.evaluate(() => openS(0)); scheda = !!(await pg.$('.sheet-header')); } catch (e) {}
    await pg.reload(); await L.sblocca(pg, '123456'); await pg.waitForTimeout(300);
    const dopoRic = !!(await pg.$('.cover-header'));
    const r = { prima, dopo, msgs, cover, scheda, dopoRic, errori: pg._errori.slice(), d: JSON.parse(dopo || 'null') };
    await ctx.close(); return r;
  };
  const rotti = [
    ['[{"name":"X"}]', '[{"name":"X"}]'],
    ['years testo', '[{"name":"X","years":"abc"}]'],
    ['anno non oggetto', '[{"name":"X","years":{"2026":5}}]'],
    ['services non elenco', '[{"name":"X","years":{"2026":{"services":5}}}]'],
    ['hours mancanti', '[{"name":"X","years":{"2026":{"services":[{"name":"S","rate":18}],"payments":[]}}}]'],
    ['pagamento null', '[{"name":"X","years":{"2026":{"services":[],"payments":[null]}}}]'],
    ['nome numero', '[{"name":5,"sheet":"X","years":{"2026":{"services":[],"payments":[]}}}]'],
    ['opoc-3 con operatore rotto', JSON.stringify({ formato: 'opoc-3', versione: 3, operatori: [{ name: 'X', years: { '2026': { services: [{ name: 'S' }] } } }] })],
  ];
  let n = 0;
  for (const [nome, cont] of rotti) {
    n++; const r = await importa(cont);
    const ok = r.dopo === r.prima && r.msgs.some(m => /Formato non valido/.test(m)) && r.dopoRic && r.errori.length === 0;
    rec('D0' + n, 'Import rotto «' + nome + '»: rifiutato, archivio intatto', 'rifiutato con motivo', `${r.dopo === r.prima ? 'intatto' : 'SOSTITUITO'}; «${(r.msgs.find(m => /Errore/.test(m)) || '').slice(0, 110)}»; ricarica ${r.dopoRic ? 'ok' : 'BIANCA'}`, ok);
  }
  // backup veri
  const vero = [L.op('BETA PROVA', { '2025': { default_rate: 18, services: [L.svc('S1', 18, [1,2,0,0,0,0,0,0,0,0,0,0])], payments: [{ date: '10/03/2025', hours: 2, rate: 18, attrib: 'S1' }] }, '2026': { default_rate: 18, services: [L.svc('S1', 18)], payments: [] } }, { anag: { cognome: 'BETA', nome: 'PROVA' } }),
    L.op('GAMMA PROVA', { '2026': { default_rate: 22.99, services: [L.svc('S2', 22.99, [0,10,0,0,0,0,0,0,0,0,0,0])], payments: [{ date: '01/03/2026', hours: 10, rate: 22.99, rimborso: true }] } })];
  let r = await importa(JSON.stringify(vero));
  rec('D11', 'Backup vero «elenco nudo» (formato del salvataggio automatico): accettato', '2 collaboratori, dati identici', `${r.d && r.d.length} collaboratori; identici ${JSON.stringify(r.d) === JSON.stringify(vero)}; scheda ${r.scheda}`, r.d && r.d.length === 2 && JSON.stringify(r.d) === JSON.stringify(vero) && r.scheda && r.dopoRic);
  r = await importa(JSON.stringify({ formato: 'opoc-3', versione: 3, creato: '2026-11-19T10:00:00Z', operatori: vero, modello: null, listino: [{ nome: 'SERVIZIO PROVA', rate: 21 }], belfiore: {} }));
  rec('D12', 'Backup vero «opoc-3»: accettato', '2 collaboratori', `${r.d && r.d.length}; ${(r.msgs.find(m => /Errore/.test(m)) || 'nessun errore')}`, r.d && r.d.length === 2 && r.scheda && r.dopoRic);
  const minimi = [{ name: 'DELTA PROVA', sheet: 'DELTA PROVA', years: { '2026': { default_rate: 19, services: [{ name: 'S', hours: [1,0,0,0,0,0,0,0,0,0,0,0] }] } } }];
  r = await importa(JSON.stringify(minimi));
  const y26 = r.d && r.d[0].years['2026'];
  rec('D13', 'Backup storico senza «payments» e senza tariffa del servizio: completato come nel caricamento (ld)', 'payments [] e tariffa 19', y26 ? `payments ${JSON.stringify(y26.payments)} · tariffa ${y26.services[0].rate}` : 'rifiutato', y26 && Array.isArray(y26.payments) && y26.services[0].rate === 19 && r.scheda);
  const antico = [{ name: 'EPSILON PROVA', sheet: 'EPSILON PROVA', rate_2025: 17, services_2025: [{ name: 'S', hours: [3,0,0,0,0,0,0,0,0,0,0,0], residual: 0 }], ore_liq_2025: [0,0,2,0,0,0,0,0,0,0,0,0], liq_dates_2025: ['', '', '15/03/2025'] }];
  r = await importa(JSON.stringify(antico));
  const y25 = r.d && r.d[0].years && r.d[0].years['2025'];
  rec('D14', 'Backup antichissimo (rate_2025 al posto di years): convertito come in ld', 'anno 2025, tariffa 17, 1 liquidazione da 2 h', y25 ? `tariffa ${y25.services[0].rate}, liquidazioni ${JSON.stringify(y25.payments)}` : 'rifiutato', y25 && y25.services[0].rate === 17 && y25.payments.length === 1 && y25.payments[0].hours === 2 && r.scheda);
  // rete di sicurezza: si spengono le due difese a monte e si fa cadere il primo disegno
  r = await importa('[{"name":"X"}]', [true], () => { window.strutturaOperatori = function () { return true; }; window.provaDisegno = function () { return ''; }; });
  rec('D15', 'Rete di sicurezza: se il primo disegno dopo l\'import va in errore si rimette tutto com\'era', 'archivio intatto, avviso «Import annullato», copertina anche dopo la ricarica', `${r.dopo === r.prima ? 'intatto' : 'SOSTITUITO'}; «${(r.msgs.find(m => /Import annullato/.test(m)) || 'nessun avviso').slice(0, 90)}»; copertina ${r.cover}; ricarica ${r.dopoRic}`, r.dopo === r.prima && r.msgs.some(m => /Import annullato/.test(m)) && r.cover && r.dopoRic);

  // ===================== 4 · DATE IMPOSSIBILI =====================
  const datiD = [L.op('ZETA PROVA', { '2026': { default_rate: 20, services: [L.svc('S', 20, [5,0,0,0,0,0,0,0,0,0,0,0])], payments: [{ date: '15/01/2026', hours: 2, rate: 20 }] } })];
  const ctxD = await L.nuovoContesto(browser, { id: 'r21-d', dati: datiD });
  const pD = await L.nuovaPagina(ctxD); await L.apri(pD);
  const pf = await pD.evaluate(() => [['31/02/2026'], ['29/02/2026'], ['29/02/2028'], ['31/04/2026'], ['30/04/2026'], ['310226'], ['1/3/26']].map(x => { const d = parseDT(x[0]); return x[0] + '→' + (d ? normDT(x[0]) : 'null'); }));
  rec('E01', 'parseDT: i giorni che non esistono danno null (31/02, 29/02/2026, 31/04, 310226)', '31/02→null 29/02/2026→null 29/02/2028→29/02/2028 31/04→null 30/04→30/04 310226→null 1/3/26→01/03/2026', pf.join(' '), pf.join(' ') === '31/02/2026→null 29/02/2026→null 29/02/2028→29/02/2028 31/04/2026→null 30/04/2026→30/04/2026 310226→null 1/3/26→01/03/2026');
  await pD.evaluate(() => openS(0));
  const di = await pD.$('.date-cell input');
  await di.fill('31/02/2026'); await di.press('Tab'); await pD.waitForTimeout(150);
  const vd = await di.inputValue();
  const toastD = await pD.evaluate(() => { const t = document.getElementById('toast'); return t ? t.textContent : ''; });
  const datoD = await pD.evaluate(() => A.d[0].years['2026'].payments[0].date);
  rec('E02', 'Liquidazione: «31/02/2026» rifiutata, la casella resta com\'era (15/01/2026)', 'casella 15/01/2026, dato 15/01/2026, avviso', `casella ${vd}; dato ${datoD}; avviso «${toastD}»`, vd === '15/01/2026' && datoD === '15/01/2026' && /Data impossibile/.test(toastD));
  if (PNG) { await pD.evaluate(() => { const t = document.getElementById('toast'); if (t) t.style.transition = 'none'; }); await pD.screenshot({ path: path.join(PNG, 'rev21-data-impossibile.png'), clip: { x: 0, y: 0, width: 1500, height: 950 } }); }
  await pD.waitForTimeout(2300);
  const di2 = await pD.$('.date-cell input');
  await di2.fill('1/3/26'); await di2.press('Tab'); await pD.waitForTimeout(150);
  const vd2 = await di2.inputValue(), dato2 = await pD.evaluate(() => A.d[0].years['2026'].payments[0].date);
  await di2.fill('30/02/2026'); await di2.press('Tab'); await pD.waitForTimeout(150);
  const vd3 = await di2.inputValue(), dato3 = await pD.evaluate(() => A.d[0].years['2026'].payments[0].date);
  rec('E03', 'Una data vera entra come prima (1/3/26 → 01/03/2026) e una impossibile dopo torna a QUELLA', '01/03/2026 e poi ancora 01/03/2026', `${vd2}/${dato2} → ${vd3}/${dato3}`, vd2 === '01/03/2026' && dato2 === '01/03/2026' && vd3 === '01/03/2026' && dato3 === '01/03/2026');
  await di2.fill('abc'); await di2.press('Tab'); await pD.waitForTimeout(150);
  const vd4 = await di2.inputValue(), col4 = await di2.evaluate(e => e.style.color);
  rec('E04', 'Un testo che non è una data resta come prima (in rosso, non è «impossibile»)', 'abc in rosso', `${vd4} ${col4}`, vd4 === 'abc' && /198, 40, 40|c62828/.test(col4));
  // report Per data con data impossibile
  await pD.evaluate(() => { A.modal = 'report'; render(); toggleRepMode('single'); });
  const rf = await pD.$('#repFrom'); await rf.fill('31/02/2026'); await rf.press('Tab'); await pD.waitForTimeout(150);
  const vRep = await rf.inputValue();
  await rf.fill('31/02/2026'); const nd0 = pD._dialoghi.length; let dl = null; pD.once('download', d => dl = d);
  await pD.evaluate(() => doReport()); await pD.waitForTimeout(400);
  const msgR = pD._dialoghi.slice(nd0).map(d => d.msg).join(' / ');
  rec('E05', 'Report Per data: 31/02 rifiutata (casella torna vuota; con doReport «Date non valide», nessun file)', 'nessun file', `casella «${vRep}»; ${msgR || 'nessun avviso'}${dl ? ' + FILE ' + dl.suggestedFilename() : ''}`, vRep === '' && !dl && /non valide/i.test(msgR));
  await pD.evaluate(() => { A.modal = null; render(); });
  // anagrafica: data di nascita impossibile
  const an = await pD.evaluate(() => { openS(0); A.anagOpen = true; render(); const inp = Array.from(document.querySelectorAll('input[placeholder="gg/mm/aaaa"]')).find(i => /anagSet\(0,'dataNascita'/.test(i.getAttribute('onchange') || '')); if (!inp) return 'campo non trovato'; inp.value = '30/02/1990'; inp.dispatchEvent(new Event('change')); const v1 = inp.value; const d1 = (A.d[0].anag || {}).dataNascita || ''; inp.value = '28/02/1990'; inp.dispatchEvent(new Event('change')); return v1 + ' | dato «' + d1 + '» | poi ' + inp.value + ' dato ' + A.d[0].anag.dataNascita; });
  rec('E06', 'Anagrafica: data di nascita 30/02/1990 rifiutata, 28/02/1990 accettata', '« | dato «» | poi 28/02/1990 dato 28/02/1990»', an, an === ' | dato «» | poi 28/02/1990 dato 28/02/1990');
  rec('E99', 'Nessun errore di pagina (date)', '0', pD._errori.join('|') || '0', pD._errori.length === 0);
  await ctxD.close();

  // ===================== GRAFICA: niente scorrimento laterale nuovo, righe dense invariate =====================
  const datiG = datiCasuali(6, 77);
  const misura = async (url, w) => {
    const ctx = await L.nuovoContesto(browser, { id: 'g-' + w + Math.random(), dati: datiG, viewport: { width: w, height: 900 } });
    const pg = await L.nuovaPagina(ctx); await pg.goto(url, { waitUntil: 'load' }); await pg.waitForTimeout(300); await L.sblocca(pg, '123456'); await pg.waitForTimeout(200);
    const cov = await pg.evaluate(() => document.documentElement.scrollWidth);
    await pg.evaluate(() => openS(0)); await pg.waitForTimeout(200);
    const sh = await pg.evaluate(() => ({ w: document.documentElement.scrollWidth, righe: Array.from(document.querySelectorAll('table.tbl-dense tbody tr')).map(t => Math.round(t.getBoundingClientRect().height)).join('·') }));
    await ctx.close(); return { cov, sw: sh.w, righe: sh.righe };
  };
  for (const w of [390, 1280]) {
    const a = await misura(URL21, w), b = await misura(URL20, w);
    rec('G' + w, `Grafica a ${w}px: larghezza di pagina e righe dense come la rev 20`, `rev 20 cop ${b.cov} scheda ${b.sw}`, `rev 21 cop ${a.cov} scheda ${a.sw}; righe ${a.righe === b.righe ? 'identiche' : 'DIVERSE ' + a.righe + ' / ' + b.righe}`, a.cov === b.cov && a.sw === b.sw && a.righe === b.righe && a.cov <= w);
  }
  rec('Z99', 'Nessun errore di pagina (ritenuta)', '0', p21._errori.join('|') || '0', p21._errori.length === 0);
  await browser.close();
  L.riepilogo('col-rev21');
})().catch(e => { console.error('ERRORE SCRIPT', e); process.exit(2); });
