'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MultiSelectDropdown } from '@/components/ui/Dropdowns';
import { parseScorersString } from '@/lib/stats/match-utils';
import type { Player, MatchResult, Sfida } from '@/types';

export interface SfidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: MatchResult[];
  dbPlayers: Player[];
  isAdmin: boolean;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const SfidaModal: React.FC<SfidaModalProps> = ({
  isOpen,
  onClose,
  matches,
  dbPlayers,
  isAdmin,
  showToast,
}) => {
  const [sfidaDataDa, setSfidaDataDa] = useState('');
  const [sfidaTitolo, setSfidaTitolo] = useState('');
  const [sfidaPlayers, setSfidaPlayers] = useState<string[]>([]);
  const [sfideSalvate, setSfideSalvate] = useState<any[]>([]);
  const [sfidaLeaderboard, setSfidaLeaderboard] = useState<any[]>([]);
  const [sfidaSortConfig, setSfidaSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const sfidaPlayerOptions = useMemo(() => {
    const list = [...dbPlayers.map(p => p.Nome)];
    matches.forEach(m => {
      (m.team_a_players || []).forEach(p => {
        if (!list.includes(p)) list.push(p);
      });
      (m.team_b_players || []).forEach(p => {
        if (!list.includes(p)) list.push(p);
      });
    });
    return list.sort().map(p => ({ value: p, label: p }));
  }, [dbPlayers, matches]);

  const requestSfidaSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (
      sfidaSortConfig &&
      sfidaSortConfig.key === key &&
      sfidaSortConfig.direction === 'desc'
    )
      direction = 'asc';
    setSfidaSortConfig({ key, direction });
  };

  const loadSfide = async () => {
    try {
      const r = await fetch('/api/sfide');
      const d = await r.json();
      if (d.success) setSfideSalvate(d.sfide);
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpen) {
      loadSfide();
    }
  }, [isOpen]);

  const computeSfida = () => {
    if (sfidaPlayers.length < 2)
      return showToast('Seleziona almeno 2 giocatori', 'error');
    let filteredMatches = matches.filter(m => {
      const mDate = new Date(m.data);
      const isInterruptedMatch =
        mDate.getDate() === 8 &&
        mDate.getMonth() === 6 &&
        mDate.getFullYear() === 2026 &&
        m.ora &&
        m.ora.startsWith('21');
      return (
        !isInterruptedMatch &&
        m.risultato &&
        m.risultato !== '' &&
        m.risultato !== '0-0'
      );
    });
    if (sfidaDataDa) {
      filteredMatches = filteredMatches.filter(m => {
        if (!m.data) return true;
        return new Date(m.data) >= new Date(sfidaDataDa);
      });
    }

    const stats: Record<string, any> = {};
    sfidaPlayers.forEach(p => {
      stats[p] = {
        nome: p,
        partite_giocate: 0,
        vittorie: 0,
        pareggi: 0,
        sconfitte: 0,
        punti_assoluti: 0,
        gol: 0,
        mvp_count: 0,
        somma_voti: 0,
        partite_voto: 0,
        pt_partita: 0,
        media_voto: 0,
      };
    });

    filteredMatches.forEach(m => {
      const parts = m.risultato?.split('-');
      if (!parts || parts.length < 2) return;

      const scorA = parseInt(parts[0], 10);
      const scorB = parseInt(parts[1], 10);

      let winA = false,
        winB = false,
        draw = false;
      if (scorA > scorB) winA = true;
      else if (scorA < scorB) winB = true;
      else draw = true;

      const vt =
        typeof m.voti_giocatori === 'string'
          ? JSON.parse(m.voti_giocatori || '{}')
          : m.voti_giocatori || {};

      sfidaPlayers.forEach(p => {
        const isTeamA = m.team_a_players?.includes(p);
        const isTeamB = m.team_b_players?.includes(p);
        if (isTeamA || isTeamB) {
          stats[p].partite_giocate += 1;

          if ((isTeamA && winA) || (isTeamB && winB)) {
            stats[p].vittorie += 1;
            stats[p].punti_assoluti += 3;
          } else if (draw) {
            stats[p].pareggi += 1;
            stats[p].punti_assoluti += 1;
          } else {
            stats[p].sconfitte += 1;
          }

          if (vt[p] !== undefined && Number(vt[p]) > 0) {
            stats[p].somma_voti += Number(vt[p]);
            stats[p].partite_voto += 1;
          }

          if (m.mvps && m.mvps.includes(p)) {
            stats[p].mvp_count += 1;
          }
        }
      });

      const addGoals = (scorersInput: any) => {
        const scorersMap = parseScorersString(scorersInput);
        Object.entries(scorersMap).forEach(([name, count]) => {
          if (stats[name]) {
            stats[name].gol += count;
          } else {
            const foundKey = Object.keys(stats).find(
              k => k.toLowerCase() === name.toLowerCase()
            );
            if (foundKey) {
              stats[foundKey].gol += count;
            }
          }
        });
      };

      addGoals(m.marcatori_a);
      addGoals(m.marcatori_b);
    });

    const res = Object.values(stats).map(d => {
      d.pt_partita =
        d.partite_giocate > 0
          ? parseFloat((d.punti_assoluti / d.partite_giocate).toFixed(2))
          : 0;
      d.media_voto =
        d.partite_voto > 0
          ? parseFloat((d.somma_voti / d.partite_voto).toFixed(2))
          : 0;
      return d;
    });

    res.sort((a, b) => {
      if (b.punti_assoluti !== a.punti_assoluti)
        return b.punti_assoluti - a.punti_assoluti;
      if (b.pt_partita !== a.pt_partita) return b.pt_partita - a.pt_partita;
      if (b.media_voto !== a.media_voto) return b.media_voto - a.media_voto;
      if (b.gol !== a.gol) return b.gol - a.gol;
      return a.nome.localeCompare(b.nome);
    });
    setSfidaSortConfig(null);
    setSfidaLeaderboard(res);
  };

  const handleSaveSfida = async () => {
    if (sfidaPlayers.length < 2) return;
    let title = sfidaTitolo.trim();
    if (!title) {
      const p1 = sfidaPlayers[0],
        p2 = sfidaPlayers[1];
      title = `${p1} vs ${p2}`;
      if (sfidaPlayers.length > 2) title += ` e altri`;
    }
    try {
      const r = await fetch('/api/sfide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titolo: title,
          giocatori: sfidaPlayers,
          data_da: sfidaDataDa || null,
          is_approved: isAdmin,
        }),
      });
      if (r.ok) {
        showToast(
          isAdmin
            ? 'Sfida salvata!'
            : 'Sfida in attesa di approvazione degli Admin',
          'success'
        );
        loadSfide();
      } else {
        const err = await r.json();
        showToast(err.error || 'Errore durante il salvataggio.', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Errore durante il salvataggio!', 'error');
    }
  };

  const approveSfida = async (id: number) => {
    if (!isAdmin) return;
    try {
      const r = await fetch(`/api/sfide?id=${id}`, { method: 'PUT' });
      if (r.ok) loadSfide();
    } catch (e) {}
  };

  const deleteSfida = async (id: number) => {
    if (!isAdmin) return;
    if (!confirm('Sicuro di voler eliminare questa sfida?')) return;
    try {
      const r = await fetch(`/api/sfide?id=${id}`, { method: 'DELETE' });
      if (r.ok) loadSfide();
    } catch (e) {}
  };

  const sortedSfidaLeaderboard = useMemo(() => {
    const list = [...sfidaLeaderboard];
    if (sfidaSortConfig) {
      const config = sfidaSortConfig;
      list.sort((a, b) => {
        const aV = a[config.key];
        const bV = b[config.key];
        if (aV < bV) return config.direction === 'asc' ? -1 : 1;
        if (aV > bV) return config.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [sfidaLeaderboard, sfidaSortConfig]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 9999 }}
    >
      <div
        className="modal-content admin-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '900px', width: '95%' }}
      >
        <h2
          className="admin-title"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          ⚔️ Area Sfida
        </h2>

        {sfideSalvate.length > 0 && (
          <div
            style={{
              marginBottom: '1.5rem',
              background: 'var(--color-surface-2)',
              padding: '1rem',
              borderRadius: '8px',
            }}
          >
            <h3
              style={{
                fontSize: '1rem',
                color: '#3da5f5',
                marginBottom: '10px',
              }}
            >
              Sfide Salvate:
            </h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {sfideSalvate
                .filter(s => isAdmin || s.is_approved)
                .map(s => (
                  <div
                    key={s.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'var(--color-surface)',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      border: s.is_approved
                        ? '1px solid var(--color-border)'
                        : '1px solid #f0ad4e',
                    }}
                  >
                    <span
                      style={{
                        cursor: 'pointer',
                        color: '#fff',
                        fontSize: '0.9rem',
                      }}
                      onClick={() => {
                        setSfidaPlayers(s.giocatori);
                        setSfidaDataDa(s.data_da || '');
                        setTimeout(
                          () =>
                            document.getElementById('calc-sfida-btn')?.click(),
                          100
                        );
                      }}
                    >
                      {s.titolo} {s.data_da ? ` (dal ${s.data_da})` : ''}{' '}
                      {!s.is_approved && (
                        <span
                          style={{ color: '#f0ad4e', fontSize: '0.75rem' }}
                        >
                          {' '}
                          (In attesa)
                        </span>
                      )}
                    </span>
                    {isAdmin && !s.is_approved && (
                      <button
                        onClick={() => approveSfida(s.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#34d680',
                          cursor: 'pointer',
                          padding: '0 5px',
                          fontWeight: 'bold',
                        }}
                      >
                        ✓
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => deleteSfida(s.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f55',
                          cursor: 'pointer',
                          padding: '0 5px',
                        }}
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1rem',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label className="admin-label">Seleziona Giocatori (min. 2)</label>
            <MultiSelectDropdown
              selectedValues={sfidaPlayers}
              options={sfidaPlayerOptions}
              onChange={setSfidaPlayers}
              placeholder="Scegli i giocatori"
            />
          </div>
          <div style={{ width: '130px' }}>
            <label className="admin-label">Data Da (Opz.)</label>
            <input
              type="date"
              className="admin-input"
              value={sfidaDataDa}
              onChange={e => setSfidaDataDa(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label className="admin-label">Nome Sfida (Opz.)</label>
            <input
              type="text"
              className="admin-input"
              placeholder="Es: Classifica Estiva"
              value={sfidaTitolo}
              onChange={e => setSfidaTitolo(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              id="calc-sfida-btn"
              className="admin-button"
              onClick={computeSfida}
              style={{
                padding: '0.7rem 1.2rem',
                background: '#3da5f5',
                color: '#000',
                fontWeight: 'bold',
              }}
            >
              Calcola
            </button>
            <button
              className="admin-button"
              onClick={handleSaveSfida}
              style={{
                padding: '0.7rem 1.2rem',
                background: '#34d680',
                color: '#000',
                fontWeight: 'bold',
              }}
            >
              {isAdmin ? 'Salva' : 'Invia'}
            </button>
          </div>
        </div>

        {sortedSfidaLeaderboard.length > 0 && (
          <div
            style={{
              overflowX: 'auto',
              overflowY: 'auto',
              maxHeight: '50vh',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              marginTop: '2rem',
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
                    background: 'rgba(61, 165, 245, 0.1)',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'left',
                      color: '#3da5f5',
                    }}
                  >
                    Pos
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'left',
                      color: '#3da5f5',
                      cursor: 'pointer',
                    }}
                    onClick={() => requestSfidaSort('nome')}
                  >
                    Nominativo{' '}
                    {sfidaSortConfig?.key === 'nome'
                      ? sfidaSortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'center',
                      color: '#3da5f5',
                      cursor: 'pointer',
                    }}
                    onClick={() => requestSfidaSort('punti_assoluti')}
                  >
                    Punti{' '}
                    {sfidaSortConfig?.key === 'punti_assoluti'
                      ? sfidaSortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'center',
                      color: '#3da5f5',
                      cursor: 'pointer',
                    }}
                    onClick={() => requestSfidaSort('partite_giocate')}
                  >
                    Giocate{' '}
                    {sfidaSortConfig?.key === 'partite_giocate'
                      ? sfidaSortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'center',
                      color: '#3da5f5',
                      cursor: 'pointer',
                    }}
                    onClick={() => requestSfidaSort('vittorie')}
                  >
                    V{' '}
                    {sfidaSortConfig?.key === 'vittorie'
                      ? sfidaSortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'center',
                      color: '#3da5f5',
                      cursor: 'pointer',
                    }}
                    onClick={() => requestSfidaSort('pareggi')}
                  >
                    N{' '}
                    {sfidaSortConfig?.key === 'pareggi'
                      ? sfidaSortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'center',
                      color: '#3da5f5',
                      cursor: 'pointer',
                    }}
                    onClick={() => requestSfidaSort('sconfitte')}
                  >
                    P{' '}
                    {sfidaSortConfig?.key === 'sconfitte'
                      ? sfidaSortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'center',
                      color: '#3da5f5',
                      cursor: 'pointer',
                    }}
                    onClick={() => requestSfidaSort('media_voto')}
                  >
                    Media Voto{' '}
                    {sfidaSortConfig?.key === 'media_voto'
                      ? sfidaSortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'center',
                      color: '#3da5f5',
                      cursor: 'pointer',
                    }}
                    onClick={() => requestSfidaSort('mvp_count')}
                  >
                    MVP{' '}
                    {sfidaSortConfig?.key === 'mvp_count'
                      ? sfidaSortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'center',
                      color: '#3da5f5',
                      cursor: 'pointer',
                    }}
                    onClick={() => requestSfidaSort('pt_partita')}
                  >
                    Pt/Partita{' '}
                    {sfidaSortConfig?.key === 'pt_partita'
                      ? sfidaSortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                  <th
                    style={{
                      padding: '10px',
                      textAlign: 'center',
                      color: '#3da5f5',
                      cursor: 'pointer',
                    }}
                    onClick={() => requestSfidaSort('gol')}
                  >
                    Gol{' '}
                    {sfidaSortConfig?.key === 'gol'
                      ? sfidaSortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedSfidaLeaderboard.map((p, idx) => (
                  <tr
                    key={p.nome}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      color: '#fff',
                    }}
                  >
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>
                      {idx + 1}°
                    </td>
                    <td style={{ padding: '10px', fontWeight: 600 }}>
                      {p.nome}
                    </td>
                    <td
                      style={{
                        padding: '10px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#fff',
                      }}
                    >
                      {p.punti_assoluti}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      {p.partite_giocate}
                    </td>
                    <td
                      style={{
                        padding: '10px',
                        textAlign: 'center',
                        color: '#34d680',
                      }}
                    >
                      {p.vittorie}
                    </td>
                    <td
                      style={{
                        padding: '10px',
                        textAlign: 'center',
                        color: '#f0ad4e',
                      }}
                    >
                      {p.pareggi}
                    </td>
                    <td
                      style={{
                        padding: '10px',
                        textAlign: 'center',
                        color: '#d9534f',
                      }}
                    >
                      {p.sconfitte}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      {p.media_voto}
                    </td>
                    <td
                      style={{
                        padding: '10px',
                        textAlign: 'center',
                        color: '#ffd700',
                      }}
                    >
                      {p.mvp_count}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      {p.pt_partita}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      {p.gol}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          className="admin-button cancel-button"
          onClick={onClose}
          style={{ marginTop: '1.5rem', width: '100%' }}
        >
          Chiudi
        </button>
      </div>
    </div>
  );
};
