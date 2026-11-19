// col-a01-ts.cjs — suggerimenti «TS N» dai Fogli ore (finta Firebase, SOLA LETTURA): login admin,
// operatori normali (formati orari storici, assenza una volta) e light (giugno inv+est, più materie),
// omonimi «TS ?», scollegato niente, nessuna cella riempita, nessuna scrittura su Fogli ore,
// backup senza «firebase», lettura caduta. SOLO DATI INVENTATI.
const L = require('./col-a01-lib.cjs');
const { rec } = L;
const fs = require('fs');
const P = 'spazio-ireos-foglio-ore';
const z13 = () => [0,0,0,0,0,0,0,0,0,0,0,0,0];
const lh = (m) => { const a = z13(); for (const k in m) a[k] = m[k]; return a; };
const docs = {
  'users/ADMIN0001': { role: 'admin', name: 'AMMINISTRAZIONE PROVA', email: 'spazioireos@gmail.com' },
  'users/U1': { role: 'worker', cognome: 'ROSSI', nome: 'MARIO', name: 'ROSSI MARIO' },
  'users/U3': { role: 'worker', cognome: 'FERRARÈ', nome: 'LUCA', name: 'FERRARÈ LUCA' },
  'users/U4': { role: 'editor', cognome: "FERRARE'", nome: 'LUCA', name: "FERRARE' LUCA" },
  'users/U5': { role: 'worker', cognome: 'BIANCHI', nome: 'ANNA', name: 'BIANCHI ANNA' },
  'users/U6': { role: 'worker', cognome: 'BIANCHI', nome: 'ANNA', name: 'BIANCHI ANNA' },
  'users/U7': { role: 'viewer', cognome: 'NERI', nome: 'PAOLO', name: 'NERI PAOLO' },
  'users/U8': { role: 'worker', cognome: 'NICOLÒ', nome: 'SARA', name: 'NICOLÒ SARA' },
  'timesheets/U1__2026_1_0': { workerUid: 'U1', year: 2026, month: 1, days: { 2: { t1f: '9:00', t1t: '13:00' }, 5: { t1f: '900', t1t: '1100', perm: '2', pausa: '1', spole: '1', nonImp: '1' }, 8: { absence: 'FERIE' } } },
  'timesheets/U1__2026_1_1': { workerUid: 'U1', year: 2026, month: 1, days: { 2: { t1f: '14.30', t1t: '15h30' }, 8: { absence: 'FERIE', t1f: '9', t1t: '12' } } },
  'timesheets/U1__2026_3_0': { workerUid: 'U1', year: 2026, month: 3, days: { 10: { t1f: '8:00', t1t: '12:00', t2f: '13:00', t2t: '17:00' } } },
  'timesheets/U1__2026_4_0': { workerUid: 'U1', year: 2026, month: 4, days: { 3: { t1f: '0', t1t: '130' }, 4: { iF: '9:00', iT: '10:30' } } },
  'timesheets/U1__2026_6_0': { workerUid: 'U1', year: '2026', month: '6', days: { 1: { t1f: '9:00', t1t: '10:00' } } },
  'timesheets/U1__2025_1_0': { workerUid: 'U1', year: 2025, month: 1, days: { 7: { t1f: '9:00', t1t: '11:00' } } },
  'timesheets/U3__2026_2_0': { workerUid: 'U3', year: 2026, month: 2, days: { 3: { t1f: '9:00', t1t: '12:00' } } },
  'timesheets/U4__2026_2_0': { workerUid: 'U4', year: 2026, month: 2, days: { 4: { t1f: '9:00', t1t: '10:00' } } },
  'timesheets/U5__2026_2_0': { workerUid: 'U5', year: 2026, month: 2, days: { 3: { t1f: '9:00', t1t: '12:00' } } },
  'timesheets/U6__2026_2_0': { workerUid: 'U6', year: 2026, month: 2, days: { 4: { t1f: '9:00', t1t: '14:00' } } },
  'timesheets/U7__2026_2_0': { workerUid: 'U7', year: 2026, month: 2, days: { 3: { t1f: '9:00', t1t: '12:00' } } },
  'timesheets/U8__2026_9_0': { workerUid: 'U8', year: 2026, month: 9, days: { 3: { t1f: '9:00', t1t: '11:00' } } },
  'lightsheets/L1': { name: 'VERDI GIULIA', hours: { 2026: lh({ 0: 2, 5: 3, 7: 4 }) } },
  'lightsheets/L2': { name: 'VERDI GIULIA', hours: { 2026: lh({ 0: 4, 6: 2 }) } },
};
const fakeSeed = { id: 'ts-1', [P]: { reset: true, users: [{ email: 'spazioireos@gmail.com', password: 'prova123', uid: 'ADMIN0001' }], docs } };
const yr = { '2026': { default_rate: 18, services: [{ name: 'S', residual: 0, hours: [0,0,0,0,0,0,0,0,0,0,0,0], rate: 18 }], payments: [] } };
const nomi = ['ROSSI MARIO', 'VERDI GIULIA', 'FERRARE LUCA', 'BIANCHI ANNA', 'NERI PAOLO', 'SCONOSCIUTO NESSUNO', 'NICOLO SARA'];
const seed = nomi.map(n => L.op(n, JSON.parse(JSON.stringify(yr))));
const atteso = {
  'ROSSI MARIO': { 0: '7', 2: '8', 3: '3', 5: '1' },
  'VERDI GIULIA': { 0: '6', 5: '5', 6: '4' },
  'NICOLO SARA': { 8: '2' },
};
(async () => {
  const browser = await L.chromium.launch();
  const ctx = await L.nuovoContesto(browser, { id: 'ts-col-1', dati: seed, fakeSeed });
  const page = await L.nuovaPagina(ctx);
  await L.apri(page);
  const ts = (n) => page.evaluate(async n => {
    openS(A.d.findIndex(o => o.name === n));
    for (let i = 0; i < 30; i++) { await new Promise(r => setTimeout(r, 100)); if (!Object.keys(FOpending).some(k => FOpending[k])) break; }
    await new Promise(r => setTimeout(r, 150));
    const th = document.querySelectorAll('.year-block th.month-hdr');
    return Array.from(th).map(t => { const s = t.querySelector('.fo-sugg'); return s ? s.textContent : ''; });
  }, n);
  // scollegato
  let t0 = await ts('ROSSI MARIO');
  rec('F01', 'Scollegato: nessun «TS»', '12 mesi vuoti', t0.filter(x => x).join(',') || 'nessuno', t0.every(x => !x));
  await page.evaluate(() => { A.v = 'cover'; render(); });
  const btn = await page.textContent('button[onclick="foLogin()"]');
  rec('F02', 'Pulsante «☁ Collega Fogli ore» nel gruppo FOGLI ORE', 'presente', btn, /Collega Fogli ore/.test(btn));
  // password sbagliata
  page._risposte.push('spazioireos@gmail.com', 'sbagliata');
  await page.click('button[onclick="foLogin()"]'); await page.waitForTimeout(500);
  const al = page._dialoghi.slice(-1)[0];
  rec('F03', 'Login con password sbagliata', 'alert «Accesso non riuscito», non collegato', `${al.msg.slice(0, 60)} / stato ${await page.evaluate(() => foStato)}`, /Accesso non riuscito/.test(al.msg) && (await page.evaluate(() => foStato)) !== 'collegato');
  // login giusto
  page._risposte.push('spazioireos@gmail.com', 'prova123');
  await page.click('button[onclick="foLogin()"]'); await page.waitForTimeout(600);
  const st = await page.evaluate(() => foStato);
  const btn2 = await page.evaluate(() => { const b = document.querySelector('button[onclick="foLogout()"]'); return b ? b.textContent : ''; });
  rec('F04', 'Login admin', 'collegato, pulsante «☁ Fogli ore ✓»', `${st} / ${btn2}`, st === 'collegato' && /Fogli ore ✓/.test(btn2));
  const datiPrima = await L.ls(page, 'spazioireos_opoc');
  for (const n of Object.keys(atteso)) {
    const t = await ts(n);
    const exp = Array.from({ length: 12 }, (_, i) => atteso[n][i] ? 'TS ' + atteso[n][i] : '');
    const ok = JSON.stringify(t) === JSON.stringify(exp);
    rec('F-' + n.split(' ')[0], 'TS per ' + n, exp.map((x, i) => x ? `${['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'][i]} ${x}` : '').filter(x => x).join(' · '), t.map((x, i) => x ? `${['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'][i]} ${x}` : '').filter(x => x).join(' · ') || 'nessuno', ok);
  }
  let t = await ts('FERRARE LUCA');
  rec('F10', 'Omonimi per accento/apostrofo (FERRARÈ / FERRARE\') → «TS ?»', 'TS ? su tutti i mesi, nessun numero', t.filter(x => x)[0] + ' ×' + t.filter(x => x).length, t.every(x => x === 'TS ?'));
  t = await ts('BIANCHI ANNA');
  rec('F11', 'Omonimi IDENTICI (due account «BIANCHI ANNA») → «TS ?»', 'TS ? (non indovinare / non sommare)', t.filter(x => x).join(',') || 'nessuno', t.every(x => x === 'TS ?'));
  t = await ts('NERI PAOLO');
  rec('F12', 'Utente con ruolo viewer: escluso', 'nessun TS', t.filter(x => x).join(',') || 'nessuno', t.every(x => !x));
  t = await ts('SCONOSCIUTO NESSUNO');
  rec('F13', 'Nessun abbinamento: niente', 'nessun TS', t.filter(x => x).join(',') || 'nessuno', t.every(x => !x));
  const legenda = await page.evaluate(() => /«TS» sopra il mese/.test(document.querySelector('.sec-lbl').textContent));
  rec('F14', 'Legenda sotto «ORE EFFETTUATE» da collegato', 'presente', legenda ? 'presente' : 'assente', legenda);
  await ts('ROSSI MARIO');
  const stile = await page.evaluate(() => { const s = document.querySelector('.fo-sugg'); const g = getComputedStyle(s); const th = s.closest('th'); return { col: g.color, fs: g.fontSize, va: getComputedStyle(th).verticalAlign }; });
  rec('F15', 'Aspetto «TS»: grigio #64748b, mesi allineati in alto (rev 20); «TS ?» ambra', 'rgb(100, 116, 139), vertical-align top', JSON.stringify(stile), stile.va === 'top' && stile.col === 'rgb(100, 116, 139)');
  // nessuna cella riempita / nessun dato cambiato
  const datiDopo = await L.ls(page, 'spazioireos_opoc');
  const dirty = await page.evaluate(() => A.dirty);
  rec('F16', 'Nessuna cella riempita, nessun dato cambiato', 'archivio identico, nessuna modifica in memoria', `${datiDopo === datiPrima ? 'identico' : 'CAMBIATO'}, dirty=${dirty}, ore ROSSI ${JSON.stringify(await page.evaluate(() => A.d.find(o => o.name === 'ROSSI MARIO').years['2026'].services[0].hours))}`, datiDopo === datiPrima && !dirty);
  const scritture = await page.evaluate(() => __fakefb.log.filter(o => /set|update|delete|batch|transaction|add|createUser/.test(o.op)).map(o => o.op + ' ' + o.path));
  rec('F17', 'Nessuna scrittura su Fogli ore (__fakefb.log)', '0 scritture', scritture.length ? scritture.join(',') : '0', scritture.length === 0);
  const letture = await page.evaluate(() => __fakefb.log.filter(o => /get|query/.test(o.op)).map(o => o.path).filter((v, i, a) => a.indexOf(v) === i));
  rec('F18', 'Letture fatte', 'users, timesheets, lightsheets', letture.join(','), letture.length >= 3, 'SUPERATO');
  // anno 2025: ROSSI 2 ore a gennaio, anno precedente
  const t25 = await page.evaluate(async () => { const o = A.d.find(o => o.name === 'ROSSI MARIO'); o.years['2025'] = { default_rate: 18, services: [{ name: 'S', residual: 0, hours: [0,0,0,0,0,0,0,0,0,0,0,0], rate: 18 }], payments: [] }; openS(A.d.indexOf(o)); for (let i = 0; i < 30; i++) { await new Promise(r => setTimeout(r, 100)); if (!Object.keys(FOpending).some(k => FOpending[k])) break; } await new Promise(r => setTimeout(r, 150)); return Array.from(document.querySelectorAll('.year-block')[0].querySelectorAll('th.month-hdr')).map(t => (t.querySelector('.fo-sugg') || {}).textContent || ''); });
  rec('F19', 'Anno 2025 letto a parte', 'Gen TS 2', t25.filter(x => x).join(','), t25[0] === 'TS 2');
  await page.evaluate(() => { const o = A.d.find(o => o.name === 'ROSSI MARIO'); delete o.years['2025']; A.dirty = false; A.v = 'cover'; render(); });
  // backup senza firebase
  const b = await L.scarica(page, () => page.evaluate(() => expJSON()));
  const txt = fs.readFileSync(b.percorso, 'utf8');
  rec('F20', 'Il backup non contiene «firebase»/«fogliore»', 'assenti', /firebase|fogliore/i.test(txt) ? 'PRESENTI' : 'assenti', !/firebase|fogliore/i.test(txt));
  // ricarica: sessione persiste
  await page.reload(); await L.sblocca(page, '123456'); await page.waitForTimeout(800);
  rec('F21', 'Ricarica: la sessione Fogli ore persiste', 'collegato', await page.evaluate(() => foStato), (await page.evaluate(() => foStato)) === 'collegato');
  // lettura caduta
  await page.evaluate(() => { __fakefb.failReads = true; FOcacheAnno = {}; FOpending = {}; });
  t = await ts('ROSSI MARIO');
  rec('F22', 'Lettura caduta: il suggerimento semplicemente non compare', 'nessun TS, nessun errore di pagina', (t.filter(x => x).join(',') || 'nessun TS') + ' / errori ' + page._errori.length, t.every(x => !x) && page._errori.length === 0);
  await page.evaluate(() => { __fakefb.failReads = false; FOcacheAnno = {}; FOpending = {}; A.v = 'cover'; render(); });
  // logout
  await page.click('button[onclick="foLogout()"]'); await page.waitForTimeout(300);
  t = await ts('ROSSI MARIO');
  rec('F23', 'Scollegato col pulsante: niente TS', 'nessuno, stato spento', `${t.filter(x => x).join(',') || 'nessuno'} / ${await page.evaluate(() => foStato)}`, t.every(x => !x) && (await page.evaluate(() => foStato)) === 'spento');
  const scr2 = await page.evaluate(() => __fakefb.log.filter(o => /set|update|delete|batch|transaction|add/.test(o.op)).length);
  rec('F24', 'Nessuna scrittura su Fogli ore in tutto lo script', '0', scr2, scr2 === 0);
  rec('F99', 'Nessun errore di pagina (TS)', '0', page._errori.join('|') || '0', page._errori.length === 0);
  await browser.close();
  L.riepilogo('col-a01-ts');
})().catch(e => { console.error('ERRORE SCRIPT', e); process.exit(2); });
