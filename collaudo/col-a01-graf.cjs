// col-a01-graf.cjs — grafica a 390 · 768 · 1280 · 1700 px: scorrimento laterale, comandi <40px e scritte
// <12,5px FUORI dalle tabelle, righe delle due tabelle dense, finestre, Adatta larghezza, allineamento «TS».
// SOLO DATI INVENTATI.
const L = require('./col-a01-lib.cjs');
const { rec } = L;
const h = (m) => { const a = [0,0,0,0,0,0,0,0,0,0,0,0]; for (const k in m) a[k] = m[k]; return a; };
const seed = [
  L.op('ALFA PROVA', {
    '2025': { default_rate: 20.5, services: [L.svc('SERVIZIO A', 20.5, h({0:10,1:5})), L.svc('SERVIZIO B', 30, h({2:8}))], payments: [{ date: '15/03/2025', hours: 10, rate: 20.5, attrib: 'SERVIZIO A' }, { date: '15/04/2025', hours: 2, rate: 30, attrib: 'SERVIZIO B' }] },
    '2026': { default_rate: 20.5, services: [L.svc('SERVIZIO A', 20.5, h({0:4,1:3})), L.svc('SERVIZIO C', 18, h({2:2}))], payments: [{ date: '10/02/2026', hours: 3, rate: 20.5 }] } }),
  L.op('BETA PROVA', { '2026': { default_rate: 18, services: [L.svc('SERVIZIO B', 18, h({0:2}))], payments: [] } }),
];
const misura = () => {
  const W = window.innerWidth;
  const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const fuori = el => !el.closest('table') && !el.closest('.revtag');
  const comandi = Array.from(document.querySelectorAll('button,input:not([type=file]):not([type=checkbox]):not([type=radio]),select')).filter(e => vis(e) && fuori(e) && !e.closest('.pin-box'));
  const bassi = comandi.filter(e => e.getBoundingClientRect().height < 39.5).map(e => (e.textContent || e.placeholder || e.id || e.tagName).trim().slice(0, 25) + ':' + Math.round(e.getBoundingClientRect().height));
  const piccole = [];
  document.querySelectorAll('body *').forEach(el => {
    if (!vis(el) || !fuori(el)) return;
    const testo = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim());
    if (!testo) return;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 12.5) piccole.push(el.textContent.trim().slice(0, 30) + ':' + fs);
  });
  return { sw: document.documentElement.scrollWidth, W, bassi, piccole, comandi: comandi.length };
};
(async () => {
  const browser = await L.chromium.launch();
  for (const w of [390, 768, 1280, 1700]) {
    const ctx = await L.nuovoContesto(browser, { id: 'graf-' + w, dati: seed, viewport: { width: w, height: 900 } });
    const page = await L.nuovaPagina(ctx);
    await L.apri(page);
    let m = await page.evaluate(misura);
    rec(`G${w}-cop`, `Copertina a ${w}px`, `larghezza ${w}, 0 comandi <40px, 0 scritte <12,5px fuori tabelle`, `larghezza ${m.sw}; comandi bassi ${m.bassi.length} ${m.bassi.slice(0, 4).join(' ')}; scritte piccole ${m.piccole.length} ${m.piccole.slice(0, 4).join(' ')}`, m.sw <= w && m.bassi.length === 0 && m.piccole.length === 0);
    await page.evaluate(() => { openS(0); A.anagOpen = false; render(); });
    m = await page.evaluate(misura);
    rec(`G${w}-sch`, `Scheda (2 anni) a ${w}px`, `larghezza ${w}, 0 comandi <40px, 0 scritte <12,5px fuori tabelle`, `larghezza ${m.sw}; comandi bassi ${m.bassi.length} ${m.bassi.slice(0, 5).join(' ')}; scritte piccole ${m.piccole.length} ${m.piccole.slice(0, 5).join(' ')}`, m.sw <= w && m.bassi.length === 0 && m.piccole.length === 0);
    const righe = await page.evaluate(() => Array.from(document.querySelectorAll('.year-block')[0].querySelectorAll('table.tbl-dense')).map(t => Array.from(t.querySelectorAll('tbody tr')).map(tr => Math.round(tr.getBoundingClientRect().height))));
    rec(`G${w}-righe`, `Righe dense (ORE EFFETTUATE | LIQUIDAZIONI) a ${w}px`, 'righe dati ≈23px, totali ≈19-21px (riferimento 23·23·19·23·23·21)', righe.map(r => r.join('·')).join(' | '), righe.flat().every(x => x >= 18 && x <= 32), righe.flat().every(x => x >= 18 && x <= 24) ? 'SUPERATO' : 'PARZIALE');
    // anagrafica aperta
    await page.evaluate(() => { A.anagOpen = true; render(); });
    m = await page.evaluate(misura);
    rec(`G${w}-anag`, `Scheda con ANAGRAFICA aperta a ${w}px`, `larghezza ${w}, 0 comandi <40px, 0 scritte <12,5px`, `larghezza ${m.sw}; bassi ${m.bassi.length} ${m.bassi.slice(0, 4).join(' ')}; piccole ${m.piccole.length} ${m.piccole.slice(0, 4).join(' ')}`, m.sw <= w && m.bassi.length === 0 && m.piccole.length === 0);
    await page.evaluate(() => { A.anagOpen = false; render(); });
    // finestre
    const fin = { newop: 'Nuovo Operatore', newyr: 'Nuovo anno', report: 'Per data', mensile: 'Per mese', listino: 'Listino', modello: 'Modello' };
    for (const k of Object.keys(fin)) {
      await page.evaluate(k => { A.modal = k; render(); }, k);
      const mm = await page.evaluate(() => {
        const md = document.querySelector('.modal'); if (!md) return null;
        const r = md.getBoundingClientRect(); const pic = [];
        md.querySelectorAll('*').forEach(el => { if (el.closest('table')) return; const t = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim()); if (t && parseFloat(getComputedStyle(el).fontSize) < 12.5 && el.getBoundingClientRect().width > 0) pic.push(el.textContent.trim().slice(0, 25) + ':' + getComputedStyle(el).fontSize); });
        return { l: Math.round(r.left), r: Math.round(r.right), pic };
      });
      rec(`G${w}-m-${k}`, `Finestra ${fin[k]} a ${w}px`, `dentro lo schermo, 0 scritte <12,5px (fuori tabelle)`, mm ? `${mm.l}…${mm.r}; piccole ${mm.pic.length} ${mm.pic.slice(0, 4).join(' ')}` : 'non aperta', mm && mm.l >= 0 && mm.r <= w && mm.pic.length === 0);
      await page.evaluate(() => { A.modal = null; render(); });
    }
    if (w === 1280) {
      await page.evaluate(() => { openS(0); });
      const z = await page.evaluate(async () => { fitW(); await new Promise(r => setTimeout(r, 300)); const b = document.querySelector('.sheet-body'); const tabs = Array.from(b.querySelectorAll('table')); const zz = parseFloat(b.style.zoom || '1'); const maxR = Math.max(...tabs.map(t => t.getBoundingClientRect().right * (zz))); return { zoom: b.style.zoom, salvato: localStorage.getItem('spazioireos_opoc_zoom'), sw: document.documentElement.scrollWidth, W: innerWidth }; });
      rec('G-fitW', 'Adatta larghezza a 1280px', 'zoom <1 salvato, nessuno scorrimento', JSON.stringify(z), parseFloat(z.salvato) < 1 && parseFloat(z.salvato) >= 0.4 && z.sw <= z.W);
      await page.evaluate(() => { openS(1); });
      const z2 = await page.evaluate(() => document.querySelector('.sheet-body').style.zoom);
      await page.evaluate(() => zoom100());
      const z3 = await page.evaluate(() => [document.querySelector('.sheet-body').style.zoom, localStorage.getItem('spazioireos_opoc_zoom')]);
      rec('G-zoom', 'Zoom ricordato fra schede; 100% lo toglie', 'zoom riapplicato; poi "" e 1', `altra scheda zoom ${z2}; dopo 100% ${JSON.stringify(z3)}`, !!z2 && z3[0] === '' && z3[1] === '1');
    }
    rec(`G${w}-err`, `Nessun errore di pagina a ${w}px`, '0', page._errori.join('|') || '0', page._errori.length === 0);
    await ctx.close();
  }
  // allineamento dei nomi dei mesi con e senza «TS» (rev 20)
  {
    const P = 'spazio-ireos-foglio-ore';
    const fakeSeed = { id: 'graf-ts', [P]: { reset: true, users: [{ email: 'spazioireos@gmail.com', password: 'prova123', uid: 'ADMIN0001' }],
      docs: { 'users/ADMIN0001': { role: 'admin', email: 'spazioireos@gmail.com' }, 'users/U1': { role: 'worker', cognome: 'ALFA', nome: 'PROVA' },
        'timesheets/U1__2026_1_0': { workerUid: 'U1', year: 2026, month: 1, days: { 2: { t1f: '9:00', t1t: '13:00' } } } } } };
    const ctx = await L.nuovoContesto(browser, { id: 'graf-ts-c', dati: seed, fakeSeed, viewport: { width: 1700, height: 900 } });
    const page = await L.nuovaPagina(ctx);
    await L.apri(page);
    page._risposte.push('spazioireos@gmail.com', 'prova123');
    await page.click('button[onclick="foLogin()"]'); await page.waitForTimeout(500);
    const al = await page.evaluate(async () => {
      openS(0); await new Promise(r => setTimeout(r, 900));
      const th = Array.from(document.querySelectorAll('.year-block')[1].querySelectorAll('th.month-hdr'));
      return th.map(t => { const rg = document.createRange(); rg.selectNodeContents(t.firstChild); return { m: t.firstChild.textContent, y: Math.round(rg.getBoundingClientRect().top), ts: !!t.querySelector('.fo-sugg'), va: getComputedStyle(t).verticalAlign }; });
    });
    const ys = [...new Set(al.map(a => a.y))];
    rec('G-TSall', 'Nomi dei mesi allineati anche col «TS» sotto (rev 20: vertical-align:top)', 'stessa altezza per tutti i 12 mesi', `posizioni ${al.map(a => a.m + (a.ts ? '(TS)' : '') + ':' + a.y).slice(0, 3).join(' ')} … ; vertical-align ${al[0].va}`, ys.length === 1);
    await ctx.close();
  }
  await browser.close();
  L.riepilogo('col-a01-graf');
})().catch(e => { console.error('ERRORE SCRIPT', e); process.exit(2); });
