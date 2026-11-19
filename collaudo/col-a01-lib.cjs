// col-a01-lib.cjs — aiuti comuni per il collaudo individuale (Livello A) di Collaboratori.
// SOLO DATI INVENTATI (repository pubblico). Banco: http://127.0.0.1:8340/col/index.html (finta Firebase).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.COL_URL || 'http://127.0.0.1:8340/col/index.html';
const OUT = process.env.COL_OUT || path.join(require('os').tmpdir(), 'col-a01-out');
try { fs.mkdirSync(OUT, { recursive: true }); } catch (e) {}

const esiti = [];
function rec(id, funz, atteso, effettivo, ok, stato) {
  const st = stato || (ok ? 'SUPERATO' : 'FALLITO');
  esiti.push({ id, funz, atteso, effettivo: String(effettivo), stato: st });
  console.log(`${st.padEnd(14)} ${id} | ${funz} | atteso: ${atteso} | effettivo: ${effettivo}`);
}
function riepilogo(nome) {
  const c = {};
  esiti.forEach(e => { c[e.stato] = (c[e.stato] || 0) + 1; });
  console.log(`\n== ${nome}: ${esiti.length} controlli — ` + Object.entries(c).map(([k, v]) => `${k} ${v}`).join(' · '));
  fs.writeFileSync(path.join(OUT, nome + '.json'), JSON.stringify(esiti, null, 1));
}

// Un servizio
function svc(name, rate, hours, extra) { return Object.assign({ name, residual: 0, hours: hours || [0,0,0,0,0,0,0,0,0,0,0,0], rate }, extra || {}); }
function op(name, years, extra) { return Object.assign({ sheet: name, name, years }, extra || {}); }

// Contesto con PIN già impostato e dati seminati UNA volta (guardia __semina_id).
async function nuovoContesto(browser, opt) {
  opt = opt || {};
  const ctx = await browser.newContext({ viewport: opt.viewport || { width: 1500, height: 950 }, acceptDownloads: true, locale: 'it-IT' });
  await ctx.addInitScript(o => {
    try {
      if (o.fakeSeed) window.__FAKEFB_SEED__ = o.fakeSeed;
      if (localStorage.getItem('__semina_id') !== o.id) {
        localStorage.setItem('__semina_id', o.id);
        if (o.pin) localStorage.setItem('spazioireos_opoc_pin', o.pin);
        if (o.dati) localStorage.setItem('spazioireos_opoc', JSON.stringify(o.dati));
        if (o.extra) for (const k in o.extra) localStorage.setItem(k, o.extra[k]);
      }
    } catch (e) {}
  }, { id: opt.id || ('s' + Math.random()), pin: opt.pin === undefined ? '123456' : opt.pin, dati: opt.dati, extra: opt.extra, fakeSeed: opt.fakeSeed });
  return ctx;
}

// Pagina con gestione dei dialoghi: coda di risposte (true/false/stringa) e registro dei messaggi.
async function nuovaPagina(ctx) {
  const page = await ctx.newPage();
  page._dialoghi = []; page._risposte = []; page._errori = [];
  page.on('pageerror', e => page._errori.push(String(e && e.message || e)));
  page.on('dialog', async d => {
    page._dialoghi.push({ tipo: d.type(), msg: d.message() });
    const r = page._risposte.length ? page._risposte.shift() : (d.type() === 'prompt' ? null : true);
    try {
      if (d.type() === 'alert') await d.accept();
      else if (r === false || r === null) await d.dismiss();
      else if (typeof r === 'string') await d.accept(r);
      else await d.accept();
    } catch (e) {}
  });
  return page;
}
async function apri(page, pin) {
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  if (pin !== false) await sblocca(page, pin || '123456');
}
async function sblocca(page, pin) {
  const inp = await page.$('#pinInput');
  if (inp) { await inp.fill(pin); await page.click('.pin-btn'); await page.waitForTimeout(200); }
}
async function ls(page, k) { return page.evaluate(k => localStorage.getItem(k), k); }
async function datiLS(page) { return page.evaluate(() => JSON.parse(localStorage.getItem('spazioireos_opoc') || 'null')); }
async function scarica(page, azione) {
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }), azione()]);
  const p = path.join(OUT, dl.suggestedFilename());
  await dl.saveAs(p);
  return { nome: dl.suggestedFilename(), percorso: p };
}
function num(s) { // "€ 1.234,56" / "−12,50" -> numero
  if (s == null) return NaN; s = String(s).replace(/−/g, '-').replace(/[^0-9,.\-]/g, '');
  return parseFloat(s.replace(/\./g, '').replace(',', '.'));
}
module.exports = { chromium, URL, OUT, rec, riepilogo, esiti, svc, op, nuovoContesto, nuovaPagina, apri, sblocca, ls, datiLS, scarica, num };
