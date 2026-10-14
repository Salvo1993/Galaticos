// --- Core Domain Types ---

export interface Player {
  Nome: string;
  Ruolo?: string;
  RuoloSecondario?: string | null;
  velocita?: number;
  accelerazione?: number;
  tecnica?: number;
  contrasto?: number;
  passaggi?: number;
  finalizzazione?: number;
  resistenza?: number;
  dribbling?: number;
  rissa?: number;
  altezza?: number;
  peso?: number;
  piede?: string;
  origine_punteggi?: string;
  Skill?: string;
  Score?: number;
  figurina?: string;
  tuffo?: number;
  presa?: number;
  riflessi?: number;
  piazzamento?: number;
  uscite?: number;
  reattivita?: number;
  rinvio?: number;
}

export interface Cluster {
  id: number;
  name: string;
  members: string[];
}

export interface Results {
  teamA: string[];
  teamB: string[];
}

export interface MatchResult {
  id: number;
  data: string;
  ora: string;
  team_a_name: string;
  team_b_name: string;
  risultato: string | null;
  marcatori_a: string | null;
  marcatori_b: string | null;
  team_a_players: string[];
  team_b_players: string[];
  Stadium: string | null;
  voti_giocatori?: Record<string, number | 's.v.'>;
  mvps?: string[];
  maglia_chiara?: string;
}

export interface PredictionSettings {
  mode: 'all' | 'tracks' | 'strict' | 'custom';
  customMatrix?: {
    5?: number[];
    6?: number[];
    7?: number[];
    8?: number[];
  };
}

export const defaultPredictionSettings: PredictionSettings = {
  mode: 'all',
  customMatrix: {
    5: [5, 6, 7, 8],
    6: [5, 6, 7, 8],
    7: [5, 6, 7, 8],
    8: [5, 6, 7, 8]
  }
};

export interface ModuloSettings {
  modulo7TeamA: '2-3-1' | '3-2-1' | '2-2-2' | '3-1-2';
  modulo7TeamB: '2-3-1' | '3-2-1' | '2-2-2' | '3-1-2';
  modulo8TeamA: '3-3-1' | '2-3-2' | '3-2-2' | '2-4-1';
  modulo8TeamB: '3-3-1' | '2-3-2' | '3-2-2' | '2-4-1';
}

export const defaultModuloSettings: ModuloSettings = {
  modulo7TeamA: '3-2-1',
  modulo7TeamB: '3-2-1',
  modulo8TeamA: '3-3-1',
  modulo8TeamB: '3-3-1'
};

export interface AlgoSettings {
  wVoto: number;
  wWinRate: number;
  wGolRatio: number;
  wMvp: number;
  balanceRoles: boolean;
}

export const defaultAlgoSettings: AlgoSettings = {
  wVoto: 40,
  wWinRate: 30,
  wGolRatio: 30,
  wMvp: 15,
  balanceRoles: true
};

export interface LeaderboardEntry {
  nome: string;
  partite_giocate: number;
  vittorie: number;
  pareggi: number;
  sconfitte: number;
  punti_assoluti: number;
  gol_fatti: number;
  pt_partita: number;
  media_voto: number;
  mvp_count: number;
  forma: string;
  forma_punti: number;
  forma_dettagli: string;
}

export interface MediaItem {
  id: number;
  partita_id: number;
  giocatore: string | null;
  co_giocatore: string | null;
  tipologia: string;
  youtube_id: string;
  created_at: string;
}

export interface Sfida {
  id: number;
  titolo: string;
  giocatori: string[];
  data_da?: string | null;
  is_approved: boolean;
  created_at?: string;
}

export interface Campo {
  id: number;
  nome: string;
  posizione_url: string | null;
}
