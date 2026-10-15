export const parseScorersString = (scorersInput: any): Record<string, number> => {
  if (!scorersInput) return {};
  let scorersStr = '';
  if (Array.isArray(scorersInput)) {
    scorersStr = scorersInput.join(', ');
  } else if (typeof scorersInput === 'string') {
    scorersStr = scorersInput;
  } else {
    return {};
  }

  const map: Record<string, number> = {};
  scorersStr.split(/,\s*(?![^()]*\))/).forEach((s: string) => {
    const trimmed = s.trim();
    if (!trimmed) return;
    const match = trimmed.match(/^(.*?)(?:\s*\(([^)]+)\))?$/);
    if (match) {
      let name = match[1].trim();
      let count = 1;
      const content = match[2];
      if (content) {
        if (content.trim().toUpperCase() === 'AG') {
          name = `${name} (AG)`;
          count = 1;
        } else if (content.includes("'")) {
          count = content.split(/,|(?:' e )|(?:' )/).filter((k) => k.trim() !== '').length;
        } else {
          count = parseInt(content, 10) || 1;
        }
      }
      map[name] = (map[name] || 0) + count;
    }
  });
  return map;
};

export const parseScorersWithMinutes = (scorersInput: any): Record<string, string[]> => {
  if (!scorersInput) return {};
  let scorersStr = '';
  if (Array.isArray(scorersInput)) {
    scorersStr = scorersInput.join(', ');
  } else if (typeof scorersInput === 'string') {
    scorersStr = scorersInput;
  } else {
    return {};
  }

  const map: Record<string, string[]> = {};
  // Split only on commas outside parentheses
  scorersStr.split(/,\s*(?![^()]*\))/).forEach((s: string) => {
    const trimmed = s.trim();
    if (!trimmed) return;
    const match = trimmed.match(/^(.*?)(?:\s*\(([^)]+)\))?$/);
    if (match) {
      let name = match[1].trim();
      const content = match[2];

      if (content && content.trim().toUpperCase() === 'AG') {
        name = `${name} (AG)`;
        if (!map[name]) map[name] = [];
        map[name].push('');
        return;
      }

      if (!map[name]) map[name] = [];

      if (content) {
        if (content.includes("'")) {
          const minuteTokens = content
            .split(/,\s*|\s+e\s+/)
            .map((m) => m.trim())
            .filter(Boolean);
          map[name].push(...minuteTokens);
        } else {
          const count = parseInt(content, 10) || 1;
          for (let i = 0; i < count; i++) {
            map[name].push('');
          }
        }
      } else {
        map[name].push('');
      }
    }
  });
  return map;
};

export const stringifyScorers = (map: Record<string, number | string[]>): string => {
  return Object.entries(map)
    .filter(([_, val]) => {
      if (Array.isArray(val)) return val.length > 0;
      return typeof val === 'number' && val > 0;
    })
    .map(([name, val]) => {
      if (Array.isArray(val)) {
        const hasRealMinutes = val.some((m) => m && m.includes("'"));
        if (hasRealMinutes) {
          const formattedTokens = val.map((m) =>
            m && m.includes("'") ? m.trim() : 'gol'
          );
          return `${name} (${formattedTokens.join(', ')})`;
        }
        return val.length > 1 ? `${name} (${val.length})` : name;
      }
      return val > 1 ? `${name} (${val})` : name;
    })
    .join(', ');
};

export const stringifyScorersWithMinutes = (map: Record<string, string[]>): string => {
  return stringifyScorers(map);
};

export const getVoteColor = (v?: number | string): string => {
  if (v === 's.v.' || v === 0) return '#88929b';
  if (v === undefined || v === null) return '#88929b';
  if (typeof v === 'string') return '#88929b';
  if (v < 5) return '#e57373';
  if (v < 6) return '#f39c12';
  if (v < 7) return '#88929b';
  if (v < 8) return '#4caf50';
  if (v < 9) return '#00e676';
  return '#00ff00';
};

import type { Player, MatchResult } from '@/types';

export interface PlayerStatsData {
  name: string;
  partiteGiocate: number;
  golFattiSquadra: number;
  golSubitiSquadra: number;
  sommaVoti: number;
  votiTrend: { matchId: number; data: string; voto: number; mediaCumulativa: number }[];
}

export const calculateStatsData = (
  matches: MatchResult[],
  showGuests: boolean,
  dbPlayers: Player[]
): PlayerStatsData[] => {
  const data: Record<string, PlayerStatsData> = {};

  const sortedMatches = [...matches].sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
  );

  sortedMatches.forEach(m => {
    if (!m.risultato || m.risultato === '0-0') return;
    const [scoreA, scoreB] = m.risultato
      .split('-')
      .map(s => parseInt(s.trim(), 10) || 0);

    const processPlayer = (
      playerName: string,
      teamGoalsScored: number,
      teamGoalsConceded: number
    ) => {
      if (!showGuests && !dbPlayers.some(p => p.Nome === playerName)) return;
      if (!data[playerName]) {
        data[playerName] = {
          name: playerName,
          partiteGiocate: 0,
          golFattiSquadra: 0,
          golSubitiSquadra: 0,
          sommaVoti: 0,
          votiTrend: [],
        };
      }
      data[playerName].partiteGiocate += 1;
      data[playerName].golFattiSquadra += teamGoalsScored;
      data[playerName].golSubitiSquadra += teamGoalsConceded;

      if (m.voti_giocatori && m.voti_giocatori[playerName] !== undefined) {
        const voto = m.voti_giocatori[playerName];
        if (typeof voto === 'number' && voto > 0) {
          data[playerName].sommaVoti += voto;
          const matchDate = new Date(m.data);
          const shortDate = `${matchDate
            .getDate()
            .toString()
            .padStart(2, '0')}/${(matchDate.getMonth() + 1)
            .toString()
            .padStart(2, '0')}`;

          const currentMatchesWithVotes = data[playerName].votiTrend.length + 1;
          const mediaCumulativa = Number(
            (data[playerName].sommaVoti / currentMatchesWithVotes).toFixed(2)
          );

          data[playerName].votiTrend.push({
            matchId: m.id,
            data: shortDate,
            voto,
            mediaCumulativa,
          });
        }
      }
    };

    m.team_a_players?.forEach(p => processPlayer(p, scoreA, scoreB));
    m.team_b_players?.forEach(p => processPlayer(p, scoreB, scoreA));
  });

  return Object.values(data).sort(
    (a, b) => b.golFattiSquadra - a.golFattiSquadra
  );
};

