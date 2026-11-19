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
