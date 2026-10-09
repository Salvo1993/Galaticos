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
In quest'area vengono scelte le presenze della giornata e proposte le formazioni per essere validate in partita vera.
- **Visitatori**: Scelgono dal menu e riempiono le caselline giocatori. L'algoritmo genererà poi le squadre. La sfida creata resterà esposta in modo neutro per tutti recando il "Muro della validazione", mostrandosi con etichetta verde ("In attesa di approvazione").
- **Amministratori**: Ricevono notifica della "Sfida Autogenerata" dal pubblico. Controllano le formazioni, applicano modifiche libere e quindi convertono la sfida con il push "Salva in Sessione Giocabile". A questo punto possono definire il colore delle pettorine squadra, avviare il pannello Live della partita e attivare un Live Timer col conteggio Gol.

## 4. Sezione Partite
Questa vista contiene l'albo cronologico completo delle dispute del torneo, mostrando la differenza reti e la formazione di ogni team in quell'orario.
- **Visitatori**: Semplice navigazione cronologica del passato. Sfruttano quest'area a puro fine informativo.
- **Amministratori**: In possesso del tab per "Modificare una partita". Questo fa sì che qualora ci si scordasse un marcatore nella foga del Live Match, si possano aprire i parametri crudi per stornare, inserire il goal corretto e salvare. Il tabellino sovrascriverà di calcolo l'intero archivio generalizzato di tutti.

## 5. Sezione Classifica e Stats 
Il collettore dove ogni esito partorito rientra visualmente.
- **Visitatori ed Amministratori**: Sono trattati allo stesso modo su questi tab e hanno poteri affini. Vedono la generica con ordini specifici in Win Rate (o media Goal), consultano l'andamento completo per ognuno e posso azionare due metodi pratici di espansione mediatica: Copia in Text-Format da WhatsApp e Download Foglio di Calcolo (Excel/CSV Export). Nessuna modifica ammessa, la classifica è frutto oggettivo delle Partite.

## 6. Sezione MVP
L'arena adibita a gestire i voti extra partita per definire l'uomo d'oro del match, accessibile solo ad ore finalizzate o a gara ultimata.
- **Visitatori**: Entrando nel tab possono visionare un menu e decretare a scorrimento, con barra su un massimo 10, lo score pagella per tutti e dichiarare la palma "MvP" a chi è stato più risolutivo. 
- **Amministratori**: Esattamente come i giocatori possono contribuire ma, in aggiunta a quest'ultimi, all'Admin spetta il verdetto tecnico per decretare la chiusura dei ballottaggi e spingere l'accettazione voti, calcolando l'Effettivo Premio Match.

## 7. Media Gallery 
Cartella destinata ai ricordi di scatti video realizzati sui manti erbosi. 
- **Tutti quanti**: Possono visualizzare i tab allegati per data scartabellando fra thumbnail, match storici e immagini pre partita per ravvivare memorie calcistiche. L'upload avviene mediante backend Vercel/Psql per evitare carichi di rete onerosi all'applicativo base Front End.

## 8. Sezione The Awards
Vetrina celebrativa autonoma. Traccia le figure emblematiche dominatrici o top classificatesi nell'ultimo mese giocato, separando statistiche d'effetto in vari tab "Trophy". 
- **Visitatori ed Amministratori**: Sezione prettamente read-only per tutti i ruoli. Oltre che ai Podi Top 3 generati dal sistema, visualizza Recharts (Line Charts interattivi) sull'andamento delle ultime prestazioni. Valuta la costante decrescente e le risalite OVR permettendo ai coach di monitorare cali d'attenzione degli over performer nei grafi lineari comparativi. Niente azioni ammesse se non ispezioni da consultazione.
