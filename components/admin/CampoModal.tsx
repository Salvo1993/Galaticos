'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Campo } from '@/types';

export interface CampoModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbCampi: Campo[];
  onCampiUpdated: (campi: Campo[], newSelectedStadium?: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const CampoModal: React.FC<CampoModalProps> = ({
  isOpen,
  onClose,
  dbCampi,
  onCampiUpdated,
  showToast,
}) => {
  const [campoModalMode, setCampoModalMode] = useState<'add' | 'manage'>('add');
  const [newCampoName, setNewCampoName] = useState('');
  const [newCampoUrl, setNewCampoUrl] = useState('');
  const [selectedCampoIdToManage, setSelectedCampoIdToManage] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setNewCampoName('');
    setNewCampoUrl('');
    setSelectedCampoIdToManage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAddOrUpdate = async () => {
    if (!newCampoName.trim()) {
      showToast('Nome campo obbligatorio', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: { nome: string; posizione_url: string; id?: number } = {
        nome: newCampoName.trim(),
        posizione_url: newCampoUrl.trim(),
      };
      if (campoModalMode === 'manage' && selectedCampoIdToManage) {
        payload.id = selectedCampoIdToManage;
      }

      const res = await fetch('/api/campi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(campoModalMode === 'add' ? 'Campo aggiunto!' : 'Campo aggiornato!', 'success');
      resetForm();
      onClose();

      // Refetch campi
      const campiRes = await fetch('/api/campi', { cache: 'no-store' });
      const campiData = await campiRes.json().catch(() => []);
      const updatedList = Array.isArray(campiData) ? campiData : [];
      onCampiUpdated(updatedList, payload.nome);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCampoIdToManage) return;
    if (!confirm('Sei sicuro di voler eliminare questo campo?')) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/campi', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCampoIdToManage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Campo eliminato!', 'success');
      resetForm();
      onClose();

      // Refetch campi
      const campiRes = await fetch('/api/campi', { cache: 'no-store' });
      const campiData = await campiRes.json().catch(() => []);
      const updatedList = Array.isArray(campiData) ? campiData : [];
      onCampiUpdated(updatedList);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div
          className="modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'nowrap' }}>
            <h2
              style={{
                cursor: 'pointer',
                opacity: campoModalMode === 'add' ? 1 : 0.5,
                margin: 0,
                fontSize: '1.1rem',
                paddingRight: '0.8rem',
                borderRight: '1px solid rgba(255,255,255,0.2)',
                whiteSpace: 'nowrap',
              }}
              onClick={() => {
                setCampoModalMode('add');
                resetForm();
              }}
            >
              AGGIUNGI CAMPO
            </h2>
            <h2
              style={{
                cursor: 'pointer',
                opacity: campoModalMode === 'manage' ? 1 : 0.5,
                margin: 0,
                fontSize: '1.1rem',
                whiteSpace: 'nowrap',
              }}
              onClick={() => setCampoModalMode('manage')}
            >
              GESTISCI
            </h2>
          </div>
          <button
            className="secondary-btn"
            style={{
              padding: '0 0 0 0.5rem',
              margin: 0,
              display: 'flex',
              background: 'transparent',
              border: 'none',
              color: '#9fd9b6',
              cursor: 'pointer',
            }}
            onClick={handleClose}
          >
            <X size={20} />
          </button>
        </div>

        {campoModalMode === 'manage' && (
          <div className="form-group" style={{ marginBottom: '1.2rem' }}>
            <label>Seleziona Campo da Gestire</label>
            <select
              className="modal-input"
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'var(--color-surface-2)',
                color: 'white',
                borderRadius: '4px',
              }}
              value={selectedCampoIdToManage || ''}
              onChange={e => {
                const id = Number(e.target.value);
                setSelectedCampoIdToManage(id);
                const c = dbCampi.find(x => x.id === id);
                if (c) {
                  setNewCampoName(c.nome);
                  setNewCampoUrl(c.posizione_url || '');
                }
              }}
            >
              <option value="">-- Seleziona --</option>
              {dbCampi.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group" style={{ marginBottom: '1.2rem' }}>
          <label>Nome Campo *</label>
          <input
            type="text"
            value={newCampoName}
            onChange={e => setNewCampoName(e.target.value)}
            placeholder="Es. Seidita"
            className="modal-input"
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1.2rem' }}>
          <label>Posizione URL (Google Maps)</label>
          <input
            type="text"
            value={newCampoUrl}
            onChange={e => setNewCampoUrl(e.target.value)}
            placeholder="Es. https://maps.app.goo.gl/..."
            className="modal-input"
          />
        </div>

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-4)',
            justifyContent: 'center',
          }}
        >
          {campoModalMode === 'manage' && selectedCampoIdToManage && (
            <button
              className="btn-cancel"
              style={{
                background: '#d32f2f',
                color: 'white',
                border: 'none',
                padding: '0.4rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              Elimina
            </button>
          )}
          <button
            className="create-teams-btn"
            onClick={handleAddOrUpdate}
            disabled={isSubmitting}
          >
            {campoModalMode === 'add' ? 'AGGIUNGI' : 'SALVA'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampoModal;
