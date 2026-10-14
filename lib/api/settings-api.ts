import type { AlgoSettings, PredictionSettings, ModuloSettings, Results } from '@/types';

export const saveAlgoSettingsApi = async (algoSettings: AlgoSettings): Promise<void> => {
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ algo_settings: algoSettings }),
  });
  if (!res.ok) throw new Error('Errore salvataggio impostazioni algoritmo');
};

export const savePredictionSettingsApi = async (newSettings: PredictionSettings): Promise<void> => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('prediction_settings', JSON.stringify(newSettings));
    } catch {}
  }
  const res = await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prediction_settings: newSettings }),
  });
  if (!res.ok) throw new Error('Errore salvataggio impostazioni previsione');
};

export const saveModuloSettingsApi = async (combined: ModuloSettings): Promise<void> => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('modulo_settings', JSON.stringify(combined));
    } catch {}
  }
  await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modulo_settings: combined }),
  });
};

export const saveSessionApi = async (payload: {
  selected_players: string[];
  clusters: any[];
  team_a_name: string;
  team_b_name: string;
  team_a_players: string[];
  team_b_players: string[];
  maglia_chiara?: string;
}): Promise<void> => {
  await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
};

export const saveMatchLabelApi = async (label: string): Promise<void> => {
  await fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ match_label: label }),
  });
};

export interface SaveFormationPayload {
  team_a_name: string;
  team_b_name: string;
  teamAPlayers: string[];
  teamBPlayers: string[];
  stadium: string;
  matchLabel: string;
  maglia_chiara: 'A' | 'B';
}

export const saveFormationApi = async (payload: SaveFormationPayload): Promise<void> => {
  const res = await fetch('/api/salva-formazione', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Errore nel salvataggio formazione');
};
