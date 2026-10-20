'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { MatchResult } from '@/types';

export interface AddMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  partitaId: string;
  matches: MatchResult[];
  onSuccess: () => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AddMediaModal: React.FC<AddMediaModalProps> = ({
  isOpen,
  onClose,
  partitaId,
  matches,
  onSuccess,
  showToast,
}) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [autori, setAutori] = useState<string[]>([]);
  const [coAutori, setCoAutori] = useState<string[]>([]);
  const [tipologia, setTipologia] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const selectedMatch = matches.find(m => m.id === Number(partitaId));
  const players = selectedMatch
    ? [...(selectedMatch.team_a_players || []), ...(selectedMatch.team_b_players || [])]
    : [];

  const handleSave = async () => {
    if (!partitaId) {
      showToast('Seleziona una partita prima di aggiungere media', 'error');
      return;
    }
    if (!youtubeUrl) {
      showToast('Inserisci un link YouTube', 'error');
      return;
    }
    if (!tipologia) {
      showToast('Seleziona una tipologia', 'error');
      return;
    }

    let youtubeId = youtubeUrl;
    const ytMatch = youtubeUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
    );
    if (ytMatch) youtubeId = ytMatch[1];

    setIsSaving(true);
    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partita_id: Number(partitaId),
          giocatore: autori.length > 0 ? autori.join(', ') : null,
          co_giocatore: coAutori.length > 0 ? coAutori.join(', ') : null,
          tipologia,
          youtube_id: youtubeId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante il salvataggio');

      showToast('Media aggiunto con successo!', 'success');
      setYoutubeUrl('');
      setAutori([]);
      setCoAutori([]);
      setTipologia('');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Errore salvataggio media', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '450px' }}
        onClick={e => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h3 style={{ margin: 0 }}>Aggiungi Media</h3>
          <button
            className="secondary-btn"
            style={{
              padding: '0',
              background: 'transparent',
              border: 'none',
              color: '#9fd9b6',
              cursor: 'pointer',
            }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
          Aggiungi un video YouTube per la partita selezionata.
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              color: '#6f9c81',
              marginBottom: '0.3rem',
              fontWeight: 600,
            }}
          >
            Link YouTube *
          </label>
          <input
            type="text"
            value={youtubeUrl}
            onChange={e => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="modal-input"
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              color: '#6f9c81',
              marginBottom: '0.3rem',
              fontWeight: 600,
            }}
          >
            Autore/i (Protagonisti)
          </label>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.8rem',
              background: 'rgba(255,255,255,0.03)',
              padding: '0.8rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {!selectedMatch ? (
              <span style={{ fontSize: '0.8rem', color: '#6f9c81' }}>
                Seleziona una partita
              </span>
            ) : players.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: '#6f9c81' }}>
                Nessun giocatore in questa partita
              </span>
            ) : (
              players.map(p => (
                <label
                  key={p}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.85rem',
                    color: '#cfe8d8',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={autori.includes(p)}
                    onChange={e => {
                      if (e.target.checked) setAutori([...autori, p]);
                      else setAutori(autori.filter(a => a !== p));
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  {p}
                </label>
              ))
            )}
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              color: '#6f9c81',
              marginBottom: '0.3rem',
              fontWeight: 600,
            }}
          >
            Co-Autore/i (opzionale)
          </label>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.8rem',
              background: 'rgba(255,255,255,0.03)',
              padding: '0.8rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {!selectedMatch ? (
              <span style={{ fontSize: '0.8rem', color: '#6f9c81' }}>
                Seleziona una partita
              </span>
            ) : players.filter(p => !autori.includes(p)).length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: '#6f9c81' }}>
                Nessun co-autore disponibile
              </span>
            ) : (
              players
                .filter(p => !autori.includes(p))
                .map(p => (
                  <label
                    key={p}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.85rem',
                      color: '#cfe8d8',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={coAutori.includes(p)}
                      onChange={e => {
                        if (e.target.checked) setCoAutori([...coAutori, p]);
                        else setCoAutori(coAutori.filter(a => a !== p));
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    {p}
                  </label>
                ))
            )}
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              color: '#6f9c81',
              marginBottom: '0.3rem',
              fontWeight: 600,
            }}
          >
            Categoria Video *
          </label>
          <select
            className="modal-input"
            value={tipologia}
            onChange={e => setTipologia(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="">-- Seleziona --</option>
            <option value="Partita Completa">Partita Completa</option>
            <option value="Sintesi">Sintesi</option>
            <option value="Giocata">Giocata</option>
            <option value="Epic Fail">Epic Fail</option>
            <option value="Golazo">Golazo</option>
            <option value="Paratona">Paratona</option>
          </select>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            justifyContent: 'flex-end',
          }}
        >
          <button className="secondary-btn" onClick={onClose}>
            Annulla
          </button>
          <button
            className="create-teams-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </div>
    </div>
  );
};
