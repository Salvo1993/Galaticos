'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Player } from '@/types';

const GK_STAT_FIELDS = [
  { key: 'tuffo', label: 'Tuffo' },
  { key: 'presa', label: 'Presa' },
  { key: 'riflessi', label: 'Riflessi' },
  { key: 'piazzamento', label: 'Piazzamento' },
  { key: 'uscite', label: 'Uscite' },
  { key: 'reattivita', label: 'Reattività' },
  { key: 'resistenza', label: 'Resistenza' },
  { key: 'rinvio', label: 'Rinvio' },
  { key: 'rissa', label: 'Rissa' },
  { key: 'altezza', label: 'Altezza' },
  { key: 'peso', label: 'Peso' },
  { key: 'Score', label: 'Score' }
] as const;

const OUTFIELD_STAT_FIELDS = [
  { key: 'velocita', label: 'Velocita' },
  { key: 'accelerazione', label: 'Accelerazione' },
  { key: 'tecnica', label: 'Tecnica' },
  { key: 'contrasto', label: 'Contrasto' },
  { key: 'passaggi', label: 'Passaggi' },
  { key: 'finalizzazione', label: 'Finalizzazione' },
  { key: 'resistenza', label: 'Resistenza' },
  { key: 'dribbling', label: 'Dribbling' },
  { key: 'rissa', label: 'Rissa' },
  { key: 'altezza', label: 'Altezza' },
  { key: 'peso', label: 'Peso' },
  { key: 'Score', label: 'Score' }
] as const;

const TEXT_FIELDS = [
  { key: 'Skill', label: 'Skill' },
  { key: 'piede', label: 'Piede' },
  { key: 'Infortunio', label: 'Infortunio' },
] as const;

export interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  dbPlayers: Player[];
  onSave: (payload: {
    oldName: string;
    newName: string;
    newRole: string;
    newRoleSecondario: string | null;
    stats: Partial<Player>;
    imageFile: File | null;
  }) => Promise<void> | void;
  isSaving?: boolean;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export default function EditPlayerModal({
  isOpen,
  onClose,
  player,
  dbPlayers,
  onSave,
  isSaving = false,
  showToast
}: EditPlayerModalProps) {
  const [editingPlayerName, setEditingPlayerName] = useState('');
  const [editingPlayerStats, setEditingPlayerStats] = useState<Partial<Player>>({});
  const [editingPlayerImage, setEditingPlayerImage] = useState<File | null>(null);
  const [isEditSecRoleOpen, setIsEditSecRoleOpen] = useState(false);

  useEffect(() => {
    if (isOpen && player) {
      setEditingPlayerName(player.Nome || '');
      setEditingPlayerStats({ ...player });
      setEditingPlayerImage(null);
      setIsEditSecRoleOpen(false);
    }
  }, [isOpen, player]);

  useEffect(() => {
    if (!isEditSecRoleOpen) return;
    const handleClose = () => setIsEditSecRoleOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [isEditSecRoleOpen]);

  if (!isOpen || !player) return null;

  const baseRoles = ['Portiere', 'Difensore', 'Terzino Sinistro', 'Terzino Destro', 'Centrocampista Centrale', 'Ala', 'Ala Sinistra', 'Ala Destra', 'Trequartista', 'Attaccante'];
  const uniqueRoles: string[] = Array.from(new Set([
    ...baseRoles, 
    ...dbPlayers.map((p) => p.Ruolo).filter((r): r is string => Boolean(r)), 
    ...dbPlayers.flatMap((p) => (p.RuoloSecondario || '').split(',').map((s) => s.trim()).filter(Boolean))
  ]));

  const editSecRolesList = (editingPlayerStats.RuoloSecondario || '').split(',').map((s) => s.trim()).filter(Boolean);
  const availableEditSecRoles = uniqueRoles.filter((r) => r !== editingPlayerStats.Ruolo);

  const isGk = editingPlayerStats.Ruolo === 'Portiere';
  const statFields = isGk ? GK_STAT_FIELDS : OUTFIELD_STAT_FIELDS;

  const handleClose = () => {
    setIsEditSecRoleOpen(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!editingPlayerName.trim()) {
      showToast?.('Nome obbligatorio', 'error');
      return;
    }

    await onSave({
      oldName: player.Nome,
      newName: editingPlayerName.trim(),
      newRole: editingPlayerStats.Ruolo?.trim() || '',
      newRoleSecondario: editingPlayerStats.RuoloSecondario?.trim() || null,
      stats: {
        ...editingPlayerStats,
        Nome: editingPlayerName.trim(),
        RuoloSecondario: editingPlayerStats.RuoloSecondario?.trim() || null
      },
      imageFile: editingPlayerImage
    });
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '650px', width: '95%', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Modifica Giocatore</h3>
          <button className="secondary-btn" style={{ padding: '0.2rem', display: 'flex' }} onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'block' }}>Nome</label>
              <input 
                autoFocus
                type="text" 
                className="modal-input"
                value={editingPlayerName} 
                onChange={(e) => setEditingPlayerName(e.target.value)}
                placeholder="Nuovo nome..."
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'block' }}>Ruolo Preferito</label>
              <select 
                value={editingPlayerStats.Ruolo || ''} 
                onChange={(e) => {
                  const newPrimary = e.target.value;
                  setEditingPlayerStats((prev) => {
                    const currentSec = (prev.RuoloSecondario || '').split(',').map((s) => s.trim()).filter(Boolean);
                    const filteredSec = currentSec.filter((r) => r !== newPrimary);
                    return {
                      ...prev,
                      Ruolo: newPrimary,
                      RuoloSecondario: filteredSec.length > 0 ? filteredSec.join(', ') : null
                    };
                  });
                }}
                className="modal-input" 
                style={{ width: '100%', appearance: 'auto' }}
              >
                <option value="">Nessuno</option>
                {uniqueRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Ruoli Secondari <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>(Opzionale)</span></span>
                {editSecRolesList.length > 0 && (
                  <span style={{ fontSize: '0.72rem', color: '#5de4ff', fontWeight: 600 }}>
                    {editSecRolesList.length} selezionat{editSecRolesList.length === 1 ? 'o' : 'i'}
                  </span>
                )}
              </label>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditSecRoleOpen((prev) => !prev);
                }}
                className="modal-input" 
                style={{ 
                  width: '100%', 
                  minHeight: '38px',
                  height: 'auto',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  border: isEditSecRoleOpen ? '1px solid #5de4ff' : '1px solid var(--color-border)',
                  boxShadow: isEditSecRoleOpen ? '0 0 8px rgba(93, 228, 255, 0.25)' : 'none',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1, alignItems: 'center', minWidth: 0 }}>
                  {editSecRolesList.length === 0 ? (
                    <span style={{ color: 'var(--color-text-muted, #777)', fontSize: '0.85rem' }}>
                      Nessuno (Seleziona...)
                    </span>
                  ) : (
                    editSecRolesList.map((r) => (
                      <span 
                        key={r}
                        style={{ 
                          background: 'rgba(93, 228, 255, 0.18)', 
                          color: '#5de4ff', 
                          border: '1px solid rgba(93, 228, 255, 0.4)', 
                          borderRadius: '4px', 
                          padding: '1px 6px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {r}
                        <span 
                          onClick={(e) => {
                            e.stopPropagation();
                            const next = editSecRolesList.filter((x) => x !== r);
                            setEditingPlayerStats((prev) => ({
                              ...prev,
                              RuoloSecondario: next.length > 0 ? next.join(', ') : null
                            }));
                          }}
                          style={{ cursor: 'pointer', marginLeft: '2px', opacity: 0.8, fontSize: '0.85rem' }}
                          title="Rimuovi ruolo"
                        >
                          ×
                        </span>
                      </span>
                    ))
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#888', marginLeft: '6px', flexShrink: 0 }}>
                  {isEditSecRoleOpen ? '▲' : '▼'}
                </span>
              </div>

              {isEditSecRoleOpen && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    minWidth: '220px',
                    marginTop: '4px',
                    background: '#151c24',
                    border: '1px solid rgba(93, 228, 255, 0.35)',
                    borderRadius: '8px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.85)',
                    zIndex: 1000,
                    maxHeight: '220px',
                    overflowY: 'auto',
                    padding: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px 6px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#888' }}>Scegli ruoli secondari:</span>
                    {editSecRolesList.length > 0 && (
                      <span 
                        onClick={() => setEditingPlayerStats((prev) => ({ ...prev, RuoloSecondario: null }))}
                        style={{ fontSize: '0.72rem', color: '#ff7777', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Azzera tutti
                      </span>
                    )}
                  </div>
                  {availableEditSecRoles.map((r) => {
                    const isChecked = editSecRolesList.includes(r);
                    return (
                      <div
                        key={r}
                        onClick={() => {
                          const next = isChecked
                            ? editSecRolesList.filter((x) => x !== r)
                            : [...editSecRolesList, r];
                          setEditingPlayerStats((prev) => ({
                            ...prev,
                            RuoloSecondario: next.length > 0 ? next.join(', ') : null
                          }));
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          background: isChecked ? 'rgba(93, 228, 255, 0.15)' : 'transparent',
                          color: isChecked ? '#5de4ff' : '#ddd',
                          fontSize: '0.82rem',
                          fontWeight: isChecked ? 700 : 400,
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} 
                          style={{ accentColor: '#5de4ff', cursor: 'pointer' }}
                        />
                        <span>{r}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <h4 style={{ marginTop: '1rem', color: '#6f9c81', borderBottom: '1px solid #23342b', paddingBottom: '0.5rem', margin: 0 }}>
            {isGk ? 'Statistiche da Portiere e Fisiche' : 'Statistiche Fisiche e Tecniche'}
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
            {statFields.map((f) => (
              <div key={f.key}>
                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'block' }}>{f.label}</label>
                <input 
                  type="number" 
                  className="modal-input"
                  value={editingPlayerStats[f.key as keyof Player]?.toString() || ''} 
                  onChange={(e) => setEditingPlayerStats((prev) => ({ ...prev, [f.key]: e.target.value ? parseInt(e.target.value) : null }))}
                  placeholder="-"
                />
              </div> 
            ))}
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'block' }}>Figurina / Immagine Profilo</label>
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/jpg"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setEditingPlayerImage(e.target.files[0]);
                }
              }}
              className="modal-input"
            />
          </div>

          <h4 style={{ marginTop: '1rem', color: '#6f9c81', borderBottom: '1px solid #23342b', paddingBottom: '0.5rem', margin: 0 }}>Altre Informazioni</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
            {TEXT_FIELDS.map((f) => (
              <div key={f.key}>
                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'block' }}>{f.label}</label>
                <input 
                  type="text" 
                  className="modal-input"
                  value={editingPlayerStats[f.key]?.toString() || ''}
                  onChange={(e) => setEditingPlayerStats((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.key === 'Infortunio' ? 'Nessuno / tipo e tempi di recupero' : '-'}
                />
              </div> 
            ))}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <button className="secondary-btn" onClick={handleClose}>Annulla</button>
          <button className="create-teams-btn" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  );
}
