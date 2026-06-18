'use client';

import { useState, useEffect, useRef } from 'react';
import { Sun, Moon, RotateCcw, Copy, Plus, X, Pencil, Trophy, ChevronDown, Trash2, Calendar } from 'lucide-react';

// --- Types ---
interface Player {
  Nome: string;
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
          <div className="dropdown-options">
            {options.map((opt) => (
              <div 
                key={opt.Nome}
                className={`dropdown-option ${opt.Nome === value ? 'selected' : ''}`}
                onClick={() => { onChange(opt.Nome); setIsOpen(false); }}
              >
                {opt.Nome}
              </div>
            ))}
            {options.length === 0 && (
              <div className="dropdown-no-options">Tutti selezionati</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [dbPlayers, setDbPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(Array(10).fill(''));
  const [clusters, setClusters] = useState<Cluster[]>([]);
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
  const [newPlayerName, setNewPlayerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToDelete, setSelectedToDelete] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);
  
  // Swap state
  const [activeSwapSource, setActiveSwapSource] = useState<{name: string, team: 'teamA' | 'teamB'} | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const init = async () => {
      try {
        const [playersRes, sessionRes, settingsRes, matchesRes] = await Promise.all([
          fetch('/api/giocatori'),
          fetch('/api/session'),
          fetch('/api/settings'),
          fetch('/api/risultati', { cache: 'no-store' })
        ]);
        
        const playersData = await playersRes.json();
        const sessionData = await sessionRes.json();
        const settingsData = await settingsRes.json();
        const matchesData = await matchesRes.json();

        if (playersData.error) throw new Error(playersData.error);
        setDbPlayers(playersData);
        setMatches(Array.isArray(matchesData) ? matchesData : []);

        if (settingsData && settingsData.match_label) {
          setMatchLabel(settingsData.match_label);
        }

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
            setTeamAName(sessionData.team_a_name || 'Falchi 🦅');
            setTeamBName(sessionData.team_b_name || 'Aquile 🦆');
            setResults({
              teamA: sessionData.team_a_players,
              teamB: sessionData.team_b_players
            });
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
    if (!newPlayerName.trim()) return;
    try {
      const res = await fetch('/api/giocatori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Nome: newPlayerName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast('Giocatore aggiunto!', 'success');
      setNewPlayerName('');
      setIsAddModalOpen(false);
      await fetchPlayers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeletePlayers = async () => {
    if (selectedToDelete.size === 0) return;
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

  const formatResultDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatResultTime = (timeStr: string) => {
    return timeStr.split(':').slice(0, 2).join(':');
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

      const idxA = listA.indexOf(playerA);
      const idxB = listB.indexOf(playerB);

      // Simple swap logic
      if (idxA !== -1 && idxB !== -1) {
          listA[idxA] = playerB;
          listB[idxB] = playerA;

          newResults.teamA = listA;
          newResults.teamB = listB;

          setResults(newResults);
          saveSession(newResults);
          setActiveSwapSource(null);
      }
  };

  // --- Logic ---
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
    const date = new Date().toLocaleDateString('it-IT');
    const text = `⚽ RANDOM SIX FINGERS — Squadre del ${date}\n\n` +
                 `${teamAName.toUpperCase()}\n` +
                 results.teamA.map((n, i) => `${i + 1}. ${n}`).join('\n') +
                 `\n\n${teamBName.toUpperCase()}\n` +
                 results.teamB.map((n, i) => `${i + 1}. ${n}`).join('\n');

    navigator.clipboard.writeText(text).then(() => showToast('Risultato copiato!', 'success'));
  };

  const saveFormation = async () => {
    if (!results) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/salva-formazione', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_a_name: teamAName, team_b_name: teamBName, teamAPlayers: results.teamA, teamBPlayers: results.teamB })
      });
      if (!res.ok) throw new Error('Errore nel salvataggio');
      showToast('Formazione salvata!', 'success');

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

  // --- Dynamic Options ---
  const getAvailableOptions = (currentIndex: number) => {
    const otherSelected = selectedPlayers.filter((p, i) => i !== currentIndex && p !== '');
    return dbPlayers.filter(p => !otherSelected.includes(p.Nome));
  };

  // --- Render ---
  return (
    <div className="container">
      <header>
        <div className="header-top">
          <div className="logo-section">
            <div className="logo">
              <svg viewBox="0 0 100 100" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" stroke="currentColor" stroke-width="4"/>
                <path d="M50 2L35 25H65L50 2Z" fill="currentColor"/>
                <path d="M20 35L2 50L20 65L35 50L20 35Z" fill="currentColor"/>
                <path d="M80 35L98 50L80 65L65 50L80 35Z" fill="currentColor"/>
                <path d="M35 75L50 98L65 75H35Z" fill="currentColor"/>
                <path d="M35 25L20 35M65 25L80 35M20 65L35 75M80 65L65 75M35 50H65M50 25L50 75" stroke="currentColor" stroke-width="2"/>
              </svg>
              Random Six Fingers
            </div>
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
          <div className="modal-overlay">
              <div className="modal-content">
                  <h3>Gestisci Giocatori</h3>
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
                                    padding:'0.8rem', cursor:'pointer', borderBottom:'1px solid var(--color-border)',
                                    background: selectedToDelete.has(p.Nome) ? 'var(--color-primary-active)' : 'transparent',
                                    color: selectedToDelete.has(p.Nome) ? '#fff' : 'var(--color-text)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                                onClick={() => {
                                    const next = new Set(selectedToDelete);
                                    if (next.has(p.Nome)) next.delete(p.Nome);
                                    else next.add(p.Nome);
                                    setSelectedToDelete(next);
                                }}
                            >
                                <span>{p.Nome}</span>
                                {selectedToDelete.has(p.Nome) && <span role="img" aria-label="remove">❌</span>}
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

      {isAddModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content">
                  <h3>Nuovo Giocatore</h3>
                  <input 
                    type="text" 
                    value={newPlayerName} 
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Nome giocatore"
                    className="modal-input"
                  />
                  <div style={{display:'flex', gap:'var(--space-2)', marginTop:'var(--space-4)'}}>
                      <button className="secondary-btn" onClick={() => setIsAddModalOpen(false)}>Annulla</button>
                      <button className="create-teams-btn" onClick={handleAddPlayer}>Salva</button>
                  </div>
              </div>
          </div>
      )}

      <section>
        <h2>⚡ Cluster di Vincolo</h2>
        <p className="section-subtitle">I giocatori dello stesso cluster saranno divisi in squadre diverse</p>
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
      </section>

      <div className="actions-main">
        <button className="create-teams-btn" onClick={generateTeams} disabled={loading}>
          ⚽ Crea Squadre
        </button>
        <button className="clear-btn" onClick={clearState} disabled={loading}>
          <Trash2 size={20} /> PULISCI
        </button>
      </div>

      {results && (
        <section className="results-section" ref={resultsRef} style={{display:'block'}}>
          <div className="teams-container">
            {[ { team: 'A', name: teamAName, setName: setTeamAName, list: results.teamA, cls: 'team-falchi' },
               { team: 'B', name: teamBName, setName: setTeamBName, list: results.teamB, cls: 'team-aquile' }
            ].map(t => (
              <div key={t.team} className={`team-card ${t.cls}`}>
                <div className="team-header">
                  <input 
                    type="text" 
                    className="team-name" 
                    value={t.name} 
                    onChange={(e) => t.setName(e.target.value)} 
                    onBlur={() => saveSession(results)}
                    spellCheck={false} 
                  />
                  <Pencil size={16} style={{opacity:0.5}} />
                </div>
                <ul className="team-list">
                  {t.list.map(name => {
                    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                    const hue = hashStringToHue(name);
                    
                    const isSwapTarget = activeSwapSource && activeSwapSource.team !== (t.team === 'A' ? 'teamA' : 'teamB');
                    const isSwapSource = activeSwapSource?.name === name;

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
                            <span className="player-name">{name}</span>
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
              </div>
            ))}
          </div>
          
          <div className="results-actions">
            <button className="secondary-btn" onClick={generateTeams}><RotateCcw size={18} /> Rimescola</button>
            <button className="secondary-btn" onClick={copyResults}><Copy size={18} /> Copia</button>
            <button className="create-teams-btn" onClick={saveFormation} disabled={isSaving}>
                {isSaving ? 'Salvataggio...' : '💾 Salva Formazione'}
            </button>
          </div>
        </section>
      )}

      <section>
        <h2><Trophy size={20} style={{verticalAlign:'-3px', marginRight:'0.4rem', color:'#e8b339'}} />Archivio Partite</h2>
        {matches.length === 0 ? (
          <p className="section-subtitle">Nessuna partita archiviata</p>
        ) : (
          <div className="matches-list">
            {matches.map(m => {
              const isExpanded = expandedMatchId === m.id;
              const scorersA = normalizeScorers(m.marcatori_a);
              const scorersB = normalizeScorers(m.marcatori_b);
              const [scoreA, scoreB] = (m.risultato || '0-0').split('-').map(s => s.trim());

              return (
                <div key={m.id} className={`match-card ${isExpanded ? 'expanded' : ''}`}>
                  <div
                    className="match-summary"
                    onClick={() => setExpandedMatchId(isExpanded ? null : m.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setExpandedMatchId(isExpanded ? null : m.id)}
                  >
                    <div className="match-meta-row">
                      <span className="match-meta">
                        <Calendar size={13} />
                        {formatResultDate(m.data)}
                      </span>
                      <span className="match-meta match-meta-time">{formatResultTime(m.ora)}</span>
                    </div>

                    <div className="match-score-area">
                      <div className="match-team match-team-a">
                        <span className="match-team-name">{m.team_a_name}</span>
                        <span className="match-team-tag">Casa</span>
                      </div>

                      <div className="match-scoreboard">
                        <span className="score-num">{scoreA}</span>
                        <span className="score-sep">–</span>
                        <span className="score-num">{scoreB}</span>
                      </div>

                      <div className="match-team match-team-b">
                        <span className="match-team-name">{m.team_b_name}</span>
                        <span className="match-team-tag">Trasferta</span>
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
                            {m.team_a_players.map(name => (
                              <li key={name}>{name}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="formation-team formation-team-b">
                          <span className="formation-title">{m.team_b_name}</span>
                          <ul className="formation-players">
                            {m.team_b_players.map(name => (
                              <li key={name}>{name}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {toast && <div className={`toast visible ${toast.type}`}>{toast.message}</div>}

      <style jsx global>{`
        .matches-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3, 0.75rem);
        }

        .match-card {
          background: #0d1f12;
          border: 0.5px solid rgba(52, 214, 128, 0.16);
          border-radius: 14px;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }

        .match-card.expanded {
          border-color: rgba(52, 214, 128, 0.32);
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
