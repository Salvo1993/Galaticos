import React from 'react';
import { Player, MatchResult } from '@/types';

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

/**
 * Verifica se il ruolo assegnato in campo coincide con il ruolo primario del giocatore.
 */
export const isRoleMatchingPrimary = (
  primaryRole: string | undefined,
  assignedRoleCode: string | undefined
): boolean => {
  if (!primaryRole || !assignedRoleCode) return false;
  const p = primaryRole.trim().toLowerCase();
  const a = assignedRoleCode.trim().toUpperCase();

  switch (a) {
    case 'POR':
      return p.includes('portier') || p === 'gk' || p === 'por';
    case 'TS':
      return p.includes('terzino sinistro') || p === 'lb' || p === 'ts';
    case 'TD':
      return p.includes('terzino destro') || p === 'rb' || p === 'td';
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
        p === 'dmf' ||
        p === 'med'
      );
    case 'CC':
      return (
        p.includes('centrocampista centrale') ||
        p === 'centrocampista' ||
        p === 'mezzala' ||
        p === 'cmf' ||
        p === 'cc'
      );
    case 'ES':
    case 'CLS':
      return (
        p.includes('esterno sinistro') ||
        p.includes('ala sinistra') ||
        (p.includes('ala') && !p.includes('destra')) ||
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
        (p.includes('ala') && !p.includes('sinistra')) ||
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
        p === 'cf' ||
        p === 'ss' ||
        p === 'att'
      );
    default:
      return p === a.toLowerCase();
  }
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
