import React from 'react';
import { Plus, Save } from 'lucide-react';
import { Player } from '@/types';
import { CustomDropdown } from '@/components/ui/Dropdowns';

export interface PlayerSelectionGridProps {
  selectedPlayers: string[];
  dbPlayers: Player[];
  loading: boolean;
  onPlayerChange: (index: number, name: string) => void;
  onOpenAlgoModal: () => void;
  onOpenManageModal: () => void;
  onOpenAddModal: () => void;
  onSaveConvocati?: () => void;
  isSavingConvocati?: boolean;
}

export const PlayerSelectionGrid: React.FC<PlayerSelectionGridProps> = ({
  selectedPlayers,
  dbPlayers,
  loading,
  onPlayerChange,
  onOpenAlgoModal,
  onOpenManageModal,
  onOpenAddModal,
  onSaveConvocati,
  isSavingConvocati,
}) => {
  const confirmedCount = selectedPlayers.filter(p => p && p.trim() !== '').length;

  const getAvailableOptions = (currentIndex: number) => {
    const otherSelected = selectedPlayers.filter((p, i) => i !== currentIndex && p !== '');
    return dbPlayers.filter(p => !otherSelected.includes(p.Nome));
  };

  return (
    <section id="giocatori">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h2>👥 Giocatori</h2>
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: confirmedCount === selectedPlayers.length ? '#2ecc71' : '#5de4ff',
              background: confirmedCount === selectedPlayers.length ? 'rgba(46, 204, 113, 0.15)' : 'rgba(93, 228, 255, 0.12)',
              border: `1px solid ${confirmedCount === selectedPlayers.length ? 'rgba(46, 204, 113, 0.35)' : 'rgba(93, 228, 255, 0.3)'}`,
              padding: '2px 10px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {confirmedCount} / {selectedPlayers.length} Convocati
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
          {onSaveConvocati && (
            <button 
              className="secondary-btn" 
              onClick={onSaveConvocati} 
              disabled={isSavingConvocati}
              title="Salva immediatamente la lista dei giocatori convocati"
              style={{ borderColor: 'rgba(93, 228, 255, 0.4)', color: '#5de4ff' }}
            >
              <Save size={16} /> {isSavingConvocati ? 'Salvataggio...' : 'Salva Convocati'}
            </button>
          )}
          <button className="secondary-btn" onClick={onOpenAlgoModal}>
            Algoritmo
          </button>
          <button className="secondary-btn" onClick={onOpenManageModal}>
            Gestisci
          </button>
          <button className="secondary-btn" onClick={onOpenAddModal}>
            <Plus size={16} /> Aggiungi
          </button>
        </div>
      </div>
      <div className="players-grid">
        {selectedPlayers.map((val, i) => (
          <CustomDropdown
            key={i}
            index={i}
            value={val}
            options={getAvailableOptions(i)}
            onChange={(name) => onPlayerChange(i, name)}
            placeholder="Seleziona..."
            loading={loading}
          />
        ))}
      </div>
    </section>
  );
};
