# Soccer Manager - Gestore Squadre Amatoriali
Un'applicazione web completa per la gestione tecnica, statistica e organizzativa di un gruppo/torneo di calcio amatoriale. Progettata per girare interamente su Next.js con un database PostgreSQL cloud (es. Vercel).

## Funzionalità Principali (Sezione per Sezione)

### 1. Sistema di Autenticazione (OAuth / Auth.js)
L'app è divisa in due livelli di permessi:
- **Utenti / Ospiti**: Possono visualizzare i giocatori, le statistiche, votare il Man of the Match, proporre formazioni e visualizzare i report delle sfide passate o info stadio.
- **Amministratori**: Tramite login (menu nascosto/Auth.js), le opzioni di Admin garantiscono poteri globali, come l'aggiunta/modifica o rimozione di giocatori, validazione delle sfide, gestione dell'algoritmo globale, inserimento dei campi o upload dei media personalizzati.

### 2. Header e Customizzazione Home
- **Personalizzazione Cover**: Gli Admin godono di un pulsante istantaneo "Modifica Copertina" posto direttamente sull'header principale. Con esso caricano un'immagine, la quale viene processata in Base64 e salvata sul database come nuova Cover permanente dell'applicazione.
- **Data Partita Interattiva**: Vicino al logo del gruppo vi è un'icona Calendario. L'amministratore, cliccandola, setta velocemente il giorno, location e il label della prossima sfida.

### 3. Gestione Giocatori e Profili
Una vera e propria vetrina dove ogni elemento del gruppo possiede identità:
- **Aggiunta Rapida**: L'admin può aggiungere nuovi volti fornendo il Nome base e il loro Ruolo di appartenenza (ATT, CENT, DIF, Jolly, Portiere).
- **Pannello Admin (Gestisci)**: Sezione di ricerca e mass-action, per poter cancellare atleti e anche attuare un vero e proprio "Merge" ovvero la fusione delle statistiche. Es: trasferire lo storico reti, voti e vittorie da una vecchia utenza sbagliata verso il nuovo account di un singolo atleta, correggendo la storia e l'accuratezza algoritmo.
- **Upload Figurine**: Gli admin possono modificare l'avatar profilo dei giocatori, sostituendo le anonime PNG con fotografie reali (Base64 caricate su DB).
- **Gestione Ruoli**: Pieno bilanciamento, specialmente nei Jolly (Ali), il cui ruolo viene calcolato implicitamente in base al Gol/Ratio personale (bilanciati come Ali offensive o difensive all'occorrenza in base alla loro pericolosità letale).

### 4. Algoritmo Modulabile per Formazioni Eque
La punta di diamante, le squadre non sono mai create col puro rand:
- **Pesistica Algoritmo**: L'Admin può bilanciare quale score debba prevalere nella vita dei compagni di squadra (es: dare il 40% di peso alla storicità della Media Voto, il 30% all'impatto gol e così via, per arrivare ad un rating puro di efficienza "OVR" calcolato sui dati reali e non sulle impressioni).
- **Bilanciamento Segreto (Handicap OVR)**: Interfaccia nascosta al pubblico in cui gli admin assegnano `+5` e `-5` all'OVR calcolato. Questo previene discrepanze nei match se le sinergie di alcuni giocatori in campo sono imprevedibili, ma il giocatore ignara conserva sempre agli occhi del pubblico il suo Score reale per prevenire diatribe personali nello spogliatoio.
- **Balancing Ruoli**: Regola interna per assicurarsi l'omogeneità difensiva / attacco.

### 5. Generazione Sfida e Modulo Partita
- **Staging Sfide**: Tutti possono premere, dal proprio smartphone, e calcolare una squadra. Esse andranno in fase di "Staging" (In attesa) protette da Flood/abusi, mentre gli amministratori, all'arrivo lo approvano e *"Salvano in Sessione"*.
- **Pettorine Colori**: I capi squadra possono invertire chi vestirà di scuro vs di bianco.
- **Modo MATCH LIVE**: Entrati in partita, viene attivato un tabellone per tutti i presenti tramite URL, per aggiornare i Gol dal campetto, visionare il timer di gioco trascorso e dare vita a una vera cornice sportiva digitalizzata.

### 6. Storico, Pagelle e The Awards
- **Tabellini Voti**: A match convalidato, scatta il tempo voti. Chiunque può mandare la sua pagella per la prestanza atletica di tutti i giocatori in campo oltreché nominare l'MvP (Il premio della partita).
- **Classifica Statistica**: Il "classificone" perpetuo. Win Rate, MVP percentage, gol eseguiti. Tutto esportabile come testo comodo per WhatsApp o tabellare CSV/Excel per i patiti.
- **The Awards**: Sezione esclusiva a Podio per i top 3 giocatori. Con grafici ad andamento progressivo sulle loro ultime partite (Recharts integrati) in stile FIFA Team of The Year per mostrare chi sia effettivamente rimasto nel tier.

### 7. Organizzazione Strutture / Campi 
- Anagrafica in cui l'Admin censirà the Location dove il gruppo tende ad andare a giocare, fornendo l'url per Google Maps al click.
- Appunto per Password Segrete dei cancelli sportivi (nascoste ai non-admin).

---
**Stack Tecnologico**: Next.js React, Typescript, SWR e Auth.js appoggiato ad un solido backend API serverless PostgreSQL interagente nativamente ad alti regimi. Moduli orientati nativamente alla versione Mobile First.
