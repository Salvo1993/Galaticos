'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import type {
  Player,
  Cluster,
  Results,
  MatchResult,
  PredictionSettings,
  ModuloSettings,
  AlgoSettings,
  LeaderboardEntry,
  Campo,
} from '@/types';
import {
  defaultPredictionSettings,
  defaultModuloSettings,
  defaultAlgoSettings,
} from '@/types';
import {
  balanceTeams,
  calculatePlayerRating,
  ensureGoalkeeperInGoal,
} from '@/lib/algorithm/team-balancer';
import { calculateHistoricalPredictions } from '@/lib/stats/prediction-engine';
import {
  saveAlgoSettingsApi,
  savePredictionSettingsApi,
  saveModuloSettingsApi,
  saveSessionApi,
  saveFormationApi,
} from '@/lib/api/settings-api';
import {
  copyResultsToClipboard,
  downloadFormationJpeg,
} from '@/lib/export/whatsapp-share';

export interface UseTeamBuilderProps {
  dbPlayers: Player[];
  leaderboard: LeaderboardEntry[];
  statsData: any;
  matches: MatchResult[];
  refreshMatches: () => Promise<void>;
  dbCampi: Campo[];
  matchLabel: string;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  setGlobalLoading?: (loading: boolean) => void;
}

export function useTeamBuilder({
  dbPlayers,
  leaderboard,
  statsData,
  matches,
  refreshMatches,
  dbCampi,
  matchLabel,
  showToast,
  setGlobalLoading,
}: UseTeamBuilderProps) {
  const [matchFormat, setMatchFormat] = useState<number>(5);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(Array(10).fill(''));
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isClustersExpanded, setIsClustersExpanded] = useState(false);
  const [selectedStadium, setSelectedStadium] = useState('Seidita');

  // Algo settings state
  const [algoModalOpen, setAlgoModalOpen] = useState(false);
  const [algoTab, setAlgoTab] = useState<'pesi' | 'parametri'>('pesi');
  const [algoSettings, setAlgoSettings] = useState<AlgoSettings>(defaultAlgoSettings);
  const [ovrModifiers, setOvrModifiers] = useState<Record<string, number>>({});

  // Results state
  const [results, setResults] = useState<Results | null>(null);
  const [teamAName, setTeamAName] = useState('Falchi 🦅');
  const [teamBName, setTeamBName] = useState('Aquile 🦆');
  const [userOverrideMaglia, setUserOverrideMaglia] = useState<'A' | 'B' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modals state
  const [isSaveFormationModalOpen, setIsSaveFormationModalOpen] = useState(false);

  // Moduli tattici per 7vs7 e 8vs8
  const [modulo8TeamA, setModulo8TeamA] = useState<'3-3-1' | '2-3-2' | '3-2-2' | '2-4-1'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('modulo_settings');
        if (cached) {
          const p = JSON.parse(cached);
          if (p.modulo8TeamA) return p.modulo8TeamA;
        }
      } catch {}
    }
    return defaultModuloSettings.modulo8TeamA;
  });

  const [modulo8TeamB, setModulo8TeamB] = useState<'3-3-1' | '2-3-2' | '3-2-2' | '2-4-1'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('modulo_settings');
        if (cached) {
          const p = JSON.parse(cached);
          if (p.modulo8TeamB) return p.modulo8TeamB;
        }
      } catch {}
    }
    return defaultModuloSettings.modulo8TeamB;
  });

  const [modulo7TeamA, setModulo7TeamA] = useState<'2-3-1' | '3-2-1' | '2-2-2' | '3-1-2'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const migrated = localStorage.getItem('modulo_v2_migrated');
        const cached = localStorage.getItem('modulo_settings');
        if (cached) {
          const p = JSON.parse(cached);
          if (!migrated && (p.modulo7TeamA === '2-3-1' || !p.modulo7TeamA)) {
            return '3-2-1';
          }
          if (p.modulo7TeamA) return p.modulo7TeamA;
        }
      } catch {}
    }
    return defaultModuloSettings.modulo7TeamA;
  });

  const [modulo7TeamB, setModulo7TeamB] = useState<'2-3-1' | '3-2-1' | '2-2-2' | '3-1-2'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const migrated = localStorage.getItem('modulo_v2_migrated');
        const cached = localStorage.getItem('modulo_settings');
        if (cached) {
          const p = JSON.parse(cached);
          if (!migrated && (p.modulo7TeamB === '2-3-1' || !p.modulo7TeamB)) {
            return '3-2-1';
          }
          if (p.modulo7TeamB) return p.modulo7TeamB;
        }
      } catch {}
    }
    return defaultModuloSettings.modulo7TeamB;
  });

  const [isModuloModalOpen, setIsModuloModalOpen] = useState(false);
  const [moduloModalTargetTeam, setModuloModalTargetTeam] = useState<'both' | 'A' | 'B'>('both');

  // Gestione Previsione
  const [predictionSettings, setPredictionSettings] = useState<PredictionSettings>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('prediction_settings');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.mode) return parsed;
        }
      } catch {}
    }
    return defaultPredictionSettings;
  });

  const [isPredictionModalOpen, setIsPredictionModalOpen] = useState(false);
  const [tempPredictionSettings, setTempPredictionSettings] = useState<PredictionSettings>(predictionSettings);

  const historicalPredictions = useMemo(() => {
    return calculateHistoricalPredictions(matches, predictionSettings);
  }, [matches, predictionSettings]);

  const resultsRef = useRef<HTMLDivElement>(null);
  const pitchesRef = useRef<HTMLDivElement>(null);

  // Hydration from backend
  const hydrateTeamBuilder = useCallback(
    (payload: {
      sessionData: any;
      settingsData: any;
      savedMatch: MatchResult | null;
      playersData: Player[];
    }) => {
      const { sessionData, settingsData, savedMatch, playersData } = payload;

      if (settingsData?.algo_settings) {
        setAlgoSettings(settingsData.algo_settings);
      }

      // Prediction settings
      let predSettingsToApply: PredictionSettings | null = null;
      if (settingsData?.prediction_settings?.mode) {
        predSettingsToApply = settingsData.prediction_settings;
      }

      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem('prediction_settings');
          const parsed = cached ? JSON.parse(cached) : null;
          if (predSettingsToApply) {
            setPredictionSettings(predSettingsToApply);
            setTempPredictionSettings(predSettingsToApply);
            localStorage.setItem('prediction_settings', JSON.stringify(predSettingsToApply));
          } else if (parsed && parsed.mode) {
            setPredictionSettings(parsed);
            setTempPredictionSettings(parsed);
            savePredictionSettingsApi(parsed).catch(() => {});
          }
        } catch {}
      } else if (predSettingsToApply) {
        setPredictionSettings(predSettingsToApply);
        setTempPredictionSettings(predSettingsToApply);
      }

      // Modulo settings
      let moduloSettingsToApply: ModuloSettings | null = null;
      if (settingsData?.modulo_settings) {
        moduloSettingsToApply = settingsData.modulo_settings;
      }

      if (typeof window !== 'undefined') {
        try {
          const migrated = localStorage.getItem('modulo_v2_migrated');
          const cached = localStorage.getItem('modulo_settings');
          let parsed = cached ? JSON.parse(cached) : null;

          if (!migrated) {
            if (moduloSettingsToApply) {
              if (moduloSettingsToApply.modulo7TeamA === '2-3-1') moduloSettingsToApply.modulo7TeamA = '3-2-1';
              if (moduloSettingsToApply.modulo7TeamB === '2-3-1') moduloSettingsToApply.modulo7TeamB = '3-2-1';
            }
            if (parsed) {
              if (parsed.modulo7TeamA === '2-3-1') parsed.modulo7TeamA = '3-2-1';
              if (parsed.modulo7TeamB === '2-3-1') parsed.modulo7TeamB = '3-2-1';
            }
            localStorage.setItem('modulo_v2_migrated', 'true');
          }

          if (moduloSettingsToApply) {
            if (moduloSettingsToApply.modulo7TeamA) setModulo7TeamA(moduloSettingsToApply.modulo7TeamA);
            if (moduloSettingsToApply.modulo7TeamB) setModulo7TeamB(moduloSettingsToApply.modulo7TeamB);
            if (moduloSettingsToApply.modulo8TeamA) setModulo8TeamA(moduloSettingsToApply.modulo8TeamA);
            if (moduloSettingsToApply.modulo8TeamB) setModulo8TeamB(moduloSettingsToApply.modulo8TeamB);
            localStorage.setItem('modulo_settings', JSON.stringify(moduloSettingsToApply));
            if (!migrated) {
              saveModuloSettingsApi(moduloSettingsToApply).catch(() => {});
            }
          } else if (parsed) {
            if (parsed.modulo7TeamA) setModulo7TeamA(parsed.modulo7TeamA);
            if (parsed.modulo7TeamB) setModulo7TeamB(parsed.modulo7TeamB);
            if (parsed.modulo8TeamA) setModulo8TeamA(parsed.modulo8TeamA);
            if (parsed.modulo8TeamB) setModulo8TeamB(parsed.modulo8TeamB);
            saveModuloSettingsApi(parsed).catch(() => {});
          }
        } catch {}
      } else if (moduloSettingsToApply) {
        if (moduloSettingsToApply.modulo7TeamA) setModulo7TeamA(moduloSettingsToApply.modulo7TeamA);
        if (moduloSettingsToApply.modulo7TeamB) setModulo7TeamB(moduloSettingsToApply.modulo7TeamB);
        if (moduloSettingsToApply.modulo8TeamA) setModulo8TeamA(moduloSettingsToApply.modulo8TeamA);
        if (moduloSettingsToApply.modulo8TeamB) setModulo8TeamB(moduloSettingsToApply.modulo8TeamB);
      }

      if (savedMatch?.Stadium) {
        setSelectedStadium(savedMatch.Stadium);
      }

      if (sessionData) {
        const sessionLen = Array.isArray(sessionData.selected_players)
          ? sessionData.selected_players.length
          : 10;
        const format = sessionLen / 2;
        const isValidSession =
          Array.isArray(sessionData.selected_players) &&
          [10, 12, 14, 16].includes(sessionData.selected_players.length) &&
          sessionData.selected_players.every((p: string) => p !== '') &&
          Array.isArray(sessionData.team_a_players) &&
          sessionData.team_a_players.length === format &&
          Array.isArray(sessionData.team_b_players) &&
          sessionData.team_b_players.length === format;

        if (isValidSession) {
          setMatchFormat(format);
          if (sessionData.maglia_chiara) setUserOverrideMaglia(sessionData.maglia_chiara);
          setSelectedPlayers(sessionData.selected_players);
          setClusters(sessionData.clusters || []);

          if (savedMatch) {
            setTeamAName(savedMatch.team_a_name || sessionData.team_a_name || 'Falchi 🦅');
            setTeamBName(savedMatch.team_b_name || sessionData.team_b_name || 'Aquile 🦆');
            setResults({
              teamA: ensureGoalkeeperInGoal(savedMatch.team_a_players || [], playersData),
              teamB: ensureGoalkeeperInGoal(savedMatch.team_b_players || [], playersData),
            });
          } else {
            setTeamAName(sessionData.team_a_name || 'Falchi 🦅');
            setTeamBName(sessionData.team_b_name || 'Aquile 🦆');
            setResults({
              teamA: ensureGoalkeeperInGoal(sessionData.team_a_players, playersData),
              teamB: ensureGoalkeeperInGoal(sessionData.team_b_players, playersData),
            });
          }
        }
      }
    },
    []
  );

  // Sync player updates across selection and clusters
  const onPlayerRenamed = useCallback((oldName: string, newName: string) => {
    setSelectedPlayers(prev => prev.map(name => (name === oldName ? newName : name)));
    setClusters(prev =>
      prev.map(c => ({
        ...c,
        members: c.members.map(m => (m === oldName ? newName : m)),
      }))
    );
  }, []);

  const onPlayersDeleted = useCallback((names: string[]) => {
    const namesSet = new Set(names);
    setSelectedPlayers(prev => prev.filter(name => !namesSet.has(name)));
  }, []);

  const handlePlayerChange = (index: number, name: string) => {
    const newSelected = [...selectedPlayers];
    newSelected[index] = name;
    setSelectedPlayers(newSelected);

    const oldName = selectedPlayers[index];
    if (oldName && oldName !== name) {
      setClusters([]);
    }
  };

  const addCluster = () => {
    const id = Date.now();
    setClusters(prev => [
      ...prev,
      { id, name: `Cluster ${String.fromCharCode(65 + prev.length)}`, members: [] },
    ]);
    setIsClustersExpanded(true);
  };

  const removeCluster = (id: number) => {
    setClusters(prev => prev.filter(c => c.id !== id));
  };

  const toggleMemberInCluster = (clusterId: number, playerName: string) => {
    setClusters(prev =>
      prev.map(c => {
        if (c.id === clusterId) {
          const isMember = c.members.includes(playerName);
          return {
            ...c,
            members: isMember
              ? c.members.filter(m => m !== playerName)
              : [...c.members, playerName],
          };
        }
        return c;
      })
    );
  };

  const resetAlgoSettings = () => {
    setAlgoSettings(defaultAlgoSettings);
  };

  const saveAlgoSettings = async () => {
    try {
      await saveAlgoSettingsApi(algoSettings);
      showToast('Impostazioni algoritmo salvate', 'success');
      setAlgoModalOpen(false);
    } catch {
      showToast('Errore salvataggio impostazioni', 'error');
    }
  };

  const savePredictionSettings = async (newSettings: PredictionSettings) => {
    setPredictionSettings(newSettings);
    setTempPredictionSettings(newSettings);
    try {
      await savePredictionSettingsApi(newSettings);
      showToast('Impostazioni previsione salvate per il progetto!', 'success');
    } catch {
      showToast('Impostazioni salvate nel browser', 'info');
    }
    setIsPredictionModalOpen(false);
  };

  const saveModuloSettings = async (updates: Partial<ModuloSettings>) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('modulo_v2_migrated', 'true');
      } catch {}
    }
    let next7A = modulo7TeamA;
    let next7B = modulo7TeamB;
    let next8A = modulo8TeamA;
    let next8B = modulo8TeamB;

    if (updates.modulo7TeamA) {
      next7A = updates.modulo7TeamA;
      setModulo7TeamA(updates.modulo7TeamA);
    }
    if (updates.modulo7TeamB) {
      next7B = updates.modulo7TeamB;
      setModulo7TeamB(updates.modulo7TeamB);
    }
    if (updates.modulo8TeamA) {
      next8A = updates.modulo8TeamA;
      setModulo8TeamA(updates.modulo8TeamA);
    }
    if (updates.modulo8TeamB) {
      next8B = updates.modulo8TeamB;
      setModulo8TeamB(updates.modulo8TeamB);
    }

    const combined: ModuloSettings = {
      modulo7TeamA: next7A,
      modulo7TeamB: next7B,
      modulo8TeamA: next8A,
      modulo8TeamB: next8B,
    };

    try {
      await saveModuloSettingsApi(combined);
    } catch (e) {
      console.warn('Network error saving modulo_settings:', e);
    }
  };

  const saveSession = async (currentResults: Results) => {
    try {
      await saveSessionApi({
        selected_players: selectedPlayers,
        clusters,
        team_a_name: teamAName,
        team_b_name: teamBName,
        team_a_players: currentResults.teamA,
        team_b_players: currentResults.teamB,
      });
    } catch (err) {
      console.error('Error saving session:', err);
    }
  };

  const clearState = () => {
    if (confirm('Sei sicuro di voler pulire tutte le selezioni correnti?')) {
      setSelectedPlayers(Array(matchFormat * 2).fill(''));
      setClusters([]);
      setResults(null);
      setTeamAName('Falchi 🦅');
      setTeamBName('Aquile 🦆');
      showToast('Stato ripulito', 'info');
    }
  };

  const handleSwap = (
    playerA: string,
    teamA: 'teamA' | 'teamB',
    playerB: string,
    teamB: 'teamA' | 'teamB'
  ) => {
    if (!results) return;

    const newResults = { ...results };
    const listA = [...newResults.teamA];
    const listB = [...newResults.teamB];

    const list1 = teamA === 'teamA' ? listA : listB;
    const list2 = teamB === 'teamA' ? listA : listB;

    const idx1 = list1.indexOf(playerA);
    const idx2 = list2.indexOf(playerB);

    if (idx1 !== -1 && idx2 !== -1) {
      list1[idx1] = playerB;
      list2[idx2] = playerA;

      newResults.teamA = listA;
      newResults.teamB = listB;

      setResults(newResults);
      saveSession(newResults);
      showToast(`Scambio effettuato: ${playerA} ⇄ ${playerB}`, 'success');
    }
  };

  const handleRoleSwap = (teamKey: 'teamA' | 'teamB', indexFrom: number, indexTo: number) => {
    if (!results) return;
    if (indexFrom === indexTo) return;
    const currentList = [...results[teamKey]];
    if (
      indexFrom < 0 ||
      indexFrom >= currentList.length ||
      indexTo < 0 ||
      indexTo >= currentList.length
    ) {
      return;
    }
    const playerFrom = currentList[indexFrom];
    const playerTo = currentList[indexTo];

    currentList[indexFrom] = playerTo;
    currentList[indexTo] = playerFrom;

    const newResults: Results = {
      ...results,
      [teamKey]: currentList,
    };

    setResults(newResults);
    saveSession(newResults);
    showToast(`Ruolo scambiato: ${playerFrom} ⇄ ${playerTo}`, 'success');
  };

  const getRating = useCallback(
    (name: string, withModifier = true) =>
      calculatePlayerRating(name, leaderboard, statsData, algoSettings, ovrModifiers, withModifier),
    [leaderboard, statsData, algoSettings, ovrModifiers]
  );

  const getSimulatedTeams = useCallback(() => {
    try {
      const res = balanceTeams({
        selectedPlayers,
        matchFormat,
        clusters,
        dbPlayers,
        leaderboard,
        statsData,
        algoSettings,
        ovrModifiers,
        forceShuffle: true,
      });
      const ratingSumA = res.teamA.reduce((sum, p) => sum + getRating(p), 0);
      const ratingSumB = res.teamB.reduce((sum, p) => sum + getRating(p), 0);
      const diff = Math.abs(ratingSumA - ratingSumB);
      return { teamA: res.teamA, teamB: res.teamB, ratingSumA, ratingSumB, diff };
    } catch {
      return null;
    }
  }, [
    selectedPlayers,
    matchFormat,
    clusters,
    dbPlayers,
    leaderboard,
    statsData,
    algoSettings,
    ovrModifiers,
    getRating,
  ]);

  const generateTeams = async (forceShuffle: boolean | any = false) => {
    const isShuffle = typeof forceShuffle === 'boolean' ? forceShuffle : false;
    try {
      const res = balanceTeams({
        selectedPlayers,
        matchFormat,
        clusters,
        dbPlayers,
        leaderboard,
        statsData,
        algoSettings,
        ovrModifiers,
        forceShuffle: isShuffle,
        matches,
      });

      if (res.isVolante && res.flyingSubInfo) {
        showToast('⚡ Sostituzione Volante rilevata!', 'info');
      }

      const newResults = { teamA: res.teamA, teamB: res.teamB };
      setResults(newResults);
      await saveSession(newResults);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const copyResults = () => {
    copyResultsToClipboard({
      results,
      matches,
      dbCampi,
      teamAName,
      teamBName,
      userOverrideMaglia,
      showToast,
    });
  };

  const downloadFormationImage = () => {
    downloadFormationJpeg(
      pitchesRef.current,
      loading => {
        if (setGlobalLoading) setGlobalLoading(loading);
      },
      showToast
    );
  };

  const saveFormation = async () => {
    if (!results) return;
    setIsSaving(true);
    const latestMatch = matches.length > 0 ? matches[0] : null;
    const isSameAsLatest =
      latestMatch && latestMatch.team_a_name === teamAName && latestMatch.team_b_name === teamBName;
    const defaultLightTeam = isSameAsLatest ? latestMatch.maglia_chiara || 'A' : 'A';
    const currentLightTeam = userOverrideMaglia || defaultLightTeam;

    try {
      await saveFormationApi({
        team_a_name: teamAName,
        team_b_name: teamBName,
        teamAPlayers: results.teamA,
        teamBPlayers: results.teamB,
        stadium: selectedStadium,
        matchLabel,
        maglia_chiara: currentLightTeam as 'A' | 'B',
      });
      showToast('Formazione salvata!', 'success');
      setIsSaveFormationModalOpen(false);

      try {
        await refreshMatches();
      } catch (refreshErr) {
        console.error('Errore nel refresh archivio partite:', refreshErr);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    matchFormat,
    setMatchFormat,
    selectedPlayers,
    setSelectedPlayers,
    clusters,
    setClusters,
    isClustersExpanded,
    setIsClustersExpanded,
    selectedStadium,
    setSelectedStadium,
    algoModalOpen,
    setAlgoModalOpen,
    algoTab,
    setAlgoTab,
    algoSettings,
    setAlgoSettings,
    ovrModifiers,
    setOvrModifiers,
    results,
    setResults,
    teamAName,
    setTeamAName,
    teamBName,
    setTeamBName,
    userOverrideMaglia,
    setUserOverrideMaglia,
    isSaving,
    setIsSaving,
    isSaveFormationModalOpen,
    setIsSaveFormationModalOpen,
    modulo7TeamA,
    setModulo7TeamA,
    modulo7TeamB,
    setModulo7TeamB,
    modulo8TeamA,
    setModulo8TeamA,
    modulo8TeamB,
    setModulo8TeamB,
    isModuloModalOpen,
    setIsModuloModalOpen,
    moduloModalTargetTeam,
    setModuloModalTargetTeam,
    predictionSettings,
    setPredictionSettings,
    tempPredictionSettings,
    setTempPredictionSettings,
    isPredictionModalOpen,
    setIsPredictionModalOpen,
    historicalPredictions,
    resultsRef,
    pitchesRef,
    // Methods
    hydrateTeamBuilder,
    onPlayerRenamed,
    onPlayersDeleted,
    handlePlayerChange,
    addCluster,
    removeCluster,
    toggleMemberInCluster,
    resetAlgoSettings,
    saveAlgoSettings,
    savePredictionSettings,
    saveModuloSettings,
    saveSession,
    clearState,
    handleSwap,
    handleRoleSwap,
    getRating,
    getSimulatedTeams,
    generateTeams,
    copyResults,
    downloadFormationImage,
    saveFormation,
  };
}
