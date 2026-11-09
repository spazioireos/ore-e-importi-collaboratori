# Istruzioni per Claude — app "Operatori Occasionali" (Collaboratori)

Gestionale dei **collaboratori occasionali** di Spazio Ireos: anagrafica, atti contrattuali,
ore mensili per servizio, tariffe, liquidazioni con ritenuta d'acconto, residui.

- **Unico file**: `index.html` (~212 KB), **JavaScript vanilla** (nessun React, nessun Babel).
- **Dati**: `localStorage` (chiave principale `spazioireos_opoc`) + backup su Google Drive +
  backup JSON automatico. Accesso con **PIN locale**. Nessun Firebase.
- **Numero di revisione**: targhetta `<span class="revtag">rev N · ggmmmaa</span>` nella
  copertina (`rCov`) e nella schermata del PIN (`renderPin`). **Attuale: rev 13 · 09nov26.**
- **Leggibilità (rev 2, 31/10/2026)**: blocco in fondo al `<style>`. Testo base a 15px, nessuna
  scritta sotto i 12px (c'erano 78 misure sotto i 10px), grigi chiari (#999/#aaa/#bbb) portati a
  `#4b5563`, caselle e pulsanti alti almeno 40px, bordo blu sulla casella attiva. Le misure
  minuscole sono dentro l'attributo `style`, perciò si recuperano con `[style*="..."]` e
  `!important`. Misurato dopo: **zero** bersagli sotto i 40px.
- 🎨 **Colori (rev 3, 03/11/2026)** — passata di *frontend-design* chiesta da Christian. Via la
  palette "Material" presa in prestito, dentro la stessa scala blu di Dipendenti:
  `#2f6fae` testata, `#1f4e82` barra della scheda, `#5a9ce2` filetto dei cartellini,
  `#64748b`/`#475569` per i grigi. **Il magenta/cremisi della pulsantiera Contratti è sparito**
  (`#880e4f`, `#ad1457`, `#c2185b` → blu). Ora il colore dice **che tipo di azione è**: blu =
  dati e contratti, verde = report, grigio = anagrafiche, **rosso solo per cancellare**.
  I quattro bordi pastello dei gruppi sono diventati un bordo neutro `#d7dde5`: a distinguere il
  gruppo è il colore del titolo.
- **Etichette più grandi (rev 3)**: tolti i `text-transform:uppercase` dal CSS delle etichette
  (`.kpi .kl`, `.op-card .sv .sl`, `.sec-lbl`), che sono passate da 9-10px a 12,5px.
  ⚠️ **Le parole non sono state cambiate**: il 03/11/2026 Christian ha chiesto di rimettere
  esattamente le sue diciture (`OPERATORI OCCASIONALI`, `DATI`, `ANAGRAFICHE`, `CONTRATTI`,
  `REPORT`, `CADENZA DI PAGAMENTO`, `DA IMPOSTARE`), ed è stato fatto. Vale la regola permanente
  al §10.6: **le diciture non si toccano**.
  ⚠️ **NON toccare le targhette della cadenza** (`MENSILE`, `BIMESTRALE`, `01FEB/01LUG`…):
  `CADPAG_OPTS` contiene **valori salvati nei dati** di ogni collaboratore, non etichette —
  cambiarli altererebbe i dati.
- 🔴 **IL ROSSO SIGNIFICA PERICOLO, e basta** (da rev 4, 03/11/2026). Prima il rosso era anche
  decorazione: fascia «ANNO 2026» `#A72920`, fascia «ORE EFFETTUATE` `#DC143C`, cornice degli
  anni pari `#7b1f2e`, l'anno nella frase «Il credito … viene da». Con lo stesso rosso dei
  pulsanti che cancellano, l'allarme non si distingueva più. Ora: titolo dell'anno `#1f4e82`,
  le due fasce di sezione su `#eef5fc` con scritta `#1f4e82`, cornici degli anni `#1f4e82`
  (pari) e `#64748b` (dispari). **Il rosso resta solo** sul pulsante *Elimina*, su *Azzera
  credito residuo* e sulla fascia «ATTENZIONE: L'OPERATORE È A DEBITO» — che è un allarme vero.
  Non rimetterlo altrove.
- **Zeri leggibili (rev 4)**: `.zero` e `.zero-val` erano `#c8ced6`, che sul bianco si stacca
  meno di 2 volte (ne servono 4,5): ora `#64748b`. Restano riconoscibili come "vuoto" ma si
  leggono.
- 📐 **Righe compatte e «Adatta larghezza»** (rev 5, 03/11/2026). Dentro la scheda l'anno non
  entrava più in una schermata. Due interventi, in fondo al `<style>` e nella barra di
  navigazione:
  - **solo dentro le tabelle** le caselle scendono da 40 a 28px e le celle hanno meno imbottitura
    (`table input,table select{min-height:28px}`, `table th{padding:2px 5px}`,
    `table td{padding:1px 4px}`). ⚠️ **Fuori dalle tabelle non cambia niente**: pulsanti e
    caselle restano alti 40px, come vuole il blocco leggibilità della rev 2. Misurato: righe da
    41-47px a 19-40px, scheda da 943 a 864px di altezza.
  - **`fitW()`** (pulsante *⤢ Adatta larghezza*) rimpicciolisce `.sheet-body` con `zoom` quanto
    basta perché la tabella più larga entri, **verificando davvero** dopo ogni passo (bordi e
    imbottiture ingannano il conto: senza la verifica si fermava a 0,97 e l'ultima colonna
    restava tagliata; con la verifica arriva a 0,94 ed entra). `zoom100()` torna alla misura
    normale. La misura scelta si ricorda in `localStorage` (`spazioireos_opoc_zoom`, limitata fra
    0,4 e 1) e si riapplica a ogni ridisegno della scheda, non sulla copertina.
- 🔠 **I numeri che scrivi sono il dato** (rev 6, 03/11/2026, Christian: «le celle per
  inserimento ore contengono numeri troppo piccoli»). Le ore, le date e le tariffe scritte a mano
  erano a **13px in tondo**, più piccole del testo intorno (15px): la cosa meno leggibile della
  tabella era proprio il dato. Ora `.edit-cell input`, `.date-cell input`, `.rate-in` e
  `.rate-hdr` sono a **15px in neretto**, così si staccano dai numeri **calcolati** dall'app, che
  restano a 12-13px. Le righe non si sono alzate (restano 21-43px). Il nome del servizio resta a
  11px: ha uno `style` in riga con `!important` scritto dal JavaScript, e per cambiarlo
  servirebbe toccare il codice che disegna la riga — **non fatto**, non era richiesto.
- 🚫 **NIENTE NEGATIVI, E AVVISO SUI NOMI DOPPI** (rev 11, 09/11/2026, due risposte di Christian
  alla ricognizione: «**A4**: vieta sempre i negativi nelle celle compilabili da me» e «**A5**:
  avviso non bloccante»).
  - **A4** — il collaudo aveva misurato che **`-5`** nelle ore **sottraeva** (riga da 50,00 a
    45,00 ore, importo 1.057,50 €) **senza nessun avviso**. La correzione è in **`raw()`**, il
    punto **unico** da cui passano tutti i numeri scritti a mano: non accetta più il segno meno.
    ⚠️ **Verificato prima di toccarlo** che tutte le chiamate di `raw()` sono su **valori di
    caselle** (`this.value`, `el.value`, `inputs[i].value`): nessuna legge un dato salvato,
    quindi **le rettifiche calcolate dall'app non sono toccate** (`azzeraCredito` usa
    `parseFloat`, non `raw`).
    ⚠️ **I valori negativi già nei dati NON vengono cambiati**: si impedisce solo di scriverne.
  - **A5** — due collaboratori con lo **stesso nome** venivano accettati in silenzio. Ora
    `creaOp()` avvisa: «Esiste già un collaboratore con questo nome … Puoi crearlo lo stesso, ma
    nell'elenco saranno difficili da distinguere. Vuoi crearlo?» ⚠️ **Non bloccante**:
    rispondendo **sì** si crea. ⚠️ **Dicitura nuova, scritta da Claude.**
  - **Provato in esecuzione** (`rev11.cjs`, **8 controlli su 8**, zero errori di pagina): `-7`
    battuto diventa `7,00`, `-12,5` incollato diventa `12,50`, `8,5` entra come prima; con un
    nome già esistente compare l'avviso, rispondendo **no** il collaboratore non si crea (3 → 3)
    e rispondendo **sì** sì (3 → 4).

- 🛡️ **UN FILE JSON QUALUNQUE NON SI IMPORTA PIÙ** (rev 13, 09/11/2026, difetto trovato dal
  **collaudo delle INTERCONNESSIONI**).
  - 🔴 **Misurato**: `scarta()` accettava **ogni** `Array.isArray(data)` senza guardarci dentro.
    Importando un file che contiene `[1,2,3]` la conferma non diceva niente di anomalo,
    `spazioireos_opoc` veniva **sostituito con la spazzatura**, poi l'app lanciava «Cannot convert
    undefined or null to object» e restava con la **pagina BIANCA anche dopo il ricaricamento**:
    recuperabile **solo da un backup**. `scartaSicuro` non se ne accorgeva, perche' controllava
    soltanto `pk.operatori.length`, e `[1,2,3]` ha lunghezza 3.
    ⚠️ I backup **di un'altra app** erano invece già respinti correttamente: il buco era solo
    sugli **array**.
  - **La correzione**: funzione nuova **`paionoOperatori(a)`**, usata in **entrambi** i rami di
    `scarta` (l'array nudo dei backup vecchi e `{operatori:[...]}`). È larga di proposito, per non
    rifiutare un backup storico: ogni elemento deve essere un **oggetto**, e almeno uno deve avere
    uno dei campi di un collaboratore (`name`, `sheet`, `years`, `anag`, `default_rate`).
    È il §10.1: «prima validare, poi — solo se valido — sovrascrivere».
  - **Provato in esecuzione** (`ic-fix.cjs` 11 casi su `scarta`, `ic-fix3.cjs` **13 controlli su
    13** su `scartaSicuro` e sul percorso completo): `[1,2,3]`, `["a"]`, `[]`, `[null]`,
    `[{x:1}]`, `{operatori:[1,2,3]}`, i backup di Dipendenti e di USOINT, un oggetto qualunque e
    un file che non è JSON vengono **tutti rifiutati** con l'avviso «Errore: Formato non valido»,
    e l'archivio **non viene toccato**; un **backup vero** viene ancora accettato (3
    collaboratori). **Zero errori di pagina.**
  - 🟠 **Due cose che il collaudo delle interconnessioni ha trovato e che NON sono state
    toccate** (servono una decisione di Christian):
    1. **due schede aperte si cancellano a vicenda in silenzio**: nessun timbro, nessun avviso,
       l'ultimo 💾 riscrive tutto l'elenco. È lo stesso difetto chiuso in Dipendenti con la
       ver144 (misurato: il 41,5 della prima scheda sparisce, resta il 38,25 della seconda);
    2. le quattro app stanno tutte sulla **stessa origine** `spazioireos.github.io`, quindi
       condividono **un solo `localStorage`**: la separazione è data **solo** dal prefisso delle
       chiavi. ⚠️ **Oggi non fa danni, misurato**: nessuna app legge o scrive le chiavi di
       un'altra, e i prefissi non si sovrappongono.
  - ✅ **ISOLAMENTO CONFERMATO IN ESECUZIONE** (24 controlli): Collaboratori non legge e non
    scrive **nessuna** chiave delle altre app (spia su `Storage.prototype`: tocca solo
    `spazioireos_opoc`, `_colors`, `_pin`, `_zoom`), non ha **nessun** collegamento a Firebase
    (0 occorrenze nel file; le uniche richieste esterne sono 6 verso Google Fonts), convive con
    Dipendenti nello stesso browser senza disturbarlo, e i backup delle altre app vengono
    respinti senza toccare niente.

- 🚫 **I NEGATIVI CHIUSI ANCHE DALLE ALTRE TRE PORTE, E L'ULTIMO HTML NEI DIALOGHI**
  (rev 12, 09/11/2026, quattro difetti **trovati dal SECONDO collaudo**: la rev 11 e la rev 10
  avevano chiuso **meno** di quanto dichiaravano).
  - 🔴 **La rev 11 diceva che `raw()` è «il punto unico da cui passano tutti i numeri scritti a
    mano». NON era vero**: è il punto unico delle caselle delle **tabelle**. Tre caselle
    compilabili non ci passavano, e il difetto **A4 era ancora aperto da lì**:
    | casella | come si leggeva | misurato |
    |---|---|---|
    | **«Costo orario €»** del modulo *Nuovo Operatore* (`nR`) | `parseFloat` | `-10` accettato → tariffa del 1° servizio **−10**, e nella scheda **«−€ 100,00»** per 10 ore |
    | **«Costo orario predefinito €»** del modulo *Nuovo anno* (`nyR`) | `parseFloat` | `-25` accettato |
    | **«Importo €»** del pannello della *riga servizio in blocco* | `euroIn`, la cui espressione **ammette il meno per costruzione** | `-18,50` accettato → `rate = -18.5` nei dati |
    ⚠️ Era **esattamente il difetto originario** (il negativo sottrae senza avviso), da un'altra
    porta — e la più pericolosa è `nR`, che si usa **ogni volta che si crea un collaboratore**.
    **Correzione**: le prime due leggono ora con **`raw()`** (identica a `parseFloat` su tutto il
    resto: vuoto e zero danno ancora 18); per la terza il segno si toglie dentro **`svcSet`**, nel
    punto unico in cui l'importo viene normalizzato.
  - 🔴 **E un `f2()` era rimasto scoperto dentro un `confirm`** (il difetto **B5** che la rev 10
    doveva chiudere): nel dialogo di `setStartM` l'elenco dei mesi usava `f2(hv)` nudo, protetto
    solo dalla guardia `hv>0`, che **non basta** — un valore positivo che arrotonda a zero la
    supera. **Misurato con 0,0001 ore** (valore che si può scrivere a mano e che resta nei dati):
    il dialogo mostrava «Gen (**`<span class="zero">0,00</span>`**h)». Ora dice «Gen (0,00h)».
    ⚠️ **Regola da ricordare**: va avvolto in `soloTesto` **ogni** `f2()`/`fE()` che finisce in un
    `confirm`/`alert`, non solo quelli che si pensa possano valere zero.
  - **Provato in esecuzione** (`sc-op-rev12.cjs`, `sc-op-rev12b.cjs`, `sc-op-rev12c.cjs`): `-10`
    nel Nuovo Operatore dà tariffa **10** e nella scheda **zero** importi «−€»; `-25` nel Nuovo
    anno non produce tariffe negative; `-18,50` nell'Importo € diventa **18,50**; il dialogo con
    0,0001 ore non contiene più codice HTML. **Non regressione**: `67,5 × 22,99 = 1.551,83`,
    `raw()` identica sui numeri buoni (`8,5` → 8.5, `0` → 0, vuoto → 0), un costo orario normale
    (22,99) e uno vuoto (valore di riserva 18) entrano come prima. **Zero errori di pagina.**
  - 🟠 **DUE COSE SEGNALATE A CHRISTIAN E NON TOCCATE** (servono una sua decisione):
    1. **`1.234,56` nelle ore e nelle tariffe diventa 1,23**: `raw()` sostituisce solo la **prima**
       virgola e non tocca i punti (`"1.234,56"` → `"1.234.56"` → `parseFloat` = **1.234**).
       ⚠️ **Difetto PREESISTENTE, verificato**: la `raw()` di prima della rev 11 dà lo stesso
       risultato. Però il §10.2 chiede che «l'utente scriva 1.234,56 e il parsing lo capisca», e la
       stessa app ha `euroIn()` che lo legge giusto: **due porte leggono lo stesso numero in due
       modi diversi**. Non corretto perché cambierebbe **come si interpreta ciò che si scrive**.
    2. **Un negativo già in archivio, per un istante, si vede senza il meno**: entrando e uscendo
       da una casella senza scrivere, `blurFmt` riformatta con `raw()`, che ora scarta il segno.
       **Misurato**: dato `-45,5` → casella «−45,50» → dopo entra/esci **«45,50»** → dopo il
       ridisegno di nuovo «−45,50». **Il dato non viene mai alterato** e l'incoerenza è
       transitoria, ma è l'unico effetto collaterale **introdotto** dalla rev 11, e quelle
       rettifiche negative le scrive l'app stessa con «Azzera credito residuo». La correzione
       tocca `blurFmt`, che riformatta **tutte** le caselle: serve il suo via libera.

- 🧹 **NIENTE PIÙ CODICE HTML NELLE FINESTRE, E LE ULTIME SCRITTE PICCOLE** (rev 10, 09/11/2026,
  difetti **B4** e **B5** del collaudo generale, corretti su richiesta di Christian).
  - **B5 — dentro una conferma si leggeva codice HTML.** `f2()` e `fE()` restituiscono
    **HTML** quando il valore è **zero o negativo** (`<span class="zero">`, `<span class="neg">`);
    dentro un `confirm()`, che mostra **testo**, i tag si vedevano scritti. Misurato dal
    collaudo: «Residuo iniziale: **`<span class="zero">0,00</span>`**».
    **Correzione**: una funzione nuova **`soloTesto(x)`** che toglie i tag, usata nei **tre**
    dialoghi che li contenevano (eliminazione di un servizio, «Azzera credito residuo», avviso
    sui mesi già compilati). ⚠️ **`f2` e `fE` NON sono state toccate**: servono al disegno della
    pagina. **Misurato**: `f2(0)` grezzo dà `<span class="zero">0,00</span>`, ripulito **`0,00`**.
  - **B4 — tre scritte a 12px fuori dalle tabelle** (§10.6): il cartellino **«NON SALVATO»**
    (`.unsaved`) e i due pulsanti **«Elimina 2025»/«Elimina 2026»** (`.btn-del-yr`). Il blocco
    della rev 8 non le vedeva perché sono **regole di classe**, non misure scritte nell'attributo
    `style`. ⚠️ Le regole originali non sono state toccate.
    **Misurato**: da 3 a **0**, e le **righe delle due tabelle dense restano 23·23·19·23·23·21**,
    identiche alla rev 5/6/7.
  - **Provato in esecuzione** (`fix-b45.cjs`, **8 controlli su 8**, zero errori di pagina).

- 📐 **COMPATTAZIONE: PIU' ROBA A SCHERMO, STESSI COLORI E STESSE ALTEZZE** (rev 9, 08/11/2026,
  richiesta di Christian: «REVISIONE GRAFICA COMPLESSIVA DEL GESTIONALE — l'interfaccia attuale
  presenta spaziature eccessive»). Intervento **di solo CSS**: un blocco nuovo in fondo al
  `<style>`, **nessuna riga di JavaScript, nessun attributo HTML, nessuna classe nuova**.
  - 🔑 **TRE SCELTE DI CHRISTIAN, prese con una domanda PRIMA di costruire**, perché la sua
    richiesta conteneva due contraddizioni interne:
    1. **niente verde**: la codifica a colori per provenienza del dato (giallo manuale / verde
       parametro / azzurro formula / bianco incerto) **non è ottenibile dal solo CSS**, perché
       «parametro preassegnato» e «compilazione manuale» nel DOM sono **la stessa casella**:
       servirebbe un contrassegno nel JavaScript, che il suo stesso vincolo vietava. **Rimandata**
       (sua risposta: «Parte 2 hai fatto bene a non fare»);
    2. **i colori già scelti da lui vincono sempre**: qui **nessun colore è stato toccato**;
    3. **le altezze NON si riducono**: la sua richiesta chiedeva di abbassare anche caselle,
       tendine e pulsanti, ma il §10.6 dice il contrario; **vale il §10.6**, si stringono solo
       gli SPAZI.
  - ⚠️ **Il verde non si può fare senza toccare il codice**: non riproporlo come se bastasse il
    CSS. Se un giorno lo si vorrà davvero, serve il suo permesso per **un solo contrassegno** sulle
    caselle precompilate da un parametro.
  - **Che cosa si stringe**: copertina (`.cover-header`, `.cover-body`, `.toolbar`, `.kpi-bar`,
    `.kpi`, `.op-grid`, `.op-card`), scheda (`.sheet-header`, `.sheet-body`, `.year-sep`,
    `.year-block`, `.ytitle`, `.carry-box`, `.sec-lbl`, `.bal-summary`), `.nav-bar`, `.modal`,
    più le spaziature scritte in riga (**senza** spazio dopo i due punti).
  - 🐞 **DIFETTO PREESISTENTE CORRETTO: a 390px la scheda sbordava di lato**, misurati
    **415px su 390**. Non era la tabella (sta già nel suo riquadro che scorre) ma **`.acts`**, la
    riga dei pulsanti della scheda («✔ Salvato · + Anno 2027 · ⬇ 2025 · ⬇ 2026 · Elimina»),
    larga 307px e **senza `flex-wrap`**. ⚠️ **La rev 8 non l'aveva visto perché il suo backup di
    prova aveva UN SOLO anno**, quindi un pulsante «⬇ anno» invece di due: con due annualità
    ricompare. Chiuso con `flex-wrap:wrap` dentro la media query che c'era già.
    **Misurato: 415 → 390px.**
  - **Misurato in esecuzione** a 390 · 768 · 1280 · 1680px: copertina **da −5,1% a −7,5%**,
    scheda da −3,4% a −4,7%.
  - ✅ **NON cambiati**: le **righe delle due tabelle dense** (`23·23·19·23·23·21` → identiche,
    quindi rev 5 / rev 6 / rev 7 intatte); **0 comandi sotto i 40px fuori dalle tabelle**, su 19 in
    copertina e 24 nella scheda; scritte sotto i 12,5px identiche. **Zero errori di pagina.**
  - ⚠️ **Le celle non sono state toccate**, quindi la larghezza che **`fitW()`** ha misurato e
    salvato in `localStorage` resta valida: lo zoom salvato non va rifatto.
- 📱 **A 390px LA SCHEDA NON SCORRE PIÙ DI LATO, E NIENTE RESTA SOTTO I 12,5px** (rev 8,
  07/11/2026, trovati con l'**audit generale del gestionale** e corretti con il Nu\* di
  Christian). **Due difetti PREESISTENTI, entrambi di solo aspetto**: nessuna dicitura, nessun
  dato, nessun calcolo toccati.
  - **A) La scheda dell'operatore scorreva di lato sul telefono**: misurati **478px su 390**.
    Non era la tabella (quella scorre già dentro il suo riquadro): era la **barra di
    navigazione**, che non andava a capo, e dentro c'è la tendina **«Vai a operatore…»** larga
    160px. Aggiunta una `@media (max-width:900px)` — la **prima** dell'app, che non ne aveva
    nessuna — con `flex-wrap` su `.nav-bar`/`.nav-left`/`.nav-right` e `max-width:100%` su
    `.op-selector`. **Misurato: 478 → 390px.**
  - **B) Scritte sotto i 12,5px fuori dalle tabelle** (regola §10.6): i pulsantini `.btn-sm` e
    `.btn-add-pay` a **10px**, `.btn-add-yr`/`.os`/`.drive-status` a **11px**, le etichette
    `.kl`/`.sl` e `.cover-header p` a **12px**, più tutte le misure 8-11px scritte
    nell'attributo `style`. ⚠️ Il blocco della rev 2 le portava a **12px**, cioè ancora sotto il
    minimo, e **non vedeva le regole di classe**. Ora, **fuori dalle tabelle**, il minimo è
    12,5px. **Misurato: dalle 40 scritte della copertina e 15 della scheda a ZERO.**
  - ⚠️ **DENTRO le tabelle non è stato cambiato nulla**: ogni regola esclude i discendenti di
    `table` con `:not(table *)`, perché lì valgono le righe basse della rev 5, i numeri in
    neretto della rev 6 e il **−40%** della rev 7 chiesto da Christian. **Verificato in
    esecuzione**: le righe delle due tabelle dense restano **19-31px, identiche alla rev 7**
    (23 · 23 · 19 · 31), e i pulsanti **fuori** dalle tabelle restano **0 sotto i 40px su 16 in
    copertina e 11 nella scheda**, come prima.
  - ⚠️ La **targhetta della revisione** (`.revtag`, 12px) resta com'è: eccezione già dichiarata.
  - **Provato in esecuzione**: `g2-opoc.cjs` **9/9** (PIN a 6 cifre, PIN sbagliato, ricaricamento),
    `g2b-opoc.cjs` **13/13** (backup rotto / senza operatori / di schema più nuovo rifiutati senza
    toccare i dati, `67,5 × 22,99 = 1.551,83`, niente salvataggio automatico, 💾 che salva
    davvero, dati ancora lì dopo il ricaricamento), `conf-opoc.cjs` per il confronto delle
    misure. **Zero errori di pagina.**
- 📉 **RIGHE PIÙ BASSE NELLE DUE TABELLE DELLA SCHEDA** (rev 7, 05/11/2026, Christian: «in
  collaboratori abbassa l'altezza righe delle liquidazioni e delle ore mensili effettuate almeno
  del 40%»).
  - **La causa vera non erano le caselle**: dopo la rev 5 erano già a 28px, ma le righe restavano
    a **43px** perché dentro la prima colonna c'è un **pulsante**, e la regola generale
    `button{min-height:40px}` (blocco leggibilità rev 2) lo teneva a 40.
  - **Come è stato fatto**: classe **`.tbl-dense`** messa su **due sole tabelle** — quella di
    *ORE EFFETTUATE* e quella del *REGISTRO LIQUIDAZIONI / PAGAMENTI* — e un blocco CSS in fondo
    al `<style>`: dentro quelle due tabelle caselle, tendine e pulsanti scendono a **22px** e le
    celle perdono l'imbottitura verticale. ⚠️ **Fuori di lì non cambia niente**: in copertina e
    nel resto della scheda i pulsanti restano a **40px** (misurato: 16 su 16 in copertina, 10 su
    10 nella scheda).
  - **Misurato in esecuzione**: righe dei dati da **43 a 23px (−46,5%)**, riga dei totali 21→19,
    altezza della scheda da **911 a 790px**. L'intestazione passa da 37 a **31px (−16%)**: lì
    dentro ci sono **due o tre righe di testo** (es. «€/h» + la nota in corsivo) e per scendere
    ancora bisognerebbe rimpicciolire le scritte sotto i 12px, che il blocco leggibilità vieta.
  - ⚠️ **Conseguenza accettata**: dentro quelle due tabelle i pulsanti ▲▼✕ e le caselle sono ora
    **22px**, quindi più piccoli del bersaglio comodo da dito (40px). È ciò che è stato chiesto;
    fuori dalle due tabelle la regola del §10.6 resta in piedi.
  - **Provato**: scrittura in una cella delle ore (il valore resta), `node --check` sul blocco
    `<script>`, zero errori di pagina. **Nessuna dicitura, nessun dato, nessun calcolo toccati.**
- 🔢 **ARROTONDAMENTO: usare SEMPRE `R2`** (da rev 6, 03/11/2026). Stesso difetto trovato in
  USOINT: `67,5 × 22,99` → 1551,82 invece di 1551,83. **`R2(v,dec)`** (sopra `rM`) ripulisce con
  `toPrecision(12)`; messa nei **4 punti** che arrotondavano e dentro **tutte le funzioni che
  scrivono i numeri** (`f2`, `fE`, `n2`, `blurFmt`, i due formattatori con i separatori, la
  tendina delle tariffe e il costo orario predefinito). ⚠️ Sui **negativi** ora è **simmetrico**.
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


## 9. REGOLA ANTI-DOCUMENTI-VECCHI (importante)

Un documento invecchia nell'istante in cui si cambia il codice. Quindi **ogni modifica a questa
app deve includere, NELLO STESSO commit**:

1. **l'incremento del numero di revisione** mostrato nell'app (e della data);
2. **l'aggiornamento di questo file `CLAUDE.md`**, se la modifica cambia qualcosa di ciò che
   descrive (modello dati, funzioni presenti, cose da non toccare, numero di revisione attuale);
3. **l'aggiornamento di `master.md`** (sta nel repo `rendicontazione-usoint`), che è il riepilogo
   generale del sistema.

Non rimandare: una modifica committata senza aggiornare questi tre punti lascia la
documentazione che mente, ed è peggio di non averla. Se Christian chiede una modifica e questi
aggiornamenti non sono stati fatti, farli prima di dire che il lavoro è finito.

## 10. COMANDO PERMANENTE DI CHRISTIAN (dato il 30/10/2026)

Vale per **ogni** creazione o modifica di questa web app, in questa e in tutte le chat future.
Vale insieme alle regole 1-9 sopra; dove ci fosse attrito, prevale ciò che Christian dice in
chat per ultimo.

### 10.0 Ruolo da assumere

Comportarsi come un **ingegnere software senior responsabile anche del controllo qualità e della
stabilità dell'intero progetto**, non come chi scrive una toppa.

Prima di intervenire: analizzare il codice esistente, la struttura dell'applicazione, le
funzionalità disponibili e le dipendenze tra i componenti; individuare quali parti potrebbero
essere influenzate dalla modifica; **conservare una copia ripristinabile della versione
funzionante**.

Applicare **esclusivamente** le modifiche richieste, nel modo più circoscritto possibile. Tutto
ciò che non è direttamente interessato dalla richiesta resta **esattamente com'è**: funzionalità,
interfaccia grafica, testi, pulsanti, menù, procedure, permessi, dati, database, collegamenti,
integrazioni, calcoli, esportazioni e qualsiasi altro comportamento già esistente. Non
eliminare, semplificare, riscrivere o modificare parti funzionanti per comodità, per preferenze
personali o per rendere il codice apparentemente più pulito. **Non introdurre miglioramenti non
richiesti.**

Dopo ogni modifica non basta verificare che la novità funzioni: va controllato meticolosamente
che **tutto il resto continui a funzionare come prima**. Confrontare la nuova versione con la
precedente, esaminare le differenze nel codice, verificare le conseguenze indirette e cercare
attivamente regressioni: funzioni scomparse, pulsanti che non rispondono, procedure interrotte,
dati persi o alterati, problemi di compatibilità, modifiche accidentali.

Eseguire tutti i test tecnici e funzionali disponibili e pertinenti: compilazione, console,
interfaccia, navigazione, persistenza dei dati, database, integrazioni. Ripetere anche i test
delle funzionalità preesistenti che la modifica potrebbe avere toccato, anche solo
indirettamente. Se si trova un errore: correggerlo e **ripetere** i controlli prima di
considerare concluso il lavoro. Quando possibile, provare la nuova versione in un ambiente di
prova prima di pubblicarla.

Mantenere una cronologia delle versioni e un punto di ripristino funzionante prima di ogni
intervento. **Non sovrascrivere l'unica versione funzionante** e non eseguire operazioni
distruttive sui dati senza averne verificato le conseguenze e predisposto le protezioni.

Al termine, comunicare con precisione: cosa è stato modificato, quali controlli sono stati
eseguiti, quali test superati, quali funzionalità preesistenti verificate, quali errori,
limitazioni o controlli restano aperti. **Non dichiarare mai eseguito un test che non è stato
realmente effettuato** e non affermare che tutto funziona senza verifiche sufficienti a
sostenerlo. Se mancano gli strumenti, i dati o l'ambiente per controllare qualcosa, **dirlo
esplicitamente**: una valutazione teorica del codice non sostituisce una verifica reale.

> **Regola fondamentale**: la nuova versione deve essere identica alla precedente in ogni
> aspetto, salvo le modifiche espressamente richieste e le conseguenze strettamente necessarie
> per realizzarle. La priorità assoluta è evitare regressioni, perdite di funzionalità e perdita
> di dati. Il lavoro non è concluso perché la modifica "sembra funzionare": è concluso dopo tutti
> i controlli concretamente possibili, risolti gli errori trovati e dichiarati i limiti delle
> verifiche.

### 10.1 Sicurezza dei dati e recuperabilità — priorità n. 1

- **Mai salvataggio automatico**: salvataggio sempre e solo manuale (💾), con avviso alla
  chiusura se ci sono modifiche non salvate.
- Il salvataggio deve **confermare visibilmente la riuscita** e segnalare con un errore evidente
  quando **fallisce** (localStorage può essere pieno o disattivato in navigazione privata):
  "salvato" non deve mai essere una bugia silenziosa.
- Funzione **Backup (esporta JSON)** e **Import** presenti in ogni app fin dalla ver1.
- Ogni backup JSON porta un **numero di versione dello schema dati**. All'import: prima
  validare, poi — solo se valido — sovrascrivere; se l'import fallisce a metà, i dati correnti
  non si toccano. Se lo schema del backup è più vecchio dell'app: adattarlo o avvisare, **mai
  reimportare alla cieca**. È il punto più fragile, perché il modello dati cambia tra versioni.
- **Conferma esplicita su ogni eliminazione** di dati (progetto, voce, persona, fattura, riga,
  cella non vuota): nessuna cancellazione a secco.
- **Nessun dato personale** (nomi di minori, codici fiscali, dati del personale) in app
  pubblicate su GitHub Pages senza protezione: Pages è pubblico e leggibile da chiunque. Se
  serve il cloud: Firebase **sempre con regole di accesso ristrette**, mai database aperto (la
  config nel file pubblico è visibile a tutti).
- Il sync cloud (Firebase) è lo **stato corrente, non uno storico**: i backup JSON periodici
  restano indispensabili come punti di ripristino.
- **Export Excel stilizzato** (xlsx-js-style) sempre disponibile, con autore nei metadata.

### 10.2 Regole di codice che evitano rotture (imparate sul campo)

- **Sintassi vietata**: `catch{}` senza parametro (usare sempre `catch(e)`); doppio attributo
  `style` sullo stesso elemento JSX; `toLocaleString` (usare sempre `grp()` manuale per i
  separatori italiani).
- Formattazione numerica ed euro **sempre con le funzioni interne**, mai affidarsi al locale del
  browser — sia in uscita sia in entrata: l'utente scrive "1.234,56" e il parsing deve capirlo.
- **React, contro i bug "non si aggiorna"**: mai mutare lo stato direttamente (sempre una nuova
  copia); nelle liste `key` stabili e uniche, **mai l'indice dell'array**.
- **Verifiche obbligatorie prima di ogni consegna**: compilazione Babel; parentesi bilanciate
  (graffe, tonde, quadre); `node --check` sul JS estratto; test runtime
  (Puppeteer/Playwright) sui dati reali — non solo "sembra giusto".
- **Casi limite da provare sempre**: campo vuoto; doppio tocco/click; numeri negativi o zero;
  testo lunghissimo; lista vuota; import di un file corrotto.

### 10.3 Workflow con Christian (blindato)

- **Nulla osta esplicito** prima di generare o consegnare qualsiasi `index.html`, con
  **anteprima (PNG) mostrata prima**.
- Si modifica solo ciò che è stato chiesto: nessun effetto collaterale, nessun "miglioramento"
  non richiesto. Se una modifica richiesta rischia di rompere qualcosa di esistente: **avvisare
  prima** di procedere.
- Domande di chiarimento brevi sui punti ambigui o complessi; risposte dirette sulle cose ovvie.
- Le **decisioni storiche restano valide** finché non le cambia Christian. Tenere un breve
  registro "decisioni prese e idee scartate" e non riproporre ciò che è già stato scartato.
- **Non narrare i passaggi operativi in chat**: solo una riga di sintesi con ciò che serve a
  Christian (domande, cose che quadrano, cose che non quadrano, cosa NON è stato gestito).

### 10.4 Architettura e persistenza

- **Single-file HTML** (tutto in un `index.html`), pubblicato su GitHub Pages (`spazioireos`),
  fatto salvo il vincolo sui dati personali del punto 10.1.
- **React 18 + Babel standalone** per le app complesse; **vanilla HTML/JS** per quelle semplici,
  rispettandone i vincoli (es. no-ES6 su OPOC / Collaboratori).
- Persistenza: `localStorage` + sync Firebase dove serve l'accesso multi-dispositivo;
  `localStorage` + export/import dove basta.

### 10.5 Convenzioni su file e versioni

- Nome file: `[descrizione] - ggMMMaa - verN - HH.MM.ext` (mesi italiani minuscoli, ora di Roma,
  senza underscore).
- Autore nei metadata sempre **"Christian Canonica"**; veri file Office, mai testo camuffato;
  elenchi nominativi in **STAMPATELLO**.
- **Versioni sequenziali, mai saltate**, ognuna verificata. Prima di un cambiamento grosso
  Christian fornisce la versione attuale stabile come punto di salvataggio, per poter tornare
  indietro; se chiede di ripartire da una versione precedente, va recuperata **per numero**,
  senza rifare da capo.
- Anteprima prima di ogni modifica visiva; dopo la creazione, verificare che il file sia
  leggibile, non corrotto, > 0 byte e scaricabile.

### 10.6 UX e leggibilità (app gestionali)

- **Celle editabili sempre giallino con bordo ambra**: segnale visivo immediato di cosa si può
  modificare.
- **Spaziature compatte, sempre** (regola permanente di Christian, 03/11/2026): imbottiture e
  distanze strette — riquadri ~9px, blocchi ~8px, griglie ~6px — così sullo schermo ci sta più
  roba e si scorre meno. ⚠️ Si stringono **gli spazi**, non i comandi: l'altezza di caselle e
  pulsanti NON si riduce (restano comodi da centrare col dito) e nessuna scritta scende sotto i
  12,5px fuori dalle griglie dense.
- Struttura chiara e intuitiva, palette coerente, distinzioni a colpo d'occhio (colori per anno,
  badge di stato, semafori); **intuitiva come se la usasse un ragazzo preadolescente da
  telefono**.
- Terminologia di dominio corretta e, dove serve generalità, neutra (es. "Committente" invece di
  "Comune").
- 🔴 **LE DICITURE NON SI TOCCANO** (regola permanente di Christian, 03/11/2026: «non devi toccare
  le diciture, furono da me scelte»). Titoli, etichette, nomi dei pulsanti, voci dei menù, testi
  delle schermate: **le parole restano quelle**, maiuscole comprese. Una passata grafica cambia
  **colori, misure, spazi e disposizione**, non il testo. Se una dicitura sembra sbagliata o
  rimanda a qualcosa che non esiste più: **segnalarla a Christian e aspettare**, non correggerla
  di propria iniziativa.
- Alla consegna: spiegare **in parole semplici (12\*)** cosa fa ogni pulsante, così Christian
  verifica che corrisponda a ciò che voleva.

### 10.7 Continuità tra sessioni

- `master.md` di progetto per il passaggio a nuove chat, con prompt di ripartenza (obiettivo,
  punto raggiunto, decisioni, prossimi passi).
- Backup strutturato quando ci si avvicina al limite della conversazione.

### 10.8 Controllo cumulativo delle versioni e divieto di consegna non verificata

- A ogni nuova versione: **mantenere e aggiornare un registro cumulativo** delle funzionalità
  esistenti, delle decisioni progettuali, dei bug corretti e dei test di regressione già
  definiti. Non perdere né sostituire i controlli delle versioni precedenti: ogni modifica
  **aggiunge** i nuovi test necessari e **ripete** quelli pertinenti già esistenti.
- Prima di consegnare: confrontare il risultato con l'ultima versione stabile, verificare tutte
  le differenze e accertarsi che **nessuna** funzionalità, formula, regola di calcolo, dato,
  campo, pulsante, procedura o comportamento preesistente sia stato eliminato o alterato senza
  autorizzazione esplicita di Christian.
- Per ogni controllo distinguere chiaramente: **test eseguito e superato**, **test eseguito e
  fallito**, **test non eseguito**, **verifica soltanto teorica**. Una compilazione riuscita
  **non** è prova che l'applicazione funzioni.
- Se un test obbligatorio fallisce, se esistono regressioni note o se manca una verifica
  essenziale: **non dichiarare la versione pronta per la pubblicazione**. Correggere e ripetere i
  controlli; se non è possibile, consegnare solo una versione **esplicitamente indicata come non
  verificata**, senza presentarla come stabile.
- Prima di ogni modifica conservare un riferimento certo alla versione stabile precedente e
  garantire una procedura di ripristino. **Non sovrascrivere tale riferimento.** Dopo ogni
  correzione ripetere anche i test pertinenti, perché la soluzione di un problema non ne
  introduca un altro.
- La conformità a queste regole si dimostra con **controlli effettivi e risultati documentabili**,
  non con dichiarazioni.
