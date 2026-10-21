'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { Player, MatchResult, LeaderboardEntry, MediaItem, Campo } from '@/types';
import {
  fetchPlayersApi,
  addPlayerApi,
  updatePlayerApi,
  deletePlayersApi,
  AddPlayerPayload,
  EditPlayerPayload,
} from '@/lib/api/players-api';
import {
  fetchMatchesApi,
  fetchLeaderboardApi,
  updateResultApi,
  deleteMatchApi,
  UpdateResultPayload,
} from '@/lib/api/matches-api';
import { saveMatchLabelApi } from '@/lib/api/settings-api';
import { calculateStatsData } from '@/lib/stats/match-utils';
import { copyMatchMediaToClipboard } from '@/lib/export/whatsapp-share';

export interface UseAppDataOptions {
  onInitLoaded?: (payload: {
    sessionData: any;
    settingsData: any;
    savedMatch: MatchResult | null;
    playersData: Player[];
  }) => void;
}

export function useAppData(options?: UseAppDataOptions) {
  const { onInitLoaded } = options || {};

  // Auth & Admin
  const { data: session } = useSession();
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '')
    .split(',')
    .map(e => e.trim().toLowerCase());
  const isAdmin = session?.user?.email
    ? adminEmails.includes(session.user.email.trim().toLowerCase())
    : false;

  // Global state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  // Entities state
  const [dbPlayers, setDbPlayers] = useState<Player[]>([]);
  const [dbCampi, setDbCampi] = useState<Campo[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const [matchLabel, setMatchLabel] = useState('Venerdì 19 giugno - Ore 21');
  const [headerImage, setHeaderImage] = useState<string>('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isAddCampoModalOpen, setIsAddCampoModalOpen] = useState(false);
  const [selectedPlayerForCard, setSelectedPlayerForCard] = useState<string | null>(null);

  // Update & Delete Match state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMatchForUpdate, setSelectedMatchForUpdate] = useState<MatchResult | null>(null);
  const [selectedMatchForDelete, setSelectedMatchForDelete] = useState<MatchResult | null>(null);

  // Sfida Modal state
  const [isSfidaModalOpen, setIsSfidaModalOpen] = useState(false);

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Toast helper
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

  // Memoized stats data
  const statsData = useMemo(() => {
    return calculateStatsData(matches, showGuests, dbPlayers);
  }, [matches, showGuests, dbPlayers]);

  // Data fetch helpers
  const fetchPlayers = useCallback(async () => {
    try {
      const data = await fetchPlayersApi();
      setDbPlayers(data);
    } catch (err) {
      console.error(err);
      setError('Impossibile caricare i giocatori');
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoadingLeaderboard(true);
    try {
      const data = await fetchLeaderboardApi();
      setLeaderboard(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  }, []);

  const refreshMatches = useCallback(async () => {
    try {
      const data = await fetchMatchesApi();
      setMatches(data);
    } catch (err) {
      console.error('Errore nel refresh match:', err);
    }
  }, []);

  const onInitLoadedRef = useRef(options?.onInitLoaded);
  useEffect(() => {
    onInitLoadedRef.current = options?.onInitLoaded;
  });

  // Initial load with Stale-While-Revalidate caching for instant rendering on refresh
  useEffect(() => {
    let hadCache = false;
    try {
      const cached = localStorage.getItem('app_data_cache_v2');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.dbPlayers) && parsed.dbPlayers.length > 0) {
          setDbPlayers(parsed.dbPlayers);
          if (Array.isArray(parsed.dbCampi)) setDbCampi(parsed.dbCampi);
          if (Array.isArray(parsed.matches)) setMatches(parsed.matches);
          if (Array.isArray(parsed.mediaItems)) setMediaItems(parsed.mediaItems);
          if (Array.isArray(parsed.leaderboard)) setLeaderboard(parsed.leaderboard);
          if (parsed.matchLabel) setMatchLabel(parsed.matchLabel);
          if (parsed.headerImage) setHeaderImage(parsed.headerImage);

          if (parsed.initPayload && onInitLoadedRef.current) {
            onInitLoadedRef.current(parsed.initPayload);
          }
          setLoading(false);
          hadCache = true;
        }
      }
    } catch (e) {
      console.warn('Cache load error:', e);
    }

    const init = async () => {
      try {
        const [
          playersRes,
          sessionRes,
          settingsRes,
          matchesRes,
          leaderboardRes,
          campiRes,
          mediaRes,
        ] = await Promise.all([
          fetch('/api/giocatori', { cache: 'no-store' }),
          fetch('/api/session', { cache: 'no-store' }),
          fetch('/api/settings', { cache: 'no-store' }),
          fetch('/api/risultati', { cache: 'no-store' }),
          fetch('/api/classifica', { cache: 'no-store' }),
          fetch('/api/campi', { cache: 'no-store' }),
          fetch('/api/media', { cache: 'no-store' }),
        ]);

        const playersData = await playersRes.json();
        const sessionData = await sessionRes.json();
        const settingsData = await settingsRes.json();
        const matchesData = await matchesRes.json();
        const leaderboardData = await leaderboardRes.json();
        const campiData = await campiRes.json().catch(() => []);
        const mediaData = await mediaRes.json().catch(() => []);

        if (playersData.error) throw new Error(playersData.error);
        const finalPlayers = Array.isArray(playersData) ? playersData : [];
        const finalCampi = Array.isArray(campiData) ? campiData : [];
        const finalMatches = Array.isArray(matchesData) ? matchesData : [];
        const finalMedia = Array.isArray(mediaData) ? mediaData : [];
        const finalLeaderboard = leaderboardData.success && Array.isArray(leaderboardData.leaderboard) 
          ? leaderboardData.leaderboard 
          : [];

        setDbPlayers(finalPlayers);
        setDbCampi(finalCampi);
        setMatches(finalMatches);
        setMediaItems(finalMedia);
        if (finalLeaderboard.length > 0) {
          setLeaderboard(finalLeaderboard);
        }

        if (settingsData?.match_label) {
          setMatchLabel(settingsData.match_label);
        }
        if (settingsData?.header_image) {
          setHeaderImage(settingsData.header_image);
        }

        const savedMatch = finalMatches.length > 0 ? finalMatches[0] : null;
        const initPayload = {
          sessionData,
          settingsData,
          savedMatch,
          playersData: finalPlayers,
        };

        if (onInitLoadedRef.current) {
          onInitLoadedRef.current(initPayload);
        }

        // Save fresh snapshot to cache for instant subsequent loads
        try {
          localStorage.setItem('app_data_cache_v2', JSON.stringify({
            dbPlayers: finalPlayers,
            dbCampi: finalCampi,
            matches: finalMatches,
            mediaItems: finalMedia,
            leaderboard: finalLeaderboard,
            matchLabel: settingsData?.match_label || '',
            headerImage: settingsData?.header_image || '',
            initPayload,
          }));
        } catch (cacheErr) {
          console.warn('Failed to save to local cache:', cacheErr);
        }
      } catch (err) {
        console.error('Initialization Error:', err);
        if (!hadCache) {
          setError('Impossibile caricare i dati dal database');
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Mutations
  const handleAddPlayer = async (payload: AddPlayerPayload) => {
    setIsSaving(true);
    try {
      await addPlayerApi(payload);
      showToast('Giocatore aggiunto!', 'success');
      setIsAddModalOpen(false);
      await fetchPlayers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPlayerSubmit = async (
    payload: EditPlayerPayload,
    onPlayerRenamed?: (oldName: string, newName: string) => void
  ) => {
    setIsSaving(true);
    try {
      await updatePlayerApi(payload);
      showToast('Giocatore aggiornato!', 'success');
      setIsEditModalOpen(false);
      setEditingPlayer(null);

      if (onPlayerRenamed) {
        onPlayerRenamed(payload.oldName, payload.newName);
      }

      await fetchPlayers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlayers = async (
    names: string[],
    onPlayersDeleted?: (names: string[]) => void
  ) => {
    if (names.length === 0) return;
    setIsSaving(true);
    try {
      await deletePlayersApi(names);
      if (onPlayersDeleted) {
        onPlayersDeleted(names);
      }
      showToast('Giocatori eliminati!', 'success');
      setIsManageModalOpen(false);
      await fetchPlayers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateResult = async (payload: UpdateResultPayload) => {
    setIsSaving(true);
    try {
      const data = await updateResultApi(payload);
      showToast('Risultato aggiornato!', 'success');
      setIsUpdateModalOpen(false);
      setSelectedMatchForUpdate(null);

      setMatches(prev => prev.map(m => (m.id === payload.id ? data.match : m)));

      if (data.leaderboard && Array.isArray(data.leaderboard)) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err: any) {
      showToast(err.message || "Errore aggiornamento risultato", 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMatch = async () => {
    const matchId = selectedMatchForDelete?.id || selectedMatchForUpdate?.id;
    if (!matchId) return;

    if (
      !confirm('Sei sicuro di voler eliminare questa partita? Questa operazione è irreversibile.')
    ) {
      return;
    }

    setIsSaving(true);
    try {
      const data = await deleteMatchApi(matchId);
      showToast('Partita eliminata!', 'success');
      setIsUpdateModalOpen(false);
      setIsDeleteModalOpen(false);
      setSelectedMatchForUpdate(null);
      setSelectedMatchForDelete(null);

      setMatches(prev => prev.filter(m => m.id !== matchId));
      if (data.leaderboard && Array.isArray(data.leaderboard)) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err: any) {
      showToast(err.message || 'Errore eliminazione partita', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const saveSettings = async (label: string) => {
    try {
      await saveMatchLabelApi(label);
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const handleCopyMatchMedia = useCallback(
    (match: MatchResult) => {
      copyMatchMediaToClipboard(match, mediaItems, showToast);
    },
    [mediaItems, showToast]
  );

  return {
    session,
    isAdmin,
    theme,
    setTheme,
    loading,
    setLoading,
    error,
    setError,
    toast,
    showToast,
    isSaving,
    setIsSaving,
    dbPlayers,
    setDbPlayers,
    dbCampi,
    setDbCampi,
    matches,
    setMatches,
    mediaItems,
    setMediaItems,
    leaderboard,
    setLeaderboard,
    isLoadingLeaderboard,
    showGuests,
    setShowGuests,
    matchLabel,
    setMatchLabel,
    headerImage,
    setHeaderImage,
    statsData,
    // Modals
    isAddModalOpen,
    setIsAddModalOpen,
    isManageModalOpen,
    setIsManageModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    editingPlayer,
    setEditingPlayer,
    isAddCampoModalOpen,
    setIsAddCampoModalOpen,
    selectedPlayerForCard,
    setSelectedPlayerForCard,
    isUpdateModalOpen,
    setIsUpdateModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    selectedMatchForUpdate,
    setSelectedMatchForUpdate,
    selectedMatchForDelete,
    setSelectedMatchForDelete,
    isSfidaModalOpen,
    setIsSfidaModalOpen,
    // Methods
    fetchPlayers,
    fetchLeaderboard,
    refreshMatches,
    handleAddPlayer,
    handleEditPlayerSubmit,
    handleDeletePlayers,
    handleUpdateResult,
    handleDeleteMatch,
    saveSettings,
    handleCopyMatchMedia,
  };
}
