import { Player, Cluster, MatchResult, AlgoSettings, LeaderboardEntry } from '@/types';
import { assignPlayersToFormation } from '@/lib/teams/formation-utils';

/**
 * Riconosce se un giocatore è un portiere controllando il tag nel nome,
 * il ruolo preferito o il ruolo secondario nel DB.
 */
export const isGoalkeeper = (playerName: string, customDbPlayers: Player[] = []): boolean => {
  if (!playerName) return false;
  const n = playerName.trim().toLowerCase();
  if (
    n.startsWith('(p)') ||
    n.startsWith('(por)') ||
    n.includes('(portiere)') ||
    n.includes('portiere') ||
    n.endsWith('(p)') ||
    n.endsWith('(por)')
  ) {
    return true;
  }
  const dbP = customDbPlayers.find(
    p => p.Nome?.toLowerCase().trim() === n || p.Nome === playerName
  );
  if (dbP) {
    const r1 = (dbP.Ruolo || '').toLowerCase().trim();
    const r2 = (dbP.RuoloSecondario || '').toLowerCase().trim();
    if (r1.includes('portier') || r1 === 'gk' || r1 === 'por') return true;
    if (r2.includes('portier') || r2 === 'gk' || r2 === 'por') return true;
  }
  return false;
};

/**
 * Determina il macro-ruolo per l'ordinamento in campo:
 * 1 = Difensori, 2 = Centrocampisti, 3 = Attaccanti
 */
export const getMacroRole = (pName: string, customDbPlayers: Player[] = []): number => {
  const dbP = customDbPlayers.find(
    x => x.Nome?.toLowerCase().trim() === pName.toLowerCase().trim() || x.Nome === pName
  );
  const r = (dbP?.Ruolo || '').toLowerCase();
  const rSec = (dbP?.RuoloSecondario || '').toLowerCase();
  const comb = `${r} ${rSec}`;
  if (
    comb.includes('difensor') ||
    comb.includes('terzino') ||
    comb.includes('cb') ||
    comb.includes('rb') ||
    comb.includes('lb')
  ) {
    return 1;
  }
  if (
    comb.includes('attaccant') ||
    comb.includes('punta') ||
    comb.includes('cf') ||
    comb.includes('ss')
  ) {
    return 3;
  }
  return 2;
};

/**
 * Posiziona il portiere all'indice 0 (POR) e ordina i giocatori di movimento:
 * Difesa -> Centrocampo -> Attacco.
 */
export const finalizeTeamLineup = (team: string[], customDbPlayers: Player[] = []): string[] => {
  if (!team || team.length === 0) return team;
  const copy = [...team];

  const gkIdx = copy.findIndex(p => isGoalkeeper(p, customDbPlayers));
  let gk: string | null = null;
  if (gkIdx !== -1) {
    [gk] = copy.splice(gkIdx, 1);
  }

  copy.sort((a, b) => getMacroRole(a, customDbPlayers) - getMacroRole(b, customDbPlayers));

  if (gk) {
    return [gk, ...copy];
  }
  return copy;
};

/**
 * Assicura che se è presente un portiere nella formazione, sia in porta (indice 0).
 */
export const ensureGoalkeeperInGoal = (team: string[], customDbPlayers: Player[] = []): string[] => {
  if (!team || team.length === 0) return team;
  if (isGoalkeeper(team[0], customDbPlayers)) return team;
  const gkIdx = team.findIndex(p => isGoalkeeper(p, customDbPlayers));
  if (gkIdx > 0) {
    const copy = [...team];
    const [gk] = copy.splice(gkIdx, 1);
    copy.unshift(gk);
    return copy;
  }
  return team;
};

/**
 * Calcola l'OVR / Rating del singolo giocatore pesando Voto, WinRate, Diff Reti e MVP.
 */
export const calculatePlayerRating = (
  name: string,
  leaderboard: LeaderboardEntry[] = [],
  statsData: any[] = [],
  algoSettings: AlgoSettings,
  ovrModifiers: Record<string, number> = {},
  withModifier = true
): number => {
  const s = statsData.find(x => x.name === name);
  const l = leaderboard.find(x => x.nome === name);

  let base = 6.0;
  if (l && l.media_voto > 0) base = l.media_voto;

  let off = 0;
  let dif = 0;
  if (s && s.partiteGiocate > 0) {
    off = s.golFattiSquadra / s.partiteGiocate;
    dif = s.golSubitiSquadra / s.partiteGiocate;
  }

  let mvp = 0;
  let winRate = 0.5;
  if (l && l.partite_giocate > 0) {
    mvp = l.mvp_count / l.partite_giocate;
    winRate = l.vittorie / l.partite_giocate;
  }

  const ratingBase = (base / 10) * algoSettings.wVoto;
  const ratingWin = winRate * algoSettings.wWinRate;
  const halfGol = algoSettings.wGolRatio / 2;
  const ratingDiff = Math.max(
    0,
    Math.min(algoSettings.wGolRatio, halfGol + (off - dif) * (algoSettings.wGolRatio / 10))
  );
  const ratingMvp = mvp * algoSettings.wMvp;

  const res = ratingBase + ratingWin + ratingDiff + ratingMvp;
  return res + (withModifier ? (ovrModifiers[name] || 0) : 0);
};

export interface BalanceTeamsParams {
  selectedPlayers: string[];
  matchFormat: number;
  clusters: Cluster[];
  dbPlayers: Player[];
  leaderboard: LeaderboardEntry[];
  statsData: any[];
  algoSettings: AlgoSettings;
  ovrModifiers?: Record<string, number>;
  forceShuffle?: boolean;
  matches?: MatchResult[];
  modulo7TeamA?: string;
  modulo7TeamB?: string;
  modulo8TeamA?: string;
  modulo8TeamB?: string;
}

export interface BalanceTeamsResult {
  teamA: string[];
  teamB: string[];
  isVolante?: boolean;
  flyingSubInfo?: {
    missingOld: string[];
    subentrati: string[];
  };
}

/**
 * Algoritmo completo di bilanciamento delle squadre:
 * - Gestisce 'Sostituzione Volante' se corrisponde a partita odierna con 1-2 cambi
 * - Applica vincoli di Cluster
 * - Bilancia la distribuzione dei portieri
 * - Bilancia i ruoli tattici (Difesa / Centrocampo / Attacco)
 * - Ripartizione greedy equilibrata delle forze
 */
export const balanceTeams = (params: BalanceTeamsParams): BalanceTeamsResult => {
  const {
    selectedPlayers,
    matchFormat,
    clusters,
    dbPlayers,
    leaderboard,
    statsData,
    algoSettings,
    ovrModifiers = {},
    forceShuffle = false,
    matches = [],
    modulo7TeamA,
    modulo7TeamB,
    modulo8TeamA,
    modulo8TeamB
  } = params;

  const modA = matchFormat === 7 ? (modulo7TeamA || '3-2-1') : (modulo8TeamA || '3-3-1');
  const modB = matchFormat === 7 ? (modulo7TeamB || '3-2-1') : (modulo8TeamB || '3-3-1');

  const getRating = (name: string, withMod = true) =>
    calculatePlayerRating(name, leaderboard, statsData, algoSettings, ovrModifiers, withMod);

  // Override logica di "Sostituzione Volante"
  if (!forceShuffle && matches && matches.length > 0) {
    const latestMatch = matches[0];
    const isToday = new Date(latestMatch.data).toDateString() === new Date().toDateString();

    if (
      isToday &&
      latestMatch.team_a_players &&
      latestMatch.team_b_players &&
      latestMatch.team_a_players.length + latestMatch.team_b_players.length === matchFormat * 2
    ) {
      const oldPlayers = [...latestMatch.team_a_players, ...latestMatch.team_b_players];
      const inCommon = selectedPlayers.filter(p => oldPlayers.includes(p));

      if (inCommon.length >= matchFormat * 2 - 3 && inCommon.length < matchFormat * 2) {
        const missingOld = oldPlayers.filter(p => !selectedPlayers.includes(p));
        const subentrati = selectedPlayers.filter(p => !oldPlayers.includes(p));

        if (missingOld.length === subentrati.length) {
          const teamA = [...latestMatch.team_a_players];
          const teamB = [...latestMatch.team_b_players];

          for (let i = 0; i < missingOld.length; i++) {
            const oldP = missingOld[i];
            const newP = subentrati[i];

            const idxA = teamA.indexOf(oldP);
            if (idxA !== -1) teamA[idxA] = newP;

            const idxB = teamB.indexOf(oldP);
            if (idxB !== -1) teamB[idxB] = newP;
          }

          return {
            teamA:
              matchFormat >= 7
                ? assignPlayersToFormation(teamA, matchFormat, modA, dbPlayers, leaderboard, statsData)
                : ensureGoalkeeperInGoal(teamA, dbPlayers),
            teamB:
              matchFormat >= 7
                ? assignPlayersToFormation(teamB, matchFormat, modB, dbPlayers, leaderboard, statsData)
                : ensureGoalkeeperInGoal(teamB, dbPlayers),
            isVolante: true,
            flyingSubInfo: { missingOld, subentrati }
          };
        }
      }
    }
  }

  // Pre-assegnazione bilanciata per cluster
  const assignments = new Map<string, 'teamA' | 'teamB'>();

  for (const cluster of clusters) {
    const members = [...cluster.members].sort(() => Math.random() - 0.5);
    const mid = Math.floor(members.length / 2);

    const [groupA, groupB] =
      Math.random() > 0.5
        ? [members.slice(0, mid), members.slice(mid)]
        : [members.slice(mid), members.slice(0, mid)];

    groupA.forEach(p => assignments.set(p, 'teamA'));
    groupB.forEach(p => assignments.set(p, 'teamB'));
  }

  // Bilanciamento Portieri: se ci sono portieri selezionati, distribuiamoli tra le due squadre
  const selectedGKs = selectedPlayers.filter(p => isGoalkeeper(p, dbPlayers));
  if (selectedGKs.length >= 2) {
    const unassignedGKs = selectedGKs.filter(p => !assignments.has(p));
    const gkA = selectedGKs.find(p => assignments.get(p) === 'teamA');
    const gkB = selectedGKs.find(p => assignments.get(p) === 'teamB');

    if (!gkA && !gkB && unassignedGKs.length >= 2) {
      const shuffled = [...unassignedGKs].sort(() => Math.random() - 0.5);
      assignments.set(shuffled[0], 'teamA');
      assignments.set(shuffled[1], 'teamB');
    } else if (gkA && !gkB && unassignedGKs.length >= 1) {
      assignments.set(unassignedGKs[0], 'teamB');
    } else if (!gkA && gkB && unassignedGKs.length >= 1) {
      assignments.set(unassignedGKs[0], 'teamA');
    }
  } else if (selectedGKs.length === 1) {
    const singleGK = selectedGKs[0];
    if (!assignments.has(singleGK)) {
      assignments.set(singleGK, Math.random() > 0.5 ? 'teamA' : 'teamB');
    }
  }

  // Assegnazione finale (Bilanciamento tramite storico Media Voto)
  const unassignedPlayers = selectedPlayers.filter(p => !assignments.has(p));
  let sortedUnassigned = [...unassignedPlayers];

  if (algoSettings.balanceRoles) {
    const categorized = sortedUnassigned.map(p => {
      const dbP = dbPlayers.find(x => x.Nome === p);
      const roleName = dbP ? dbP.Ruolo : 'Centrocampista Centrale';
      const s = statsData.find(x => x.name === p);
      const golRatio = s && s.partiteGiocate > 0 ? s.golFattiSquadra / s.partiteGiocate : 0;
      return {
        name: p,
        role: roleName,
        golRatio,
        ovr: getRating(p) + (Math.random() * 2 - 1),
        macro: ''
      };
    });

    const wingers = categorized.filter(
      c =>
        (c.role || '').toLowerCase().includes('ala') ||
        (c.role || '').toLowerCase().includes('jolly')
    );
    wingers.sort((a, b) => b.golRatio - a.golRatio);
    const half = Math.floor(wingers.length / 2);
    wingers.forEach((w, i) => {
      w.macro = i < half ? 'Offensivo' : 'Difensivo';
    });

    categorized.forEach(c => {
      if (!c.macro) {
        const r = (c.role || '').toLowerCase();
        if (r.includes('difensor') || r.includes('terzino') || r.includes('portiere'))
          c.macro = 'Difensivo';
        else if (r.includes('attaccante') || r.includes('trequartista') || r.includes('punta'))
          c.macro = 'Offensivo';
        else c.macro = 'Centrocampo';
      }
    });

    const defs = categorized.filter(c => c.macro === 'Difensivo').sort((a, b) => b.ovr - a.ovr);
    const mids = categorized.filter(c => c.macro === 'Centrocampo').sort((a, b) => b.ovr - a.ovr);
    const offs = categorized.filter(c => c.macro === 'Offensivo').sort((a, b) => b.ovr - a.ovr);

    sortedUnassigned = [...defs, ...mids, ...offs].map(c => c.name);
  } else {
    sortedUnassigned.sort((a, b) => {
      return getRating(b) - getRating(a) + (Math.random() * 2 - 1);
    });
  }

  const teamA: string[] = [];
  const teamB: string[] = [];
  let ratingSumA = 0;
  let ratingSumB = 0;

  // Inserimento dei pre-assegnati
  for (const player of selectedPlayers) {
    const assignedTeam = assignments.get(player);
    if (assignedTeam) {
      const rating = getRating(player);
      if (assignedTeam === 'teamA' && teamA.length < matchFormat) {
        teamA.push(player);
        ratingSumA += rating;
      } else if (assignedTeam === 'teamB' && teamB.length < matchFormat) {
        teamB.push(player);
        ratingSumB += rating;
      } else {
        throw new Error('Impossibile rispettare tutti i vincoli. Riduci la dimensione dei cluster.');
      }
    }
  }

  // Distribuzione greedy dei restanti
  for (const player of sortedUnassigned) {
    const rating = getRating(player);
    if (teamA.length < matchFormat && (teamB.length === matchFormat || ratingSumA <= ratingSumB)) {
      teamA.push(player);
      ratingSumA += rating;
    } else if (teamB.length < matchFormat) {
      teamB.push(player);
      ratingSumB += rating;
    } else {
      throw new Error('Impossibile completare le squadre');
    }
  }

  if (teamA.length !== matchFormat || teamB.length !== matchFormat) {
    throw new Error('Errore nella generazione delle squadre');
  }

  if (matchFormat >= 7) {
    return {
      teamA: assignPlayersToFormation(teamA, matchFormat, modA, dbPlayers, leaderboard, statsData),
      teamB: assignPlayersToFormation(teamB, matchFormat, modB, dbPlayers, leaderboard, statsData),
      isVolante: false
    };
  }

  return {
    teamA: finalizeTeamLineup(teamA, dbPlayers),
    teamB: finalizeTeamLineup(teamB, dbPlayers),
    isVolante: false
  };
};
