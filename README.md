# Manuale d'Uso: Torneo Amatoriale

## Cos'è il progetto
L'applicazione è una piattaforma web gestionale dedicata all'organizzazione e al tracciamento tecnico di gruppi per partite di calcio amatoriale. 
Permette di conservare un anagrafica dei giocatori, generare formazioni equilibrate analizzando lo storico tramite un algoritmo personalizzabile, monitorare in diretta i risultati delle partite in corso e mantenere auto-aggiornata una classifica generale comprensiva di vari premi e votazioni.

## Ruoli e Permessi
L'applicazione divide gli utenti in due categorie rigide:
- **Visitatore / Ospite**: Chiunque apra il link dell'app assume questo ruolo. Può visualizzare tutte le statistiche, i risultati, le classifiche e gli Awards. Può inviare bozze di formazioni per essere approvate e, a fine partita, votare gli MVP dei compagni. Non ha alcun permesso di modifica strutturale.
- **Amministratore**: Autenticandosi tramite login nascosto (OAuth), sblocca i poteri completi in ogni singola area. L'amministratore è l'unica entità in grado di modificare la copertina dell'app, aggiungere/eliminare/modificare giocatori, approvare e salvare le sfide proposte, inserire gli esiti delle partite terminate, alterare i pesi dell'algoritmo di calcolo OVR e amministrare le password per eventuali lucchetti/campi.

---

## 1. Header (Copertina e Informazioni)
La parte superiore dell'homepage mostra l'immagine brandizzata del torneo e le specifiche del pre-partita imminente.
- **Visitatori**: Possono visualizzare le informazioni sulla prossima partita (Giorno, Orario, Campo di Gioco). Non possono interagire con l'immagine di copertina.
- **Amministratori**: 
  - **Cambio Copertina**: Possono modificare l'immagine di copertina cliccando sull'icona della matita. Il file caricato si aggiornerà per chiunque carichi l'home page.
  - **Programmazione Evento**: Possono modificare le coordinate dell'evento di default, cliccando sull'icona a calendario e inserendo la nuova data/ora della partita imminente.

## 2. Sezione Giocatori
Pannello per interagire con l'elenco generale di tutti i tesserati.
- **Visitatori**: L'elenco è formattato in maniera chiara. Possono visionare la lista degli sportivi, l'immagine del profilo e i vari "OVR" (OverAll Ratings) calcolati dal sistema, ma null'altro.
- **Amministratori**: Sbloccano una triade di bottoni esclusivi da poter usare a necessità:
  - **Aggiungi**: Inseriscono un nuovo tesserato indicandone unicamente il "Nome" e il "Ruolo Base" di default (Attaccante, Centrocampista, Difensore, Jolly/Ala). 
  - **Gestisci (Pannello Massivo)**: Si accede a una griglia avanzata dove è permesso:
	1. **Eliminare**: Cancellare in maniera definitiva i profili archiviati o inattivi (cestino rosso).
	2. **Merge (Unificazione profili)**: Se un utente è stato registrato accidentalmente con nomi dozzinali (es. "Marco" e "Marco ") finendo per dividere in due le presenze stagionali, l'amministratore può selezionare i due account per fonderli. Il sistema sommerà i gol e i referti al nome ufficiale ed auto-cancellerà il clone scartato.
  - **Algoritmo**: Questo bottone permette di variare i settaggi su come verranno generate le formazioni:
    - **Pesi Percentuali**: Si modificano le percentuali d'influenza dei parametri passati quali MVP Ratio, Win Rate Storia o Media Voto per decidere chi sia attualmente in forma e generare calcoli logici.
    - **Bilanciatore OVR Nascosto (-5/+5)**: Elenco con nomi associati a funzioni di +/-. Serve all'Admin a malusare/boostare fittizziamente un utente per rendere le squadre bilanciate alla vista della community, ma nascondendo lo stat check sfavorevole allo spiato affinché non si creino offese.
  - **Foto del Profilo Giocatori**: Aprendo le schede dei giocatori c'è un'icona fotocamera con cui gli admin possono applicare un volto ritratto all'account sostituendovi la figurina non brandizzata.
  - **Infortunio**: Nella scheda di ogni giocatore è sempre visibile lo stato dell'infortunio. Gli amministratori possono indicare liberamente il tipo di problema e gli eventuali tempi di recupero durante l'aggiunta o la modifica del profilo; se il campo è vuoto, la scheda mostra **“Nessuno”**.

## 3. Sezione Prossima Partita, Formazioni & Info
In quest'area viene generato l'equilibrio della gara e definita la partita del giorno.
- **Visitatori**: Possono unicamente consultare passivamente l'ultima sfida o controllare visivamente la formazione generata prima di scendere in campo. Non possono in alcun modo generare sfide, modificare formazioni o esportare contenuti.
- **Amministratori**: Sono gli unici ad avere accesso ai controlli completi:
  - Scelgono i tesserati presenti alla giornata.
  - Azionano il calcolo dell'algoritmo bilanciatore.
  - Possono alterare manualmente le squadre invertendo manualmente un giocatore ("Cambia Maglie") o forzare del tutto un nuovo calcolo randomico equilibrato ("Rimescola").
  - **Tool di Esportazione**: Controllano in via esclusiva i comodi bottoni di export, ovvero **"Copia Formazioni"**, **"Copia Stats"** (entrambi per incollare il testo curato direttamente su WhatsApp o simili) e **"Scarica JPEG"** per prelevare un'infografica dell'evento.
  - **Salva Formazione**: Pulsante chiave per confermare definitivamente le squadre nel formato ufficiale, rendendo ufficiale il Live Match.

## 3.5. Schermata Live Match (Smartwatch / Bordo Campo)
Accessibile tramite l'url diretto `/live` (es. `vs-sito.app/live`), è l'interfaccia principale da utilizzare durante l'esecuzione del match.
- **Visitatori**: Aprendo il link dal proprio telefono, hanno a disposizione un tabellone per guardare passivamente i gol e il timer di gioco trascorrere in sincro.
- **Amministratori**: Interfaccia essenziale ad altissimo contrasto (ottimizzata anche per schermi lillipuziani come **Smartwatch** da polso). Offre gli interruttori "Più e Meno" per aggiornare repentinamente i gol, il comando per scalare i minuti passati e dichiarare il fine partita. L'inserimento ha riscontro in real-time nei dispositivi in osservazione.

## 4. Sezione Partite
Questa vista contiene l'albo cronologico completo delle dispute del torneo, mostrando la differenza reti e la formazione di ogni team in quell'orario. Qui accade la fondamentale fase di attribuzione Pagelle.
- **Visitatori**: Semplice navigazione cronologica del passato. Sfruttano quest'area a puro fine informativo per leggere gli esiti delle antiche schermaglie. Non possono votare né compiere azioni operative.
- **Amministratori**: 
  - **Inserimento Voti e MVP**: Hanno l'onere esclusivo di poter assegnare, al termine della gara, il Voto numerico in pagella a ciascun giocatore e la corona di MVP di giornata. E' l'Admin a generare la statistica che farà evolvere il database!
  - **Modifica Storica**: In possesso del tab per "Modificare una partita". Questo fa sì che qualora ci si scordasse un marcatore nella foga del Live Match, si possano aprire i parametri crudi per stornare, inserire il goal corretto e salvare. Il tabellino aggiornerà l'intero archivio generalizzato a cascata.

## 5. Sezione Classifica e Stats 
Il collettore statistico oggettivo, senza alcun tasto di Esportazione diretto. Sono presenti varie sottosezioni di navigazione:
- **Classifica Generale**: La classifica completa basata sui record totali di tutti i tempi.
- **Stato di Forma**: Una classifica filtrata utilissima che prende in esame esclusivo le ultimissime partite per isolare la condizione o la crisi atletica attuale dei partecipanti.
- **Sfida**: Un pannello in cui si elaborano sottoclassifiche circoscritte. È possibile stabilire chi ha avuto il rendimento migliore partendo da una specifica data mettendoli faccia a faccia per sfidarsi.
- **Toggle "+ Guest"**: Tasto filtro attivabile/disattivabile. Di default nasconde dalla classifica tutti i profili che hanno disputato meno del 20% delle partite complessive archiviate (oltre a eventuali ospiti esterni non censiti a DB), mantenendo la graduatoria focalizzata sui partecipanti regolari. Cliccando su "+ Guest", la classifica include tutti i partecipanti, contrassegnando con il badge "Guest" chi non raggiunge la soglia del 20%.

**Permessi in quest'area:**
- **Visitatori**: Possono unicamente navigare e consultare i dati. I visitatori sono abilitati, se lo desiderano, a creare delle nuove richieste di "Sfide" testa a testa. Esse però, una volta inviate al sistema, finiranno prettamente in un limbo (In attesa di nullaosta).
- **Amministratori**: Sono i moderatori esclusivi del tab "Sfida". Vedono il pannello completo di tutte le Sfide proposte dagli utenti ospiti, prendendo la briga di varare un verdetto finale: cliccare la spunta verde di **Approvazione** (per sancirle ufficialmente e renderle pubbliche a chiunque) o bocciarle tramite **Eliminazione** (cestinandole defintivamente dal Server).

## 6. Sezione MVP
L'arena adibita a pura bacheca e Classifica Speciale per il riconoscimento "Man of the Match".
- **Visitatori ed Amministratori**: Al pari della schermata Awards, questa sezione funge da spazio di Visualizzazione a sola lettura (read-only). Espone il tabellone ordinato di tutti gli atleti con le relative incoronazioni MvP cumulate nel tempo e la percentuale (MVP Ratio). La votazione vera e propria NON risiede in questo quadrante.

## 7. Sezione Media 
Cartella destinata all'archivio visivo e ai ricordi (scatti o video) realizzati sui manti erbosi. 
- **Visitatori**: Possono visualizzare liberamente tutti i video caricati esplorando la galleria suddivisa per categorie (*Golazo*, *Paratona*, *Epic Fail*, *Giocata*, *Partita Completa*, *Sintesi*). Possono inoltre sfruttare un sistema di filtri per ricercare materiale specifico di una singola partita o di certi giocatori.
  - **Filtro per Giocatore & Copia Link WhatsApp**: Quando si filtra la galleria per un giocatore, compare un banner dedicato con il pulsante *"Copia Link Video di [Giocatore]"*. Con un solo click, genera e copia negli appunti un messaggio formattato per WhatsApp contenente tutti i link YouTube dei suoi gol, giocate, parate, fail, sintesi e partite intere, raggruppati cronologicamente per partita.
- **Amministratori**: Oltre alla visualizzazione, dispongono dell'arsenale completo per l'arricchimento e la gestione della galleria:
  - **Aggiunta Singolo Media**: Possono caricare un singolo video YouTube associandolo alla partita e selezionando autore e categoria (*Golazo*, *Paratona*, *Epic Fail*, *Giocata*, *Partita Completa*, *Sintesi*).
  - **Carica Media in Blocco (Massivo)**: Funzionalità per importare decine di video in un solo click tramite testo o file `.txt` / `.tsv`.
  - **Modifica Video (Icona Matita)**: Possono modificare in qualsiasi momento autore, co-autore (assist), categoria, partita associata e link YouTube con player di anteprima integrato.
  - **Elimina Video (Icona Cestino)**: Possono rimuovere definitivamente qualsiasi video dall'archivio.

---

### 7.1. Guida: Estrazione da YouTube Studio e Caricamento sul Sito in 1 Click

Questa procedura consente di estrarre in automatico tutti i video dell'ultima partita caricata su YouTube Studio (anche se impostati come *Non in elenco*), compilare i metadati e importarli sul sito in pochi secondi.

#### Fase 1: Estrazione Automatica da YouTube Studio (Console 1-Click)
1. Apri **[YouTube Studio](https://studio.youtube.com)** e vai nella sezione **Contenuti** (scheda *Caricamenti*).
2. Premi `F12` sulla tastiera (oppure tasto destro del mouse -> **Ispeziona**) e spostati sulla scheda **Console**.
3. Incolla il seguente script ed esegui premendo **Invio**:

```javascript
(() => {
  const rows = Array.from(document.querySelectorAll('ytcp-video-row'));
  if (!rows.length) return alert("⚠️ Nessun video trovato. Apri la schermata Contenuti/Caricamenti di YouTube Studio!");

  const videos = [];
  for (const row of rows) {
    const titleEl = row.querySelector('#video-title, ytcp-video-title a');
    if (!titleEl) continue;
    const title = (titleEl.textContent || '').trim();
    const href = titleEl.getAttribute('href') || '';
    const idMatch = href.match(/\/video\/([a-zA-Z0-9_-]{11})/);
    if (idMatch && title) {
      videos.push({ title, url: `https://youtu.be/${idMatch[1]}` });
    }
  }

  // Prende la data o la prima parte del titolo del primo video in cima (l'ultima partita caricata)
  const firstTitle = videos[0]?.title || '';
  const dateMatch = firstTitle.match(/\d{4}[\s\-_/]\d{2}[\s\-_/]\d{2}/)?.[0] || '';
  const matchFilter = dateMatch || firstTitle.split(/\s*[-–]\s*/)[0]?.trim() || '';

  const tsv = ['Partita\tLink YouTube\tAutore\tCategoria\tCo-Autori'];
  let count = 0;

  for (const v of videos) {
    // Filtra automaticamente solo i video dell'ultima partita caricata
    if (matchFilter && !v.title.toLowerCase().includes(matchFilter.toLowerCase())) continue;

    // 1. Riconoscimento Categoria
    let cat = 'Golazo';
    if (/sintesi|highlight/i.test(v.title)) cat = 'Sintesi';
    else if (/parata|paratona/i.test(v.title)) cat = 'Parata';
    else if (/fail|epic/i.test(v.title)) cat = 'Epic Fail';
    else if (/giocata/i.test(v.title)) cat = 'Giocata';
    else if (/partita completa|\d+-\d+/i.test(v.title)) cat = 'Partita Completa';

    // 2. Estrazione DINAMICA dell'Autore (funziona per QUALSIASI giocatore di El Futbol e Galaticos!)
    // Isola la parte finale dopo il trattino: es. "Hollywood - Bollywood - Tommaso LG 3 Gol" -> "Tommaso LG 3 Gol"
    const parts = v.title.split(/\s*[-–]\s*/);
    let candidate = parts.length > 1 ? parts[parts.length - 1] : v.title;

    // Riconoscimento eventuale Co-Autore / Assist (es. "assist Salvo")
    let coAutore = '';
    const assistMatch = candidate.match(/assist\s+([A-Za-z0-9\s]+)/i);
    if (assistMatch) {
      coAutore = assistMatch[1].trim();
      candidate = candidate.replace(new RegExp(`\\s*assist\\s+${coAutore}`, 'i'), '').trim();
    }

    // Pulisce termini di categoria e contatori (es. "3 Gol", "Eurogol", "Giocata", ecc.)
    let autore = candidate
      .replace(/(\d+\s*)?(eurogol|gol|goals?)\b.*$/i, '')
      .replace(/\b(giocata|parata|paratona|fail|epic fail|sintesi|highlights?)\b.*$/i, '')
      .replace(/\b\d+-\d+\b.*$/i, '')
      .replace(/^[-–:\s]+|[-–:\s]+$/g, '')
      .trim();

    // Se è la Partita Completa, Sintesi o se l'autore è solo un numero (es. "17" da "2-17"), lascia vuoto
    if (cat === 'Partita Completa' || cat === 'Sintesi' || /^\d+$/.test(autore)) {
      autore = '';
    }

    tsv.push(`Ultima Partita\t${v.url}\t${autore}\t${cat}\t${coAutore}`);
    count++;
  }

  const result = tsv.join('\n');

  // 1. Copia istantanea negli appunti (Clipboard)
  navigator.clipboard.writeText(result);

  // 2. Download automatico del file media_pronti_per_db.txt
  const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'media_pronti_per_db.txt';
  a.click();

  alert(`✅ ${count} video dell'ultima partita estratti!\n- Riconoscimento dinamico autori (qualsiasi giocatore di El Futbol e Galaticos)\n- Testo copiato negli appunti (pronto per Ctrl+V sul sito)\n- File "media_pronti_per_db.txt" scaricato!`);
})();
```

**Cosa fa lo script:**
- **Riconoscimento Dinamico degli Autori**: Non si basa su una lista fissa, ma analizza la struttura del titolo (`Partita - Giocatore Azione/Gol`). Riconosce **qualsiasi giocatore** di El Futbol e di Galaticos, inclusi nuovi iscritti, ospiti o riserve!
- **Isolamento dell'ultima partita**: Filtra automaticamente solo i clip dell'ultima partita caricata.
- **Link Ufficiali**: Estrae il link video `https://youtu.be/...` pulito a 11 caratteri.
- **Tag Categoria & Assist**: Rileva la categoria (*Golazo*, *Parata*, *Epic Fail*, *Giocata*, *Partita Completa*, *Sintesi*) e l'eventuale assistman.
- **Download & Appunti**: Scarica `media_pronti_per_db.txt` e copia simultaneamente il testo negli appunti per il `Ctrl + V`.

---

#### Fase 2: Caricamento sul Sito in 1 Click
1. Apri la pagina del sito **Archivio Media** (`/media`).
2. Clicca sul pulsante verde **"Carica Media in Blocco"**.
3. **Incolla il testo** con `Ctrl + V` nel campo oppure **trascina il file** `media_pronti_per_db.txt` appena scaricato.
4. Il sistema mostrerà la tabella di anteprima:
   - Partita abbinata in automatico con percentuale di confidenza (puoi cambiarla al volo da tendina se necessario).
   - Tag Categoria, Autore e Co-Autore già compilati.
5. Clicca sul bottone **"Salva Media nel DB"**. Tutti i video saranno salvati nel database all'istante!

---

#### Fase 3: Modifica e Rifinitura (Matita e Cestino)
Ogni card video nell'Archivio Media offre due controlli rapidi per gli amministratori:
- **Matita Dorata (Modifica)**: Consente di correggere al volo:
  - Autore (con chip rapidi dei giocatori scesi in campo).
  - Co-Autore / Assist.
  - Categoria (*Golazo*, *Paratona*, *Epic Fail*, *Giocata*, *Partita Completa*, *Sintesi*).
  - Partita associata.
  - Link YouTube (con player di anteprima integrato per guardare il video mentre si modifica).
- **Cestino Rosso (Elimina)**: Rimuove istantaneamente il video dal database.


## 8. Sezione The Awards
Vetrina celebrativa che gestisce i premi di rendimento per il gruppo.
- **Assegnazione Mensile**: I vincitori assoluti (Primo, Secondo e Terzo classificato) dei premi vengono decisi e congelati ufficialmente alla fine di ogni mese solare in base a specifici criteri statistici (Media Voti, Win Rate, Gol o Presenze).
- **Proiezioni in Tempo Reale (Live)**: Nonostante la chiusura dei premi avvenga puramente a fine mese, tutti gli utenti possono visitare questa sezione in qualsiasi istante e osservare la classifica *Live* del mese in corso in tempo reale, per scoprire chi è in testa al trofeo.
- **Podio e Classifica Completa Mensile**: Oltre al podio scenografico dei primi 3 classificati con i relativi grafici ad andamento temporale (Recharts), sotto il podio è presente la **classifica completa** di tutti i giocatori che hanno disputato almeno una partita nel mese in corso, corredata da tutte le metriche dettagliate.
- **Permessi**: Nessun utente (né Visitatore né Amministratore) possiede i tasti per alterare i verdetti. La sezione è unicamente *read-only* logico (a sola visualizzazione) ed evolve attingendo oggettivamente ai parametri del database.
