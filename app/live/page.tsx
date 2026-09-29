'use client';

import { useState, useEffect } from 'react';
import { X, Trophy, Plus, Minus } from 'lucide-react';

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
  
  const fetchMatch = async () => {
    try {
      const res = await fetch('/api/live-match');
      if (res.ok) {
        const data = await res.json();
        setMatch(data);
      }
    } catch (e) {
      console.error(e);
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
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(console.error);
      }
    };
  }, []);

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

  const handleGoal = async (player: string, team: 'A' | 'B') => {
    // Optimistic update
    const newScoreA = team === 'A' ? score.a + 1 : score.a;
    const newScoreB = team === 'B' ? score.b + 1 : score.b;
    const newRisultato = `${newScoreA}-${newScoreB}`;
    
    const marcs = team === 'A' ? (match.marcatori_a || []) : (match.marcatori_b || []);
    const newMarcs = [...marcs, player];

    setMatch({
      ...match,
      risultato: newRisultato,
      marcatori_a: team === 'A' ? newMarcs : match.marcatori_a,
      marcatori_b: team === 'B' ? newMarcs : match.marcatori_b,
    });
    
    setSelectedTeam(null); // back to main screen

    // Sync DB
    await fetch('/api/live-match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: match.id,
        risultato: newRisultato,
        marcatori_a: team === 'A' ? newMarcs : match.marcatori_a,
        marcatori_b: team === 'B' ? newMarcs : match.marcatori_b,
      })
    });
  };

  // UI for player selection
  if (selectedTeam) {
    const players = selectedTeam === 'A' ? match.team_a_players : match.team_b_players;
    const teamColor = selectedTeam === 'A' ? '#2196f3' : '#ff9800'; // Falchi : Aquile
    
    return (
      <div style={styles.container}>
        <div style={styles.header}>
           <button style={styles.backBtn} onClick={() => setSelectedTeam(null)}>
             <X size={20} color="#fff" />
           </button>
           <span style={{color: teamColor, fontWeight: 'bold'}}>Chi ha segnato?</span>
        </div>
        
        <div style={styles.scrollList}>
          {players.map(p => (
            <button 
              key={p} 
              style={{...styles.playerBtn, borderLeft: `4px solid ${teamColor}`}}
              onClick={() => handleGoal(p, selectedTeam)}
            >
              {p}
            </button>
          ))}
          {/* Option for Auto Goal */}
          <button 
            style={{...styles.playerBtn, borderLeft: `4px solid #ef5350`}}
            onClick={() => handleGoal('Autogol', selectedTeam)}
          >
            Autogol
          </button>
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div style={styles.container}>
      {/* SCORE */}
      <div style={styles.scoreContainer}>
        <div style={{...styles.scoreNumber, color: '#2196f3'}}>{score.a}</div>
        <div style={{color: '#fff', fontSize: '1.2rem'}}>-</div>
        <div style={{...styles.scoreNumber, color: '#ff9800'}}>{score.b}</div>
      </div>
      
      {/* TEAM BUTTONS */}
      <div style={styles.buttonsContainer}>
        <button style={{...styles.teamBtn, backgroundColor: 'rgba(33, 150, 243, 0.2)', borderColor: '#2196f3'}} onClick={() => setSelectedTeam('A')}>
           <span style={{color: '#2196f3', fontSize: '1.5rem'}}>+</span>
           <span style={{color: '#2196f3', fontSize: '0.8rem', marginTop: '4px'}}>Gol {match.team_a_name}</span>
        </button>
        <button style={{...styles.teamBtn, backgroundColor: 'rgba(255, 152, 0, 0.2)', borderColor: '#ff9800'}} onClick={() => setSelectedTeam('B')}>
           <span style={{color: '#ff9800', fontSize: '1.5rem'}}>+</span>
           <span style={{color: '#ff9800', fontSize: '0.8rem', marginTop: '4px'}}>Gol {match.team_b_name}</span>
        </button>
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
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#000', // Black for AMOLED
    color: '#fff',
    fontFamily: 'sans-serif',
    padding: '20px',
    boxSizing: 'border-box'
  },
  scoreContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '20px'
  },
  scoreNumber: {
    fontSize: '3rem',
    fontWeight: 'bold',
  },
  buttonsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%'
  },
  teamBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '15px',
    borderRadius: '25px',
    border: '2px solid',
    borderStyle: 'solid', // Make sure border is solid
    background: 'transparent',
    width: '100%',
    cursor: 'pointer'
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
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  scrollList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    overflowY: 'auto',
    maxHeight: '70vh',
    paddingRight: '5px'
  },
  playerBtn: {
    background: '#1a1a1a',
    border: 'none',
    borderRadius: '8px',
    padding: '15px',
    color: '#fff',
    textAlign: 'left',
    fontSize: '0.9rem',
    cursor: 'pointer'
  }
};
