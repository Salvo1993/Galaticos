'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface LiveMatch {
  id: number;
  team_a_name: string;
  team_b_name: string;
  risultato: string | null;
  marcatori_a: string[] | null;
  marcatori_b: string[] | null;
  team_a_players: string[];
  team_b_players: string[];
}

export default function LiveMatchWear() {
  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<'A' | 'B' | null>(null);
  const [isAutogolSelection, setIsAutogolSelection] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline'>('online');
  
  const fetchMatch = async () => {
    try {
      const res = await fetch('/api/live-match');
      if (res.ok) {
        const data = await res.json();
        setMatch(data);
        
        // If we just loaded and have a pending update in localStorage, sync it!
        const pending = localStorage.getItem('pendingLiveMatch');
        if (pending) {
            const pendingMatch = JSON.parse(pending);
            if (pendingMatch.id === data.id) {
                // local state is ahead of DB? Actually, better to just push it
                syncMatch(pendingMatch);
            } else {
                localStorage.removeItem('pendingLiveMatch');
            }
        }
      }
    } catch (e) {
      console.error(e);
      // If offline on load, try to load from localStorage
      const pending = localStorage.getItem('pendingLiveMatch');
      if (pending) {
          setMatch(JSON.parse(pending));
          setSyncStatus('offline');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
    
    // Attempt to wake lock
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.error(`${(err as Error).name}, ${(err as Error).message}`);
      }
    };
    
    requestWakeLock();

    const handleOnline = () => {
      setSyncStatus('online');
      const pending = localStorage.getItem('pendingLiveMatch');
      if (pending) {
          syncMatch(JSON.parse(pending));
      }
    };

    const handleOffline = () => setSyncStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(console.error);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncMatch = async (matchData: LiveMatch) => {
    try {
      await fetch('/api/live-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: matchData.id,
          risultato: matchData.risultato,
          marcatori_a: matchData.marcatori_a,
          marcatori_b: matchData.marcatori_b,
        })
      });
      setSyncStatus('online');
      localStorage.removeItem('pendingLiveMatch');
    } catch (e) {
      console.error("Sync failed, will retry", e);
      setSyncStatus('offline');
      localStorage.setItem('pendingLiveMatch', JSON.stringify(matchData));
    }
  };

  if (loading) {
    return <div style={styles.center}>Caricamento...</div>;
  }

  if (!match) {
    return <div style={styles.center}>Nessuna partita attiva</div>;
  }

  const parseScore = (res: string | null) => {
    if (!res || res === '0-0') return { a: 0, b: 0 };
    const [a, b] = res.split('-').map(n => parseInt(n.trim()) || 0);
    return { a, b };
  };

  const score = parseScore(match.risultato);

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

  const handleGoal = async (player: string, team: 'A' | 'B') => {
    // Optimistic update
    const newScoreA = team === 'A' ? score.a + 1 : score.a;
    const newScoreB = team === 'B' ? score.b + 1 : score.b;
    const newRisultato = `${newScoreA}-${newScoreB}`;
    
    const marcsA = parseScorers(match.marcatori_a);
    const marcsB = parseScorers(match.marcatori_b);

    if (team === 'A') {
        marcsA[player] = (marcsA[player] || 0) + 1;
    } else {
        marcsB[player] = (marcsB[player] || 0) + 1;
    }

    const strMarcsA = stringifyScorers(marcsA);
    const strMarcsB = stringifyScorers(marcsB);

    const updatedMatch = {
      ...match,
      risultato: newRisultato,
      marcatori_a: strMarcsA as any,
      marcatori_b: strMarcsB as any,
    };

    setMatch(updatedMatch);
    setSelectedTeam(null); // back to main screen
    setIsAutogolSelection(false);

    // Sync DB
    syncMatch(updatedMatch);
  };

  // UI for player selection
  if (selectedTeam) {
    const isTeamA = selectedTeam === 'A';
    // Se isAutogolSelection è true, mostriamo i giocatori della squadra AVVERSARIA
    const players = isAutogolSelection 
        ? (isTeamA ? match.team_b_players : match.team_a_players)
        : (isTeamA ? match.team_a_players : match.team_b_players);
    
    const teamColor = isTeamA ? '#2196f3' : '#ff9800'; // Falchi : Aquile
    
    return (
      <div style={styles.containerSelection}>
        <div style={styles.header}>
           <button style={styles.backBtn} onClick={() => {
               if (isAutogolSelection) setIsAutogolSelection(false);
               else setSelectedTeam(null);
           }}>
             <X size={24} color="#fff" />
           </button>
           <span style={{color: teamColor, fontWeight: 'bold', fontSize: '1.2rem'}}>
               {isAutogolSelection ? 'Chi ha fatto autogol?' : 'Chi ha segnato?'}
           </span>
        </div>
        
        <div style={styles.scrollList}>
          {players.map(p => (
            <button 
              key={p} 
              style={{...styles.playerBtn, borderLeft: `6px solid ${isAutogolSelection ? '#ef5350' : teamColor}`}}
              onClick={() => {
                  if (isAutogolSelection) {
                      handleGoal(`Autogol ${p}`, selectedTeam);
                  } else {
                      handleGoal(p, selectedTeam);
                  }
              }}
            >
              {p}
            </button>
          ))}
          {/* Option for Auto Goal */}
          {!isAutogolSelection && (
            <button 
              style={{...styles.playerBtn, borderLeft: `6px solid #ef5350`}}
              onClick={() => setIsAutogolSelection(true)}
            >
              Autogol
            </button>
          )}
        </div>
      </div>
    );
  }

  const formatTeamName = (name: string) => name ? name.replace(/[^a-zA-Z0-9 ]/g, '').trim() : '';

  // Main UI - Split Left/Right
  return (
    <div style={styles.containerSplit}>
      {/* SCORE FLOATING ON TOP */}
      <div style={styles.scoreOverlay}>
        <span style={{color: '#64b5f6'}}>{score.a}</span>
        <span style={{color: '#fff', fontSize: '1.5rem', margin: '0 10px'}}>-</span>
        <span style={{color: '#ffb74d'}}>{score.b}</span>
        {syncStatus === 'offline' && (
            <div style={{position: 'absolute', top: '-10px', right: '-10px', background: 'red', borderRadius: '50%', width: '12px', height: '12px'}} />
        )}
      </div>
      
      {/* LEFT BUTTON - TEAM A */}
      <div style={styles.halfBtnLeft} onClick={() => setSelectedTeam('A')}>
         <span style={styles.teamNameText}>{formatTeamName(match.team_a_name)}</span>
         <span style={styles.plusIcon}>+</span>
      </div>

      {/* RIGHT BUTTON - TEAM B */}
      <div style={styles.halfBtnRight} onClick={() => setSelectedTeam('B')}>
         <span style={styles.teamNameText}>{formatTeamName(match.team_b_name)}</span>
         <span style={styles.plusIcon}>+</span>
      </div>
    </div>
  );
}

// Inline styles optimized for small circular screens (Wear OS)
const styles: { [key: string]: React.CSSProperties } = {
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#000',
    color: '#fff',
    fontFamily: 'sans-serif'
  },
  containerSelection: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#000',
    color: '#fff',
    fontFamily: 'sans-serif',
    padding: '25px 15px',
    boxSizing: 'border-box'
  },
  containerSplit: {
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#000',
    color: '#fff',
    fontFamily: 'sans-serif',
    overflow: 'hidden',
    position: 'relative'
  },
  scoreOverlay: {
    position: 'absolute',
    top: '15%',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: '5px 15px',
    borderRadius: '30px',
    fontSize: '2.2rem',
    fontWeight: 'bold',
    border: '1px solid #333'
  },
  halfBtnLeft: {
    flex: 1,
    backgroundColor: '#1565c0', // deeper blue
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: '15px',
    paddingTop: '30px',
    cursor: 'pointer',
    borderRight: '2px solid #000'
  },
  halfBtnRight: {
    flex: 1,
    backgroundColor: '#ef6c00', // deeper orange
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: '15px',
    paddingTop: '30px',
    cursor: 'pointer',
    borderLeft: '2px solid #000'
  },
  teamNameText: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    textAlign: 'center',
    wordWrap: 'break-word',
    maxWidth: '90%',
    lineHeight: '1.1',
    textShadow: '1px 1px 3px rgba(0,0,0,0.5)'
  },
  plusIcon: {
    fontSize: '3.5rem',
    marginTop: '10px',
    opacity: 0.9,
    fontWeight: '300'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    marginBottom: '15px',
    gap: '10px'
  },
  backBtn: {
    background: '#333',
    border: 'none',
    borderRadius: '50%',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0
  },
  scrollList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
    overflowY: 'auto',
    flex: 1,
    paddingRight: '5px',
    paddingBottom: '20px'
  },
  playerBtn: {
    background: '#1a1a1a',
    border: 'none',
    borderRadius: '12px',
    padding: '20px 15px',
    color: '#fff',
    textAlign: 'left',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};
