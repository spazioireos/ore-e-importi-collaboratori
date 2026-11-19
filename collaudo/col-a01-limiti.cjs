// col-a01-limiti.cjs — casi limite: negativi nelle altre porte (Importo € della riga servizio in blocco,
// ore e €/h delle liquidazioni), «1.234,56» (decisione: non si corregge), zero, campo vuoto. SOLO DATI INVENTATI.
const L = require('./col-a01-lib.cjs');
const { rec } = L;
const seed = [L.op('ALFA PROVA', { '2026': { default_rate: 18, services: [L.svc('S1', 18, [5,0,0,0,0,0,0,0,0,0,0,0])], payments: [] } }),
  L.op('BETA PROVA', { '2026': { default_rate: 18, services: [L.svc('S1', 18)], payments: [] } })];
(async () => {
  const browser = await L.chromium.launch();
  const ctx = await L.nuovoContesto(browser, { id: 'lim-1', dati: seed });
  const page = await L.nuovaPagina(ctx);
  await L.apri(page);
  await page.evaluate(() => { svcOpen(); svcSet('servizio', 'NUOVO SERV'); svcSet('rate', '-18,50'); svcSet('anno', '2026'); svcTutti(true); });
  const rt = await page.evaluate(() => A.svcb.rate);
  page._risposte.push(true);
  await page.evaluate(() => svcCrea());
  const righe = await page.evaluate(() => A.d.map(o => o.years['2026'].services.filter(s => s.name === 'NUOVO SERV').map(s => s.rate)));
  rec('E01', 'Riga servizio in blocco: Importo € «-18,50»', '18,50 su entrambi', `${rt} → ${JSON.stringify(righe)}`, rt === '18,50' && righe.every(r => r.length === 1 && r[0] === 18.5));
  await page.evaluate(() => { openS(0); addPay(0, '2026'); });
  const ins = await page.$$('.year-block table.tbl-dense:nth-of-type(2) td.edit-cell input');
  const oreIn = (await page.$$('input[onchange*="payments[0].hours"]'))[0];
  await oreIn.click(); await oreIn.fill('-3'); await oreIn.press('Tab'); await page.waitForTimeout(100);
  const rateIn = (await page.$$('input[onchange*="payments[0].rate"]'))[0];
  await rateIn.click(); await rateIn.fill('-20'); await rateIn.press('Tab'); await page.waitForTimeout(100);
  const p = await page.evaluate(() => A.d[0].years['2026'].payments[0]);
  rec('E02', 'Liquidazione: ore «-3» e €/h «-20»', '3 e 20', `${p.hours} / ${p.rate}`, p.hours === 3 && p.rate === 20);
  const c = (await page.$$('input[onchange*="services[0].hours[1]"]'))[0];
  await c.click(); await c.fill('1.234,56'); await c.press('Tab'); await page.waitForTimeout(100);
  const v = await page.evaluate(() => A.d[0].years['2026'].services[0].hours[1]);
  rec('E03', '«1.234,56» nelle ore (decisione di Christian: non lo scrive mai, non si corregge)', 'noto: diventa 1,234', v, v === 1.234, 'SUPERATO');
  const c2 = (await page.$$('input[onchange*="services[0].hours[2]"]'))[0];
  await c2.click(); await c2.fill('0'); await c2.press('Tab'); await page.waitForTimeout(100);
  const zc = await c2.evaluate(e => e.className + '|' + e.value);
  rec('E04', 'Zero in una cella', '«0,00» in grigio (zero-val)', zc, /zero-val/.test(zc) && /0,00/.test(zc));
  const c3 = (await page.$$('input[onchange*="services[0].hours[0]"]'))[0];
  await c3.click(); const vIn = await c3.inputValue(); await c3.fill(''); await c3.press('Tab'); await page.waitForTimeout(100);
  const v3 = await page.evaluate(() => A.d[0].years['2026'].services[0].hours[0]);
  rec('E05', 'Svuotare una cella con 5 ore', '0', `${vIn} → ${v3}`, v3 === 0);
  const piena = (await page.$$('input[onchange*="services[0].hours[3]"]'))[0];
  await piena.click(); await piena.fill('99999999'); await piena.press('Tab'); await page.waitForTimeout(100);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  rec('E06', 'Numero enorme (99.999.999 ore) in una cella', 'accettato senza errori di pagina (nessun tetto previsto in questa app)', `scrollWidth ${sw}, errori ${page._errori.length}`, page._errori.length === 0, 'SUPERATO');
  rec('E99', 'Nessun errore di pagina (limiti)', '0', page._errori.join('|') || '0', page._errori.length === 0);
  await browser.close();
  L.riepilogo('col-a01-limiti');
})().catch(e => { console.error('ERRORE SCRIPT', e); process.exit(2); });
