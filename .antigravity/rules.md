# Architettura e Mappa del Progetto (Next.js App Router - Galaticos / El Futbol)

## Regola d'Oro per il Risparmio Token
NON eseguire ricerche esplorative sull'intera codebase. Usa la mappa sottostante per individuare immediatamente il file esatto in cui intervenire.

## 1. Stato Globale, Tipi e Database (Punti di ingresso primari)
- **Tipi TypeScript globali:** `types/index.ts` (Controlla SEMPRE questo file per primo se modifichi modelli dati).
- **Stato principale e Data Fetching UI:** `hooks/useAppData.ts`
- **Stato e logica generazione squadre:** `hooks/useTeamBuilder.ts`
- **Connessione DB & Auth:** `lib/db.ts`, `lib/auth.ts`

## 2. Pagine Principali (`app/`)
- **Dashboard Principale:** `app/page.tsx`
- **Live Match:** `app/live/page.tsx`
- **Premi / Awards:** `app/awards/page.tsx`
- **Layout & Stili:** `app/layout.tsx`, `app/globals.css`

## 3. Componenti UI divisi per Dominio (`components/`)
- **Team Builder & Formazioni (`components/teams/`):**
  - Pannello principale: `TeamBuilderPanel.tsx`
  - Griglia selezione giocatori: `PlayerSelectionGrid.tsx`
  - Campi tattici e moduli: `TacticalPitches.tsx`, `ModuloModal.tsx`, `ClusterSection.tsx`
  - Risultati formazione e salvataggio: `FormationResultsSection.tsx`, `SaveFormationModal.tsx`
  - Box pronostici: `MatchPredictionBox.tsx`
- **Partite e Risultati (`components/matches/`):**
  - Archivio partite: `MatchArchive.tsx`
  - Modali CRUD risultato: `UpdateResultModal.tsx`, `DeleteMatchModal.tsx`
- **Statistiche e Classifiche (`components/stats/`):**
  - Classifica generale: `LeaderboardSection.tsx`
  - Statistiche e trend: `StatsTrendsSection.tsx`, `WeeklyStatsSection.tsx`
  - Sfide e Settaggi pronostici: `SfidaModal.tsx`, `PredictionSettingsModal.tsx`
- **Admin & Gestione Giocatori (`components/admin/` & `components/players/`):**
  - CRUD Giocatori: `ManagePlayersModal.tsx`, `AddPlayerModal.tsx`, `EditPlayerModal.tsx`
  - Card stile PES: `components/players/PlayerCardModal.tsx`
  - Campi e Algoritmo: `CampoModal.tsx`, `AlgoSettingsModal.tsx`
- **Media (`components/media/` & root `components/`):**
  - `MediaArchiveSection.tsx`, `AddMediaModal.tsx`, `EditMediaModal.tsx`, `BulkMediaModal.tsx`
- **Layout & UI atomica:** `components/layout/HeaderBanner.tsx`, `components/ui/Dropdowns.tsx`

## 4. Business Logic & Fetchers Client (`lib/`)
- **Client API Wrappers:** `lib/api/players-api.ts`, `lib/api/matches-api.ts`, `lib/api/settings-api.ts`
- **Algoritmo bilanciamento squadre:** `lib/algorithm/team-balancer.ts`
- **Motore pronostici e calcoli match:** `lib/stats/prediction-engine.ts`, `lib/stats/match-utils.ts`
- **Calcolo classifica:** `lib/classifica-utils.ts`
- **Utility Formazioni, Card PES, WhatsApp, Media:**
  - `lib/teams/formation-utils.tsx`
  - `lib/players/pes-card-utils.ts`
  - `lib/export/whatsapp-share.ts`
  - `lib/media-import-utils.ts`

## 5. Backend API Routes (`app/api/`)
- **Giocatori:** `api/giocatori/route.ts`, `update/route.ts`, `delete/route.ts`, `upload-image/route.ts`
- **Risultati & Partite:** `api/risultati/route.ts`, `update/route.ts`, `delete/route.ts`, `voti/route.ts`, `stadium/route.ts`, `update-maglia/route.ts`
- **Sessione & Formazioni:** `api/salva-formazione/route.ts`, `api/session/route.ts`, `api/session/update-maglia/route.ts`
- **Live, Classifica, Sfide, Awards, Campi, Settings, Media:**
  - `api/live-match/route.ts`, `api/classifica/route.ts`, `api/sfide/route.ts`
  - `api/awards/route.ts`, `api/awards/calculate/route.ts`
  - `api/campi/route.ts`, `api/settings/route.ts`, `api/settings/upload-header/route.ts`
  - `api/media/route.ts`, `api/media/bulk/route.ts`

## Regole di Esecuzione Rapida
1. Per modifiche puramente UI o logiche banali, **NON** eseguire `npm run build` per verificare i tipi: usa `npx tsc --noEmit` (molto più veloce e leggero).
2. Non toccare o leggere mai i file `app/api/migrate*` o `app/api/setup` a meno che non venga esplicitamente richiesto.
3. Attenzione a `app/api/risultati/`: contiene sia `route.ts` che `risultati-route.ts`. Agisci su `route.ts` salvo diversa indicazione.
4. **Dual-Repo Sync (Galaticos & ElFutbol):** Qualsiasi modifica deve essere applicata con parità al 100% su entrambi i repository, verificata con `npx tsc --noEmit` e committata su `main`.
