// col-rev25.cjs — rev 25: la lettura dei suggerimenti «TS» da Fogli ore non va più in giro infinito quando fallisce,
// e i suggerimenti si rileggono dopo 5 minuti (ridisegno solo se cambiati e mai mentre si scrive in una casella).
// Confronto diretto con la rev 24 congelata (banco comune: /col24/, oppure COL24_URL). SOLO DATI INVENTATI.
const L = require('./col-a01-lib.cjs');
const { rec } = L;
const P = 'spazio-ireos-foglio-ore';
const URL24 = process.env.COL24_URL || L.URL.replace('/col/', '/col24/');
const ts1 = (ore) => ({ workerUid: 'U1', year: 2026, month: 1, days: { 2: { t1f: '9:00', t1t: String(9 + ore) + ':00' } } });
const docs = {
  'users/ADMIN0001': { role: 'admin', name: 'AMMINISTRAZIONE PROVA', email: 'spazioireos@gmail.com' },
  'users/U1': { role: 'worker', cognome: 'ROSSI', nome: 'MARIO', name: 'ROSSI MARIO' },
  'timesheets/U1__2026_1_0': ts1(4),
};
const fakeSeed = (id) => ({ id, [P]: { reset: true, users: [{ email: 'spazioireos@gmail.com', password: 'prova123', uid: 'ADMIN0001' }], docs, session: { email: 'spazioireos@gmail.com', app: 'fogliore' } } });
const yr = { '2026': { default_rate: 18, services: [{ name: 'S', residual: 0, hours: [0,0,0,0,0,0,0,0,0,0,0,0], rate: 18 }], payments: [] } };
const dati = () => [L.op('ROSSI MARIO', JSON.parse(JSON.stringify(yr)))];
const attesa = (p, ms) => p.waitForTimeout(ms);
async function apriScheda(page) {
  await page.evaluate(() => { openS(0); });
  for (let i = 0; i < 30; i++) { await attesa(page, 100); if (!(await page.evaluate(() => Object.keys(FOpending).some(k => FOpending[k])))) break; }
  await attesa(page, 200);
}
const tsGen = (page) => page.evaluate(() => { const th = document.querySelector('.year-block th.month-hdr'); const s = th && th.querySelector('.fo-sugg'); return s ? s.textContent.trim() : ''; });
const letture = (page) => page.evaluate(() => __fakefb.log.filter(o => !/set|update|delete|batch/.test(o.op)).length);
const contaRender = (page) => page.evaluate(() => { if (!window.__rOrig) { window.__rOrig = render; window.__r = 0; window.render = function () { window.__r++; return window.__rOrig.apply(this, arguments); }; } window.__r = 0; });

(async () => {
  const browser = await L.chromium.launch();
  /* ---------- confronto: la rev 24 ---------- */
  {
    const ctx = await L.nuovoContesto(browser, { id: 'rev25-old', dati: dati(), fakeSeed: fakeSeed('rev25-old') });
    const page = await L.nuovaPagina(ctx);
    await page.goto(URL24); await L.sblocca(page, '123456').catch(() => {}); await attesa(page, 800);
    await page.evaluate(() => { __fakefb.failReads = true; FOcacheAnno = {}; FOpending = {}; openS(0); });
    const n0 = await letture(page); await attesa(page, 2000); const n1 = await letture(page);
    rec('R01', 'rev 24 · lettura caduta (difetto riprodotto)', 'letture ripetute senza sosta', `${n1 - n0} letture in 2 s`, n1 - n0 > 50);
    await ctx.close();
  }
  /* ---------- rev 25 ---------- */
  const ctx = await L.nuovoContesto(browser, { id: 'rev25-new', dati: dati(), fakeSeed: fakeSeed('rev25-new') });
  const page = await L.nuovaPagina(ctx);
  await L.apri(page); await attesa(page, 800);
  { const REVF = (require('fs').readFileSync(require('path').join(__dirname, '..', 'index.html'), 'utf8').match(/var REV_FILE="rev(\d+)"/) || [])[1];   /* letta dal file: non invecchia */
    const tg = await page.evaluate(() => (document.querySelector('.revtag') || {}).textContent || '');
    rec('R00', 'targhetta', 'rev ' + REVF, tg, new RegExp('rev ' + REVF + '\\b').test(tg)); }
  for (let ciclo = 1; ciclo <= 3; ciclo++) {
    await page.evaluate(() => { __fakefb.failReads = true; FOcacheAnno = {}; FOpending = {}; FOfallito = {}; FOletto = {}; A.v = 'cover'; render(); });
    await contaRender(page);
    const n0 = await letture(page); await page.evaluate(() => openS(0)); await attesa(page, 3000);
    const n1 = await letture(page); const r = await page.evaluate(() => window.__r);
    rec(`R02.${ciclo}`, 'lettura caduta: niente giro infinito', 'al più 2 letture e 2 ridisegni in 3 s', `${n1 - n0} letture · ${r} ridisegni`, n1 - n0 <= 2 && r <= 2);
    const cella = page.locator('input[onfocus^="fcl"]').first();
    await cella.click(); await cella.press('Control+A'); await cella.type('7', { delay: 120 });
    const v = await cella.inputValue(); const foc = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('onfocus'));
    rec(`R03.${ciclo}`, 'con la linea caduta si scrive in una cella', 'la cella prende «7» e resta attiva', `${v} / ${foc ? 'attiva' : 'persa'}`, v === '7' && !!foc);
    await page.keyboard.press('Escape'); await page.evaluate(() => document.activeElement && document.activeElement.blur());
    const n2 = await letture(page); await page.evaluate(() => { A.v = 'cover'; render(); openS(0); }); await attesa(page, 500);
    rec(`R04.${ciclo}`, 'entro 60 s non si riprova', '0 letture riaprendo la scheda', `${(await letture(page)) - n2}`, (await letture(page)) - n2 === 0);
    await page.evaluate(() => { __fakefb.failReads = false; Object.keys(FOfallito).forEach(k => { FOfallito[k] = Date.now() - 61000; }); A.v = 'cover'; render(); });
    await apriScheda(page);
    rec(`R05.${ciclo}`, 'tornata la linea, dopo 60 s il suggerimento torna', 'TS 4', await tsGen(page), await tsGen(page) === 'TS 4');
  }
  /* rilettura dopo 5 minuti, tre cicli di modifica in Fogli ore */
  for (let ciclo = 1; ciclo <= 3; ciclo++) {
    const ore = 4 + ciclo;
    await page.evaluate(([p, d]) => __fakefb.seed(p, { 'timesheets/U1__2026_1_0': d }), [P, ts1(ore)]);
    await page.evaluate(() => { A.v = 'cover'; render(); }); await apriScheda(page);
    const prima = await tsGen(page);
    rec(`R06.${ciclo}`, 'prima dei 5 minuti resta il suggerimento letto', `TS ${ore - 1}`, prima, prima === `TS ${ore - 1}`);
    await page.evaluate(() => { Object.keys(FOletto).forEach(k => { FOletto[k] = Date.now() - 301000; }); A.v = 'cover'; render(); });
    await apriScheda(page); await attesa(page, 300);
    rec(`R07.${ciclo}`, 'dopo 5 minuti si rilegge e si ridisegna', `TS ${ore}`, await tsGen(page), await tsGen(page) === `TS ${ore}`);
  }
  /* nessun ridisegno se i dati non sono cambiati */
  await page.evaluate(() => { Object.keys(FOletto).forEach(k => { FOletto[k] = Date.now() - 301000; }); });
  await contaRender(page); const nL = await letture(page);
  await page.evaluate(() => { foSuggerimentiAnno(2026); }); await attesa(page, 800);
  rec('R08', 'rilettura con dati uguali', '1 rilettura, 0 ridisegni', `${(await letture(page)) - nL > 0 ? 'riletto' : 'non riletto'} · ${await page.evaluate(() => window.__r)} ridisegni`, (await letture(page)) - nL > 0 && (await page.evaluate(() => window.__r)) === 0);
  /* mai ridisegnare mentre si scrive */
  await page.evaluate(([p, d]) => __fakefb.seed(p, { 'timesheets/U1__2026_1_0': d }), [P, ts1(2)]);
  const cella = page.locator('input[onfocus^="fcl"]').first();
  await cella.click(); await cella.press('Control+A'); await cella.type('3', { delay: 60 });
  await page.evaluate(() => { Object.keys(FOletto).forEach(k => { FOletto[k] = Date.now() - 301000; }); foSuggerimentiAnno(2026); });
  await attesa(page, 1000);
  const ancora = await page.evaluate(() => !!(document.activeElement && document.activeElement.getAttribute('onfocus')));
  await cella.type('5', { delay: 60 });
  rec('R09', 'dati cambiati mentre si scrive: nessun ridisegno', 'la cella resta attiva e prende «35»', `${await cella.inputValue()} / ${ancora ? 'attiva' : 'persa'}`, ancora && (await cella.inputValue()) === '35');
  await page.evaluate(() => document.activeElement.blur()); await attesa(page, 2200);
  rec('R10', 'uscendo dalla casella il ridisegno arriva', 'TS 2', await tsGen(page), await tsGen(page) === 'TS 2');
  const scr = await page.evaluate(() => __fakefb.log.filter(o => /set|update|delete|batch/.test(o.op) && /spazio-ireos/.test(JSON.stringify(o))).length);
  rec('R11', 'nessuna scrittura su Fogli ore', '0', String(scr), scr === 0);
  rec('R12', 'errori di pagina', '0', String(page._errori.length), page._errori.length === 0);
  await browser.close();
  L.riepilogo('col-rev25');
})();
