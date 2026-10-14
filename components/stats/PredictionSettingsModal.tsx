'use client';

import React from 'react';
import { Sliders, X } from 'lucide-react';
import { PredictionSettings, defaultPredictionSettings } from '@/types';

export interface PredictionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tempSettings: PredictionSettings;
  setTempSettings: React.Dispatch<React.SetStateAction<PredictionSettings>>;
  onSave: (settings: PredictionSettings) => void;
  defaultSettings?: PredictionSettings;
}

export default function PredictionSettingsModal({
  isOpen,
  onClose,
  tempSettings,
  setTempSettings,
  onSave,
  defaultSettings = defaultPredictionSettings
}: PredictionSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: '16px',
          border: '1px solid rgba(93, 228, 255, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.2rem 1.5rem',
            borderBottom: '1px solid var(--color-border)',
            background: 'rgba(255,255,255,0.02)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(93, 228, 255, 0.2) 0%, rgba(30, 144, 255, 0.3) 100%)',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid rgba(93, 228, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#5de4ff'
              }}
            >
              <Sliders size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                Gestisci Previsione & Storico
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary, #888)' }}>
                Scegli quali partite archiviate considerare per le previsioni
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

        {/* Scrollable Body */}
        <div style={{ padding: '1.2rem 1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Informative Note */}
          <div
            style={{
              background: 'rgba(93, 228, 255, 0.06)',
              border: '1px solid rgba(93, 228, 255, 0.2)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.2rem',
              fontSize: '0.82rem',
              color: '#ccc',
              lineHeight: 1.4
            }}
          >
            ℹ️ Puoi scegliere se far valere lo storico del Calcio a 5 anche per 6vs6, 7vs7 e 8vs8 (opzione ideale per comitive che giocano spesso a 5), oppure dividere le statistiche per formati separati.
          </div>

          {/* Modal Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {/* Option 1: ALL (Default) */}
            <div
              onClick={() => setTempSettings(prev => ({ ...prev, mode: 'all' }))}
              style={{
                border: `2px solid ${tempSettings.mode === 'all' ? '#5de4ff' : 'var(--color-border)'}`,
                background:
                  tempSettings.mode === 'all'
                    ? 'rgba(93, 228, 255, 0.08)'
                    : 'rgba(255,255,255,0.02)',
                borderRadius: '10px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '4px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: tempSettings.mode === 'all' ? '#5de4ff' : '#fff'
                  }}
                >
                  <span>🌐</span>
                  <span>Tutti i Formati Uniti (Predefinito)</span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      background: '#5de4ff',
                      color: '#000',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontWeight: 800
                    }}
                  >
                    CONSIGLIATO
                  </span>
                </div>
                <input
                  type="radio"
                  name="predictionMode"
                  checked={tempSettings.mode === 'all'}
                  onChange={() => {}}
                  style={{ accentColor: '#5de4ff', cursor: 'pointer' }}
                />
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#aaa', lineHeight: 1.4 }}>
                Le statistiche di qualsiasi modalità (5, 6, 7, 8) valgono per tutte le altre. Quando giochi a 8 o a 7, le sinergie e i voti del Calcio a 5 vengono utilizzati direttamente per formulare la previsione.
              </p>
            </div>

            {/* Option 2: TRACKS (Due Binari) */}
            <div
              onClick={() => setTempSettings(prev => ({ ...prev, mode: 'tracks' }))}
              style={{
                border: `2px solid ${tempSettings.mode === 'tracks' ? '#5de4ff' : 'var(--color-border)'}`,
                background:
                  tempSettings.mode === 'tracks'
                    ? 'rgba(93, 228, 255, 0.08)'
                    : 'rgba(255,255,255,0.02)',
                borderRadius: '10px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '4px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: tempSettings.mode === 'tracks' ? '#5de4ff' : '#fff'
                  }}
                >
                  <span>🛤️</span>
                  <span>Due Binari Separati (5&6 vs 7&8)</span>
                </div>
                <input
                  type="radio"
                  name="predictionMode"
                  checked={tempSettings.mode === 'tracks'}
                  onChange={() => {}}
                  style={{ accentColor: '#5de4ff', cursor: 'pointer' }}
                />
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#aaa', lineHeight: 1.4 }}>
                Separa i campi piccoli (Calcio a 5 e a 6) dai campi grandi (Calcio a 7 e a 8). Le partite a 8 useranno solo partite archiviate a 7 e a 8.
              </p>
            </div>

            {/* Option 3: STRICT (Rigido) */}
            <div
              onClick={() => setTempSettings(prev => ({ ...prev, mode: 'strict' }))}
              style={{
                border: `2px solid ${tempSettings.mode === 'strict' ? '#5de4ff' : 'var(--color-border)'}`,
                background:
                  tempSettings.mode === 'strict'
                    ? 'rgba(93, 228, 255, 0.08)'
                    : 'rgba(255,255,255,0.02)',
                borderRadius: '10px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '4px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: tempSettings.mode === 'strict' ? '#5de4ff' : '#fff'
                  }}
                >
                  <span>🎯</span>
                  <span>Rigoroso per Singolo Formato</span>
                </div>
                <input
                  type="radio"
                  name="predictionMode"
                  checked={tempSettings.mode === 'strict'}
                  onChange={() => {}}
                  style={{ accentColor: '#5de4ff', cursor: 'pointer' }}
                />
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#aaa', lineHeight: 1.4 }}>
                Ciascuna modalità è completamente isolata: le partite 8vs8 considerano solo partite 8vs8, 7vs7 solo 7vs7, 5vs5 solo 5vs5.
              </p>
            </div>

            {/* Option 4: CUSTOM (Personalizzato) */}
            <div
              onClick={() =>
                setTempSettings(prev => ({
                  ...prev,
                  mode: 'custom',
                  customMatrix:
                    prev.customMatrix || {
                      5: [5, 6, 7, 8],
                      6: [5, 6, 7, 8],
                      7: [5, 6, 7, 8],
                      8: [5, 6, 7, 8]
                    }
                }))
              }
              style={{
                border: `2px solid ${tempSettings.mode === 'custom' ? '#5de4ff' : 'var(--color-border)'}`,
                background:
                  tempSettings.mode === 'custom'
                    ? 'rgba(93, 228, 255, 0.08)'
                    : 'rgba(255,255,255,0.02)',
                borderRadius: '10px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '4px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: tempSettings.mode === 'custom' ? '#5de4ff' : '#fff'
                  }}
                >
                  <span>⚙️</span>
                  <span>Personalizzato per Formato</span>
                </div>
                <input
                  type="radio"
                  name="predictionMode"
                  checked={tempSettings.mode === 'custom'}
                  onChange={() => {}}
                  style={{ accentColor: '#5de4ff', cursor: 'pointer' }}
                />
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#aaa', lineHeight: 1.4 }}>
                Scegli manualmente con le checkbox quali formati storici attivare per ogni modalità di gioco.
              </p>

              {/* Custom Matrix UI */}
              {tempSettings.mode === 'custom' && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.78rem',
                      color: '#ffcc00',
                      marginBottom: '0.6rem',
                      fontWeight: 600
                    }}
                  >
                    Seleziona quali storici includere per ciascun formato di match:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {[5, 6, 7, 8].map(targetF => {
                      const currentAllowed =
                        tempSettings.customMatrix?.[targetF as 5 | 6 | 7 | 8] || [5, 6, 7, 8];
                      return (
                        <div
                          key={targetF}
                          style={{
                            background: 'rgba(0,0,0,0.25)',
                            padding: '0.5rem 0.8rem',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '6px'
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              color: '#fff',
                              minWidth: '110px'
                            }}
                          >
                            Partita a {targetF}vs{targetF}:
                          </span>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {[5, 6, 7, 8].map(sourceF => {
                              const isChecked = currentAllowed.includes(sourceF);
                              return (
                                <button
                                  key={sourceF}
                                  type="button"
                                  onClick={() => {
                                    setTempSettings(prev => {
                                      const mat = {
                                        ...(prev.customMatrix || {
                                          5: [5, 6, 7, 8],
                                          6: [5, 6, 7, 8],
                                          7: [5, 6, 7, 8],
                                          8: [5, 6, 7, 8]
                                        })
                                      };
                                      const list = mat[targetF as 5 | 6 | 7 | 8] || [];
                                      const nextList = list.includes(sourceF)
                                        ? list.length > 1
                                          ? list.filter(x => x !== sourceF)
                                          : list
                                        : [...list, sourceF].sort();
                                      mat[targetF as 5 | 6 | 7 | 8] = nextList;
                                      return { ...prev, customMatrix: mat };
                                    });
                                  }}
                                  style={{
                                    background: isChecked
                                      ? 'rgba(93, 228, 255, 0.25)'
                                      : 'rgba(255,255,255,0.05)',
                                    color: isChecked ? '#5de4ff' : '#666',
                                    border: `1px solid ${
                                      isChecked ? '#5de4ff' : 'rgba(255,255,255,0.1)'
                                    }`,
                                    borderRadius: '4px',
                                    padding: '3px 8px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {isChecked ? '✓ ' : ''}
                                  {sourceF}vs{sourceF}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sticky Modal Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface, #131722)',
            flexShrink: 0,
            gap: '0.8rem',
            flexWrap: 'wrap'
          }}
        >
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setTempSettings(defaultSettings)}
            style={{ fontSize: '0.82rem', color: '#ffcc00', padding: '0.5rem 0.9rem' }}
          >
            Ripristina Predefinito
          </button>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="button"
              className="secondary-btn"
              onClick={onClose}
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
            >
              Annulla
            </button>
            <button
              type="button"
              className="create-teams-btn"
              onClick={() => onSave(tempSettings)}
              style={{
                padding: '0.6rem 1.5rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                boxShadow: '0 0 15px rgba(93, 228, 255, 0.4)',
                background: 'linear-gradient(135deg, #00b4db, #0083b0)'
              }}
            >
              💾 Salva Impostazioni
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
