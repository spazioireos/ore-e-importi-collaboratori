# Istruzioni per Claude — app "Operatori Occasionali" (Collaboratori)

Gestionale dei **collaboratori occasionali** di Spazio Ireos: anagrafica, atti contrattuali,
ore mensili per servizio, tariffe, liquidazioni con ritenuta d'acconto, residui.

- **Unico file**: `index.html` (~212 KB), **JavaScript vanilla** (nessun React, nessun Babel).
- **Dati**: `localStorage` (chiave principale `spazioireos_opoc`) + backup su Google Drive +
  backup JSON automatico. Accesso con **PIN locale**. Nessun Firebase.
- **Numero di revisione**: targhetta `<span class="revtag">rev N · ggmmmaa</span>` nella
  copertina (`rCov`) e nella schermata del PIN (`renderPin`). **Attuale: rev 1 · 29ott26.**
- **Verifica prima del commit**: estrarre il blocco `<script>` inline e passarlo a
  `node --check`. Attenzione agli apici: l'HTML è dentro stringhe JS con apici singoli.
- **Non toccare senza richiesta esplicita**: il motore dei residui "a secchi" (riporto per
  servizio e tariffa tra gli anni), il calcolo del codice fiscale (tabella Belfiore), la
  generazione dei contratti .docx/PDF, il formato di backup `opoc-3`.

## Regole di lavoro (valgono sempre)

1. **Le modifiche a questa app le fa Claude**, lavorando direttamente su questo repository.
   Decisione di Christian del 29/10/2026. NON usare altre chat per generare un `index.html`
   da caricare a mano.
2. **MAI caricare con "Add files via upload" un file preso dal computer**: sostituisce il file
   e cancella le aggiunte fatte qui. Se proprio serve, scaricare PRIMA la versione aggiornata
   da GitHub ("Download raw file"), modificare quella, poi ricaricarla.
3. **Lavorare sempre sul ramo `claude/integrated-app-feasibility-8d1wg0`**, mai direttamente su
   `main`. Si porta su `main` SOLO quando Christian lo chiede esplicitamente ("porta su main").
4. **Prima di committare: verificare che il codice compili** (vedi sotto, cambia per app).
   Non fidarsi dei test: il 28/10 un errore sul percorso dei dati era passato ai test ed è stato
   trovato solo rileggendo il codice.
5. **A ogni revisione: incrementare il numero di revisione mostrato nell'app** (vedi sotto).
   Serve a Christian per capire se sta guardando la versione aggiornata e non una copia in cache.
6. **Claude non viene avvisato dei caricamenti di Christian**: all'inizio di ogni sessione,
   verificare se il ramo è rimasto indietro rispetto a `main` e, se sì, riallinearlo PRIMA di
   lavorare. Non unire mai un ramo che non contiene tutto `main`: cancellerebbe lavoro di Christian.
7. **La pagina integrata** (`integrata/index.html` nel repo `rendicontazione-usoint`) apre i LINK
   LIVE delle app: quando si modifica questa app NON va aggiornata, si aggiorna da sé.
8. Rispondere in italiano, senza narrare i passaggi; chiedere il nulla osta (Nu*) prima di costruire.

