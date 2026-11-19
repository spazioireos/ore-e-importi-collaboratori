// col-rev22.cjs — prova della rev 22 di Collaboratori: entrando in una casella numerica della scheda
// (clic, tocco o Tab) il contenuto risulta tutto selezionato, e il primo tasto lo sostituisce.
// Confronto diretto con la rev 21 (dove la selezione non c'era).
// SOLO DATI INVENTATI (repository pubblico).
//   COL_URL   = rev 22 (predefinito http://127.0.0.1:8340/col/index.html)
//   COL21_URL = copia della rev 21 localizzata nel banco (predefinito: stessa origine, /col21/index.html)
//   COL_PNG   = cartella in cui salvare l'anteprima (facoltativo)
const L = require('./col-a01-lib.cjs');
const { rec } = L;
const path = require('path');
const URL22 = L.URL;
const URL21 = process.env.COL21_URL || URL22.replace('/col/', '/col21/');
const PNG = process.env.COL_PNG || '';

const z12 = () => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
function dati() {
  const h = z12(); h[0] = 12.5; h[1] = 8; h[2] = 0; h[3] = 6.25;
  return [L.op('ALFA PROVA', { '2026': { default_rate: 20, services: [L.svc('SERVIZIO A', 20, h, { residual: -45.5 })],
    payments: [{ date: '15/03/2026', hours: 10, rate: 20, attrib: 'SERVIZIO A', rimborso: false }] } })];
}
// stato della casella che ha il fuoco
const stato = (page) => page.evaluate(() => {
  const a = document.activeElement;
  if (!a || a.tagName !== 'INPUT') return { tag: a ? a.tagName : null };
  return { v: a.value, s: a.selectionStart, e: a.selectionEnd, sel: a.value.substring(a.selectionStart, a.selectionEnd), tutto: a.value.length > 0 && a.selectionStart === 0 && a.selectionEnd === a.value.length };
});
const celleOre = async (page) => (await (await page.$$('.tbl-dense'))[0].$$('td.edit-cell input[style*="width:48px"]'));

async function apriScheda(browser, url, id) {
  const ctx = await L.nuovoContesto(browser, { id, dati: dati() });
  const page = await L.nuovaPagina(ctx);
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(300); await L.sblocca(page, '123456');
  page._rev = await page.textContent('.cover-header .revtag').catch(() => '');
  await page.evaluate(() => openS(0)); await page.waitForTimeout(200);
  return page;
}

(async () => {
  const browser = await L.chromium.launch();

  // ===================== confronto con la rev 21 =====================
  const p21 = await apriScheda(browser, URL21, 'r22-v21');
  const rev21 = p21._rev;
  let c = (await celleOre(p21))[0];
  await c.click(); await p21.waitForTimeout(150);
  const s21 = await stato(p21);
  rec('V00', 'Rev 21 di confronto caricata', 'targhetta rev 21', rev21, /rev 21/.test(rev21));
  rec('V01', 'Rev 21: clic su una cella delle ore piena', 'selezione NON su tutto (il difetto)', JSON.stringify(s21), !s21.tutto);

  // ===================== rev 22 =====================
  const page = await apriScheda(browser, URL22, 'r22-v22');
  const revFile = (require('fs').readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').match(/rev (\d+) \\u00b7 (\d+[a-z]+\d+)/) || []).slice(1).join(' · ');
  const rev = page._rev;
  rec('T00', 'Targhetta della copertina letta dal file', 'rev ' + revFile, rev, rev.replace(/\s+/g, ' ').indexOf('rev ' + revFile) >= 0);

  // T01 clic su una cella piena: tutto selezionato
  c = (await celleOre(page))[0];
  await c.click(); await page.waitForTimeout(150);
  let s = await stato(page);
  rec('T01', 'Clic su una cella delle ore piena (12,50)', 'selezione = tutto il testo «12,50»', JSON.stringify(s), s.tutto && s.sel === '12,50');
  if (PNG) { await c.screenshot({ path: path.join(PNG, 'cella-sola.png') }).catch(() => {}); }

  // T02 il primo tasto sostituisce; salvato con ✔ Salva
  await page.keyboard.type('7'); await page.waitForTimeout(80);
  s = await stato(page);
  rec('T02', 'Primo tasto «7»', 'la casella contiene solo «7»', s.v, s.v === '7');
  await page.keyboard.press('Tab'); await page.waitForTimeout(250);
  const memo = await page.evaluate(() => A.d[0].years['2026'].services[0].hours[0]);
  rec('T03', 'Uscita con Tab: dato in memoria', '7 (non 12,57 né 712,50)', memo, memo === 7);
  // T04 il Tab seleziona la casella successiva (febbraio, 8,00)
  s = await stato(page);
  rec('T04', 'Tab: la casella successiva (8,00) ha tutto selezionato', 'selezione «8,00»', JSON.stringify(s), s.tutto && s.sel === '8,00');
  await page.keyboard.press('Escape').catch(() => {});
  await page.click('.acts .btn-save').catch(() => {}); await page.waitForTimeout(400);
  const salvato = await page.evaluate(() => JSON.parse(localStorage.getItem('spazioireos_opoc'))[0].years['2026'].services[0].hours[0]);
  rec('T05', '✔ Salva: il dato in archivio è quello nuovo', '7', salvato, salvato === 7);

  // T06 secondo clic: posiziona il cursore
  c = (await celleOre(page))[3];              // aprile 6,25
  await c.click(); await page.waitForTimeout(150);
  const sA = await stato(page);
  const box = await c.boundingBox();
  await page.mouse.click(box.x + box.width - 3, box.y + box.height / 2); await page.waitForTimeout(150);
  const sB = await stato(page);
  rec('T06', 'Primo clic seleziona, secondo clic posiziona il cursore', 'prima tutto, poi cursore senza selezione', JSON.stringify(sA) + ' → ' + JSON.stringify(sB), sA.tutto && sB.s === sB.e);
  await page.keyboard.press('Tab'); await page.waitForTimeout(200);
  const apr = await page.evaluate(() => A.d[0].years['2026'].services[0].hours[3]);
  rec('T07', 'Entrare e uscire senza scrivere non cambia il dato', '6,25', apr, apr === 6.25);

  // T08 pressione lunga col mouse: la selezione resta (il rilascio non la toglie)
  c = (await celleOre(page))[1];
  const b1 = await c.boundingBox();
  await page.mouse.move(b1.x + b1.width / 2, b1.y + b1.height / 2);
  await page.mouse.down(); await page.waitForTimeout(300); await page.mouse.up(); await page.waitForTimeout(150);
  s = await stato(page);
  rec('T08', 'Pressione lunga (300 ms) e rilascio', 'selezione = tutto «8,00»', JSON.stringify(s), s.tutto && s.sel === '8,00');
  await page.keyboard.press('Tab'); await page.waitForTimeout(200);

  // T09 casella a zero: fcl la svuota, nessun errore, all'uscita torna 0,00
  c = (await celleOre(page))[2];
  await c.click(); await page.waitForTimeout(150);
  s = await stato(page);
  rec('T09', 'Casella a zero (marzo)', 'svuotata da fcl, selezione 0-0', JSON.stringify(s), s.v === '' && s.s === 0 && s.e === 0);
  await page.keyboard.press('Tab'); await page.waitForTimeout(200);
  const marV = await page.evaluate(() => document.querySelectorAll('.tbl-dense')[0].querySelectorAll('td.edit-cell input[style*="width:48px"]')[2].value);
  rec('T10', 'Casella a zero lasciata vuota', 'torna «0,00», dato 0', marV + ' / ' + await page.evaluate(() => A.d[0].years['2026'].services[0].hours[2]), marV === '0,00');

  // T11 negativo in archivio: entra (selezione su «-45,50») ed esci senza scrivere: il meno resta
  let rinp = await page.$('.tbl-dense td.edit-cell input[style*="width:52px"]');
  const r0 = await rinp.inputValue();
  await rinp.click(); await page.waitForTimeout(150);
  s = await stato(page);
  await page.keyboard.press('Tab'); await page.waitForTimeout(200);
  rinp = await page.$('.tbl-dense td.edit-cell input[style*="width:52px"]');
  const r1 = await rinp.inputValue();
  const rData = await page.evaluate(() => A.d[0].years['2026'].services[0].residual);
  rec('T11', 'Negativo in archivio: entra (tutto selezionato) ed esci senza scrivere', '«-45,50» selezionato, poi resta «-45,50», dato −45,5', `${r0} sel«${s.sel}» → ${r1}, dato ${rData}`, s.tutto && r1 === r0 && /-45,50/.test(r0) && rData === -45.5);

  // T12 il meno scritto è ancora scartato
  rinp = await page.$('.tbl-dense td.edit-cell input[style*="width:52px"]');
  await rinp.click(); await page.waitForTimeout(150);
  await page.keyboard.type('-3'); await page.keyboard.press('Tab'); await page.waitForTimeout(250);
  const rNeg = await page.evaluate(() => A.d[0].years['2026'].services[0].residual);
  rec('T12', '«-3» scritto sopra la selezione', '3 (il meno scartato da raw)', rNeg, rNeg === 3);

  // T13 data della liquidazione: selezionata; data impossibile rifiutata
  let dinp = await page.$('.tbl-dense td.date-cell input');
  await dinp.click(); await page.waitForTimeout(150);
  s = await stato(page);
  rec('T13', 'Clic sulla data della liquidazione', 'selezione = «15/03/2026»', JSON.stringify(s), s.tutto && s.sel === '15/03/2026');
  await page.keyboard.type('31/02/2026'); await page.keyboard.press('Tab'); await page.waitForTimeout(250);
  dinp = await page.$('.tbl-dense td.date-cell input');
  const dv = await dinp.inputValue(); const dData = await page.evaluate(() => A.d[0].years['2026'].payments[0].date);
  rec('T14', 'Data impossibile scritta sopra la selezione', 'rifiutata: resta 15/03/2026', dv + ' / dato ' + dData, dv === '15/03/2026' && dData === '15/03/2026');
  // data valida scritta sopra
  dinp = await page.$('.tbl-dense td.date-cell input');
  await dinp.click(); await page.waitForTimeout(150);
  await page.keyboard.type('20/03/2026'); await page.keyboard.press('Tab'); await page.waitForTimeout(250);
  const dData2 = await page.evaluate(() => A.d[0].years['2026'].payments[0].date);
  rec('T15', 'Data valida scritta sopra la selezione', '20/03/2026', dData2, dData2 === '20/03/2026');

  // T16 ore e importo della liquidazione (prima si toglie il fuoco: il Tab della data l'ha già portato lì)
  await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.waitForTimeout(80);
  const ore = await page.$('.tbl-dense td.edit-cell input[style*="width:58px"]');
  if (ore) { await ore.click(); await page.waitForTimeout(150); s = await stato(page); await page.keyboard.press('Tab'); await page.waitForTimeout(200); }
  rec('T16', 'Ore della liquidazione', 'tutto selezionato («10,00»)', ore ? JSON.stringify(s) : 'casella non trovata', !!ore && s.tutto && s.sel === '10,00');
  await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.waitForTimeout(80);
  const imp = await page.$('.tbl-dense td.edit-cell .rate-in');
  if (imp) { await imp.click(); await page.waitForTimeout(150); s = await stato(page); await page.keyboard.press('Tab'); await page.waitForTimeout(200); }
  rec('T17', '€/h della liquidazione (.rate-in)', 'tutto selezionato («20,00»)', imp ? JSON.stringify(s) : 'casella non trovata', !!imp && s.tutto && s.sel === '20,00');

  // T18 casella di testo libero NON toccata (attribuzione della liquidazione)
  await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.waitForTimeout(80);
  const att = await page.$('.tbl-dense td.edit-cell input.svc-input');
  if (att) { const ba = await att.boundingBox(); await page.mouse.click(ba.x + 40, ba.y + ba.height / 2); await page.waitForTimeout(150); s = await stato(page); await page.evaluate(() => { document.activeElement && document.activeElement.blur(); if (typeof closePicker === 'function') try { closePicker(); } catch (e) {} }); await page.waitForTimeout(80); }
  rec('T18', 'Casella di testo libero (attribuzione): comportamento di prima', 'nessuna selezione automatica', att ? JSON.stringify(s) : 'casella non trovata', !!att && s.tag !== 'BODY' && s.s === s.e && s.v.length > 0);

  // T19 rettifica credito (Ore), se il pannello è a video
  const rett = await page.$('input[onchange^="rettSetOre"]');
  if (rett) {
    await page.evaluate(() => { const i = document.querySelector('input[onchange^="rettSetOre"]'); i.value = '2,00'; });
    await rett.click(); await page.waitForTimeout(150); s = await stato(page);
    rec('T19', 'Rettifica credito · Ore', 'tutto selezionato', JSON.stringify(s), s.tutto);
    await page.evaluate(() => document.activeElement.blur());
  } else rec('T19', 'Rettifica credito · Ore', 'tutto selezionato', 'pannello non a video in questo scenario', false, 'NON VERIFICATO');

  // anteprima PNG (deviceScaleFactor 2): cella appena entrata, contenuto selezionato
  if (PNG) {
    const cx = await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 2, locale: 'it-IT' });
    await cx.addInitScript(d => { if (!localStorage.getItem('__semina_id')) { localStorage.setItem('__semina_id', 'png'); localStorage.setItem('spazioireos_opoc_pin', '123456'); localStorage.setItem('spazioireos_opoc', JSON.stringify(d)); } }, dati());
    const pp = await L.nuovaPagina(cx);
    await pp.goto(URL22, { waitUntil: 'load' }); await pp.waitForTimeout(300); await L.sblocca(pp, '123456');
    await pp.evaluate(() => openS(0)); await pp.waitForTimeout(250);
    c = (await celleOre(pp))[0];
    await c.click(); await pp.waitForTimeout(250);
    const sp = await stato(pp);
    const bb = await c.boundingBox();
    await pp.screenshot({ path: path.join(PNG, 'cella-selezionata.png'), clip: { x: Math.max(0, bb.x - 220), y: Math.max(0, bb.y - 110), width: 560, height: 190 } });
    rec('P01', 'Anteprima PNG con la cella selezionata', 'tutto selezionato «12,50»', JSON.stringify(sp), sp.tutto && sp.sel === '12,50');
    if (pp._errori.length) page._errori.push.apply(page._errori, pp._errori);
    await cx.close();
  }

  // T20 tocco (telefono, 390px, touch)
  {
    const cx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'it-IT' });
    await cx.addInitScript(d => { if (!localStorage.getItem('__semina_id')) { localStorage.setItem('__semina_id', 'tap'); localStorage.setItem('spazioireos_opoc_pin', '123456'); localStorage.setItem('spazioireos_opoc', JSON.stringify(d)); } }, dati());
    const pt = await L.nuovaPagina(cx);
    await pt.goto(URL22, { waitUntil: 'load' }); await pt.waitForTimeout(300); await L.sblocca(pt, '123456');
    await pt.evaluate(() => openS(0)); await pt.waitForTimeout(250);
    const ct = (await celleOre(pt))[1];
    await ct.scrollIntoViewIfNeeded(); await ct.tap(); await pt.waitForTimeout(250);
    const st = await stato(pt);
    rec('T20', 'Tocco su una cella delle ore (telefono, 390px)', 'selezione = tutto «8,00»', JSON.stringify(st), st.tutto && st.sel === '8,00');
    if (pt._errori.length) page._errori.push.apply(page._errori, pt._errori);
    await cx.close();
  }

  rec('T99', 'Nessun errore di pagina (rev 22 e rev 21)', '0', (page._errori.concat(p21._errori)).join('|') || '0', page._errori.length === 0 && p21._errori.length === 0);
  L.riepilogo('col-rev22');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
