import React, { useState } from 'react';
import {
  Info,
  Sliders,
  RotateCcw,
  ArrowLeftRight,
  LayoutGrid,
  Copy,
  MessageCircle,
  Download
} from 'lucide-react';
import { Results, MatchResult, PredictionSettings, LeaderboardEntry } from '@/types';
import { isMatchAllowedForPrediction } from '@/lib/stats/prediction-engine';

export interface MatchPredictionBoxProps {
  results: Results;
  matches: MatchResult[];
  matchFormat: number;
  predictionSettings: PredictionSettings;
  historicalPredictions: { preds: Record<string, any>; accuracy: number };
  teamAName: string;
  teamBName: string;
  leaderboard: LeaderboardEntry[];
  isAdmin: boolean;
  isSaving: boolean;
  onOpenPredictionModal: () => void;
  onRemescola: () => void;
  onToggleMaglia: () => void;
  onOpenModuloModal: (target: 'both' | 'A' | 'B') => void;
  onCopyResults: () => void;
  onDownloadFormationImage: () => void;
  onSaveFormation: () => void;
}

export const MatchPredictionBox: React.FC<MatchPredictionBoxProps> = ({
  results,
  matches,
  matchFormat,
  predictionSettings,
  historicalPredictions,
  teamAName,
  teamBName,
  leaderboard,
  isAdmin,
  isSaving,
  onOpenPredictionModal,
  onRemescola,
  onToggleMaglia,
  onOpenModuloModal,
  onCopyResults,
  onDownloadFormationImage,
  onSaveFormation
}) => {
  const [showSynergyA, setShowSynergyA] = useState(false);
  const [showSynergyB, setShowSynergyB] = useState(false);

  // Determina la modalità attiva e l'etichetta descrittiva
  let modeBadgeLabel = '';
  let modeDescription = '';
  if (predictionSettings.mode === 'all') {
    modeBadgeLabel = '🌐 Storico Unificato (Tutti i Formati)';
    modeDescription = 'Tutti i formati (5, 6, 7 e 8)';
  } else if (predictionSettings.mode === 'tracks') {
    const trackName = matchFormat >= 7 ? 'Calcio a 7 / 8' : 'Calcio a 5 / 6';
    modeBadgeLabel = `🛤️ Binario ${trackName}`;
    modeDescription = `Binario separato (${trackName})`;
  } else if (predictionSettings.mode === 'strict') {
    modeBadgeLabel = `🎯 Rigido (Solo Calcio a ${matchFormat})`;
    modeDescription = `Solo partite a ${matchFormat}vs${matchFormat}`;
  } else {
    const customList = (predictionSettings.customMatrix?.[matchFormat as 5|6|7|8] || [matchFormat]).map(f => `${f}vs${f}`).join(', ');
    modeBadgeLabel = `⚙️ Personalizzato (${customList})`;
    modeDescription = `Formati selezionati (${customList})`;
  }

  // Partite storiche idonee secondo le impostazioni di previsione attive
  const eligibleMatches = matches.filter(m => {
    if (!m.risultato || m.risultato === '0-0') return false;
    return isMatchAllowedForPrediction(m, matchFormat, predictionSettings);
  });

  // Deduplica e valida le partite
  const uniqueMatchesMap = new Set<string>();
  const validHistoricalMatches = eligibleMatches.filter(m => {
    const tA = (m.team_a_name || '').trim();
    const tB = (m.team_b_name || '').trim();
    const [scoreA, scoreB] = m.risultato!.split('-').map(s => s.trim());
    const key = tA < tB ? `${tA}_${tB}_${scoreA}-${scoreB}` : `${tB}_${tA}_${scoreB}-${scoreA}`;
    if (uniqueMatchesMap.has(key)) return false;
    uniqueMatchesMap.add(key);
    return true;
  });

  // Statistiche complessive di carriera/stagione dei giocatori (su TUTTE le partite archiviate)
  const allPlayerStats: Record<string, {
    partiteGiocate: number;
    golFattiSquadra: number;
    golSubitiSquadra: number;
    sommaVoti: number;
    votiCount: number;
    mvpCount: number;
  }> = {};

  const uniqueAllMatchesMap = new Set<string>();
  matches.forEach(m => {
    if (!m.risultato || m.risultato === '0-0') return;
    const mDate = new Date(m.data);
    const isInterrupted = mDate.getDate() === 8 && mDate.getMonth() === 6 && mDate.getFullYear() === 2026 && m.ora && m.ora.startsWith('21');
    if (isInterrupted) return;

    const mKey = m.id ? String(m.id) : `${m.data}_${m.ora}_${m.team_a_name}_${m.team_b_name}_${m.risultato}`;
    if (uniqueAllMatchesMap.has(mKey)) return;
    uniqueAllMatchesMap.add(mKey);

    const [scoreA, scoreB] = (m.risultato || '0-0').split('-').map(s => parseInt(s.trim(), 10) || 0);

    let matchMaxVote = 0;
    let matchMVPs: string[] = [];
    const vt = typeof m.voti_giocatori === 'string' ? JSON.parse(m.voti_giocatori || '{}') : (m.voti_giocatori || {});
    if (vt && typeof vt === 'object') {
      Object.entries(vt).forEach(([, voto]) => {
        const numVoto = typeof voto === 'number' ? voto : parseFloat(voto as string) || 0;
        if (numVoto > matchMaxVote) {
          matchMaxVote = numVoto;
        }
      });
    }
    if (m.mvps && m.mvps.length > 0) {
      matchMVPs = typeof m.mvps === 'string' ? JSON.parse(m.mvps) : (Array.isArray(m.mvps) ? m.mvps : []);
    } else if (matchMaxVote > 0 && vt) {
      matchMVPs = Object.keys(vt).filter(p => {
        const numVoto = typeof vt[p] === 'number' ? vt[p] : parseFloat(vt[p] as string) || 0;
        return numVoto === matchMaxVote;
      });
    }

    const procP = (p: string, gF: number, gS: number) => {
      if (!allPlayerStats[p]) {
        allPlayerStats[p] = { partiteGiocate: 0, golFattiSquadra: 0, golSubitiSquadra: 0, sommaVoti: 0, votiCount: 0, mvpCount: 0 };
      }
      allPlayerStats[p].partiteGiocate++;
      allPlayerStats[p].golFattiSquadra += gF;
      allPlayerStats[p].golSubitiSquadra += gS;
      if (vt && vt[p] !== undefined) {
        const v = typeof vt[p] === 'number' ? vt[p] : parseFloat(vt[p] as string);
        if (v && v > 0) {
          allPlayerStats[p].sommaVoti += v;
          allPlayerStats[p].votiCount++;
        }
      }
    };

    m.team_a_players?.forEach(p => procP(p, scoreA, scoreB));
    m.team_b_players?.forEach(p => procP(p, scoreB, scoreA));
    matchMVPs.forEach(p => {
      if (!allPlayerStats[p]) {
        allPlayerStats[p] = { partiteGiocate: 0, golFattiSquadra: 0, golSubitiSquadra: 0, sommaVoti: 0, votiCount: 0, mvpCount: 0 };
      }
      allPlayerStats[p].mvpCount++;
    });
  });

  // Calcolo statistiche della squadra basato sullo storico reale complessivo dei singoli convocati
  const getTeamStats = (teamPlayers: string[]) => {
    let sumMediaVoto = 0;
    let sumGolFattiAvg = 0;
    let sumGolSubitiAvg = 0;
    let totalMvp = 0;
    let validVotoCount = 0;
    let validGolCount = 0;

    teamPlayers.forEach(pName => {
      const s = allPlayerStats[pName];
      if (s && s.partiteGiocate > 0) {
        if (s.votiCount > 0) {
          sumMediaVoto += (s.sommaVoti / s.votiCount);
          validVotoCount++;
        }
        sumGolFattiAvg += (s.golFattiSquadra / s.partiteGiocate);
        sumGolSubitiAvg += (s.golSubitiSquadra / s.partiteGiocate);
        validGolCount++;
      }
      const l = leaderboard.find(x => x.nome === pName);
      const mvp = (l && typeof l.mvp_count === 'number') ? l.mvp_count : (s?.mvpCount || 0);
      totalMvp += mvp;
    });

    return {
      mediaVoto: validVotoCount > 0 ? (sumMediaVoto / validVotoCount).toFixed(2) : '-',
      golFatti: validGolCount > 0 ? (sumGolFattiAvg / validGolCount).toFixed(2) : '-',
      golSubiti: validGolCount > 0 ? (sumGolSubitiAvg / validGolCount).toFixed(2) : '-',
      mvp: totalMvp,
      hasMatches: validGolCount > 0
    };
  };

  const statsA = getTeamStats(results.teamA);
  const statsB = getTeamStats(results.teamB);

  // Statistiche e MVP per l'algoritmo di PREVISIONE (quote e affidabilità sul formato selezionato)
  const trackPlayerStats: Record<string, {
    partiteGiocate: number;
    golFattiSquadra: number;
    golSubitiSquadra: number;
    sommaVoti: number;
    votiCount: number;
    mvpCount: number;
  }> = {};

  validHistoricalMatches.forEach(m => {
    const [sA, sB] = (m.risultato || '0-0').split('-').map(s => parseInt(s.trim(), 10) || 0);

    let matchMaxVote = 0;
    let matchMVPs: string[] = [];
    if (m.voti_giocatori) {
      Object.entries(m.voti_giocatori).forEach(([, voto]) => {
        if (typeof voto === 'number' && voto > matchMaxVote) {
          matchMaxVote = voto;
        }
      });
    }
    if (m.mvps && m.mvps.length > 0) {
      matchMVPs = typeof m.mvps === 'string' ? JSON.parse(m.mvps) : (Array.isArray(m.mvps) ? m.mvps : []);
    } else if (matchMaxVote > 0 && m.voti_giocatori) {
      matchMVPs = Object.keys(m.voti_giocatori).filter(p => m.voti_giocatori![p] === matchMaxVote);
    }

    const procP = (p: string, gF: number, gS: number) => {
      if (!trackPlayerStats[p]) {
        trackPlayerStats[p] = { partiteGiocate: 0, golFattiSquadra: 0, golSubitiSquadra: 0, sommaVoti: 0, votiCount: 0, mvpCount: 0 };
      }
      trackPlayerStats[p].partiteGiocate++;
      trackPlayerStats[p].golFattiSquadra += gF;
      trackPlayerStats[p].golSubitiSquadra += gS;
      if (m.voti_giocatori && typeof m.voti_giocatori[p] === 'number' && (m.voti_giocatori[p] as number) > 0) {
        trackPlayerStats[p].sommaVoti += m.voti_giocatori[p] as number;
        trackPlayerStats[p].votiCount++;
      }
    };

    m.team_a_players?.forEach(p => procP(p, sA, sB));
    m.team_b_players?.forEach(p => procP(p, sB, sA));
    matchMVPs.forEach(p => {
      if (!trackPlayerStats[p]) {
        trackPlayerStats[p] = { partiteGiocate: 0, golFattiSquadra: 0, golSubitiSquadra: 0, sommaVoti: 0, votiCount: 0, mvpCount: 0 };
      }
      trackPlayerStats[p].mvpCount++;
    });
  });

  const hasTrackHistory = validHistoricalMatches.length > 0;

  // Calcola la sinergia storica per una squadra (pesata sui formati idonei)
  const getTeamSynergy = (teamPlayers: string[]) => {
    let weightedWins = 0;
    let weightedDraws = 0;
    let weightedLosses = 0;
    let weightedGolFatti = 0;
    let weightedGolSubiti = 0;
    let totalWeight = 0;
    const matchDetails: { overlap: number; maxOverlap: number; pastFormat: number; result: string; originalResult: string; weight: number; date: string; players: string[]; teamNameA: string; teamNameB: string; isOnSideA: boolean }[] = [];

    validHistoricalMatches.forEach(m => {
      const mDate = new Date(m.data);
      const isInterrupted = mDate.getDate() === 8 && mDate.getMonth() === 6 && mDate.getFullYear() === 2026 && m.ora && m.ora.startsWith('21');
      if (isInterrupted) return;

      const teamAPlayers = m.team_a_players || [];
      const teamBPlayers = m.team_b_players || [];
      const [scoreA, scoreB] = (m.risultato || '0-0').split('-').map(s => parseInt(s.trim(), 10) || 0);

      const overlapA = teamPlayers.filter(p => teamAPlayers.includes(p)).length;
      const overlapB = teamPlayers.filter(p => teamBPlayers.includes(p)).length;

      if (overlapA >= 2 || overlapB >= 2) {
        const bestOverlap = overlapA >= overlapB ? overlapA : overlapB;
        const isOnSideA = overlapA >= overlapB;
        const commonPlayers = teamPlayers.filter(p => (isOnSideA ? teamAPlayers : teamBPlayers).includes(p));
        
        // Peso: normalizzato sulla sovrapposizione massima possibile tra la partita passata e il match corrente
        const pastMatchSize = Math.max(teamAPlayers.length, teamBPlayers.length) || 5;
        const maxPossibleOverlap = Math.min(matchFormat, pastMatchSize);
        const weight = Math.pow(bestOverlap / Math.max(maxPossibleOverlap, 2), 2);
        
        const golFatti = isOnSideA ? scoreA : scoreB;
        const golSubiti = isOnSideA ? scoreB : scoreA;
        const won = golFatti > golSubiti;
        const draw = golFatti === golSubiti;

        if (won) weightedWins += weight;
        else if (draw) weightedDraws += weight;
        else weightedLosses += weight;
        
        weightedGolFatti += golFatti * weight;
        weightedGolSubiti += golSubiti * weight;
        totalWeight += weight;
        
        matchDetails.push({ 
          overlap: bestOverlap, 
          maxOverlap: maxPossibleOverlap,
          pastFormat: pastMatchSize,
          result: `${golFatti}-${golSubiti}`, 
          originalResult: m.risultato || '0-0',
          weight,
          date: mDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }),
          players: commonPlayers,
          teamNameA: m.team_a_name || 'Squadra A',
          teamNameB: m.team_b_name || 'Squadra B',
          isOnSideA
        });
      }
    });

    return {
      winRate: totalWeight > 0 ? weightedWins / totalWeight : 0,
      drawRate: totalWeight > 0 ? weightedDraws / totalWeight : 0,
      lossRate: totalWeight > 0 ? weightedLosses / totalWeight : 0,
      avgGolFatti: totalWeight > 0 ? weightedGolFatti / totalWeight : 0,
      avgGolSubiti: totalWeight > 0 ? weightedGolSubiti / totalWeight : 0,
      totalWeight,
      matchCount: matchDetails.length,
      matchDetails
    };
  };

  const synergyA = hasTrackHistory ? getTeamSynergy(results.teamA) : { winRate: 0, drawRate: 0, lossRate: 0, avgGolFatti: 0, avgGolSubiti: 0, totalWeight: 0, matchCount: 0, matchDetails: [] };
  const synergyB = hasTrackHistory ? getTeamSynergy(results.teamB) : { winRate: 0, drawRate: 0, lossRate: 0, avgGolFatti: 0, avgGolSubiti: 0, totalWeight: 0, matchCount: 0, matchDetails: [] };

  const getCompositeScore = (
    individualStats: { mediaVoto: string; golFatti: string; golSubiti: string; mvp: number },
    synergy: typeof synergyA
  ) => {
    const indMediaVoto = parseFloat(individualStats.mediaVoto) || 6.0;
    const indGolFatti = parseFloat(individualStats.golFatti) || 0.0;
    const indGolSubiti = parseFloat(individualStats.golSubiti) || 0.0;
    
    const normVoto = (indMediaVoto - 4) / 6;
    const normGolDiff = (indGolFatti - indGolSubiti) / Math.max(indGolFatti + indGolSubiti, 1);
    const mvpBonus = Math.min(individualStats.mvp * 0.02, 0.1);
    
    const individualScore = normVoto * 0.5 + normGolDiff * 0.35 + mvpBonus;
    const synergyScore = synergy.totalWeight > 0 
      ? synergy.winRate * 0.6 + synergy.drawRate * 0.2 - synergy.lossRate * 0.2 
      : 0.5;

    const effectiveSynergyWeight = synergy.totalWeight > 0 ? 0.4 : 0;
    const effectiveIndividualWeight = 1 - effectiveSynergyWeight;
    
    return individualScore * effectiveIndividualWeight + synergyScore * effectiveSynergyWeight;
  };

  const compositeA = hasTrackHistory ? getCompositeScore(statsA, synergyA) : 0.5;
  const compositeB = hasTrackHistory ? getCompositeScore(statsB, synergyB) : 0.5;

  const diff = compositeA - compositeB;
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-x * 8));
  const rawWinA = sigmoid(diff);
  const rawWinB = 1 - rawWinA;
  
  const drawBase = 0.15;
  const drawBonus = Math.max(0, 0.25 - Math.abs(diff) * 2);
  const drawPct = Math.min(drawBase + drawBonus, 0.40);
  
  const winAPct = rawWinA * (1 - drawPct);
  const winBPct = rawWinB * (1 - drawPct);

  const pctA = Math.round(winAPct * 100);
  const pctX = Math.round(drawPct * 100);
  const pctB = Math.round(winBPct * 100);
  const favorite = pctA > pctB ? 'A' : pctB > pctA ? 'B' : 'X';
  
  const baseAvg = Math.max((parseFloat(statsA.golFatti) + parseFloat(statsB.golFatti)) / 2, matchFormat * 1.3);
  const scartoGol = diff * 15;
  
  const finalPredA = baseAvg + (scartoGol / 2);
  const finalPredB = baseAvg - (scartoGol / 2);
  
  let predGolA = Math.round(finalPredA);
  let predGolB = Math.round(finalPredB);

  if (favorite === 'A' && predGolA <= predGolB) predGolA = predGolB + 1;
  if (favorite === 'B' && predGolB <= predGolA) predGolB = predGolA + 1;
  if (favorite === 'X' && predGolA !== predGolB) {
      const avg = Math.round((predGolA + predGolB) / 2);
      predGolA = avg;
      predGolB = avg;
  }

  const uniqueMatchKeys = new Set([
    ...synergyA.matchDetails.map(m => m.date + m.teamNameA + m.teamNameB + m.originalResult),
    ...synergyB.matchDetails.map(m => m.date + m.teamNameA + m.teamNameB + m.originalResult)
  ]);
  const totalStorico = uniqueMatchKeys.size;
  let reliabilityText = 'Bassa';
  let reliabilityColor = '#ff4444';
  if (totalStorico >= 16) {
      reliabilityText = 'Alta';
      reliabilityColor = '#69f0ae';
  } else if (totalStorico >= 5) {
      reliabilityText = 'Media';
      reliabilityColor = '#ffcc00';
  }

  const matchPlayersList = [...(results?.teamA || []), ...(results?.teamB || [])];
  const unknownPlayersCount = matchPlayersList.filter(p => !trackPlayerStats[p] || trackPlayerStats[p].partiteGiocate === 0).length;
  
  if (unknownPlayersCount === 1) {
      if (reliabilityText === 'Alta') {
          reliabilityText = 'Media (1 debuttante nello storico)';
          reliabilityColor = '#ffcc00';
      } else {
          reliabilityText = 'Bassa (1 debuttante nello storico)';
          reliabilityColor = '#ff4444';
      }
  } else if (unknownPlayersCount > 1) {
      reliabilityText = `Molto Bassa (${unknownPlayersCount} debuttanti nello storico)`;
      reliabilityColor = '#ff4444';
  }

  const eligiblePredictions = Object.values(historicalPredictions.preds).filter(p => isMatchAllowedForPrediction({ team_a_players: Array(p.formatSize || 5).fill('x') }, matchFormat, predictionSettings));
  const trackHistoricalTotal = eligiblePredictions.length;
  const trackHistoricalCorrect = eligiblePredictions.filter(p => p.correct).length;
  const trackAccuracy = trackHistoricalTotal > 0 ? Math.round((trackHistoricalCorrect / trackHistoricalTotal) * 100) : historicalPredictions.accuracy;

  const copyStats = () => {
    const title = `📊 *STATISTICHE & PREVISIONE (${modeBadgeLabel} - Calcio a ${matchFormat})*`;
    let text = `${title}\n\n` +
      `*${teamAName.toUpperCase()}*\n` +
      `Media Voto: ${statsA.mediaVoto}\n` +
      `Gol Fatti: ${statsA.golFatti}\n` +
      `Gol Subiti: ${statsA.golSubiti}\n` +
      `MVP Totali: ${statsA.mvp}\n\n` +
      `*${teamBName.toUpperCase()}*\n` +
      `Media Voto: ${statsB.mediaVoto}\n` +
      `Gol Fatti: ${statsB.golFatti}\n` +
      `Gol Subiti: ${statsB.golSubiti}\n` +
      `MVP Totali: ${statsB.mvp}`;

    if (hasTrackHistory) {
      text += `\n\n🔮 *Esito Stimato:* ${teamAName} ${Math.round(predGolA)} - ${Math.round(predGolB)} ${teamBName}\n` +
        `Probabilità: 1 (${pctA}%) | X (${pctX}%) | 2 (${pctB}%)`;
    }

    navigator.clipboard.writeText(text);
    alert('Statistiche copiate negli appunti!');
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--color-text-dimmed)', marginTop: '1.5rem', textAlign: 'center', flexWrap: 'wrap' }}>
        <Info size={14} />
        <span>Filtro Previsione: <strong>{modeBadgeLabel}</strong> ({validHistoricalMatches.length} partite storiche idonee).</span>
        <button
          type="button"
          onClick={onOpenPredictionModal}
          style={{ background: 'rgba(93, 228, 255, 0.15)', border: '1px solid rgba(93, 228, 255, 0.3)', color: '#5de4ff', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem', padding: '2px 8px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <Sliders size={12} /> Modifica
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1rem', borderTop: '2px solid #5de4ff', fontSize: '0.85rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#5de4ff', textAlign: 'center' }}>Stats {teamAName}</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Media Voto:</span> <strong>{statsA.mediaVoto}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Gol Fatti:</span> <strong>{statsA.golFatti}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Gol Subiti:</span> <strong>{statsA.golSubiti}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>MVP Totali:</span> <strong>{statsA.mvp}</strong></div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '1rem', borderTop: '2px solid #ffcc00', fontSize: '0.85rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#ffcc00', textAlign: 'center' }}>Stats {teamBName}</h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Media Voto:</span> <strong>{statsB.mediaVoto}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Gol Fatti:</span> <strong>{statsB.golFatti}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span>Gol Subiti:</span> <strong>{statsB.golSubiti}</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>MVP Totali:</span> <strong>{statsB.mvp}</strong></div>
        </div>
      </div>

      {/* --- PREVISIONE MATCH (mostrata solo se c'è storico idoneo) --- */}
      {hasTrackHistory && (
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(93,228,255,0.08) 0%, rgba(255,204,0,0.08) 100%)', 
          borderRadius: '10px', 
          padding: '1.2rem', 
          marginTop: '1rem', 
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h4 style={{ 
            margin: '0 0 0.4rem 0', 
            textAlign: 'center', 
            fontSize: '1rem',
            background: 'linear-gradient(90deg, #5de4ff, #ffcc00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800
          }}>
            🔮 PREVISIONE MATCH
          </h4>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <span 
              onClick={onOpenPredictionModal}
              style={{ fontSize: '0.72rem', background: 'rgba(93, 228, 255, 0.15)', color: '#5de4ff', padding: '3px 10px', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(93, 228, 255, 0.3)' }}
              title="Clicca per gestire lo storico della previsione"
            >
              {modeBadgeLabel} ({validHistoricalMatches.length} partite) ⚙️
            </span>
          </div>
          
          <div style={{ textAlign: 'center', fontSize: '0.75rem', marginBottom: '1.5rem', color: '#aaa', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '6px' }}>
            Affidabilità Previsione: <strong style={{ color: reliabilityColor }}>{reliabilityText}</strong> <span style={{ opacity: 0.7 }}>(basata su {totalStorico} incroci storici idonei)</span>
          </div>
          
          {/* Barra probabilità */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', height: '10px', borderRadius: '5px', overflow: 'visible', gap: '2px', position: 'relative', marginTop: '20px' }}>
              <div style={{ width: `${pctA}%`, background: 'linear-gradient(90deg, #1e90ff, #5de4ff)', borderRadius: '5px 0 0 5px', transition: 'width 0.5s ease', position: 'relative' }}>
                <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '4px', color: '#5de4ff', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>1 ({pctA}%)</span>
              </div>
              <div style={{ width: `${pctX}%`, background: '#666', transition: 'width 0.5s ease', position: 'relative' }}>
                {pctX > 0 && <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '4px', color: '#aaa', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>X ({pctX}%)</span>}
              </div>
              <div style={{ width: `${pctB}%`, background: 'linear-gradient(90deg, #ffcc00, #ff9500)', borderRadius: '0 5px 5px 0', transition: 'width 0.5s ease', position: 'relative' }}>
                <span style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '4px', color: '#ffcc00', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>2 ({pctB}%)</span>
              </div>
            </div>
          </div>

          {/* Risultato predetto */}
          <div style={{ textAlign: 'center', marginBottom: '0.8rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px' }}>Risultato stimato</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '2px' }}>
              <span style={{ color: '#5de4ff' }}>{Math.round(predGolA)}</span>
              <span style={{ color: '#666', margin: '0 8px' }}>-</span>
              <span style={{ color: '#ffcc00' }}>{Math.round(predGolB)}</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '2px' }}>
              {favorite === 'A' ? `${teamAName} favorito` : favorite === 'B' ? `${teamBName} favorito` : 'Match equilibrato'}
            </div>
          </div>

          {/* Dettagli sinergia */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
            <div 
              style={{ background: 'rgba(93,228,255,0.1)', borderRadius: '6px', padding: '0.6rem', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => { const s = !showSynergyA; setShowSynergyA(s); setShowSynergyB(s); }}
            >
              <div style={{ color: '#5de4ff', fontWeight: 700, marginBottom: '2px' }}>Sinergia {teamAName}</div>
              {synergyA.matchCount > 0 ? (
                <>
                  <div style={{ color: '#cfe8d8' }}>{synergyA.matchCount} partite simili</div>
                  <div style={{ color: '#69f0ae', fontSize: '0.7rem' }}>
                    V {Math.round(synergyA.winRate*100)}% · P {Math.round(synergyA.drawRate*100)}% · S {Math.round(synergyA.lossRate*100)}%
                  </div>
                  {!showSynergyA && (
                    <div style={{ fontSize: '0.65rem', color: '#5de4ff', marginTop: '6px', opacity: 0.8 }}>▼ Clicca per esplorare ▼</div>
                  )}
                  {showSynergyA && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.65rem', textAlign: 'left', color: '#ccc' }}>
                      {synergyA.matchDetails.map((md, idx) => (
                        <div key={idx} style={{ marginBottom: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '4px' }}>
                          <div style={{ fontWeight: 700, color: '#fff', marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>
                              {md.date} 
                              <span style={{ margin: '0 8px', color: '#888', fontWeight: 'normal' }}>
                                <strong style={{ color: md.isOnSideA ? '#5de4ff' : '#888' }}>{md.teamNameA}</strong> vs <strong style={{ color: !md.isOnSideA ? '#5de4ff' : '#888' }}>{md.teamNameB}</strong>
                              </span>
                            </span>
                            <span style={{ color: '#5de4ff' }}>{md.overlap}/{md.maxOverlap} {md.pastFormat !== matchFormat ? `(${md.pastFormat}v${md.pastFormat})` : ''} (Ris: {md.result})</span>
                          </div>
                          <div style={{ color: '#aaa', fontSize: '0.6rem' }}>{md.players.join(', ')}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: '#888' }}>Nessun dato</div>
              )}
            </div>
            <div 
              style={{ background: 'rgba(255,204,0,0.1)', borderRadius: '6px', padding: '0.6rem', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => { const s = !showSynergyB; setShowSynergyA(s); setShowSynergyB(s); }}
            >
              <div style={{ color: '#ffcc00', fontWeight: 700, marginBottom: '2px' }}>Sinergia {teamBName}</div>
              {synergyB.matchCount > 0 ? (
                <>
                  <div style={{ color: '#cfe8d8' }}>{synergyB.matchCount} partite simili</div>
                  <div style={{ color: '#69f0ae', fontSize: '0.7rem' }}>
                    V {Math.round(synergyB.winRate*100)}% · P {Math.round(synergyB.drawRate*100)}% · S {Math.round(synergyB.lossRate*100)}%
                  </div>
                  {!showSynergyB && (
                    <div style={{ fontSize: '0.65rem', color: '#ffcc00', marginTop: '6px', opacity: 0.8 }}>▼ Clicca per esplorare ▼</div>
                  )}
                  {showSynergyB && (
                    <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.65rem', textAlign: 'left', color: '#ccc' }}>
                      {synergyB.matchDetails.map((md, idx) => (
                        <div key={idx} style={{ marginBottom: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '4px' }}>
                          <div style={{ fontWeight: 700, color: '#fff', marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>
                              {md.date} 
                              <span style={{ margin: '0 8px', color: '#888', fontWeight: 'normal' }}>
                                <strong style={{ color: md.isOnSideA ? '#ffcc00' : '#888' }}>{md.teamNameA}</strong> vs <strong style={{ color: !md.isOnSideA ? '#ffcc00' : '#888' }}>{md.teamNameB}</strong>
                              </span>
                            </span>
                            <span style={{ color: '#ffcc00' }}>{md.overlap}/{md.maxOverlap} {md.pastFormat !== matchFormat ? `(${md.pastFormat}v${md.pastFormat})` : ''} (Ris: {md.result})</span>
                          </div>
                          <div style={{ color: '#aaa', fontSize: '0.6rem' }}>{md.players.join(', ')}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: '#888' }}>Nessun dato</div>
              )}
            </div>
          </div>

          {trackHistoricalTotal > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem', color: '#69f0ae', marginTop: '1rem', fontWeight: 600 }}>
               <span>🔮 Precisione Storica Algoritmo: {trackAccuracy}% ({trackHistoricalCorrect} indovinate su {trackHistoricalTotal})</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.7rem', color: '#666', marginTop: '0.6rem' }}>
            <Info size={12} />
            <span>Algoritmo: 60% stats individuali idonee + 40% sinergia storica. Peso sinergia: (overlap/dimensione)²</span>
          </div>
        </div>
      )}

      <div className="results-actions" style={{ flexWrap: 'wrap' }}>
        {isAdmin && (
          <button className="secondary-btn" onClick={onRemescola}><RotateCcw size={18} /> Rimescola</button>
        )}
        {isAdmin && (
          <button className="secondary-btn" onClick={onToggleMaglia}><ArrowLeftRight size={18} /> Cambia Maglie</button>
        )}
        {(matchFormat === 7 || matchFormat === 8) && (
          <button className="secondary-btn" onClick={() => onOpenModuloModal('both')}>
            <LayoutGrid size={18} /> Modulo
          </button>
        )}
        <button className="secondary-btn" onClick={onCopyResults}><Copy size={18} /> Copia Formazioni</button>
        <button className="secondary-btn" onClick={copyStats}><MessageCircle size={18} /> Copia Stats</button>
        <button className="secondary-btn" onClick={onDownloadFormationImage}><Download size={18} /> Scarica JPEG</button>
        <button 
          className="secondary-btn" 
          onClick={onOpenPredictionModal}
          title="Configura se unificare le statistiche a 5 con 6vs6, 7vs7, 8vs8 o separarle"
        >
          <Sliders size={18} /> Gestisci Previsione
        </button>
      </div>

      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button className="create-teams-btn" onClick={onSaveFormation} disabled={isSaving} style={{ width: '100%', maxWidth: '400px' }}>
              {isSaving ? 'Salvataggio...' : '💾 Salva Formazione'}
          </button>
        </div>
      )}
    </>
  );
};
