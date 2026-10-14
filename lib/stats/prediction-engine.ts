import { MatchResult, PredictionSettings } from '@/types';

export const getMatchFormatSize = (m: {
  team_a_players?: string[];
  team_b_players?: string[];
}): number => {
  const lenA = m.team_a_players?.length || 0;
  const lenB = m.team_b_players?.length || 0;
  const size = Math.max(lenA, lenB) || 5;
  return size >= 5 && size <= 8 ? size : 5;
};

export const getMatchTrack = (m: {
  team_a_players?: string[];
  team_b_players?: string[];
}): '5-6' | '7-8' => {
  const size = getMatchFormatSize(m);
  return size >= 7 ? '7-8' : '5-6';
};

export const isMatchAllowedForPrediction = (
  pastMatch: { team_a_players?: string[]; team_b_players?: string[] },
  targetFormat: number,
  settings: PredictionSettings
): boolean => {
  const pastSize = getMatchFormatSize(pastMatch);
  if (!settings || settings.mode === 'all') return true;
  if (settings.mode === 'tracks') {
    return targetFormat >= 7 === pastSize >= 7;
  }
  if (settings.mode === 'strict') {
    return pastSize === targetFormat;
  }
  if (settings.mode === 'custom') {
    const allowed = settings.customMatrix?.[targetFormat as 5 | 6 | 7 | 8];
    if (Array.isArray(allowed)) {
      return allowed.includes(pastSize);
    }
    return true;
  }
  return true;
};

export interface HistoricalPredictionResult {
  preds: Record<
    number,
    {
      favorite: 'A' | 'B' | 'X';
      correct: boolean;
      track: '5-6' | '7-8';
      formatSize: number;
    }
  >;
  accuracy: number;
  correctCount: number;
  totalCount: number;
}

/**
 * Calcola l'accuratezza e le previsioni retrospettive per tutte le partite dello storico.
 */
export const calculateHistoricalPredictions = (
  matches: MatchResult[],
  predictionSettings: PredictionSettings
): HistoricalPredictionResult => {
  const uniqueMatchesMap = new Set<string>();
  const validMatches = [...matches]
    .filter(m => {
      if (!m.risultato || m.risultato === '0-0') return false;
      const teamA = (m.team_a_name || '').trim();
      const teamB = (m.team_b_name || '').trim();
      const [scoreA, scoreB] = m.risultato.split('-').map(s => s.trim());
      const key =
        teamA < teamB
          ? `${teamA}_${teamB}_${scoreA}-${scoreB}`
          : `${teamB}_${teamA}_${scoreB}-${scoreA}`;
      if (uniqueMatchesMap.has(key)) return false;
      uniqueMatchesMap.add(key);
      return true;
    })
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  const preds: Record<
    number,
    { favorite: 'A' | 'B' | 'X'; correct: boolean; track: '5-6' | '7-8'; formatSize: number }
  > = {};
  let correctCount = 0;
  let totalCount = 0;

  validMatches.forEach((match, index) => {
    const matchFormatSize =
      Math.max(match.team_a_players?.length || 0, match.team_b_players?.length || 0) || 5;
    const matchTrack = getMatchTrack(match);
    const pastMatches = validMatches
      .slice(0, index)
      .filter(m => isMatchAllowedForPrediction(m, matchFormatSize, predictionSettings));
    if (pastMatches.length === 0) return;

    const data: Record<string, any> = {};
    const mvps: Record<string, number> = {};

    pastMatches.forEach(m => {
      const [sA, sB] = (m.risultato || '0-0')
        .split('-')
        .map(s => parseInt(s.trim(), 10) || 0);

      let matchMaxVote = 0;
      let matchMVPs: string[] = [];
      if (m.voti_giocatori) {
        Object.entries(m.voti_giocatori).forEach(([p, voto]) => {
          if (typeof voto === 'number' && voto > matchMaxVote) {
            matchMaxVote = voto;
          }
        });
      }

      if (m.mvps && m.mvps.length > 0) {
        matchMVPs =
          typeof m.mvps === 'string'
            ? JSON.parse(m.mvps)
            : Array.isArray(m.mvps)
            ? m.mvps
            : [];
      } else if (matchMaxVote > 0 && m.voti_giocatori) {
        matchMVPs = Object.keys(m.voti_giocatori).filter(
          p => m.voti_giocatori![p] === matchMaxVote
        );
      }

      matchMVPs.forEach(p => {
        mvps[p] = (mvps[p] || 0) + 1;
      });

      const processP = (p: string, gF: number, gS: number) => {
        if (!data[p])
          data[p] = {
            partiteGiocate: 0,
            golFattiSquadra: 0,
            golSubitiSquadra: 0,
            sommaVoti: 0,
            votiCount: 0
          };
        data[p].partiteGiocate++;
        data[p].golFattiSquadra += gF;
        data[p].golSubitiSquadra += gS;
        if (
          m.voti_giocatori &&
          typeof m.voti_giocatori[p] === 'number' &&
          m.voti_giocatori[p] > 0
        ) {
          data[p].sommaVoti += m.voti_giocatori[p];
          data[p].votiCount++;
        }
      };
      m.team_a_players?.forEach(p => processP(p, sA, sB));
      m.team_b_players?.forEach(p => processP(p, sB, sA));
    });

    const getTeamStats = (teamPlayers: string[]) => {
      let sumMediaVoto = 0,
        sumGolFattiAvg = 0,
        sumGolSubitiAvg = 0,
        totalMvp = 0,
        validVoto = 0,
        validGol = 0;
      teamPlayers.forEach(p => {
        const s = data[p];
        if (s && s.partiteGiocate > 0) {
          if (s.votiCount > 0) {
            sumMediaVoto += s.sommaVoti / s.votiCount;
            validVoto++;
          }
          sumGolFattiAvg += s.golFattiSquadra / s.partiteGiocate;
          sumGolSubitiAvg += s.golSubitiSquadra / s.partiteGiocate;
          validGol++;
        }
        if (mvps[p]) totalMvp += mvps[p];
      });
      return {
        mediaVoto: validVoto > 0 ? sumMediaVoto / validVoto : 6,
        golFatti: validGol > 0 ? sumGolFattiAvg / validGol : 0,
        golSubiti: validGol > 0 ? sumGolSubitiAvg / validGol : 0,
        mvp: totalMvp
      };
    };

    const getSynergy = (teamPlayers: string[]) => {
      let wWins = 0,
        wDraws = 0,
        wLosses = 0,
        wGF = 0,
        wGS = 0,
        tW = 0;
      pastMatches.forEach(m => {
        const teamAP = m.team_a_players || [];
        const teamBP = m.team_b_players || [];
        const [sA, sB] = (m.risultato || '0-0')
          .split('-')
          .map(s => parseInt(s.trim(), 10) || 0);
        const overlapA = teamPlayers.filter(p => teamAP.includes(p)).length;
        const overlapB = teamPlayers.filter(p => teamBP.includes(p)).length;
        if (overlapA >= 2 || overlapB >= 2) {
          const bestOverlap = overlapA >= overlapB ? overlapA : overlapB;
          const isOnSideA = overlapA >= overlapB;
          const pastSize = Math.max(teamAP.length, teamBP.length) || 5;
          const maxPossibleOverlap = Math.min(matchFormatSize, pastSize);
          const weight = Math.pow(bestOverlap / Math.max(maxPossibleOverlap, 2), 2);
          const gF = isOnSideA ? sA : sB;
          const gS = isOnSideA ? sB : sA;
          if (gF > gS) wWins += weight;
          else if (gF === gS) wDraws += weight;
          else wLosses += weight;
          tW += weight;
        }
      });
      return {
        winRate: tW > 0 ? wWins / tW : 0,
        drawRate: tW > 0 ? wDraws / tW : 0,
        lossRate: tW > 0 ? wLosses / tW : 0,
        totalWeight: tW,
        avgGolFatti: tW > 0 ? wGF / tW : 0,
        avgGolSubiti: tW > 0 ? wGS / tW : 0
      };
    };

    const statsA = getTeamStats(match.team_a_players || []);
    const statsB = getTeamStats(match.team_b_players || []);
    const synA = getSynergy(match.team_a_players || []);
    const synB = getSynergy(match.team_b_players || []);

    const getComposite = (st: any, syn: any) => {
      const normVoto = (st.mediaVoto - 4) / 6;
      const normGolDiff = (st.golFatti - st.golSubiti) / Math.max(st.golFatti + st.golSubiti, 1);
      const mvpBonus = Math.min(st.mvp * 0.02, 0.1);
      const indScore = normVoto * 0.5 + normGolDiff * 0.35 + mvpBonus;
      const synScore =
        syn.totalWeight > 0 ? syn.winRate * 0.6 + syn.drawRate * 0.2 - syn.lossRate * 0.2 : 0.5;
      const wSyn = syn.totalWeight > 0 ? 0.4 : 0;
      const wInd = 1 - wSyn;
      return indScore * wInd + synScore * wSyn;
    };

    const compA = getComposite(statsA, synA);
    const compB = getComposite(statsB, synB);
    const diff = compA - compB;
    const sigmoid = (x: number) => 1 / (1 + Math.exp(-x * 8));
    const rawA = sigmoid(diff);
    const rawB = 1 - rawA;
    const drawBase = 0.15;
    const drawBonus = Math.max(0, 0.25 - Math.abs(diff) * 2);
    const drawPct = Math.min(drawBase + drawBonus, 0.4);

    const winAPct = rawA * (1 - drawPct);
    const winBPct = rawB * (1 - drawPct);
    const pctA = Math.round(winAPct * 100);
    const pctB = Math.round(winBPct * 100);

    const favorite = pctA > pctB ? 'A' : pctB > pctA ? 'B' : 'X';

    const [actA, actB] = (match.risultato || '0-0')
      .split('-')
      .map(s => parseInt(s.trim(), 10) || 0);
    const actual = actA > actB ? 'A' : actB > actA ? 'B' : 'X';

    preds[match.id] = {
      favorite,
      correct: favorite === actual,
      track: matchTrack,
      formatSize: matchFormatSize
    };

    if (favorite === actual) correctCount++;
    totalCount++;
  });

  return {
    preds,
    accuracy: totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 100,
    correctCount,
    totalCount
  };
};
