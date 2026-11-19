// col-a01-calc.cjs — liquidazioni, ritenuta 20% e netto (ricalcolati a mano), rimborso, residui fra anni,
// rettifica credito ore<->importo, Azzera/Annulla, quadratura del riquadro, report Per mese / Per data /
// Excel dell'anno / Credito per progetto. SOLO DATI INVENTATI.
const L = require('./col-a01-lib.cjs');
const { rec, num } = L;
const XLSX = require('/home/user/rendicontazione-usoint/collaudo/comune/.banco/lib/xlsx-0.18.5.js');
const z12 = () => [0,0,0,0,0,0,0,0,0,0,0,0];
const h = (m, v) => { const a = z12(); for (const k in m) a[k] = m[k]; return a; };
const R2 = (v) => { const s = v < 0 ? -1 : 1; v = Math.abs(v); return s * Math.round(Number((v * 100).toPrecision(12))) / 100; };
const seed = [
  L.op('ALFA PROVA', {
    '2025': { default_rate: 20.5, services: [L.svc('SERVIZIO A', 20.5, h({0:10,1:5})), L.svc('SERVIZIO B', 30, h({2:8}))], payments: [{ date: '15/03/2025', hours: 10, rate: 20.5, attrib: 'SERVIZIO A' }] },
    '2026': { default_rate: 20.5, services: [L.svc('SERVIZIO A', 20.5, h({0:4}))], payments: [] } }),
  L.op('GAMMA PROVA', { '2026': { default_rate: 10.03, services: [L.svc('SERV G', 10.03, h({0:3})), L.svc('SERV G2', 22.99, h({1:75}))], payments: [
    { date: '10/01/2026', hours: 1, rate: 10.03 }, { date: '10/02/2026', hours: 1, rate: 10.03 }, { date: '10/03/2026', hours: 1, rate: 10.03 },
    { date: '20/03/2026', hours: 7.5, rate: 22.99 }, { date: '21/03/2026', hours: 67.5, rate: 22.99 } ] } }),
  L.op('DELTA PROVA', { '2026': { default_rate: 20, services: [L.svc('SERV D', 20, h({0:10}))], payments: [{ date: '05/02/2026', hours: 10, rate: 20, rimborso: true }] } }),
];

(async () => {
  const browser = await L.chromium.launch();
  const ctx = await L.nuovoContesto(browser, { id: 'calc-1', dati: seed });
  const page = await L.nuovaPagina(ctx);
  await L.apri(page);
  const apriOp = (n) => page.evaluate(n => { openS(A.d.findIndex(o => o.name === n)); }, n);
  const righeLiq = (blocco) => page.evaluate(b => {
    const yb = document.querySelectorAll('.year-block')[b];
    const t = yb.querySelectorAll('table.tbl-dense')[1];
    return Array.from(t.querySelectorAll('tbody tr')).map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.querySelector('input') ? td.querySelector('input').value : td.textContent.trim()));
  }, blocco);

  // ---------- GAMMA: ritenuta e netto ricalcolati a mano ----------
  await apriOp('GAMMA PROVA');
  const rg = await righeLiq(0);
  const casi = [[1, 10.03], [1, 10.03], [1, 10.03], [7.5, 22.99], [67.5, 22.99]];
  let okRighe = true, det = [];
  casi.forEach((c, i) => {
    const l = R2(c[0] * c[1]), r = R2(l * 0.2), n = R2(l - r);
    const row = rg[i];
    const ok = num(row[4]) === l && num(row[5]) === r && num(row[6]) === n;
    if (!ok) okRighe = false;
    det.push(`${c[0]}×${c[1]}=${l}/${r}/${n} vs ${row[4]}|${row[5]}|${row[6]}`);
  });
  rec('L01', 'Liquidazioni: lordo, ritenuta 20%, netto riga per riga (5 casi a mano)', '10,03/2,01/8,02 ×3; 172,43/34,49/137,94; 1.551,83/310,37/1.241,46', det.join(' ; '), okRighe);
  const tot = rg[5];
  const sL = R2(30.09 + 172.43 + 1551.83), sRrighe = R2(2.01 * 3 + 34.49 + 310.37), sN = R2(8.02 * 3 + 137.94 + 1241.46);
  rec('L02', 'TOTALE Lordo = somma delle righe', String(sL), tot[4], num(tot[4]) === sL);
  rec('L03', 'TOTALE Netto = somma delle righe', String(sN), tot[6], num(tot[6]) === sN);
  rec('L04', 'TOTALE Rit. 20% = somma delle ritenute delle righe', `${sRrighe} (somma righe)`, `${tot[5]} (lordo ${tot[4]} − rit ${tot[5]} = ${R2(num(tot[4]) - num(tot[5]))} vs netto ${tot[6]})`, num(tot[5]) === sRrighe);
  // credito
  const credH = 3 + 75 - 78, credE = R2(R2(3 * 10.03) + R2(75 * 22.99) - sL);
  rec('L05', 'Ore e importo a credito dopo le liquidazioni (ricalcolo a mano)', `${credH} h / € ${credE}`, `${tot[9]} / ${tot[10]}`, num(tot[9]) === credH && num(tot[10]) === credE);
  const debG = await page.evaluate(() => /A DEBITO/.test(document.querySelector('.year-block').textContent));
  rec('L05b', 'Ore liquidate = ore lavorate (75 h a 22,99 in due righe): niente fascia A DEBITO', 'nessuna fascia rossa per arrotondamenti di riga', debG ? 'fascia «A DEBITO» per € 0,01' : 'nessuna fascia', !debG);

  // ---------- DELTA: rimborso ----------
  await apriOp('DELTA PROVA');
  const rd = await righeLiq(0);
  rec('L06', 'Rimborso: lordo e ritenuta teorici, netto 80%, credito cala del lordo', 'lordo € 200 grigio, rit € 40 grigio, netto € 160 R, credito € 0', `${rd[0][4]} | ${rd[0][5]} | ${rd[0][6]} | cred ${rd[0][10]}`, num(rd[0][6]) === 160 && num(rd[0][10]) === 0);
  // report per mese
  await page.evaluate(() => { A.v = 'cover'; A.modal = 'mensile'; render(); });
  const mens = await page.$$eval('.modal tbody tr', trs => trs.map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim())));
  const feb = mens.find(r => r[0] === 'Feb 2026');
  rec('R01', 'Per mese: febbraio 2026 (solo il rimborso di DELTA + 1 liq. GAMMA)', 'netto = 8,02 + 160,00 (netto del rimborso nella scheda) = € 168,02', feb ? feb.join(' | ') : 'riga assente', feb && num(feb[3]) === 168.02);
  const marzo = mens.find(r => r[0] === 'Mar 2026');
  rec('R02', 'Per mese: marzo 2026 lordo/rit/netto', `lordo ${R2(10.03 + 172.43 + 1551.83)} rit ${R2(2.01 + 34.49 + 310.37)} netto ${R2(8.02 + 137.94 + 1241.46)}`, marzo ? marzo.join(' | ') : 'assente', marzo && num(marzo[1]) === R2(10.03 + 172.43 + 1551.83) && num(marzo[2]) === R2(2.01 + 34.49 + 310.37) && num(marzo[3]) === R2(8.02 + 137.94 + 1241.46));
  const fx = await L.scarica(page, () => page.click('.modal .btn-xls'));
  const wbM = XLSX.read(require('fs').readFileSync(fx.percorso));
  const aoaM = XLSX.utils.sheet_to_json(wbM.Sheets[wbM.SheetNames[0]], { header: 1 });
  const febX = aoaM.find(r => r[0] === 'Feb 2026');
  rec('R03', 'Per mese → Excel: vero .xlsx, stessi numeri, autore', 'Feb netto = valore a video; Author Christian Canonica', `${fx.nome}; Feb ${JSON.stringify(febX)}; Author=${wbM.Props && wbM.Props.Author}`, febX && febX[3] === num(feb[3]) && wbM.Props && wbM.Props.Author === 'Christian Canonica');
  // report per data
  await page.evaluate(() => { A.modal = 'report'; render(); });
  await page.fill('#repFrom', '05/02/2026');
  const fd = await L.scarica(page, () => page.evaluate(() => doReport()));
  const wbD = XLSX.read(require('fs').readFileSync(fd.percorso));
  const aoaD = XLSX.utils.sheet_to_json(wbD.Sheets[wbD.SheetNames[0]], { header: 1 });
  const rD = aoaD.find(r => r[2] === 'DELTA PROVA');
  rec('R04', 'Per data (05/02/2026): rimborso DELTA', 'netto coerente con la scheda (€ 160)', rD ? `lordo ${rD[7]} rit ${rD[8]} netto ${rD[9]} rimborso ${rD[10]} (file ${fd.nome})` : 'assente', rD && rD[9] === 160);
  // intervallo e date sbagliate
  await page.evaluate(() => { A.modal = 'report'; render(); toggleRepMode('range'); });
  await page.waitForTimeout(100);
  await page.fill('#repFrom2', '01/01/2026'); await page.fill('#repTo', '31/12/2026');
  const fr = await L.scarica(page, () => page.evaluate(() => doReport()));
  const aoaR = XLSX.utils.sheet_to_json(XLSX.read(require('fs').readFileSync(fr.percorso)).Sheets['Report liquidazioni'], { header: 1 });
  const totR = aoaR.find(r => typeof r[2] === 'string' && r[2].startsWith('TOTALI'));
  rec('R05', 'Per data intervallo 2026: 6 liquidazioni, totale ore', '6 liq., ore 88', totR ? `${totR[2]} ore ${totR[5]} lordo ${totR[7]} rit ${totR[8]} netto ${totR[9]}` : 'assente', totR && /6 liquidazioni/.test(totR[2]) && totR[5] === 88);
  await page.evaluate(() => { A.modal = 'report'; render(); toggleRepMode('single'); });
  await page.waitForTimeout(100);
  await page.fill('#repFrom', '31/02/2026');
  const nd0 = page._dialoghi.length;
  let dl2 = null; page.once('download', d => dl2 = d);
  await page.evaluate(() => doReport()); await page.waitForTimeout(400);
  const msgD = page._dialoghi.slice(nd0).map(d => d.msg).join(' / ');
  rec('R06', 'Per data con data impossibile «31/02/2026»', 'rifiutata con avviso', `${msgD || 'nessun avviso'}${dl2 ? ' + FILE SCARICATO ' + dl2.suggestedFilename() : ''}`, !dl2 && /non valide/i.test(msgD), (!dl2 && /non valide/i.test(msgD)) ? 'SUPERATO' : 'FALLITO');
  await page.evaluate(() => { A.modal = null; render(); });
  // Excel anno 2026
  const fy = await L.scarica(page, () => page.evaluate(() => exportYear('2026')));
  const wbY = XLSX.read(require('fs').readFileSync(fy.percorso));
  const liq = XLSX.utils.sheet_to_json(wbY.Sheets['Liquidazioni 2026'], { header: 1 });
  const saldoG = liq.find(r => r[1] === 'GAMMA PROVA - SALDO');
  const riep = XLSX.utils.sheet_to_json(wbY.Sheets['Riepilogo 2026'], { header: 1 });
  const totY = riep.find(r => r[1] === 'TOTALI');
  const sporchi = (totY || []).filter(v => typeof v === 'number' && String(v).replace('-', '').split('.')[1] && String(v).split('.')[1].length > 4);
  rec('R07', 'Excel anno 2026: fogli e saldo GAMMA', 'Riepilogo/Liquidazioni/Certificazioni; saldo lordo 1754,35', `${wbY.SheetNames.join(',')}; saldo ${JSON.stringify(saldoG && saldoG.slice(5, 8))}; file ${fy.nome}`, wbY.SheetNames.length === 3 && saldoG && saldoG[5] === sL);
  rec('R08', 'Excel anno: riga TOTALI senza numeri «sporchi» (es. 0,30000000000004)', 'tutti a 2 decimali', sporchi.length ? 'sporchi: ' + sporchi.join(',') : 'puliti', sporchi.length === 0);
  rec('R09', 'Excel anno: autore nei metadati (§10.1)', 'Author Christian Canonica', (wbY.Props && wbY.Props.Author) || 'NESSUN AUTORE', !!(wbY.Props && wbY.Props.Author === 'Christian Canonica'));
  rec('R10', 'Nome dei file esportati secondo §10.5', '«descrizione - ggmmmaa - verN - HH.MM.ext» senza trattini bassi', `${fy.nome} · ${fd.nome} · ${fx.nome}`, !/_/.test(fy.nome + fd.nome + fx.nome));
  // Credito per progetto
  const fc = await L.scarica(page, () => page.evaluate(() => exportCreditoProgetto()));
  const wbC = XLSX.read(require('fs').readFileSync(fc.percorso));
  const c1 = XLSX.utils.sheet_to_json(wbC.Sheets['Credito per progetto'], { header: 1 });
  const totC = c1.find(r => r[0] === 'TOTALE');
  // atteso: ALFA ultimo anno 2026 = 424,5 ; GAMMA 2026 = credE ; DELTA 0
  rec('R11', 'Credito per progetto: netto euro = somma dei secchi (ore × tariffa) dell\'ultimo anno', '€ 424,50 (ALFA 424,50 + GAMMA 0 secchi)', totC ? totC[9] + ` (somma dei «crediti» a video: ${R2(424.5 + credE)})` : 'assente', totC && R2(totC[9]) === 424.5);

  // ---------- residui fra anni (ALFA) ----------
  await apriOp('ALFA PROVA');
  const grigie = await page.evaluate(() => Array.from(document.querySelectorAll('.year-block')[1].querySelectorAll('table.tbl-dense')[0].querySelectorAll('tbody tr')).filter(tr => tr.style.background).map(tr => Array.from(tr.querySelectorAll('td')).map(t => t.textContent.trim()).filter(x => x).join(' ')));
  rec('Y01', 'Residui 2025 portati nel 2026 come righe grigie per servizio', 'Res.2025 SERVIZIO A 5h €20,50 · SERVIZIO B 8h €30', grigie.slice(0, 2).join(' || '), grigie.length >= 2 && /SERVIZIO A.*5,00/.test(grigie[0]) && /SERVIZIO B.*8,00/.test(grigie[1]));
  const riquadro = (b) => page.evaluate(b => {
    const yb = document.querySelectorAll('.year-block')[b]; if (!yb) return null;
    const box = Array.from(yb.querySelectorAll('div')).find(d => d.firstElementChild && d.firstElementChild.tagName === 'DIV' && /^Il credito .* viene da:$/.test(d.firstElementChild.textContent.trim()));
    if (!box) return [];
    return Array.from(box.children).slice(1).map(r => r.textContent.replace(/\s+/g, ' ').trim());
  }, b);
  const q26 = await riquadro(1);
  rec('Y02', 'Riquadro «Il credito 2026 viene da»', '102,50 + 240,00 + 82,00 = 424,50', q26.join(' | '), q26.length === 3 && /102,50/.test(q26[0]) && /240,00/.test(q26[1]) && /82,00/.test(q26[2]));
  const st26 = await page.evaluate(() => { const c = compLiq(A.d[A.sel], '2026'); return [c.oreRes, c.impRes]; });
  rec('Y03', 'Credito 2026 = riporto 2025 (13 h / 342,50) + 4 h × 20,50', '17 h / € 424,50', st26.join(' / '), st26[0] === 17 && st26[1] === 424.5);

  // ---------- rettifica credito ----------
  const rettIn = async (b, k) => (await page.$$(`.year-block:nth-of-type(1) input[onchange^="rett"]`)).length ? null : null;
  async function scriviRett(campo, val) {
    const sel = campo === 'ore' ? 'input[onchange^="rettSetOre"]' : 'input[onchange^="rettSetImp"]';
    const el = (await page.$$(sel))[0];
    await el.click(); await el.fill(val); await el.press('Tab'); await page.waitForTimeout(150);
  }
  const stato25 = () => page.evaluate(() => { const o = A.d[A.sel]; const y = o.years['2025']; const c = compLiq(o, '2025'); const c6 = compLiq(o, '2026'); return { ro: y.rettOre, ri: y.rettImp, oreRes: c.oreRes, impRes: c.impRes, o26: c6.oreRes, i26: c6.impRes }; });
  await scriviRett('ore', '7');
  let s = await stato25();
  rec('T01', 'Rettifica: 7 ore → importo calcolato dal motore (5×20,50 + 2×30)', 'rettImp 162,50; credito 6 h / € 180; 2026 riporta 180', JSON.stringify(s), s.ro === 7 && s.ri === 162.5 && s.oreRes === 6 && s.impRes === 180 && s.i26 === 262);
  let q25 = await riquadro(0);
  rec('T02', 'Riquadro 2025 quadra dopo rettifica ore', 'SERVIZIO B 6 h € 180,00', q25.join(' | '), q25.length === 1 && /180,00/.test(q25[0]));
  await scriviRett('imp', '100');
  s = await stato25();
  rec('T03', 'Rettifica: € 100 → ore per bisezione (100/20,50)', 'rettOre 4,88; credito € 242,50', JSON.stringify(s), s.ro === 4.88 && s.ri === 100 && s.impRes === 242.5);
  q25 = await riquadro(0);
  const somma25 = R2(q25.reduce((a, t) => a + num(t.split('€').pop()), 0));
  rec('T04', 'Quadratura: righe del riquadro sommano al credito', '€ 242,50', `${somma25} (${q25.join(' | ')})`, somma25 === 242.5);
  await scriviRett('ore', '-3');
  s = await stato25();
  rec('T05', 'Rettifica ore «-3»', 'entra 3 (niente negativi), importo 61,50', `${s.ro} / ${s.ri}`, s.ro === 3 && s.ri === 61.5);
  await scriviRett('ore', '0');
  s = await stato25();
  rec('T06', 'Rettifica a 0 azzera entrambe', '0 / 0', `${s.ro} / ${s.ri}`, s.ro === 0 && s.ri === 0);
  await scriviRett('ore', '20');
  s = await stato25();
  const banner = await page.evaluate(() => /A DEBITO/.test(document.querySelectorAll('.year-block')[0].textContent));
  rec('T07', 'Rettifica oltre il credito (20 h su 13)', 'credito negativo e fascia «A DEBITO»', `${s.oreRes} h / € ${s.impRes}; fascia ${banner}`, s.oreRes < 0 && banner);
  await scriviRett('ore', '0');
  page._risposte.push(false);
  await page.evaluate(() => azzeraCredito(A.sel, '2025'));
  s = await stato25();
  const msgAz = page._dialoghi.slice(-1)[0].msg;
  rec('T08', 'Azzera credito: annullando non cambia; messaggio senza HTML', 'credito 13 / 342,5', `${s.oreRes}/${s.impRes}; «${msgAz.replace(/\n/g, ' ').slice(0, 70)}»`, s.oreRes === 13 && s.impRes === 342.5 && !/<span/.test(msgAz));
  page._risposte.push(true);
  await page.evaluate(() => azzeraCredito(A.sel, '2025'));
  s = await stato25();
  rec('T09', 'Azzera credito confermato', 'ore 0, euro 0, 2026 riparte da 4 h / 82', JSON.stringify(s), s.oreRes === 0 && s.impRes === 0 && s.o26 === 4 && s.i26 === 82);
  const nd = page._dialoghi.length;
  await page.click('text=Annulla rettifica');
  s = await stato25();
  rec('T10', 'Annulla rettifica: torna a 13 / 342,50', '13 / 342,5', `${s.oreRes}/${s.impRes}`, s.oreRes === 13 && s.impRes === 342.5);
  rec('T11', 'Annulla rettifica chiede conferma? (§10.1 cancellazione dati)', 'conferma', page._dialoghi.length > nd ? 'chiede' : 'NESSUNA CONFERMA', page._dialoghi.length > nd, page._dialoghi.length > nd ? 'SUPERATO' : 'PARZIALE');

  // ---------- quadratura e totali su scenari casuali ----------
  const ris = await page.evaluate(() => {
    let seedR = 7; const rnd = () => { seedR = (seedR * 16807) % 2147483647; return seedR / 2147483647; };
    const tar = [18, 20.5, 22.99, 10.03, 30, 17.35];
    const salva = A.d; let scarti = 0, prove = 0, ritDiv = 0, netDiv = 0, errori = [];
    for (let k = 0; k < 120; k++) {
      const yrs = {};
      ['2025', '2026'].forEach(y => {
        const svcs = []; const ns = 1 + Math.floor(rnd() * 3);
        for (let s = 0; s < ns; s++) { const hh = [0,0,0,0,0,0,0,0,0,0,0,0]; for (let m = 0; m < 12; m++) if (rnd() < 0.4) hh[m] = Math.round(rnd() * 4000) / 100; svcs.push({ name: 'S' + s, residual: 0, hours: hh, rate: tar[Math.floor(rnd() * tar.length)] }); }
        const pays = []; const np = Math.floor(rnd() * 4);
        for (let p = 0; p < np; p++) pays.push({ date: '1' + p + '/0' + (p + 1) + '/' + y, hours: Math.round(rnd() * 3000) / 100, rate: svcs[Math.floor(rnd() * ns)].rate });
        yrs[y] = { default_rate: 18, services: svcs, payments: pays };
      });
      A.d = [{ name: 'CASO ' + k, sheet: 'C' + k, years: yrs }]; A.sel = 0; A.v = 'sheet';
      try { render(); } catch (e) { errori.push(String(e)); continue; }
      document.querySelectorAll('.year-block').forEach((yb, bi) => {
        const yr = ['2025', '2026'][bi]; const cl = compLiq(A.d[0], yr);
        const box = Array.from(yb.querySelectorAll('div')).find(d => d.firstElementChild && d.firstElementChild.tagName === 'DIV' && /^Il credito .* viene da:$/.test(d.firstElementChild.textContent.trim()));
        if (box) { prove++; let som = 0; Array.from(box.children).slice(1).forEach(r => { const t = r.querySelector('span[style*="font-weight:900"]').textContent.replace(/−/, '-').replace(/[^0-9,\-]/g, '').replace(',', '.'); som = R2(som + parseFloat(t)); }); if (Math.abs(R2(som - cl.impRes)) > 0.001) scarti++; }
        if (cl.rows.length) { let sr = 0; cl.rows.forEach(r => sr = R2(sr + r.rit)); if (R2(sr) !== cl.totRit) ritDiv++; if (R2(cl.totLordo - cl.totRit) !== cl.totNetto) netDiv++; }
      });
    }
    A.d = salva; A.v = 'cover'; render();
    return { prove, scarti, ritDiv, netDiv, errori: errori.length };
  });
  rec('Q01', 'Quadratura riquadro su 120 scenari casuali (2 anni, riporto, liquidazioni)', '0 scarti fra righe e credito', JSON.stringify(ris), ris.scarti === 0 && ris.errori === 0);
  rec('Q02', 'Registro liquidazioni: «Rit. 20%» del TOTALE = somma delle ritenute di riga', '0 casi diversi', `${ris.ritDiv} anni su ${ris.prove} con ritenuta totale ≠ somma righe; ${ris.netDiv} con lordo−rit ≠ netto`, ris.ritDiv === 0);
  rec('C99', 'Nessun errore di pagina (calcoli)', '0', page._errori.join('|') || '0', page._errori.length === 0);
  await browser.close();
  L.riepilogo('col-a01-calc');
})().catch(e => { console.error('ERRORE SCRIPT', e); process.exit(2); });
