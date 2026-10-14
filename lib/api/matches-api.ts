import type { MatchResult, LeaderboardEntry } from '@/types';

export const fetchMatchesApi = async (): Promise<MatchResult[]> => {
  const res = await fetch('/api/risultati', { cache: 'no-store' });
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const fetchLeaderboardApi = async (): Promise<LeaderboardEntry[]> => {
  const res = await fetch('/api/classifica?recalculate=true', { cache: 'no-store' });
  const data = await res.json();
  if (data.success && Array.isArray(data.leaderboard)) {
    return data.leaderboard;
  }
  return [];
};

export interface UpdateResultPayload {
  id: number;
  risultato: string;
  marcatori_a: string;
  marcatori_b: string;
  voti_giocatori: Record<string, number | 's.v.'>;
  mvps: string[];
}

export interface UpdateResultResponse {
  match: MatchResult;
  leaderboard?: LeaderboardEntry[];
}

export const updateResultApi = async (payload: UpdateResultPayload): Promise<UpdateResultResponse> => {
  const res = await fetch('/api/risultati/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Errore durante l'aggiornamento");
  return data;
};

export interface DeleteMatchResponse {
  success: boolean;
  leaderboard?: LeaderboardEntry[];
}

export const deleteMatchApi = async (matchId: number): Promise<DeleteMatchResponse> => {
  const res = await fetch('/api/risultati/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: matchId }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Errore durante l'eliminazione");
  return data;
};
