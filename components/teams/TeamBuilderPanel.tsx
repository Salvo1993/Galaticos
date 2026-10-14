'use client';

import React from 'react';
import { Trash2, LayoutGrid, ChevronDown, Plus } from 'lucide-react';
import { PlayerSelectionGrid } from '@/components/teams/PlayerSelectionGrid';
import AlgoSettingsModal from '@/components/admin/AlgoSettingsModal';
import ManagePlayersModal from '@/components/admin/ManagePlayersModal';
import EditPlayerModal from '@/components/admin/EditPlayerModal';
import AddPlayerModal from '@/components/admin/AddPlayerModal';
import { ClusterSection } from '@/components/teams/ClusterSection';
import type { Player, Cluster, MatchResult, AlgoSettings, LeaderboardEntry, Campo, Results } from '@/types';

export interface TeamBuilderPanelProps {
  isAdmin: boolean;
  selectedPlayers: string[];
  setSelectedPlayers: React.Dispatch<React.SetStateAction<string[]>>;
  dbPlayers: Player[];
  loading: boolean;
  matchFormat: number;
  setMatchFormat: (format: number) => void;
  clusters: Cluster[];
  setClusters: React.Dispatch<React.SetStateAction<Cluster[]>>;
  isClustersExpanded: boolean;
  setIsClustersExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  selectedStadium: string;
  setSelectedStadium: (stadium: string) => void;
  dbCampi: Campo[];
  modulo7TeamA: string;
  modulo7TeamB: string;
  modulo8TeamA: string;
  modulo8TeamB: string;
  onOpenModuloModal: () => void;
  onOpenAddCampoModal: () => void;
  onPlayerChange: (index: number, name: string) => void;
  onGenerateTeams: () => void;
  onClearState: () => void;
  setResults: (results: Results | null) => void;
  // AlgoSettings Modal props
  algoModalOpen: boolean;
  setAlgoModalOpen: (open: boolean) => void;
  algoSettings: AlgoSettings;
  setAlgoSettings: React.Dispatch<React.SetStateAction<AlgoSettings>>;
  algoTab: 'pesi' | 'parametri';
  setAlgoTab: React.Dispatch<React.SetStateAction<'pesi' | 'parametri'>> | ((tab: 'pesi' | 'parametri') => void);
  ovrModifiers: Record<string, number>;
  setOvrModifiers: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  getRating: (name: string, withModifier?: boolean) => number;
  getSimulatedTeams: () => {
    teamA: string[];
    teamB: string[];
    ratingSumA: number;
    ratingSumB: number;
    diff: number;
  } | null;
  onSaveAlgoSettings: () => void;
  onResetAlgoSettings: () => void;
  // ManagePlayers Modal props
  isManageModalOpen: boolean;
  setIsManageModalOpen: (open: boolean) => void;
  onDeletePlayers: (names: string[]) => void;
  // EditPlayer Modal props
  isEditModalOpen: boolean;
  setIsEditModalOpen: (open: boolean) => void;
  editingPlayer: Player | null;
  setEditingPlayer: (player: Player | null) => void;
  onSaveEditPlayer: (payload: {
    oldName: string;
    newName: string;
    newRole: string;
    newRoleSecondario: string | null;
    stats: Partial<Player>;
    imageFile: File | null;
  }) => void | Promise<void>;
  // AddPlayer Modal props
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  onSaveAddPlayer: (payload: {
    name: string;
    role: string;
    roleSecondario: string | null;
    stats: Partial<Player>;
    mergeTarget: string;
    imageFile: File | null;
  }) => void | Promise<void>;
  // Shared state
  matches: MatchResult[];
  leaderboard: LeaderboardEntry[];
  statsData: any[];
  isSaving: boolean;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  // Cluster actions
  onAddCluster: () => void;
  onRemoveCluster: (id: number) => void;
  onToggleMemberInCluster: (clusterId: number, playerName: string) => void;
}

export const TeamBuilderPanel: React.FC<TeamBuilderPanelProps> = ({
  isAdmin,
  selectedPlayers,
  setSelectedPlayers,
  dbPlayers,
  loading,
  matchFormat,
  setMatchFormat,
  clusters,
  setClusters,
  isClustersExpanded,
  setIsClustersExpanded,
  selectedStadium,
  setSelectedStadium,
  dbCampi,
  modulo7TeamA,
  modulo7TeamB,
  modulo8TeamA,
  modulo8TeamB,
  onOpenModuloModal,
  onOpenAddCampoModal,
  onPlayerChange,
  onGenerateTeams,
  onClearState,
  setResults,
  algoModalOpen,
  setAlgoModalOpen,
  algoSettings,
  setAlgoSettings,
  algoTab,
  setAlgoTab,
  ovrModifiers,
  setOvrModifiers,
  getRating,
  getSimulatedTeams,
  onSaveAlgoSettings,
  onResetAlgoSettings,
  isManageModalOpen,
  setIsManageModalOpen,
  onDeletePlayers,
  isEditModalOpen,
  setIsEditModalOpen,
  editingPlayer,
  setEditingPlayer,
  onSaveEditPlayer,
  isAddModalOpen,
  setIsAddModalOpen,
  onSaveAddPlayer,
  matches,
  leaderboard,
  statsData,
  isSaving,
  showToast,
  onAddCluster,
  onRemoveCluster,
  onToggleMemberInCluster,
}) => {
  if (!isAdmin) return null;

  return (
    <>
      <PlayerSelectionGrid
        selectedPlayers={selectedPlayers}
        dbPlayers={dbPlayers}
        loading={loading}
        onPlayerChange={onPlayerChange}
        onOpenAlgoModal={() => setAlgoModalOpen(true)}
        onOpenManageModal={() => setIsManageModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      <AlgoSettingsModal
        isOpen={algoModalOpen}
        onClose={() => setAlgoModalOpen(false)}
        isAdmin={isAdmin}
        matchFormat={matchFormat}
        selectedPlayers={selectedPlayers}
        dbPlayers={dbPlayers}
        leaderboard={leaderboard}
        statsData={statsData}
        algoSettings={algoSettings}
        setAlgoSettings={setAlgoSettings}
        algoTab={algoTab}
        setAlgoTab={setAlgoTab}
        ovrModifiers={ovrModifiers}
        setOvrModifiers={setOvrModifiers}
        getRating={getRating}
        getSimulatedTeams={getSimulatedTeams}
        onSaveAlgoSettings={onSaveAlgoSettings}
        onResetAlgoSettings={onResetAlgoSettings}
      />

      <ManagePlayersModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        dbPlayers={dbPlayers}
        onOpenEditModal={player => {
          setEditingPlayer(player);
          setIsEditModalOpen(true);
        }}
        onDeletePlayers={onDeletePlayers}
        isSaving={isSaving}
      />

      <EditPlayerModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingPlayer(null);
        }}
        player={editingPlayer}
        dbPlayers={dbPlayers}
        onSave={onSaveEditPlayer}
        isSaving={isSaving}
        showToast={showToast}
      />

      <AddPlayerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        dbPlayers={dbPlayers}
        matches={matches}
        onSave={onSaveAddPlayer}
        isSaving={isSaving}
        showToast={showToast}
      />

      <ClusterSection
        clusters={clusters}
        selectedPlayers={selectedPlayers}
        isClustersExpanded={isClustersExpanded}
        setIsClustersExpanded={setIsClustersExpanded}
        onUpdateClusterName={(clusterId, name) =>
          setClusters(clusters.map(cl => (cl.id === clusterId ? { ...cl, name } : cl)))
        }
        onRemoveCluster={onRemoveCluster}
        onToggleMemberInCluster={onToggleMemberInCluster}
        onAddCluster={onAddCluster}
      />

      <div className="actions-main">
        <button className="create-teams-btn" onClick={onGenerateTeams} disabled={loading}>
          ⚽ Crea Squadre
        </button>
        <button className="clear-btn" onClick={onClearState} disabled={loading}>
          <Trash2 size={20} /> PULISCI
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '1rem',
          gap: '0.5rem',
          alignItems: 'center',
        }}
      >
        <select
          value={selectedStadium}
          onChange={e => setSelectedStadium(e.target.value)}
          className="stadium-input"
          style={{
            padding: '0.4rem',
            borderRadius: '4px',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            fontSize: '0.9rem',
            width: '200px',
            outline: 'none',
            textAlign: 'center',
          }}
        >
          {dbCampi.map(c => (
            <option key={c.id} value={c.nome}>
              {c.nome}
            </option>
          ))}
          {dbCampi.length === 0 && <option value="Campi Sole">Campi Sole</option>}
        </select>
        <select
          value={matchFormat}
          onChange={e => {
            const format = parseInt(e.target.value, 10);
            const targetCount = format * 2;
            setMatchFormat(format);
            setSelectedPlayers(prev => {
              if (prev.length < targetCount) {
                return [...prev, ...Array(targetCount - prev.length).fill('')];
              } else if (prev.length > targetCount) {
                return prev.slice(0, targetCount);
              }
              return prev;
            });
            if (selectedPlayers.length > targetCount) {
              setClusters(prevClusters => {
                const keptNames = new Set(selectedPlayers.slice(0, targetCount).filter(Boolean));
                return prevClusters.map(c => ({
                  ...c,
                  members: c.members.filter(m => keptNames.has(m)),
                }));
              });
            }
            setResults(null);
          }}
          style={{
            padding: '0.4rem',
            borderRadius: '4px',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            fontSize: '0.9rem',
            width: '90px',
            outline: 'none',
            textAlign: 'center',
          }}
        >
          <option value={5}>5vs5</option>
          <option value={6}>6vs6</option>
          <option value={7}>7vs7</option>
          <option value={8}>8vs8</option>
        </select>
        {(matchFormat === 7 || matchFormat === 8) && (
          <button
            type="button"
            onClick={onOpenModuloModal}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '4px',
              background:
                'linear-gradient(135deg, rgba(52, 152, 219, 0.15) 0%, rgba(41, 128, 185, 0.25) 100%)',
              color: '#3498db',
              border: '1px solid rgba(52, 152, 219, 0.4)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            title="Scegli il modulo tattico di gioco"
          >
            <LayoutGrid size={15} />
            <span>
              Modulo:{' '}
              {matchFormat === 8
                ? modulo8TeamA === modulo8TeamB
                  ? modulo8TeamA
                  : `${modulo8TeamA}/${modulo8TeamB}`
                : modulo7TeamA === modulo7TeamB
                ? modulo7TeamA
                : `${modulo7TeamA}/${modulo7TeamB}`}
            </span>
            <ChevronDown size={13} style={{ opacity: 0.7 }} />
          </button>
        )}
        <button
          onClick={onOpenAddCampoModal}
          style={{
            padding: '0.4rem',
            borderRadius: '4px',
            background: 'var(--color-surface-2)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Aggiungi nuovo campo"
        >
          <Plus size={16} />
        </button>
      </div>
    </>
  );
};

export default TeamBuilderPanel;
