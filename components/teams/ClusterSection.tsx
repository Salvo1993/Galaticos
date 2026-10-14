import React from 'react';
import { X, Plus } from 'lucide-react';
import { Cluster } from '@/types';

export interface ClusterSectionProps {
  clusters: Cluster[];
  selectedPlayers: string[];
  isClustersExpanded: boolean;
  setIsClustersExpanded: (expanded: boolean) => void;
  onUpdateClusterName: (clusterId: number, name: string) => void;
  onRemoveCluster: (clusterId: number) => void;
  onToggleMemberInCluster: (clusterId: number, playerName: string) => void;
  onAddCluster: () => void;
}

export const ClusterSection: React.FC<ClusterSectionProps> = ({
  clusters,
  selectedPlayers,
  isClustersExpanded,
  setIsClustersExpanded,
  onUpdateClusterName,
  onRemoveCluster,
  onToggleMemberInCluster,
  onAddCluster
}) => {
  return (
    <section id="cluster">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>⚡ Cluster di Vincolo</h2>
        {clusters.length > 0 && (
          <button 
            className="secondary-btn" 
            onClick={() => setIsClustersExpanded(!isClustersExpanded)}
            style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
          >
            {isClustersExpanded ? 'Comprimi' : 'Espandi'}
          </button>
        )}
      </div>
      <p className="section-subtitle">I giocatori dello stesso cluster saranno divisi in squadre diverse</p>
      
      {(isClustersExpanded || clusters.length === 0) && (
        <>
          <div className="clusters-list">
            {clusters.map(c => (
              <div key={c.id} className="cluster-card">
                <div className="cluster-header">
                  <input 
                    type="text" 
                    className="cluster-name-input" 
                    value={c.name} 
                    onChange={(e) => onUpdateClusterName(c.id, e.target.value)} 
                  />
                  <button className="remove-cluster-btn" onClick={() => onRemoveCluster(c.id)}><X size={20} /></button>
                </div>
                <div className="cluster-players-selection">
                  {selectedPlayers.filter(p => p !== '').map(name => {
                    const isSelected = c.members.includes(name);
                    const isTaken = clusters.some(cl => cl.id !== c.id && cl.members.includes(name));
                    return (
                      <div 
                        key={name} 
                        className={`player-chip ${isSelected ? 'selected' : ''} ${isTaken ? 'disabled' : ''}`}
                        onClick={() => !isTaken && onToggleMemberInCluster(c.id, name)}
                      >
                        {name}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <button className="add-cluster-btn" onClick={onAddCluster}>
            <Plus size={18} /> Aggiungi Cluster
          </button>
        </>
      )}
    </section>
  );
};
