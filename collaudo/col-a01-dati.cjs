// col-a01-dati.cjs — backup JSON (opoc-3), import che rifiuta file non validi e archivio intatto,
// backup vero accettato, schema più nuovo, recupero su browser vuoto, timbro fra due schede,
// isolamento delle chiavi (solo spazioireos_opoc*). SOLO DATI INVENTATI.
const L = require('./col-a01-lib.cjs');
const { rec } = L;
const fs = require('fs');
const seed = [
  L.op('ALFA PROVA', { '2026': { default_rate: 20.5, services: [L.svc('SERVIZIO A', 20.5, [4,0,0,0,0,0,0,0,0,0,0,0])], payments: [] } }),
  L.op('BETA PROVA', { '2026': { default_rate: 18, services: [L.svc('SERVIZIO B', 18, [2,0,0,0,0,0,0,0,0,0,0,0])], payments: [] } }),
];
async function importa(page, contenuto, risposte) {
  page._risposte.push(...(risposte || [true]));
  const nd = page._dialoghi.length;
  const [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 4000 }), page.evaluate(() => impJSON())]);
  await fc.setFiles({ name: 'prova.json', mimeType: 'application/json', buffer: Buffer.from(contenuto) });
  await page.waitForTimeout(400);
  return page._dialoghi.slice(nd).map(d => d.tipo + ':' + d.msg.replace(/\n+/g, ' ').slice(0, 90));
}
(async () => {
  const browser = await L.chromium.launch();
  const ctx = await L.nuovoContesto(browser, { id: 'dati-1', dati: seed });
  await ctx.addInitScript(() => {
    window.__chiavi = {};
    const reg = (op) => function (k) { if (!/^__(fakefb|semina)/.test(k)) window.__chiavi[op + ':' + k] = 1; };
    const sI = Storage.prototype.setItem, gI = Storage.prototype.getItem, rI = Storage.prototype.removeItem, cl = Storage.prototype.clear;
    Storage.prototype.setItem = function (k, v) { reg('set')(k); return sI.call(this, k, v); };
    Storage.prototype.getItem = function (k) { reg('get')(k); return gI.call(this, k); };
    Storage.prototype.removeItem = function (k) { reg('remove')(k); return rI.call(this, k); };
    Storage.prototype.clear = function () { window.__chiavi['CLEAR'] = 1; return cl.call(this); };
  });
  const page = await L.nuovaPagina(ctx);
  await L.apri(page);
  // backup
  const b = await L.scarica(page, () => page.click('text=⬇ Backup'));
  const bk = JSON.parse(fs.readFileSync(b.percorso, 'utf8'));
  rec('B01', 'Backup JSON: formato e schema', 'formato opoc-3, versione 3, 2 operatori', `${b.nome}: formato ${bk.formato}, versione ${bk.versione}, operatori ${bk.operatori && bk.operatori.length}`, bk.formato === 'opoc-3' && bk.versione === 3 && bk.operatori.length === 2);
  const lsPrima = await L.ls(page, 'spazioireos_opoc');
  const casi = [
    ['non JSON', '{questo non e json'], ['[1,2,3]', '[1,2,3]'], ['["a"]', '["a"]'], ['[]', '[]'], ['[null]', '[null]'], ['[{x:1}]', '[{"x":1}]'],
    ['{operatori:[1,2,3]}', '{"operatori":[1,2,3]}'], ['backup Dipendenti', JSON.stringify({ version: 4, dipendenti: [{ id: 'd1', nome: 'ROSSI PROVA' }], dati: {} })],
    ['backup USOINT', JSON.stringify({ 'usoint-idx': '[]', __schema: 1, __app: 'USOINT' })], ['oggetto qualunque', '{"a":1}'], ['file vuoto', ''],
    ['backup Fogli ore', JSON.stringify({ exportDate: 'x', users: [{ id: 'u1', name: 'ROSSI' }], timesheets: [] })],
  ];
  const esitiImp = [];
  for (const [nome, cont] of casi) {
    const msg = await importa(page, cont);
    const dopo = await L.ls(page, 'spazioireos_opoc');
    const nOp = await page.evaluate(() => A.d.length);
    const ok = dopo === lsPrima && nOp === 2 && msg.some(m => /alert:Errore/.test(m));
    esitiImp.push(`${nome}:${ok ? 'rifiutato' : 'ACCETTATO/' + msg.join('/')}`);
    rec('I-' + nome, 'Import rifiutato: ' + nome, 'alert «Errore…», archivio e schermo intatti', (ok ? 'rifiutato, intatto' : `dialoghi ${msg.join(' / ')}; archivio ${dopo === lsPrima ? 'intatto' : 'CAMBIATO'}; A.d ${nOp}`), ok);
  }
  const nonBianca = await page.$('.cover-header');
  rec('I20', 'Dopo 12 import rifiutati l\'app funziona', 'copertina presente, 0 errori di pagina', (nonBianca ? 'copertina' : 'PAGINA BIANCA') + ' / errori ' + page._errori.length, !!nonBianca && page._errori.length === 0);
  // schema più nuovo: annulla
  const pkNuovo = Object.assign({}, bk, { versione: 99, operatori: [L.op('NUOVO SCHEMA', { '2026': { default_rate: 18, services: [], payments: [] } })] });
  let msg = await importa(page, JSON.stringify(pkNuovo), [true, false]);
  rec('I21', 'Backup di schema più nuovo (versione 99): annullando', 'avviso + archivio intatto', msg.join(' / ').slice(0, 140) + ' | ' + ((await L.ls(page, 'spazioireos_opoc')) === lsPrima ? 'intatto' : 'CAMBIATO'), /schema più recente/.test(msg.join(' ')) && (await L.ls(page, 'spazioireos_opoc')) === lsPrima);
  // annullare la prima domanda
  msg = await importa(page, JSON.stringify(bk), [false]);
  rec('I22', 'Import: «Sostituire tutti i dati?» annullato', 'archivio intatto', (await L.ls(page, 'spazioireos_opoc')) === lsPrima ? 'intatto' : 'CAMBIATO', (await L.ls(page, 'spazioireos_opoc')) === lsPrima);
  // backup vero (modificato: 3 operatori) accettato
  const bkVero = JSON.parse(JSON.stringify(bk)); bkVero.operatori.push(L.op('GAMMA IMPORTATO', { '2026': { default_rate: 19, services: [L.svc('S', 19)], payments: [] } }));
  msg = await importa(page, JSON.stringify(bkVero), [true]);
  const dopoVero = await L.datiLS(page);
  rec('I23', 'Backup vero accettato e scritto', '3 operatori in archivio e a video', `${dopoVero.length} / video ${await page.$$eval('.op-card', a => a.length)}`, dopoVero.length === 3 && (await page.$$eval('.op-card', a => a.length)) === 3);
  // backup vecchio: array nudo
  msg = await importa(page, JSON.stringify(seed), [true]);
  rec('I24', 'Backup vecchio (array nudo di operatori) accettato', '2 operatori', String((await L.datiLS(page)).length), (await L.datiLS(page)).length === 2);
  // ---------- timbro due schede ----------
  const p2 = await L.nuovaPagina(ctx);
  await L.apri(p2);
  await page.reload(); await L.sblocca(page, '123456');
  await page.evaluate(() => { A.d[0].years['2026'].services[0].hours[1] = 38.25; markD(); });
  await p2.evaluate(() => { A.d[0].years['2026'].services[0].hours[1] = 41.5; markD(); });
  const nd2 = page._dialoghi.length;
  await page.evaluate(() => sv()); await page.waitForTimeout(300);
  const chiestoA = page._dialoghi.length > nd2;
  const timbroA = await L.ls(page, 'spazioireos_opoc__timbro');
  p2._risposte.push(false);
  const nd3 = p2._dialoghi.length;
  await p2.evaluate(() => sv()); await p2.waitForTimeout(300);
  const dlg = p2._dialoghi.slice(nd3)[0];
  let v = (await L.datiLS(page))[0].years['2026'].services[0].hours[1];
  rec('D01', 'Timbro: la prima scheda salva senza domande', 'nessuna domanda, timbro scritto', `${chiestoA ? 'CHIESTO' : 'nessuna domanda'}, timbro ${timbroA ? 'sì' : 'no'}`, !chiestoA && !!timbroA);
  rec('D02', 'Timbro: la seconda scheda avvisa; annullando l\'archivio resta della prima', '«Un\'altra scheda ha salvato dopo di te»; ore = 38,25; timbro invariato', `${dlg ? dlg.msg.split('\n')[0] : 'nessun avviso'}; ore ${v}; timbro ${(await L.ls(page, 'spazioireos_opoc__timbro')) === timbroA ? 'invariato' : 'CAMBIATO'}`, dlg && /altra scheda/.test(dlg.msg) && v === 38.25 && (await L.ls(page, 'spazioireos_opoc__timbro')) === timbroA);
  p2._risposte.push(true);
  await p2.evaluate(() => sv()); await p2.waitForTimeout(300);
  v = (await L.datiLS(page))[0].years['2026'].services[0].hours[1];
  rec('D03', 'Timbro: «OK» sovrascrive davvero', 'ore = 41,5', v, v === 41.5);
  const nd4 = p2._dialoghi.length;
  await p2.evaluate(() => { A.d[0].years['2026'].services[0].hours[2] = 1; markD(); sv(); }); await p2.waitForTimeout(300);
  rec('D04', 'Timbro: il salvataggio successivo della stessa scheda non chiede più', 'nessuna domanda', p2._dialoghi.length === nd4 ? 'nessuna' : 'CHIESTO', p2._dialoghi.length === nd4);
  const bkStr = JSON.stringify(JSON.parse(fs.readFileSync((await L.scarica(page, () => page.evaluate(() => expJSON()))).percorso, 'utf8')));
  rec('D05', 'Il timbro non entra nel backup', 'nessuna «timbro» nel file', /timbro/i.test(bkStr) ? 'PRESENTE' : 'assente', !/timbro/i.test(bkStr));
  await p2.close();
  // ---------- isolamento ----------
  await page.evaluate(() => { openS(0); fitW(); zoom100(); A.modal = 'listino'; render(); A.modal = null; A.v = 'cover'; render(); });
  const chiavi = await page.evaluate(() => Object.keys(window.__chiavi));
  const estranee = chiavi.filter(k => !/:spazioireos_opoc/.test(k));
  rec('X01', 'Isolamento: chiavi di localStorage toccate', 'solo spazioireos_opoc* (più quelle di Firebase/finta Firebase)', estranee.length ? 'ESTRANEE: ' + estranee.join(',') : 'solo: ' + [...new Set(chiavi.map(k => k.split(':')[1]))].join(','), estranee.length === 0);
  // ---------- recupero su browser vuoto con file corrotto e poi buono ----------
  const ctx3 = await L.nuovoContesto(browser, { id: 'rec-1' });
  const p3 = await L.nuovaPagina(ctx3);
  await L.apri(p3);
  const [fc1] = await Promise.all([p3.waitForEvent('filechooser'), p3.click('text=Carica backup dal PC')]);
  await fc1.setFiles({ name: 'rotto.json', mimeType: 'application/json', buffer: Buffer.from('[1,2,3]') });
  await p3.waitForTimeout(300);
  const rm = p3._dialoghi.slice(-1)[0];
  rec('X02', 'Recupero su browser vuoto: file spazzatura rifiutato', 'Errore: Formato non valido, resta sul recupero', `${rm && rm.msg} / ${(await p3.$('.recovery-screen')) ? 'recupero' : 'altro'} / LS ${await L.ls(p3, 'spazioireos_opoc')}`, rm && /Formato non valido/.test(rm.msg) && !!(await p3.$('.recovery-screen')));
  const [fc2] = await Promise.all([p3.waitForEvent('filechooser'), p3.click('text=Carica backup dal PC')]);
  await fc2.setFiles({ name: 'buono.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(bk)) });
  await p3.waitForTimeout(300);
  rec('X03', 'Recupero su browser vuoto: backup vero', '2 schede in copertina', (await p3.$('.cover-header')) ? await p3.textContent('.cover-header p') : 'no', (await p3.$('.cover-header')) && /2 schede/.test(await p3.textContent('.cover-header p')));
  const [fc3] = await Promise.all([p3.waitForEvent('filechooser', { timeout: 3000 }).catch(() => null), p3.evaluate(() => doRecoveryDrive && 0)]);
  rec('X04', 'Recupero da Google Drive', 'non provabile al banco (librerie Google tolte)', 'NON VERIFICATO', false, 'NON VERIFICATO');
  rec('X99', 'Nessun errore di pagina (dati)', '0', [...page._errori, ...p3._errori].join('|') || '0', page._errori.length + p3._errori.length === 0);
  await browser.close();
  L.riepilogo('col-a01-dati');
})().catch(e => { console.error('ERRORE SCRIPT', e); process.exit(2); });
