// col-rev26.cjs — rev 26: la lettera riconosce i segnaposto scritti a parole ({{LUOGO DI RESIDENZA}}) e legge
// sette campi della scheda che prima nessun segnaposto leggeva. Confronto diretto con la rev 25 congelata
// (banco comune: /col25/, oppure COL25_URL). MODELLO WORD E DATI INVENTATI.
const L = require('./col-a01-lib.cjs');
const { rec } = L;
const fs = require('fs');
const JSZip = require('/home/user/rendicontazione-usoint/collaudo/comune/.strumenti/node_modules/jszip');
const URL25 = process.env.COL25_URL || L.URL.replace('/col/', '/col25/');
const par = t => `<w:p><w:r><w:t xml:space="preserve">${t}</w:t></w:r></w:p>`;
async function modello(corpo) {
  const z = new JSZip();
  z.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  z.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${corpo.join('')}</w:body></w:document>`);
  return (await z.generateAsync({ type: 'nodebuffer' })).toString('base64');
}
// Modello «a parole», come quello di Christian (e con un segnaposto spezzato da Word in due blocchi)
const NUOVO = [par('CONTRATTO DI PROVA'), par('Collaboratore: {{COGNOME}} {{NOME}}, nato a {{LUOGO_NASCITA}} il {{Data di nascita}}'),
  '<w:p><w:r><w:t xml:space="preserve">residente a {{LUOGO DI </w:t></w:r><w:proofErr w:type="spellStart"/><w:r><w:t>RESIDENZA}}</w:t></w:r></w:p>',
  par('in {{INDIRIZZO DI RESIDENZA}} CAP {{CAP DI RESIDENZA}}'),
  par('domicilio: {{IND_DOMICILIO}}, {{CAP_DOMICILIO}} {{LUOGO DEL DOMICILIO}} — sesso {{SESSO}}'),
  par('atto: {{TIPO ATTO}} — note: {{NOTE}}'), par('Campo inventato: {{CAMPO SCONOSCIUTO}}')];
// Modello «di prima», solo con i nomi che l'app conosceva già
const VECCHIO = [par('CONTRATTO DI PROVA'), par('Collaboratore: {{COGNOME}} {{NOME}}'),
  '<w:p><w:r><w:t>CF: {{CODICE_</w:t></w:r><w:r><w:t>FISCALE}}</w:t></w:r></w:p>',
  par('residente a {{LUOGO_RESIDENZA}} in {{IND_RESIDENZA}}'),
  par('Importo: {{IMPORTO}} euro {{TIPO_COMPENSO}} - monte {{MONTE_ORE}}'), par('Dal {{DATA_AVVIO}} al {{DATA_CONCLUSIONE}} - penale {{PENALE}}'),
  par('{{CLAUSOLA_PROROGA}}'), par('Campo inesistente: {{INESISTENTE}}')];
const atto = { tipoAtto: 'INCARICO INIZIALE', qualifica: 'EDUCATORE', dataContratto: '25/08/2026', dataAvvio: '01/09/2026', dataConclusione: '30/06/2027', importoOC: '1500', corpoOrario: 'CORPO', monteOreTot: '', cadenzamento: 'MENSILE', ggPreavviso: '15', importoPenale: '', note: 'NOTA DI PROVA' };
const anagPiena = { cognome: 'ROSSI', nome: 'MARIO', luogoNascita: 'ROMA', dataNascita: '01/01/1980', sesso: 'M', cf: 'RSSMRA80A01H501U', email: 'prova@esempio.it',
  indRes: 'VIA DI PROVA 1', capRes: '20100', luogoRes: 'MILANO', indDom: 'VIA DOMICILIO 2', capDom: '20200', luogoDom: 'MONZA', atti: [atto] };
const anagCorta = { cognome: 'ROSSI', nome: 'MARIO', luogoNascita: 'ROMA', dataNascita: '01/01/1980', cf: 'RSSMRA80A01H501U', indRes: 'VIA DI PROVA 1', luogoRes: 'MILANO',
  atti: [Object.assign({}, atto, { note: '' })] };
const yr = { '2026': { default_rate: 18, services: [L.svc('S1', 18)], payments: [] } };
async function lettera(browser, url, b64, anag, id) {
  const ctx = await L.nuovoContesto(browser, { id, dati: [L.op('ROSSI MARIO', JSON.parse(JSON.stringify(yr)), { anag: JSON.parse(JSON.stringify(anag)) })],
    extra: { spazioireos_opoc_modello: JSON.stringify({ nome: 'modello-prova.docx', quando: 'oggi', b64 }) } });
  const page = await L.nuovaPagina(ctx);
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(300); await L.sblocca(page, '123456'); await page.waitForTimeout(400);
  const targa = await page.evaluate(() => (document.querySelector('.revtag') || {}).textContent || '');
  const d = await L.scarica(page, () => page.evaluate(() => genContratto(0, 0)));
  await page.waitForTimeout(500);
  const z = await JSZip.loadAsync(fs.readFileSync(d.percorso));
  const xml = await z.file('word/document.xml').async('string');
  const testo = xml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
  const dlg = page._dialoghi.map(x => x.msg.replace(/\n+/g, ' '));
  const conferma = dlg.filter(x => /non sono compilati/.test(x))[0] || '';
  const fine = dlg.filter(x => /Lettera generata/.test(x))[0] || '';
  // contratti in blocco (PDF in zip), sullo stesso modello
  const zp = await L.scarica(page, () => page.evaluate(() => lettereBlocco()));
  await page.waitForTimeout(600);
  const zz = await JSZip.loadAsync(fs.readFileSync(zp.percorso));
  const nomi = Object.keys(zz.files); const pdf = nomi.length ? await zz.file(nomi[0]).async('nodebuffer') : Buffer.alloc(0);
  const confBlocco = page._dialoghi.map(x => x.msg.replace(/\n+/g, ' ')).filter(x => /Genero un contratto/.test(x))[0] || '';
  const errori = page._errori.slice();
  await ctx.close();
  return { targa, nome: d.nome, testo, conferma, fine, pdfOk: pdf.slice(0, 4).toString() === '%PDF', confBlocco, errori };
}
(async () => {
  const browser = await L.chromium.launch();
  const bN = await modello(NUOVO), bV = await modello(VECCHIO);
  const n25 = await lettera(browser, URL25, bN, anagPiena, 'r26-a');
  const n26 = await lettera(browser, L.URL, bN, anagPiena, 'r26-b');
  rec('S00', 'Versioni a confronto', 'rev 25 e rev 26', `${n25.targa.trim()} / ${n26.targa.trim()}`, /rev 25/.test(n25.targa) && /rev 26/.test(n26.targa));
  rec('S01', 'rev 25 · {{LUOGO DI RESIDENZA}} resta scritto (difetto riprodotto)', 'nella lettera «{{LUOGO DI RESIDENZA}}», nessun avviso', `${n25.testo.match(/residente a [^ ]+ [^ ]+ [^ ]+/)} · avviso: ${/rimasti dei segnaposto/.test(n25.fine) ? 'sì ' + (n25.fine.match(/compilati:([^.]*)/) || [])[1] : 'no'}`,
    /\{\{LUOGO DI RESIDENZA\}\}/.test(n25.testo) && !/LUOGO DI RESIDENZA/.test(n25.fine));
  rec('S02', 'rev 26 · {{LUOGO DI RESIDENZA}} (anche spezzato da Word) diventa la residenza', '«residente a MILANO»', n26.testo.match(/residente a [^ ]+/), /residente a MILANO/.test(n26.testo) && !/LUOGO DI RESIDENZA/.test(n26.testo));
  rec('S03', 'rev 26 · {{Data di nascita}} in minuscolo', '«il 01 gennaio 1980»', n26.testo.match(/il [0-9]{2} [a-z]+ [0-9]{4}/), /il 01 gennaio 1980/.test(n26.testo));
  rec('S04', 'rev 26 · {{INDIRIZZO DI RESIDENZA}} e {{CAP DI RESIDENZA}}', '«in VIA DI PROVA 1 CAP 20100»', n26.testo.match(/in VIA[^C]*CAP [0-9]*/), /in VIA DI PROVA 1 CAP 20100/.test(n26.testo));
  rec('S05', 'rev 26 · segnaposto nuovi: domicilio, sesso, tipo atto, note', 'VIA DOMICILIO 2, 20200 MONZA · M · INCARICO INIZIALE · NOTA DI PROVA',
    (n26.testo.match(/domicilio:.*NOTA DI PROVA/) || [''])[0], /domicilio: VIA DOMICILIO 2, 20200 MONZA — sesso M/.test(n26.testo) && /atto: INCARICO INIZIALE — note: NOTA DI PROVA/.test(n26.testo));
  rec('S06', 'rev 26 · un nome sconosciuto scritto a parole è segnalato', 'avviso con {{CAMPO_SCONOSCIUTO}}', (n26.fine.match(/compilati:([^.]*)/) || [''])[0], /CAMPO_SCONOSCIUTO/.test(n26.fine));
  rec('S07', 'rev 26 · contratti in blocco (PDF) sullo stesso modello', 'zip con un PDF valido', `pdf ${n26.pdfOk}`, n26.pdfOk);
  // dati mancanti: i segnaposto nuovi contano solo se il modello li usa
  const c26 = await lettera(browser, L.URL, bN, anagCorta, 'r26-c');
  rec('S08', 'rev 26 · modello che usa i campi nuovi, scheda senza: l\'avviso li nomina', 'SESSO, CAP_RESIDENZA, IND_DOMICILIO, CAP_DOMICILIO, LUOGO_DOMICILIO, NOTE', c26.conferma.slice(0, 220),
    ['SESSO', 'CAP_RESIDENZA', 'IND_DOMICILIO', 'CAP_DOMICILIO', 'LUOGO_DOMICILIO', 'NOTE'].every(k => c26.conferma.indexOf(k) >= 0));
  // non regressione: modello di prima, stessa lettera e stessi avvisi della rev 25
  const v25 = await lettera(browser, URL25, bV, anagCorta, 'r26-d');
  const v26 = await lettera(browser, L.URL, bV, anagCorta, 'r26-e');
  rec('S09', 'Modello di prima: testo della lettera identico alla rev 25', 'identico', v25.testo === v26.testo ? 'identico' : `25: ${v25.testo.slice(0, 120)} / 26: ${v26.testo.slice(0, 120)}`, v25.testo === v26.testo);
  rec('S10', 'Modello di prima: avviso dei dati mancanti identico alla rev 25', 'identico (i campi nuovi non compaiono)', v26.conferma.slice(0, 200), v25.conferma === v26.conferma && !/SESSO|NOTE|DOMICILIO/.test(v26.conferma));
  rec('S11', 'Modello di prima: conferma dei contratti in blocco identica alla rev 25', 'identica', v26.confBlocco.slice(0, 160), v25.confBlocco === v26.confBlocco);
  const s25 = v25.fine.replace(/Lettera generata: .*?\.docx/, ''), s26 = v26.fine.replace(/Lettera generata: .*?\.docx/, '');
  rec('S12', 'Modello di prima: {{INESISTENTE}} ancora segnalato', 'avviso con {{INESISTENTE}}', (s26.match(/compilati:([^.]*)/) || [''])[0], /\{\{INESISTENTE\}\}/.test(s26));
  rec('S13', 'Nome del file: revisione 26', '«… - rev26 - HH.MM.docx»', v26.nome, /- rev26 - \d{2}\.\d{2}\.docx$/.test(v26.nome));
  const err = [n26, c26, v26].reduce((a, x) => a.concat(x.errori), []);
  rec('S14', 'Errori di pagina sulla rev 26', '0', err.length + (err.length ? ': ' + err.join(' | ') : ''), err.length === 0);
  await browser.close();
  L.riepilogo('col-rev26');
})();
