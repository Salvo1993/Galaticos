# Specifiche Tecniche — Random Six Fingers / El Futbol / Galaticos
## Piattaforma Web per Calcetto Amatoriale: Bilanciamento Tattico, Statistiche, Previsioni e Archivio

---

## 1. Panoramica del Progetto

- **Nome Progetto:** Random Six Fingers / El Futbol / Galaticos
- **Tipologia:** Full-Stack Web Application (Next.js App Router, SSR, API Routes, Client Components)
- **Framework & Runtime:** Next.js 16.2 (Turbopack), React 19, TypeScript
- **Database:** PostgreSQL (Neon Serverless PostgreSQL con pooling SSL)
- **Autenticazione:** NextAuth.js v4 con provider Google OAuth e controllo accessi RBAC server-side
- **Styling:** CSS3 Design Tokens / Vanilla CSS personalizzato (dark mode nativa ad alto contrasto con supporto light mode)
- **Deploy:** Vercel (CI/CD automatico integrato con GitHub)

---

## 2. Scopo e Obiettivi dell'Applicazione

L'applicazione nasce come strumento definitivo per l'organizzazione e la gestione delle partite di calcetto settimanali (5vs5, 6vs6, 7vs7, 8vs8), garantendo:
1. **Generazione e bilanciamento squadre algoritmico:** basato su rating PES personalizzato, voti storici, win rate, ruoli in campo e gestione vincoli di cluster.
2. **Visualizzazione tattica 2D interattiva:** campi da gioco realistici con maglie personalizzate, inversione colori (chiara/scura) e selezione moduli (es. 2-3-1, 3-3-1, 2-4-1).
3. **Motore di previsione risultati (AI Prediction Engine):** quote e probabilità di vittoria stimate su dati storici e affinità.
4. **Archivio completo e statistiche storiche:** gestione risultati, marcatori, pagelle/voti, MVP, classifica generale dinamica, trend di forma e sfide testa a testa (H2H).
5. **Archivio multimediale:** raccolta video YouTube di gol e giocate salienti collegati ai singoli giocatori e partite.
6. **Esportazione & Condivisione:** generazione tabellino WhatsApp one-click e download rendering grafico JPEG della formazione.

---

## 3. Architettura del Software e Struttura Modulare

Il progetto adotta un'architettura rigorosamente modulare ad alta coesione e basso accoppiamento, separando l'orchestrazione UI, la gestione dello stato, la logica di business e le chiamate API:

```
├── app/
│   ├── api/                     ← Endpoint REST protetti e pubblici
│   │   ├── auth/[...nextauth]/  ← Handler autenticazione NextAuth Google
│   │   ├── campi/               ← Gestione sedi e campi sportivi
│   │   ├── classifica/          ← Calcolo e restituzione classifica generale
│   │   ├── giocatori/           ← CRUD giocatori, update ruoli, upload figurina
│   │   ├── media/               ← Gestione video/highlight YouTube
│   │   ├── risultati/           ← Archivio risultati, voti, pagelle e marcatori
│   │   ├── salva-formazione/    ← Salvataggio formazioni ufficiali
│   │   ├── session/             ← Sincronizzazione bozza formazioni in corso
│   │   ├── settings/            ← Pesi algoritmo, moduli, previsioni e cover
│   │   └── sfide/               ← Creazione e approvazione sfide H2H
│   ├── awards/                  ← Pagina premi e riconoscimenti
│   ├── live/                    ← Pagina tabellone live match
│   ├── globals.css              ← Design system globale, utility e animazioni
│   ├── layout.tsx               ← Root layout, session provider e metadata SEO
│   └── page.tsx                 ← Orchestratore principale snello (~360 righe)
├── components/
│   ├── admin/                   ← Modali gestione admin (CampoModal, AlgoSettingsModal, EditPlayer, etc.)
│   ├── layout/                  ← HeaderBanner, cover personalizzabile, date/time pickers
│   ├── matches/                 ← MatchArchive, UpdateResultModal, DeleteMatchModal
│   ├── media/                   ← MediaArchiveSection, AddMediaModal
│   ├── players/                 ← PlayerCardModal (PES card interattiva con radar chart)
│   ├── stats/                   ← LeaderboardSection, StatsTrendsSection, WeeklyStatsSection, SfidaModal
│   ├── teams/                   ← TeamBuilderPanel, FormationResultsSection, ModuloModal, TacticalPitches
│   └── ui/                      ← Dropdown personalizzati e componenti atomici
├── hooks/
│   ├── useAppData.ts            ← State management globale, caricamento dati e mutazioni
│   └── useTeamBuilder.ts        ← State management selezione squadre, tattiche, swap ed esportazioni
├── lib/
│   ├── algorithm/               ← team-balancer.ts (algoritmo PES, ruoli, cluster, portieri)
│   ├── api/                     ← Client API tipizzati (players-api, matches-api, settings-api)
│   ├── auth.ts                  ← Configurazione NextAuth e helper server-side assertAdmin
│   ├── db.ts                    ← Connessione PostgreSQL Neon con SSL pooler
│   ├── export/                  ← whatsapp-share.ts (copia tabellino e rendering JPEG)
│   ├── players/                 ← pes-card-utils.ts (calcolo overall PES e radar chart)
│   ├── stats/                   ← prediction-engine.ts, match-utils.ts (calcolo classifica, voti, trend)
│   └── teams/                   ← formation-utils.ts (coordinate grafiche 2D per ogni formato e modulo)
└── types/
    └── index.ts                 ← Modello di dominio e interfacce TypeScript unificate
```

---

## 4. Sicurezza & Controllo Accessi Server-Side (RBAC)

L'applicazione implementa una rigorosa politica di sicurezza multilivello:
- **Client-Side:** I controlli amministrativi (pulsanti di modifica, eliminazione, upload e configurazione) sono resi visibili esclusivamente se l'email dell'utente connesso con Google è presente nella whitelist `NEXT_PUBLIC_ADMIN_EMAIL`.
- **Server-Side Guard:** Tutti gli endpoint API che effettuano mutazioni (`POST`, `PUT`, `DELETE`) o operazioni sensibili verificano l'identità tramite la funzione `assertAdmin` definita in `lib/auth.ts`:

```typescript
export async function assertAdmin(req?: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) {
    throw new Error('UNAUTHORIZED');
  }
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
    .split(',')
    .map(e => e.trim().toLowerCase());
  if (!adminEmails.includes(session.user.email.trim().toLowerCase())) {
    throw new Error('FORBIDDEN');
  }
  return session;
}
```

### Endpoint Protetti:
1. `POST /api/settings` — Salvataggio pesi algoritmo, moduli, previsioni e match label
2. `POST /api/settings/upload-header` — Caricamento immagine di copertina
3. `POST /api/giocatori` — Inserimento nuovo giocatore nel database
4. `POST /api/giocatori/update` — Modifica statistiche, ruoli primari e secondari
5. `POST /api/giocatori/delete` — Cancellazione massiva di giocatori
6. `POST /api/giocatori/upload-image` — Upload figurina PES del giocatore
7. `POST /api/risultati/update` — Aggiornamento risultato, marcatori, voti e MVP
8. `POST /api/risultati/delete` — Cancellazione partita dallo storico con ricalcolo classifica
9. `POST /api/salva-formazione` — Scrittura formazioni titolari su database
10. `POST /api/campi` — Aggiunta e modifica campi sportivi e URL mappe
11. `GET /api/setup` — Esecuzione migrazioni DDL protette

---

## 5. Specifiche Funzionali Dettagliate

### 5.1 Selezione Giocatori e Formati Partita
- **Formati supportati:**
  - `5vs5`: 10 giocatori
  - `6vs6`: 12 giocatori
  - `7vs7`: 14 giocatori
  - `8vs8`: 16 giocatori
- **Selezione giocatori:** dropdown responsive con ricerca rapida tra i giocatori censiti a database.
- **Cluster di Vincolo:**
  - Creazione di infiniti cluster (`Cluster A`, `Cluster B`, ...).
  - Selezione multipla dei membri tramite chip-picker toggle.
  - Regola ferrea: *due o più giocatori appartenenti allo stesso cluster vengono sempre separati in squadre avverse*.

### 5.2 Algoritmo di Bilanciamento Squadre & Rating PES
- **Formula Overall Rating PES:**
  Ogni giocatore possiede un rating sintetico calcolato combinando:
  $$\text{Rating} = \frac{w_{\text{Voto}} \cdot \text{MediaVoto} + w_{\text{WinRate}} \cdot \text{WinRate} + w_{\text{Gol}} \cdot \text{GolRatio} + w_{\text{MVP}} \cdot \text{MVPCount}}{100}$$
- **Configurazione Pesi (personalizzabile in modale):**
  - Peso Voto (default 40%)
  - Peso Win Rate (default 30%)
  - Peso Gol Ratio (default 30%)
  - Peso MVP (default 15%)
  - Bilanciamento Ruoli Tattici (attivo/disattivo)
- **Modificatori OVR:** slider per applicare un bonus/malus manuale temporaneo $(\pm 10)$ su singoli giocatori per la partita odierna.
- **Riconoscimento Ruoli e Portieri:**
  - Individuazione automatica del portiere da tag `(P)`, ruolo preferito o secondario.
  - Assegnazione garantita del portiere tra i pali (posizione GK).
  - Ripartizione bilanciata dei macro-ruoli: Difensori (CB, RB, LB), Centrocampisti (CM, CAM, CDM), Attaccanti (CF, ST, RW, LW).
- **Rilevamento "Sostituzione Volante":** notifica automatica se una squadra presenta un giocatore in rotazione.

### 5.3 Visualizzazione Tattica su Campo 2D & Moduli
- **Campi da Gioco:** visualizzazione ad alta fedeltà (erba realistica, linee regolamentari, cerchio di centrocampo e aree di rigore).
- **Moduli Tattici Configurabili:**
  - Formato 7vs7: `3-2-1` (predefinito/consigliato), `2-3-1`, `2-2-2`, `3-1-2`
  - Formato 8vs8: `3-3-1` (predefinito/consigliato), `2-3-2`, `3-2-2`, `2-4-1`
  - Selezione indipendente per Squadra A, Squadra B o entrambe con persistenza automatica su DB e `localStorage`.
- **Visualizzazione Dinamica dei Ruoli:**
  - Per partite **5vs5** e **6vs6**: viene mostrato esclusivamente il ruolo primario del giocatore.
  - Per partite **7vs7** e **8vs8**: viene mostrato il ruolo tattico effettivo assegnato in campo in base al modulo selezionato.
  - **Differenziazione Cromatica dei Ruoli:**
    - Se il ruolo assegnato in campo coincide con il ruolo primario del giocatore, viene mantenuto il colore standard del ruolo.
    - Se il ruolo assegnato in campo è diverso dal ruolo primario (adattato su ruolo secondario o fuori ruolo per esigenze di modulo), viene applicato un colore di evidenziazione differenziato (arancione ambrato `#f39c12`) per evidenziare immediatamente l'adattamento tattico.
- **Algoritmo di Assegnazione Ruoli in Formazione (7vs7 e 8vs8):**
  - **Priorità 1 (Ruolo Preferito):** colloca prioritariamente i giocatori nei ruoli compatibili con il loro ruolo primario definito a sistema.
  - **Priorità 2 (Ruoli Secondari Compatibili):** colloca i giocatori che possiedono ruoli secondari compatibili nei ruoli lasciati vacanti dalla Priorità 1.
  - **Priorità 3 (Tie-break Statistico & Concorrenza):** in caso di più giocatori in competizione per il medesimo slot (es. 2 con ruolo preferito ATT in modulo a 1 punta):
    - Confronta le statistiche storiche individuali: Media Voto e numero di MVP.
    - Per gli attaccanti: predilige il giocatore con più gol segnati in carriera.
    - Per i difensori e terzini: predilige il giocatore con la media di gol subiti più bassa.
    - Chi perde il tie-break concorre per gli slot secondari (Priorità 2) o per i ruoli residui.
  - **Abbinamento Piede-Fascia per Ruoli Generici o Residui:**
    - Se un giocatore ha un ruolo generico senza specifica di corsia (es. solo *Ala*, solo *Terzino*, solo *Esterno*) o viene impiegato per ruolo secondario o non ha ruolo (Guest/Senza ruolo): ci si basa sul **Piede** preferito registrato nella scheda giocatore.
    - **Piede Destro (DX):** viene abbinato alla corsia destra (`ED`, `CLD`, `TD`).
    - **Piede Sinistro (SX):** viene abbinato alla corsia sinistra (`ES`, `CLS`, `TS`).
    - **Piede Ambidestro:** può coprire indistintamente entrambe le corsie.
    - **Eccezione / Precedenza Ruoli Espliciti:** se il ruolo indica esplicitamente la fascia (es. *Ala Destra* o *Terzino Sinistro*), la specifica testuale ha sempre la precedenza assoluta e il piede non sovrascrive il ruolo.
  - **Priorità 4 (Guest e Senza Ruoli Secondari):** assegna ospiti e giocatori senza ruoli specifici compatibili negli slot rimasti liberi, prioritariamente rispettando l'abbinamento Piede-Fascia se sono disponibili slot laterali vacanti.
  - **Invarianza Formati 5vs5 e 6vs6:** le partite a 5 e 6 mantengono inalterato l'ordinamento standard classico (GK, DIF, CEN, ATT).
- **Interazioni su Campo:**
  - Drag / Click per scambiare due giocatori tra squadre diverse.
  - Scambio ruoli all'interno della stessa squadra con un click.
  - Toggle colore maglia: inversione rapida maglia chiara/scura (`Falchi 🦅` vs `Aquile 🦆`).

### 5.4 AI Match Prediction Engine (Quote & Previsioni)
- Calcola in tempo reale la probabilità percentuale di vittoria della Squadra A, Squadra B e Pareggio.
- **4 Modalità di Analisi Storica:**
  1. *Tutti i formati:* considera l'intero storico delle partite disputate.
  2. *Due binari (Consigliata):* calcola previsioni 5v5/6v6 su archivio 5-6, e 7v7/8v8 su archivio 7-8.
  3. *Rigoroso:* considera unicamente le partite disputate nel medesimo identico formato.
  4. *Personalizzato:* matrice di inclusione libera definita dall'utente.

### 5.5 Gestione Partite, Voti e Classifica Generale
- **Archivio Partite:** lista cronologica delle partite con stadio, data, orario, formazioni e punteggio.
- **Modale Aggiornamento Risultato & Conservazione Minutaggio Gol:**
  - Risultato numerico (es. `7-5`).
  - **Preservazione Minuti Gol da Live Match:** quando una partita viene seguita e registrata dal Live Match (`/live`), i marcatori registrano con precisione il minuto esatto di ciascun gol (es. `Mattia (3', 42', 49'), Marco Bellavista (47')`). La modale di aggiornamento risultato (`UpdateResultModal`) preserva integralmente i minuti dei gol registrati quando vengono inseriti i voti delle pagelle o selezionati gli MVP dalla homepage. Il parser e stringifier dedicato (`parseScorersWithMinutes` e `stringifyScorersWithMinutes`) mantiene i minuti anche in caso di variazioni ai marcatori e impedisce la sovrascrittura con semplici conteggi numerici (es. `Mattia (3)`), proteggendo la fedeltà dello storico.
  - Marcatori Squadra A e Squadra B con sintassi leggibile e supporto ad Autogol (`(AG)` / `Autogol Nome`).
  - Pagelle individuali: voto da 1 a 10 con decimali o `s.v.` (senza voto).
  - Elezione MVP della partita.
- **Classifica Generale Automatica:**
  - Punti assoluti, Partite Giocate, Vittorie, Pareggi, Sconfitte.
  - Gol fatti e subiti, Differenza reti.
  - Media punti a partita (Punti/P).
  - Media voto complessiva.
  - Indicatore di forma recente (ultime 5 partite con badge verde/giallo/rosso).
  - Filtro "Mostra Ospiti" per includere o escludere giocatori non registrati ufficialmente.
- **Modulo Sfida (H2H):** confronto statistico testa a testa tra due o più giocatori selezionati con storico vittorie/sconfitte e reti.

### 5.6 Archivio Multimediale & Highlights YouTube
- Raccolta multimediale con player modale integrato.
- Tagging dei video: partita di riferimento, marcatore/protagonista, assist-man/co-protagonista, tipologia (Gol, Parata, Giocata, Rissa).
- Funzione di copia link rapido e condivisione per i social.

### 5.7 Condivisione WhatsApp & Download Immagine
- **Tabellino WhatsApp:** copia formattata con emoji, data, orario, stadio (con link Google Maps), formazioni Falchi/Aquile con indicazione maglia chiara e scura.
- **Download JPEG Formazione:** generazione client-side di un rendering ad alta definizione del campo tattico tramite `html2canvas` per invio istantaneo nei gruppi.

---

## 6. Schema del Database Relazionale (PostgreSQL)

```sql
-- Tabella Giocatori
CREATE TABLE IF NOT EXISTS giocatori (
    id SERIAL PRIMARY KEY,
    "Nome" VARCHAR(255) UNIQUE NOT NULL,
    "Ruolo" VARCHAR(50),
    "RuoloSecondario" VARCHAR(50),
    velocita INT DEFAULT 70,
    accelerazione INT DEFAULT 70,
    tecnica INT DEFAULT 70,
    contrasto INT DEFAULT 70,
    passaggi INT DEFAULT 70,
    finalizzazione INT DEFAULT 70,
    resistenza INT DEFAULT 70,
    dribbling INT DEFAULT 70,
    rissa INT DEFAULT 50,
    altezza INT DEFAULT 175,
    peso INT DEFAULT 70,
    piede VARCHAR(10) DEFAULT 'Destro',
    origine_punteggi VARCHAR(50) DEFAULT 'default',
    "Skill" TEXT,
    "Score" INT DEFAULT 70,
    figurina TEXT,
    tuffo INT,
    presa INT,
    riflessi INT,
    piazzamento INT,
    uscite INT,
    reattivita INT,
    rinvio INT
);

-- Tabella Campi Sportivi
CREATE TABLE IF NOT EXISTS campi (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    posizione_url TEXT
);

-- Tabella Partite e Risultati
CREATE TABLE IF NOT EXISTS partite (
    id SERIAL PRIMARY KEY,
    data DATE NOT NULL,
    ora VARCHAR(10) NOT NULL,
    team_a_name VARCHAR(100) NOT NULL,
    team_b_name VARCHAR(100) NOT NULL,
    team_a_players TEXT[] NOT NULL,
    team_b_players TEXT[] NOT NULL,
    risultato VARCHAR(20),
    marcatori_a TEXT,
    marcatori_b TEXT,
    "Stadium" VARCHAR(255),
    voti_giocatori JSONB,
    mvps TEXT[],
    maglia_chiara VARCHAR(5) DEFAULT 'A'
);

-- Tabella Media YouTube
CREATE TABLE IF NOT EXISTS media (
    id SERIAL PRIMARY KEY,
    partita_id INT REFERENCES partite(id) ON DELETE CASCADE,
    giocatore VARCHAR(255),
    co_giocatore VARCHAR(255),
    tipologia VARCHAR(50) NOT NULL,
    youtube_id VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Sessione Corrente (Bozza Formazioni)
CREATE TABLE IF NOT EXISTS session (
    id INT PRIMARY KEY DEFAULT 1,
    selected_players TEXT[],
    clusters JSONB,
    team_a_name VARCHAR(100),
    team_b_name VARCHAR(100),
    team_a_players TEXT[],
    team_b_players TEXT[],
    maglia_chiara VARCHAR(5) DEFAULT 'A',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella Impostazioni Globali
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL
);

-- Tabella Sfide Head-to-Head
CREATE TABLE IF NOT EXISTS sfide (
    id SERIAL PRIMARY KEY,
    titolo VARCHAR(255) NOT NULL,
    giocatori TEXT[] NOT NULL,
    data_da DATE,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 7. Design System & Palette Colori

- **Surface Scura Principale:** `#0a0e14` / `#0f172a`
- **Card & Superfici Elevate:** `rgba(255, 255, 255, 0.04)` con bordi `rgba(255, 255, 255, 0.08)` e glassmorphism
- **Accent Primario Calcetto:** `#00e676` (Verde smeraldo brillante)
- **Squadra Falchi 🦅:** `#5de4ff` (Azzurro ciano brillante)
- **Squadra Aquile 🦆:** `#ffaa00` (Arancione oro caldo)
- **Campi da Gioco 2D:**
  - Erba: texture a strisce alternate con shader verde campo `#1b5e20` / `#2e7d32`
  - Linee di gioco: `#ffffff` con opacità regolamentare
- **Tipografia:** Inter / Outfit / Clash Display con fluid scaling clamp responsive.

---

## 8. Dual-Repository Synchronization Policy

I repository **Galaticos** (`https://github.com/Salvo1993/Galaticos`) ed **ElFutbol** (`https://github.com/Salvo1993/ElFutbol`) condividono la medesima base di codice e sono mantenuti in **parità al 100%**:
1. Qualsiasi componente, API o utility aggiunta in una repository viene sincronizzata istantaneamente nell'altra.
2. Prima di ogni commit su `main`, viene verificata l'assenza di differenze strutturali (`diff -r`) e validata la compilazione senza errori (`npx tsc --noEmit`).
3. I commit vengono pushati su entrambi i remote GitHub ad ogni rilascio significativo.

---

*Documento tecnico aggiornato con le implementazioni e il refactoring architetturale modulare.*
