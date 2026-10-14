'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Player, LeaderboardEntry, AlgoSettings } from '@/types';

export interface AlgoSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  matchFormat: number;
  selectedPlayers: string[];
  dbPlayers: Player[];
  leaderboard: LeaderboardEntry[];
  statsData: any[];
  algoSettings: AlgoSettings;
  setAlgoSettings: React.Dispatch<React.SetStateAction<AlgoSettings>>;
  algoTab: 'pesi' | 'parametri';
  setAlgoTab: (tab: 'pesi' | 'parametri') => void;
  ovrModifiers: Record<string, number>;
  setOvrModifiers: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  getRating: (name: string, withModifier?: boolean) => number;
  getSimulatedTeams: () => {
    teamA: string[];
    teamB: string[];
    ratingSumA: number;
    ratingSumB: number;
    diff: number;
  } | null;
  onSaveAlgoSettings: () => void;
  onResetAlgoSettings: () => void;
}

export default function AlgoSettingsModal({
  isOpen,
  onClose,
  isAdmin,
  matchFormat,
  selectedPlayers,
  dbPlayers,
  leaderboard,
  statsData,
  algoSettings,
  setAlgoSettings,
  algoTab,
  setAlgoTab,
  ovrModifiers,
  setOvrModifiers,
  getRating,
  getSimulatedTeams,
  onSaveAlgoSettings,
  onResetAlgoSettings
}: AlgoSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 1000,
        alignItems: 'flex-start',
        paddingTop: 'max(2rem, 5vh)',
        paddingBottom: '2rem'
      }}
    >
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '720px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.2rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: '#3da5f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚙️ Algoritmo & Pesi Giocatori
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>
              Formato attivo: Calcio a {matchFormat} ({matchFormat * 2} giocatori)
            </span>
          </div>
          <button className="secondary-btn" style={{ padding: '0.2rem', display: 'flex' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '1.2rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '0.6rem'
          }}
        >
          <button
            type="button"
            onClick={() => setAlgoTab('pesi')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: algoTab === 'pesi' ? 'rgba(61, 165, 245, 0.2)' : 'transparent',
              color: algoTab === 'pesi' ? '#3da5f5' : '#888',
              fontWeight: algoTab === 'pesi' ? 700 : 500,
              cursor: 'pointer',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: algoTab === 'pesi' ? '2px solid #3da5f5' : '2px solid transparent'
            }}
          >
            ⚖️ Pesi Giocatori ({selectedPlayers.filter(Boolean).length}/{matchFormat * 2})
          </button>
          <button
            type="button"
            onClick={() => setAlgoTab('parametri')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              background: algoTab === 'parametri' ? 'rgba(61, 165, 245, 0.2)' : 'transparent',
              color: algoTab === 'parametri' ? '#3da5f5' : '#888',
              fontWeight: algoTab === 'parametri' ? 700 : 500,
              cursor: 'pointer',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: algoTab === 'parametri' ? '2px solid #3da5f5' : '2px solid transparent'
            }}
          >
            ⚙️ Parametri & Formule
          </button>
        </div>

        {algoTab === 'pesi' && (() => {
          const validPlayers = selectedPlayers.filter(Boolean);
          const playersToShow =
            validPlayers.length > 0
              ? [...validPlayers].sort((a, b) => getRating(b) - getRating(a))
              : [...dbPlayers].map(p => p.Nome).sort((a, b) => getRating(b) - getRating(a));

          const sim = getSimulatedTeams();

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Banner Informativo */}
              <div
                style={{
                  background:
                    matchFormat === 8 ? 'rgba(255, 183, 3, 0.08)' : 'rgba(61, 165, 245, 0.08)',
                  border: `1px solid ${
                    matchFormat === 8 ? 'rgba(255, 183, 3, 0.3)' : 'rgba(61, 165, 245, 0.25)'
                  }`,
                  borderRadius: '8px',
                  padding: '0.85rem',
                  fontSize: '0.82rem',
                  color: '#ddd',
                  lineHeight: 1.5
                }}
              >
                {matchFormat === 8 ? (
                  <>
                    <strong style={{ color: '#ffb703', display: 'block', marginBottom: '4px' }}>
                      📌 Nota Partita a Campo a 8 (16 Giocatori)
                    </strong>
                    Non essendo presente uno storico di partite a campo a 8, le previsioni di risultato (1-X-2) sono disabilitate in UI. Qui sotto puoi esaminare i <strong>pesi individuali calcolati dall&apos;algoritmo</strong> per ciascuno dei 16 giocatori (basati su media voto, win rate, gol e MVP) e la <strong>simulazione del bilanciamento</strong> per decidere se affidarti all&apos;algoritmo per creare le squadre o procedere manualmente.
                  </>
                ) : (
                  <>
                    <strong style={{ color: '#3da5f5', display: 'block', marginBottom: '4px' }}>
                      📌 Graduatoria Pesi Algoritmo (Calcio a {matchFormat})
                    </strong>
                    Visualizza i pesi calcolati dall&apos;algoritmo per ciascun giocatore selezionato. Puoi applicare handicap manuali (+/-) per affinare il bilanciamento.
                  </>
                )}
              </div>

              {validPlayers.length < matchFormat * 2 && (
                <div
                  style={{
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    color: '#f0ad4e',
                    background: 'rgba(240, 173, 78, 0.1)',
                    padding: '0.5rem',
                    borderRadius: '6px'
                  }}
                >
                  ⚠️ Selezionati {validPlayers.length} su {matchFormat * 2} giocatori nella griglia principale.
                  {validPlayers.length === 0 && ' Mostro i pesi di tutti i giocatori registrati.'}
                </div>
              )}

              {/* Elenco Pesi Giocatori */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  maxHeight: '380px',
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}
              >
                {playersToShow.map((p, idx) => {
                  const dbP = dbPlayers.find(x => x.Nome === p);
                  const l = leaderboard.find(x => x.nome === p);
                  const s = statsData.find(x => x.name === p);

                  const baseVoto = l && l.media_voto > 0 ? l.media_voto : 6.0;
                  const partite = l?.partite_giocate || 0;
                  const winRate = partite > 0 && l ? Math.round((l.vittorie / partite) * 100) : 50;

                  const off = s && s.partiteGiocate > 0 ? s.golFattiSquadra / s.partiteGiocate : 0;
                  const dif = s && s.partiteGiocate > 0 ? s.golSubitiSquadra / s.partiteGiocate : 0;
                  const diffGol = (off - dif).toFixed(1);
                  const mvp = l?.mvp_count || 0;
                  const role = dbP?.Ruolo || 'Jolly';

                  const baseRating = getRating(p, false);
                  const currentMod = ovrModifiers[p] || 0;
                  const totalRating = (baseRating + currentMod).toFixed(1);

                  return (
                    <div
                      key={p}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255,255,255,0.04)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          minWidth: '180px',
                          flex: '1 1 auto'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#888',
                            minWidth: '22px'
                          }}
                        >
                          {idx + 1}°
                        </span>
                        <div>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: '0.9rem',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>{p}</span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background:
                                  role.includes('Difensor') || role.includes('Terzino')
                                    ? 'rgba(52, 152, 219, 0.2)'
                                    : role.includes('Attaccan') || role.includes('Punta')
                                    ? 'rgba(231, 76, 60, 0.2)'
                                    : role.includes('Portiere')
                                    ? 'rgba(243, 156, 18, 0.2)'
                                    : 'rgba(46, 204, 113, 0.2)',
                                color:
                                  role.includes('Difensor') || role.includes('Terzino')
                                    ? '#3498db'
                                    : role.includes('Attaccan') || role.includes('Punta')
                                    ? '#e74c3c'
                                    : role.includes('Portiere')
                                    ? '#f39c12'
                                    : '#2ecc71',
                                fontWeight: 600
                              }}
                            >
                              {role}
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                              fontSize: '0.72rem',
                              color: '#aaa',
                              marginTop: '2px'
                            }}
                          >
                            <span title="Media Voto">⭐ {baseVoto.toFixed(2)}</span>
                            <span title="Win Rate">📈 {winRate}%</span>
                            <span title="Diff Gol Media">
                              ⚽ {Number(diffGol) >= 0 ? '+' : ''}
                              {diffGol}
                            </span>
                            {mvp > 0 && (
                              <span title="MVP Totali" style={{ color: '#ffd700' }}>
                                🏅 {mvp}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Handicap modifier */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() =>
                              setOvrModifiers({ ...ovrModifiers, [p]: currentMod - 5 })
                            }
                            style={{
                              background: '#f55',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              width: '22px',
                              height: '22px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.85rem'
                            }}
                            title="Riduci handicap (-5)"
                          >
                            -
                          </button>
                          <span
                            style={{
                              color:
                                currentMod !== 0
                                  ? currentMod > 0
                                    ? '#34d680'
                                    : '#f55'
                                  : '#888',
                              width: '28px',
                              textAlign: 'center',
                              fontSize: '0.8rem',
                              fontWeight: 700
                            }}
                          >
                            {currentMod > 0 ? `+${currentMod}` : currentMod}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setOvrModifiers({ ...ovrModifiers, [p]: currentMod + 5 })
                            }
                            style={{
                              background: '#34d680',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              width: '22px',
                              height: '22px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.85rem'
                            }}
                            title="Aumenta handicap (+5)"
                          >
                            +
                          </button>
                        </div>

                        {/* Peso Totale */}
                        <div style={{ textAlign: 'right', minWidth: '55px' }}>
                          <div style={{ fontSize: '0.68rem', color: '#888', textTransform: 'uppercase' }}>
                            Peso
                          </div>
                          <span
                            style={{
                              fontSize: '1.05rem',
                              fontWeight: 800,
                              color:
                                currentMod > 0
                                  ? '#34d680'
                                  : currentMod < 0
                                  ? '#f55'
                                  : '#3da5f5'
                            }}
                          >
                            {totalRating}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Simulazione Squadre Algoritmo */}
              {sim && (
                <div
                  style={{
                    background: 'rgba(61, 165, 245, 0.06)',
                    border: '1px solid rgba(61, 165, 245, 0.25)',
                    borderRadius: '8px',
                    padding: '0.85rem'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.6rem',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}
                  >
                    <strong style={{ color: '#3da5f5', fontSize: '0.9rem' }}>
                      🤖 Proposta Bilanciamento Squadre (Calcio a {matchFormat})
                    </strong>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background:
                          sim.diff <= 2
                            ? 'rgba(52, 214, 128, 0.15)'
                            : 'rgba(240, 173, 78, 0.15)',
                        color: sim.diff <= 2 ? '#34d680' : '#f0ad4e',
                        fontWeight: 700
                      }}
                    >
                      Delta Pesi: {sim.diff.toFixed(1)} pt (
                      {sim.diff <= 2 ? 'Bilanciamento Ottimale' : 'Scarto accettabile'})
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: '0.75rem'
                    }}
                  >
                    {/* Squadra A */}
                    <div
                      style={{
                        background: 'rgba(30, 144, 255, 0.08)',
                        borderRadius: '6px',
                        padding: '0.6rem',
                        borderTop: '2px solid #1e90ff'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.4rem',
                          fontSize: '0.82rem'
                        }}
                      >
                        <strong style={{ color: '#5de4ff' }}>SQUADRA A ({sim.teamA.length})</strong>
                        <span style={{ color: '#5de4ff', fontWeight: 700 }}>
                          Peso Tot: {sim.ratingSumA.toFixed(1)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                          fontSize: '0.78rem'
                        }}
                      >
                        {sim.teamA.map(p => (
                          <div
                            key={p}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              color: '#ccc'
                            }}
                          >
                            <span>{p}</span>
                            <span style={{ fontWeight: 600, color: '#8ec5fc' }}>
                              {getRating(p).toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Squadra B */}
                    <div
                      style={{
                        background: 'rgba(255, 204, 0, 0.08)',
                        borderRadius: '6px',
                        padding: '0.6rem',
                        borderTop: '2px solid #ffcc00'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '0.4rem',
                          fontSize: '0.82rem'
                        }}
                      >
                        <strong style={{ color: '#ffcc00' }}>SQUADRA B ({sim.teamB.length})</strong>
                        <span style={{ color: '#ffcc00', fontWeight: 700 }}>
                          Peso Tot: {sim.ratingSumB.toFixed(1)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                          fontSize: '0.78rem'
                        }}
                      >
                        {sim.teamB.map(p => (
                          <div
                            key={p}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              color: '#ccc'
                            }}
                          >
                            <span>{p}</span>
                            <span style={{ fontWeight: 600, color: '#ffe066' }}>
                              {getRating(p).toFixed(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {algoTab === 'parametri' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              >
                <span>🏆 Media Voto</span>
                <span style={{ fontWeight: 'bold', color: '#34d680' }}>{algoSettings.wVoto}</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={algoSettings.wVoto}
                onChange={e =>
                  setAlgoSettings({ ...algoSettings, wVoto: parseInt(e.target.value) })
                }
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              >
                <span>📈 Win Rate Storico</span>
                <span style={{ fontWeight: 'bold', color: '#34d680' }}>
                  {algoSettings.wWinRate}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={algoSettings.wWinRate}
                onChange={e =>
                  setAlgoSettings({ ...algoSettings, wWinRate: parseInt(e.target.value) })
                }
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              >
                <span>⚽ Rapporto Gol Fatti/Subiti</span>
                <span style={{ fontWeight: 'bold', color: '#34d680' }}>
                  {algoSettings.wGolRatio}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={algoSettings.wGolRatio}
                onChange={e =>
                  setAlgoSettings({ ...algoSettings, wGolRatio: parseInt(e.target.value) })
                }
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              >
                <span>⭐ MVP Ratio</span>
                <span style={{ fontWeight: 'bold', color: '#34d680' }}>{algoSettings.wMvp}</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={algoSettings.wMvp}
                onChange={e =>
                  setAlgoSettings({ ...algoSettings, wMvp: parseInt(e.target.value) })
                }
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '10px',
                background: 'rgba(61, 165, 245, 0.1)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(61, 165, 245, 0.3)'
              }}
            >
              <input
                type="checkbox"
                id="balanceRoles"
                checked={algoSettings.balanceRoles}
                onChange={e =>
                  setAlgoSettings({ ...algoSettings, balanceRoles: e.target.checked })
                }
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <label
                htmlFor="balanceRoles"
                style={{
                  fontWeight: 'bold',
                  color: '#3da5f5',
                  cursor: 'pointer',
                  margin: 0,
                  fontSize: '0.95rem'
                }}
              >
                Bilancia Ruoli & Ali (Jolly)
              </label>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {isAdmin && algoTab === 'parametri' && (
            <button
              className="admin-button"
              onClick={onSaveAlgoSettings}
              style={{
                flex: 1,
                minWidth: '120px',
                padding: '0.8rem',
                background: '#34d680',
                color: '#000',
                fontWeight: 'bold'
              }}
            >
              Salva Impostazioni
            </button>
          )}
          {isAdmin && algoTab === 'parametri' && (
            <button
              className="admin-button"
              onClick={onResetAlgoSettings}
              style={{
                flex: 1,
                minWidth: '160px',
                padding: '0.8rem',
                background: '#f0ad4e',
                color: '#000',
                fontWeight: 'bold'
              }}
            >
              Ripristina Default
            </button>
          )}
          <button
            className="secondary-btn"
            style={{ flex: 1, padding: '0.8rem' }}
            onClick={onClose}
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
