import React, { useState, useEffect, forwardRef } from 'react';
import { Pencil, ArrowLeftRight, LayoutGrid } from 'lucide-react';
import { Player, MatchResult, Results } from '@/types';
import {
  hashStringToHue,
  getRoleAbbreviation,
  getPitchPositionsForTeam,
  getAssignedRoleInfo,
  isRoleMatchingPrimary,
  isRoleMatchingSecondary,
  PesMorale,
  getPlayerMorale
} from '@/lib/teams/formation-utils';
import { isGoalkeeper } from '@/lib/algorithm/team-balancer';

export interface TacticalPitchesProps {
  results: Results;
  teamAName: string;
  setTeamAName: (name: string) => void;
  teamBName: string;
  setTeamBName: (name: string) => void;
  dbPlayers: Player[];
  matches: MatchResult[];
  isAdmin: boolean;
  modulo7TeamA: string;
  modulo7TeamB: string;
  modulo8TeamA: string;
  modulo8TeamB: string;
  currentLightTeam: 'A' | 'B';
  onToggleMaglia: () => void;
  onOpenModuloModal: (team: 'A' | 'B') => void;
  onSelectPlayerForCard: (playerName: string) => void;
  onSwapPlayers: (playerA: string, teamA: 'teamA' | 'teamB', playerB: string, teamB: 'teamA' | 'teamB') => void;
  onRoleSwap: (teamKey: 'teamA' | 'teamB', indexFrom: number, indexTo: number) => void;
}

export const TacticalPitches = forwardRef<HTMLDivElement, TacticalPitchesProps>(function TacticalPitches({
  results,
  teamAName,
  setTeamAName,
  teamBName,
  setTeamBName,
  dbPlayers,
  matches,
  isAdmin,
  modulo7TeamA,
  modulo7TeamB,
  modulo8TeamA,
  modulo8TeamB,
  currentLightTeam,
  onToggleMaglia,
  onOpenModuloModal,
  onSelectPlayerForCard,
  onSwapPlayers,
  onRoleSwap
}, ref) {
  // Swap state (internal to tactical pitch interaction)
  const [activeSwapSource, setActiveSwapSource] = useState<{ name: string; team: 'teamA' | 'teamB' } | null>(null);
  const [selectedRolePlayer, setSelectedRolePlayer] = useState<{
    name: string;
    team: 'teamA' | 'teamB';
    index: number;
    role: string;
  } | null>(null);

  // Clean up swap selection on click outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (activeSwapSource) {
        setActiveSwapSource(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeSwapSource]);

  const teams = [
    { team: 'A' as const, name: teamAName, setName: setTeamAName, list: results.teamA, cls: 'team-falchi' },
    { team: 'B' as const, name: teamBName, setName: setTeamBName, list: results.teamB, cls: 'team-aquile' }
  ];

  return (
    <div className="teams-container" ref={ref}>
      {teams.map(t => {
        const activeModulo7 = t.team === 'A' ? modulo7TeamA : modulo7TeamB;
        const activeModulo8 = t.team === 'A' ? modulo8TeamA : modulo8TeamB;
        const positions = getPitchPositionsForTeam(t.list.length, activeModulo7, activeModulo8);
        const currentTeamKey = t.team === 'A' ? 'teamA' : 'teamB';

        return (
          <div key={t.team} className={`team-card ${t.cls}`}>
            <label className="team-header" style={{ cursor: isAdmin ? 'text' : 'default', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <input 
                type="text" 
                className="team-name" 
                value={t.name} 
                onChange={(e) => isAdmin && t.setName(e.target.value)} 
                spellCheck={false} 
                readOnly={!isAdmin}
                style={{ flex: 1, cursor: isAdmin ? 'text' : 'default', background: 'transparent', border: 'none', outline: 'none', color: 'inherit' }}
              />
              {isAdmin && <Pencil size={16} style={{ opacity: 0.5, cursor: 'pointer' }} />}
            </label>

            <ul className="team-list">
              {t.list.map((name, idx) => {
                const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                const hue = hashStringToHue(name);
                
                const isSwapTarget = isAdmin && activeSwapSource && activeSwapSource.team !== (t.team === 'A' ? 'teamA' : 'teamB');
                const isSwapSource = isAdmin && activeSwapSource?.name === name;
                const playerObj = dbPlayers.find(p => p.Nome === name);
                const isGk = isGoalkeeper(name, dbPlayers);
                const primaryRuolo = playerObj?.Ruolo || (isGk ? 'Portiere' : undefined);
                const morale = getPlayerMorale(name, matches);

                const pos = positions[idx];
                const isSmallFormat = t.list.length <= 6;
                const assignedRoleInfo = getAssignedRoleInfo(pos?.role);

                let displayRoleName = primaryRuolo;
                let displayAbbr = primaryRuolo ? getRoleAbbreviation(primaryRuolo) : '';
                let roleColor = '#ffd700';
                let roleStatus: 'primary' | 'secondary' | 'out_of_role' = 'primary';

                if (!isSmallFormat && pos?.role) {
                  // In 7vs7 e 8vs8: mostra il ruolo assegnato in campo
                  displayRoleName = assignedRoleInfo.name;
                  displayAbbr = assignedRoleInfo.abbr;
                  const isPrimary = isRoleMatchingPrimary(primaryRuolo, pos.role, playerObj?.piede);
                  if (isPrimary) {
                    roleStatus = 'primary';
                    roleColor = '#ffd700'; // Oro (Ruolo preferito)
                  } else if (isRoleMatchingSecondary(playerObj?.RuoloSecondario, pos.role, playerObj?.piede)) {
                    roleStatus = 'secondary';
                    roleColor = '#6f9c81'; // Blu scuro (colore precedentemente associato al ruolo preferito)
                  } else {
                    roleStatus = 'out_of_role';
                    roleColor = '#ff5252'; // Rosso (Fuori ruolo)
                  }
                } else {
                  // In 5vs5 e 6vs6: mostra solo il ruolo primario
                  displayRoleName = primaryRuolo;
                  displayAbbr = primaryRuolo ? getRoleAbbreviation(primaryRuolo) : '';
                  roleStatus = 'primary';
                  roleColor = '#ffd700';
                }

                // Configurazione stili badge e tooltip in base allo status ruolo
                let badgeBg = 'linear-gradient(135deg, rgba(60,45,10,0.7) 0%, rgba(30,22,5,0.7) 100%)';
                let badgeColor = '#ffd700';
                let badgeBorder = '1px solid rgba(255, 215, 0, 0.55)';
                let badgeShadow = '0 0 6px rgba(255, 215, 0, 0.25)';
                let badgeTitle = primaryRuolo ? `Ruolo preferito: ${displayRoleName}` : undefined;
                let roleTitle: string | undefined = undefined;

                if (roleStatus === 'secondary') {
                  badgeBg = 'linear-gradient(135deg, rgba(15,35,45,0.7) 0%, rgba(10,25,35,0.7) 100%)';
                  badgeColor = '#6f9c81';
                  badgeBorder = '1px solid rgba(111, 156, 129, 0.55)';
                  badgeShadow = '0 0 6px rgba(111, 156, 129, 0.25)';
                  badgeTitle = `Ruolo secondario: ${displayRoleName} (Ruolo preferito: ${primaryRuolo})`;
                  roleTitle = `Ruolo secondario (Preferito: ${primaryRuolo})`;
                } else if (roleStatus === 'out_of_role') {
                  badgeBg = 'linear-gradient(135deg, rgba(60,15,15,0.7) 0%, rgba(30,8,8,0.7) 100%)';
                  badgeColor = '#ff5252';
                  badgeBorder = '1px solid rgba(255, 82, 82, 0.55)';
                  badgeShadow = '0 0 6px rgba(255, 82, 82, 0.25)';
                  badgeTitle = `Fuori ruolo: ${displayRoleName} (Ruolo preferito: ${primaryRuolo || 'Nessuno'})`;
                  roleTitle = `Fuori ruolo (Preferito: ${primaryRuolo || 'Nessuno'})`;
                }

                return (
                  <li 
                    key={name} 
                    className={`player-row ${isSwapSource ? 'active-source' : ''} ${isSwapTarget ? 'selectable-target' : ''}`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.6rem', borderRadius: '6px',
                      cursor: isSwapTarget ? 'pointer' : 'default',
                      background: isSwapSource ? 'rgba(255,255,255,0.1)' : (isSwapTarget ? 'rgba(255,255,255,0.05)' : 'transparent'),
                      border: isSwapTarget ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                      transition: 'all 0.2s'
                    }}
                    onClick={(e) => {
                      if (isSwapTarget) {
                        e.stopPropagation();
                        onSwapPlayers(activeSwapSource!.name, activeSwapSource!.team, name, t.team === 'A' ? 'teamA' : 'teamB');
                        setActiveSwapSource(null);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar" style={{ background: `hsl(${hue}, 60%, 45%)` }}>{initials}</div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span className="player-name">{name}</span>
                          {displayAbbr && (
                            <span 
                              title={badgeTitle}
                              style={{ 
                                background: badgeBg, 
                                padding: '2px 5px', 
                                borderRadius: '2px', 
                                fontSize: '0.6rem', 
                                fontWeight: 'bold', 
                                color: badgeColor,
                                border: badgeBorder,
                                boxShadow: badgeShadow
                              }}
                            >
                              {displayAbbr}
                            </span>
                          )}
                          <span title={morale.title} style={{ display: 'flex' }}>
                            <PesMorale condition={morale.condition} />
                          </span>
                        </div>
                        {displayRoleName && (
                          <span 
                            title={roleTitle}
                            style={{ 
                              fontSize: '0.75rem', 
                              color: roleColor, 
                              marginTop: '0.1rem',
                              fontWeight: roleStatus === 'out_of_role' ? 600 : 500
                            }}
                          >
                            {displayRoleName}
                          </span>
                        )}
                      </div>
                    </div>
                    {isAdmin && (
                      <button 
                        className="swap-icon-btn" 
                        onClick={(e) => { e.stopPropagation(); setActiveSwapSource({ name, team: t.team === 'A' ? 'teamA' : 'teamB' }); }}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.4rem', color: isSwapSource ? '#fff' : 'rgba(255,255,255,0.4)' }}
                        title="Seleziona per scambiare giocatore con l'altra squadra"
                      >
                        ⇄
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            <div 
              className="pes-pitch"
              onClick={() => setSelectedRolePlayer(null)}
            >
              <div style={{ position: 'absolute', top: '12px', left: '0', right: '0', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, pointerEvents: 'none' }}>
                <span style={{ 
                  color: '#ffffff', 
                  fontWeight: 900, 
                  fontSize: '0.85rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '2px',
                  background: 'rgba(0,0,0,0.45)',
                  padding: '3px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.18)',
                  textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                }}>
                  {t.name}
                </span>
              </div>
              <div className="pes-goal-area-top"></div>
              <div className="pes-goal-area-bottom"></div>
              {t.list.map((name, idx) => {
                const isSwapTarget = isAdmin && activeSwapSource && activeSwapSource.team !== currentTeamKey;
                const isSwapSource = isAdmin && activeSwapSource?.name === name;
                const isRoleSwapSelected = selectedRolePlayer?.team === currentTeamKey && selectedRolePlayer?.index === idx;
                const isRoleSwapTeammate = !!selectedRolePlayer && selectedRolePlayer.team === currentTeamKey && selectedRolePlayer.index !== idx;
                const pos = positions[idx] || { top: '50%', left: '50%', role: '' };

                return (
                  <div 
                    key={name}
                    className={`pes-player ${isSwapSource ? 'active-source' : ''} ${isSwapTarget ? 'selectable-target' : ''} ${isRoleSwapSelected ? 'role-swap-active' : ''} ${isRoleSwapTeammate ? 'role-swap-target' : ''}`}
                    style={{
                      top: pos.top, 
                      left: pos.left,
                      transform: isSwapTarget 
                        ? 'translate(-50%, -50%) scale(1.15)' 
                        : isRoleSwapSelected 
                          ? 'translate(-50%, -50%) scale(1.18)' 
                          : isRoleSwapTeammate 
                            ? 'translate(-50%, -50%) scale(1.05)'
                            : 'translate(-50%, -50%)',
                      filter: isSwapTarget 
                        ? 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' 
                        : isRoleSwapSelected 
                          ? 'drop-shadow(0 0 14px #ffcc00)' 
                          : isRoleSwapTeammate 
                            ? 'drop-shadow(0 0 6px rgba(52, 152, 219, 0.6))'
                            : 'none',
                      opacity: isSwapSource ? 0.6 : 1,
                      zIndex: isRoleSwapSelected ? 30 : isRoleSwapTeammate ? 20 : 10
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      
                      // Caso 1: Admin swap inter-squadra
                      if (isSwapTarget) {
                        onSwapPlayers(activeSwapSource!.name, activeSwapSource!.team, name, currentTeamKey);
                        setActiveSwapSource(null);
                        return;
                      }

                      // Caso 2: C'è già un giocatore selezionato per spostamento ruolo
                      if (selectedRolePlayer) {
                        if (selectedRolePlayer.team === currentTeamKey) {
                          if (selectedRolePlayer.index === idx) {
                            // Cliccato sullo stesso: deseleziona
                            setSelectedRolePlayer(null);
                          } else {
                            // Scambia posizione e ruolo con questo compagno
                            onRoleSwap(currentTeamKey, selectedRolePlayer.index, idx);
                            setSelectedRolePlayer(null);
                          }
                          return;
                        } else {
                          // Giocatore dell'altra squadra: sposta selezione su di lui
                          setSelectedRolePlayer({
                            name,
                            team: currentTeamKey,
                            index: idx,
                            role: pos.role || ''
                          });
                          return;
                        }
                      }

                      // Caso 3: Seleziona questo giocatore per spostarlo di ruolo
                      setSelectedRolePlayer({
                        name,
                        team: currentTeamKey,
                        index: idx,
                        role: pos.role || ''
                      });
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      if (isAdmin) {
                        setSelectedRolePlayer(null);
                        setActiveSwapSource({ name, team: currentTeamKey });
                      } else {
                        onSelectPlayerForCard(name);
                      }
                    }}
                    title={
                      isRoleSwapTeammate 
                        ? `Clicca per scambiare ruolo tra ${selectedRolePlayer?.name} e ${name}` 
                        : isRoleSwapSelected 
                          ? 'Clicca per annullare spostamento ruolo' 
                          : `Clicca per spostare il ruolo di ${name}`
                    }
                  >
                    <img 
                      src={dbPlayers.find(p => p.Nome === name)?.figurina || `/players/${name}.jpg`}
                      alt={name}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: isRoleSwapSelected 
                          ? '3px solid #ffcc00' 
                          : t.team === currentLightTeam ? '3px solid #3498db' : '3px solid #e67e22',
                        boxShadow: isRoleSwapSelected ? '0 0 16px rgba(255,204,0,0.9)' : '0 2px 6px rgba(0,0,0,0.8)',
                        marginBottom: '4px',
                        background: '#1a2a3a',
                        transition: 'all 0.2s ease'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src.endsWith('.jpg')) {
                          target.src = `/players/${name}.png`;
                        } else {
                          target.src = `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="${t.team === currentLightTeam ? '#3498db' : '#e67e22'}" stroke="white" stroke-width="2"/></svg>`)}`;
                        }
                      }}
                    />
                    <div className="pes-player-name" style={{ fontSize: '0.8rem', padding: '2px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      {pos.role && (
                        <span style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: 800, 
                          color: pos.role === 'POR' ? '#f39c12' : pos.role.includes('D') || pos.role === 'TS' || pos.role === 'TD' || pos.role === 'CB' || pos.role === 'LB' || pos.role === 'RB' ? '#3498db' : pos.role === 'ATT' || pos.role === 'CF' ? '#e74c3c' : '#2ecc71',
                          borderRight: '1px solid rgba(255,255,255,0.25)',
                          paddingRight: '3px'
                        }}>
                          {pos.role}
                        </span>
                      )}
                      <span>{name}</span>
                      {isRoleSwapSelected && <span style={{ fontSize: '0.7rem', color: '#ffcc00', marginLeft: '2px' }}>🔄</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pannello Rapido Sposta Ruolo Giocatore */}
            {selectedRolePlayer && selectedRolePlayer.team === currentTeamKey && (
              <div 
                className="role-selector-panel"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 26, 38, 0.98), rgba(10, 16, 24, 0.98))',
                  border: '1px solid #ffcc00',
                  borderRadius: '8px',
                  padding: '0.7rem 0.9rem',
                  margin: '0.6rem 0.6rem 0 0.6rem',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.65), 0 0 14px rgba(255,204,0,0.3)',
                  animation: 'fadeIn 0.2s ease-in-out'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#ffcc00', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>🔄</span>
                      <span>Sposta Ruolo:</span>
                      <span style={{ color: '#ffffff' }}>{selectedRolePlayer.name}</span>
                    </span>
                    <span style={{ 
                      fontSize: '0.68rem', 
                      fontWeight: 800, 
                      background: 'rgba(255,255,255,0.15)', 
                      padding: '2px 7px', 
                      borderRadius: '4px',
                      color: '#9fd9b6'
                    }}>
                      Attuale: {selectedRolePlayer.role}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const p = selectedRolePlayer.name;
                        setSelectedRolePlayer(null);
                        onSelectPlayerForCard(p);
                      }}
                      style={{
                        background: 'rgba(52, 152, 219, 0.25)',
                        border: '1px solid rgba(52, 152, 219, 0.6)',
                        color: '#74b9ff',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                      title="Apri scheda PES dettagliata"
                    >
                      📇 Scheda PES
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRolePlayer(null)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#bbb',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        padding: '0 4px',
                        lineHeight: 1
                      }}
                      title="Chiudi"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.45rem' }}>
                  👉 Clicca su un compagno nel campo o scegli il nuovo ruolo da assegnare:
                </div>

                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {positions.map((pSlot, sIdx) => {
                    const occupantName = t.list[sIdx];
                    const isSelf = sIdx === selectedRolePlayer.index;
                    const slotRole = pSlot.role || `R${sIdx+1}`;
                    const roleColor = slotRole === 'POR' ? '#f39c12' : slotRole.includes('D') || slotRole === 'TS' || slotRole === 'TD' ? '#3498db' : slotRole === 'ATT' ? '#e74c3c' : '#2ecc71';

                    return (
                      <button
                        key={sIdx}
                        type="button"
                        disabled={isSelf}
                        onClick={() => {
                          onRoleSwap(currentTeamKey, selectedRolePlayer.index, sIdx);
                          setSelectedRolePlayer(null);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '5px',
                          background: isSelf ? 'rgba(255, 204, 0, 0.22)' : 'rgba(255,255,255,0.08)',
                          border: isSelf ? '1px solid #ffcc00' : '1px solid rgba(255,255,255,0.18)',
                          color: isSelf ? '#ffcc00' : '#ffffff',
                          fontSize: '0.72rem',
                          cursor: isSelf ? 'default' : 'pointer',
                          opacity: isSelf ? 0.9 : 1,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ fontWeight: 900, color: roleColor }}>{slotRole}</span>
                        <span style={{ color: isSelf ? '#ffcc00' : 'rgba(255,255,255,0.85)', fontWeight: isSelf ? 800 : 500 }}>
                          {occupantName} {isSelf ? '✓' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Controlli Modulo e Maglie fuori dall'immagine, posizionati sotto al campo */}
            <div 
              className="pitch-controls-bar"
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.65rem 1rem', 
                background: 'rgba(12, 18, 26, 0.95)', 
                borderTop: '1px solid rgba(107, 155, 198, 0.3)',
                gap: '0.6rem',
                flexWrap: 'wrap'
              }}
            >
              {/* Indicatore Maglie e tasto rapido Inverti per admin */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span 
                  style={{ 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: t.team === currentLightTeam ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.45)',
                    color: t.team === currentLightTeam ? '#ffffff' : '#ffcc00',
                    border: `1px solid ${t.team === currentLightTeam ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 204, 0, 0.4)'}`,
                    letterSpacing: '0.5px'
                  }}
                >
                  <span>{t.team === currentLightTeam ? '⚪' : '🔘'}</span>
                  <span>{t.team === currentLightTeam ? 'MAGLIE CHIARE' : 'MAGLIE SCURE'}</span>
                </span>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={onToggleMaglia}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#aaa',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                    title="Inverti colore maglie delle due squadre"
                  >
                    <ArrowLeftRight size={11} /> Inverti
                  </button>
                )}
              </div>

              {/* Modulo tattico (per 7vs7 e 8vs8) */}
              {(t.list.length === 7 || t.list.length === 8) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => onOpenModuloModal(t.team as 'A' | 'B')}
                    style={{
                      background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.25) 0%, rgba(41, 128, 185, 0.35) 100%)',
                      border: '1px solid #3498db',
                      color: '#5de4ff',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      letterSpacing: '0.5px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}
                    title="Clicca per cambiare modulo tattico"
                  >
                    <LayoutGrid size={13} />
                    <span>MODULO {t.team === 'A' ? (t.list.length === 8 ? modulo8TeamA : modulo7TeamA) : (t.list.length === 8 ? modulo8TeamB : modulo7TeamB)}</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>✎</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
