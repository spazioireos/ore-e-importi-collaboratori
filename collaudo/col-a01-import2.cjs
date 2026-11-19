// col-a01-import2.cjs — import di file con la FORMA di un collaboratore ma il contenuto rotto
// (passano paionoOperatori): l'app resta usabile? SOLO DATI INVENTATI.
const L = require('./col-a01-lib.cjs');
const { rec } = L;
const seed = [L.op('ALFA PROVA', { '2026': { default_rate: 20.5, services: [L.svc('SERVIZIO A', 20.5)], payments: [] } })];
const casi = [
  ['[{"name":"X"}] (senza years)', '[{"name":"X"}]'],
  ['years non oggetto', '[{"name":"X","sheet":"X","years":"abc"}]'],
  ['services non elenco', '[{"name":"X","sheet":"X","years":{"2026":{"services":5}}}]'],
  ['hours mancanti', '[{"name":"X","sheet":"X","years":{"2026":{"default_rate":18,"services":[{"name":"S","rate":18}],"payments":[]}}}]'],
];
(async () => {
  const browser = await L.chromium.launch();
  let n = 0;
  for (const [nome, cont] of casi) {
    n++;
    const ctx = await L.nuovoContesto(browser, { id: 'imp2-' + n, dati: seed });
    const page = await L.nuovaPagina(ctx);
    await L.apri(page);
    const prima = await L.ls(page, 'spazioireos_opoc');
    page._risposte.push(true);
    const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.evaluate(() => impJSON())]);
    await fc.setFiles({ name: 'p.json', mimeType: 'application/json', buffer: Buffer.from(cont) });
    await page.waitForTimeout(400);
    const dopo = await L.ls(page, 'spazioireos_opoc');
    const msgs = page._dialoghi.map(d => d.msg.replace(/\n+/g, ' ').slice(0, 60));
    let usabile = !!(await page.$('.cover-header'));
    if (usabile) { try { await page.evaluate(() => { openS(0); }); usabile = !!(await page.$('.sheet-header')); } catch (e) { usabile = false; } }
    await page.reload(); await L.sblocca(page, '123456'); await page.waitForTimeout(300);
    const dopoRic = !!(await page.$('.cover-header'));
    const ok = (dopo === prima) || (usabile && dopoRic);
    rec('J0' + n, 'Import «' + nome + '»', 'rifiutato, oppure app ancora usabile (copertina+scheda) anche dopo ricarica', `archivio ${dopo === prima ? 'intatto' : 'SOSTITUITO'}; dialoghi «${msgs.join(' / ')}»; scheda ${usabile ? 'ok' : 'NON si apre'}; dopo ricarica ${dopoRic ? 'copertina' : 'PAGINA BIANCA'}; errori ${page._errori.slice(0, 2).join(' | ')}`, ok);
    await ctx.close();
  }
  await browser.close();
  L.riepilogo('col-a01-import2');
})().catch(e => { console.error('ERRORE SCRIPT', e); process.exit(2); });
