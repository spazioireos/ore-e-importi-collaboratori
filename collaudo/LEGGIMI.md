# Collaudo

Qui vanno gli script di prova di quest'app e quello che serve a ricostruire il banco (stesso schema di
`ore-mensili-dipendenti/collaudo/`): il contenitore in cui lavora Claude può essere ricreato in qualunque
momento e resta solo quello che è su GitHub.

**Solo dati INVENTATI**: il repository è pubblico. I dati veri stanno nella cartella privata di Google Drive «Dati collaudo Spazio Ireos».

Gli script delle revisioni precedenti sono andati persi con il contenitore il 15-19/11/2026: vanno
ricostruiti qui la prossima volta che si tocca quest'app.

## Script del collaudo di Livello A del 19/11/2026 (rev 20)

Girano sul banco comune con finta Firebase (`rendicontazione-usoint/collaudo/comune`, porta 8340); lanciarli da
questa cartella, con `COL_OUT` per la cartella dei file scaricati. `col-a01-lib.cjs` è la libreria comune.

| script | esito sulla rev 20 |
|---|---|
| `col-a01-base.cjs` | 46/47 + 1 parziale |
| `col-a01-calc.cjs` | 26/35 (i falliti sono difetti preesistenti segnalati a Christian) |
| `col-a01-dati.cjs` | 27/28 + 1 non verificato |
| `col-a01-import2.cjs` | 2/4 |
| `col-a01-ts.cjs` | 20/23 |
| `col-a01-graf.cjs` | 46/47 |
| `col-a01-contr.cjs` | 13/15 (modello Word inventato) |
| `col-a01-limiti.cjs` | 7/7 |

## Rev 21 (19/11/2026)

`col-rev21.cjs` prova le sei correzioni della rev 21 con il confronto diretto sulla rev 20 congelata (localizzata
nel banco in `col20/`, oppure `COL20_URL`); `COL_PNG` salva le anteprime. Esito: **53 superati + 1 informativo, 0
falliti**. Batteria `col-a01-*` sulla rev 21: base 46/47 + 1 parziale · calc 31/35 · dati 27/28 + 1 non verificato ·
import2 **4/4** · ts **22/23** · graf 46/47 · contr **14/15** · limiti 7/7. Aggiornate (non aggirate) le attese di
`C03` (targhetta letta dal file) e `K07` (data impossibile ora rifiutata).

## Rev 22 (19/11/2026, in anteprima)

`col-rev22.cjs` prova la selezione di tutto il contenuto all'ingresso nelle caselle numeriche della scheda, con il
confronto diretto sulla rev 21 (`COL21_URL`, predefinito `/col21/` nella stessa origine); `COL_PNG` salva
`cella-selezionata.png`. Esito: **25/25** (con T21: primo tasto prima della selezione rinviata). Batteria sulla rev 22, identica alla rev 21: base 46/47 + 1 parziale ·
calc 31/35 · dati 27/28 + 1 non verificato · import2 4/4 · ts 22/23 · graf 46/47 · contr 14/15 · limiti 7/7 ·
`col-rev21.cjs` 53 + 1 informativo, 0 falliti.

## Rev 25 (23/11/2026, sul ramo di lavoro)

`col-rev25.cjs`: la lettura caduta dei «TS» non va più in giro infinito (riprova dopo 60 s) e i suggerimenti si
rileggono dopo 5 minuti, ridisegnando solo se cambiati e mai con il cursore in una casella. Confronto con la rev 24 congelata
(`/col24/`, oppure `COL24_URL`: si fa con `localizza.py` su `git show <commit rev 24>:index.html`). Esito **25/25**. Batteria sulla
rev 25: base 47/47 · calc 35/35 · dati 27/28 + 1 non verificato · import2 4/4 · ts 23/23 · graf 47/47 · contr 15/15 · limiti 7/7 ·
rev21 53 + 1 informativo · rev22 25/25 · rev25 25/25 (targhetta ora letta dal file).

## Rev 26 (25/11/2026)

`col-rev26.cjs` prova i segnaposto scritti a parole ({{LUOGO DI RESIDENZA}}, anche spezzato da Word) e i sette segnaposto nuovi, con un
modello Word inventato, e il confronto diretto con la rev 25 (`COL25_URL`, predefinito `/col25/`). Esito: **15/15**. Batteria sulla rev 26:
contr 15/15 · base 47/47 · calc 35/35 · dati 27/28 + 1 non verificato · import2 4/4 · ts 23/23 · graf 47/47 · limiti 7/7 · rev21 53 + 1
informativo · rev22 25/25 · rev25 25/25 (targhetta ora letta dal file).

## Rev 27 (27/11/2026, su `main` dal 27/11/2026)

`col-rev27.cjs` prova la chiusura a mano di un servizio («al ‹mese›»), con il confronto diretto sulla rev 26 (`COL26_URL`, predefinito
`/col26/`); `COL_PNG` salva le anteprime. Esito: **19/19**. Batteria sulla rev 27 identica alla rev 26; in `col-rev26.cjs` la revisione
attesa (targhetta e nome del file) ora si legge dal file dell'app.
