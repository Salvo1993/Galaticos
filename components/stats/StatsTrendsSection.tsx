'use client';

import React, { useState, useMemo } from 'react';
import { BarChart2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { MultiSelectDropdown } from '@/components/ui/Dropdowns';
import { calculateStatsData, PlayerStatsData } from '@/lib/stats/match-utils';
import type { Player, MatchResult } from '@/types';

export interface StatsTrendsSectionProps {
  matches: MatchResult[];
  showGuests: boolean;
  dbPlayers: Player[];
  statsData?: PlayerStatsData[];
}

export const StatsTrendsSection: React.FC<StatsTrendsSectionProps> = ({
  matches,
  showGuests,
  dbPlayers,
  statsData: propStatsData,
}) => {
  const [statsSelectedPlayers, setStatsSelectedPlayers] = useState<string[]>([]);
  const [hiddenTrendPlayers, setHiddenTrendPlayers] = useState<string[]>([]);

  const toggleTrendPlayer = (playerName: string) => {
    setHiddenTrendPlayers(prev =>
      prev.includes(playerName)
        ? prev.filter(p => p !== playerName)
        : [...prev, playerName]
    );
  };

  const computedStatsData = useMemo(() => {
    return calculateStatsData(matches, showGuests, dbPlayers);
  }, [matches, showGuests, dbPlayers]);

  const statsData = propStatsData || computedStatsData;

  const trendChartData = useMemo(() => {
    const sortedMatches = [...matches].sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
    );

    return sortedMatches
      .filter(m => m.risultato && m.risultato !== '0-0')
      .map(m => {
        const matchDate = new Date(m.data);
        const shortDate = `${matchDate
          .getDate()
          .toString()
          .padStart(2, '0')}/${(matchDate.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;

        const dataPoint: any = { data: shortDate, matchId: m.id };

        if (m.voti_giocatori) {
          Object.entries(m.voti_giocatori).forEach(([playerName, voto]) => {
            if (typeof voto === 'number' && voto > 0) {
              dataPoint[playerName] = voto;
            }
          });
        }
        return dataPoint;
      });
  }, [matches]);

  return (
    <section className="dashboard-card" id="stats" style={{ marginTop: '2rem' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>
          <BarChart2
            size={20}
            style={{
              verticalAlign: '-3px',
              marginRight: '0.4rem',
              color: '#e8b339',
            }}
          />
          Statistiche
        </h2>
      </div>
      <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
        Statistiche generali e andamento voti.
      </p>

      {statsData.length > 0 ? (
        <>
          <div style={{ marginBottom: '2rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#cfe8d8' }}>
                Andamento Media Voto
              </h3>
              <MultiSelectDropdown
                selectedValues={statsSelectedPlayers}
                onChange={vals => {
                  setStatsSelectedPlayers(vals);
                  setHiddenTrendPlayers([]);
                }}
                placeholder="Tutti i Giocatori"
                hasAllOption={true}
                options={statsData.map(p => ({
                  value: p.name,
                  label: p.name,
                }))}
              />
            </div>

            <div
              style={{
                width: '100%',
                height: 320,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                padding: '1rem',
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                {statsSelectedPlayers.length === 1 ? (
                  <LineChart
                    data={
                      statsData.find(p => p.name === statsSelectedPlayers[0])
                        ?.votiTrend || []
                    }
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      dataKey="data"
                      stroke="#9fd9b6"
                      fontSize={12}
                      tickMargin={10}
                    />
                    <YAxis domain={[4, 10]} stroke="#9fd9b6" fontSize={12} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#1a2a3a',
                        borderColor: '#3a4a5a',
                        color: '#cfe8d8',
                      }}
                      itemStyle={{ color: '#e8b339' }}
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: '12px',
                        paddingTop: '10px',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      onClick={(e: any) => {
                        const name = e?.dataKey || e?.value;
                        if (name) toggleTrendPlayer(name);
                      }}
                      formatter={(value: string) => {
                        const isHidden = hiddenTrendPlayers.includes(value);
                        return (
                          <span
                            style={{
                              color: isHidden ? '#667788' : '#cfe8d8',
                              textDecoration: isHidden
                                ? 'line-through'
                                : 'none',
                              opacity: isHidden ? 0.45 : 1,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            {value}
                          </span>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="voto"
                      name={`Voto ${statsSelectedPlayers[0]}`}
                      stroke="#3498db"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      hide={
                        hiddenTrendPlayers.includes(
                          `Voto ${statsSelectedPlayers[0]}`
                        ) || hiddenTrendPlayers.includes('voto')
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="mediaCumulativa"
                      name="Media Cumulativa"
                      stroke="#e8b339"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      hide={
                        hiddenTrendPlayers.includes('Media Cumulativa') ||
                        hiddenTrendPlayers.includes('mediaCumulativa')
                      }
                    />
                  </LineChart>
                ) : (
                  <LineChart
                    data={trendChartData}
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis
                      dataKey="data"
                      stroke="#9fd9b6"
                      fontSize={12}
                      tickMargin={10}
                    />
                    <YAxis domain={[4, 10]} stroke="#9fd9b6" fontSize={12} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#1a2a3a',
                        borderColor: '#3a4a5a',
                        color: '#cfe8d8',
                      }}
                      itemStyle={{ color: '#cfe8d8' }}
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: '12px',
                        paddingTop: '10px',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                      onClick={(e: any) => {
                        const name = e?.dataKey || e?.value;
                        if (name) toggleTrendPlayer(name);
                      }}
                      formatter={(value: string) => {
                        const isHidden = hiddenTrendPlayers.includes(value);
                        return (
                          <span
                            style={{
                              color: isHidden ? '#667788' : '#cfe8d8',
                              textDecoration: isHidden
                                ? 'line-through'
                                : 'none',
                              opacity: isHidden ? 0.45 : 1,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            {value}
                          </span>
                        );
                      }}
                    />
                    {(statsSelectedPlayers.length > 0
                      ? statsSelectedPlayers
                      : statsData
                          .filter(
                            p =>
                              p.partiteGiocate >= trendChartData.length / 2
                          )
                          .map(p => p.name)
                    ).map((playerName, idx) => (
                      <Line
                        key={playerName}
                        type="monotone"
                        dataKey={playerName}
                        name={playerName}
                        stroke={
                          [
                            '#3498db',
                            '#e74c3c',
                            '#2ecc71',
                            '#f1c40f',
                            '#9b59b6',
                            '#e67e22',
                            '#1abc9c',
                            '#34495e',
                            '#ff7979',
                            '#badc58',
                          ][idx % 10]
                        }
                        strokeWidth={2}
                        dot={
                          statsSelectedPlayers.length > 0 ? { r: 3 } : false
                        }
                        activeDot={{ r: 5 }}
                        connectNulls={true}
                        hide={hiddenTrendPlayers.includes(playerName)}
                      />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3
              style={{
                margin: '0 0 1rem 0',
                fontSize: '1.1rem',
                color: '#cfe8d8',
              }}
            >
              Gol Segnati e Subiti (di Squadra)
            </h3>
            <div
              style={{
                width: '100%',
                height: Math.max(400, statsData.length * 45),
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '8px',
                padding: '1rem 0',
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={statsData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                    horizontal={false}
                  />
                  <XAxis type="number" stroke="#9fd9b6" fontSize={12} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="#9fd9b6"
                    fontSize={12}
                    width={90}
                    tick={{ fill: '#cfe8d8' }}
                    tickFormatter={t =>
                      typeof t === 'string' && t.length > 12
                        ? t.slice(0, 12) + '...'
                        : t
                    }
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#1a2a3a',
                      borderColor: '#3a4a5a',
                      color: '#cfe8d8',
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  />
                  <Bar
                    dataKey="golFattiSquadra"
                    name="Gol Segnati"
                    fill="#2ecc71"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="golSubitiSquadra"
                    name="Gol Subiti"
                    fill="#e74c3c"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#6f9c81',
          }}
        >
          Nessun dato statistico disponibile.
        </div>
      )}
    </section>
  );
};
