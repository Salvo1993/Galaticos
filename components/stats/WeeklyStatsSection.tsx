'use client';

import React, { useMemo } from 'react';
import { Player, MatchResult } from '@/types';
import { hashStringToHue } from '@/lib/teams/formation-utils';

export interface WeeklyStatsSectionProps {
  matches: MatchResult[];
  showGuests: boolean;
  dbPlayers: Player[];
}

export const WeeklyStatsSection: React.FC<WeeklyStatsSectionProps> = ({
  matches,
  showGuests,
  dbPlayers,
}) => {
  const weeklyData = useMemo(() => {
    const validMatches = matches.filter(m => {
      const mDate = new Date(m.data);
      const isInterruptedMatch =
        mDate.getDate() === 8 &&
        mDate.getMonth() === 6 &&
        mDate.getFullYear() === 2026 &&
        m.ora &&
        m.ora.startsWith('21');
      return !isInterruptedMatch && m.risultato && m.risultato !== '0-0';
    });
    if (validMatches.length === 0) return null;
    const lastMatch = validMatches[0];

    const [scoreA, scoreB] = (lastMatch.risultato || '0-0')
      .split('-')
      .map(s => parseInt(s.trim(), 10) || 0);
    const isDraw = scoreA === scoreB;
    const isWinnerA = scoreA > scoreB;

    let teamAPlayers = lastMatch.team_a_players || [];
    let teamBPlayers = lastMatch.team_b_players || [];

    if (!showGuests) {
      teamAPlayers = teamAPlayers.filter((p: string) =>
        dbPlayers.some(dbp => dbp.Nome === p)
      );
      teamBPlayers = teamBPlayers.filter((p: string) =>
        dbPlayers.some(dbp => dbp.Nome === p)
      );
    }

    const voti = lastMatch.voti_giocatori || {};
    const seed = lastMatch.id || 1;

    // Stable seeded pseudo-random selection
    const selectRandomSeeded = (
      players: string[],
      count: number,
      s: number
    ): string[] => {
      const list = [...players];
      const selected: string[] = [];
      let currentSeed = s;
      for (let i = 0; i < count; i++) {
        if (list.length === 0) break;
        const x = Math.sin(currentSeed++) * 10000;
        const r = x - Math.floor(x);
        const index = Math.floor(r * list.length);
        selected.push(list.splice(index, 1)[0]);
      }
      return selected;
    };

    // Helper to select N players from a team based on votes (highest or lowest)
    const selectByVote = (
      team: string[],
      votiObj: Record<string, number | 's.v.'>,
      count: number,
      highest: boolean,
      baseSeed: number
    ): string[] => {
      const playersWithVotes = team
        .filter(p => votiObj[p] !== 's.v.' && votiObj[p] !== 0)
        .map(p => ({
          name: p,
          vote: typeof votiObj[p] === 'number' ? (votiObj[p] as number) : 6, // Default 6 if missing
        }));

      // Group players by votes
      const groups: Record<number, string[]> = {};
      playersWithVotes.forEach(p => {
        if (!groups[p.vote]) groups[p.vote] = [];
        groups[p.vote].push(p.name);
      });

      // Get sorted unique vote counts
      const uniqueVotes = Object.keys(groups)
        .map(Number)
        .sort((a, b) => (highest ? b - a : a - b));

      const selected: string[] = [];
      let needed = count;
      let currentSeed = baseSeed;

      for (const v of uniqueVotes) {
        if (needed <= 0) break;
        const group = groups[v];
        if (group.length <= needed) {
          selected.push(...group);
          needed -= group.length;
        } else {
          // Need to choose 'needed' players from 'group' randomly (seeded)
          const chosen = selectRandomSeeded(group, needed, currentSeed);
          selected.push(...chosen);
          needed = 0;
        }
      }
      return selected;
    };

    let affinity: string[] = [];
    let breakup: string[] = [];

    if (isDraw) {
      // Draw:
      // Affinità: 1 highest from A, 1 highest from B
      const affA = selectByVote(teamAPlayers, voti, 1, true, seed + 100);
      const affB = selectByVote(teamBPlayers, voti, 1, true, seed + 200);
      affinity = [...affA, ...affB];

      // Meglio chiuderla qui: 1 lowest from A, 1 lowest from B
      const brkA = selectByVote(teamAPlayers, voti, 1, false, seed + 300);
      const brkB = selectByVote(teamBPlayers, voti, 1, false, seed + 400);
      breakup = [...brkA, ...brkB];
    } else {
      // Winner / Loser exists
      const winTeam = isWinnerA ? teamAPlayers : teamBPlayers;
      const loseTeam = isWinnerA ? teamBPlayers : teamAPlayers;

      // Affinità della settimana: 2 from winning team (highest votes)
      affinity = selectByVote(winTeam, voti, 2, true, seed + 500);

      // Meglio chiuderla qui: 2 from losing team (lowest votes)
      breakup = selectByVote(loseTeam, voti, 2, false, seed + 600);
    }

    return { affinity, breakup, isDraw };
  }, [matches, showGuests, dbPlayers]);

  return (
    <section className="weekly-stats-section" style={{ marginTop: '2rem' }}>
      <div className="weekly-stats-grid">
        {/* Box 1: Affinità della settimana */}
        <div className="weekly-stats-card affinity">
          <div className="weekly-stats-card-header">
            <span>Affinità della settimana 🤼🧑🤝🧑</span>
          </div>
          {weeklyData ? (
            <div className="weekly-stats-players">
              {weeklyData.affinity.map(name => {
                const initials = name
                  .split(' ')
                  .map((w: string) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
                const hue = hashStringToHue(name);
                return (
                  <div key={name} className="weekly-stats-player-row">
                    <div
                      className="avatar"
                      style={{ background: `hsl(${hue}, 60%, 45%)` }}
                    >
                      {initials}
                    </div>
                    <span className="weekly-stats-player-name">{name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="weekly-stats-empty">
              <span>Nessun match recente giocato negli ultimi 7 giorni 📅</span>
            </div>
          )}
        </div>

        {/* Box 2: Meglio chiuderla qui */}
        <div className="weekly-stats-card breakup">
          <div className="weekly-stats-card-header">
            <span>Meglio chiuderla qui 💔😰</span>
          </div>
          {weeklyData ? (
            weeklyData.isDraw ? (
              <div className="weekly-stats-empty">
                <span>Nessun perdente (partita finita in pareggio) 🤝</span>
              </div>
            ) : (
              <div className="weekly-stats-players">
                {weeklyData.breakup.map(name => {
                  const initials = name
                    .split(' ')
                    .map((w: string) => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  const hue = hashStringToHue(name);
                  return (
                    <div key={name} className="weekly-stats-player-row">
                      <div
                        className="avatar"
                        style={{ background: `hsl(${hue}, 60%, 45%)` }}
                      >
                        {initials}
                      </div>
                      <span className="weekly-stats-player-name">{name}</span>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="weekly-stats-empty">
              <span>Nessun match recente giocato negli ultimi 7 giorni 📅</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
