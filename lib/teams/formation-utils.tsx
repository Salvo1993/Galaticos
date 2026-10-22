import React from 'react';
import { Player, MatchResult, LeaderboardEntry } from '@/types';

export const hashStringToHue = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
};

export const getRoleAbbreviation = (ruolo: string | undefined): string => {
  if (!ruolo) return '';
  const r = ruolo.toUpperCase();
  if (r.includes('PORTIERE')) return 'GK';
  if (r.includes('TERZINO DESTRO') || r.includes('TERZINO D')) return 'RB';
  if (r.includes('TERZINO SINISTRO') || r.includes('TERZINO S')) return 'LB';
  if (r.includes('TERZINO')) return 'SB';
  if (r.includes('DIFENSORE')) return 'CB';
  if (r.includes('MEDIANO')) return 'DMF';
  if (r.includes('TREQUARTISTA')) return 'AMF';
  if (r.includes('ESTERNO')) return 'SMF';
  if (r.includes('ALA')) return 'WF';
  if (r.includes('CENTROCAMPISTA CENTRALE') || r === 'CC') return 'CMF';
  if (r.includes('CENTROCAMPISTA')) return 'CMF';
  if (r.includes('SECONDA PUNTA')) return 'SS';
  if (r.includes('PUNTA') || r.includes('ATTACCANTE')) return 'CF';
  return r.substring(0, 3).trim().toUpperCase();
};

/**
 * Converte il codice ruolo del campo tattico (POR, DC, TS, TD, CC, MED, ES, ED, ATT, etc.)
 * nel nome del ruolo in italiano e nella sua abbreviazione PES.
 */
export const getAssignedRoleInfo = (
  roleCode: string | undefined
): { name: string; abbr: string } => {
  if (!roleCode) return { name: '', abbr: '' };
  const r = roleCode.toUpperCase().trim();
  switch (r) {
    case 'POR':
      return { name: 'Portiere', abbr: 'GK' };
    case 'TS':
      return { name: 'Terzino Sinistro', abbr: 'LB' };
    case 'TD':
      return { name: 'Terzino Destro', abbr: 'RB' };
    case 'DC':
      return { name: 'Difensore Centrale', abbr: 'CB' };
    case 'DIF':
      return { name: 'Difensore', abbr: 'CB' };
    case 'MED':
      return { name: 'Mediano', abbr: 'DMF' };
    case 'CC':
      return { name: 'Centrocampista Centrale', abbr: 'CMF' };
    case 'ES':
    case 'CLS':
      return { name: 'Esterno Sinistro', abbr: 'LMF' };
    case 'ED':
    case 'CLD':
      return { name: 'Esterno Destro', abbr: 'RMF' };
    case 'LAT':
      return { name: 'Laterale', abbr: 'SMF' };
    case 'ATT':
      return { name: 'Attaccante', abbr: 'CF' };
    default:
      return { name: roleCode, abbr: roleCode.substring(0, 3).toUpperCase() };
  }
};

export const getPlayerFoot = (piede?: string | null): 'destro' | 'sinistro' | 'ambidestro' | null => {
  if (!piede) return null;
  const p = piede.trim().toLowerCase();
  if (p.includes('ambi') || p.includes('both') || p.includes('entrambi')) return 'ambidestro';
  if (p.includes('sinistr') || p === 'sx' || p === 's' || p === 'left' || p === 'l') return 'sinistro';
  if (p.includes('destr') || p === 'dx' || p === 'd' || p === 'right' || p === 'r') return 'destro';
  return null;
};

export const isLeftFlankRole = (roleCode: string | undefined): boolean => {
  if (!roleCode) return false;
  const r = roleCode.toUpperCase().trim();
  return r === 'TS' || r === 'ES' || r === 'CLS';
};

export const isRightFlankRole = (roleCode: string | undefined): boolean => {
  if (!roleCode) return false;
  const r = roleCode.toUpperCase().trim();
  return r === 'TD' || r === 'ED' || r === 'CLD';
};

export const isFlankRole = (roleCode: string | undefined): boolean => {
  return isLeftFlankRole(roleCode) || isRightFlankRole(roleCode);
};

/**
 * Verifica se il ruolo assegnato in campo coincide con il ruolo primario del giocatore.
 * Se il ruolo è generico (es. solo 'Ala', solo 'Terzino', solo 'Esterno'), si abbina il Piede alla fascia:
 * - Piede DX -> fascia destra (ED, CLD, TD)
 * - Piede SX -> fascia sinistra (ES, CLS, TS)
 * Se è specificato esplicitamente il lato (es. 'Ala Destra' o 'Terzino Sinistro'), il piede non viene considerato.
 */
export const isRoleMatchingPrimary = (
  primaryRole: string | undefined,
  assignedRoleCode: string | undefined,
  piede?: string | null
): boolean => {
  if (!primaryRole || !assignedRoleCode) return false;
  const p = primaryRole.trim().toLowerCase();
  const a = assignedRoleCode.trim().toUpperCase();

  if (p.includes('jolly')) {
    return a !== 'POR';
  }

  // Verifica se è specificata esplicitamente la fascia
  const hasExplicitLeft = p.includes('sinistr') || p.includes('sx') || p.includes('left');
  const hasExplicitRight = p.includes('destr') || p.includes('dx') || p.includes('right');

  // "Ovviamente se è specificato Terzino Sinistro o Ala Destra non devi prendere in considerazione il piede"
  if (hasExplicitLeft) {
    if (isRightFlankRole(a)) return false;
  }
  if (hasExplicitRight) {
    if (isLeftFlankRole(a)) return false;
  }

  // Se NON è specificata esplicitamente la fascia (es. solo 'Ala', solo 'Terzino', solo 'Esterno', solo 'Laterale'):
  // "se uno è solo Ala senza specificare ala sinistra o ala destra ... basati sul Piede salvato nella scheda giocatore. Abbina il piede alla fascia"
  const isGenericFlankRole =
    !hasExplicitLeft &&
    !hasExplicitRight &&
    (p.includes('ala') || p.includes('terzino') || p.includes('esterno') || p.includes('laterale'));

  if (isGenericFlankRole) {
    const foot = getPlayerFoot(piede);
    if (foot === 'destro') {
      if (isLeftFlankRole(a)) return false;
    } else if (foot === 'sinistro') {
      if (isRightFlankRole(a)) return false;
    }
  }

  switch (a) {
    case 'POR':
      return p.includes('portier') || p === 'gk' || p === 'por';
    case 'TS':
      return (
        p.includes('terzino sinistro') ||
        p === 'lb' ||
        p === 'ts' ||
        (p.includes('terzino') && !hasExplicitRight)
      );
    case 'TD':
      return (
        p.includes('terzino destro') ||
        p === 'rb' ||
        p === 'td' ||
        (p.includes('terzino') && !hasExplicitLeft)
      );
    case 'DC':
      return (
        p.includes('difensore centrale') ||
        p === 'difensore' ||
        p === 'cb' ||
        p === 'dc'
      );
    case 'DIF':
      return p.includes('difensor') || p.includes('terzino') || p === 'cb' || p === 'sb';
    case 'MED':
      return (
        p.includes('mediano') ||
        p.includes('centrocampista') ||
        p.includes('trequartista') ||
        p === 'dmf' ||
        p === 'med'
      );
    case 'CC':
      return (
        p.includes('centrocampista centrale') ||
        p.includes('centrocampista') ||
        p.includes('trequartista') ||
        p === 'mezzala' ||
        p === 'cmf' ||
        p === 'cc'
      );
    case 'ES':
    case 'CLS':
      return (
        p.includes('esterno sinistro') ||
        p.includes('ala sinistra') ||
        ((p.includes('ala') || p.includes('esterno')) && !hasExplicitRight) ||
        p.includes('trequartista') ||
        p === 'lmf' ||
        p === 'lwf' ||
        p === 'es' ||
        p === 'cls'
      );
    case 'ED':
    case 'CLD':
      return (
        p.includes('esterno destro') ||
        p.includes('ala destra') ||
        ((p.includes('ala') || p.includes('esterno')) && !hasExplicitLeft) ||
        p.includes('trequartista') ||
        p === 'rmf' ||
        p === 'rwf' ||
        p === 'ed' ||
        p === 'cld'
      );
    case 'LAT':
      return p.includes('esterno') || p.includes('ala') || p.includes('terzino') || p === 'smf';
    case 'ATT':
      return (
        p.includes('attaccante') ||
        p.includes('punta') ||
        p.includes('centravanti') ||
        p.includes('seconda punta') ||
        p.includes('trequartista') ||
        p === 'cf' ||
        p === 'ss' ||
        p === 'att'
      );
    default:
      return p === a.toLowerCase();
  }
};

/**
 * Verifica se uno dei ruoli secondari del giocatore coincide con il ruolo assegnato in campo.
 */
export const isRoleMatchingSecondary = (
  secondaryRolesStr: string | null | undefined,
  assignedRoleCode: string | undefined,
  piede?: string | null
): boolean => {
  if (!secondaryRolesStr || !assignedRoleCode) return false;
  const list = secondaryRolesStr.split(',').map(s => s.trim()).filter(Boolean);
  return list.some(secRole => isRoleMatchingPrimary(secRole, assignedRoleCode, piede));
};

export const getPitchPositionsForTeam = (
  teamSize: number, 
  modulo7?: string, 
  modulo8?: string
): { top: string; left: string; role: string }[] => {
  if (teamSize === 5) {
    return [
      { top: '87%', left: '50%', role: 'POR' },
      { top: '65%', left: '50%', role: 'DIF' },
      { top: '42%', left: '20%', role: 'LAT' },
      { top: '42%', left: '80%', role: 'LAT' },
      { top: '15%', left: '50%', role: 'ATT' }
    ];
  } else if (teamSize === 6) {
    return [
      { top: '87%', left: '50%', role: 'POR' },
      { top: '65%', left: '30%', role: 'DIF' },
      { top: '65%', left: '70%', role: 'DIF' },
      { top: '42%', left: '20%', role: 'LAT' },
      { top: '42%', left: '80%', role: 'LAT' },
      { top: '15%', left: '50%', role: 'ATT' }
    ];
  } else if (teamSize === 7) {
    if (modulo7 === '2-3-1') {
      return [
        { top: '87%', left: '50%', role: 'POR' },
        { top: '66%', left: '32%', role: 'DC' },
        { top: '66%', left: '68%', role: 'DC' },
        { top: '42%', left: '18%', role: 'ES' },
        { top: '44%', left: '50%', role: 'CC' },
        { top: '42%', left: '82%', role: 'ED' },
        { top: '15%', left: '50%', role: 'ATT' }
      ];
    } else if (modulo7 === '2-2-2') {
      return [
        { top: '87%', left: '50%', role: 'POR' },
        { top: '66%', left: '32%', role: 'DC' },
        { top: '66%', left: '68%', role: 'DC' },
        { top: '42%', left: '34%', role: 'CC' },
        { top: '42%', left: '66%', role: 'CC' },
        { top: '15%', left: '34%', role: 'ATT' },
        { top: '15%', left: '66%', role: 'ATT' }
      ];
    } else if (modulo7 === '3-1-2') {
      return [
        { top: '87%', left: '50%', role: 'POR' },
        { top: '66%', left: '20%', role: 'TS' },
        { top: '68%', left: '50%', role: 'DC' },
        { top: '66%', left: '80%', role: 'TD' },
        { top: '43%', left: '50%', role: 'MED' },
        { top: '15%', left: '34%', role: 'ATT' },
        { top: '15%', left: '66%', role: 'ATT' }
      ];
    } else {
      // DEFAULT (3-2-1)
      return [
        { top: '87%', left: '50%', role: 'POR' },
        { top: '66%', left: '20%', role: 'TS' },
        { top: '68%', left: '50%', role: 'DC' },
        { top: '66%', left: '80%', role: 'TD' },
        { top: '42%', left: '35%', role: 'CC' },
        { top: '42%', left: '65%', role: 'CC' },
        { top: '15%', left: '50%', role: 'ATT' }
      ];
    }
  } else if (teamSize === 8) {
    if (modulo8 === '2-3-2') {
      return [
        { top: '87%', left: '50%', role: 'POR' },
        { top: '67%', left: '32%', role: 'DC' },
        { top: '67%', left: '68%', role: 'DC' },
        { top: '43%', left: '18%', role: 'ES' },
        { top: '45%', left: '50%', role: 'CC' },
        { top: '43%', left: '82%', role: 'ED' },
        { top: '15%', left: '34%', role: 'ATT' },
        { top: '15%', left: '66%', role: 'ATT' }
      ];
    } else if (modulo8 === '3-2-2') {
      return [
        { top: '87%', left: '50%', role: 'POR' },
        { top: '66%', left: '20%', role: 'TS' },
        { top: '68%', left: '50%', role: 'DC' },
        { top: '66%', left: '80%', role: 'TD' },
        { top: '43%', left: '34%', role: 'CC' },
        { top: '43%', left: '66%', role: 'CC' },
        { top: '15%', left: '34%', role: 'ATT' },
        { top: '15%', left: '66%', role: 'ATT' }
      ];
    } else if (modulo8 === '2-4-1') {
      return [
        { top: '87%', left: '50%', role: 'POR' },
        { top: '68%', left: '32%', role: 'DC' },
        { top: '68%', left: '68%', role: 'DC' },
        { top: '43%', left: '15%', role: 'CLS' },
        { top: '46%', left: '38%', role: 'MED' },
        { top: '46%', left: '62%', role: 'MED' },
        { top: '43%', left: '85%', role: 'CLD' },
        { top: '15%', left: '50%', role: 'ATT' }
      ];
    } else {
      return [
        { top: '87%', left: '50%', role: 'POR' },
        { top: '66%', left: '20%', role: 'TS' },
        { top: '68%', left: '50%', role: 'DC' },
        { top: '66%', left: '80%', role: 'TD' },
        { top: '42%', left: '18%', role: 'ES' },
        { top: '44%', left: '50%', role: 'CC' },
        { top: '42%', left: '82%', role: 'ED' },
        { top: '15%', left: '50%', role: 'ATT' }
      ];
    }
  }
  return [];
};

// --- PES Morale Component (Arrows & Energy) ---
export const PesMorale = ({ condition }: { condition: 'excellent' | 'good' | 'normal' | 'poor' | 'terrible' | 'neutral' }) => {
  const getProps = () => {
    switch (condition) {
      case 'excellent': return { color: '#ff5252', rotation: -90, energy: 100 }; // Red Up
      case 'good': return { color: '#ffb74d', rotation: -45, energy: 100 };      // Orange Diagonal
      case 'normal': return { color: '#69f0ae', rotation: 0, energy: 100 };      // Green Right
      case 'poor': return { color: '#4dd0e1', rotation: 45, energy: 60 };        // Blue Diagonal Down
      case 'terrible': return { color: '#29b6f6', rotation: 90, energy: 40 };    // Blue Down
      case 'neutral': return { color: '#69f0ae', rotation: 0, energy: 100 };     // Green Right
    }
  };

  const { color, rotation, energy } = getProps();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {/* Energy Bar */}
      <div style={{ 
        width: '36px', 
        height: '14px', 
        background: '#0a1922', 
        border: '1px solid #3a4a5a',
        padding: '1px',
        display: 'flex'
      }}>
        <div style={{
          width: `${energy}%`,
          height: '100%',
          background: 'linear-gradient(to right, #00e676, #ffffff)'
        }} />
      </div>

      {/* Arrow Box */}
      <div style={{
        width: '16px',
        height: '16px',
        background: '#1a2a3a',
        border: '1px solid #3a4a5a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '2px'
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" style={{ transform: `rotate(${rotation}deg)` }}>
          <path d="M 2 10 L 13 10 L 13 4 L 22 12 L 13 20 L 13 14 L 2 14 Z" fill={color} />
        </svg>
      </div>
    </div>
  );
};

export const getPlayerMorale = (
  playerName: string, 
  matches: MatchResult[]
): { condition: 'excellent' | 'good' | 'normal' | 'poor' | 'terrible' | 'neutral', title: string } => {
  if (!matches || matches.length === 0) return { condition: 'neutral', title: 'Nessuna partita' };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 14);

  const pastMatches = matches.filter(m => {
    const matchDate = new Date(m.data);
    const isInterruptedMatch = matchDate.getDate() === 8 && matchDate.getMonth() === 6 && matchDate.getFullYear() === 2026 && m.ora && m.ora.startsWith('21');
    matchDate.setHours(0, 0, 0, 0);
    return !isInterruptedMatch && matchDate.getTime() < today.getTime() && m.risultato && m.risultato !== '0-0';
  });

  const lastMatchPlayed = pastMatches.find(m => (m.team_a_players || []).includes(playerName) || (m.team_b_players || []).includes(playerName));

  if (!lastMatchPlayed) {
     return { condition: 'neutral', title: 'Mai giocato' };
  }

  const lastMatchDate = new Date(lastMatchPlayed.data);
  lastMatchDate.setHours(0, 0, 0, 0);

  if (lastMatchDate.getTime() < fourteenDaysAgo.getTime()) {
     return { condition: 'neutral', title: 'Inattivo (Fuori forma, non gioca da 14gg)' };
  }

  const vote = lastMatchPlayed.voti_giocatori?.[playerName];
  
  if (vote === undefined || vote === null || vote === 's.v.' || (typeof vote === 'number' && vote === 0)) {
    return { condition: 'neutral', title: 'Senza voto' };
  }
  
  let condition: 'excellent' | 'good' | 'normal' | 'poor' | 'terrible' = 'normal';
  const numVote = typeof vote === 'number' ? vote : parseFloat(vote as string) || 0;
  if (numVote >= 7.5) { condition = 'excellent'; }
  else if (numVote >= 6.5) { condition = 'good'; }
  else if (numVote >= 6) { condition = 'normal'; }
  else if (numVote >= 5) { condition = 'poor'; }
  else { condition = 'terrible'; }

  return { condition, title: `Ultimo voto: ${vote}` };
};

/**
 * Assegna i giocatori di una squadra ai ruoli effettivi della formazione sul campo 2D.
 * Regole per 7vs7 e 8vs8:
 * 1. Assegna prima i ruoli definiti preferiti (primari) dai giocatori
 * 2. Assegna i giocatori che hanno ruoli secondari compatibili con i ruoli lasciati vuoti dal punto 1
 * 3. In caso di concorrenza sul ruolo (es. 2 con ruolo preferito ATT o difensori):
 *    - Seleziona in base alle statistiche storiche migliori: Media Voto, MVP.
 *    - Per gli attaccanti prediligi chi ha più gol.
 *    - Per i difensori/terzini prediligi chi ha meno gol subiti (media a partita).
 * 4. In caso di Guest o giocatori senza ruoli compatibili, assegna nei ruoli rimasti vuoti.
 * Nota: per 5vs5 e 6vs6 non cambia nulla (ordinamento standard macro-ruolo).
 */
export const assignPlayersToFormation = (
  team: string[],
  matchFormat: number,
  modulo: string | undefined,
  dbPlayers: Player[] = [],
  leaderboard: LeaderboardEntry[] = [],
  statsData: any[] = []
): string[] => {
  if (!team || team.length === 0) return team;

  const checkIsGk = (name: string): boolean => {
    if (!name) return false;
    const n = name.trim().toLowerCase();
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
    const dbP = dbPlayers.find(
      p => p.Nome?.toLowerCase().trim() === n || p.Nome === name
    );
    if (dbP) {
      const r1 = (dbP.Ruolo || '').toLowerCase().trim();
      const r2 = (dbP.RuoloSecondario || '').toLowerCase().trim();
      if (r1.includes('portier') || r1 === 'gk' || r1 === 'por') return true;
      if (r2.includes('portier') || r2 === 'gk' || r2 === 'por') return true;
    }
    return false;
  };

  // A livello di Campo a 5vs5 e 6vs6 non cambia NULLA
  if (matchFormat <= 6 || team.length <= 6) {
    const copy = [...team];
    const gkIdx = copy.findIndex(p => checkIsGk(p));
    let gk: string | null = null;
    if (gkIdx !== -1) {
      [gk] = copy.splice(gkIdx, 1);
    }
    const getMacro = (name: string): number => {
      const dbP = dbPlayers.find(p => p.Nome === name);
      const r = (dbP?.Ruolo || '').toLowerCase();
      if (r.includes('difensor') || r.includes('terzino') || r.includes('portiere')) return 1;
      if (r.includes('attaccant') || r.includes('punta') || r.includes('cf') || r.includes('ss')) return 3;
      return 2;
    };
    copy.sort((a, b) => getMacro(a) - getMacro(b));
    return gk ? [gk, ...copy] : copy;
  }

  const positions = getPitchPositionsForTeam(
    team.length,
    matchFormat === 7 ? modulo : undefined,
    matchFormat === 8 ? modulo : undefined
  );

  const assigned: (string | null)[] = Array(positions.length).fill(null);
  const unassigned = [...team];

  const getPlayerInfo = (name: string) => {
    const isGk = checkIsGk(name);
    const dbP = dbPlayers.find(
      p => p.Nome?.toLowerCase().trim() === name.toLowerCase().trim() || p.Nome === name
    );
    const primaryRole = dbP?.Ruolo || (isGk ? 'Portiere' : undefined);
    const secondaryRolesStr = dbP?.RuoloSecondario || '';
    const piede = dbP?.piede || null;
    const foot = getPlayerFoot(piede);
    const isGuest =
      !dbP ||
      name.toLowerCase().includes('ospite') ||
      name.toLowerCase().includes('guest') ||
      name.toLowerCase().startsWith('ospite');

    const lb = leaderboard.find(
      l => l.nome?.toLowerCase().trim() === name.toLowerCase().trim() || l.nome === name
    );
    const st = statsData.find(
      s => s.name?.toLowerCase().trim() === name.toLowerCase().trim() || s.name === name
    );

    const mediaVoto = lb && lb.media_voto > 0 ? lb.media_voto : 6.0;
    const mvpCount = lb?.mvp_count || 0;
    const golFatti = lb?.gol_fatti ?? (st?.golFattiSquadra || 0);
    const golSubitiAvg =
      st && st.partiteGiocate > 0 ? st.golSubitiSquadra / st.partiteGiocate : 999;
    const partiteGiocate = lb?.partite_giocate ?? (st?.partiteGiocate || 0);

    return {
      name,
      isGk,
      primaryRole,
      secondaryRolesStr,
      piede,
      foot,
      isGuest,
      mediaVoto,
      mvpCount,
      golFatti,
      golSubitiAvg,
      partiteGiocate
    };
  };

  // Regola 3: Comparazione statistica per il ruolo
  const comparePlayersForRole = (nameA: string, nameB: string, roleCode: string): number => {
    const a = getPlayerInfo(nameA);
    const b = getPlayerInfo(nameB);

    // 1. Media Voto (differenza significativa >= 0.05)
    if (Math.abs(a.mediaVoto - b.mediaVoto) >= 0.05) {
      return b.mediaVoto - a.mediaVoto; // voto più alto vince
    }

    // 2. MVP count
    if (a.mvpCount !== b.mvpCount) {
      return b.mvpCount - a.mvpCount; // più MVP vince
    }

    // 3. Statistica specifica di reparto
    if (roleCode === 'ATT') {
      // Per gli attaccanti prediligi quelli con più gol
      if (a.golFatti !== b.golFatti) {
        return b.golFatti - a.golFatti;
      }
    } else if (['TS', 'TD', 'DC', 'DIF'].includes(roleCode)) {
      // Per i difensori/terzini quelli con meno gol subiti
      if (Math.abs(a.golSubitiAvg - b.golSubitiAvg) >= 0.05) {
        return a.golSubitiAvg - b.golSubitiAvg; // meno gol subiti vince
      }
    }

    // 4. Media voto per scarti inferiori
    if (a.mediaVoto !== b.mediaVoto) {
      return b.mediaVoto - a.mediaVoto;
    }

    // 5. Partite giocate
    if (a.partiteGiocate !== b.partiteGiocate) {
      return b.partiteGiocate - a.partiteGiocate;
    }

    return nameA.localeCompare(nameB);
  };

  // Step 0: Portiere (Slot 0 è POR)
  const gkCandidates = unassigned.filter(name => {
    const info = getPlayerInfo(name);
    return info.isGk || isRoleMatchingPrimary(info.primaryRole, 'POR');
  });

  if (gkCandidates.length > 0) {
    gkCandidates.sort((a, b) => comparePlayersForRole(a, b, 'POR'));
    const chosenGk = gkCandidates[0];
    assigned[0] = chosenGk;
    unassigned.splice(unassigned.indexOf(chosenGk), 1);
  } else {
    const secGkCandidates = unassigned.filter(name => {
      const info = getPlayerInfo(name);
      return isRoleMatchingSecondary(info.secondaryRolesStr, 'POR');
    });
    if (secGkCandidates.length > 0) {
      secGkCandidates.sort((a, b) => comparePlayersForRole(a, b, 'POR'));
      const chosenGk = secGkCandidates[0];
      assigned[0] = chosenGk;
      unassigned.splice(unassigned.indexOf(chosenGk), 1);
    }
  }

  // Step 1: Ruoli Definiti Preferiti dai giocatori
  const rolePriorityOrder = ['ATT', 'TS', 'TD', 'ES', 'ED', 'CLS', 'CLD', 'DC', 'MED', 'CC'];

  for (const rCode of rolePriorityOrder) {
    const targetSlotIndices = positions
      .map((p, idx) => ({ idx, role: p.role }))
      .filter(item => item.idx !== 0 && item.role === rCode && assigned[item.idx] === null)
      .map(item => item.idx);

    if (targetSlotIndices.length === 0) continue;

    const candidates = unassigned.filter(name => {
      const info = getPlayerInfo(name);
      return !info.isGuest && isRoleMatchingPrimary(info.primaryRole, rCode, info.piede);
    });

    if (candidates.length === 0) continue;

    candidates.sort((a, b) => comparePlayersForRole(a, b, rCode));

    const numToAssign = Math.min(candidates.length, targetSlotIndices.length);
    for (let i = 0; i < numToAssign; i++) {
      const player = candidates[i];
      const slotIdx = targetSlotIndices[i];
      assigned[slotIdx] = player;
      unassigned.splice(unassigned.indexOf(player), 1);
    }
  }

  // Altri slot primari non catalogati sopra
  for (let idx = 1; idx < positions.length; idx++) {
    if (assigned[idx] !== null) continue;
    const rCode = positions[idx].role;
    const candidates = unassigned.filter(name => {
      const info = getPlayerInfo(name);
      return !info.isGuest && isRoleMatchingPrimary(info.primaryRole, rCode, info.piede);
    });
    if (candidates.length > 0) {
      candidates.sort((a, b) => comparePlayersForRole(a, b, rCode));
      const player = candidates[0];
      assigned[idx] = player;
      unassigned.splice(unassigned.indexOf(player), 1);
    }
  }

  // Step 2: Ruoli Secondari Compatibili con i ruoli lasciati vuoti dal Punto 1
  for (const rCode of rolePriorityOrder) {
    const targetSlotIndices = positions
      .map((p, idx) => ({ idx, role: p.role }))
      .filter(item => item.idx !== 0 && item.role === rCode && assigned[item.idx] === null)
      .map(item => item.idx);

    if (targetSlotIndices.length === 0) continue;

    const secCandidates = unassigned.filter(name => {
      const info = getPlayerInfo(name);
      return isRoleMatchingSecondary(info.secondaryRolesStr, rCode, info.piede);
    });

    if (secCandidates.length === 0) continue;

    secCandidates.sort((a, b) => comparePlayersForRole(a, b, rCode));

    const numToAssign = Math.min(secCandidates.length, targetSlotIndices.length);
    for (let i = 0; i < numToAssign; i++) {
      const player = secCandidates[i];
      const slotIdx = targetSlotIndices[i];
      assigned[slotIdx] = player;
      unassigned.splice(unassigned.indexOf(player), 1);
    }
  }

  for (let idx = 1; idx < positions.length; idx++) {
    if (assigned[idx] !== null) continue;
    const rCode = positions[idx].role;
    const secCandidates = unassigned.filter(name => {
      const info = getPlayerInfo(name);
      return isRoleMatchingSecondary(info.secondaryRolesStr, rCode, info.piede);
    });
    if (secCandidates.length > 0) {
      secCandidates.sort((a, b) => comparePlayersForRole(a, b, rCode));
      const player = secCandidates[0];
      assigned[idx] = player;
      unassigned.splice(unassigned.indexOf(player), 1);
    }
  }

  // Step 4: In caso di Guest o giocatori senza ruoli (o ruoli secondari), abbina in base al Piede alla fascia
  // Se uno ha piede SX ed è rimasto uno slot di fascia sinistra (TS, ES, CLS), assegnalo lì
  // Se uno ha piede DX ed è rimasto uno slot di fascia destra (TD, ED, CLD), assegnalo lì
  const assignByFoot = (targetFoot: 'sinistro' | 'destro', isMatchSlot: (code: string) => boolean) => {
    const candidates = unassigned.filter(name => {
      const info = getPlayerInfo(name);
      return info.foot === targetFoot;
    });

    for (const player of candidates) {
      const emptySlotIdx = positions.findIndex(
        (p, idx) => assigned[idx] === null && isMatchSlot(p.role)
      );
      if (emptySlotIdx !== -1) {
        assigned[emptySlotIdx] = player;
        unassigned.splice(unassigned.indexOf(player), 1);
      }
    }
  };

  assignByFoot('sinistro', isLeftFlankRole);
  assignByFoot('destro', isRightFlankRole);

  // Ambidestri su qualsiasi fascia rimasta
  const ambidextrous = unassigned.filter(name => getPlayerInfo(name).foot === 'ambidestro');
  for (const player of ambidextrous) {
    const emptyFlankIdx = positions.findIndex(
      (p, idx) => assigned[idx] === null && isFlankRole(p.role)
    );
    if (emptyFlankIdx !== -1) {
      assigned[emptyFlankIdx] = player;
      unassigned.splice(unassigned.indexOf(player), 1);
    }
  }

  // Riempi tutti i restanti slot rimasti vuoti (centrali o residui)
  for (let idx = 0; idx < positions.length; idx++) {
    if (assigned[idx] === null && unassigned.length > 0) {
      assigned[idx] = unassigned.shift()!;
    }
  }

  return assigned.map((p, i) => (p !== null && p !== undefined ? p : (unassigned[i] ?? team[i] ?? '')));
};
