import React from 'react';
import { Plus } from 'lucide-react';
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
}

export const PlayerSelectionGrid: React.FC<PlayerSelectionGridProps> = ({
  selectedPlayers,
  dbPlayers,
  loading,
  onPlayerChange,
  onOpenAlgoModal,
  onOpenManageModal,
  onOpenAddModal
}) => {
  const getAvailableOptions = (currentIndex: number) => {
    const otherSelected = selectedPlayers.filter((p, i) => i !== currentIndex && p !== '');
    return dbPlayers.filter(p => !otherSelected.includes(p.Nome));
  };

  return (
    <section id="giocatori">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', gap: '1rem' }}>
        <h2>👥 Giocatori</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
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
