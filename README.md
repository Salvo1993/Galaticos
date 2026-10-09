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

## 3. Sezione Cluster (Generazione Squadre & Avvio)
In quest'area viene generato l'equilibrio della gara e definita la partita del giorno.
- **Visitatori**: Possono unicamente consultare passivamente l'ultima sfida o controllare visivamente la formazione generata prima di scendere in campo. Non possono in alcun modo generare sfide o modificare formazioni.
- **Amministratori**: Sono gli unici ad avere accesso ai processi creativi:
  - Scelgono i giocatori presenti dal roster.
  - Azionano il calcolo dell'algoritmo per dividere le due squadre.
  - Possono alterare manualmente le squadre se non soddisfatti ("swap").
  - Convertono le formazioni definitivamente nel formato ufficiale tramite l'opzione "Salva in Sessione Giocabile".
  - Possono invertire l'assegnazione dei colori/pettorine per le squadre.
  - Aprono la schermata di partita "Live Match" dove accenderanno il Timer ed il tabellone per inserire i risultati in tempo record.

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
Il collettore dove ogni esito partorito rientra visualmente. Sono presenti varie sottosezioni e modalità di navigazione:
- **Classifica Generale**: La classifica completa basata sui record totali di tutti i tempi.
- **Stato di Forma**: Una classifica filtrata utilissima che prende in esame esclusivo le ultime apparizioni per isolare la condizione atletica attuale.
- **Sfida (Pannello Comparativo)**: Un modulo in cui si calcolano classifiche "ristrette" fra 2 o più giocatori. È possibile calcolarvi chi ha fatto meglio partendo da una specifica data di calendario mettendoli l'uno contro l'altro.
- **Toggle "+ Guest"**: Attivando questo interruttore, si fanno emergere e contabilizzare all'interno della classifica anche i "Guest", ossia gli ospiti esterni non tesserati che hanno disputato partite nel passato.

**Permessi in quest'area:**
- **Visitatori**: Possono navigare e spulciare i dati a fondo. Hanno libero accesso all'esportazione su WhatsApp (text) e Spreadsheet (CSV). Possono calcolare e mandare alla bacheca nuove "Sfide" tra giocatori; esse però finiranno appese in attesa di nullaosta.
- **Amministratori**: Operando assiduamente nel tab delle **Sfide**, possiedono il vaglio giudicante finale. Sta unicamente a loro controllare le sfide proposte dall'utenza e decidere se confermare la spunta dell'**Approvazione** (per l'archivio definitivo alla community) o **Eliminare** (cestinandole).

## 6. Sezione MVP
L'arena adibita a pura bacheca e Classifica Speciale per il riconoscimento "Man of the Match".
- **Visitatori ed Amministratori**: Al pari della schermata Awards, questa sezione funge da spazio di Visualizzazione a sola lettura (read-only). Espone il tabellone ordinato di tutti gli atleti con le relative incoronazioni MvP cumulate nel tempo e la percentuale (MVP Ratio). La votazione vera e propria NON risiede in questo quadrante.

## 7. Media Gallery 
Cartella destinata ai ricordi di scatti video realizzati sui manti erbosi. 
- **Tutti quanti**: Possono visualizzare i tab allegati per data scartabellando fra thumbnail, match storici e immagini pre partita per ravvivare memorie calcistiche. L'upload avviene mediante backend Vercel/Psql per evitare carichi di rete onerosi all'applicativo base Front End.

## 8. Sezione The Awards
Vetrina celebrativa autonoma. Traccia le figure emblematiche dominatrici o top classificatesi nell'ultimo mese giocato, separando statistiche d'effetto in vari tab "Trophy". 
- **Visitatori ed Amministratori**: Sezione prettamente read-only per tutti i ruoli. Oltre che ai Podi Top 3 generati dal sistema, visualizza Recharts (Line Charts interattivi) sull'andamento delle ultime prestazioni. Valuta la costante decrescente e le risalite OVR permettendo ai coach di monitorare cali d'attenzione degli over performer nei grafi lineari comparativi. Niente azioni ammesse se non ispezioni da consultazione.
