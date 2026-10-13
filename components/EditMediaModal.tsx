'use client';

import React, { useState, useEffect } from 'react';
import { X, Pencil, Video, User, Users, Tag, Calendar, ExternalLink } from 'lucide-react';

export interface MediaItem {
  id: number;
  partita_id: number;
  giocatore: string | null;
  co_giocatore: string | null;
  tipologia: string;
  youtube_id: string;
  created_at: string;
}

export interface MatchOption {
  id: number;
  data: string;
  team_a_name: string;
  team_b_name: string;
  risultato?: string | null;
  team_a_players?: string[];
  team_b_players?: string[];
}

interface EditMediaModalProps {
  isOpen: boolean;
  media: MediaItem | null;
  matches: MatchOption[];
  onClose: () => void;
  onSaveSuccess: (updatedItem: MediaItem) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function EditMediaModal({
  isOpen,
  media,
  matches,
  onClose,
  onSaveSuccess,
  showToast
}: EditMediaModalProps) {
  const [partitaId, setPartitaId] = useState<number>(0);
  const [giocatore, setGiocatore] = useState<string>('');
  const [coGiocatore, setCoGiocatore] = useState<string>('');
  const [tipologia, setTipologia] = useState<string>('Golazo');
  const [youtubeInput, setYoutubeInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync state when media prop changes
  useEffect(() => {
    if (media) {
      setPartitaId(media.partita_id);
      setGiocatore(media.giocatore || '');
      setCoGiocatore(media.co_giocatore || '');
      setTipologia(media.tipologia || 'Golazo');
      setYoutubeInput(media.youtube_id || '');
    }
  }, [media]);

  if (!isOpen || !media) return null;

  // Extract clean 11-char YouTube ID
  const extractId = (urlOrId: string) => {
    const trimmed = (urlOrId || '').trim();
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : trimmed;
  };

  const currentYoutubeId = extractId(youtubeInput);

  // Current selected match to get players list
  const selectedMatch = matches.find(m => m.id === Number(partitaId));
  const matchPlayers = [
    ...(selectedMatch?.team_a_players || []),
    ...(selectedMatch?.team_b_players || [])
  ];

  const handleSave = async () => {
    if (!partitaId) {
      showToast('Seleziona una partita valida', 'error');
      return;
    }
    if (!tipologia.trim()) {
      showToast('Seleziona una categoria', 'error');
      return;
    }
    const cleanYt = extractId(youtubeInput);
    if (!cleanYt) {
      showToast('Inserisci un link o ID YouTube valido', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/media', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: media.id,
          partita_id: Number(partitaId),
          giocatore: giocatore.trim() || null,
          co_giocatore: coGiocatore.trim() || null,
          tipologia: tipologia.trim(),
          youtube_id: cleanYt
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante l\'aggiornamento del video');
      }

      showToast('Video aggiornato con successo!', 'success');
      onSaveSuccess({
        ...media,
        partita_id: Number(partitaId),
        giocatore: giocatore.trim() || null,
        co_giocatore: coGiocatore.trim() || null,
        tipologia: tipologia.trim(),
        youtube_id: cleanYt
      });
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Errore di connessione', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '560px', 
          width: '94%',
          maxHeight: '90vh', 
          overflowY: 'auto',
          background: '#0d1c16',
          border: '1px solid rgba(52, 214, 128, 0.25)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '6px', borderRadius: '8px', color: '#f59e0b' }}>
              <Pencil size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff' }}>Modifica Video</h3>
          </div>
          <button 
            className="secondary-btn" 
            style={{ padding: '4px', background: 'transparent', border: 'none', color: '#9fd9b6', cursor: 'pointer' }} 
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Preview */}
        {currentYoutubeId && (
          <div style={{ marginBottom: '1.2rem', borderRadius: '8px', overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ position: 'relative', paddingBottom: '45%', height: 0 }}>
              <iframe
                src={`https://www.youtube.com/embed/${currentYoutubeId}`}
                title="Preview"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div style={{ padding: '6px 10px', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)' }}>
              <span>ID: <code style={{ color: '#38bdf8' }}>{currentYoutubeId}</code></span>
              <a 
                href={`https://youtu.be/${currentYoutubeId}`} 
                target="_blank" 
                rel="noreferrer" 
                style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
              >
                Apri su YouTube <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}

        {/* Partita */}
        <div style={{ marginBottom: '1.1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#9fd9b6', marginBottom: '0.4rem', fontWeight: 600 }}>
            <Calendar size={14} /> Partita Associata *
          </label>
          <select 
            className="modal-input" 
            value={partitaId} 
            onChange={e => setPartitaId(Number(e.target.value))}
            style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px' }}
          >
            {matches.map(m => (
              <option key={m.id} value={m.id} style={{ background: '#13281f', color: '#fff' }}>
                {new Date(m.data).toLocaleDateString('it-IT')} — {m.team_a_name} vs {m.team_b_name} {m.risultato ? `(${m.risultato})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Categoria / Tipologia */}
        <div style={{ marginBottom: '1.1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#9fd9b6', marginBottom: '0.4rem', fontWeight: 600 }}>
            <Tag size={14} /> Categoria Video *
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
            {['Golazo', 'Paratona', 'Epic Fail', 'Giocata', 'Partita Completa'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setTipologia(cat)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: tipologia === cat ? '1px solid #34d680' : '1px solid rgba(255,255,255,0.12)',
                  background: tipologia === cat ? 'rgba(52, 214, 128, 0.2)' : 'rgba(255,255,255,0.04)',
                  color: tipologia === cat ? '#34d680' : '#cbd5e1',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <input 
            type="text"
            className="modal-input"
            value={tipologia}
            onChange={e => setTipologia(e.target.value)}
            placeholder="Oppure inserisci una categoria personalizzata..."
            style={{ width: '100%', padding: '0.55rem 0.8rem', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px' }}
          />
        </div>

        {/* Autore / Giocatore principale */}
        <div style={{ marginBottom: '1.1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#9fd9b6', marginBottom: '0.4rem', fontWeight: 600 }}>
            <User size={14} /> Autore (Giocatore Principale)
          </label>
          <input 
            type="text" 
            className="modal-input" 
            value={giocatore} 
            onChange={e => setGiocatore(e.target.value)}
            placeholder="Es. Tommaso LG, Pino, Michelangelo..."
            style={{ width: '100%', padding: '0.55rem 0.8rem', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', marginBottom: matchPlayers.length > 0 ? '6px' : '0' }}
          />
          {matchPlayers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: '#6f9c81', marginRight: '4px', alignSelf: 'center' }}>Rapidi:</span>
              {matchPlayers.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setGiocatore(p)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    border: giocatore === p ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                    background: giocatore === p ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: giocatore === p ? '#38bdf8' : '#94a3b8'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Co-Autore / Assist */}
        <div style={{ marginBottom: '1.1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#9fd9b6', marginBottom: '0.4rem', fontWeight: 600 }}>
            <Users size={14} /> Co-Autore / Assist (Facoltativo)
          </label>
          <input 
            type="text" 
            className="modal-input" 
            value={coGiocatore} 
            onChange={e => setCoGiocatore(e.target.value)}
            placeholder="Es. SalvoM, Marco..."
            style={{ width: '100%', padding: '0.55rem 0.8rem', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', marginBottom: matchPlayers.length > 0 ? '6px' : '0' }}
          />
          {matchPlayers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: '#6f9c81', marginRight: '4px', alignSelf: 'center' }}>Rapidi:</span>
              {matchPlayers.filter(p => p !== giocatore).map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCoGiocatore(p)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    border: coGiocatore === p ? '1px solid #a855f7' : '1px solid rgba(255,255,255,0.08)',
                    background: coGiocatore === p ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: coGiocatore === p ? '#c084fc' : '#94a3b8'
                  }}
                >
                  {p}
                </button>
              ))}
              {coGiocatore && (
                <button
                  type="button"
                  onClick={() => setCoGiocatore('')}
                  style={{
                    padding: '2px 6px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#f87171'
                  }}
                >
                  Rimuovi
                </button>
              )}
            </div>
          )}
        </div>

        {/* Link YouTube o ID */}
        <div style={{ marginBottom: '1.4rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#9fd9b6', marginBottom: '0.4rem', fontWeight: 600 }}>
            <Video size={14} /> Link YouTube o Video ID *
          </label>
          <input 
            type="text" 
            className="modal-input" 
            value={youtubeInput} 
            onChange={e => setYoutubeInput(e.target.value)}
            placeholder="https://youtu.be/... oppure ID a 11 caratteri"
            style={{ width: '100%', padding: '0.55rem 0.8rem', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px' }}
          />
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
          <button 
            type="button" 
            className="secondary-btn" 
            onClick={onClose}
            disabled={isSaving}
            style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none' }}
          >
            Annulla
          </button>
          <button 
            type="button" 
            className="create-teams-btn" 
            onClick={handleSave} 
            disabled={isSaving}
            style={{ 
              padding: '0.6rem 1.4rem', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              background: '#34d680', 
              color: '#000', 
              fontWeight: 'bold', 
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
          </button>
        </div>
      </div>
    </div>
  );
}
