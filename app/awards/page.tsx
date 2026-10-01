'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Trophy, Medal, Star, Target, TrendingUp, CalendarDays } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- Utils ---
const hashStringToHue = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 360;
}

const getAvatar = (name: string) => {
    if (!name) return { initials: '', hue: 0 };
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    return { initials, hue: hashStringToHue(name) };
};

export default function AwardsPage() {
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [awardsData, setAwardsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Genera mesi da Settembre 2026 fino ad un anno avanti
  const months = useMemo(() => {
    const list = [];
    const startDate = new Date(2026, 8, 1); // September 2026
    const endDate = new Date();
    // Add 12 months ahead just in case, or up to current date
    let current = new Date(startDate);
    
    // We want to at least show up to the current date, but maybe future months aren't selectable?
    // Let's generate up to slightly ahead so it covers the present month
    endDate.setMonth(endDate.getMonth() + 2);

    while (current <= endDate) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      list.push(`${yyyy}-${mm}`);
      current.setMonth(current.getMonth() + 1);
    }
    return list;
  }, []);

  useEffect(() => {
    const d = new Date();
    // Default to last month if we're in a new month
    d.setMonth(d.getMonth() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const startStr = '2026-09';
    const computed = `${y}-${m}`;
    // Clamp
    if (computed >= startStr) {
      setSelectedMonth(computed);
    } else {
      setSelectedMonth('2026-09');
    }
    
    fetchAwards();
  }, []);

  const fetchAwards = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/awards');
      const data = await res.json();
      if (data.success) {
        setAwardsData(data.awards);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMonthLabel = (yyyy_mm: string) => {
    const [y, m] = yyyy_mm.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleString('it-IT', { month: 'long', year: 'numeric' }).toUpperCase();
  };

  const currentAward = awardsData.find(a => a.mese_anno === selectedMonth) || null;

  const handlePrev = () => {
    const idx = months.indexOf(selectedMonth);
    if (idx > 0) setSelectedMonth(months[idx - 1]);
  };

  const handleNext = () => {
    const idx = months.indexOf(selectedMonth);
    if (idx < months.length - 1) setSelectedMonth(months[idx + 1]);
  };

  const renderPodium = () => {
    if (!currentAward) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-faint)', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
          <Trophy size={48} style={{ opacity: 0.3, marginBottom: '1rem', margin: '0 auto' }} />
          <h3>Nessun dato disponibile per {getMonthLabel(selectedMonth)}</h3>
          <p>Il premio non è ancora stato calcolato o salvato per questo mese.</p>
        </div>
      );
    }

    const { primo_posto, secondo_posto, terzo_posto } = currentAward;

    const PodiumItem = ({ rank, name, height, color, glow, avatarUrl }: any) => {
      const { initials, hue } = getAvatar(name);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', flex: 1, zIndex: 3 - rank }}>
          
          <div style={{ 
            width: rank === 1 ? '70px' : '55px', 
            height: rank === 1 ? '70px' : '55px', 
            borderRadius: '50%', 
            background: avatarUrl ? `url(${avatarUrl}) center/cover` : `hsl(${hue}, 60%, 45%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: rank === 1 ? '1.5rem' : '1.2rem',
            fontWeight: 'bold',
            color: '#fff',
            boxShadow: `0 0 20px ${glow}, inset 0 0 10px rgba(0,0,0,0.5)`,
            border: `3px solid ${color}`,
            marginBottom: '1rem',
            position: 'relative'
          }}>
            {!avatarUrl && initials}
            <div style={{
              position: 'absolute',
              bottom: '-10px',
              background: color,
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontSize: '0.8rem',
              fontWeight: 900
            }}>{rank}°</div>
          </div>
          
          <div style={{ fontWeight: 800, fontSize: rank === 1 ? '1.2rem' : '1rem', color: rank === 1 ? color : '#fff', textShadow: '1px 1px 2px rgba(0,0,0,0.8)', textAlign: 'center', marginBottom: '8px' }}>
            {name}
          </div>
          
          <div style={{
            width: '100%',
            height: height,
            background: `linear-gradient(180deg, ${color}33 0%, rgba(0,0,0,0.5) 100%)`,
            borderTop: `2px solid ${color}`,
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            borderTopLeftRadius: '4px',
            borderTopRightRadius: '4px',
            position: 'relative'
          }}>
            {rank === 1 && <Trophy size={40} color={color} style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', opacity: 0.8 }} />}
          </div>
        </div>
      );
    }

    const stats: any[] = typeof currentAward.stats_details === 'string' ? JSON.parse(currentAward.stats_details) : currentAward.stats_details;
    const findAvatar = (pName: string) => {
       if (!stats || !Array.isArray(stats)) return `/players/${pName}.png`;
       const p = stats.find(s => s.name === pName);
       return p?.figurina || `/players/${pName}.png`;
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '8px', height: '300px', maxWidth: '500px', margin: '0 auto', paddingTop: '2rem' }}>
          <PodiumItem rank={2} name={secondo_posto} height="120px" color="#c0c0c0" glow="rgba(192, 192, 192, 0.4)" avatarUrl={findAvatar(secondo_posto)} />
          <PodiumItem rank={1} name={primo_posto} height="180px" color="#ffd700" glow="rgba(255, 215, 0, 0.6)" avatarUrl={findAvatar(primo_posto)} />
          <PodiumItem rank={3} name={terzo_posto} height="90px" color="#cd7f32" glow="rgba(205, 127, 50, 0.4)" avatarUrl={findAvatar(terzo_posto)} />
        </div>
        <div style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--color-text-muted)', fontSize: '0.95rem', maxWidth: '600px', lineHeight: '1.6' }}>
          Il <strong>Giocatore del Mese</strong> è calcolato tramite un algoritmo che premia la costanza. Si basa su <strong style={{color: '#fff'}}>Media Voto</strong>, <strong style={{color: '#fff'}}>N° MVP</strong>, <strong style={{color: '#fff'}}>Punti Squadra</strong> e <strong style={{color: '#fff'}}>Gol Segnati</strong>, con un malus per chi gioca meno del 50% delle partite.
        </div>
      </div>
    );
  };

  const renderStats = () => {
    if (!currentAward || !currentAward.stats_details) return null;
    
    // Stats Details should be an array of objects corresponding to the players or grouped by metric.
    // Example: [{ name: 'Marco', mvp: 3, voto: 6.8, punti: 12, gol: 5 }]
    const stats: any[] = typeof currentAward.stats_details === 'string' ? JSON.parse(currentAward.stats_details) : currentAward.stats_details;

    if (!Array.isArray(stats) || stats.length === 0) return null;

    const colors = ['#ffd700', '#c0c0c0', '#cd7f32', '#34d680', '#5de4ff'];

    const dateMap: Record<string, any> = {};
    if (stats && Array.isArray(stats)) {
      stats.forEach(p => {
        if (p.storicoVoti && Array.isArray(p.storicoVoti)) {
          p.storicoVoti.forEach((v: any) => {
            if (!dateMap[v.date]) dateMap[v.date] = { name: v.date };
            dateMap[v.date][p.name] = v.voto;
          });
        }
      });
    }
    
    const timeSeriesData = Object.values(dateMap).sort((a: any, b: any) => {
       if (!a.name || !b.name) return 0;
       const [d1, m1] = a.name.split('/').map(Number);
       const [d2, m2] = b.name.split('/').map(Number);
       if (m1 !== m2) return m1 - m2;
       return d1 - d2;
    });

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '3rem' }}>
        
        {/* MVP Chart */}
        <div className="chart-card">
          <h4><Star size={16} /> N° MVP Ottenuti</h4>
          <div style={{ height: '220px', padding: '10px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background: '#151f2b', border: '1px solid #3da5f5', borderRadius: '8px'}} itemStyle={{color: '#fff'}} labelStyle={{color: '#aaa', fontWeight: 600, marginBottom: '4px'}} />
                <Bar dataKey="mvp" radius={[4, 4, 0, 0]}>
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Media Voto Chart */}
        <div className="chart-card">
          <h4><TrendingUp size={16} /> Media Voto</h4>
          <div style={{ height: '220px', padding: '10px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              {timeSeriesData.length > 0 ? (
                <LineChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                  <Tooltip cursor={{stroke: 'rgba(255,255,255,0.1)'}} contentStyle={{background: '#151f2b', border: '1px solid #3da5f5', borderRadius: '8px'}} itemStyle={{color: '#fff'}} labelStyle={{color: '#aaa', fontWeight: 600, marginBottom: '4px'}} />
                  {stats.slice(0, 3).map((p, index) => (
                    <Line key={p.name} type="monotone" dataKey={p.name} stroke={colors[index % colors.length]} strokeWidth={3} dot={{r: 5, fill: colors[index % colors.length], stroke: '#151f2b', strokeWidth: 2}} activeDot={{r: 7}} connectNulls={true} />
                  ))}
                </LineChart>
              ) : (
                <div style={{color: '#888', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Nessuno storico voti disponibile nel mese. Per vederlo, ricalcola i dati visitando /api/awards/calculate?month=MESE</div>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Punti Ottenuti Chart */}
        <div className="chart-card">
          <h4><Medal size={16} /> Punti Squadra</h4>
          <div style={{ height: '220px', padding: '10px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background: '#151f2b', border: '1px solid #3da5f5', borderRadius: '8px'}} itemStyle={{color: '#fff'}} labelStyle={{color: '#aaa', fontWeight: 600, marginBottom: '4px'}} />
                <Bar dataKey="punti" radius={[4, 4, 0, 0]}>
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gol Segnati */}
        <div className="chart-card">
          <h4><Target size={16} /> Gol Segnati</h4>
          <div style={{ height: '220px', padding: '10px 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats} margin={{ top: 10, right: 10, left: -25, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background: '#151f2b', border: '1px solid #3da5f5', borderRadius: '8px'}} itemStyle={{color: '#fff'}} labelStyle={{color: '#aaa', fontWeight: 600, marginBottom: '4px'}} />
                <Bar dataKey="gol" radius={[4, 4, 0, 0]}>
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} opacity={0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const alboDoro = awardsData.filter(a => a.primo_posto);

  return (
    <div style={{ paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <a href="/" style={{ color: 'var(--color-primary)', textDecoration: 'none', position: 'absolute', left: '1rem', top: '1rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ChevronLeft size={16} /> Homepage
        </a>
      </header>

      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
        
        {/* Month Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', background: 'var(--color-surface)', padding: '1rem', borderRadius: '30px', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          <button 
            onClick={handlePrev} 
            disabled={months.indexOf(selectedMonth) === 0}
            style={{ background: 'transparent', border: 'none', color: months.indexOf(selectedMonth) === 0 ? 'rgba(255,255,255,0.2)' : 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ChevronLeft size={28} />
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '150px' }}>
             <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>
                Giocatore del Mese
             </span>
             <select 
               value={selectedMonth} 
               onChange={(e) => setSelectedMonth(e.target.value)}
               style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.4rem', fontWeight: 900, outline: 'none', textAlign: 'center', appearance: 'none', cursor: 'pointer' }}
             >
                {months.map(m => (
                  <option key={m} value={m} style={{ background: '#151f2b' }}>
                    {getMonthLabel(m)}
                  </option>
                ))}
             </select>
          </div>

          <button 
            onClick={handleNext} 
            disabled={months.indexOf(selectedMonth) === months.length - 1}
            style={{ background: 'transparent', border: 'none', color: months.indexOf(selectedMonth) === months.length - 1 ? 'rgba(255,255,255,0.2)' : 'var(--color-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <ChevronRight size={28} />
          </button>
        </div>

        {/* Podium section */}
        {loading ? (
           <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-faint)' }}>Caricamento dati...</div>
        ) : (
          <>
            {renderPodium()}
            {renderStats()}
          </>
        )}
      </section>

      {/* Albo d'Oro */}
      {alboDoro.length > 0 && (
        <section style={{ maxWidth: '900px', margin: '4rem auto 0', padding: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
            <CalendarDays color="#ffd700" size={20} />
            ALBO D'ORO
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
            {alboDoro.map(award => {
              const { initials, hue } = getAvatar(award.primo_posto);
              const stats: any[] = typeof award.stats_details === 'string' ? JSON.parse(award.stats_details) : award.stats_details;
              const topPlayer = stats && Array.isArray(stats) ? stats.find(s => s.name === award.primo_posto) : null;
              const avatarUrl = topPlayer?.figurina || `/players/${award.primo_posto}.png`;

              return (
                <div key={award.mese_anno} style={{ background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(0,0,0,0.6) 100%)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.2s', cursor: 'pointer' }} onClick={() => setSelectedMonth(award.mese_anno)}>
                  <span style={{ fontSize: '0.75rem', color: '#aaa', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
                    {getMonthLabel(award.mese_anno).split(' ')[0]} {award.mese_anno.split('-')[0]}
                  </span>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: avatarUrl ? `url(${avatarUrl}) center/cover` : `hsl(${hue}, 60%, 45%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', border: '2px solid #ffd700', marginBottom: '8px', boxShadow: '0 0 10px rgba(255,215,0,0.3)' }}>
                    {!avatarUrl && initials}
                  </div>
                  <span style={{ fontWeight: 800, color: '#ffd700', fontSize: '0.9rem', textAlign: 'center' }}>{award.primo_posto}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .chart-card {
           background: var(--color-surface);
           border: 1px solid var(--color-border);
           border-radius: 16px;
           padding: 1rem;
           box-shadow: 0 10px 20px rgba(0,0,0,0.4);
        }
        .chart-card h4 {
           margin: 0;
           color: #fff;
           font-size: 0.9rem;
           display: flex;
           align-items: center;
           gap: 8px;
           border-bottom: 1px solid rgba(255,255,255,0.1);
           padding-bottom: 10px;
           margin-bottom: 10px;
        }
      `}} />
    </div>
  );
}
