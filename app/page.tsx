'use client';

import { useAppData } from '@/hooks/useAppData';
import { useTeamBuilder } from '@/hooks/useTeamBuilder';

// Components
import { HeaderBanner } from '@/components/layout/HeaderBanner';
import { TeamBuilderPanel } from '@/components/teams/TeamBuilderPanel';
import ModuloModal from '@/components/teams/ModuloModal';
import PredictionSettingsModal from '@/components/stats/PredictionSettingsModal';
import { FormationResultsSection } from '@/components/teams/FormationResultsSection';
import MatchArchive from '@/components/matches/MatchArchive';
import { WeeklyStatsSection } from '@/components/stats/WeeklyStatsSection';
import { LeaderboardSection } from '@/components/stats/LeaderboardSection';
import { MediaArchiveSection } from '@/components/media/MediaArchiveSection';
import { StatsTrendsSection } from '@/components/stats/StatsTrendsSection';
import UpdateResultModal from '@/components/matches/UpdateResultModal';
import DeleteMatchModal from '@/components/matches/DeleteMatchModal';
import { SaveFormationModal } from '@/components/teams/SaveFormationModal';
import { PlayerCardModal } from '@/components/players/PlayerCardModal';
import { CampoModal } from '@/components/admin/CampoModal';
import { SfidaModal } from '@/components/stats/SfidaModal';

// Types & defaults
import {
  defaultPredictionSettings,
  defaultModuloSettings,
} from '@/types';
import type { PredictionSettings, ModuloSettings } from '@/types';
import {
  getMatchFormatSize,
  isMatchAllowedForPrediction,
} from '@/lib/stats/prediction-engine';
import { getPitchPositionsForTeam } from '@/lib/teams/formation-utils';
import {
  parseScorersString,
  parseScorersWithMinutes,
  stringifyScorers,
  stringifyScorersWithMinutes
} from '@/lib/stats/match-utils';

export type { PredictionSettings, ModuloSettings };
export {
  defaultPredictionSettings,
  defaultModuloSettings,
  getMatchFormatSize,
  isMatchAllowedForPrediction,
  getPitchPositionsForTeam,
  parseScorersString,
  parseScorersWithMinutes,
  stringifyScorers,
  stringifyScorersWithMinutes,
};

export default function Home() {
  const appData = useAppData({
    onInitLoaded: (payload) => builder.hydrateTeamBuilder(payload),
  });

  const builder = useTeamBuilder({
    dbPlayers: appData.dbPlayers,
    leaderboard: appData.leaderboard,
    statsData: appData.statsData,
    matches: appData.matches,
    refreshMatches: appData.refreshMatches,
    dbCampi: appData.dbCampi,
    matchLabel: appData.matchLabel,
    showToast: appData.showToast,
    setGlobalLoading: appData.setLoading,
  });

  if (appData.loading) {
    return (
      <div
        className="container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '1.5rem',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTopColor: '#5de4ff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <p style={{ color: '#cfe8d8', fontSize: '1rem', fontWeight: 600 }}>Caricamento dati...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="container">
      <HeaderBanner
        headerImage={appData.headerImage}
        setHeaderImage={appData.setHeaderImage}
        isAdmin={appData.isAdmin}
        matchLabel={appData.matchLabel}
        setMatchLabel={appData.setMatchLabel}
        saveSettings={appData.saveSettings}
        session={appData.session}
        theme={appData.theme}
        setTheme={appData.setTheme}
        showToast={appData.showToast}
      />

      {appData.error && (
        <div
          className="toast visible error"
          style={{ position: 'static', transform: 'none', margin: '0 0 2rem 0' }}
        >
          {appData.error}
        </div>
      )}

      <TeamBuilderPanel
        isAdmin={appData.isAdmin}
        selectedPlayers={builder.selectedPlayers}
        setSelectedPlayers={builder.setSelectedPlayers}
        dbPlayers={appData.dbPlayers}
        loading={appData.loading}
        matchFormat={builder.matchFormat}
        setMatchFormat={builder.setMatchFormat}
        clusters={builder.clusters}
        setClusters={builder.setClusters}
        isClustersExpanded={builder.isClustersExpanded}
        setIsClustersExpanded={builder.setIsClustersExpanded}
        selectedStadium={builder.selectedStadium}
        setSelectedStadium={builder.setSelectedStadium}
        dbCampi={appData.dbCampi}
        modulo7TeamA={builder.modulo7TeamA}
        modulo7TeamB={builder.modulo7TeamB}
        modulo8TeamA={builder.modulo8TeamA}
        modulo8TeamB={builder.modulo8TeamB}
        onOpenModuloModal={() => builder.setIsModuloModalOpen(true)}
        onOpenAddCampoModal={() => appData.setIsAddCampoModalOpen(true)}
        onPlayerChange={builder.handlePlayerChange}
        onGenerateTeams={builder.generateTeams}
        onClearState={builder.clearState}
        setResults={builder.setResults}
        algoModalOpen={builder.algoModalOpen}
        setAlgoModalOpen={builder.setAlgoModalOpen}
        algoSettings={builder.algoSettings}
        setAlgoSettings={builder.setAlgoSettings}
        algoTab={builder.algoTab}
        setAlgoTab={builder.setAlgoTab}
        ovrModifiers={builder.ovrModifiers}
        setOvrModifiers={builder.setOvrModifiers}
        getRating={builder.getRating}
        getSimulatedTeams={builder.getSimulatedTeams}
        onSaveAlgoSettings={builder.saveAlgoSettings}
        onResetAlgoSettings={builder.resetAlgoSettings}
        isManageModalOpen={appData.isManageModalOpen}
        setIsManageModalOpen={appData.setIsManageModalOpen}
        onDeletePlayers={(names) => appData.handleDeletePlayers(names, builder.onPlayersDeleted)}
        isEditModalOpen={appData.isEditModalOpen}
        setIsEditModalOpen={appData.setIsEditModalOpen}
        editingPlayer={appData.editingPlayer}
        setEditingPlayer={appData.setEditingPlayer}
        onSaveEditPlayer={(payload) =>
          appData.handleEditPlayerSubmit(payload, builder.onPlayerRenamed)
        }
        isAddModalOpen={appData.isAddModalOpen}
        setIsAddModalOpen={appData.setIsAddModalOpen}
        onSaveAddPlayer={appData.handleAddPlayer}
        matches={appData.matches}
        leaderboard={appData.leaderboard}
        statsData={appData.statsData}
        isSaving={appData.isSaving || builder.isSaving}
        showToast={appData.showToast}
        onAddCluster={builder.addCluster}
        onRemoveCluster={builder.removeCluster}
        onToggleMemberInCluster={builder.toggleMemberInCluster}
        onSaveConvocati={builder.saveCurrentConvocati}
      />

      <ModuloModal
        isOpen={builder.isModuloModalOpen}
        onClose={() => builder.setIsModuloModalOpen(false)}
        matchFormat={builder.matchFormat}
        teamAName={builder.teamAName}
        teamBName={builder.teamBName}
        targetTeam={builder.moduloModalTargetTeam}
        setTargetTeam={builder.setModuloModalTargetTeam}
        modulo7TeamA={builder.modulo7TeamA}
        modulo7TeamB={builder.modulo7TeamB}
        modulo8TeamA={builder.modulo8TeamA}
        modulo8TeamB={builder.modulo8TeamB}
        onSaveModuloSettings={builder.saveModuloSettings}
        showToast={appData.showToast}
      />

      <PredictionSettingsModal
        isOpen={builder.isPredictionModalOpen}
        onClose={() => builder.setIsPredictionModalOpen(false)}
        tempSettings={builder.tempPredictionSettings}
        setTempSettings={builder.setTempPredictionSettings}
        onSave={builder.savePredictionSettings}
        defaultSettings={defaultPredictionSettings}
      />

      <FormationResultsSection
        results={builder.results}
        resultsRef={builder.resultsRef}
        pitchesRef={builder.pitchesRef}
        teamAName={builder.teamAName}
        setTeamAName={builder.setTeamAName}
        teamBName={builder.teamBName}
        setTeamBName={builder.setTeamBName}
        dbPlayers={appData.dbPlayers}
        matches={appData.matches}
        setMatches={appData.setMatches}
        isAdmin={appData.isAdmin}
        isSaving={appData.isSaving || builder.isSaving}
        modulo7TeamA={builder.modulo7TeamA}
        modulo7TeamB={builder.modulo7TeamB}
        modulo8TeamA={builder.modulo8TeamA}
        modulo8TeamB={builder.modulo8TeamB}
        matchFormat={builder.matchFormat}
        predictionSettings={builder.predictionSettings}
        historicalPredictions={builder.historicalPredictions}
        leaderboard={appData.leaderboard}
        userOverrideMaglia={builder.userOverrideMaglia}
        setUserOverrideMaglia={builder.setUserOverrideMaglia}
        onOpenModuloModal={(team) => {
          builder.setModuloModalTargetTeam(team);
          builder.setIsModuloModalOpen(true);
        }}
        onOpenPredictionModal={() => {
          builder.setTempPredictionSettings(builder.predictionSettings);
          builder.setIsPredictionModalOpen(true);
        }}
        onSelectPlayerForCard={appData.setSelectedPlayerForCard}
        onSwapPlayers={builder.handleSwap}
        onRoleSwap={builder.handleRoleSwap}
        onRemescola={() => builder.generateTeams(true)}
        onCopyResults={builder.copyResults}
        onDownloadFormationImage={builder.downloadFormationImage}
        onSaveFormation={builder.saveFormation}
        showToast={appData.showToast}
      />

      <MatchArchive
        matches={appData.matches}
        dbPlayers={appData.dbPlayers}
        theme={appData.theme}
        isAdmin={appData.isAdmin}
        mediaItems={appData.mediaItems}
        historicalPredictions={builder.historicalPredictions}
        onOpenUpdateModal={(m) => {
          appData.setSelectedMatchForUpdate(m);
          appData.setIsUpdateModalOpen(true);
        }}
        onOpenDeleteModal={(m) => {
          appData.setSelectedMatchForDelete(m);
          appData.setIsDeleteModalOpen(true);
        }}
        onCopyMedia={appData.handleCopyMatchMedia}
      />

      <WeeklyStatsSection
        matches={appData.matches}
        showGuests={appData.showGuests}
        dbPlayers={appData.dbPlayers}
      />

      <LeaderboardSection
        leaderboard={appData.leaderboard}
        isLoadingLeaderboard={appData.isLoadingLeaderboard}
        fetchLeaderboard={appData.fetchLeaderboard}
        showGuests={appData.showGuests}
        setShowGuests={appData.setShowGuests}
        dbPlayers={appData.dbPlayers}
        matches={appData.matches}
        onOpenSfidaModal={() => appData.setIsSfidaModalOpen(true)}
      />

      <MediaArchiveSection
        mediaItems={appData.mediaItems}
        setMediaItems={appData.setMediaItems}
        matches={appData.matches}
        dbPlayers={appData.dbPlayers}
        isAdmin={appData.isAdmin}
        copyMatchMediaToClipboard={appData.handleCopyMatchMedia}
        showToast={appData.showToast}
      />

      <StatsTrendsSection
        matches={appData.matches}
        showGuests={appData.showGuests}
        dbPlayers={appData.dbPlayers}
        statsData={appData.statsData}
      />

      <UpdateResultModal
        isOpen={appData.isUpdateModalOpen}
        onClose={() => {
          appData.setIsUpdateModalOpen(false);
          appData.setSelectedMatchForUpdate(null);
        }}
        match={appData.selectedMatchForUpdate}
        onSave={appData.handleUpdateResult}
        onDelete={() => {
          appData.setSelectedMatchForDelete(appData.selectedMatchForUpdate);
          appData.setIsDeleteModalOpen(true);
        }}
        isSaving={appData.isSaving}
      />

      <DeleteMatchModal
        isOpen={appData.isDeleteModalOpen}
        onClose={() => {
          appData.setIsDeleteModalOpen(false);
          appData.setSelectedMatchForDelete(null);
        }}
        onConfirm={appData.handleDeleteMatch}
        isDeleting={appData.isSaving}
      />

      <SaveFormationModal
        isOpen={builder.isSaveFormationModalOpen}
        onClose={() => builder.setIsSaveFormationModalOpen(false)}
        onSave={builder.saveFormation}
        isSaving={builder.isSaving}
      />

      <PlayerCardModal
        playerName={appData.selectedPlayerForCard}
        onClose={() => appData.setSelectedPlayerForCard(null)}
        dbPlayers={appData.dbPlayers}
      />

      {appData.toast && (
        <div className={`toast visible ${appData.toast.type}`}>
          {appData.toast.message}
        </div>
      )}

      <CampoModal
        isOpen={appData.isAddCampoModalOpen}
        onClose={() => appData.setIsAddCampoModalOpen(false)}
        dbCampi={appData.dbCampi}
        onCampiUpdated={(campi, newSelectedStadium) => {
          appData.setDbCampi(campi);
          if (newSelectedStadium) {
            builder.setSelectedStadium(newSelectedStadium);
          }
        }}
        showToast={appData.showToast}
      />

      <SfidaModal
        isOpen={appData.isSfidaModalOpen}
        onClose={() => appData.setIsSfidaModalOpen(false)}
        matches={appData.matches}
        dbPlayers={appData.dbPlayers}
        isAdmin={appData.isAdmin}
        showToast={appData.showToast}
      />
    </div>
  );
}
