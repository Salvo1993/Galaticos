'use client';

import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { MatchResult } from '@/types';
import {
  parseScorersWithMinutes,
  stringifyScorersWithMinutes,
  getVoteColor
} from '@/lib/stats/match-utils';

export interface UpdateResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: MatchResult | null;
  onSave: (payload: {
    id: number;
    risultato: string;
    marcatori_a: string;
    marcatori_b: string;
    voti_giocatori: Record<string, number | 's.v.'>;
    mvps: string[];
  }) => Promise<void> | void;
  onDelete: () => void;
  isSaving?: boolean;
}

export default function UpdateResultModal({
  isOpen,
  onClose,
  match,
  onSave,
  onDelete,
  isSaving = false
}: UpdateResultModalProps) {
  const [updateScoreA, setUpdateScoreA] = useState('');
  const [updateScoreB, setUpdateScoreB] = useState('');
  const [updateScorersA, setUpdateScorersA] = useState<Record<string, string[]>>({});
  const [updateScorersB, setUpdateScorersB] = useState<Record<string, string[]>>({});
  const [scorersAModified, setScorersAModified] = useState(false);
  const [scorersBModified, setScorersBModified] = useState(false);
  const [goalMode, setGoalMode] = useState<Record<string, 'G' | 'AG'>>({});
  const [updateVoti, setUpdateVoti] = useState<Record<string, number | 's.v.'>>({});
  const [updateMVPs, setUpdateMVPs] = useState<string[]>([]);
  const [touchedVoti, setTouchedVoti] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && match) {
      const [sA, sB] = (match.risultato || '0-0').split('-').map((s) => s.trim());
      setUpdateScoreA(sA || '0');
      setUpdateScoreB(sB || '0');
      setUpdateScorersA(parseScorersWithMinutes(match.marcatori_a));
      setUpdateScorersB(parseScorersWithMinutes(match.marcatori_b));
      setScorersAModified(false);
      setScorersBModified(false);
      setUpdateVoti(match.voti_giocatori || {});
      const rawMvps: any = match.mvps;
      const parsedMvps = Array.isArray(rawMvps)
        ? rawMvps
        : typeof rawMvps === 'string'
        ? (() => {
            try {
              const res = JSON.parse(rawMvps);
              return Array.isArray(res) ? res : [];
            } catch {
              return (rawMvps as string).split(',').map((s: string) => s.trim()).filter(Boolean);
            }
          })()
        : [];
      setUpdateMVPs(parsedMvps);
      setTouchedVoti(new Set(Object.keys(match.voti_giocatori || {})));
      setGoalMode({});
    }
  }, [isOpen, match]);

  useEffect(() => {
    if (isOpen && match) {
      const [sA, sB] = (match.risultato || '0-0').split('-').map((s) => s.trim());
      const originalSA = sA || '0';
      const originalSB = sB || '0';
      const isScoreChanged =
        (updateScoreA !== '' && updateScoreA !== originalSA) ||
        (updateScoreB !== '' && updateScoreB !== originalSB);

      if (
        !match.voti_giocatori ||
        Object.keys(match.voti_giocatori).length === 0 ||
        isScoreChanged ||
        match.risultato === '0-0'
      ) {
        const scoreA = parseInt(updateScoreA) || 0;
        const scoreB = parseInt(updateScoreB) || 0;
        let defA = 6,
          defB = 6;
        if (scoreA > scoreB) {
          defA = 7;
          defB = 5;
        } else if (scoreB > scoreA) {
          defA = 5;
          defB = 7;
        }

        setUpdateVoti((prev) => {
          const next = { ...prev };
          match.team_a_players?.forEach((p: string) => {
            if (!touchedVoti.has(p)) next[p] = defA;
          });
          match.team_b_players?.forEach((p: string) => {
            if (!touchedVoti.has(p)) next[p] = defB;
          });
          return next;
        });
      }
    }
  }, [updateScoreA, updateScoreB, isOpen, match, touchedVoti]);

  if (!isOpen || !match) return null;

  const handleUpdateGoal = (team: 'A' | 'B', playerKey: string, delta: number) => {
    if (team === 'A') {
      setScorersAModified(true);
      setUpdateScorersA((prev) => {
        const next = { ...prev };
        const currentArr = next[playerKey] ? [...next[playerKey]] : [];
        if (delta > 0) {
          currentArr.push('');
          next[playerKey] = currentArr;
        } else if (delta < 0) {
          if (currentArr.length > 0) {
            currentArr.pop();
            if (currentArr.length === 0) delete next[playerKey];
            else next[playerKey] = currentArr;
          }
        }
        return next;
      });
    } else {
      setScorersBModified(true);
      setUpdateScorersB((prev) => {
        const next = { ...prev };
        const currentArr = next[playerKey] ? [...next[playerKey]] : [];
        if (delta > 0) {
          currentArr.push('');
          next[playerKey] = currentArr;
        } else if (delta < 0) {
          if (currentArr.length > 0) {
            currentArr.pop();
            if (currentArr.length === 0) delete next[playerKey];
            else next[playerKey] = currentArr;
          }
        }
        return next;
      });
    }
  };

  const handleUpdateVoteModal = (player: string, delta: number) => {
    setTouchedVoti((prev) => new Set(prev).add(player));
    setUpdateVoti((prev) => {
      let current = prev[player];
      if (current === 's.v.' || current === 0 || typeof current === 'string') current = 6;
      else if (current === undefined) current = 6;

      let nextVote = Number(current) + delta;
      if (nextVote > 10) nextVote = 10;
      if (nextVote <= 0) return { ...prev, [player]: 's.v.' };

      return { ...prev, [player]: nextVote };
    });
  };

  const handleSetVoteSV = (player: string) => {
    setTouchedVoti((prev) => new Set(prev).add(player));
    setUpdateVoti((prev) => ({ ...prev, [player]: 's.v.' }));
  };

  const handleToggleMVP = (player: string) => {
    setUpdateMVPs((prev) =>
      prev.includes(player) ? prev.filter((p) => p !== player) : [...prev, player]
    );
  };

  const handleSave = async () => {
    const risultato = `${updateScoreA.trim() || '0'}-${updateScoreB.trim() || '0'}`;

    const originalA = Array.isArray(match.marcatori_a)
      ? match.marcatori_a.join(', ')
      : typeof match.marcatori_a === 'string'
      ? match.marcatori_a
      : '';
    const originalB = Array.isArray(match.marcatori_b)
      ? match.marcatori_b.join(', ')
      : typeof match.marcatori_b === 'string'
      ? match.marcatori_b
      : '';

    const strScorersA = scorersAModified
      ? stringifyScorersWithMinutes(updateScorersA)
      : originalA;
    const strScorersB = scorersBModified
      ? stringifyScorersWithMinutes(updateScorersB)
      : originalB;

    await onSave({
      id: match.id,
      risultato,
      marcatori_a: strScorersA,
      marcatori_b: strScorersB,
      voti_giocatori: updateVoti,
      mvps: updateMVPs
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
        <h3>Aggiorna Risultato</h3>
        <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
          Modifica il risultato e i marcatori della partita
        </p>

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#9fd9b6',
                marginBottom: '0.4rem',
                textAlign: 'center'
              }}
            >
              {match.team_a_name}
            </span>
            <input
              type="number"
              min="0"
              value={updateScoreA}
              onChange={(e) => setUpdateScoreA(e.target.value)}
              style={{ width: '70px', textAlign: 'center', fontSize: '1.2rem', padding: '0.5rem' }}
              className="modal-input"
            />
          </div>
          <span
            style={{
              fontSize: '1.5rem',
              color: '#4f7560',
              alignSelf: 'flex-end',
              marginBottom: '0.5rem'
            }}
          >
            -
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#9fd9b6',
                marginBottom: '0.4rem',
                textAlign: 'center'
              }}
            >
              {match.team_b_name}
            </span>
            <input
              type="number"
              min="0"
              value={updateScoreB}
              onChange={(e) => setUpdateScoreB(e.target.value)}
              style={{ width: '70px', textAlign: 'center', fontSize: '1.2rem', padding: '0.5rem' }}
              className="modal-input"
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.4rem'
            }}
          >
            <label style={{ fontSize: '0.8rem', color: '#6f9c81' }}>
              Formazione e Voti {match.team_a_name}
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {match.team_a_players?.map((player) => {
              const mode = goalMode[player] || 'G';
              const targetTeam = mode === 'G' ? 'A' : 'B';
              const targetMap = targetTeam === 'A' ? updateScorersA : updateScorersB;
              let playerKey = player;
              if (mode === 'AG') {
                if (targetMap[`Autogol ${player}`]) {
                  playerKey = `Autogol ${player}`;
                } else {
                  playerKey = `${player} (AG)`;
                }
              }
              const count = (targetMap[playerKey] || []).length;
              const vote = updateVoti[player] !== undefined ? updateVoti[player] : 6;
              return (
                <div
                  key={player}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.9rem',
                      color: '#cfe8d8',
                      fontWeight: 500,
                      width: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {player}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      flexWrap: 'wrap',
                      gap: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#9fd9b6', marginRight: '2px' }}>
                        Voto
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateVoteModal(player, -0.5)}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          color: 'white',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          padding: '0 6px',
                          fontSize: '1rem'
                        }}
                      >
                        -
                      </button>
                      <span
                        style={{
                          minWidth: '24px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          color: getVoteColor(vote)
                        }}
                      >
                        {vote === 0 ? 's.v.' : vote}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateVoteModal(player, 0.5)}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          color: 'white',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          padding: '0 6px',
                          fontSize: '1rem'
                        }}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetVoteSV(player)}
                        style={{
                          background:
                            vote === 's.v.' || vote === 0 ? '#34d680' : 'rgba(255,255,255,0.1)',
                          border: 'none',
                          color: vote === 's.v.' || vote === 0 ? '#0a1922' : 'white',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          marginLeft: '4px'
                        }}
                      >
                        SV
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '2px', marginBottom: '2px' }}>
                        <button
                          type="button"
                          onClick={() => setGoalMode({ ...goalMode, [player]: 'G' })}
                          style={{
                            fontSize: '0.6rem',
                            padding: '1px 4px',
                            borderRadius: '4px',
                            border: '1px solid #9fd9b6',
                            background: mode === 'G' ? '#9fd9b6' : 'transparent',
                            color: mode === 'G' ? '#0a1922' : '#9fd9b6',
                            cursor: 'pointer'
                          }}
                        >
                          G
                        </button>
                        <button
                          type="button"
                          onClick={() => setGoalMode({ ...goalMode, [player]: 'AG' })}
                          style={{
                            fontSize: '0.6rem',
                            padding: '1px 4px',
                            borderRadius: '4px',
                            border: '1px solid #ff6b6b',
                            background: mode === 'AG' ? '#ff6b6b' : 'transparent',
                            color: mode === 'AG' ? '#0a1922' : '#ff6b6b',
                            cursor: 'pointer'
                          }}
                        >
                          AG
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateGoal(targetTeam, playerKey, -1)}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            padding: '0 6px',
                            fontSize: '1rem'
                          }}
                        >
                          -
                        </button>
                        <span
                          style={{
                            width: '16px',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color:
                              count > 0 ? (mode === 'G' ? '#34d680' : '#ff6b6b') : '#cfe8d8'
                          }}
                        >
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateGoal(targetTeam, playerKey, 1)}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            padding: '0 6px',
                            fontSize: '1rem'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.4rem'
            }}
          >
            <label style={{ fontSize: '0.8rem', color: '#6f9c81' }}>
              Formazione e Voti {match.team_b_name}
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {match.team_b_players?.map((player) => {
              const mode = goalMode[player] || 'G';
              const targetTeam = mode === 'G' ? 'B' : 'A';
              const targetMap = targetTeam === 'B' ? updateScorersB : updateScorersA;
              let playerKey = player;
              if (mode === 'AG') {
                if (targetMap[`Autogol ${player}`]) {
                  playerKey = `Autogol ${player}`;
                } else {
                  playerKey = `${player} (AG)`;
                }
              }
              const count = (targetMap[playerKey] || []).length;
              const vote = updateVoti[player] !== undefined ? updateVoti[player] : 6;
              return (
                <div
                  key={player}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px'
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.9rem',
                      color: '#cfe8d8',
                      fontWeight: 500,
                      width: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {player}
                  </span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      flexWrap: 'wrap',
                      gap: '0.8rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#9fd9b6', marginRight: '2px' }}>
                        Voto
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateVoteModal(player, -0.5)}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          color: 'white',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          padding: '0 6px',
                          fontSize: '1rem'
                        }}
                      >
                        -
                      </button>
                      <span
                        style={{
                          minWidth: '24px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          color: getVoteColor(vote)
                        }}
                      >
                        {vote === 0 ? 's.v.' : vote}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateVoteModal(player, 0.5)}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          border: 'none',
                          color: 'white',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          padding: '0 6px',
                          fontSize: '1rem'
                        }}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetVoteSV(player)}
                        style={{
                          background:
                            vote === 's.v.' || vote === 0 ? '#34d680' : 'rgba(255,255,255,0.1)',
                          border: 'none',
                          color: vote === 's.v.' || vote === 0 ? '#0a1922' : 'white',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          marginLeft: '4px'
                        }}
                      >
                        SV
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '2px', marginBottom: '2px' }}>
                        <button
                          type="button"
                          onClick={() => setGoalMode({ ...goalMode, [player]: 'G' })}
                          style={{
                            fontSize: '0.6rem',
                            padding: '1px 4px',
                            borderRadius: '4px',
                            border: '1px solid #9fd9b6',
                            background: mode === 'G' ? '#9fd9b6' : 'transparent',
                            color: mode === 'G' ? '#0a1922' : '#9fd9b6',
                            cursor: 'pointer'
                          }}
                        >
                          G
                        </button>
                        <button
                          type="button"
                          onClick={() => setGoalMode({ ...goalMode, [player]: 'AG' })}
                          style={{
                            fontSize: '0.6rem',
                            padding: '1px 4px',
                            borderRadius: '4px',
                            border: '1px solid #ff6b6b',
                            background: mode === 'AG' ? '#ff6b6b' : 'transparent',
                            color: mode === 'AG' ? '#0a1922' : '#ff6b6b',
                            cursor: 'pointer'
                          }}
                        >
                          AG
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateGoal(targetTeam, playerKey, -1)}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            padding: '0 6px',
                            fontSize: '1rem'
                          }}
                        >
                          -
                        </button>
                        <span
                          style={{
                            width: '16px',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color:
                              count > 0 ? (mode === 'G' ? '#34d680' : '#ff6b6b') : '#cfe8d8'
                          }}
                        >
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateGoal(targetTeam, playerKey, 1)}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            padding: '0 6px',
                            fontSize: '1rem'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            marginBottom: '1.5rem',
            borderTop: '0.5px solid rgba(52, 214, 128, 0.16)',
            paddingTop: '1.2rem'
          }}
        >
          <label
            style={{
              display: 'block',
              marginBottom: '0.8rem',
              fontSize: '0.8rem',
              color: '#6f9c81',
              fontWeight: 600
            }}
          >
            Scegli MVP della partita
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {[...(match.team_a_players || []), ...(match.team_b_players || [])].map((player) => (
              <div
                key={`mvp-${player}`}
                onClick={() => handleToggleMVP(player)}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  background: updateMVPs.includes(player) ? '#ffd700' : 'rgba(255,255,255,0.05)',
                  color: updateMVPs.includes(player) ? '#0a1922' : '#cfe8d8',
                  border: updateMVPs.includes(player)
                    ? '1px solid #ffd700'
                    : '1px solid rgba(255,255,255,0.1)',
                  userSelect: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{player}</span>
                {updateMVPs.includes(player) && <span>🏅</span>}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <button
            className="secondary-btn"
            onClick={onDelete}
            style={{
              color: '#ff6b6b',
              borderColor: 'rgba(255, 107, 107, 0.3)',
              padding: '0.6rem 1rem'
            }}
          >
            <Trash2 size={16} style={{ display: 'inline', verticalAlign: '-3px', marginRight: '4px' }} />
            Elimina
          </button>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="secondary-btn" onClick={onClose}>
              Annulla
            </button>
            <button className="create-teams-btn" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
