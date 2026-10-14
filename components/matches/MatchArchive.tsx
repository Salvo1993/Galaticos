'use client';

import React, { useState, useMemo } from 'react';
import { Trophy, Calendar, ChevronDown, Medal, Copy, Pencil, Trash2 } from 'lucide-react';
import { MatchResult, Player, MediaItem } from '@/types';
import { getVoteColor } from '@/lib/stats/match-utils';

export interface MatchArchiveProps {
  matches: MatchResult[];
  dbPlayers: Player[];
  theme?: string;
  isAdmin: boolean;
  mediaItems: MediaItem[];
  historicalPredictions: { preds: Record<number, { correct: boolean }> };
  onOpenUpdateModal: (match: MatchResult) => void;
  onOpenDeleteModal: (match: MatchResult) => void;
  onCopyMedia: (match: MatchResult) => void;
}

const formatResultDate = (isoString: string) => {
  const d = new Date(isoString);
  const formatter = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  return formatter.format(d);
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

export default function MatchArchive({
  matches,
  dbPlayers,
  theme = 'dark',
  isAdmin,
  mediaItems,
  historicalPredictions,
  onOpenUpdateModal,
  onOpenDeleteModal,
  onCopyMedia
}: MatchArchiveProps) {
  const [archiveMonthFilter, setArchiveMonthFilter] = useState('');
  const [archiveYearFilter, setArchiveYearFilter] = useState('');
  const [archivePlayerFilter, setArchivePlayerFilter] = useState('');
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<'month' | 'year' | 'player' | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);

  const filteredArchiveMatches = useMemo(() => {
    return matches.filter((m) => {
      const date = new Date(m.data);
      const mMonth = date.toLocaleDateString('it-IT', { month: 'long' }).toLowerCase();
      const mYear = date.getFullYear().toString();

      const pF = archivePlayerFilter.toLowerCase().trim();
      const monthF = archiveMonthFilter.toLowerCase().trim();
      const yearF = archiveYearFilter.trim();

      if (monthF && !mMonth.includes(monthF)) return false;
      if (yearF && mYear !== yearF) return false;

      if (pF) {
        const matchPlayers = [
          ...(m.team_a_players || []),
          ...(m.team_b_players || [])
        ].map((p: string) => p.toLowerCase());

        if (!matchPlayers.some((p) => p.includes(pF))) return false;
      }

      return true;
    });
  }, [matches, archiveMonthFilter, archiveYearFilter, archivePlayerFilter]);

  return (
    <section className="archive-typography" id="archivio">
      <h2>
        <Trophy size={20} style={{ verticalAlign: '-3px', marginRight: '0.4rem', color: '#e8b339' }} />
        Archivio Partite
      </h2>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 120px' }}>
          <input
            type="text"
            placeholder="Mese (es. Giugno)"
            value={archiveMonthFilter}
            onChange={(e) => setArchiveMonthFilter(e.target.value)}
            onFocus={() => setActiveFilterDropdown('month')}
            onBlur={() => setTimeout(() => setActiveFilterDropdown(null), 200)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              outline: 'none',
              fontSize: '0.9rem',
              colorScheme: theme
            }}
          />
          {activeFilterDropdown === 'month' && (
            <div
              className="dropdown-panel"
              style={{
                zIndex: 100,
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '100%',
                maxHeight: '200px',
                overflowY: 'auto',
                marginTop: '4px'
              }}
            >
              {[
                'Gennaio',
                'Febbraio',
                'Marzo',
                'Aprile',
                'Maggio',
                'Giugno',
                'Luglio',
                'Agosto',
                'Settembre',
                'Ottobre',
                'Novembre',
                'Dicembre'
              ]
                .filter((m) => m.toLowerCase().includes(archiveMonthFilter.toLowerCase()))
                .map((m) => (
                  <div
                    key={m}
                    className="dropdown-option"
                    onClick={() => {
                      setArchiveMonthFilter(m);
                      setActiveFilterDropdown(null);
                    }}
                  >
                    {m}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div style={{ position: 'relative', flex: '1 1 100px' }}>
          <input
            type="text"
            placeholder="Anno (es. 2026)"
            value={archiveYearFilter}
            onChange={(e) => setArchiveYearFilter(e.target.value)}
            onFocus={() => setActiveFilterDropdown('year')}
            onBlur={() => setTimeout(() => setActiveFilterDropdown(null), 200)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              outline: 'none',
              fontSize: '0.9rem',
              colorScheme: theme
            }}
          />
          {activeFilterDropdown === 'year' && (
            <div
              className="dropdown-panel"
              style={{
                zIndex: 100,
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '100%',
                maxHeight: '200px',
                overflowY: 'auto',
                marginTop: '4px'
              }}
            >
              {Array.from(new Set(matches.map((m) => new Date(m.data).getFullYear())))
                .sort((a, b) => b - a)
                .filter((y) => y.toString().includes(archiveYearFilter.trim()))
                .map((y) => (
                  <div
                    key={y}
                    className="dropdown-option"
                    onClick={() => {
                      setArchiveYearFilter(y.toString());
                      setActiveFilterDropdown(null);
                    }}
                  >
                    {y}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div style={{ position: 'relative', flex: '1 1 120px' }}>
          <input
            type="text"
            placeholder="Giocatore (es. Mattia)"
            value={archivePlayerFilter}
            onChange={(e) => setArchivePlayerFilter(e.target.value)}
            onFocus={() => setActiveFilterDropdown('player')}
            onBlur={() => setTimeout(() => setActiveFilterDropdown(null), 200)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              outline: 'none',
              fontSize: '0.9rem',
              colorScheme: theme
            }}
          />
          {activeFilterDropdown === 'player' && (
            <div
              className="dropdown-panel"
              style={{
                zIndex: 100,
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '100%',
                maxHeight: '200px',
                overflowY: 'auto',
                marginTop: '4px'
              }}
            >
              {dbPlayers &&
                [...dbPlayers]
                  .sort((a, b) => a.Nome.localeCompare(b.Nome))
                  .filter((p) =>
                    p.Nome.toLowerCase().includes(archivePlayerFilter.toLowerCase().trim())
                  )
                  .map((p) => (
                    <div
                      key={p.Nome}
                      className="dropdown-option"
                      onClick={() => {
                        setArchivePlayerFilter(p.Nome);
                        setActiveFilterDropdown(null);
                      }}
                    >
                      {p.Nome}
                    </div>
                  ))}
            </div>
          )}
        </div>
      </div>

      {filteredArchiveMatches.length === 0 ? (
        <p className="section-subtitle">Nessuna partita trovata</p>
      ) : (
        <div className="matches-list">
          {filteredArchiveMatches.map((m) => {
            const isExpanded = expandedMatchId === m.id;
            const isLightOnA = (m.maglia_chiara || 'A') === 'A';
            const scorersA = normalizeScorers(m.marcatori_a);
            const scorersB = normalizeScorers(m.marcatori_b);
            const [scoreA, scoreB] = (m.risultato || '0-0').split('-').map((s) => s.trim());

            const mDate = new Date(m.data);
            const isInterruptedMatch =
              mDate.getDate() === 8 &&
              mDate.getMonth() === 6 &&
              mDate.getFullYear() === 2026 &&
              m.ora &&
              m.ora.startsWith('21');

            return (
              <div
                key={m.id}
                className={`match-card ${isExpanded ? 'expanded' : ''}`}
                style={isInterruptedMatch ? { filter: 'grayscale(1)', opacity: 0.6 } : {}}
              >
                <div
                  className="match-summary"
                  onClick={() => setExpandedMatchId(isExpanded ? null : m.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setExpandedMatchId(isExpanded ? null : m.id)}
                >
                  <div className="match-meta-row">
                    <span className="match-meta" style={{ color: 'var(--color-primary)' }}>
                      {m.Stadium || 'Seidita'}
                    </span>
                    <span className="match-meta">
                      <Calendar size={13} />
                      {formatResultDate(m.data)}
                    </span>
                    <span className="match-meta match-meta-time">{formatResultTime(m.ora)}</span>
                  </div>
                  {isInterruptedMatch && (
                    <div
                      style={{
                        textAlign: 'center',
                        color: 'var(--color-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        marginTop: '4px',
                        marginBottom: '4px'
                      }}
                    >
                      Non valida ai fini della classifica
                    </div>
                  )}

                  <div className="match-score-area">
                    <div className="match-team match-team-a">
                      <span className="match-team-name">{m.team_a_name}</span>
                      <span className="match-tag">
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
                      <span className="match-tag">
                        {isLightOnA ? 'MAGLIE SCURE' : 'MAGLIE CHIARE'}
                      </span>
                    </div>
                  </div>

                  <ChevronDown
                    size={18}
                    className={`match-chevron ${isExpanded ? 'rotated' : ''}`}
                  />
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
                          {m.team_a_players.map((name) => {
                            const vote = m.voti_giocatori?.[name];
                            return (
                              <li
                                key={name}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                              >
                                <span>{name}</span>
                                {m.risultato &&
                                  m.risultato !== '0-0' &&
                                  (() => {
                                    let matchMVPs: string[] = [];
                                    if (m.mvps && m.mvps.length > 0) {
                                      matchMVPs =
                                        typeof m.mvps === 'string'
                                          ? JSON.parse(m.mvps)
                                          : Array.isArray(m.mvps)
                                          ? m.mvps
                                          : [];
                                    } else {
                                      const allVotes = Object.values(
                                        m.voti_giocatori || {}
                                      ).map((v) => Number(v) || 0);
                                      const maxV =
                                        allVotes.length > 0 ? Math.max(...allVotes) : 0;
                                      if (maxV > 0 && m.voti_giocatori) {
                                        matchMVPs = Object.keys(m.voti_giocatori).filter(
                                          (p) => m.voti_giocatori![p] === maxV
                                        );
                                      }
                                    }
                                    const isMvp = matchMVPs.includes(name);
                                    return (
                                      <div
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px',
                                          fontSize: '0.85rem'
                                        }}
                                      >
                                        {isMvp && (
                                          <span title="MVP" style={{ display: 'flex' }}>
                                            <Medal size={14} style={{ color: '#FFD700' }} />
                                          </span>
                                        )}
                                        <span
                                          style={{
                                            fontWeight: 'bold',
                                            minWidth: '16px',
                                            textAlign: 'center',
                                            color: getVoteColor(vote)
                                          }}
                                        >
                                          {vote ?? '-'}
                                        </span>
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
                          {m.team_b_players.map((name) => {
                            const vote = m.voti_giocatori?.[name];
                            return (
                              <li
                                key={name}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}
                              >
                                <span>{name}</span>
                                {m.risultato &&
                                  m.risultato !== '0-0' &&
                                  (() => {
                                    let matchMVPs: string[] = [];
                                    if (m.mvps && m.mvps.length > 0) {
                                      matchMVPs =
                                        typeof m.mvps === 'string'
                                          ? JSON.parse(m.mvps)
                                          : Array.isArray(m.mvps)
                                          ? m.mvps
                                          : [];
                                    } else {
                                      const allVotes = Object.values(
                                        m.voti_giocatori || {}
                                      ).map((v) => Number(v) || 0);
                                      const maxV =
                                        allVotes.length > 0 ? Math.max(...allVotes) : 0;
                                      if (maxV > 0 && m.voti_giocatori) {
                                        matchMVPs = Object.keys(m.voti_giocatori).filter(
                                          (p) => m.voti_giocatori![p] === maxV
                                        );
                                      }
                                    }
                                    const isMvp = matchMVPs.includes(name);
                                    return (
                                      <div
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px',
                                          fontSize: '0.85rem'
                                        }}
                                      >
                                        {isMvp && (
                                          <span title="MVP" style={{ display: 'flex' }}>
                                            <Medal size={14} style={{ color: '#FFD700' }} />
                                          </span>
                                        )}
                                        <span
                                          style={{
                                            fontWeight: 'bold',
                                            minWidth: '16px',
                                            textAlign: 'center',
                                            color: getVoteColor(vote)
                                          }}
                                        >
                                          {vote ?? '-'}
                                        </span>
                                      </div>
                                    );
                                  })()}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                    {historicalPredictions.preds[m.id]?.correct && (
                      <div
                        style={{
                          textAlign: 'center',
                          color: '#69f0ae',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          margin: '0 0 1rem 0',
                          padding: '0.5rem',
                          background: 'rgba(105, 240, 174, 0.1)',
                          borderRadius: '6px'
                        }}
                      >
                        ✨ Partita indovinata dall'algoritmo
                      </div>
                    )}
                    {mediaItems.some((x) => x.partita_id === m.id) && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          margin: '0.8rem 0'
                        }}
                      >
                        <button
                          type="button"
                          className="secondary-btn"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.85rem',
                            padding: '0.45rem 1.1rem',
                            borderColor: 'rgba(37, 211, 102, 0.4)',
                            color: '#25D366',
                            background: 'rgba(37, 211, 102, 0.12)',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onCopyMedia(m);
                          }}
                        >
                          <Copy size={14} />
                          <span>Copia Link Video</span>
                        </button>
                      </div>
                    )}
                    {isAdmin && (
                      <div
                        className="match-footer"
                        style={{ display: 'flex', gap: 'var(--space-2)' }}
                      >
                        <button
                          type="button"
                          className="swap-shirts-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenUpdateModal(m);
                          }}
                        >
                          <Pencil size={14} />
                          <span>Aggiorna Risultato</span>
                        </button>
                        <button
                          type="button"
                          className="swap-shirts-btn"
                          style={{
                            color: '#ff6b6b',
                            borderColor: 'rgba(255, 107, 107, 0.3)'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDeleteModal(m);
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Elimina Partita</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
