'use client';

import React from 'react';

export interface DeleteMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export default function DeleteMatchModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false
}: DeleteMatchModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>Elimina Partita</h3>
        <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
          Sei sicuro di voler eliminare questa partita? L'operazione è irreversibile.
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <button className="secondary-btn" onClick={onClose}>
            Annulla
          </button>
          <button
            className="create-teams-btn"
            style={{
              background: '#ff6b6b',
              boxShadow: '0 10px 15px -3px rgba(255, 107, 107, 0.3)'
            }}
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Eliminazione...' : 'Elimina'}
          </button>
        </div>
      </div>
    </div>
  );
}
