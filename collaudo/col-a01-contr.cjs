// col-a01-contr.cjs — contratti .docx (singolo) e PDF in blocco (zip) con un MODELLO INVENTATO costruito qui,
// segnaposto spezzati, codice fiscale (esempio da manuale), export Anagrafica, finestre Atto in blocco /
// Riga servizio in blocco / Allinea nomi, date impossibili. SOLO DATI INVENTATI.
const L = require('./col-a01-lib.cjs');
const { rec } = L;
const fs = require('fs');
const JSZip = require('/home/user/rendicontazione-usoint/collaudo/comune/.strumenti/node_modules/jszip');
const XLSX = require('/home/user/rendicontazione-usoint/collaudo/comune/.banco/lib/xlsx-0.18.5.js');
function par(t) { return `<w:p><w:r><w:t xml:space="preserve">${t}</w:t></w:r></w:p>`; }
async function modello() {
  const z = new JSZip();
  z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  const corpo = [par('CONTRATTO DI PROVA'), par('Collaboratore: {{COGNOME}} {{NOME}}'),
    '<w:p><w:r><w:t>CF: {{CODICE_</w:t></w:r><w:r><w:t>FISCALE}}</w:t></w:r></w:p>',
    par('Importo: {{IMPORTO}} euro {{TIPO_COMPENSO}} - monte {{MONTE_ORE}}'), par('Dal {{DATA_AVVIO}} al {{DATA_CONCLUSIONE}}'),
    par('{{CLAUSOLA_PROROGA}}'), par('Campo inesistente: {{INESISTENTE}}')].join('');
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${corpo}</w:body></w:document>`);
  return (await z.generateAsync({ type: 'nodebuffer' })).toString('base64');
}
(async () => {
  const b64 = await modello();
  const anag = { cognome: 'ROSSI', nome: 'MARIO', luogoNascita: 'ROMA', dataNascita: '01/01/1980', sesso: 'M', email: 'prova@esempio.it', indRes: 'VIA DI PROVA 1', luogoRes: 'ROMA',
    atti: [{ tipoAtto: 'INCARICO INIZIALE', qualifica: 'EDUCATORE', dataContratto: '25/08/2026', dataAvvio: '01/09/2026', dataConclusione: '30/06/2027', importoOC: '1500', corpoOrario: 'CORPO', monteOreTot: '', cadenzamento: 'MENSILE', ggPreavviso: '15', importoPenale: '100', prorogaFlag: true, dataProrogaTacita: '31/08/2027' }] };
  const seed = [L.op('ROSSI MARIO', { '2026': { default_rate: 18, services: [L.svc('S1', 18, [1,0,0,0,0,0,0,0,0,0,0,0])], payments: [] } }, { anag }),
    L.op('BIANCHI PROVA', { '2026': { default_rate: 18, services: [L.svc('S1', 18)], payments: [] } }, { anag: { atti: [{ tipoAtto: 'INCARICO INIZIALE', importoOC: '' }] } })];
  const browser = await L.chromium.launch();
  const ctx = await L.nuovoContesto(browser, { id: 'contr-1', dati: seed, extra: { spazioireos_opoc_modello: JSON.stringify({ nome: 'modello-prova.docx', quando: 'oggi', b64 }) } });
  const page = await L.nuovaPagina(ctx);
  await L.apri(page);
  await page.waitForTimeout(500);
  // codice fiscale
  page._risposte.push(true);
  await page.evaluate(() => cfCalcolaOp(0));
  const cf = await page.evaluate(() => A.d[0].anag.cf);
  rec('K01', 'Codice fiscale calcolato (esempio da manuale ROSSI MARIO 01/01/1980 M ROMA)', 'RSSMRA80A01H501U', cf, cf === 'RSSMRA80A01H501U');
  // contratto .docx
  page._risposte.push(true, true);
  const d = await L.scarica(page, () => page.evaluate(() => genContratto(0, 0)));
  await page.waitForTimeout(400);
  const z = await JSZip.loadAsync(fs.readFileSync(d.percorso));
  const xml = await z.file('word/document.xml').async('string');
  const testo = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const msgFin = page._dialoghi.filter(x => /Lettera generata/.test(x.msg)).map(x => x.msg.replace(/\n+/g, ' ')).join('');
  rec('K02', 'Contratto .docx dal modello: segnaposto compilati (anche quello spezzato da Word)', 'ROSSI MARIO, CF, 1.500,00 euro complessivi, 01 settembre 2026, proroga fino al 31 agosto 2027', `${d.nome}: ${testo.slice(0, 260)}`, /ROSSI MARIO/.test(testo) && /RSSMRA80A01H501U/.test(testo) && /1\.500,00/.test(testo) && /complessivi/.test(testo) && /01 settembre 2026/.test(testo) && /31 agosto 2027/.test(testo));
  rec('K03', 'Segnaposto sconosciuto segnalato a fine generazione', 'avviso «rimasti dei segnaposto non compilati: {{INESISTENTE}}»', msgFin.slice(0, 200), /INESISTENTE/.test(msgFin));
  rec('K04', 'Nome del file del contratto (§10.5)', '«… - ggmmmaa - verN - HH.MM.docx»', d.nome, /\d{2}[a-z]{3}\d{2} - ver/.test(d.nome), /\d{2}[a-z]{3}\d{2} - ver/.test(d.nome) ? 'SUPERATO' : 'FALLITO');
  // contratti in blocco (PDF in zip)
  page._risposte.push(true);
  const zp = await L.scarica(page, () => page.evaluate(() => lettereBlocco()));
  await page.waitForTimeout(500);
  const zz = await JSZip.loadAsync(fs.readFileSync(zp.percorso));
  const nomiZip = Object.keys(zz.files);
  const pdf = nomiZip.length ? await zz.file(nomiZip[0]).async('nodebuffer') : Buffer.alloc(0);
  const conf = page._dialoghi.filter(x => /Genero un contratto/.test(x.msg)).map(x => x.msg.replace(/\n+/g, ' '))[0] || '';
  rec('K05', 'Contratti in blocco: zip con un PDF per chi ha l\'importo; esclusi gli altri', '1 PDF valido (%PDF); BIANCHI escluso «senza importo»', `${zp.nome}: ${nomiZip.join(',')} (${pdf.length} byte, ${pdf.slice(0, 4).toString()}); conferma: ${conf.slice(0, 120)}`, nomiZip.length === 1 && pdf.slice(0, 4).toString() === '%PDF' && /BIANCHI PROVA/.test(conf));
  // export anagrafica
  const xa = await L.scarica(page, () => page.evaluate(() => exportAnagExcel()));
  const wb = XLSX.read(fs.readFileSync(xa.percorso));
  const aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  rec('K06', 'Export Excel delle anagrafiche', 'vero .xlsx con ROSSI e il codice fiscale', `${xa.nome}: ${aoa.length} righe; ${JSON.stringify(aoa.find(r => r.includes('RSSMRA80A01H501U')) ? 'CF presente' : 'CF assente')}; Author=${wb.Props && wb.Props.Author}`, aoa.some(r => r.includes('RSSMRA80A01H501U')));
  // finestre Atto in blocco / Riga servizio in blocco / Allinea nomi
  for (const [fn, nome] of [['bulkOpen', 'Atto in blocco'], ['svcOpen', 'Riga servizio in blocco'], ['nomiOpen', 'Allinea nomi']]) {
    for (const w of [390, 1280]) {
      await page.setViewportSize({ width: w, height: 900 });
      const nd = page._dialoghi.length;
      await page.evaluate(fn => { if (fn === 'nomiOpen') A.d[1].anag.cognome = 'BIANCHINI', A.d[1].anag.nome = 'PROVA'; A.v = 'cover'; A.modal = null; render(); window[fn](); }, fn);
      await page.waitForTimeout(150);
      const mm = await page.evaluate(() => { const md = document.querySelector('.modal'); if (!md) return null; const r = md.getBoundingClientRect(); const pic = []; md.querySelectorAll('*').forEach(el => { if (el.closest('table')) return; const t = Array.from(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim()); if (t && parseFloat(getComputedStyle(el).fontSize) < 12.5 && el.getBoundingClientRect().width > 0) pic.push(el.textContent.trim().slice(0, 20) + ':' + getComputedStyle(el).fontSize); }); return { l: Math.round(r.left), r: Math.round(r.right), pic }; });
      const al = page._dialoghi.slice(nd).map(x => x.msg.slice(0, 50)).join('/');
      rec(`K-${fn}-${w}`, `Finestra ${nome} a ${w}px`, 'dentro lo schermo, 0 scritte <12,5px fuori tabelle', mm ? `${mm.l}…${mm.r}; piccole ${mm.pic.length} ${mm.pic.slice(0, 4).join(' ')}` : `non aperta (${al})`, mm ? (mm.l >= 0 && mm.r <= w && mm.pic.length === 0) : /nessun|tutti/i.test(al), mm ? undefined : 'NON VERIFICATO');
      await page.evaluate(() => { A.modal = null; A.bulk = null; A.svcb = null; A.nomi = null; render(); });
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  // data impossibile nella liquidazione
  await page.evaluate(() => { openS(0); addPay(0, '2026'); });
  const di = await page.$('.date-cell input');
  await di.fill('31/02/2026'); await di.press('Tab'); await page.waitForTimeout(150);
  const vd = await di.inputValue();
  const toastK = await page.evaluate(() => { const t = document.getElementById('toast'); return t ? t.textContent : ''; });
  const datoK = await page.evaluate(() => A.d[0].years['2026'].payments[0].date);
  // rev 21: l'attesa documentava il difetto («segnata in rosso, NON trasformata», ma salvata nei dati).
  // Decisione del 19/11/2026: una data impossibile si RIFIUTA con un avviso e la casella resta com'era (qui vuota).
  rec('K07', 'Data di pagamento impossibile «31/02/2026»', 'rifiutata con avviso, casella com\'era (vuota), nessun 03/03', `casella «${vd}» (dato «${datoK}»); avviso «${toastK}»`, vd === '' && datoK === '' && /Data impossibile/.test(toastK));
  page._risposte.push(true);
  await page.evaluate(() => delPay(0, '2026', 0));
  const dp = page._dialoghi.slice(-1)[0].msg;
  rec('K08', 'Elimina liquidazione con conferma che la descrive', '«Eliminare questa liquidazione?» con data/ore', dp.replace(/\n+/g, ' ').slice(0, 80), /Eliminare questa liquidazione/.test(dp));
  rec('K99', 'Nessun errore di pagina (contratti/report)', '0', page._errori.join('|') || '0', page._errori.length === 0);
  await browser.close();
  L.riepilogo('col-a01-contr');
})().catch(e => { console.error('ERRORE SCRIPT', e); process.exit(2); });
