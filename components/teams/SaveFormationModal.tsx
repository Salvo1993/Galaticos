'use client';

import React from 'react';

export interface SaveFormationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export const SaveFormationModal: React.FC<SaveFormationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px' }}>
        <h3 style={{ marginBottom: '1rem' }}>Salva Formazione</h3>
        <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
          Confermi di voler salvare questa formazione?
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <button className="secondary-btn" onClick={onClose}>
            Annulla
          </button>
          <button className="create-teams-btn" onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveFormationModal;
