'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Sun, Moon, Users, Zap, RotateCcw, Copy, Plus, X, Pencil, Trophy } from 'lucide-react';

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

  const resultsRef = useRef<HTMLDivElement>(null);

  // --- Initial Fetch ---
  useEffect(() => {
    fetch('/api/giocatori')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setDbPlayers(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Impossibile caricare i giocatori dal database');
        setLoading(false);
      });
  }, []);

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

  const generateTeams = () => {
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

    // Algorithm
    const shuffled = [...selectedPlayers].sort(() => Math.random() - 0.5);
    const teamA: string[] = [];
    const teamB: string[] = [];
    const getPlayerCluster = (name: string) => clusters.find(c => c.members.includes(name));

    try {
      const clusterPlayers = shuffled.filter(p => getPlayerCluster(p));
      const normalPlayers = shuffled.filter(p => !getPlayerCluster(p));

      for (const player of clusterPlayers) {
        const cluster = getPlayerCluster(player)!;
        const inA = cluster.members.filter(m => teamA.includes(m)).length;
        const inB = cluster.members.filter(m => teamB.includes(m)).length;

        if (inA > 0) {
          if (teamB.length < 5) teamB.push(player);
          else throw new Error('Impossibile rispettare tutti i vincoli. Riduci la dimensione dei cluster.');
        } else if (inB > 0) {
          if (teamA.length < 5) teamA.push(player);
          else throw new Error('Impossibile rispettare tutti i vincoli. Riduci la dimensione dei cluster.');
        } else {
          if (teamA.length <= teamB.length && teamA.length < 5) teamA.push(player);
          else if (teamB.length < 5) teamB.push(player);
          else teamA.push(player);
        }
      }

      for (const player of normalPlayers) {
        if (teamA.length < 5) teamA.push(player);
        else teamB.push(player);
      }

      if (teamA.length !== 5 || teamB.length !== 5) throw new Error('Errore nella generazione');

      setResults({ teamA, teamB });
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
        <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {error && <div className="toast visible error" style={{position:'static', transform:'none', margin:'0 0 2rem 0'}}>{error}</div>}

      <section>
        <h2>👥 Giocatori</h2>
        <div className="players-grid">
          {selectedPlayers.map((val, i) => (
            <div key={i} className="player-input-group">
              <div className={`player-input-wrapper ${loading ? 'loading-shimmer' : ''}`}>
                <span className="player-number">{i + 1}</span>
                <select 
                  className="player-input" 
                  value={val} 
                  onChange={(e) => handlePlayerChange(i, e.target.value)}
                  disabled={loading}
                >
                  <option value="">Seleziona...</option>
                  {getAvailableOptions(i).map(p => (
                    <option key={p.Nome} value={p.Nome}>{p.Nome}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </section>

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

      <div className="actions">
        <button className="create-teams-btn" onClick={generateTeams} disabled={loading}>
          ⚽ Crea Squadre
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
                  <input type="text" className="team-name" value={t.name} onChange={(e) => t.setName(e.target.value)} spellCheck={false} />
                  <Pencil size={16} style={{opacity:0.5}} />
                </div>
                <ul className="team-list">
                  {t.list.map(name => {
                    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                    const hue = hashStringToHue(name);
                    return (
                      <li key={name} className="player-row">
                        <div className="avatar" style={{background: `hsl(${hue}, 60%, 45%)`}}>{initials}</div>
                        <span className="player-name">{name}</span>
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
