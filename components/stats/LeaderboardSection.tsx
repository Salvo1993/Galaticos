'use client';

import React, { useState, useMemo } from 'react';
import { Medal, RotateCcw } from 'lucide-react';
import { Player, LeaderboardEntry } from '@/types';

export interface LeaderboardSectionProps {
  leaderboard: LeaderboardEntry[];
  isLoadingLeaderboard: boolean;
  fetchLeaderboard: () => void;
  showGuests: boolean;
  setShowGuests: (show: boolean) => void;
  dbPlayers: Player[];
  onOpenSfidaModal: () => void;
}

export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({
  leaderboard,
  isLoadingLeaderboard,
  fetchLeaderboard,
  showGuests,
  setShowGuests,
  dbPlayers,
  onOpenSfidaModal,
}) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getRoleAbbr = (r: string | undefined) => {
    if (!r) return '-';
    switch (r) {
      case 'Centrocampista Centrale':
      case 'Centrocampista':
        return 'CC';
      case 'Difensore Centrale':
      case 'Difensore':
        return 'DC';
      case 'Terzino Destro':
        return 'TD';
      case 'Terzino Sinistro':
        return 'TS';
      case 'Terzino':
        return 'TER';
      case 'Attaccante':
        return 'ATT';
      case 'Portiere':
        return 'POR';
      case 'Ala Sinistra':
        return 'AS';
      case 'Ala Destra':
        return 'AD';
      case 'Ala':
        return 'Ala';
      default:
        return r;
    }
  };

  const sortedLeaderboard = useMemo(() => {
    let sortableItems = [...leaderboard];
    if (!showGuests) {
      sortableItems = sortableItems.filter(item =>
        dbPlayers.some(p => p.Nome === item.nome)
      );
    }

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA: any = (a as any)[sortConfig.key];
        let valB: any = (b as any)[sortConfig.key];

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
  }, [leaderboard, sortConfig, showGuests, dbPlayers]);

  return (
    <>
      <section className="dashboard-card" id="classifica" style={{ marginTop: '2rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '0.5rem',
          }}
        >
          <h2 style={{ margin: 0 }}>
            <Medal
              size={20}
              style={{
                verticalAlign: '-3px',
                marginRight: '0.4rem',
                color: '#e8b339',
              }}
            />
            Classifica
          </h2>
          <button
            className="secondary-btn"
            onClick={fetchLeaderboard}
            disabled={isLoadingLeaderboard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem',
              padding: '0.4rem 0.9rem',
            }}
          >
            <RotateCcw size={14} className={isLoadingLeaderboard ? 'spin' : ''} />
            {isLoadingLeaderboard ? 'Aggiornamento...' : 'Aggiorna Classifica'}
          </button>
        </div>
        <p className="section-subtitle" style={{ marginBottom: '1rem' }}>
          Classifica individuale calcolata sui risultati delle partite in archivio.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() =>
              setSortConfig({ key: 'punti_assoluti', direction: 'desc' })
            }
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '20px',
              border: '1px solid #34d680',
              background:
                sortConfig?.key !== 'forma_punti' ? '#34d680' : 'transparent',
              color: sortConfig?.key !== 'forma_punti' ? '#0d1511' : '#34d680',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Generale
          </button>
          <button
            onClick={() =>
              setSortConfig({ key: 'forma_punti', direction: 'desc' })
            }
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '20px',
              border: '1px solid #34d680',
              background:
                sortConfig?.key === 'forma_punti' ? '#34d680' : 'transparent',
              color: sortConfig?.key === 'forma_punti' ? '#0d1511' : '#34d680',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Stato di Forma
          </button>
          <button
            onClick={onOpenSfidaModal}
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '20px',
              border: '1px solid #3da5f5',
              background: 'transparent',
              color: '#3da5f5',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            ⚔️ Sfida
          </button>
          <button
            onClick={() => setShowGuests(!showGuests)}
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '20px',
              border: '1px solid #6f9c81',
              background: showGuests
                ? 'transparent'
                : 'rgba(111, 156, 129, 0.15)',
              color: '#6f9c81',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              marginLeft: 'auto',
            }}
          >
            {showGuests ? '- Nascondi Guest' : '+ Guest'}
          </button>
        </div>

        {isLoadingLeaderboard ? (
          <div
            style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#6f9c81',
            }}
          >
            Caricamento classifica...
          </div>
        ) : leaderboard.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#6f9c81',
            }}
          >
            Nessun dato disponibile per la classifica.
          </div>
        ) : (
          <div
            style={{
              overflowX: 'auto',
              borderRadius: '12px',
              border: '1px solid rgba(52, 214, 128, 0.16)',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'rgba(52, 214, 128, 0.08)',
                    borderBottom: '1px solid rgba(52, 214, 128, 0.16)',
                  }}
                >
                  <th
                    style={{
                      padding: '0.8rem',
                      textAlign: 'left',
                      color: '#9fd9b6',
                      fontWeight: 600,
                    }}
                  >
                    Pos
                  </th>
                  <th
                    style={{
                      padding: '0.8rem',
                      textAlign: 'left',
                      color: '#9fd9b6',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => requestSort('nome')}
                  >
                    Nome{' '}
                    {sortConfig?.key === 'nome'
                      ? sortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '0.8rem',
                      textAlign: 'center',
                      color: '#9fd9b6',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => requestSort('punti_assoluti')}
                  >
                    Punti{' '}
                    {sortConfig?.key === 'punti_assoluti'
                      ? sortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '0.8rem',
                      textAlign: 'center',
                      color: '#9fd9b6',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => requestSort('partite_giocate')}
                  >
                    Giocate{' '}
                    {sortConfig?.key === 'partite_giocate'
                      ? sortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '0.8rem',
                      textAlign: 'center',
                      color: '#9fd9b6',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => requestSort('vittorie')}
                  >
                    V{' '}
                    {sortConfig?.key === 'vittorie'
                      ? sortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '0.8rem',
                      textAlign: 'center',
                      color: '#9fd9b6',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => requestSort('pareggi')}
                  >
                    P{' '}
                    {sortConfig?.key === 'pareggi'
                      ? sortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '0.8rem',
                      textAlign: 'center',
                      color: '#9fd9b6',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => requestSort('sconfitte')}
                  >
                    S{' '}
                    {sortConfig?.key === 'sconfitte'
                      ? sortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '0.8rem',
                      textAlign: 'center',
                      color: '#9fd9b6',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => requestSort('media_voto')}
                  >
                    Media Voto{' '}
                    {sortConfig?.key === 'media_voto'
                      ? sortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '0.8rem',
                      textAlign: 'center',
                      color: '#9fd9b6',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => requestSort('mvp_count')}
                  >
                    MVP 🏅{' '}
                    {sortConfig?.key === 'mvp_count'
                      ? sortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '0.8rem',
                      textAlign: 'center',
                      color: '#9fd9b6',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => requestSort('pt_partita')}
                  >
                    Pt/Partita{' '}
                    {sortConfig?.key === 'pt_partita'
                      ? sortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '0.8rem',
                      textAlign: 'center',
                      color: '#9fd9b6',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => requestSort('gol_fatti')}
                  >
                    Gol{' '}
                    {sortConfig?.key === 'gol_fatti'
                      ? sortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '0.8rem',
                      textAlign: 'center',
                      color: '#9fd9b6',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => requestSort('ruolo')}
                  >
                    Ruolo{' '}
                    {sortConfig?.key === 'ruolo'
                      ? sortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '0.8rem',
                      textAlign: 'center',
                      color: '#9fd9b6',
                      fontWeight: 600,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => requestSort('forma_punti')}
                  >
                    Forma{' '}
                    {sortConfig?.key === 'forma_punti'
                      ? sortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedLeaderboard.map((row, index) => {
                  const playerRole = dbPlayers.find(
                    p => p.Nome === row.nome
                  )?.Ruolo;
                  const isFormMode = sortConfig?.key === 'forma_punti';

                  let dispPunti = row.punti_assoluti;
                  let dispGiocate = row.partite_giocate;
                  let dispV = row.vittorie ?? 0;
                  let dispP = row.pareggi ?? 0;
                  let dispS = row.sconfitte ?? 0;
                  let dispPtPartita =
                    typeof row.pt_partita === 'number'
                      ? row.pt_partita
                      : parseFloat((row.pt_partita as any) || '0');

                  if (isFormMode && row.forma) {
                    const letters = row.forma.split('-').filter(Boolean);
                    dispPunti = row.forma_punti || 0;
                    dispGiocate = letters.length;
                    dispV = letters.filter((l: string) => l === 'V').length;
                    dispP = letters.filter((l: string) => l === 'N').length;
                    dispS = letters.filter((l: string) => l === 'P').length;
                    dispPtPartita =
                      dispGiocate > 0 ? dispPunti / dispGiocate : 0;
                  }

                  return (
                    <tr
                      key={row.nome}
                      style={{
                        borderBottom:
                          index < sortedLeaderboard.length - 1
                            ? '1px solid rgba(52, 214, 128, 0.08)'
                            : 'none',
                        background:
                          index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.2)',
                      }}
                    >
                      <td
                        style={{
                          padding: '0.8rem',
                          textAlign: 'left',
                          color: '#cfe8d8',
                          fontWeight: index < 3 ? 'bold' : 'normal',
                        }}
                      >
                        {index === 0
                          ? '🥇'
                          : index === 1
                          ? '🥈'
                          : index === 2
                          ? '🥉'
                          : `${index + 1}°`}
                      </td>
                      <td
                        style={{
                          padding: '0.8rem',
                          textAlign: 'left',
                          color: '#cfe8d8',
                          fontWeight: 600,
                        }}
                      >
                        {row.nome}
                      </td>
                      <td
                        style={{
                          padding: '0.8rem',
                          textAlign: 'center',
                          color: '#e8b339',
                          fontWeight: 'bold',
                        }}
                      >
                        {dispPunti}
                      </td>
                      <td
                        style={{
                          padding: '0.8rem',
                          textAlign: 'center',
                          color: '#cfe8d8',
                        }}
                      >
                        {dispGiocate}
                      </td>
                      <td
                        style={{
                          padding: '0.8rem',
                          textAlign: 'center',
                          color: '#81c784',
                        }}
                      >
                        {dispV}
                      </td>
                      <td
                        style={{
                          padding: '0.8rem',
                          textAlign: 'center',
                          color: '#e0e0e0',
                        }}
                      >
                        {dispP}
                      </td>
                      <td
                        style={{
                          padding: '0.8rem',
                          textAlign: 'center',
                          color: '#e57373',
                        }}
                      >
                        {dispS}
                      </td>
                      <td
                        style={{
                          padding: '0.8rem',
                          textAlign: 'center',
                          color: '#f39c12',
                          fontWeight: 'bold',
                        }}
                      >
                        {row.media_voto && row.media_voto > 0
                          ? row.media_voto.toFixed(2)
                          : '-'}
                      </td>
                      <td
                        style={{
                          padding: '0.8rem',
                          textAlign: 'center',
                          color: '#FFD700',
                          fontWeight: 'bold',
                        }}
                      >
                        {(row.mvp_count || 0) > 0 ? row.mvp_count : '-'}
                      </td>
                      <td
                        style={{
                          padding: '0.8rem',
                          textAlign: 'center',
                          color: '#cfe8d8',
                        }}
                      >
                        {dispPtPartita.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: '0.8rem',
                          textAlign: 'center',
                          color: '#cfe8d8',
                        }}
                      >
                        {row.gol_fatti}
                      </td>
                      <td
                        style={{
                          padding: '0.8rem',
                          textAlign: 'center',
                          color: '#6f9c81',
                          fontSize: '0.8rem',
                        }}
                      >
                        {getRoleAbbr(playerRole)}
                      </td>
                      <td
                        style={{
                          padding: '0.8rem',
                          textAlign: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          letterSpacing: '1px',
                        }}
                      >
                        {(() => {
                          let details: any[] = [];
                          try {
                            if (row.forma_dettagli) {
                              details =
                                typeof row.forma_dettagli === 'string'
                                  ? JSON.parse(row.forma_dettagli)
                                  : row.forma_dettagli;
                            }
                          } catch (e) {}

                          return (row.forma || '')
                            .split('-')
                            .map((letter: string, idx: number) => {
                              if (!letter) return null;
                              const bColor =
                                letter === 'V'
                                  ? '#81c784'
                                  : letter === 'N'
                                  ? '#e0e0e0'
                                  : '#e57373';

                              let hoverText = 'Nessun dettaglio';
                              if (details[idx]) {
                                const d = details[idx];
                                hoverText = `${d.data} - Risultato: ${d.risultato}`;
                              }

                              return (
                                <span
                                  key={idx}
                                  title={hoverText}
                                  style={{
                                    color: bColor,
                                    margin: '0 2px',
                                    cursor: 'help',
                                  }}
                                >
                                  {letter}
                                </span>
                              );
                            });
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboard-card" id="mvp" style={{ marginTop: '2rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginBottom: '0.5rem',
          }}
        >
          <h2 style={{ margin: 0 }}>
            <Medal
              size={20}
              style={{
                verticalAlign: '-3px',
                marginRight: '0.4rem',
                color: '#FFD700',
              }}
            />
            Classifica MVP
          </h2>
        </div>
        <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
          I migliori giocatori per numero di MVP conquistati.
        </p>

        {isLoadingLeaderboard ? (
          <div
            style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#6f9c81',
            }}
          >
            Caricamento classifica...
          </div>
        ) : leaderboard.filter(r => (r.mvp_count || 0) > 0).length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#6f9c81',
            }}
          >
            Nessun MVP assegnato finora.
          </div>
        ) : (
          <div
            style={{
              overflowX: 'auto',
              borderRadius: '12px',
              border: '1px solid rgba(255, 215, 0, 0.16)',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: 'rgba(255, 215, 0, 0.08)',
                    borderBottom: '1px solid rgba(255, 215, 0, 0.16)',
                  }}
                >
                  <th
                    style={{
                      padding: '0.8rem',
                      textAlign: 'left',
                      color: '#FFD700',
                      fontWeight: 600,
                    }}
                  >
                    Pos
                  </th>
                  <th
                    style={{
                      padding: '0.8rem',
                      textAlign: 'left',
                      color: '#FFD700',
                      fontWeight: 600,
                    }}
                  >
                    Nome
                  </th>
                  <th
                    style={{
                      padding: '0.8rem',
                      textAlign: 'center',
                      color: '#FFD700',
                      fontWeight: 600,
                    }}
                  >
                    MVP 🏅
                  </th>
                  <th
                    style={{
                      padding: '0.8rem',
                      textAlign: 'center',
                      color: '#FFD700',
                      fontWeight: 600,
                    }}
                  >
                    Media Voto
                  </th>
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
                    <tr
                      key={row.nome}
                      style={{
                        borderBottom:
                          index < arr.length - 1
                            ? '1px solid rgba(255, 215, 0, 0.08)'
                            : 'none',
                        background:
                          index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.2)',
                      }}
                    >
                      <td
                        style={{
                          padding: '0.8rem',
                          textAlign: 'left',
                          color: '#cfe8d8',
                          fontWeight: index < 3 ? 'bold' : 'normal',
                        }}
                      >
                        {index === 0
                          ? '🥇'
                          : index === 1
                          ? '🥈'
                          : index === 2
                          ? '🥉'
                          : `${index + 1}°`}
                      </td>
                      <td
                        style={{
                          padding: '0.8rem',
                          textAlign: 'left',
                          color: '#cfe8d8',
                          fontWeight: 600,
                        }}
                      >
                        {row.nome}
                      </td>
                      <td
                        style={{
                          padding: '0.8rem',
                          textAlign: 'center',
                          color: '#FFD700',
                          fontWeight: 'bold',
                        }}
                      >
                        {row.mvp_count}
                      </td>
                      <td
                        style={{
                          padding: '0.8rem',
                          textAlign: 'center',
                          color: '#f39c12',
                          fontWeight: 'bold',
                        }}
                      >
                        {row.media_voto ? row.media_voto.toFixed(2) : '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
};
