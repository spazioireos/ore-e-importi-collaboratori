// col-a01-base.cjs — PIN, copertina, collaboratori (crea/modifica/elimina), anni, servizi, tariffe,
// ore mensili, salvataggio manuale, ricarica, negativi, virgola, nomi doppi. SOLO DATI INVENTATI.
const L = require('./col-a01-lib.cjs');
const { rec } = L;
const seed = [
  L.op('ALFA PROVA', {
    '2025': { default_rate: 20.5, services: [L.svc('SERVIZIO A', 20.5, [10,5,0,0,0,0,0,0,0,0,0,0]), L.svc('SERVIZIO B', 30, [0,0,8,0,0,0,0,0,0,0,0,0])], payments: [{ date: '15/03/2025', hours: 10, rate: 20.5, attrib: 'SERVIZIO A' }] },
    '2026': { default_rate: 20.5, services: [L.svc('SERVIZIO A', 20.5, [4,0,0,0,0,0,0,0,0,0,0,0])], payments: [] } }),
  L.op('BETA PROVA', { '2026': { default_rate: 22.99, services: [L.svc('SERVIZIO R2', 22.99, [67.5,0,0,0,0,0,0,0,0,0,0,0], { residual: -45.5 })], payments: [] } }),
];

(async () => {
  const browser = await L.chromium.launch();
  // ---------- PIN su browser vuoto ----------
  {
    const ctx = await L.nuovoContesto(browser, { id: 'pin-vuoto', pin: null });
    const page = await L.nuovaPagina(ctx);
    await L.apri(page, false);
    const t0 = await page.textContent('.pin-box');
    rec('P01', 'PIN: browser vuoto chiede di impostarlo', 'Imposta il PIN (6 cifre)', t0.includes('Imposta il PIN') ? 'Imposta il PIN' : t0.slice(0, 80), t0.includes('Imposta il PIN'));
    await page.fill('#pinInput', '12345'); await page.click('.pin-btn');
    let m = await page.textContent('.pin-msg');
    rec('P02', 'PIN: 5 cifre rifiutate', 'Inserire 6 cifre', m, m.includes('Inserire 6 cifre'));
    await page.fill('#pinInput', 'abcdef'); await page.click('.pin-btn');
    m = await page.textContent('.pin-msg');
    rec('P03', 'PIN: lettere rifiutate', 'Inserire 6 cifre', m, m.includes('Inserire 6 cifre'));
    await page.fill('#pinInput', '123456'); await page.click('.pin-btn');
    await page.fill('#pinInput', '654321'); await page.click('.pin-btn');
    m = await page.textContent('.pin-msg');
    rec('P04', 'PIN: conferma diversa', 'PIN non coincide, riprova', m, m.includes('non coincide'));
    await page.fill('#pinInput', '123456'); await page.click('.pin-btn');
    await page.fill('#pinInput', '123456'); await page.click('.pin-btn');
    await page.waitForTimeout(300);
    const pinLS = await L.ls(page, 'spazioireos_opoc_pin');
    const rec1 = await page.$('.recovery-screen');
    rec('P05', 'PIN impostato e salvato (in chiaro, voluto)', 'spazioireos_opoc_pin=123456', pinLS, pinLS === '123456');
    rec('P06', 'Browser vuoto: schermata di recupero dopo il PIN', 'recovery-screen', rec1 ? 'presente' : 'assente', !!rec1);
    page._risposte.push(false);
    await page.click('text=Inizia da zero');
    rec('P07', 'Inizia da zero: annullando resta sul recupero', 'recovery resta', (await page.$('.recovery-screen')) ? 'resta' : 'sparita', !!(await page.$('.recovery-screen')));
    page._risposte.push(true);
    await page.click('text=Inizia da zero');
    await page.waitForTimeout(200);
    const cov = await page.$('.cover-header');
    rec('P08', 'Inizia da zero: confermando copertina vuota', '0 schede', cov ? (await page.textContent('.cover-header p')) : 'niente', cov && (await page.textContent('.cover-header p')).includes('0 schede'));
    await page.reload(); await page.waitForTimeout(300);
    const tc = await page.textContent('.pin-box');
    rec('P09', 'Ricarica: chiede il PIN esistente', 'Inserisci il PIN', tc.includes('Inserisci il PIN') ? 'Inserisci il PIN' : tc.slice(0, 60), tc.includes('Inserisci il PIN'));
    await page.fill('#pinInput', '111111'); await page.click('.pin-btn');
    m = await page.textContent('.pin-msg');
    rec('P10', 'PIN sbagliato', 'PIN errato, resta bloccato', m + ((await page.$('.cover-header')) ? ' + copertina!' : ''), m.includes('PIN errato') && !(await page.$('.cover-header')));
    await page.fill('#pinInput', '123456'); await page.click('.pin-btn');
    rec('P11', 'PIN giusto apre la copertina', 'copertina', (await page.$('.cover-header')) ? 'copertina' : 'no', !!(await page.$('.cover-header')));
    rec('P12', 'Nessun errore di pagina (PIN)', '0', page._errori.length + ' ' + page._errori.join('|'), page._errori.length === 0);
    await ctx.close();
  }
  // ---------- copertina e gruppi ----------
  const ctx = await L.nuovoContesto(browser, { id: 'base-1', dati: seed });
  const page = await L.nuovaPagina(ctx);
  await L.apri(page);
  const gruppi = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('.cover-body > div').forEach(() => {});
    const tit = ['DATI', 'FOGLI ORE', 'ANAGRAFICHE', 'CONTRATTI', 'REPORT'];
    document.querySelectorAll('div').forEach(d => {
      const f = d.firstElementChild;
      if (f && f.tagName === 'DIV' && tit.includes(f.textContent.trim()) && d.children.length === 2 && f.style.fontWeight === '800') {
        out.push({ t: f.textContent.trim(), n: d.children[1].querySelectorAll('button').length });
      }
    });
    return out;
  });
  const totBtn = gruppi.reduce((a, g) => a + g.n, 0);
  rec('C01', 'Copertina: gruppi di pulsanti', '5 gruppi (DATI, FOGLI ORE, ANAGRAFICHE, CONTRATTI, REPORT)', gruppi.map(g => g.t + ':' + g.n).join(' '), gruppi.length === 5);
  rec('C02', 'Copertina: pulsanti nei gruppi (2 anni di dati)', '18', totBtn, totBtn === 18);
  const rev = await page.textContent('.cover-header .revtag');
  // rev 21: l'attesa si legge dal file dell'app (prima era scritta a mano «rev 20» e invecchiava)
  const revFile = (require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').match(/rev (\d+) \\u00b7 (\d+[a-z]+\d+)/) || []).slice(1).join(' · ');
  rec('C03', 'Targhetta revisione', 'rev ' + revFile, rev, rev.replace(/\s+/g, ' ').indexOf('rev ' + revFile) >= 0);
  const kpi = await page.textContent('.kpi-bar');
  rec('C04', 'KPI copertina: residui 2025 / 2026', 'Ore res.2025 13,00 · Imp.res.2025 € 342,50', kpi.replace(/\s+/g, ' ').slice(0, 160), kpi.includes('13,00') && kpi.includes('342,50'));
  await page.fill('#qSearch', 'beta'); await page.waitForTimeout(150);
  const cards = await page.$$eval('.op-card .on', a => a.map(x => x.textContent));
  rec('C05', 'Ricerca per nome', 'solo BETA PROVA', cards.join(','), cards.length === 1 && cards[0] === 'BETA PROVA');
  await page.fill('#qSearch', ''); await page.waitForTimeout(150);

  // ---------- crea collaboratore ----------
  async function nuovo(nome, costo, anno, serv) {
    await page.evaluate(() => { A.modal = 'newop'; render(); });
    await page.fill('#nN', nome); if (costo !== undefined) await page.fill('#nR', costo);
    if (anno) await page.fill('#nYr', anno); if (serv) await page.fill('#nV', serv);
    await page.click('.modal .btn-new');
    await page.waitForTimeout(150);
  }
  const lsPrima = await L.ls(page, 'spazioireos_opoc');
  await nuovo('zeta nuovo', '22,99', '2026', 'SERV Z');
  let st = await page.evaluate(() => { const o = A.d[A.sel]; return { n: o.name, r: o.years['2026'].default_rate, sr: o.years['2026'].services[0].rate, s: o.years['2026'].services[0].name, v: A.v, dirty: A.dirty }; });
  rec('N01', 'Nuovo operatore con «22,99» (virgola)', 'ZETA NUOVO, tariffa 22,99, scheda aperta', JSON.stringify(st), st.n === 'ZETA NUOVO' && st.r === 22.99 && st.sr === 22.99 && st.v === 'sheet');
  rec('N02', 'Creazione NON salvata da sola (niente salvataggio automatico)', 'localStorage invariato, NON SALVATO visibile', ((await L.ls(page, 'spazioireos_opoc')) === lsPrima ? 'invariato' : 'CAMBIATO') + ' / dirty=' + st.dirty, (await L.ls(page, 'spazioireos_opoc')) === lsPrima && st.dirty && !!(await page.$('#ubadge')));
  // 10 ore a gennaio
  const celle = await page.$$('.tbl-dense').then(t => t[0].$$('td.edit-cell input[style*="width:48px"]'));
  await celle[0].click(); await celle[0].fill('10'); await celle[0].press('Tab'); await page.waitForTimeout(150);
  const impMat = await page.evaluate(() => { const tr = document.querySelectorAll('.tbl-dense')[0].querySelectorAll('tbody tr')[0]; const c = tr.querySelectorAll('td'); return c[c.length - 1].textContent; });
  rec('N03', '10 ore × 22,99 = Imp.Mat.', '€ 229,90', impMat, impMat.includes('229,90'));
  // negativo nelle ore
  let c2 = (await (await page.$$('.tbl-dense'))[0].$$('td.edit-cell input[style*="width:48px"]'))[1];
  await c2.click(); await c2.fill('-5'); await c2.press('Tab'); await page.waitForTimeout(150);
  let feb = await page.evaluate(() => A.d[A.sel].years['2026'].services[0].hours[1]);
  rec('N04', 'Ore: «-5» battuto', 'entra 5 (il meno scartato)', feb, feb === 5);
  c2 = (await (await page.$$('.tbl-dense'))[0].$$('td.edit-cell input[style*="width:48px"]'))[2];
  await c2.click(); await c2.fill('7,25'); await c2.press('Tab'); await page.waitForTimeout(150);
  let mar = await page.evaluate(() => A.d[A.sel].years['2026'].services[0].hours[2]);
  rec('N05', 'Ore: «7,25» con la virgola', '7,25', mar, mar === 7.25);
  c2 = (await (await page.$$('.tbl-dense'))[0].$$('td.edit-cell input[style*="width:48px"]'))[3];
  await c2.click(); await c2.fill('1234.56'); await c2.press('Tab'); await page.waitForTimeout(150);
  let apr = await page.evaluate(() => A.d[A.sel].years['2026'].services[0].hours[3]);
  rec('N06', 'Ore: «1234.56» (decisione: = 1234,56)', '1234,56', apr, apr === 1234.56);
  c2 = (await (await page.$$('.tbl-dense'))[0].$$('td.edit-cell input[style*="width:48px"]'))[3];
  await c2.click(); await c2.fill('abc'); await c2.press('Tab'); await page.waitForTimeout(150);
  apr = await page.evaluate(() => A.d[A.sel].years['2026'].services[0].hours[3]);
  rec('N07', 'Ore: testo «abc»', '0 (nessun errore)', apr, apr === 0);
  // tariffa sbloccata
  await page.evaluate(() => toggleLock(A.sel, '2026', 0)); await page.waitForTimeout(100);
  const ri = await page.$('.tbl-dense .rate-in');
  await ri.click(); await ri.fill('-25,5'); await ri.press('Tab'); await page.waitForTimeout(150);
  let rt = await page.evaluate(() => A.d[A.sel].years['2026'].services[0].rate);
  rec('N08', 'Tariffa servizio sbloccata: «-25,5»', '25,5 (niente negativi)', rt, rt === 25.5);
  // rinomina servizio
  const si = await page.$('.tbl-dense .svc-input');
  await si.fill('SERV Z RINOMINATO'); await si.press('Tab'); await page.waitForTimeout(150);
  rec('N09', 'Rinomina servizio', 'SERV Z RINOMINATO', await page.evaluate(() => A.d[A.sel].years['2026'].services[0].name), (await page.evaluate(() => A.d[A.sel].years['2026'].services[0].name)) === 'SERV Z RINOMINATO');
  // aggiungi / elimina servizio
  await page.click('text=+ Aggiungi servizio'); await page.waitForTimeout(100);
  let ns = await page.evaluate(() => A.d[A.sel].years['2026'].services.length);
  page._risposte.push(false);
  await page.evaluate(() => delSvc(A.sel, '2026', 1));
  const nsNo = await page.evaluate(() => A.d[A.sel].years['2026'].services.length);
  page._risposte.push(true);
  await page.evaluate(() => delSvc(A.sel, '2026', 1));
  const nsSi = await page.evaluate(() => A.d[A.sel].years['2026'].services.length);
  const dmsg = page._dialoghi.slice(-1)[0].msg;
  rec('N10', 'Aggiungi/elimina servizio con conferma', '2 → annulla 2 → conferma 1', `${ns}→${nsNo}→${nsSi}`, ns === 2 && nsNo === 2 && nsSi === 1);
  page._risposte.push(false);
  await page.evaluate(() => delSvc(A.sel, '2026', 0));
  const dmsg2 = page._dialoghi.slice(-1)[0].msg;
  rec('N11', 'Elimina servizio con credito: avviso chiaro, senza HTML', 'ATTENZIONE … credito, nessun <span', dmsg2.slice(0, 70).replace(/\n/g, ' '), /credito/.test(dmsg2) && !/<span/.test(dmsg2));
  // anno nuovo
  await page.click('.btn-add-yr'); await page.waitForTimeout(150);
  const mny = await page.textContent('.modal');
  await page.fill('#nyR', '23,75'); await page.click('.modal .btn-new'); await page.waitForTimeout(150);
  const y27 = await page.evaluate(() => { const y = A.d[A.sel].years['2027']; return y ? { r: y.default_rate, s: y.services.map(s => s.name + '@' + s.rate + ':' + s.hours.reduce((a, b) => a + b, 0)) } : null; });
  rec('N12', '+ Anno 2027 con «23,75»', 'default 23,75; servizi duplicati con ore a zero', JSON.stringify(y27), y27 && y27.r === 23.75 && y27.s.length === 1 && /:0$/.test(y27.s[0]));
  rec('N13', 'Finestra nuovo anno mostra il residuo', 'Residuo dal 2026', /Residuo dal 2026/.test(mny) ? 'sì' : mny.slice(0, 80), /Residuo dal 2026/.test(mny));
  await page.click('.btn-add-yr'); await page.waitForTimeout(100);
  await page.fill('#nyR', '-30'); await page.click('.modal .btn-new'); await page.waitForTimeout(100);
  const y28 = await page.evaluate(() => A.d[A.sel].years['2028'] && A.d[A.sel].years['2028'].default_rate);
  rec('N14', 'Nuovo anno con «-30»', '30', y28, y28 === 30);
  page._risposte.push(false); await page.evaluate(() => delYr(A.sel, '2028'));
  const a1 = await page.evaluate(() => !!A.d[A.sel].years['2028']);
  page._risposte.push(true); await page.evaluate(() => delYr(A.sel, '2028'));
  const a2 = await page.evaluate(() => !!A.d[A.sel].years['2028']);
  rec('N15', 'Elimina anno con conferma', 'annulla resta, conferma tolto', `${a1}/${a2}`, a1 && !a2);
  // salva
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), page.click('.acts .btn-save')]);
  await page.waitForTimeout(200);
  const d1 = await L.datiLS(page);
  const z = d1.find(o => o.name === 'ZETA NUOVO');
  rec('S01', '✔ Salva scrive davvero in localStorage', 'ZETA NUOVO presente con 2026 e 2027', z ? Object.keys(z.years).join(',') : 'assente', z && z.years['2026'] && z.years['2027']);
  rec('S02', '✔ Salva scarica da sé un backup (rete storica)', 'backup_operatori_occasionali.json', dl ? dl.suggestedFilename() : 'nessun download', !!dl);
  rec('S03', 'Dopo il salvataggio il pulsante dice «✔ Salvato» e sparisce NON SALVATO', 'Salvato disabilitato', (await page.textContent('.acts')).includes('Salvato') && !(await page.$('#ubadge')) ? 'ok' : 'no', (await page.textContent('.acts')).includes('Salvato') && !(await page.$('#ubadge')));
  // doppio clic su salva
  await page.evaluate(() => { A.d[A.sel].years['2026'].services[0].hours[5] = 3; markD(); render(); });
  let ndl = 0; page.on('download', () => ndl++);
  await page.dblclick('.acts .btn-save').catch(() => {}); await page.waitForTimeout(400);
  rec('S04', 'Doppio clic su ✔ Salva', 'un salvataggio, nessun errore', `download=${ndl}, errori=${page._errori.length}`, ndl <= 1 && page._errori.length === 0);
  // ricarica
  await page.reload(); await L.sblocca(page, '123456'); await page.waitForTimeout(200);
  const nomi = await page.$$eval('.op-card .on', a => a.map(x => x.textContent));
  rec('S05', 'Ricarica: dati ancora lì', 'ALFA, BETA, ZETA', nomi.join(','), nomi.includes('ZETA NUOVO') && nomi.length === 3);
  // goBack con modifiche
  await page.evaluate(() => { const i = A.d.findIndex(o => o.name === 'ZETA NUOVO'); openS(i); });
  await page.evaluate(() => { A.d[A.sel].years['2026'].services[0].hours[6] = 2; markD(); });
  page._risposte.push(false); await page.click('text=← Torna alla lista').catch(async () => page.evaluate(() => goBack()));
  const rimasto = await page.evaluate(() => A.v);
  const avviso = page._dialoghi.slice(-1)[0];
  rec('S06', 'Uscire dalla scheda con modifiche chiede conferma', 'confirm «Modifiche non salvate» e resta nella scheda', (avviso && avviso.msg) + ' / v=' + rimasto, avviso && /non salvate/i.test(avviso.msg) && rimasto === 'sheet');
  // beforeunload?
  const bu = await page.evaluate(() => typeof window.onbeforeunload === 'function' || /beforeunload/.test(document.documentElement.innerHTML));
  rec('S07', 'Avviso alla chiusura della pagina con modifiche non salvate (§10.1)', 'beforeunload presente', bu ? 'presente' : 'ASSENTE', bu, bu ? 'SUPERATO' : 'FALLITO');
  // nomi doppi
  await page.evaluate(() => { A.v = 'cover'; A.dirty = false; render(); });
  const n0 = await page.evaluate(() => A.d.length);
  page._risposte.push(false); await nuovo('alfa prova', '20');
  const n1 = await page.evaluate(() => A.d.length);
  const avvDoppio = page._dialoghi.slice(-1)[0].msg;
  await page.evaluate(() => { A.v = 'cover'; A.modal = null; render(); });
  page._risposte.push(true); await nuovo('ALFA PROVA', '20');
  const n2 = await page.evaluate(() => A.d.length);
  rec('N16', 'Nome doppio: avviso non bloccante', 'annulla 3→3, conferma 3→4', `${n0}→${n1}→${n2}; «${avvDoppio.slice(0, 40).replace(/\n/g, ' ')}»`, n0 === 3 && n1 === 3 && n2 === 4 && /Esiste gi/.test(avvDoppio));
  // costo vuoto / -10 / nome vuoto
  await page.evaluate(() => { A.v = 'cover'; render(); });
  await nuovo('ETA VUOTO', '');
  const rv = await page.evaluate(() => A.d[A.sel].years['2025'].default_rate);
  await page.evaluate(() => { A.v = 'cover'; render(); });
  await nuovo('TETA NEG', '-10');
  const rn = await page.evaluate(() => A.d[A.sel].years['2025'].default_rate);
  rec('N17', 'Costo orario vuoto → riserva 18; «-10» → 10', '18 / 10', `${rv} / ${rn}`, rv === 18 && rn === 10);
  await page.evaluate(() => { A.v = 'cover'; render(); });
  const nPre = await page.evaluate(() => A.d.length);
  await nuovo('', '20');
  const al = page._dialoghi.slice(-1)[0];
  rec('N18', 'Nome vuoto rifiutato', 'alert «Inserire il nome», nessuna scheda', `${al.msg} / ${nPre}→${await page.evaluate(() => A.d.length)}`, /Inserire il nome/.test(al.msg) && nPre === (await page.evaluate(() => A.d.length)));
  await page.evaluate(() => { A.modal = null; A.v = 'cover'; render(); });
  const lungo = 'X'.repeat(300);
  await nuovo(lungo, '20');
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  await page.evaluate(() => { A.v = 'cover'; render(); });
  const swc = await page.evaluate(() => document.documentElement.scrollWidth);
  rec('N19', 'Nome lunghissimo (300 car.): scheda e copertina', 'nessun errore; copertina non sborda (1500)', `scheda ${sw}px, copertina ${swc}px`, swc <= 1500 && page._errori.length === 0, sw > 1500 ? 'PARZIALE' : undefined);
  // elimina operatore
  const nA = await page.evaluate(() => A.d.length);
  page._risposte.push(false); await page.evaluate(() => delOp(A.d.length - 1));
  const nB = await page.evaluate(() => A.d.length);
  page._risposte.push(true); await page.evaluate(() => delOp(A.d.length - 1));
  const nC = await page.evaluate(() => A.d.length);
  const dmsgOp = page._dialoghi.slice(-1)[0].msg;
  rec('N20', 'Elimina operatore con conferma', 'annulla invariato, conferma −1', `${nA}→${nB}→${nC}; «${dmsgOp.slice(0, 50)}»`, nA === nB && nC === nA - 1);
  // negativo in archivio: entra/esci non lo toglie
  await page.evaluate(() => { const i = A.d.findIndex(o => o.name === 'BETA PROVA'); openS(i); });
  const rinp = await page.$('.tbl-dense td.edit-cell input[style*="width:52px"]');
  const v0 = await rinp.inputValue();
  await rinp.focus(); await page.keyboard.press('Tab'); await page.waitForTimeout(100);
  const v1 = await rinp.inputValue();
  const vData = await page.evaluate(() => A.d[A.sel].years['2026'].services[0].residual);
  rec('N21', 'Negativo in archivio (−45,50): entra/esci senza scrivere', 'resta «-45,50», dato −45,5', `${v0} → ${v1}, dato ${vData}`, v1 === v0 && v0.indexOf('-45,50') >= 0 && vData === -45.5);
  // R2 67,5 × 22,99
  const imp = await page.evaluate(() => { const tr = document.querySelectorAll('.tbl-dense')[0].querySelectorAll('tbody tr'); for (const r of tr) { if (/SERVIZIO R2/.test(r.innerHTML)) { const c = r.querySelectorAll('td'); return c[c.length - 1].textContent; } } return ''; });
  rec('N22', 'R2: 67,5 × 22,99 nella scheda (residuo −45,5 compreso)', '(67,5−45,5)=22 × 22,99 = € 505,78; e 67,5×22,99 = 1.551,83', imp + ' / R2=' + (await page.evaluate(() => R2(67.5 * 22.99))), imp.includes('505,78') && (await page.evaluate(() => R2(67.5 * 22.99))) === 1551.83);
  rec('N99', 'Nessun errore di pagina (base)', '0', page._errori.join('|') || '0', page._errori.length === 0);
  await browser.close();
  L.riepilogo('col-a01-base');
})().catch(e => { console.error('ERRORE SCRIPT', e); process.exit(2); });
