'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Sun, Moon, RotateCcw, Copy, Plus, X, Pencil, Trophy, ChevronDown, Calendar, ArrowLeftRight, Trash2, Medal, Download } from 'lucide-react';

// --- Types ---
interface Player {
  Nome: string;
  Ruolo?: string;
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
}

interface Cluster {
  id: number;
  name: string;
  members: string[];
}

interface Results {
  teamA: string[];
  teamB: string[];
}

interface MatchResult {
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
  voti_giocatori?: Record<string, number>;
}

// --- Custom Components ---
interface CustomDropdownProps {
  value: string;
  options: Player[];
  onChange: (name: string) => void;
  placeholder: string;
  loading: boolean;
  index: number;
}

function CustomDropdown({ value, options, onChange, placeholder, loading, index }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter(opt => opt.Nome.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <div 
        className={`dropdown-trigger ${isOpen ? 'open' : ''} ${loading ? 'loading' : ''}`}
        onClick={() => !loading && setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
      >
        <span className="player-number">{index + 1}</span>
        <span className={`selected-value ${!value ? 'placeholder' : ''}`}>
          {value || placeholder}
        </span>
        <ChevronDown size={18} className={`chevron ${isOpen ? 'rotated' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="dropdown-panel">
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, background: 'var(--color-surface-2)', zIndex: 2 }}>
             <input
               type="text"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               placeholder="Cerca giocatore..."
               style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', fontSize: '0.85rem' }}
               autoFocus
               onClick={(e) => e.stopPropagation()}
             />
          </div>
          <div className="dropdown-options">
            {filteredOptions.map((opt) => (
              <div 
                key={opt.Nome}
                className={`dropdown-option ${opt.Nome === value ? 'selected' : ''}`}
                onClick={() => { onChange(opt.Nome); setIsOpen(false); }}
              >
                {opt.Nome}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className="dropdown-no-options">Nessun giocatore trovato</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- PES Morale Component (Arrows & Energy) ---
const PesMorale = ({ condition }: { condition: 'excellent' | 'good' | 'normal' | 'poor' | 'terrible' | 'neutral' }) => {
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

const getPlayerStats = (player: Player | undefined, fallbackName: string) => {
    if (!player && !fallbackName) return { velocita: 50, accelerazione: 50, tecnica: 50, contrasto: 50, passaggi: 50, finalizzazione: 50, resistenza: 50, dribbling: 50, rissa: 50, altezza: 180, peso: 75, piede: 'Destro' };
    
    let hash = 0;
    const name = player?.Nome || fallbackName;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash);
    const rnd = (min: number, max: number, offset: number) => Math.floor(min + ((seed + offset) % (max - min + 1)));

    // Se c'è la dicitura MANUALE, prende i valori direttamente dal DB (anche se sono vuoti)
    if (player?.origine_punteggi === 'MANUALE') {
        return {
            velocita: player.velocita ?? 0,
            accelerazione: player.accelerazione ?? 0,
            tecnica: player.tecnica ?? 0,
            contrasto: player.contrasto ?? 0,
            passaggi: player.passaggi ?? 0,
            finalizzazione: player.finalizzazione ?? 0,
            resistenza: player.resistenza ?? 0,
            dribbling: player.dribbling ?? 0,
            rissa: player.rissa ?? 0,
            altezza: player.altezza ?? 0,
            peso: player.peso ?? 0,
            piede: player.piede ?? 'ND'
        };
    }

    // Se c'è la dicitura PARZIALE, prende i valori dal DB se presenti, altrimenti li genera casualmente
    if (player?.origine_punteggi?.toUpperCase() === 'PARZIALE') {
        return {
            velocita: player.velocita ?? rnd(65, 95, 1),
            accelerazione: player.accelerazione ?? rnd(65, 95, 2),
            tecnica: player.tecnica ?? rnd(65, 95, 3),
            contrasto: player.contrasto ?? rnd(50, 95, 4),
            passaggi: player.passaggi ?? rnd(65, 95, 5),
            finalizzazione: player.finalizzazione ?? rnd(55, 95, 6),
            resistenza: player.resistenza ?? rnd(60, 99, 9),
            dribbling: player.dribbling ?? rnd(65, 95, 10),
            rissa: player.rissa ?? rnd(30, 100, 11),
            altezza: player.altezza ?? rnd(165, 195, 7),
            peso: player.peso ?? rnd(60, 90, 8),
            piede: player.piede ?? (seed % 2 === 0 ? 'Destro' : 'Sinistro')
        };
    }
    
    return {
        velocita: rnd(65, 95, 1),
        accelerazione: rnd(65, 95, 2),
        tecnica: rnd(65, 95, 3),
        contrasto: rnd(50, 95, 4),
        passaggi: rnd(65, 95, 5),
        finalizzazione: rnd(55, 95, 6),
        resistenza: rnd(60, 99, 9),
        dribbling: rnd(65, 95, 10),
        rissa: rnd(30, 100, 11),
        altezza: rnd(165, 195, 7),
        peso: rnd(60, 90, 8),
        piede: seed % 2 === 0 ? 'Destro' : 'Sinistro'
    };
};

const getRoleAbbreviation = (ruolo: string | undefined) => {
    if (!ruolo) return '';
    const r = ruolo.toUpperCase();
    if (r.includes('PORTIERE')) return 'GK';
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

export default function Home() {
  const [dbPlayers, setDbPlayers] = useState<Player[]>([]);
  const [dbCampi, setDbCampi] = useState<{id: number, nome: string, posizione_url: string | null}[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(Array(10).fill(''));
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isClustersExpanded, setIsClustersExpanded] = useState(false);
  const [results, setResults] = useState<Results | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [teamAName, setTeamAName] = useState('Falchi 🦅');
  const [teamBName, setTeamBName] = useState('Aquile 🦆');
  const [matchLabel, setMatchLabel] = useState('Venerdì 19 giugno - Ore 21');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlayerOldName, setEditingPlayerOldName] = useState('');
  const [editingPlayerName, setEditingPlayerName] = useState('');
  const [editingPlayerStats, setEditingPlayerStats] = useState<Partial<Player>>({});
  const [editingPlayerImage, setEditingPlayerImage] = useState<File | null>(null);
  const [newPlayerStats, setNewPlayerStats] = useState<Partial<Player>>({});
  const [newPlayerImage, setNewPlayerImage] = useState<File | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAddCampoModalOpen, setIsAddCampoModalOpen] = useState(false);
  const [campoModalMode, setCampoModalMode] = useState<'add'|'manage'>('add');
  const [selectedCampoIdToManage, setSelectedCampoIdToManage] = useState<number | null>(null);
  const [newCampoName, setNewCampoName] = useState('');
  const [newCampoUrl, setNewCampoUrl] = useState('');
  const [campoPassword, setCampoPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToDelete, setSelectedToDelete] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);
  const [editingStadiumId, setEditingStadiumId] = useState<number | null>(null);
  const [stadiumInput, setStadiumInput] = useState('');
  const [lightShirtTeamByMatch, setLightShirtTeamByMatch] = useState<Record<number, 'A' | 'B'>>({});
  const [selectedPlayerForCard, setSelectedPlayerForCard] = useState<string | null>(null);
  
  // Swap state
  const [activeSwapSource, setActiveSwapSource] = useState<{name: string, team: 'teamA' | 'teamB'} | null>(null);

  // Update Result state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [updatingMatchId, setUpdatingMatchId] = useState<number | null>(null);
  const [updateScoreA, setUpdateScoreA] = useState('');
  const [updateScoreB, setUpdateScoreB] = useState('');
  const [updateScorersA, setUpdateScorersA] = useState<Record<string, number>>({});
  const [updateScorersB, setUpdateScorersB] = useState<Record<string, number>>({});
  const [updateVoti, setUpdateVoti] = useState<Record<string, number>>({});
  const [touchedVoti, setTouchedVoti] = useState<Set<string>>(new Set());
  const [updatePassword, setUpdatePassword] = useState('');

  useEffect(() => {
    if (isUpdateModalOpen && updatingMatchId) {
      const m = matches.find(x => x.id === updatingMatchId);
      if (m) {
        const [sA, sB] = (m.risultato || '0-0').split('-').map(s => s.trim());
        const originalSA = sA || '0';
        const originalSB = sB || '0';
        const isScoreChanged = updateScoreA !== originalSA || updateScoreB !== originalSB;

        if (!m.voti_giocatori || Object.keys(m.voti_giocatori).length === 0 || isScoreChanged || m.risultato === '0-0') {
          const scoreA = parseInt(updateScoreA) || 0;
          const scoreB = parseInt(updateScoreB) || 0;
          let defA = 6, defB = 6;
          if (scoreA > scoreB) { defA = 7; defB = 5; }
          else if (scoreB > scoreA) { defA = 5; defB = 7; }
          
          setUpdateVoti(prev => {
            const next = { ...prev };
            m.team_a_players?.forEach((p: string) => {
              if (!touchedVoti.has(p)) next[p] = defA;
            });
            m.team_b_players?.forEach((p: string) => {
              if (!touchedVoti.has(p)) next[p] = defB;
            });
            return next;
          });
        }
      }
    }
  }, [updateScoreA, updateScoreB, isUpdateModalOpen, updatingMatchId, matches, touchedVoti]);

  // Save Formation state
  const [isSaveFormationModalOpen, setIsSaveFormationModalOpen] = useState(false);
  const [saveFormationPassword, setSaveFormationPassword] = useState('');
  const [selectedStadium, setSelectedStadium] = useState('Campi Sole');

  // Classifica state
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getRoleAbbr = (r: string | undefined) => {
    if (!r) return '-';
    switch(r) {
      case 'Centrocampista Centrale': return 'CC';
      case 'Centrocampista': return 'CC';
      case 'Difensore Centrale': return 'DC';
      case 'Difensore': return 'DC';
      case 'Attaccante': return 'ATT';
      case 'Portiere': return 'POR';
      case 'Ala Sinistra': return 'AS';
      case 'Ala Destra': return 'AD';
      case 'Ala': return 'Ala';
      default: return r;
    }
  };

  const sortedLeaderboard = useMemo(() => {
    let sortableItems = [...leaderboard];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (sortConfig.key === 'ruolo') {
           const roleA = dbPlayers.find(p => p.Nome === a.nome)?.Ruolo;
           const roleB = dbPlayers.find(p => p.Nome === b.nome)?.Ruolo;
           valA = getRoleAbbr(roleA);
           valB = getRoleAbbr(roleB);
        } else if (sortConfig.key !== 'nome') {
           // Forza a numero per evitare che "10" sia minore di "2"
           valA = Number(valA) || 0;
           valB = Number(valB) || 0;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [leaderboard, sortConfig, dbPlayers]);

  const parseScorers = (scorersInput: any) => {
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
    scorersStr.split(',').forEach(s => {
      const trimmed = s.trim();
      if (!trimmed) return;
      const match = trimmed.match(/^(.*?)(?:\s*\((\d+)\))?$/);
      if (match) {
        const name = match[1].trim();
        const count = match[2] ? parseInt(match[2], 10) : 1;
        map[name] = (map[name] || 0) + count;
      }
    });
    return map;
  };

  const stringifyScorers = (map: Record<string, number>) => {
    return Object.entries(map)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => count > 1 ? `${name} (${count})` : name)
      .join(', ');
  };

  const weeklyData = useMemo(() => {
    const validMatches = matches.filter(m => {
      const mDate = new Date(m.data);
      const isInterruptedMatch = mDate.getDate() === 8 && mDate.getMonth() === 6 && mDate.getFullYear() === 2026 && m.ora && m.ora.startsWith('21');
      return !isInterruptedMatch && m.risultato && m.risultato !== '0-0';
    });
    if (validMatches.length === 0) return null;
    const lastMatch = validMatches[0];

    const [scoreA, scoreB] = (lastMatch.risultato || '0-0').split('-').map(s => parseInt(s.trim(), 10) || 0);
    const isDraw = scoreA === scoreB;
    const isWinnerA = scoreA > scoreB;

    const teamAPlayers = lastMatch.team_a_players || [];
    const teamBPlayers = lastMatch.team_b_players || [];

    const voti = lastMatch.voti_giocatori || {};

    const seed = lastMatch.id || 1;

    // Stable seeded pseudo-random selection
    const selectRandomSeeded = (players: string[], count: number, s: number): string[] => {
      const list = [...players];
      const selected: string[] = [];
      let currentSeed = s;
      for (let i = 0; i < count; i++) {
        if (list.length === 0) break;
        const x = Math.sin(currentSeed++) * 10000;
        const r = x - Math.floor(x);
        const index = Math.floor(r * list.length);
        selected.push(list.splice(index, 1)[0]);
      }
      return selected;
    };

    // Helper to select N players from a team based on votes (highest or lowest)
    const selectByVote = (team: string[], votiObj: Record<string, number>, count: number, highest: boolean, baseSeed: number): string[] => {
      const playersWithVotes = team.map(p => ({
        name: p,
        vote: votiObj[p] !== undefined ? votiObj[p] : 6 // Default 6 if missing
      }));

      // Group players by votes
      const groups: Record<number, string[]> = {};
      playersWithVotes.forEach(p => {
        if (!groups[p.vote]) groups[p.vote] = [];
        groups[p.vote].push(p.name);
      });

      // Get sorted unique vote counts
      const uniqueVotes = Object.keys(groups).map(Number).sort((a, b) => highest ? b - a : a - b);

      const selected: string[] = [];
      let needed = count;
      let currentSeed = baseSeed;

      for (const v of uniqueVotes) {
        if (needed <= 0) break;
        const group = groups[v];
        if (group.length <= needed) {
          selected.push(...group);
          needed -= group.length;
        } else {
          // Need to choose 'needed' players from 'group' randomly (seeded)
          const chosen = selectRandomSeeded(group, needed, currentSeed);
          selected.push(...chosen);
          needed = 0;
        }
      }
      return selected;
    };

    let affinity: string[] = [];
    let breakup: string[] = [];

    if (isDraw) {
      // Draw:
      // Affinità: 1 highest from A, 1 highest from B
      const affA = selectByVote(teamAPlayers, voti, 1, true, seed + 100);
      const affB = selectByVote(teamBPlayers, voti, 1, true, seed + 200);
      affinity = [...affA, ...affB];
      
      // Meglio chiuderla qui: 1 lowest from A, 1 lowest from B
      const brkA = selectByVote(teamAPlayers, voti, 1, false, seed + 300);
      const brkB = selectByVote(teamBPlayers, voti, 1, false, seed + 400);
      breakup = [...brkA, ...brkB];
    } else {
      // Winner / Loser exists
      const winTeam = isWinnerA ? teamAPlayers : teamBPlayers;
      const loseTeam = isWinnerA ? teamBPlayers : teamAPlayers;

      // Affinità della settimana: 2 from winning team (highest votes)
      affinity = selectByVote(winTeam, voti, 2, true, seed + 500);

      // Meglio chiuderla qui: 2 from losing team (lowest votes)
      breakup = selectByVote(loseTeam, voti, 2, false, seed + 600);
    }

    return { affinity, breakup, isDraw };
  }, [matches]);

  const handleUpdateGoal = (team: 'A' | 'B', player: string, delta: number) => {
    if (team === 'A') {
      setUpdateScorersA(prev => {
        const val = Math.max(0, (prev[player] || 0) + delta);
        const next = { ...prev };
        if (val === 0) delete next[player]; else next[player] = val;
        return next;
      });
    } else {
      setUpdateScorersB(prev => {
        const val = Math.max(0, (prev[player] || 0) + delta);
        const next = { ...prev };
        if (val === 0) delete next[player]; else next[player] = val;
        return next;
      });
    }
  };

  const handleUpdateVoteModal = (player: string, delta: number) => {
    setTouchedVoti(prev => new Set(prev).add(player));
    setUpdateVoti(prev => {
      const current = prev[player] !== undefined ? prev[player] : 6;
      return { ...prev, [player]: current + delta };
    });
  };

  const updatingMatch = matches.find(m => m.id === updatingMatchId);

  const toggleShirtAssignment = (matchId: number) => {
    setLightShirtTeamByMatch(prev => ({
      ...prev,
      [matchId]: (prev[matchId] ?? 'A') === 'A' ? 'B' : 'A'
    }));
  };

  const resultsRef = useRef<HTMLDivElement>(null);
  const pitchesRef = useRef<HTMLDivElement>(null);

  // Clean up selection on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if (activeSwapSource) {
            setActiveSwapSource(null);
        }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeSwapSource]);

  // --- Data Fetch ---
  const fetchPlayers = async () => {
    try {
      const res = await fetch('/api/giocatori');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDbPlayers(data);
    } catch (err) {
      console.error(err);
      setError('Impossibile caricare i giocatori');
    }
  };

  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const res = await fetch('/api/classifica?recalculate=true', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [playersRes, sessionRes, settingsRes, matchesRes, leaderboardRes, campiRes] = await Promise.all([
          fetch('/api/giocatori'),
          fetch('/api/session'),
          fetch('/api/settings'),
          fetch('/api/risultati', { cache: 'no-store' }),
          fetch('/api/classifica', { cache: 'no-store' }),
          fetch('/api/campi', { cache: 'no-store' })
        ]);
        
        const playersData = await playersRes.json();
        const sessionData = await sessionRes.json();
        const settingsData = await settingsRes.json();
        const matchesData = await matchesRes.json();
        const leaderboardData = await leaderboardRes.json();
        const campiData = await campiRes.json().catch(() => []);

        if (playersData.error) throw new Error(playersData.error);
        setDbPlayers(playersData);
        setDbCampi(Array.isArray(campiData) ? campiData : []);
        setMatches(Array.isArray(matchesData) ? matchesData : []);
        if (leaderboardData.success && leaderboardData.leaderboard) {
          setLeaderboard(leaderboardData.leaderboard);
        }

        let currentLabel = 'Venerdì 19 giugno - Ore 21';
        if (settingsData && settingsData.match_label) {
          currentLabel = settingsData.match_label;
          setMatchLabel(currentLabel);
        }

        const savedMatch = Array.isArray(matchesData) && matchesData.length > 0 ? matchesData[0] : null;

        if (sessionData) {
          // Validation Guard: Only apply session if it's complete and valid
          const isValidSession = 
            Array.isArray(sessionData.selected_players) && 
            sessionData.selected_players.length === 10 &&
            sessionData.selected_players.every((p: string) => p !== '') &&
            Array.isArray(sessionData.team_a_players) && sessionData.team_a_players.length === 5 &&
            Array.isArray(sessionData.team_b_players) && sessionData.team_b_players.length === 5;

          if (isValidSession) {
            setSelectedPlayers(sessionData.selected_players);
            setClusters(sessionData.clusters || []);
            
            if (savedMatch) {
              setTeamAName(savedMatch.team_a_name || sessionData.team_a_name || 'Falchi 🦅');
              setTeamBName(savedMatch.team_b_name || sessionData.team_b_name || 'Aquile 🦆');
              setResults({
                teamA: savedMatch.team_a_players || [],
                teamB: savedMatch.team_b_players || []
              });
            } else {
              setTeamAName(sessionData.team_a_name || 'Falchi 🦅');
              setTeamBName(sessionData.team_b_name || 'Aquile 🦆');
              setResults({
                teamA: sessionData.team_a_players,
                teamB: sessionData.team_b_players
              });
            }
          }
        }
      } catch (err) {
        console.error('Initialization Error:', err);
        setError('Impossibile caricare i dati dal database');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) {
        showToast("Nome obbligatorio", "error");
        return;
    }
    if (!newPlayerStats.Ruolo?.trim()) {
        showToast("Ruolo obbligatorio", "error");
        return;
    }

    const pwd = window.prompt("Inserisci la password per aggiungere il giocatore:");
    if (pwd !== 'ramborambo') {
        showToast("Password non valida", "error");
        return;
    }

    try {
      const res = await fetch('/api/giocatori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            Nome: newPlayerName.trim(),
            Ruolo: newPlayerStats.Ruolo?.trim(),
            stats: { ...newPlayerStats, Nome: newPlayerName.trim() }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (newPlayerImage) {
        const formData = new FormData();
        formData.append('file', newPlayerImage);
        formData.append('playerName', newPlayerName.trim());
        const uploadRes = await fetch('/api/giocatori/upload-image', {
          method: 'POST',
          body: formData
        });
        if (!uploadRes.ok) throw new Error('Errore caricamento immagine');
      }
      
      showToast('Giocatore aggiunto!', 'success');
      setNewPlayerName('');
      setNewPlayerImage(null);
      setNewPlayerStats({});
      setIsAddModalOpen(false);
      await fetchPlayers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddCampo = async () => {
    if (!newCampoName.trim()) {
        showToast("Nome campo obbligatorio", "error");
        return;
    }
    if (campoPassword !== 'ramborambo') {
        showToast("Password errata", "error");
        return;
    }

    try {
      const payload: any = { 
          nome: newCampoName.trim(),
          posizione_url: newCampoUrl.trim()
      };
      if (campoModalMode === 'manage' && selectedCampoIdToManage) {
          payload.id = selectedCampoIdToManage;
      }

      const res = await fetch('/api/campi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(campoModalMode === 'add' ? 'Campo aggiunto!' : 'Campo aggiornato!', 'success');
      setNewCampoName('');
      setNewCampoUrl('');
      setCampoPassword('');
      setSelectedCampoIdToManage(null);
      setIsAddCampoModalOpen(false);
      
      // Refetch campi
      const campiRes = await fetch('/api/campi', { cache: 'no-store' });
      const campiData = await campiRes.json().catch(() => []);
      setDbCampi(Array.isArray(campiData) ? campiData : []);
      setSelectedStadium(newCampoName.trim());
      
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCampo = async () => {
    if (!selectedCampoIdToManage) return;
    if (campoPassword !== 'ramborambo') {
        showToast("Password errata", "error");
        return;
    }
    if (!confirm("Sei sicuro di voler eliminare questo campo?")) return;

    try {
      const res = await fetch('/api/campi', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCampoIdToManage })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Campo eliminato!', 'success');
      setNewCampoName('');
      setNewCampoUrl('');
      setCampoPassword('');
      setSelectedCampoIdToManage(null);
      setIsAddCampoModalOpen(false);
      
      // Refetch campi
      const campiRes = await fetch('/api/campi', { cache: 'no-store' });
      const campiData = await campiRes.json().catch(() => []);
      setDbCampi(Array.isArray(campiData) ? campiData : []);
      
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleEditPlayerSubmit = async () => {
    if (!editingPlayerName.trim()) {
      showToast('Nome obbligatorio', 'error');
      return;
    }

    const pwd = window.prompt("Inserisci la password per salvare la modifica:");
    if (pwd !== 'ramborambo') {
        showToast("Password non valida", "error");
        return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/giocatori/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldName: editingPlayerOldName, 
          newName: editingPlayerName.trim(), 
          newRole: editingPlayerStats.Ruolo?.trim() || '',
          stats: { ...editingPlayerStats, Nome: editingPlayerName.trim() }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante la modifica');

      if (editingPlayerImage) {
        const formData = new FormData();
        formData.append('file', editingPlayerImage);
        formData.append('playerName', editingPlayerName.trim());
        const uploadRes = await fetch('/api/giocatori/upload-image', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) throw new Error(uploadData.details || 'Errore caricamento immagine');
      }
      
      showToast('Giocatore aggiornato!', 'success');
      setEditingPlayerImage(null);
      setIsEditModalOpen(false);
      
      setSelectedPlayers(prev => prev.map(name => name === editingPlayerOldName ? editingPlayerName.trim() : name));
      
      setClusters(prev => prev.map(c => ({
        ...c,
        members: c.members.map(m => m === editingPlayerOldName ? editingPlayerName.trim() : m)
      })));
      
      await fetchPlayers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlayers = async () => {
    if (selectedToDelete.size === 0) return;
    
    const pwd = window.prompt('Inserisci la password per confermare l\'eliminazione:');
    if (pwd !== 'ramborambo') {
      showToast('Password non valida', 'error');
      return;
    }

    setIsSaving(true);
    try {
        const res = await fetch('/api/giocatori/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ names: Array.from(selectedToDelete) })
        });
        if (!res.ok) throw new Error('Errore nella cancellazione');
        
        // Update UI
        setSelectedPlayers(prev => prev.filter(name => !selectedToDelete.has(name)));
        showToast('Giocatori eliminati!', 'success');
        setSelectedToDelete(new Set());
        setSearchQuery('');
        setIsManageModalOpen(false);
        await fetchPlayers();
    } catch (err: any) {
        showToast(err.message, 'error');
    } finally {
        setIsSaving(false);
    }
  };


  const handleUpdateResult = async () => {
    if (!updatingMatchId) return;
    if (updatePassword !== 'ramborambo') {
      showToast('Password non valida', 'error');
      return;
    }

    const risultato = `${updateScoreA.trim() || '0'}-${updateScoreB.trim() || '0'}`;
    const strScorersA = stringifyScorers(updateScorersA);
    const strScorersB = stringifyScorers(updateScorersB);

    try {
      const res = await fetch('/api/risultati/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updatingMatchId,
          risultato,
          marcatori_a: strScorersA,
          marcatori_b: strScorersB,
          voti_giocatori: updateVoti,
          password: updatePassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante l\'aggiornamento');

      showToast('Risultato aggiornato!', 'success');
      setIsUpdateModalOpen(false);

      // Aggiorna lo stato dei match localmente
      setMatches(prev => prev.map(m => m.id === updatingMatchId ? data.match : m));

      // Usa la classifica già calcolata e restituita dal backend (nessuna seconda fetch)
      if (data.leaderboard && Array.isArray(data.leaderboard)) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err: any) {
      showToast(err.message || 'Errore aggiornamento risultato', 'error');
    }
  };

  const handleDeleteMatch = async () => {
    if (!updatingMatchId) return;
    if (updatePassword !== 'ramborambo') {
      showToast('Password non valida', 'error');
      return;
    }

    if (!confirm('Sei sicuro di voler eliminare questa partita? Questa operazione è irreversibile.')) {
      return;
    }

    try {
      const res = await fetch('/api/risultati/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updatingMatchId,
          password: updatePassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante l\'eliminazione');

      showToast('Partita eliminata!', 'success');
      setIsUpdateModalOpen(false);
      setIsDeleteModalOpen(false);

      // Remove from state
      setMatches(prev => prev.filter(m => m.id !== updatingMatchId));

      // Usa la classifica già calcolata e restituita dal backend (nessuna seconda fetch)
      if (data.leaderboard && Array.isArray(data.leaderboard)) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err: any) {
      showToast(err.message || 'Errore eliminazione partita', 'error');
    }
  };

  // --- Theme Toggle ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // --- Helpers ---
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const hashStringToHue = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
  };

  const formatResultDate = (isoString: string) => {
  const d = new Date(isoString);
  const formatter = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  return formatter.format(d);
};

const getVoteColor = (v?: number) => {
  if (v === undefined || v === null) return '#88929b';
  if (v < 5) return '#e57373';
  if (v < 6) return '#f39c12';
  if (v < 7) return '#88929b';
  if (v < 8) return '#4caf50';
  if (v < 9) return '#00e676';
  return '#00ff00';
};

const formatResultTime = (timeStr?: string) => {
    return timeStr?.split(':').slice(0, 2).join(':') || '';
  };

  const normalizeScorers = (value: any) => {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'string') return value.trim();
    return '';
  };

  const hasScorers = (m: MatchResult) => {
    const a = normalizeScorers(m.marcatori_a);
    const b = normalizeScorers(m.marcatori_b);
    return a !== '' || b !== '';
  };

  const saveSession = async (currentResults: Results) => {
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_players: selectedPlayers,
          clusters,
          team_a_name: teamAName,
          team_b_name: teamBName,
          team_a_players: currentResults.teamA,
          team_b_players: currentResults.teamB
        })
      });
    } catch (err) {
      console.error('Error saving session:', err);
    }
  };

  const saveSettings = async (label: string) => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_label: label })
      });
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const clearState = () => {
    if (confirm('Sei sicuro di voler pulire tutte le selezioni correnti?')) {
      setSelectedPlayers(Array(10).fill(''));
      setClusters([]);
      setResults(null);
      setTeamAName('Falchi 🦅');
      setTeamBName('Aquile 🦆');
      showToast('Stato ripulito', 'info');
    }
  };

  const handleSwap = (playerA: string, teamA: 'teamA' | 'teamB', playerB: string, teamB: 'teamA' | 'teamB') => {
      if (!results) return;

      const newResults = { ...results };
      const listA = [...newResults.teamA];
      const listB = [...newResults.teamB];

      const list1 = teamA === 'teamA' ? listA : listB;
      const list2 = teamB === 'teamA' ? listA : listB;

      const idx1 = list1.indexOf(playerA);
      const idx2 = list2.indexOf(playerB);

      if (idx1 !== -1 && idx2 !== -1) {
          list1[idx1] = playerB;
          list2[idx2] = playerA;

          newResults.teamA = listA;
          newResults.teamB = listB;

          setResults(newResults);
          setActiveSwapSource(null);
      }
  };

  // --- Logic ---
  const getPlayerMorale = (playerName: string): { condition: 'excellent' | 'good' | 'normal' | 'poor' | 'terrible' | 'neutral', title: string } => {
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
    
    if (vote === undefined || vote === null) {
      return { condition: 'neutral', title: 'Senza voto' };
    }
    
    let condition: 'excellent' | 'good' | 'normal' | 'poor' | 'terrible' = 'normal';
    if (vote >= 7.5) { condition = 'excellent'; }
    else if (vote >= 6.5) { condition = 'good'; }
    else if (vote >= 6) { condition = 'normal'; }
    else if (vote >= 5) { condition = 'poor'; }
    else { condition = 'terrible'; }

    return { condition, title: `Ultimo voto: ${vote}` };
  };

  const handlePlayerChange = (index: number, name: string) => {
    const newSelected = [...selectedPlayers];
    newSelected[index] = name;
    setSelectedPlayers(newSelected);
    
    // Cleanup clusters if a player is deselected or changed
    const oldName = selectedPlayers[index];
    if (oldName && oldName !== name) {
        setClusters(prev => prev.map(c => ({
            ...c,
            members: c.members.filter(m => m !== oldName)
        })));
    }
  };

  const addCluster = () => {
    const id = Date.now();
    setClusters([...clusters, { id, name: `Cluster ${String.fromCharCode(65 + clusters.length)}`, members: [] }]);
    setIsClustersExpanded(true);
  };

  const removeCluster = (id: number) => {
    setClusters(clusters.filter(c => c.id !== id));
  };

  const toggleMemberInCluster = (clusterId: number, playerName: string) => {
    setClusters(clusters.map(c => {
      if (c.id === clusterId) {
        const isMember = c.members.includes(playerName);
        return {
          ...c,
          members: isMember ? c.members.filter(m => m !== playerName) : [...c.members, playerName]
        };
      }
      return c;
    }));
  };

  const generateTeams = async () => {
    // Validation
    if (selectedPlayers.some(p => !p)) {
      showToast('Seleziona tutti e 10 i nomi prima di continuare', 'error');
      return;
    }

    for (const cluster of clusters) {
      if (cluster.members.length < 2) {
        showToast('Ogni cluster deve avere almeno 2 giocatori', 'error');
        return;
      }
      if (cluster.members.length > 5) {
        showToast('Impossibile rispettare tutti i vincoli. Riduci la dimensione dei cluster.', 'error');
        return;
      }
    }

    // 1. Pre-assegnazione bilanciata per cluster
    const assignments = new Map<string, 'teamA' | 'teamB'>();
    
    for (const cluster of clusters) {
        const members = [...cluster.members].sort(() => Math.random() - 0.5);
        const mid = Math.floor(members.length / 2);
        
        // Randomly assign the larger group to either A or B
        const [groupA, groupB] = Math.random() > 0.5 
            ? [members.slice(0, mid), members.slice(mid)]
            : [members.slice(mid), members.slice(0, mid)];

        groupA.forEach(p => assignments.set(p, 'teamA'));
        groupB.forEach(p => assignments.set(p, 'teamB'));
    }

    // 2. Assegnazione finale
    const shuffled = [...selectedPlayers].sort(() => Math.random() - 0.5);
    const teamA: string[] = [];
    const teamB: string[] = [];

    try {
      for (const player of shuffled) {
        const assignedTeam = assignments.get(player);
        
        if (assignedTeam) {
            if (assignedTeam === 'teamA' && teamA.length < 5) teamA.push(player);
            else if (assignedTeam === 'teamB' && teamB.length < 5) teamB.push(player);
            else throw new Error('Impossibile rispettare tutti i vincoli. Riduci la dimensione dei cluster.');
        } else {
            // Normal assignment
            if (teamA.length <= teamB.length && teamA.length < 5) teamA.push(player);
            else if (teamB.length < 5) teamB.push(player);
            else throw new Error('Impossibile completare le squadre');
        }
      }

      if (teamA.length !== 5 || teamB.length !== 5) throw new Error('Errore nella generazione');

      const newResults = { teamA, teamB };
      setResults(newResults);
      await saveSession(newResults);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const copyResults = () => {
    if (!results) return;
    
    const e_soccer = String.fromCodePoint(0x26BD);
    const e_dash = String.fromCodePoint(0x2014);
    const e_ord = String.fromCodePoint(0x00AA);
    const e_cal = String.fromCodePoint(0x1F5D3, 0xFE0F);
    const e_clock = String.fromCodePoint(0x23F0);
    const e_stadium = String.fromCodePoint(0x1F3DF, 0xFE0F);
    const e_pin = String.fromCodePoint(0x1F4CD);
    const e_white = String.fromCodePoint(0x26AA);
    const e_black = String.fromCodePoint(0x26AB);

    const latestMatch = matches.length > 0 ? matches[0] : null;
    let matchHeader = `${e_soccer} GALATICOS ${e_dash} Squadre del ${new Date().toLocaleDateString('it-IT')}\n\n`;
    
    if (latestMatch) {
       const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
       const formattedDate = new Date(latestMatch.data).toLocaleDateString('it-IT', dateOptions);
       matchHeader = `${e_soccer} GALATICOS ${e_dash} ${matches.length}${e_ord} Giornata\n${e_cal} *${formattedDate}* - ${e_clock} *${latestMatch.ora}*\n`;
       if (latestMatch.Stadium) {
           matchHeader += `${e_stadium} Stadio: *${latestMatch.Stadium}*\n`;
           const matchCampo = dbCampi.find(c => c.nome === latestMatch.Stadium);
           if (matchCampo && matchCampo.posizione_url) {
               matchHeader += `${e_pin} Posizione: ${matchCampo.posizione_url}\n`;
           }
       }
       matchHeader += `\n`;
    }

    const isSameAsLatest = latestMatch && latestMatch.team_a_name === teamAName && latestMatch.team_b_name === teamBName;
    const currentLightTeam = isSameAsLatest ? (lightShirtTeamByMatch[latestMatch.id] ?? 'A') : 'A';
    
    const getShirtInfo = (team: 'A'|'B') => currentLightTeam === team ? `${e_white} *Maglie Chiare*` : `${e_black} *Maglie Scure*`;

    const text = `${matchHeader}` +
                 `*${teamAName.toUpperCase()}*\n` +
                 `${getShirtInfo('A')}\n` +
                 results.teamA.map((n, i) => `${i + 1}. ${n}`).join('\n') +
                 `\n\n*${teamBName.toUpperCase()}*\n` +
                 `${getShirtInfo('B')}\n` +
                 results.teamB.map((n, i) => `${i + 1}. ${n}`).join('\n') +
                 `\n\nMaggiori informazioni disponibili su https://galaticos-eta.vercel.app/`;

    navigator.clipboard.writeText(text).then(() => showToast('Risultato copiato!', 'success'));
  };

  const saveFormation = async () => {
    if (!results) return;
    if (saveFormationPassword !== 'ramborambo') {
      showToast('Password non valida', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/salva-formazione', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_a_name: teamAName, team_b_name: teamBName, teamAPlayers: results.teamA, teamBPlayers: results.teamB, stadium: selectedStadium })
      });
      if (!res.ok) throw new Error('Errore nel salvataggio');
      showToast('Formazione salvata!', 'success');
      setIsSaveFormationModalOpen(false);
      setSaveFormationPassword('');

      // Ricarica l'archivio partite per riflettere subito il nuovo salvataggio
      try {
        const matchesRes = await fetch('/api/risultati', { cache: 'no-store' });
        const matchesData = await matchesRes.json();
        setMatches(Array.isArray(matchesData) ? matchesData : []);
      } catch (refreshErr) {
        console.error('Errore nel refresh archivio partite:', refreshErr);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStadium = async (m: MatchResult, overrideVal?: string) => {
    try {
      const finalStadium = overrideVal !== undefined ? overrideVal : stadiumInput;
      const res = await fetch('/api/risultati/stadium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: m.data, ora: m.ora, stadium: finalStadium })
      });

      const payload = await res.json();

      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Errore salvataggio stadio');
      }

      setMatches(prev =>
        prev.map(match =>
          match.id === m.id ? { ...match, Stadium: payload.match.Stadium } : match
        )
      );

      setEditingStadiumId(null);
      showToast(payload.message || 'Stadio aggiornato!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Errore salvataggio stadio', 'error');
    }
  };

  const updatePlayerVote = async (matchId: number, playerName: string, delta: number) => {
    // Basic password protection logic for UI interactions
    const pass = window.prompt("Inserisci password per modificare i voti:");
    if (pass !== 'ramborambo') {
       showToast("Password errata", "error");
       return;
    }
    
    try {
      const res = await fetch('/api/risultati/voti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, playerName, delta, password: pass })
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.error || 'Errore');
      
      setMatches(prev => prev.map(m => m.id === matchId ? payload.match : m));
      setLeaderboard(payload.leaderboard);
      showToast('Voto aggiornato', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // --- Dynamic Options ---
  const getAvailableOptions = (currentIndex: number) => {
    const otherSelected = selectedPlayers.filter((p, i) => i !== currentIndex && p !== '');
    return dbPlayers.filter(p => !otherSelected.includes(p.Nome));
  };

  const downloadFormationImage = async () => {
    if (!pitchesRef.current) return;
    try {
      const htmlToImage = await import('html-to-image');
      setLoading(true);

      // 1) Nascondi le liste e header per non averle nel layout e rimuovere lo spazio
      const elementsToHide = pitchesRef.current.querySelectorAll('.team-header, .team-list');
      const cards = pitchesRef.current.querySelectorAll('.team-card');
      
      elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');
      
      // 2) Togli le transizioni e l'overflow hidden che causavano il "taglio" del campo
      cards.forEach(c => {
         const el = c as HTMLElement;
         el.style.transition = 'none';
         el.style.overflow = 'visible';
         el.style.paddingBottom = '1.5rem';
      });

      // Lascia al browser il tempo di ricalcolare l'altezza senza le animazioni
      await new Promise(resolve => setTimeout(resolve, 150));

      const dataUrl = await htmlToImage.toJpeg(pitchesRef.current, {
        quality: 0.95,
        backgroundColor: '#0a1017',
        pixelRatio: 2
      });

      // 3) Ripristina il layout originale
      elementsToHide.forEach(el => (el as HTMLElement).style.display = '');
      cards.forEach(c => {
         const el = c as HTMLElement;
         el.style.transition = '';
         el.style.overflow = '';
         el.style.paddingBottom = '';
      });

      const link = document.createElement('a');
      link.download = `formazioni_${new Date().toISOString().split('T')[0]}.jpg`;
      link.href = dataUrl;
      link.click();
      showToast('Immagine scaricata con successo', 'success');
    } catch (e) {
      console.error(e);
      showToast("Errore durante il download dell'immagine.", 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  return (
    <div className="container">
      <header style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', border: '2px solid rgba(107, 155, 198, 0.6)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.8)', background: '#0a0e14' }}>
          <img 
            src="/players/header.jpg" 
            alt="Post Evolution Soccer" 
            style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '350px' }} 
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src.endsWith('.jpg')) {
                target.src = '/players/header.png';
              } else {
                target.style.display = 'none';
                target.parentElement!.style.display = 'none';
              }
            }}
          />
        </div>
        <div className="header-top" style={{ padding: '0 10px' }}>
          <div className="logo-section">
            <div className="match-info">
              <Calendar size={14} className="calendar-icon" />
              <input 
                type="text" 
                className="match-label-input"
                value={matchLabel}
                onChange={(e) => setMatchLabel(e.target.value)}
                onBlur={() => saveSettings(matchLabel)}
                placeholder="Data e ora partita..."
                spellCheck={false}
              />
            </div>
          </div>
          <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {error && <div className="toast visible error" style={{position:'static', transform:'none', margin:'0 0 2rem 0'}}>{error}</div>}

      <section>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--space-4)'}}>
            <h2>👥 Giocatori</h2>
            <div style={{display:'flex', gap:'var(--space-2)'}}>
                <button className="secondary-btn" onClick={() => setIsManageModalOpen(true)}>
                    Gestisci
                </button>
                <button className="secondary-btn" onClick={() => setIsAddModalOpen(true)}>
                    <Plus size={16}/> Aggiungi
                </button>
            </div>
        </div>
        <div className="players-grid">
          {selectedPlayers.map((val, i) => (
            <CustomDropdown
              key={i}
              index={i}
              value={val}
              options={getAvailableOptions(i)}
              onChange={(name) => handlePlayerChange(i, name)}
              placeholder="Seleziona..."
              loading={loading}
            />
          ))}
        </div>
      </section>

      {isManageModalOpen && (
          <div className="modal-overlay" onClick={() => setIsManageModalOpen(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                      <h3 style={{margin:0}}>Gestisci Giocatori</h3>
                      <button className="secondary-btn" style={{padding:'0.2rem', display:'flex'}} onClick={() => setIsManageModalOpen(false)}><X size={20} /></button>
                  </div>
                  <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cerca nome..."
                    className="modal-input"
                  />
                  <div className="players-list-scroll" style={{maxHeight:'300px', overflowY:'auto', margin:'1rem 0', border:'1px solid var(--color-border)', borderRadius:'var(--radius-md)'}}>
                    {dbPlayers
                        .filter(p => p.Nome.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(p => (
                            <div 
                                key={p.Nome} 
                                className={`player-row-select ${selectedToDelete.has(p.Nome) ? 'selected' : ''}`}
                                style={{
                                    padding:'0.8rem', borderBottom:'1px solid var(--color-border)',
                                    background: selectedToDelete.has(p.Nome) ? 'rgba(255, 68, 68, 0.15)' : 'transparent',
                                    color: selectedToDelete.has(p.Nome) ? '#ff4444' : 'var(--color-text)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span>{p.Nome}</span>
                                    {p.Ruolo && <span style={{ fontSize: '0.75rem', color: '#6f9c81' }}>{p.Ruolo}</span>}
                                </div>
                                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                    <span 
                                        role="button" 
                                        aria-label="edit" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingPlayerOldName(p.Nome);
                                            setEditingPlayerName(p.Nome);
                                            setEditingPlayerStats({ ...p });
                                            setIsEditModalOpen(true);
                                        }}
                                        style={{ color: 'var(--color-text)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                    >
                                        <Pencil size={16} />
                                    </span>
                                    <span 
                                        role="button" 
                                        aria-label="remove" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const next = new Set(selectedToDelete);
                                            if (next.has(p.Nome)) next.delete(p.Nome);
                                            else next.add(p.Nome);
                                            setSelectedToDelete(next);
                                        }}
                                        style={{ 
                                            color: selectedToDelete.has(p.Nome) ? '#ff4444' : 'var(--color-text)', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            cursor: 'pointer',
                                            opacity: selectedToDelete.has(p.Nome) ? 1 : 0.6
                                        }}
                                    >
                                        <X size={18} />
                                    </span>
                                </div>
                            </div>
                    ))}
                  </div>
                  <div style={{display:'flex', gap:'var(--space-2)', marginTop:'var(--space-4)'}}>
                      <button className="secondary-btn" onClick={() => setIsManageModalOpen(false)}>Annulla</button>
                      <button 
                        className="create-teams-btn" 
                        onClick={handleDeletePlayers}
                        disabled={isSaving || selectedToDelete.size === 0}
                      >
                          {isSaving ? 'Salvataggio...' : 'Salva cambiamenti'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isEditModalOpen && (() => {
          const uniqueRoles = Array.from(new Set(dbPlayers.map(p => p.Ruolo).filter(Boolean)));
          const statFields = ['velocita', 'accelerazione', 'tecnica', 'contrasto', 'passaggi', 'finalizzazione', 'resistenza', 'dribbling', 'rissa', 'altezza', 'peso', 'Score'] as const;
          const textFields = ['Skill', 'piede'] as const;

          return (
          <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
              <div className="modal-content" style={{maxWidth: '600px', width: '95%', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                      <h3 style={{margin:0}}>Modifica Giocatore</h3>
                      <button className="secondary-btn" style={{padding:'0.2rem', display:'flex'}} onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
                  </div>
                  
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                        <div>
                        <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'block' }}>Nome</label>
                        <input 
                            autoFocus
                            type="text" 
                            className="modal-input"
                            value={editingPlayerName} 
                            onChange={(e) => setEditingPlayerName(e.target.value)}
                            placeholder="Nuovo nome..."
                        />
                        </div>
                        <div>
                        <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'block' }}>Ruolo</label>
                        <select 
                            value={editingPlayerStats.Ruolo || ''} 
                            onChange={(e) => setEditingPlayerStats(prev => ({...prev, Ruolo: e.target.value}))}
                            className="modal-input" style={{ width: '100%', appearance: 'auto' }}
                        >
                            <option value="">Nessuno</option>
                            {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        </div>
                    </div>

                    <h4 style={{marginTop: '1rem', color: '#6f9c81', borderBottom: '1px solid #23342b', paddingBottom: '0.5rem', margin:0}}>Statistiche Fisiche e Tecniche</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                        {statFields.map(f => (
                           <div key={f}>
                             <label style={{textTransform:'capitalize', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'block'}}>{f}</label>
                             <input 
                               type="number" 
                               className="modal-input"
                               value={editingPlayerStats[f as keyof Player]?.toString() || ''} 
                               onChange={(e) => setEditingPlayerStats(prev => ({...prev, [f]: e.target.value ? parseInt(e.target.value) : null}))}
                               placeholder="-"
                             />
                           </div> 
                        ))}
                    </div>

                    <div style={{ marginTop: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'block' }}>Figurina / Immagine Profilo</label>
                        <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    setEditingPlayerImage(e.target.files[0]);
                                }
                            }}
                            className="modal-input"
                        />
                    </div>

                    <h4 style={{marginTop: '1rem', color: '#6f9c81', borderBottom: '1px solid #23342b', paddingBottom: '0.5rem', margin:0}}>Altre Informazioni</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                        {textFields.map(f => (
                           <div key={f}>
                             <label style={{textTransform:'capitalize', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'block'}}>{f}</label>
                             <input 
                               type="text" 
                               className="modal-input"
                               value={editingPlayerStats[f as keyof Player]?.toString() || ''} 
                               onChange={(e) => setEditingPlayerStats(prev => ({...prev, [f]: e.target.value}))}
                               placeholder="-"
                             />
                           </div> 
                        ))}
                    </div>

                  </div>
                  
                  <div style={{display:'flex', gap:'var(--space-2)', marginTop:'var(--space-4)'}}>
                      <button className="secondary-btn" onClick={() => setIsEditModalOpen(false)}>Annulla</button>
                      <button className="create-teams-btn" onClick={handleEditPlayerSubmit} disabled={isSaving}>
                        {isSaving ? 'Salvataggio...' : 'Salva'}
                      </button>
                  </div>
              </div>
          </div>
          );
      })()}

      {isAddModalOpen && (() => {
          const uniqueRoles = Array.from(new Set(dbPlayers.map(p => p.Ruolo).filter(Boolean)));
          const statFields = ['velocita', 'accelerazione', 'tecnica', 'contrasto', 'passaggi', 'finalizzazione', 'resistenza', 'dribbling', 'rissa', 'altezza', 'peso', 'Score'] as const;
          const textFields = ['Skill', 'piede'] as const;

          return (
          <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
              <div className="modal-content" style={{maxWidth: '600px', width: '95%', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                      <h3 style={{margin:0}}>Nuovo Giocatore</h3>
                      <button className="secondary-btn" style={{padding:'0.2rem', display:'flex'}} onClick={() => setIsAddModalOpen(false)}><X size={20} /></button>
                  </div>
                  
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                        <div>
                        <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'block' }}>Nome</label>
                        <input 
                            autoFocus
                            type="text" 
                            className="modal-input"
                            value={newPlayerName} 
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            placeholder="Nome..."
                        />
                        </div>
                        <div>
                        <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'block' }}>Ruolo <span style={{color: 'red'}}>*</span></label>
                        <select 
                            value={newPlayerStats.Ruolo || ''} 
                            onChange={(e) => setNewPlayerStats(prev => ({...prev, Ruolo: e.target.value}))}
                            className="modal-input" style={{ width: '100%', appearance: 'auto' }}
                        >
                            <option value="">Nessuno (Obbligatorio)</option>
                            {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        </div>
                    </div>

                    <h4 style={{marginTop: '1rem', color: '#6f9c81', borderBottom: '1px solid #23342b', paddingBottom: '0.5rem', margin:0}}>Statistiche Fisiche e Tecniche</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                        {statFields.map(f => (
                           <div key={f}>
                             <label style={{textTransform:'capitalize', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'block'}}>{f}</label>
                             <input 
                               type="number" 
                               className="modal-input"
                               value={newPlayerStats[f as keyof Player]?.toString() || ''} 
                               onChange={(e) => setNewPlayerStats(prev => ({...prev, [f]: e.target.value ? parseInt(e.target.value) : null}))}
                               placeholder="-"
                             />
                           </div> 
                        ))}
                    </div>

                    <div style={{ marginTop: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'block' }}>Figurina / Immagine Profilo</label>
                        <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    setNewPlayerImage(e.target.files[0]);
                                }
                            }}
                            className="modal-input"
                        />
                    </div>

                    <h4 style={{marginTop: '1rem', color: '#6f9c81', borderBottom: '1px solid #23342b', paddingBottom: '0.5rem', margin:0}}>Altre Informazioni</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                        {textFields.map(f => (
                           <div key={f}>
                             <label style={{textTransform:'capitalize', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'block'}}>{f}</label>
                             <input 
                               type="text" 
                               className="modal-input"
                               value={newPlayerStats[f as keyof Player]?.toString() || ''} 
                               onChange={(e) => setNewPlayerStats(prev => ({...prev, [f]: e.target.value}))}
                               placeholder="-"
                             />
                           </div> 
                        ))}
                    </div>

                  </div>
                  
                  <div style={{display:'flex', gap:'var(--space-2)', marginTop:'var(--space-4)'}}>
                      <button className="secondary-btn" onClick={() => setIsAddModalOpen(false)}>Annulla</button>
                      <button className="create-teams-btn" onClick={handleAddPlayer}>Salva</button>
                  </div>
              </div>
          </div>
          );
      })()}

      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <h2 style={{ margin: 0 }}>⚡ Cluster di Vincolo</h2>
          {clusters.length > 0 && (
            <button 
              className="secondary-btn" 
              onClick={() => setIsClustersExpanded(!isClustersExpanded)}
              style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
            >
              {isClustersExpanded ? 'Comprimi' : 'Espandi'}
            </button>
          )}
        </div>
        <p className="section-subtitle">I giocatori dello stesso cluster saranno divisi in squadre diverse</p>
        
        {(isClustersExpanded || clusters.length === 0) && (
          <>
            <div className="clusters-list">
              {clusters.map(c => (
                <div key={c.id} className="cluster-card">
                  <div className="cluster-header">
                    <input 
                      type="text" 
                      className="cluster-name-input" 
                      value={c.name} 
                      onChange={(e) => setClusters(clusters.map(cl => cl.id === c.id ? {...cl, name: e.target.value} : cl))} 
                    />
                    <button className="remove-cluster-btn" onClick={() => removeCluster(c.id)}><X size={20} /></button>
                  </div>
                  <div className="cluster-players-selection">
                    {selectedPlayers.filter(p => p !== '').map(name => {
                       const isSelected = c.members.includes(name);
                       const isTaken = clusters.some(cl => cl.id !== c.id && cl.members.includes(name));
                       return (
                         <div 
                           key={name} 
                           className={`player-chip ${isSelected ? 'selected' : ''} ${isTaken ? 'disabled' : ''}`}
                           onClick={() => !isTaken && toggleMemberInCluster(c.id, name)}
                         >
                           {name}
                         </div>
                       );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button className="add-cluster-btn" onClick={addCluster}>
              <Plus size={18} /> Aggiungi Cluster
            </button>
          </>
        )}
      </section>

      <div className="actions-main">
        <button className="create-teams-btn" onClick={generateTeams} disabled={loading}>
          ⚽ Crea Squadre
        </button>
        <button className="clear-btn" onClick={clearState} disabled={loading}>
          <Trash2 size={20} /> PULISCI
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', gap: '0.5rem', alignItems: 'center' }}>
        <select 
          value={selectedStadium} 
          onChange={(e) => setSelectedStadium(e.target.value)}
          className="stadium-input"
          style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', fontSize: '0.9rem', width: '200px', outline: 'none', textAlign: 'center' }}
        >
          {dbCampi.map(c => (
            <option key={c.id} value={c.nome}>{c.nome}</option>
          ))}
          {dbCampi.length === 0 && <option value="Campi Sole">Campi Sole</option>}
        </select>
        <button 
          onClick={() => {
            setCampoModalMode('add');
            setNewCampoName('');
            setNewCampoUrl('');
            setCampoPassword('');
            setSelectedCampoIdToManage(null);
            setIsAddCampoModalOpen(true);
          }}
          style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--color-surface-2)', color: 'var(--color-text)', border: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Aggiungi nuovo campo"
        >
          <Plus size={16} />
        </button>
      </div>

      {results && (() => {
        const latestMatch = matches.length > 0 ? matches[0] : null;
        const isSameAsLatest = latestMatch && latestMatch.team_a_name === teamAName && latestMatch.team_b_name === teamBName;
        const currentLightTeam = isSameAsLatest ? (lightShirtTeamByMatch[latestMatch.id] ?? 'A') : 'A';
        
        return (
        <section className="results-section" ref={resultsRef} style={{display:'block'}}>
          <div className="teams-container" ref={pitchesRef}>
            {[ { team: 'A', name: teamAName, setName: setTeamAName, list: results.teamA, cls: 'team-falchi' },
               { team: 'B', name: teamBName, setName: setTeamBName, list: results.teamB, cls: 'team-aquile' }
            ].map(t => (
              <div key={t.team} className={`team-card ${t.cls}`}>
                <label className="team-header" style={{ cursor: 'text', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    className="team-name" 
                    value={t.name} 
                    onChange={(e) => t.setName(e.target.value)} 
                    spellCheck={false} 
                    style={{ flex: 1, cursor: 'text' }}
                  />
                  <Pencil size={16} style={{opacity:0.5, cursor: 'pointer'}} />
                </label>
                <ul className="team-list">
                  {t.list.map(name => {
                    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                    const hue = hashStringToHue(name);
                    
                    const isSwapTarget = activeSwapSource && activeSwapSource.team !== (t.team === 'A' ? 'teamA' : 'teamB');
                    const isSwapSource = activeSwapSource?.name === name;
                    const ruolo = dbPlayers.find(p => p.Nome === name)?.Ruolo;
                    const morale = getPlayerMorale(name);

                    return (
                      <li 
                        key={name} 
                        className={`player-row ${isSwapSource ? 'active-source' : ''} ${isSwapTarget ? 'selectable-target' : ''}`}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0.6rem', borderRadius: '6px',
                            cursor: isSwapTarget ? 'pointer' : 'default',
                            background: isSwapSource ? 'rgba(255,255,255,0.1)' : (isSwapTarget ? 'rgba(255,255,255,0.05)' : 'transparent'),
                            border: isSwapTarget ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                            transition: 'all 0.2s'
                        }}
                        onClick={(e) => {
                            if (isSwapTarget) {
                                e.stopPropagation();
                                handleSwap(activeSwapSource!.name, activeSwapSource!.team, name, t.team === 'A' ? 'teamA' : 'teamB');
                            }
                        }}
                      >
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                            <div className="avatar" style={{background: `hsl(${hue}, 60%, 45%)`}}>{initials}</div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <span className="player-name">{name}</span>
                                    {ruolo && (
                                        <span style={{ 
                                            background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(30,40,50,0.6) 100%)', 
                                            padding: '2px 5px', 
                                            borderRadius: '2px', 
                                            fontSize: '0.6rem', 
                                            fontWeight: 'bold', 
                                            color: '#e0e0e0',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            boxShadow: 'inset 0 0 5px rgba(0,0,0,0.5)'
                                        }}>
                                            {getRoleAbbreviation(ruolo)}
                                        </span>
                                    )}
                                    <span title={morale.title} style={{ display: 'flex' }}>
                                        <PesMorale condition={morale.condition} />
                                    </span>
                                </div>
                                {ruolo && <span style={{ fontSize: '0.75rem', color: '#6f9c81', marginTop: '0.1rem' }}>{ruolo}</span>}
                            </div>
                        </div>
                        <button 
                            className="swap-icon-btn" 
                            onClick={(e) => { e.stopPropagation(); setActiveSwapSource({name, team: t.team === 'A' ? 'teamA' : 'teamB'}); }}
                            style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.4rem', color: isSwapSource ? '#fff' : 'rgba(255,255,255,0.4)' }}
                        >
                            ⇄
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="pes-pitch">
                  <div style={{ position: 'absolute', top: '10px', left: '15px', right: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {t.name}
                    </span>
                    <span className="match-tag" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'default', transform: 'scale(0.9)', transformOrigin: 'right center', color: '#cfe8d8', fontSize: '0.65rem' }}>
                      {t.team === currentLightTeam ? 'MAGLIE CHIARE' : 'MAGLIE SCURE'}
                    </span>
                  </div>
                  <div className="pes-goal-area-top"></div>
                  <div className="pes-goal-area-bottom"></div>
                  {t.list.map((name, idx) => {
                    const isSwapTarget = activeSwapSource && activeSwapSource.team !== (t.team === 'A' ? 'teamA' : 'teamB');
                    const isSwapSource = activeSwapSource?.name === name;
                    const morale = getPlayerMorale(name);
                    
                    // Fixed 1-2-1 layout positions
                    const positions = [
                      { top: '87%', left: '50%' }, // GK
                      { top: '65%', left: '50%' }, // CB
                      { top: '42%', left: '20%' }, // LM
                      { top: '42%', left: '80%' }, // RM
                      { top: '15%', left: '50%' }  // CF
                    ];
                    const pos = positions[idx] || { top: '50%', left: '50%' };

                    return (
                      <div 
                        key={name}
                        className={`pes-player ${isSwapSource ? 'active-source' : ''} ${isSwapTarget ? 'selectable-target' : ''}`}
                        style={{
                          top: pos.top, 
                          left: pos.left,
                          transform: isSwapTarget ? 'translate(-50%, -50%) scale(1.15)' : 'translate(-50%, -50%)',
                          filter: isSwapTarget ? 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' : 'none',
                          opacity: isSwapSource ? 0.6 : 1
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isSwapTarget) {
                            handleSwap(activeSwapSource!.name, activeSwapSource!.team, name, t.team === 'A' ? 'teamA' : 'teamB');
                          } else if (!activeSwapSource) {
                            setSelectedPlayerForCard(name);
                          }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setActiveSwapSource({name, team: t.team === 'A' ? 'teamA' : 'teamB'});
                        }}
                      >
                        <img 
                          src={dbPlayers.find(p => p.Nome === name)?.figurina || `/players/${name}.jpg`}
                          alt={name}
                          style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: t.team === currentLightTeam ? '3px solid #3498db' : '3px solid #e67e22',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.8)',
                              marginBottom: '4px',
                              background: '#1a2a3a'
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src.endsWith('.jpg')) {
                                target.src = `/players/${name}.png`;
                            } else {
                                target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${t.team === currentLightTeam ? '%233498db' : '%23e67e22'}" stroke="white" stroke-width="2"/></svg>`;
                            }
                          }}
                        />
                        <div className="pes-player-name" style={{ fontSize: '0.8rem', padding: '2px 6px' }}>{name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="results-actions">
            <button className="secondary-btn" onClick={generateTeams}><RotateCcw size={18} /> Rimescola</button>
            <button className="secondary-btn" onClick={copyResults}><Copy size={18} /> Copia</button>
            <button className="secondary-btn" onClick={downloadFormationImage}><Download size={18} /> Scarica JPEG</button>
            <button className="create-teams-btn" onClick={() => setIsSaveFormationModalOpen(true)} disabled={isSaving}>
                {isSaving ? 'Salvataggio...' : '💾 Salva Formazione'}
            </button>
          </div>
        </section>
        );
      })()}

      <section className="archive-typography">
        <h2><Trophy size={20} style={{verticalAlign:'-3px', marginRight:'0.4rem', color:'#e8b339'}} />Archivio Partite</h2>
        {matches.length === 0 ? (
          <p className="section-subtitle">Nessuna partita archiviata</p>
        ) : (
          <div className="matches-list">
            {matches.map(m => {
              const isExpanded = expandedMatchId === m.id;
              const isEditing = editingStadiumId === m.id;
              const isLightOnA = (lightShirtTeamByMatch[m.id] ?? 'A') === 'A';
              const scorersA = normalizeScorers(m.marcatori_a);
              const scorersB = normalizeScorers(m.marcatori_b);
              const [scoreA, scoreB] = (m.risultato || '0-0').split('-').map(s => s.trim());

              const mDate = new Date(m.data);
              const isInterruptedMatch = mDate.getDate() === 8 && mDate.getMonth() === 6 && mDate.getFullYear() === 2026 && m.ora && m.ora.startsWith('21');

              return (
                <div key={m.id} className={`match-card ${isExpanded ? 'expanded' : ''}`} style={isInterruptedMatch ? { filter: 'grayscale(1)', opacity: 0.6 } : {}}>
                  <div
                    className="match-summary"
                    onClick={() => setExpandedMatchId(isExpanded ? null : m.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setExpandedMatchId(isExpanded ? null : m.id)}
                  >
                    <div className="match-meta-row">
                      <span className="match-meta" style={{color: 'var(--color-primary)'}}>
                         {m.Stadium || 'Campi Sole'}
                      </span>
                      <span className="match-meta">
                        <Calendar size={13} />
                        {formatResultDate(m.data)}
                      </span>
                      <span className="match-meta match-meta-time">{formatResultTime(m.ora)}</span>
                    </div>
                    {isInterruptedMatch && (
                      <div style={{ textAlign: 'center', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '4px', marginBottom: '4px' }}>
                        Non valida ai fini della classifica
                      </div>
                    )}

                    <div className="match-score-area">
                      <div className="match-team match-team-a">
                        <span className="match-team-name">{m.team_a_name}</span>
                        <span className="match-tag" onClick={(e) => { e.stopPropagation(); toggleShirtAssignment(m.id); }}>
                            {isLightOnA ? 'MAGLIE CHIARE' : 'MAGLIE SCURE'}
                        </span>
                      </div>

                      <div className="match-scoreboard">
                        <span className="score-num">{scoreA}</span>
                        <span className="score-sep">–</span>
                        <span className="score-num">{scoreB}</span>
                      </div>

                      <div className="match-team match-team-b">
                        <span className="match-team-name">{m.team_b_name}</span>
                        <span className="match-tag" onClick={(e) => { e.stopPropagation(); toggleShirtAssignment(m.id); }}>
                            {isLightOnA ? 'MAGLIE SCURE' : 'MAGLIE CHIARE'}
                        </span>
                      </div>
                    </div>

                    <ChevronDown size={18} className={`match-chevron ${isExpanded ? 'rotated' : ''}`} />
                  </div>

                  {isExpanded && (
                    <div className="match-details">
                      {hasScorers(m) && (
                        <div className="scorers-detail">
                          <span className="scorers-label">⚽ Marcatori</span>
                          <div className="scorers-row">
                            <span className="scorers-team">{scorersA || '—'}</span>
                            <span className="scorers-divider" />
                            <span className="scorers-team">{scorersB || '—'}</span>
                          </div>
                        </div>
                      )}
                      <div className="formations-detail">
                        <div className="formation-team">
                          <span className="formation-title">{m.team_a_name}</span>
                          <ul className="formation-players">
                            {m.team_a_players.map(name => {
                              const vote = m.voti_giocatori?.[name];
                              return (
                                <li key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>{name}</span>
                                  {m.risultato && m.risultato !== '0-0' && (() => {
                                    const allVotes = Object.values(m.voti_giocatori || {}).map(v => Number(v) || 0);
                                    const maxV = allVotes.length > 0 ? Math.max(...allVotes) : 0;
                                    const isMvp = vote !== undefined && vote === maxV && maxV > 0;
                                    return (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                        {isMvp && <span title="MVP" style={{ display: 'flex' }}><Medal size={14} style={{ color: '#FFD700' }} /></span>}
                                        <span style={{ fontWeight: 'bold', minWidth: '16px', textAlign: 'center', color: getVoteColor(vote) }}>{vote ?? '-'}</span>
                                      </div>
                                    );
                                  })()}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                        <div className="formation-team formation-team-b">
                          <span className="formation-title">{m.team_b_name}</span>
                          <ul className="formation-players">
                            {m.team_b_players.map(name => {
                              const vote = m.voti_giocatori?.[name];
                              return (
                                <li key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>{name}</span>
                                  {m.risultato && m.risultato !== '0-0' && (() => {
                                    const allVotes = Object.values(m.voti_giocatori || {}).map(v => Number(v) || 0);
                                    const maxV = allVotes.length > 0 ? Math.max(...allVotes) : 0;
                                    const isMvp = vote !== undefined && vote === maxV && maxV > 0;
                                    return (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                        {isMvp && <span title="MVP" style={{ display: 'flex' }}><Medal size={14} style={{ color: '#FFD700' }} /></span>}
                                        <span style={{ fontWeight: 'bold', minWidth: '16px', textAlign: 'center', color: getVoteColor(vote) }}>{vote ?? '-'}</span>
                                      </div>
                                    );
                                  })()}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                      <div className="match-footer" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button
                          type="button"
                          className="swap-shirts-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleShirtAssignment(m.id);
                          }}
                        >
                          <ArrowLeftRight size={14} />
                          <span>Cambio maglie</span>
                        </button>
                        <button
                          type="button"
                          className="swap-shirts-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUpdatingMatchId(m.id);
                            const [sA, sB] = (m.risultato || '0-0').split('-').map(s => s.trim());
                            setUpdateScoreA(sA || '0');
                            setUpdateScoreB(sB || '0');
                            setUpdateScorersA(parseScorers(m.marcatori_a));
                            setUpdateScorersB(parseScorers(m.marcatori_b));
                            setUpdateVoti(m.voti_giocatori || {});
                            setTouchedVoti(new Set());
                            setUpdatePassword('');
                            setIsUpdateModalOpen(true);
                          }}
                        >
                          <Pencil size={14} />
                          <span>Aggiorna Risultato</span>
                        </button>
                        <button
                          type="button"
                          className="swap-shirts-btn"
                          style={{ color: '#ff6b6b', borderColor: 'rgba(255, 107, 107, 0.3)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setUpdatingMatchId(m.id);
                            setUpdatePassword('');
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Elimina Partita</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="weekly-stats-section" style={{ marginTop: '2rem' }}>
        <div className="weekly-stats-grid">
          {/* Box 1: Affinità della settimana */}
          <div className="weekly-stats-card affinity">
            <div className="weekly-stats-card-header">
              <span>Affinità della settimana 🤼🧑🤝🧑</span>
            </div>
            {weeklyData ? (
              <div className="weekly-stats-players">
                {weeklyData.affinity.map(name => {
                  const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                  const hue = hashStringToHue(name);
                  return (
                    <div key={name} className="weekly-stats-player-row">
                      <div className="avatar" style={{ background: `hsl(${hue}, 60%, 45%)` }}>{initials}</div>
                      <span className="weekly-stats-player-name">{name}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="weekly-stats-empty">
                <span>Nessun match recente giocato negli ultimi 7 giorni 📅</span>
              </div>
            )}
          </div>

          {/* Box 2: Meglio chiuderla qui */}
          <div className="weekly-stats-card breakup">
            <div className="weekly-stats-card-header">
              <span>Meglio chiuderla qui 💔😰</span>
            </div>
            {weeklyData ? (
              weeklyData.isDraw ? (
                <div className="weekly-stats-empty">
                  <span>Nessun perdente (partita finita in pareggio) 🤝</span>
                </div>
              ) : (
                <div className="weekly-stats-players">
                  {weeklyData.breakup.map(name => {
                    const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                    const hue = hashStringToHue(name);
                    return (
                      <div key={name} className="weekly-stats-player-row">
                        <div className="avatar" style={{ background: `hsl(${hue}, 60%, 45%)` }}>{initials}</div>
                        <span className="weekly-stats-player-name">{name}</span>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="weekly-stats-empty">
                <span>Nessun match recente giocato negli ultimi 7 giorni 📅</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <h2 style={{ margin: 0 }}><Medal size={20} style={{verticalAlign:'-3px', marginRight:'0.4rem', color:'#e8b339'}} />Classifica</h2>
          <button
            className="secondary-btn"
            onClick={fetchLeaderboard}
            disabled={isLoadingLeaderboard}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}
          >
            <RotateCcw size={14} className={isLoadingLeaderboard ? 'spin' : ''} />
            {isLoadingLeaderboard ? 'Aggiornamento...' : 'Aggiorna Classifica'}
          </button>
        </div>
        <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
          Classifica individuale calcolata sui risultati delle partite in archivio.
        </p>

        {isLoadingLeaderboard ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6f9c81' }}>Caricamento classifica...</div>
        ) : leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6f9c81' }}>Nessun dato disponibile per la classifica.</div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(52, 214, 128, 0.16)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(52, 214, 128, 0.08)', borderBottom: '1px solid rgba(52, 214, 128, 0.16)' }}>
                  <th style={{ padding: '0.8rem', textAlign: 'left', color: '#9fd9b6', fontWeight: 600 }}>Pos</th>
                  <th style={{ padding: '0.8rem', textAlign: 'left', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('nome')}>
                    Nome {sortConfig?.key === 'nome' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('punti_assoluti')}>
                    Punti {sortConfig?.key === 'punti_assoluti' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('partite_giocate')}>
                    Giocate {sortConfig?.key === 'partite_giocate' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('vittorie')}>
                    V {sortConfig?.key === 'vittorie' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('pareggi')}>
                    P {sortConfig?.key === 'pareggi' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('sconfitte')}>
                    S {sortConfig?.key === 'sconfitte' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('media_voto')}>
                    Media Voto {sortConfig?.key === 'media_voto' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('mvp_count')}>
                    MVP 🏅 {sortConfig?.key === 'mvp_count' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('pt_partita')}>
                    Pt/Partita {sortConfig?.key === 'pt_partita' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('gol_fatti')}>
                    Gol {sortConfig?.key === 'gol_fatti' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('ruolo')}>
                    Ruolo {sortConfig?.key === 'ruolo' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedLeaderboard.map((row, index) => {
                  const playerRole = dbPlayers.find(p => p.Nome === row.nome)?.Ruolo;

                  return (
                    <tr key={row.nome} style={{ borderBottom: index < sortedLeaderboard.length - 1 ? '1px solid rgba(52, 214, 128, 0.08)' : 'none', background: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.2)' }}>
                      <td style={{ padding: '0.8rem', textAlign: 'left', color: '#cfe8d8', fontWeight: index < 3 ? 'bold' : 'normal' }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}°`}
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'left', color: '#cfe8d8', fontWeight: 600 }}>{row.nome}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#e8b339', fontWeight: 'bold' }}>
                        {row.punti_assoluti}
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#cfe8d8' }}>{row.partite_giocate}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#81c784' }}>{row.vittorie ?? 0}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#e0e0e0' }}>{row.pareggi ?? 0}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#e57373' }}>{row.sconfitte ?? 0}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#f39c12', fontWeight: 'bold' }}>
                        {row.media_voto && row.media_voto > 0 ? row.media_voto.toFixed(2) : '-'}
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#FFD700', fontWeight: 'bold' }}>
                        {(row.mvp_count || 0) > 0 ? row.mvp_count : '-'}
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#cfe8d8' }}>
                        {typeof row.pt_partita === 'number' ? row.pt_partita.toFixed(2) : parseFloat(row.pt_partita || '0').toFixed(2)}
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#cfe8d8' }}>{row.gol_fatti}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#6f9c81', fontSize: '0.8rem' }}>{getRoleAbbr(playerRole)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboard-card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <h2 style={{ margin: 0 }}><Medal size={20} style={{verticalAlign:'-3px', marginRight:'0.4rem', color:'#FFD700'}} />Classifica MVP</h2>
        </div>
        <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
          I migliori giocatori per numero di MVP conquistati.
        </p>
        
        {isLoadingLeaderboard ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6f9c81' }}>Caricamento classifica...</div>
        ) : leaderboard.filter(r => (r.mvp_count || 0) > 0).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6f9c81' }}>Nessun MVP assegnato finora.</div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255, 215, 0, 0.16)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 215, 0, 0.08)', borderBottom: '1px solid rgba(255, 215, 0, 0.16)' }}>
                  <th style={{ padding: '0.8rem', textAlign: 'left', color: '#FFD700', fontWeight: 600 }}>Pos</th>
                  <th style={{ padding: '0.8rem', textAlign: 'left', color: '#FFD700', fontWeight: 600 }}>Nome</th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#FFD700', fontWeight: 600 }}>MVP 🏅</th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#FFD700', fontWeight: 600 }}>Media Voto</th>
                </tr>
              </thead>
              <tbody>
                {[...leaderboard]
                  .filter(row => (row.mvp_count || 0) > 0)
                  .sort((a, b) => {
                     const aMvp = a.mvp_count || 0;
                     const bMvp = b.mvp_count || 0;
                     if (bMvp !== aMvp) return bMvp - aMvp;
                     const aMedia = a.media_voto || 0;
                     const bMedia = b.media_voto || 0;
                     return bMedia - aMedia;
                  })
                  .map((row, index, arr) => (
                    <tr key={row.nome} style={{ borderBottom: index < arr.length - 1 ? '1px solid rgba(255, 215, 0, 0.08)' : 'none', background: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.2)' }}>
                      <td style={{ padding: '0.8rem', textAlign: 'left', color: '#cfe8d8', fontWeight: index < 3 ? 'bold' : 'normal' }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}°`}
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'left', color: '#cfe8d8', fontWeight: 600 }}>{row.nome}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#FFD700', fontWeight: 'bold' }}>{row.mvp_count}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#f39c12', fontWeight: 'bold' }}>{row.media_voto ? row.media_voto.toFixed(2) : '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isUpdateModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '450px' }}>
                  <h3>Aggiorna Risultato</h3>
                  <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
                    Modifica il risultato e i marcatori della partita
                  </p>
                  
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9fd9b6', marginBottom: '0.4rem', textAlign: 'center' }}>
                            {updatingMatch?.team_a_name}
                          </span>
                          <input 
                            type="number" 
                            min="0" 
                            value={updateScoreA} 
                            onChange={e => setUpdateScoreA(e.target.value)} 
                            style={{ width: '70px', textAlign: 'center', fontSize: '1.2rem', padding: '0.5rem' }} 
                            className="modal-input" 
                          />
                      </div>
                      <span style={{ fontSize: '1.5rem', color: '#4f7560', alignSelf: 'flex-end', marginBottom: '0.5rem' }}>-</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9fd9b6', marginBottom: '0.4rem', textAlign: 'center' }}>
                            {updatingMatch?.team_b_name}
                          </span>
                          <input 
                            type="number" 
                            min="0" 
                            value={updateScoreB} 
                            onChange={e => setUpdateScoreB(e.target.value)} 
                            style={{ width: '70px', textAlign: 'center', fontSize: '1.2rem', padding: '0.5rem' }} 
                            className="modal-input" 
                          />
                      </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <label style={{ fontSize: '0.8rem', color: '#6f9c81' }}>
                            Formazione e Voti {updatingMatch?.team_a_name}
                          </label>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {updatingMatch?.team_a_players?.map(player => {
                          const count = updateScorersA[player] || 0;
                          const vote = updateVoti[player] !== undefined ? updateVoti[player] : 6;
                          return (
                            <div key={player} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.8rem', borderRadius: '8px' }}>
                               <span style={{ fontSize: '0.9rem', color: '#cfe8d8', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player}</span>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                   <span style={{ fontSize: '0.7rem', color: '#9fd9b6', marginRight: '2px' }}>Voto</span>
                                   <button type="button" onClick={() => handleUpdateVoteModal(player, -0.5)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0 6px', fontSize: '1rem' }}>-</button>
                                   <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold', color: getVoteColor(vote) }}>{vote}</span>
                                   <button type="button" onClick={() => handleUpdateVoteModal(player, 0.5)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0 6px', fontSize: '1rem' }}>+</button>
                                 </div>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                   <span style={{ fontSize: '0.7rem', color: '#9fd9b6', marginRight: '2px' }}>Gol</span>
                                   <button type="button" onClick={() => handleUpdateGoal('A', player, -1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0 6px', fontSize: '1rem' }}>-</button>
                                   <span style={{ width: '16px', textAlign: 'center', fontWeight: 'bold', color: count > 0 ? '#34d680' : '#cfe8d8' }}>{count}</span>
                                   <button type="button" onClick={() => handleUpdateGoal('A', player, 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0 6px', fontSize: '1rem' }}>+</button>
                                 </div>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <label style={{ fontSize: '0.8rem', color: '#6f9c81' }}>
                            Formazione e Voti {updatingMatch?.team_b_name}
                          </label>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {updatingMatch?.team_b_players?.map(player => {
                          const count = updateScorersB[player] || 0;
                          const vote = updateVoti[player] !== undefined ? updateVoti[player] : 6;
                          return (
                            <div key={player} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 0.8rem', borderRadius: '8px' }}>
                               <span style={{ fontSize: '0.9rem', color: '#cfe8d8', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player}</span>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                   <span style={{ fontSize: '0.7rem', color: '#9fd9b6', marginRight: '2px' }}>Voto</span>
                                   <button type="button" onClick={() => handleUpdateVoteModal(player, -0.5)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0 6px', fontSize: '1rem' }}>-</button>
                                   <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold', color: getVoteColor(vote) }}>{vote}</span>
                                   <button type="button" onClick={() => handleUpdateVoteModal(player, 0.5)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0 6px', fontSize: '1rem' }}>+</button>
                                 </div>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                   <span style={{ fontSize: '0.7rem', color: '#9fd9b6', marginRight: '2px' }}>Gol</span>
                                   <button type="button" onClick={() => handleUpdateGoal('B', player, -1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0 6px', fontSize: '1rem' }}>-</button>
                                   <span style={{ width: '16px', textAlign: 'center', fontWeight: 'bold', color: count > 0 ? '#34d680' : '#cfe8d8' }}>{count}</span>
                                   <button type="button" onClick={() => handleUpdateGoal('B', player, 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0 6px', fontSize: '1rem' }}>+</button>
                                 </div>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem', borderTop: '0.5px solid rgba(52, 214, 128, 0.16)', paddingTop: '1.2rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: '#6f9c81', fontWeight: 600 }}>
                        Password di sicurezza
                      </label>
                      <input 
                        type="password" 
                        value={updatePassword} 
                        onChange={e => setUpdatePassword(e.target.value)} 
                        placeholder="Inserisci password per salvare..." 
                        className="modal-input" 
                      />
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button className="secondary-btn" onClick={handleDeleteMatch} style={{ color: '#ff6b6b', borderColor: 'rgba(255, 107, 107, 0.3)', padding: '0.6rem 1rem' }}>
                        <Trash2 size={16} style={{ display: 'inline', verticalAlign: '-3px', marginRight: '4px' }} />
                        Elimina
                      </button>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button className="secondary-btn" onClick={() => setIsUpdateModalOpen(false)}>Annulla</button>
                        <button className="create-teams-btn" onClick={handleUpdateResult}>Salva</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {isDeleteModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '400px' }}>
                  <h3 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>Elimina Partita</h3>
                  <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
                    Sei sicuro di voler eliminare questa partita? L'operazione è irreversibile.
                  </p>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: '#6f9c81', fontWeight: 600 }}>
                        Password di sicurezza
                      </label>
                      <input 
                        type="password" 
                        value={updatePassword} 
                        onChange={e => setUpdatePassword(e.target.value)} 
                        placeholder="Inserisci password per eliminare..." 
                        className="modal-input" 
                      />
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      <button className="secondary-btn" onClick={() => setIsDeleteModalOpen(false)}>Annulla</button>
                      <button className="create-teams-btn" style={{ background: '#ff6b6b', boxShadow: '0 10px 15px -3px rgba(255, 107, 107, 0.3)' }} onClick={handleDeleteMatch}>Elimina</button>
                  </div>
              </div>
          </div>
      )}

      {isSaveFormationModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '400px' }}>
                  <h3 style={{ marginBottom: '1rem' }}>Salva Formazione</h3>
                  <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
                    Inserisci la password per salvare questa formazione.
                  </p>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: '#6f9c81', fontWeight: 600 }}>
                        Password di sicurezza
                      </label>
                      <input 
                        type="password" 
                        value={saveFormationPassword} 
                        onChange={e => setSaveFormationPassword(e.target.value)} 
                        placeholder="Inserisci password per salvare..." 
                        className="modal-input" 
                      />
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      <button className="secondary-btn" onClick={() => { setIsSaveFormationModalOpen(false); setSaveFormationPassword(''); }}>Annulla</button>
                      <button className="create-teams-btn" onClick={saveFormation} disabled={isSaving}>{isSaving ? 'Salvataggio...' : 'Salva'}</button>
                  </div>
              </div>
          </div>
      )}

      {selectedPlayerForCard && (() => {
        const playerObj = dbPlayers.find(p => p.Nome === selectedPlayerForCard);
        const stats = getPlayerStats(playerObj, selectedPlayerForCard);
        const role = playerObj?.Ruolo || 'Giocatore';
        return (
          <div className="pes-modal-overlay" onClick={() => setSelectedPlayerForCard(null)}>
            <div className="pes-modal-content" onClick={e => e.stopPropagation()}>
              <div className="pes-modal-header">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h3>{selectedPlayerForCard}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#9fd9b6', textTransform: 'uppercase', marginTop: '2px' }}>{role}</span>
                </div>
                <button className="secondary-btn" style={{padding:'0.2rem', display:'flex', background: 'transparent', border: 'none', color: '#9fd9b6'}} onClick={() => setSelectedPlayerForCard(null)}>
                  <X size={24} />
                </button>
              </div>
              {playerObj?.Skill && (
                <div className="pes-modal-skill" style={{
                  background: 'linear-gradient(90deg, rgba(0, 180, 216, 0.2) 0%, transparent 100%)',
                  padding: '8px 16px',
                  borderBottom: '1px solid rgba(107, 155, 198, 0.3)',
                  color: '#ffcc00',
                  fontStyle: 'italic',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  "{playerObj.Skill}"
                </div>
              )}
              <div className="pes-modal-body">
                <div className="pes-left-col">
                  <div className="pes-player-image-container" style={{ width: '130px', height: '170px', border: '2px solid rgba(107, 155, 198, 0.6)', borderRadius: '4px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img 
                      src={playerObj?.figurina || `/players/${encodeURIComponent(selectedPlayerForCard || '')}.jpg`} 
                      alt={selectedPlayerForCard || ''} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src.endsWith('.jpg')) {
                          target.src = `/players/${encodeURIComponent(selectedPlayerForCard)}.png`;
                        } else {
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = '<span style="color: rgba(255,255,255,0.3); font-size: 0.8rem; text-align: center; padding: 10px;">Nessuna Figurina</span>';
                        }
                      }}
                    />
                  </div>
                  <div className="pes-radar-container">
                    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                      <polygon className="pes-radar-polygon" points={`
                        50,${50 - (stats.velocita / 100) * 45}
                        ${50 + (stats.accelerazione / 100) * 43.3},${50 - (stats.accelerazione / 100) * 25}
                        ${50 + (stats.tecnica / 100) * 43.3},${50 + (stats.tecnica / 100) * 25}
                        50,${50 + (stats.contrasto / 100) * 45}
                        ${50 - (stats.passaggi / 100) * 43.3},${50 + (stats.passaggi / 100) * 25}
                        ${50 - (stats.finalizzazione / 100) * 43.3},${50 - (stats.finalizzazione / 100) * 25}
                      `} />
                    </svg>
                    <div className="pes-radar-labels">
                      <span style={{ top: '0%', left: '50%' }}>Vel</span>
                      <span style={{ top: '25%', left: '95%' }}>Acc</span>
                      <span style={{ top: '75%', left: '95%' }}>Tec</span>
                      <span style={{ top: '100%', left: '50%' }}>Con</span>
                      <span style={{ top: '75%', left: '5%' }}>Pas</span>
                      <span style={{ top: '25%', left: '5%' }}>Fin</span>
                    </div>
                  </div>
                </div>
                <div className="pes-stats-col">
                  <div className="pes-stat-row"><span>Velocità</span><span className="pes-stat-val">{stats.velocita}</span></div>
                  <div className="pes-stat-row"><span>Accelerazione</span><span className="pes-stat-val">{stats.accelerazione}</span></div>
                  <div className="pes-stat-row"><span>Tecnica</span><span className="pes-stat-val">{stats.tecnica}</span></div>
                  <div className="pes-stat-row"><span>Contrasto</span><span className="pes-stat-val">{stats.contrasto}</span></div>
                  <div className="pes-stat-row"><span>Passaggi</span><span className="pes-stat-val">{stats.passaggi}</span></div>
                  <div className="pes-stat-row"><span>Finalizzazione</span><span className="pes-stat-val">{stats.finalizzazione}</span></div>
                  <div className="pes-stat-row"><span>Resistenza</span><span className="pes-stat-val">{stats.resistenza}</span></div>
                  <div className="pes-stat-row">
                    <span>Dribbling</span>
                    <span className="pes-stat-val" style={stats.dribbling === 100 ? { color: '#ffd700', textShadow: '0 0 5px rgba(255, 215, 0, 0.8)' } : {}}>{stats.dribbling}</span>
                  </div>
                  <div className="pes-stat-row">
                    <span>Probabilità di Rissa</span>
                    <span className="pes-stat-val" style={stats.rissa === 100 ? { color: '#ffd700', textShadow: '0 0 5px rgba(255, 215, 0, 0.8)' } : {}}>{stats.rissa}</span>
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="pes-stat-row"><span>Altezza</span><span className="pes-stat-val" style={{color:'white', textShadow:'none'}}>{stats.altezza} cm</span></div>
                  <div className="pes-stat-row"><span>Peso</span><span className="pes-stat-val" style={{color:'white', textShadow:'none'}}>{stats.peso} kg</span></div>
                  <div className="pes-stat-row"><span>Piede Preferito</span><span className="pes-stat-val" style={{color:'white', textShadow:'none'}}>{stats.piede}</span></div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {toast && <div className={`toast visible ${toast.type}`}>{toast.message}</div>}

      {/* Add Campo Modal */}
      {isAddCampoModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddCampoModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'nowrap' }}>
                <h2 
                  style={{ cursor: 'pointer', opacity: campoModalMode === 'add' ? 1 : 0.5, margin: 0, fontSize: '1.1rem', paddingRight: '0.8rem', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }} 
                  onClick={() => { setCampoModalMode('add'); setNewCampoName(''); setNewCampoUrl(''); setCampoPassword(''); setSelectedCampoIdToManage(null); }}
                >AGGIUNGI CAMPO</h2>
                <h2 
                  style={{ cursor: 'pointer', opacity: campoModalMode === 'manage' ? 1 : 0.5, margin: 0, fontSize: '1.1rem', whiteSpace: 'nowrap' }}
                  onClick={() => setCampoModalMode('manage')}
                >GESTISCI</h2>
              </div>
              <button 
                className="secondary-btn" 
                style={{padding:'0 0 0 0.5rem', margin: 0, display:'flex', background: 'transparent', border: 'none', color: '#9fd9b6', cursor: 'pointer'}} 
                onClick={() => setIsAddCampoModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            {campoModalMode === 'manage' && (
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label>Seleziona Campo da Gestire</label>
                <select 
                  className="modal-input"
                  style={{ width: '100%', padding: '0.5rem', background: 'var(--color-surface-2)', color: 'white', borderRadius: '4px' }}
                  value={selectedCampoIdToManage || ''}
                  onChange={(e) => {
                     const id = Number(e.target.value);
                     setSelectedCampoIdToManage(id);
                     const c = dbCampi.find(x => x.id === id);
                     if (c) {
                        setNewCampoName(c.nome);
                        setNewCampoUrl(c.posizione_url || '');
                     }
                  }}
                >
                  <option value="">-- Seleziona --</option>
                  {dbCampi.map(c => (
                     <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label>Nome Campo *</label>
              <input 
                type="text" 
                value={newCampoName} 
                onChange={e => setNewCampoName(e.target.value)} 
                placeholder="Es. Seidita"
                className="modal-input"
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label>Posizione URL (Google Maps)</label>
              <input 
                type="text" 
                value={newCampoUrl} 
                onChange={e => setNewCampoUrl(e.target.value)} 
                placeholder="Es. https://maps.app.goo.gl/..."
                className="modal-input"
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Password *</label>
              <input 
                type="password" 
                value={campoPassword} 
                onChange={e => setCampoPassword(e.target.value)} 
                placeholder="Inserisci password"
                className="modal-input"
              />
            </div>
            
            <div style={{display:'flex', gap:'var(--space-2)', marginTop:'var(--space-4)', justifyContent: 'center'}}>
              {campoModalMode === 'manage' && selectedCampoIdToManage && (
                 <button 
                   className="btn-cancel"
                   style={{ background: '#d32f2f', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                   onClick={handleDeleteCampo}
                 >Elimina</button>
              )}
              <button 
                className="create-teams-btn" 
                onClick={handleAddCampo}
              >
                {campoModalMode === 'add' ? 'AGGIUNGI' : 'SALVA'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .matches-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3, 0.75rem);
        }

        .match-summary {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 0.25rem 0.75rem;
          padding: 0.9rem 1.1rem 1.1rem;
          cursor: pointer;
          position: relative;
        }

        .match-meta-row {
          grid-column: 1 / -1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.6rem;
        }

        .match-meta {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          letter-spacing: 0.02em;
          color: #6f9c81;
          text-transform: capitalize;
        }

        .match-meta-time {
          font-family: var(--font-mono, monospace);
          color: #4f7560;
        }

        .match-score-area {
          grid-column: 1 / 2;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 0.9rem;
          width: 100%;
        }

        .match-team {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }

        .match-team-a {
          align-items: flex-end;
          text-align: right;
        }

        .match-team-b {
          align-items: flex-start;
          text-align: left;
        }

        .match-team-name {
          font-size: 0.92rem;
          font-weight: 600;
          color: #eafff0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        .match-team-tag {
          font-size: 0.66rem;
          color: #4f7560;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .match-scoreboard {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: #06120a;
          border: 0.5px solid rgba(52, 214, 128, 0.3);
          border-radius: 10px;
          padding: 0.35rem 0.85rem;
        }

        .score-num {
          font-family: var(--font-mono, monospace);
          font-size: 1.3rem;
          font-weight: 700;
          color: #34d680;
          min-width: 1.1ch;
          text-align: center;
        }

        .score-sep {
          color: #2e4a37;
          font-size: 0.95rem;
        }

        .match-chevron {
          grid-column: 2 / 3;
          grid-row: 2 / 3;
          color: #4f7560;
          transition: transform 0.2s ease;
          align-self: center;
        }

        .match-chevron.rotated {
          transform: rotate(180deg);
        }

        .match-details {
          border-top: 0.5px solid rgba(52, 214, 128, 0.14);
          padding: 1rem 1.1rem 1.15rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: rgba(52, 214, 128, 0.025);
        }

        .scorers-detail {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .scorers-label {
          font-size: 0.7rem;
          letter-spacing: 0.04em;
          color: #6f9c81;
          text-transform: uppercase;
        }

        .scorers-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 0.75rem;
        }

        .scorers-team {
          font-size: 0.85rem;
          color: #cfe8d8;
          line-height: 1.5;
        }

        .scorers-row .scorers-team:first-child {
          text-align: right;
        }

        .scorers-divider {
          width: 1px;
          align-self: stretch;
          background: rgba(52, 214, 128, 0.18);
        }

        .formations-detail {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .formation-team {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .formation-team-b {
          align-items: flex-end;
        }

        .formation-team-b .formation-players {
          align-items: flex-end;
        }

        .formation-team-b .formation-title {
          text-align: right;
          width: 100%;
        }

        .formation-title {
          font-size: 0.78rem;
          font-weight: 600;
          color: #9fd9b6;
          padding-bottom: 0.35rem;
          border-bottom: 0.5px solid rgba(52, 214, 128, 0.16);
          width: 100%;
        }

        .formation-players {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          list-style: none;
          padding: 0;
          margin: 0;
          width: 100%;
        }

        .formation-players li {
          font-size: 0.84rem;
          color: #cfe8d8;
          line-height: 1.4;
        }

        @media (max-width: 520px) {
          .match-team-name {
            font-size: 0.8rem;
          }
          .score-num {
            font-size: 1.1rem;
          }
          .formations-detail {
            grid-template-columns: 1fr;
            gap: 0.9rem;
          }
          .formation-team-b {
            align-items: flex-start;
          }
          .formation-team-b .formation-players {
            align-items: flex-start;
          }
          .formation-team-b .formation-title {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}
