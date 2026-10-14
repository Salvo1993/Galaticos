'use client';

import React from 'react';
import { signIn, signOut } from 'next-auth/react';
import { Sun, Moon, Calendar, Edit } from 'lucide-react';

export interface HeaderBannerProps {
  headerImage: string;
  setHeaderImage: (url: string) => void;
  isAdmin: boolean;
  matchLabel: string;
  setMatchLabel: (label: string) => void;
  saveSettings: (label: string) => void;
  session: any;
  theme: 'dark' | 'light';
  setTheme: React.Dispatch<React.SetStateAction<'dark' | 'light'>> | ((theme: 'dark' | 'light') => void);
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const HeaderBanner: React.FC<HeaderBannerProps> = ({
  headerImage,
  setHeaderImage,
  isAdmin,
  matchLabel,
  setMatchLabel,
  saveSettings,
  session,
  theme,
  setTheme,
  showToast,
}) => {
  return (
    <>
      <header style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div
          style={{
            width: '100%',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '2px solid rgba(107, 155, 198, 0.6)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.8)',
            background: '#0a0e14',
            position: 'relative',
          }}
        >
          <img
            src={headerImage || '/players/header.jpg'}
            alt="Post Evolution Soccer"
            style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '350px' }}
            onError={e => {
              const target = e.target as HTMLImageElement;
              if (target.src.endsWith('.jpg')) {
                target.src = '/players/header.png';
              } else if (!target.src.includes('base64')) {
                target.style.display = 'none';
                target.parentElement!.style.display = 'none';
              }
            }}
          />
          {isAdmin && (
            <label
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '6px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                zIndex: 10,
              }}
            >
              <Edit size={16} /> Modifica Copertina
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  showToast('Caricamento in corso...', 'info');
                  const fb = new FormData();
                  fb.append('file', file);
                  try {
                    const res = await fetch('/api/settings/upload-header', { method: 'POST', body: fb });
                    if (res.ok) {
                      const data = await res.json();
                      if (data.url) setHeaderImage(data.url);
                      showToast('Copertina aggiornata', 'success');
                    } else {
                      showToast('Errore caricamento', 'error');
                    }
                  } catch {
                    showToast('Errore caricamento', 'error');
                  }
                }}
              />
            </label>
          )}
        </div>
        <div className="header-top" style={{ padding: '0 10px' }}>
          <div className="logo-section">
            <div className="match-info" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: isAdmin ? 'pointer' : 'default',
                }}
                onClick={e => {
                  if (!isAdmin) return;
                  const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                  if (input && typeof input.showPicker === 'function') {
                    try {
                      input.showPicker();
                    } catch {
                      input.focus();
                    }
                  } else if (input) {
                    input.focus();
                  }
                }}
              >
                <Calendar size={14} className="calendar-icon" />
                <span
                  className="match-label-input"
                  style={{
                    cursor: isAdmin ? 'pointer' : 'default',
                    zIndex: 1,
                    pointerEvents: 'none',
                    paddingRight: '2px',
                  }}
                >
                  {matchLabel.split(' - ')[0] || 'Seleziona data...'}
                </span>
                <input
                  type="date"
                  disabled={!isAdmin}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: isAdmin ? 'pointer' : 'default',
                    zIndex: 2,
                    pointerEvents: isAdmin ? 'auto' : 'none',
                  }}
                  onChange={e => {
                    if (!e.target.value) return;
                    const date = new Date(e.target.value);
                    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
                    const months = [
                      'Gennaio',
                      'Febbraio',
                      'Marzo',
                      'Aprile',
                      'Maggio',
                      'Giugno',
                      'Luglio',
                      'Agosto',
                      'Settembre',
                      'Ottobre',
                      'Novembre',
                      'Dicembre',
                    ];

                    const dayName = days[date.getDay()];
                    const dayNum = String(date.getDate()).padStart(2, '0');
                    const monthName = months[date.getMonth()];

                    const currentHour = matchLabel.match(/Ore (\d+)/)?.[1] || '21';

                    const formatted = `${dayName} ${dayNum} ${monthName} - Ore ${currentHour}`;
                    setMatchLabel(formatted);
                    saveSettings(formatted);
                  }}
                />
              </div>

              <span
                className="match-label-input"
                style={{ fontSize: '0.85rem', width: 'auto', display: 'inline', padding: '0 2px' }}
              >
                - Ore
              </span>

              <select
                value={matchLabel.match(/Ore (\d+)/)?.[1] || '21'}
                disabled={!isAdmin}
                onChange={e => {
                  if (!isAdmin) return;
                  const newHour = e.target.value;
                  let newLabel = matchLabel;
                  if (newLabel.includes('- Ore')) {
                    newLabel = newLabel.replace(/- Ore \d+(:\d+)?/, `- Ore ${newHour}`);
                  } else {
                    newLabel = `${newLabel} - Ore ${newHour}`;
                  }
                  setMatchLabel(newLabel);
                  saveSettings(newLabel);
                }}
                className="match-label-input"
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  cursor: isAdmin ? 'pointer' : 'default',
                  fontSize: '0.85rem',
                  padding: '0',
                  display: 'inline',
                  width: 'auto',
                  appearance: isAdmin ? undefined : 'none',
                  WebkitAppearance: isAdmin ? undefined : 'none',
                  pointerEvents: isAdmin ? 'auto' : 'none',
                }}
              >
                {[17, 18, 19, 20, 21, 22, 23].map(h => (
                  <option key={h} value={h} style={{ color: 'black' }}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {session ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(255,255,255,0.1)',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '20px',
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#4285F4',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                  }}
                >
                  {session.user?.email?.[0].toUpperCase()}
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#cfe8d8',
                    maxWidth: '80px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {session.user?.name || session.user?.email}
                </span>
                <button
                  onClick={() => signOut()}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#e57373',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    padding: 0,
                    fontWeight: 600,
                  }}
                >
                  Esci
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                style={{
                  background: '#4285F4',
                  color: 'white',
                  border: 'none',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
                Accedi
              </button>
            )}
            <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <nav
        style={{
          display: 'flex',
          gap: '0.8rem',
          overflowX: 'auto',
          padding: '1rem 0',
          marginBottom: '1rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {[
          { id: 'giocatori', label: '👥 Giocatori' },
          { id: 'cluster', label: '⚡ Cluster' },
          { id: 'archivio', label: '🏆 Partite' },
          { id: 'classifica', label: '🏅 Classifica' },
          { id: 'mvp', label: '⭐ MVP' },
          { id: 'media', label: '🎥 Media' },
          { id: 'stats', label: '📊 Stats' },
          { id: 'awards', label: '🎖️ Awards', url: '/awards' },
        ].map(item => (
          <a
            key={item.id}
            href={item.url || `#${item.id}`}
            style={{
              color: '#cfe8d8',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              fontSize: '0.85rem',
              fontWeight: 600,
              padding: '0.4rem 0.8rem',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </>
  );
};

export default HeaderBanner;
