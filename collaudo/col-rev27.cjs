// col-rev27.cjs — rev 27: un servizio si chiude a mano «al ‹mese›» (tendina accanto a «dal», col lucchetto aperto); i mesi dopo
// non si compilano. Confronto con la rev 26 congelata (banco comune: /col26/, oppure COL26_URL). COL_PNG salva le anteprime.
// SOLO DATI INVENTATI.
const L = require('./col-a01-lib.cjs');
const { rec } = L;
const path = require('path');
const URL26 = process.env.COL26_URL || L.URL.replace('/col/', '/col26/');
const PNG = process.env.COL_PNG || '';
const ore = (fino, v) => [0,1,2,3,4,5,6,7,8,9,10,11].map(m => m <= fino ? v : 0);
const yr = () => ({ '2026': { default_rate: 20, services: [
  Object.assign(L.svc('LABORATORIO', 20, ore(5, 10)), { locked: false }),
  L.svc('DOPOSCUOLA', 18, ore(11, 5)) ], payments: [] } });
const dati = () => [L.op('ROSSI MARIO', yr())];
async function pagina(browser, url, id, vp) {
  const ctx = await L.nuovoContesto(browser, { id, dati: dati(), viewport: vp });
  const page = await L.nuovaPagina(ctx);
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(300); await L.sblocca(page, '123456'); await page.waitForTimeout(300);
  await page.evaluate(() => openS(0)); await page.waitForTimeout(300);
  return { ctx, page };
}
// celle dei mesi della riga s del primo anno: 'in' = casella compilabile, '-' = bloccata vuota, 'o' = bloccata con ore
const riga = (page, s) => page.evaluate(s => {
  const tb = document.querySelector('.year-block table.tbl-dense'); const tr = tb.querySelectorAll('tbody tr')[s];
  const tds = Array.from(tr.children).slice(4, 16);
  return tds.map(td => td.querySelector('input') ? 'in' : (td.textContent.trim() === '–' ? '-' : 'o')).join(' ');
}, s);
const conti = page => page.evaluate(() => { const cl = compLiq(A.d[0], '2026'); const co = compOre(A.d[0], '2026'); return JSON.stringify({ h: co.totH, imp: co.totImp, oreRes: cl.oreRes, impRes: cl.impRes }); });
(async () => {
  const browser = await L.chromium.launch();
  // rev 26: nessuna tendina «al»
  { const { ctx, page } = await pagina(browser, URL26, 'r27-a');
    const n = await page.evaluate(() => document.querySelectorAll('select[onchange^="setEndM"]').length);
    rec('E00', 'rev 26 · nessun modo di chiudere a mano', '0 tendine «al»', n, n === 0);
    rec('E00b', 'rev 26 · riga del servizio finito a giugno', 'luglio-dicembre ancora compilabili', await riga(page, 0), /^(in ){11}in$/.test(await riga(page, 0)));
    await ctx.close(); }
  const { ctx, page } = await pagina(browser, L.URL, 'r27-b');
  const prima = await conti(page);
  rec('E01', 'Tendina «al» accanto a «dal» col lucchetto aperto', '1 tendina, su Dicembre', await page.evaluate(() => { const s = document.querySelectorAll('select[onchange^="setEndM"]'); return s.length + ' · ' + (s[0] ? s[0].options[s[0].selectedIndex].text : ''); }), /^1 · Dic/.test(await page.evaluate(() => { const s = document.querySelectorAll('select[onchange^="setEndM"]'); return s.length + ' · ' + (s[0] ? s[0].options[s[0].selectedIndex].text : ''); })));
  // chiudo a giugno: nessuna ora dopo -> nessuna domanda
  const nd0 = page._dialoghi.length;
  await page.selectOption('select[onchange^="setEndM"]', '5'); await page.waitForTimeout(300);
  rec('E02', 'Chiuso «al Giugno»: luglio-dicembre bloccati, gennaio-giugno compilabili', 'in×6, –×6', await riga(page, 0), (await riga(page, 0)) === 'in in in in in in - - - - - -');
  rec('E03', 'Nessuna domanda se dopo giugno non ci sono ore', '0 dialoghi', page._dialoghi.length - nd0, page._dialoghi.length === nd0);
  rec('E04', 'Dato salvato nella riga (solo in memoria finché non si salva)', 'endM 5, archivio ancora senza', await page.evaluate(() => A.d[0].years['2026'].services[0].endM + ' / ' + (JSON.parse(localStorage.getItem('spazioireos_opoc')||'[]')[0]||{years:{}}).years['2026'].services[0].endM), /^5 \/ undefined$/.test(await page.evaluate(() => A.d[0].years['2026'].services[0].endM + ' / ' + (JSON.parse(localStorage.getItem('spazioireos_opoc')||'[]')[0]||{years:{}}).years['2026'].services[0].endM)));
  rec('E05', 'Nessun numero cambia', prima, await conti(page), (await conti(page)) === prima);
  rec('E06', 'L\'altra riga non è toccata', 'tutti i mesi compilabili', await riga(page, 1), /^(in ){11}in$/.test(await riga(page, 1)));
  if (PNG) { const el = await page.$('.year-block'); await el.screenshot({ path: path.join(PNG, 'rev27-aperto.png') }); }
  // lucchetto chiuso: scritta «chiuso da Lug26»
  await page.evaluate(() => toggleLock(0, '2026', 0)); await page.waitForTimeout(200);
  const scritta = await page.evaluate(() => { const tb = document.querySelector('.year-block table.tbl-dense'); return tb.querySelectorAll('tbody tr')[0].children[2].textContent; });
  rec('E07', 'Col lucchetto chiuso compare «chiuso da lug26»', 'chiuso da lug26', scritta.replace(/\s+/g, ' '), /chiuso da lug26/.test(scritta));
  if (PNG) { const el = await page.$('.year-block'); await el.screenshot({ path: path.join(PNG, 'rev27-chiuso.png') }); }
  await page.evaluate(() => toggleLock(0, '2026', 0)); await page.waitForTimeout(200);
  // salvataggio e ricarica
  await page.evaluate(() => sv()); await page.waitForTimeout(400);
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(300); await L.sblocca(page, '123456'); await page.waitForTimeout(300);
  await page.evaluate(() => openS(0)); await page.waitForTimeout(300);
  rec('E08', 'Dopo ✔ Salva e ricarica la chiusura resta', 'in×6, –×6', await riga(page, 0), (await riga(page, 0)) === 'in in in in in in - - - - - -');
  // chiudere prima di ore già scritte (riga 2, ore tutto l'anno): domanda; annulla = niente
  await page.evaluate(() => toggleLock(0, '2026', 1)); await page.waitForTimeout(200);
  page._risposte.push(false);
  const nd1 = page._dialoghi.length;
  await page.evaluate(() => setEndM(0, '2026', 1, '8')); await page.waitForTimeout(200);
  const dom = (page._dialoghi[nd1] || {}).msg || '';
  rec('E09', 'Ore già scritte dopo il mese scelto: avviso con i mesi', 'Ott, Nov, Dic (5,00h)', dom.replace(/\n+/g, ' ').slice(0, 160), /Ott \(5,00h\)/.test(dom) && /Dic \(5,00h\)/.test(dom));
  rec('E10', 'Annullando non si chiude niente', 'endM assente, celle compilabili', await page.evaluate(() => String(A.d[0].years['2026'].services[1].endM)) + ' · ' + await riga(page, 1), (await page.evaluate(() => A.d[0].years['2026'].services[1].endM)) === undefined && /^(in ){11}in$/.test(await riga(page, 1)));
  page._risposte.push(true);
  await page.evaluate(() => setEndM(0, '2026', 1, '8')); await page.waitForTimeout(200);
  rec('E11', 'Confermando: ore dopo settembre arancioni e non modificabili, conti identici', 'in×9, o×3', await riga(page, 1), (await riga(page, 1)) === 'in in in in in in in in in o o o');
  rec('E12', 'Conti ancora identici', prima, await conti(page), (await conti(page)) === prima);
  // riapertura
  await page.evaluate(() => setEndM(0, '2026', 1, '11')); await page.waitForTimeout(200);
  rec('E13', 'Rimettendo «al Dicembre» la riga si riapre', 'tutti compilabili, endM tolto', await riga(page, 1) + ' · ' + await page.evaluate(() => String(A.d[0].years['2026'].services[1].endM)), /^(in ){11}in$/.test(await riga(page, 1)) && (await page.evaluate(() => A.d[0].years['2026'].services[1].endM)) === undefined);
  // fine prima dell'inizio
  await page.evaluate(() => { A.d[0].years['2026'].services[1].startM = 4; render(); }); await page.waitForTimeout(200);
  const nd2 = page._dialoghi.length;
  await page.evaluate(() => setEndM(0, '2026', 1, '2')); await page.waitForTimeout(200);
  rec('E14', 'Fine prima dell\'inizio rifiutata', 'avviso, endM non scritto', ((page._dialoghi[nd2] || {}).msg || '').slice(0, 90) + ' · ' + await page.evaluate(() => String(A.d[0].years['2026'].services[1].endM)), /non può finire prima/.test((page._dialoghi[nd2] || {}).msg || '') && (await page.evaluate(() => A.d[0].years['2026'].services[1].endM)) === undefined);
  // nuovo anno: la chiusura non si copia
  await page.evaluate(() => { A.sel = 0; prepAY(); }); await page.waitForTimeout(200);
  await page.evaluate(() => confAY(2027)); await page.waitForTimeout(300);
  rec('E15', '«+ Anno 2027»: la chiusura non passa all\'anno nuovo', 'endM assente nel 2027', await page.evaluate(() => String(A.d[0].years['2027'].services[0].endM)), (await page.evaluate(() => A.d[0].years['2027'].services[0].endM)) === undefined);
  rec('E16', 'Errori di pagina', '0', page._errori.length + (page._errori.length ? ': ' + page._errori.join(' | ') : ''), page._errori.length === 0);
  await ctx.close();
  // telefono
  { const { ctx, page } = await pagina(browser, L.URL, 'r27-c', { width: 390, height: 844 });
    const w = await page.evaluate(() => document.documentElement.scrollWidth);
    rec('E17', 'A 390px la pagina non scorre di lato', '390', w, w <= 390);
    await ctx.close(); }
  await browser.close();
  L.riepilogo('col-rev27');
})();
