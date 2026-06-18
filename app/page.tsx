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

function SwapDropdown({ otherTeamPlayers, onSwap }: { otherTeamPlayers: string[], onSwap: (target: string) => void }) {
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
    <div className="swap-dropdown-container" ref={dropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <button className="swap-icon-btn" onClick={() => setIsOpen(!isOpen)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.5rem', color: '#888' }}>
            <span style={{fontSize: '1.2rem'}}>⇄</span>
        </button>

        {isOpen && (
            <div className="dropdown-panel swap-panel" style={{position: 'absolute', right: 0, top: '100%', zIndex: 10, background: 'var(--card-bg, #1a1a1a)', border: '1px solid var(--border-color, #333)', borderRadius: '4px', minWidth: '150px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)'}}>
                <div className="dropdown-options" style={{ display: 'flex', flexDirection: 'column' }}>
                    {otherTeamPlayers.map(name => (
                        <div
                          key={name}
                          className="dropdown-option"
                          onClick={() => { onSwap(name); setIsOpen(false); }}
                          style={{minHeight: '44px', display: 'flex', alignItems: 'center', padding: '0 1rem', cursor: 'pointer', color: 'var(--text-color, #fff)' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            {name}
                        </div>
                    ))}
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
  const [newPlayerName, setNewPlayerName] = useState('');

  const resultsRef = useRef<HTMLDivElement>(null);

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
        const [playersRes, sessionRes, settingsRes] = await Promise.all([
          fetch('/api/giocatori'),
          fetch('/api/session'),
          fetch('/api/settings')
        ]);
        
        const playersData = await playersRes.json();
        const sessionData = await sessionRes.json();
        const settingsData = await settingsRes.json();

        if (playersData.error) throw new Error(playersData.error);
        setDbPlayers(playersData);

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
            <button className="secondary-btn" onClick={() => setIsAddModalOpen(true)}>
                <Plus size={16}/> Aggiungi
            </button>
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
                    return (
                      <li key={name} className="player-row" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <div className="avatar" style={{background: `hsl(${hue}, 60%, 45%)`}}>{initials}</div>
                            <span className="player-name">{name}</span>
                        </div>
                        <SwapDropdown
                            otherTeamPlayers={t.team === 'A' ? results.teamB : results.teamA}
                            onSwap={(target) => handleSwap(name, t.team === 'A' ? 'teamA' : 'teamB', target, t.team === 'A' ? 'teamB' : 'teamA')}
                        />
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
          </div>
        </section>
      )}

      {toast && <div className={`toast visible ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}
