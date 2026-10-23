'use client';

import React from 'react';
import { X } from 'lucide-react';
import { getPlayerStats } from '@/lib/players/pes-card-utils';
import type { Player } from '@/types';

export interface PlayerCardModalProps {
  playerName: string | null;
  onClose: () => void;
  dbPlayers: Player[];
}

export const PlayerCardModal: React.FC<PlayerCardModalProps> = ({
  playerName,
  onClose,
  dbPlayers,
}) => {
  if (!playerName) return null;

  const playerObj = dbPlayers.find(p => p.Nome === playerName);
  const stats = getPlayerStats(playerObj, playerName);
  const role = playerObj?.Ruolo || 'Giocatore';
  const injury = playerObj?.Infortunio?.trim() || 'Nessuno';

  return (
    <div className="pes-modal-overlay" onClick={onClose}>
      <div className="pes-modal-content" onClick={e => e.stopPropagation()}>
        <div className="pes-modal-header">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3>{playerName}</h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '2px',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontSize: '0.85rem',
                  color: '#9fd9b6',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                {role}
              </span>
              {playerObj?.RuoloSecondario && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.65)',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  Sec: {playerObj.RuoloSecondario}
                </span>
              )}
            </div>
          </div>
          <button
            className="secondary-btn"
            style={{
              padding: '0.2rem',
              display: 'flex',
              background: 'transparent',
              border: 'none',
              color: '#9fd9b6',
            }}
            onClick={onClose}
          >
            <X size={24} />
          </button>
        </div>
        {playerObj?.Skill && (
          <div
            className="pes-modal-skill"
            style={{
              background:
                'linear-gradient(90deg, rgba(0, 180, 216, 0.2) 0%, transparent 100%)',
              padding: '8px 16px',
              borderBottom: '1px solid rgba(107, 155, 198, 0.3)',
              color: '#ffcc00',
              fontStyle: 'italic',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            &quot;{playerObj.Skill}&quot;
          </div>
        )}
        <div className="pes-modal-body">
          <div className="pes-left-col">
            <div
              className="pes-player-image-container"
              style={{
                width: '130px',
                height: '170px',
                border: '2px solid rgba(107, 155, 198, 0.6)',
                borderRadius: '4px',
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={
                  playerObj?.figurina ||
                  `/players/${encodeURIComponent(playerName || '')}.jpg`
                }
                alt={playerName || ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  if (target.src.endsWith('.jpg')) {
                    target.src = `/players/${encodeURIComponent(playerName)}.png`;
                  } else {
                    target.style.display = 'none';
                    target.parentElement!.innerHTML =
                      '<span style="color: rgba(255,255,255,0.3); font-size: 0.8rem; text-align: center; padding: 10px;">Nessuna Figurina</span>';
                  }
                }}
              />
            </div>
            <div className="pes-radar-container">
              <svg
                viewBox="0 0 100 100"
                width="100%"
                height="100%"
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
                <polygon
                  className="pes-radar-polygon"
                  points={
                    stats.isGk
                      ? `
                    50,${50 - (stats.tuffo / 100) * 45}
                    ${50 + (stats.presa / 100) * 43.3},${
                          50 - (stats.presa / 100) * 25
                        }
                    ${50 + (stats.riflessi / 100) * 43.3},${
                          50 + (stats.riflessi / 100) * 25
                        }
                    50,${50 + (stats.piazzamento / 100) * 45}
                    ${50 - (stats.uscite / 100) * 43.3},${
                          50 + (stats.uscite / 100) * 25
                        }
                    ${50 - (stats.rinvio / 100) * 43.3},${
                          50 - (stats.rinvio / 100) * 25
                        }
                  `
                      : `
                    50,${50 - (stats.velocita / 100) * 45}
                    ${50 + (stats.accelerazione / 100) * 43.3},${
                          50 - (stats.accelerazione / 100) * 25
                        }
                    ${50 + (stats.tecnica / 100) * 43.3},${
                          50 + (stats.tecnica / 100) * 25
                        }
                    50,${50 + (stats.contrasto / 100) * 45}
                    ${50 - (stats.passaggi / 100) * 43.3},${
                          50 + (stats.passaggi / 100) * 25
                        }
                    ${50 - (stats.finalizzazione / 100) * 43.3},${
                          50 - (stats.finalizzazione / 100) * 25
                        }
                  `
                  }
                />
              </svg>
              <div className="pes-radar-labels">
                {stats.isGk ? (
                  <>
                    <span style={{ top: '0%', left: '50%' }}>Tuf</span>
                    <span style={{ top: '25%', left: '95%' }}>Pre</span>
                    <span style={{ top: '75%', left: '95%' }}>Rif</span>
                    <span style={{ top: '100%', left: '50%' }}>Pia</span>
                    <span style={{ top: '75%', left: '5%' }}>Usc</span>
                    <span style={{ top: '25%', left: '5%' }}>Rin</span>
                  </>
                ) : (
                  <>
                    <span style={{ top: '0%', left: '50%' }}>Vel</span>
                    <span style={{ top: '25%', left: '95%' }}>Acc</span>
                    <span style={{ top: '75%', left: '95%' }}>Tec</span>
                    <span style={{ top: '100%', left: '50%' }}>Con</span>
                    <span style={{ top: '75%', left: '5%' }}>Pas</span>
                    <span style={{ top: '25%', left: '5%' }}>Fin</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="pes-stats-col">
            {stats.isGk ? (
              <>
                <div className="pes-stat-row">
                  <span>Tuffo</span>
                  <span className="pes-stat-val">{stats.tuffo}</span>
                </div>
                <div className="pes-stat-row">
                  <span>Presa</span>
                  <span className="pes-stat-val">{stats.presa}</span>
                </div>
                <div className="pes-stat-row">
                  <span>Riflessi</span>
                  <span className="pes-stat-val">{stats.riflessi}</span>
                </div>
                <div className="pes-stat-row">
                  <span>Piazzamento</span>
                  <span className="pes-stat-val">{stats.piazzamento}</span>
                </div>
                <div className="pes-stat-row">
                  <span>Uscite</span>
                  <span className="pes-stat-val">{stats.uscite}</span>
                </div>
                <div className="pes-stat-row">
                  <span>Reattività</span>
                  <span className="pes-stat-val">{stats.reattivita}</span>
                </div>
                <div className="pes-stat-row">
                  <span>Rinvio</span>
                  <span className="pes-stat-val">{stats.rinvio}</span>
                </div>
                <div className="pes-stat-row">
                  <span>Resistenza</span>
                  <span className="pes-stat-val">{stats.resistenza}</span>
                </div>
              </>
            ) : (
              <>
                <div className="pes-stat-row">
                  <span>Velocità</span>
                  <span className="pes-stat-val">{stats.velocita}</span>
                </div>
                <div className="pes-stat-row">
                  <span>Accelerazione</span>
                  <span className="pes-stat-val">{stats.accelerazione}</span>
                </div>
                <div className="pes-stat-row">
                  <span>Tecnica</span>
                  <span className="pes-stat-val">{stats.tecnica}</span>
                </div>
                <div className="pes-stat-row">
                  <span>Contrasto</span>
                  <span className="pes-stat-val">{stats.contrasto}</span>
                </div>
                <div className="pes-stat-row">
                  <span>Passaggi</span>
                  <span className="pes-stat-val">{stats.passaggi}</span>
                </div>
                <div className="pes-stat-row">
                  <span>Finalizzazione</span>
                  <span className="pes-stat-val">{stats.finalizzazione}</span>
                </div>
                <div className="pes-stat-row">
                  <span>Resistenza</span>
                  <span className="pes-stat-val">{stats.resistenza}</span>
                </div>
                <div className="pes-stat-row">
                  <span>Dribbling</span>
                  <span
                    className="pes-stat-val"
                    style={
                      stats.dribbling === 100
                        ? {
                            color: '#ffd700',
                            textShadow: '0 0 5px rgba(255, 215, 0, 0.8)',
                          }
                        : {}
                    }
                  >
                    {stats.dribbling}
                  </span>
                </div>
              </>
            )}
            <div className="pes-stat-row">
              <span>Probabilità di Rissa</span>
              <span
                className="pes-stat-val"
                style={
                  stats.rissa === 100
                    ? {
                        color: '#ffd700',
                        textShadow: '0 0 5px rgba(255, 215, 0, 0.8)',
                      }
                    : {}
                }
              >
                {stats.rissa}
              </span>
            </div>
            <div style={{ height: '10px' }} />
            <div className="pes-stat-row">
              <span>Altezza</span>
              <span
                className="pes-stat-val"
                style={{ color: 'white', textShadow: 'none' }}
              >
                {stats.altezza} cm
              </span>
            </div>
            <div className="pes-stat-row">
              <span>Peso</span>
              <span
                className="pes-stat-val"
                style={{ color: 'white', textShadow: 'none' }}
              >
                {stats.peso} kg
              </span>
            </div>
            <div className="pes-stat-row">
              <span>Piede Preferito</span>
              <span
                className="pes-stat-val"
                style={{ color: 'white', textShadow: 'none' }}
              >
                {stats.piede}
              </span>
            </div>
            <div className="pes-stat-row">
              <span>Infortunio</span>
              <span
                className="pes-stat-val"
                style={{
                  color: injury === 'Nessuno' ? '#9fd9b6' : '#ff6b6b',
                  textShadow: 'none',
                  textAlign: 'right',
                  maxWidth: '55%',
                  overflowWrap: 'anywhere',
                }}
              >
                {injury}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
