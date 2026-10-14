'use client';

import React from 'react';
import { LayoutGrid, X, Check } from 'lucide-react';
import { ModuloSettings } from '@/types';

export interface ModuloModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchFormat: number;
  teamAName: string;
  teamBName: string;
  targetTeam: 'A' | 'B' | 'both';
  setTargetTeam: (team: 'A' | 'B' | 'both') => void;
  modulo7TeamA: '2-3-1' | '3-2-1' | '2-2-2' | '3-1-2';
  modulo7TeamB: '2-3-1' | '3-2-1' | '2-2-2' | '3-1-2';
  modulo8TeamA: '3-3-1' | '2-3-2' | '3-2-2' | '2-4-1';
  modulo8TeamB: '3-3-1' | '2-3-2' | '3-2-2' | '2-4-1';
  onSaveModuloSettings: (newSettings: Partial<ModuloSettings>) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function ModuloModal({
  isOpen,
  onClose,
  matchFormat,
  teamAName,
  teamBName,
  targetTeam,
  setTargetTeam,
  modulo7TeamA,
  modulo7TeamB,
  modulo8TeamA,
  modulo8TeamB,
  onSaveModuloSettings,
  showToast
}: ModuloModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.2rem',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '0.8rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(52, 152, 219, 0.2) 0%, rgba(41, 128, 185, 0.3) 100%)',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid rgba(52, 152, 219, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3498db'
              }}
            >
              <LayoutGrid size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Moduli Tattici • Calcio a {matchFormat}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary, #888)' }}>
                Seleziona lo schema tattico per la disposizione in campo
              </p>
            </div>
          </div>
          <button
            className="secondary-btn"
            style={{ padding: '0.4rem', display: 'flex', borderRadius: '50%' }}
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Target Team Selector */}
        <div
          style={{
            marginBottom: '1.2rem',
            background: 'var(--color-surface-2, rgba(255,255,255,0.03))',
            padding: '0.6rem',
            borderRadius: '8px',
            border: '1px solid var(--color-border)'
          }}
        >
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--color-text-secondary, #aaa)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '0.4rem'
            }}
          >
            Applica a:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setTargetTeam('both')}
              style={{
                padding: '0.5rem 0.6rem',
                borderRadius: '6px',
                border: targetTeam === 'both' ? '2px solid #3498db' : '1px solid var(--color-border)',
                background: targetTeam === 'both' ? 'rgba(52, 152, 219, 0.15)' : 'transparent',
                color: targetTeam === 'both' ? '#3498db' : 'var(--color-text)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Entrambe le Squadre
            </button>
            <button
              type="button"
              onClick={() => setTargetTeam('A')}
              style={{
                padding: '0.5rem 0.6rem',
                borderRadius: '6px',
                border: targetTeam === 'A' ? '2px solid #3498db' : '1px solid var(--color-border)',
                background: targetTeam === 'A' ? 'rgba(52, 152, 219, 0.15)' : 'transparent',
                color: targetTeam === 'A' ? '#3498db' : 'var(--color-text)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={teamAName}
            >
              {teamAName}
            </button>
            <button
              type="button"
              onClick={() => setTargetTeam('B')}
              style={{
                padding: '0.5rem 0.6rem',
                borderRadius: '6px',
                border: targetTeam === 'B' ? '2px solid #3498db' : '1px solid var(--color-border)',
                background: targetTeam === 'B' ? 'rgba(52, 152, 219, 0.15)' : 'transparent',
                color: targetTeam === 'B' ? '#3498db' : 'var(--color-text)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={teamBName}
            >
              {teamBName}
            </button>
          </div>
        </div>

        {/* Formations Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(matchFormat === 8
            ? [
                {
                  id: '3-3-1' as const,
                  name: '3-3-1',
                  tag: 'CONSIGLIATO',
                  tagColor: '#2ecc71',
                  tagBg: 'rgba(46, 204, 113, 0.15)',
                  tagBorder: 'rgba(46, 204, 113, 0.4)',
                  breakdown: '3 Difensori • 3 Centrocampisti • 1 Punta',
                  desc: 'Lo schema classico del Calcio a 8. Triangolo difensivo solido, mediana a 3 con ali che coprono la fascia e perno centrale d’attacco.',
                  ruoli: ['POR', 'TS', 'DC', 'TD', 'ES', 'CC', 'ED', 'ATT']
                },
                {
                  id: '2-3-2' as const,
                  name: '2-3-2',
                  tag: 'OFFENSIVO',
                  tagColor: '#e74c3c',
                  tagBg: 'rgba(231, 76, 60, 0.15)',
                  tagBorder: 'rgba(231, 76, 60, 0.4)',
                  breakdown: '2 Difensori • 3 Centrocampisti • 2 Punte',
                  desc: 'Assetto a trazione anteriore con due attaccanti che dialogano in area, supportati da una linea di centrocampo a tre e due centrali difensivi.',
                  ruoli: ['POR', 'DC', 'DC', 'ES', 'CC', 'ED', 'ATT', 'ATT']
                },
                {
                  id: '3-2-2' as const,
                  name: '3-2-2',
                  tag: 'DOPPIA PUNTA',
                  tagColor: '#3498db',
                  tagBg: 'rgba(52, 152, 219, 0.15)',
                  tagBorder: 'rgba(52, 152, 219, 0.4)',
                  breakdown: '3 Difensori • 2 Centrocampisti • 2 Punte',
                  desc: 'Massima solidità arretrata con 3 difensori, diga a due davanti alla difesa e tandem offensivo per colpire velocemente.',
                  ruoli: ['POR', 'TS', 'DC', 'TD', 'CC', 'CC', 'ATT', 'ATT']
                },
                {
                  id: '2-4-1' as const,
                  name: '2-4-1',
                  tag: 'POSSESSO PALLA',
                  tagColor: '#9b59b6',
                  tagBg: 'rgba(155, 89, 182, 0.15)',
                  tagBorder: 'rgba(155, 89, 182, 0.4)',
                  breakdown: '2 Difensori • 4 Centrocampisti • 1 Punta',
                  desc: 'Dominio del centro del campo e possesso palla con 4 interpreti a centrocampo (due centrali e due cursori laterali) a supporto dell’unica punta.',
                  ruoli: ['POR', 'DC', 'DC', 'CLS', 'MED', 'MED', 'CLD', 'ATT']
                }
              ]
            : [
                {
                  id: '3-2-1' as const,
                  name: '3-2-1',
                  tag: 'CONSIGLIATO',
                  tagColor: '#2ecc71',
                  tagBg: 'rgba(46, 204, 113, 0.15)',
                  tagBorder: 'rgba(46, 204, 113, 0.4)',
                  breakdown: '3 Difensori • 2 Centrocampisti • 1 Punta',
                  desc: 'Formazione compatta e impenetrabile. 3 difensori (Terzini e Centrale), 2 centrocampisti e punta di sfondamento. Il modulo predefinito per il Calcio a 7.',
                  ruoli: ['POR', 'TS', 'DC', 'TD', 'CC', 'CC', 'ATT']
                },
                {
                  id: '2-3-1' as const,
                  name: '2-3-1',
                  tag: 'EQUILIBRATO',
                  tagColor: '#3498db',
                  tagBg: 'rgba(52, 152, 219, 0.15)',
                  tagBorder: 'rgba(52, 152, 219, 0.4)',
                  breakdown: '2 Difensori • 3 Centrocampisti • 1 Punta',
                  desc: 'Ampiezza sulle corsie esterne, cervello centrale e attaccante mobile.',
                  ruoli: ['POR', 'DC', 'DC', 'ES', 'CC', 'ED', 'ATT']
                },
                {
                  id: '2-2-2' as const,
                  name: '2-2-2',
                  tag: 'A COPPIE',
                  tagColor: '#f39c12',
                  tagBg: 'rgba(243, 156, 18, 0.15)',
                  tagBorder: 'rgba(243, 156, 18, 0.4)',
                  breakdown: '2 Difensori • 2 Centrocampisti • 2 Punte',
                  desc: 'Schema simmetrico con 2 giocatori per linea. Ottimo per pressing alto e verticalizzazioni dirette sulle due punte.',
                  ruoli: ['POR', 'DC', 'DC', 'CC', 'CC', 'ATT', 'ATT']
                },
                {
                  id: '3-1-2' as const,
                  name: '3-1-2',
                  tag: 'DOPPIA PUNTA',
                  tagColor: '#e74c3c',
                  tagBg: 'rgba(231, 76, 60, 0.15)',
                  tagBorder: 'rgba(231, 76, 60, 0.4)',
                  breakdown: '3 Difensori • 1 Mediano • 2 Punte',
                  desc: 'Solidità difensiva con schermo davanti alla difesa e coppia di punte libere di svariare su tutto il fronte offensivo.',
                  ruoli: ['POR', 'TS', 'DC', 'TD', 'MED', 'ATT', 'ATT']
                }
              ]
          ).map(mod => {
            const isSelected =
              matchFormat === 8
                ? targetTeam === 'both'
                  ? modulo8TeamA === mod.id && modulo8TeamB === mod.id
                  : targetTeam === 'A'
                  ? modulo8TeamA === mod.id
                  : modulo8TeamB === mod.id
                : targetTeam === 'both'
                ? modulo7TeamA === mod.id && modulo7TeamB === mod.id
                : targetTeam === 'A'
                ? modulo7TeamA === mod.id
                : modulo7TeamB === mod.id;

            return (
              <div
                key={mod.id}
                onClick={() => {
                  if (matchFormat === 8) {
                    const mid = mod.id as '3-3-1' | '2-3-2' | '3-2-2' | '2-4-1';
                    if (targetTeam === 'both') {
                      onSaveModuloSettings({ modulo8TeamA: mid, modulo8TeamB: mid });
                    } else if (targetTeam === 'A') {
                      onSaveModuloSettings({ modulo8TeamA: mid });
                    } else {
                      onSaveModuloSettings({ modulo8TeamB: mid });
                    }
                  } else {
                    const mid = mod.id as '2-3-1' | '3-2-1' | '2-2-2' | '3-1-2';
                    if (targetTeam === 'both') {
                      onSaveModuloSettings({ modulo7TeamA: mid, modulo7TeamB: mid });
                    } else if (targetTeam === 'A') {
                      onSaveModuloSettings({ modulo7TeamA: mid });
                    } else {
                      onSaveModuloSettings({ modulo7TeamB: mid });
                    }
                  }
                  showToast(`Modulo ${mod.name} impostato e salvato!`, 'success');
                }}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid #3498db' : '1px solid var(--color-border)',
                  background: isSelected
                    ? 'rgba(52, 152, 219, 0.12)'
                    : 'var(--color-surface, rgba(255,255,255,0.02))',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 12px rgba(52, 152, 219, 0.3)' : 'none'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.4rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: isSelected ? '#3498db' : 'var(--color-text)'
                      }}
                    >
                      {mod.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        color: mod.tagColor,
                        background: mod.tagBg,
                        border: `1px solid ${mod.tagBorder}`,
                        letterSpacing: '0.5px'
                      }}
                    >
                      {mod.tag}
                    </span>
                  </div>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: isSelected ? '2px solid #3498db' : '2px solid var(--color-border)',
                      background: isSelected ? '#3498db' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff'
                    }}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: 'var(--color-text)',
                    marginBottom: '0.3rem'
                  }}
                >
                  {mod.breakdown}
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-secondary, #999)',
                    lineHeight: 1.35,
                    marginBottom: '0.5rem'
                  }}
                >
                  {mod.desc}
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {mod.ruoli.map((r, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background:
                          r === 'POR'
                            ? 'rgba(243, 156, 18, 0.2)'
                            : r.includes('D') || r === 'TS' || r === 'TD'
                            ? 'rgba(52, 152, 219, 0.2)'
                            : r === 'ATT'
                            ? 'rgba(231, 76, 60, 0.2)'
                            : 'rgba(46, 204, 113, 0.2)',
                        color:
                          r === 'POR'
                            ? '#f39c12'
                            : r.includes('D') || r === 'TS' || r === 'TD'
                            ? '#3498db'
                            : r === 'ATT'
                            ? '#e74c3c'
                            : '#2ecc71',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            marginTop: '1.2rem',
            display: 'flex',
            justifyContent: 'flex-end',
            borderTop: '1px solid var(--color-border)',
            paddingTop: '0.8rem'
          }}
        >
          <button
            type="button"
            className="primary-btn"
            style={{ padding: '0.5rem 1.4rem', fontWeight: 700, fontSize: '0.9rem' }}
            onClick={onClose}
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
