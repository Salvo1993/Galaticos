'use client';

import React from 'react';
import { TacticalPitches } from '@/components/teams/TacticalPitches';
import { MatchPredictionBox } from '@/components/teams/MatchPredictionBox';
import type { Player, MatchResult, Results, PredictionSettings, LeaderboardEntry } from '@/types';

export interface FormationResultsSectionProps {
  results: Results | null;
  resultsRef?: React.RefObject<HTMLDivElement | null>;
  pitchesRef?: React.RefObject<HTMLDivElement | null>;
  teamAName: string;
  setTeamAName: (name: string) => void;
  teamBName: string;
  setTeamBName: (name: string) => void;
  dbPlayers: Player[];
  matches: MatchResult[];
  setMatches: React.Dispatch<React.SetStateAction<MatchResult[]>>;
  isAdmin: boolean;
  isSaving: boolean;
  modulo7TeamA: string;
  modulo7TeamB: string;
  modulo8TeamA: string;
  modulo8TeamB: string;
  matchFormat: number;
  predictionSettings: PredictionSettings;
  historicalPredictions: any;
  leaderboard: LeaderboardEntry[];
  userOverrideMaglia: 'A' | 'B' | null;
  setUserOverrideMaglia: (val: 'A' | 'B' | null) => void;
  onOpenModuloModal: (team: 'A' | 'B' | 'both') => void;
  onOpenPredictionModal: () => void;
  onSelectPlayerForCard: (name: string) => void;
  onSwapPlayers: (playerA: string, teamA: 'teamA' | 'teamB', playerB: string, teamB: 'teamA' | 'teamB') => void;
  onRoleSwap: (teamKey: 'teamA' | 'teamB', indexFrom: number, indexTo: number) => void;
  onRemescola: () => void;
  onCopyResults: () => void;
  onDownloadFormationImage: () => void;
  onSaveFormation: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const FormationResultsSection: React.FC<FormationResultsSectionProps> = ({
  results,
  resultsRef,
  pitchesRef,
  teamAName,
  setTeamAName,
  teamBName,
  setTeamBName,
  dbPlayers,
  matches,
  setMatches,
  isAdmin,
  isSaving,
  modulo7TeamA,
  modulo7TeamB,
  modulo8TeamA,
  modulo8TeamB,
  matchFormat,
  predictionSettings,
  historicalPredictions,
  leaderboard,
  userOverrideMaglia,
  setUserOverrideMaglia,
  onOpenModuloModal,
  onOpenPredictionModal,
  onSelectPlayerForCard,
  onSwapPlayers,
  onRoleSwap,
  onRemescola,
  onCopyResults,
  onDownloadFormationImage,
  onSaveFormation,
  showToast,
}) => {
  if (!results) return null;

  const latestMatch = matches.length > 0 ? matches[0] : null;
  const isSameAsLatest =
    latestMatch && latestMatch.team_a_name === teamAName && latestMatch.team_b_name === teamBName;
  const defaultLightTeam = isSameAsLatest ? latestMatch.maglia_chiara || 'A' : 'A';
  const currentLightTeam = userOverrideMaglia || defaultLightTeam;

  const handleToggleMaglia = async () => {
    const newVal = currentLightTeam === 'A' ? 'B' : 'A';
    setUserOverrideMaglia(newVal);
    try {
      const res = await fetch('/api/session/update-maglia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maglia_chiara: newVal }),
      });
      if (!res.ok) throw new Error();

      const latest = matches.length > 0 ? matches[0] : null;
      const isLatest = latest && latest.team_a_name === teamAName && latest.team_b_name === teamBName;
      if (isLatest && latest && latest.maglia_chiara !== newVal) {
        await fetch('/api/risultati/update-maglia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: latest.id, maglia_chiara: newVal }),
        });
        setMatches(matches.map(m => (m.id === latest.id ? { ...m, maglia_chiara: newVal } : m)));
      }

      showToast('Maglie invertite con successo!', 'success');
    } catch {
      setUserOverrideMaglia(currentLightTeam as 'A' | 'B');
      showToast('Errore nel salvataggio maglie', 'error');
    }
  };

  return (
    <section className="results-section" ref={resultsRef as any} style={{ display: 'block' }}>
      <TacticalPitches
        ref={pitchesRef as any}
        results={results}
        teamAName={teamAName}
        setTeamAName={setTeamAName}
        teamBName={teamBName}
        setTeamBName={setTeamBName}
        dbPlayers={dbPlayers}
        matches={matches}
        isAdmin={isAdmin}
        modulo7TeamA={modulo7TeamA}
        modulo7TeamB={modulo7TeamB}
        modulo8TeamA={modulo8TeamA}
        modulo8TeamB={modulo8TeamB}
        currentLightTeam={currentLightTeam as 'A' | 'B'}
        onToggleMaglia={handleToggleMaglia}
        onOpenModuloModal={onOpenModuloModal}
        onSelectPlayerForCard={onSelectPlayerForCard}
        onSwapPlayers={onSwapPlayers}
        onRoleSwap={onRoleSwap}
      />

      <MatchPredictionBox
        results={results}
        matches={matches}
        matchFormat={matchFormat}
        predictionSettings={predictionSettings}
        historicalPredictions={historicalPredictions}
        teamAName={teamAName}
        teamBName={teamBName}
        leaderboard={leaderboard}
        isAdmin={isAdmin}
        isSaving={isSaving}
        onOpenPredictionModal={onOpenPredictionModal}
        onRemescola={onRemescola}
        onToggleMaglia={handleToggleMaglia}
        onOpenModuloModal={onOpenModuloModal}
        onCopyResults={onCopyResults}
        onDownloadFormationImage={onDownloadFormationImage}
        onSaveFormation={onSaveFormation}
      />
    </section>
  );
};

export default FormationResultsSection;
