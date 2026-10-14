'use client';

import React, { useState } from 'react';
import { X, Pencil } from 'lucide-react';
import { Player } from '@/types';

export interface ManagePlayersModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbPlayers: Player[];
  onOpenEditModal: (player: Player) => void;
  onDeletePlayers: (selectedNames: string[]) => Promise<void> | void;
  isSaving?: boolean;
}

export default function ManagePlayersModal({
  isOpen,
  onClose,
  dbPlayers,
  onOpenEditModal,
  onDeletePlayers,
  isSaving = false
}: ManagePlayersModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToDelete, setSelectedToDelete] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleClose = () => {
    setSearchQuery('');
    setSelectedToDelete(new Set());
    onClose();
  };

  const handleSave = async () => {
    if (selectedToDelete.size === 0) return;
    await onDeletePlayers(Array.from(selectedToDelete));
    setSelectedToDelete(new Set());
    setSearchQuery('');
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Gestisci Giocatori</h3>
          <button className="secondary-btn" style={{ padding: '0.2rem', display: 'flex' }} onClick={handleClose}>
            <X size={20} />
          </button>
        </div>
        <input 
          type="text" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cerca nome..."
          className="modal-input"
        />
        <div className="players-list-scroll" style={{ maxHeight: '300px', overflowY: 'auto', margin: '1rem 0', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          {dbPlayers
            .filter((p) => p.Nome.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((p) => (
              <div 
                key={p.Nome} 
                className={`player-row-select ${selectedToDelete.has(p.Nome) ? 'selected' : ''}`}
                style={{
                  padding: '0.8rem',
                  borderBottom: '1px solid var(--color-border)',
                  background: selectedToDelete.has(p.Nome) ? 'rgba(255, 68, 68, 0.15)' : 'transparent',
                  color: selectedToDelete.has(p.Nome) ? '#ff4444' : 'var(--color-text)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{p.Nome}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {p.Ruolo && <span style={{ fontSize: '0.75rem', color: '#6f9c81' }}>{p.Ruolo}</span>}
                    {p.RuoloSecondario && <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>• {p.RuoloSecondario}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                  <span 
                    role="button" 
                    aria-label="edit" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditModal(p);
                    }}
                    style={{ color: 'var(--color-text)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <Pencil size={16} />
                  </span>
                  <span 
                    role="button" 
                    aria-label="remove" 
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = new Set(selectedToDelete);
                      if (next.has(p.Nome)) next.delete(p.Nome);
                      else next.add(p.Nome);
                      setSelectedToDelete(next);
                    }}
                    style={{ 
                      color: selectedToDelete.has(p.Nome) ? '#ff4444' : 'var(--color-text)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      cursor: 'pointer',
                      opacity: selectedToDelete.has(p.Nome) ? 1 : 0.6
                    }}
                  >
                    <X size={18} />
                  </span>
                </div>
              </div>
            ))}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <button className="secondary-btn" onClick={handleClose}>Annulla</button>
          <button 
            className="create-teams-btn" 
            onClick={handleSave}
            disabled={isSaving || selectedToDelete.size === 0}
          >
            {isSaving ? 'Salvataggio...' : 'Salva cambiamenti'}
          </button>
        </div>
      </div>
    </div>
  );
}
