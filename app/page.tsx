'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";
import { Sun, Moon, RotateCcw, Copy, Plus, X, Pencil, Trophy, ChevronDown, Calendar, ArrowLeftRight, Trash2, Medal, Download, Video, BarChart2, MessageCircle, Info, Edit, Upload, LayoutGrid, Check, Sliders } from 'lucide-react';
import BulkMediaModal from '@/components/BulkMediaModal';
import EditMediaModal from '@/components/EditMediaModal';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

// --- Types ---
interface Player {
  Nome: string;
  Ruolo?: string;
  RuoloSecondario?: string;
  velocita?: number;
  accelerazione?: number;
  tecnica?: number;
  contrasto?: number;
  passaggi?: number;
  finalizzazione?: number;
  resistenza?: number;
  dribbling?: number;
  rissa?: number;
  altezza?: number;
  peso?: number;
  piede?: string;
  origine_punteggi?: string;
  Skill?: string;
  Score?: number;
  figurina?: string;
  tuffo?: number;
  presa?: number;
  riflessi?: number;
  piazzamento?: number;
  uscite?: number;
  reattivita?: number;
  rinvio?: number;
}

interface Cluster {
  id: number;
  name: string;
  members: string[];
}

interface Results {
  teamA: string[];
  teamB: string[];
}

interface MatchResult {
  id: number;
  data: string;
  ora: string;
  team_a_name: string;
  team_b_name: string;
  risultato: string | null;
  marcatori_a: string | null;
  marcatori_b: string | null;
  team_a_players: string[];
  team_b_players: string[];
  Stadium: string | null;
  voti_giocatori?: Record<string, number | 's.v.'>;
  mvps?: string[];
  maglia_chiara?: string;
}

export interface PredictionSettings {
  mode: 'all' | 'tracks' | 'strict' | 'custom';
  customMatrix?: {
    5?: number[];
    6?: number[];
    7?: number[];
    8?: number[];
  };
}

export const defaultPredictionSettings: PredictionSettings = {
  mode: 'all',
  customMatrix: {
    5: [5, 6, 7, 8],
    6: [5, 6, 7, 8],
    7: [5, 6, 7, 8],
    8: [5, 6, 7, 8]
  }
};

export const getMatchFormatSize = (m: { team_a_players?: string[]; team_b_players?: string[] }): number => {
  const lenA = m.team_a_players?.length || 0;
  const lenB = m.team_b_players?.length || 0;
  const size = Math.max(lenA, lenB) || 5;
  return (size >= 5 && size <= 8) ? size : 5;
};

export const isMatchAllowedForPrediction = (
  pastMatch: { team_a_players?: string[]; team_b_players?: string[] },
  targetFormat: number,
  settings: PredictionSettings
): boolean => {
  const pastSize = getMatchFormatSize(pastMatch);
  if (!settings || settings.mode === 'all') return true;
  if (settings.mode === 'tracks') {
    return (targetFormat >= 7) === (pastSize >= 7);
  }
  if (settings.mode === 'strict') {
    return pastSize === targetFormat;
  }
  if (settings.mode === 'custom') {
    const allowed = settings.customMatrix?.[targetFormat as 5 | 6 | 7 | 8];
    if (Array.isArray(allowed)) {
      return allowed.includes(pastSize);
    }
    return true;
  }
  return true;
};

interface MediaItem {
  id: number;
  partita_id: number;
  giocatore: string | null;
  co_giocatore: string | null;
  tipologia: string;
  youtube_id: string;
  created_at: string;
}

// --- Custom Components ---
interface CustomDropdownProps {
  value: string;
  options: Player[];
  onChange: (name: string) => void;
  placeholder: string;
  loading: boolean;
  index: number;
}

function CustomDropdown({ value, options, onChange, placeholder, loading, index }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter(opt => opt.Nome.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="custom-dropdown" ref={dropdownRef}>
      <div 
        className={`dropdown-trigger ${isOpen ? 'open' : ''} ${loading ? 'loading' : ''}`}
        onClick={() => !loading && setIsOpen(!isOpen)}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsOpen(!isOpen)}
      >
        <span className="player-number">{index + 1}</span>
        <span className={`selected-value ${!value ? 'placeholder' : ''}`}>
          {value || placeholder}
        </span>
        <ChevronDown size={18} className={`chevron ${isOpen ? 'rotated' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="dropdown-panel">
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, background: 'var(--color-surface-2)', zIndex: 2 }}>
             <input
               type="text"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               placeholder="Cerca giocatore..."
               style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', fontSize: '0.85rem' }}
               autoFocus
               onClick={(e) => e.stopPropagation()}
             />
          </div>
          <div className="dropdown-options">
            <div 
              className="dropdown-option"
              style={{ fontWeight: 'bold', color: '#ffeb3b', borderBottom: '1px solid rgba(255,255,255,0.1)' }}
              onClick={() => {
                const guestName = window.prompt("Inserisci il nome dell'ospite (es. Amico Riccardo):");
                if (guestName && guestName.trim()) {
                  onChange(guestName.trim());
                  setIsOpen(false);
                }
              }}
            >
              + Aggiungi Ospite
            </div>
            {filteredOptions.map((opt) => (
              <div 
                key={opt.Nome}
                className={`dropdown-option ${opt.Nome === value ? 'selected' : ''}`}
                onClick={() => { onChange(opt.Nome); setIsOpen(false); }}
              >
                {opt.Nome}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className="dropdown-no-options">Nessun giocatore trovato (a parte Ospite)</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Generic Searchable Dropdown ---
interface SearchableDropdownProps {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  placeholder: string;
}

function SearchableDropdown({ value, options, onChange, placeholder }: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));
  const selectedLabel = options.find(o => o.value === value)?.label || '';

  return (
    <div className="custom-dropdown" style={{ flex: 1, minWidth: '150px' }} ref={dropdownRef}>
      <div 
        className={`dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
      >
        <span className={`selected-value ${!value ? 'placeholder' : ''}`}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown size={18} className={`chevron ${isOpen ? 'rotated' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="dropdown-panel" style={{ zIndex: 1000, position: 'absolute', width: '100%' }}>
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, background: 'var(--color-surface-2)', zIndex: 2 }}>
             <input
               type="text"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               placeholder="Cerca..."
               style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', fontSize: '0.85rem' }}
               autoFocus
               onClick={(e) => e.stopPropagation()}
             />
          </div>
          <div className="dropdown-options" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <div 
              className={`dropdown-option ${value === '' ? 'selected' : ''}`}
              onClick={() => { onChange(''); setIsOpen(false); }}
            >
              {placeholder}
            </div>
            {filteredOptions.map((opt) => (
              <div 
                key={opt.value}
                className={`dropdown-option ${opt.value === value ? 'selected' : ''}`}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
              >
                {opt.label}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className="dropdown-no-options">Nessun risultato</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Multi-Select Searchable Dropdown ---
interface MultiSelectDropdownProps {
  selectedValues: string[];
  options: { label: string; value: string }[];
  onChange: (values: string[]) => void;
  placeholder: string;
  hasAllOption?: boolean;
}

function MultiSelectDropdown({ selectedValues, options, onChange, placeholder, hasAllOption = false }: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const displayText = selectedValues.length === 0 
    ? (hasAllOption ? 'Tutti i Giocatori' : placeholder) 
    : selectedValues.length === 1 
      ? selectedValues[0] 
      : `${selectedValues.length} Selezionati`;

  return (
    <div className="custom-dropdown" style={{ flex: 1, minWidth: '200px' }} ref={dropdownRef}>
      <div 
        className={`dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
      >
        <span className="selected-value">
          {displayText}
        </span>
        <ChevronDown size={18} className={`chevron ${isOpen ? 'rotated' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="dropdown-panel" style={{ zIndex: 1000, position: 'absolute', width: '100%' }}>
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, background: 'var(--color-surface-2)', zIndex: 2 }}>
             <input
               type="text"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               placeholder="Cerca..."
               style={{ width: '100%', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', fontSize: '0.85rem' }}
               autoFocus
               onClick={(e) => e.stopPropagation()}
             />
          </div>
          <div className="dropdown-options" style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {hasAllOption && (
              <div 
                className={`dropdown-option ${selectedValues.length === 0 ? 'selected' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onChange([]);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <input type="checkbox" checked={selectedValues.length === 0} readOnly style={{ pointerEvents: 'none' }} />
                Tutti (Predefinito)
              </div>
            )}
            {filteredOptions.map((opt) => {
              const isSelected = hasAllOption && selectedValues.length === 0 ? true : selectedValues.includes(opt.value);
              return (
                <div 
                  key={opt.value}
                  className={`dropdown-option ${isSelected ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasAllOption && selectedValues.length === 0) {
                      const remaining = options.map(o => o.value).filter(v => v !== opt.value);
                      onChange(remaining);
                    } else if (selectedValues.includes(opt.value)) {
                      onChange(selectedValues.filter(v => v !== opt.value));
                    } else {
                      const next = [...selectedValues, opt.value];
                      if (hasAllOption && next.length === options.length) {
                        onChange([]);
                      } else {
                        onChange(next);
                      }
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <input type="checkbox" checked={isSelected} readOnly style={{ pointerEvents: 'none' }} />
                  {opt.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// --- PES Morale Component (Arrows & Energy) ---
const PesMorale = ({ condition }: { condition: 'excellent' | 'good' | 'normal' | 'poor' | 'terrible' | 'neutral' }) => {
  const getProps = () => {
    switch (condition) {
      case 'excellent': return { color: '#ff5252', rotation: -90, energy: 100 }; // Red Up
      case 'good': return { color: '#ffb74d', rotation: -45, energy: 100 };      // Orange Diagonal
      case 'normal': return { color: '#69f0ae', rotation: 0, energy: 100 };      // Green Right
      case 'poor': return { color: '#4dd0e1', rotation: 45, energy: 60 };        // Blue Diagonal Down
      case 'terrible': return { color: '#29b6f6', rotation: 90, energy: 40 };    // Blue Down
      case 'neutral': return { color: '#69f0ae', rotation: 0, energy: 100 };     // Green Right
    }
  };

  const { color, rotation, energy } = getProps();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {/* Energy Bar */}
      <div style={{ 
        width: '36px', 
        height: '14px', 
        background: '#0a1922', 
        border: '1px solid #3a4a5a',
        padding: '1px',
        display: 'flex'
      }}>
        <div style={{
          width: `${energy}%`,
          height: '100%',
          background: 'linear-gradient(to right, #00e676, #ffffff)'
        }} />
      </div>

      {/* Arrow Box */}
      <div style={{
        width: '16px',
        height: '16px',
        background: '#1a2a3a',
        border: '1px solid #3a4a5a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '2px'
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" style={{ transform: `rotate(${rotation}deg)` }}>
          <path d="M 2 10 L 13 10 L 13 4 L 22 12 L 13 20 L 13 14 L 2 14 Z" fill={color} />
        </svg>
      </div>
    </div>
  );
};

const getPlayerStats = (player: Player | undefined, fallbackName: string) => {
    const isGk = player?.Ruolo === 'Portiere';
    if (!player && !fallbackName) {
      return { 
        isGk: false,
        velocita: 50, accelerazione: 50, tecnica: 50, contrasto: 50, passaggi: 50, finalizzazione: 50, resistenza: 50, dribbling: 50, rissa: 50, altezza: 180, peso: 75, piede: 'Destro',
        tuffo: 50, presa: 50, riflessi: 50, piazzamento: 50, uscite: 50, reattivita: 50, rinvio: 50
      };
    }
    
    let hash = 0;
    const name = player?.Nome || fallbackName;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const seed = Math.abs(hash);
    const rnd = (min: number, max: number, offset: number) => Math.floor(min + ((seed + offset) % (max - min + 1)));

    if (isGk) {
        if (player?.origine_punteggi === 'MANUALE') {
            return {
                isGk: true,
                tuffo: player.tuffo ?? 0,
                presa: player.presa ?? 0,
                riflessi: player.riflessi ?? 0,
                piazzamento: player.piazzamento ?? 0,
                uscite: player.uscite ?? 0,
                reattivita: player.reattivita ?? 0,
                rinvio: player.rinvio ?? 0,
                resistenza: player.resistenza ?? 0,
                rissa: player.rissa ?? 0,
                altezza: player.altezza ?? 0,
                peso: player.peso ?? 0,
                piede: player.piede ?? 'ND',
                velocita: player.tuffo ?? 0,
                accelerazione: player.presa ?? 0,
                tecnica: player.riflessi ?? 0,
                contrasto: player.piazzamento ?? 0,
                passaggi: player.uscite ?? 0,
                finalizzazione: player.rinvio ?? 0,
                dribbling: player.reattivita ?? 0
            };
        }

        if (player?.origine_punteggi?.toUpperCase() === 'PARZIALE') {
            return {
                isGk: true,
                tuffo: player.tuffo ?? rnd(65, 95, 1),
                presa: player.presa ?? rnd(65, 95, 2),
                riflessi: player.riflessi ?? rnd(65, 95, 3),
                piazzamento: player.piazzamento ?? rnd(65, 95, 4),
                uscite: player.uscite ?? rnd(60, 95, 5),
                reattivita: player.reattivita ?? rnd(65, 95, 6),
                rinvio: player.rinvio ?? rnd(60, 95, 7),
                resistenza: player.resistenza ?? rnd(60, 99, 9),
                rissa: player.rissa ?? rnd(30, 100, 11),
                altezza: player.altezza ?? rnd(175, 198, 8),
                peso: player.peso ?? rnd(70, 95, 12),
                piede: player.piede ?? (seed % 2 === 0 ? 'Destro' : 'Sinistro'),
                velocita: player.tuffo ?? rnd(65, 95, 1),
                accelerazione: player.presa ?? rnd(65, 95, 2),
                tecnica: player.riflessi ?? rnd(65, 95, 3),
                contrasto: player.piazzamento ?? rnd(65, 95, 4),
                passaggi: player.uscite ?? rnd(60, 95, 5),
                finalizzazione: player.rinvio ?? rnd(60, 95, 7),
                dribbling: player.reattivita ?? rnd(65, 95, 6)
            };
        }

        return {
            isGk: true,
            tuffo: rnd(65, 95, 1),
            presa: rnd(65, 95, 2),
            riflessi: rnd(65, 95, 3),
            piazzamento: rnd(65, 95, 4),
            uscite: rnd(60, 95, 5),
            reattivita: rnd(65, 95, 6),
            rinvio: rnd(60, 95, 7),
            resistenza: rnd(60, 99, 9),
            rissa: rnd(30, 100, 11),
            altezza: rnd(175, 198, 8),
            peso: rnd(70, 95, 12),
            piede: seed % 2 === 0 ? 'Destro' : 'Sinistro',
            velocita: rnd(65, 95, 1),
            accelerazione: rnd(65, 95, 2),
            tecnica: rnd(65, 95, 3),
            contrasto: rnd(65, 95, 4),
            passaggi: rnd(60, 95, 5),
            finalizzazione: rnd(60, 95, 7),
            dribbling: rnd(65, 95, 6)
        };
    }

    // Se c'è la dicitura MANUALE, prende i valori direttamente dal DB (anche se sono vuoti)
    if (player?.origine_punteggi === 'MANUALE') {
        return {
            isGk: false,
            velocita: player.velocita ?? 0,
            accelerazione: player.accelerazione ?? 0,
            tecnica: player.tecnica ?? 0,
            contrasto: player.contrasto ?? 0,
            passaggi: player.passaggi ?? 0,
            finalizzazione: player.finalizzazione ?? 0,
            resistenza: player.resistenza ?? 0,
            dribbling: player.dribbling ?? 0,
            rissa: player.rissa ?? 0,
            altezza: player.altezza ?? 0,
            peso: player.peso ?? 0,
            piede: player.piede ?? 'ND',
            tuffo: 0, presa: 0, riflessi: 0, piazzamento: 0, uscite: 0, reattivita: 0, rinvio: 0
        };
    }

    // Se c'è la dicitura PARZIALE, prende i valori dal DB se presenti, altrimenti li genera casualmente
    if (player?.origine_punteggi?.toUpperCase() === 'PARZIALE') {
        return {
            isGk: false,
            velocita: player.velocita ?? rnd(65, 95, 1),
            accelerazione: player.accelerazione ?? rnd(65, 95, 2),
            tecnica: player.tecnica ?? rnd(65, 95, 3),
            contrasto: player.contrasto ?? rnd(50, 95, 4),
            passaggi: player.passaggi ?? rnd(65, 95, 5),
            finalizzazione: player.finalizzazione ?? rnd(55, 95, 6),
            resistenza: player.resistenza ?? rnd(60, 99, 9),
            dribbling: player.dribbling ?? rnd(65, 95, 10),
            rissa: player.rissa ?? rnd(30, 100, 11),
            altezza: player.altezza ?? rnd(165, 195, 7),
            peso: player.peso ?? rnd(60, 90, 8),
            piede: player.piede ?? (seed % 2 === 0 ? 'Destro' : 'Sinistro'),
            tuffo: rnd(50, 70, 1), presa: rnd(50, 70, 2), riflessi: rnd(50, 70, 3), piazzamento: rnd(50, 70, 4), uscite: rnd(50, 70, 5), reattivita: rnd(50, 70, 6), rinvio: rnd(50, 70, 7)
        };
    }
    
    return {
        isGk: false,
        velocita: rnd(65, 95, 1),
        accelerazione: rnd(65, 95, 2),
        tecnica: rnd(65, 95, 3),
        contrasto: rnd(50, 95, 4),
        passaggi: rnd(65, 95, 5),
        finalizzazione: rnd(55, 95, 6),
        resistenza: rnd(60, 99, 9),
        dribbling: rnd(65, 95, 10),
        rissa: rnd(30, 100, 11),
        altezza: rnd(165, 195, 7),
        peso: rnd(60, 90, 8),
        piede: seed % 2 === 0 ? 'Destro' : 'Sinistro',
        tuffo: rnd(50, 70, 1), presa: rnd(50, 70, 2), riflessi: rnd(50, 70, 3), piazzamento: rnd(50, 70, 4), uscite: rnd(50, 70, 5), reattivita: rnd(50, 70, 6), rinvio: rnd(50, 70, 7)
    };
};

const getRoleAbbreviation = (ruolo: string | undefined) => {
    if (!ruolo) return '';
    const r = ruolo.toUpperCase();
    if (r.includes('PORTIERE')) return 'GK';
    if (r.includes('TERZINO DESTRO') || r.includes('TERZINO D')) return 'RB';
    if (r.includes('TERZINO SINISTRO') || r.includes('TERZINO S')) return 'LB';
    if (r.includes('TERZINO')) return 'SB';
    if (r.includes('DIFENSORE')) return 'CB';
    if (r.includes('MEDIANO')) return 'DMF';
    if (r.includes('TREQUARTISTA')) return 'AMF';
    if (r.includes('ESTERNO')) return 'SMF';
    if (r.includes('ALA')) return 'WF';
    if (r.includes('CENTROCAMPISTA CENTRALE') || r === 'CC') return 'CMF';
    if (r.includes('CENTROCAMPISTA')) return 'CMF';
    if (r.includes('SECONDA PUNTA')) return 'SS';
    if (r.includes('PUNTA') || r.includes('ATTACCANTE')) return 'CF';
    return r.substring(0, 3).trim().toUpperCase();
};

export const getPitchPositionsForTeam = (
  teamSize: number, 
  modulo7?: string, 
  modulo8?: string
): { top: string; left: string; role: string }[] => {
  if (teamSize === 5) {
    return [
      { top: '87%', left: '50%', role: 'POR' },
      { top: '65%', left: '50%', role: 'DIF' },
      { top: '42%', left: '20%', role: 'LAT' },
      { top: '42%', left: '80%', role: 'LAT' },
      { top: '15%', left: '50%', role: 'ATT' }
    ];
  } else if (teamSize === 6) {
    return [
      { top: '87%', left: '50%', role: 'POR' },
      { top: '65%', left: '30%', role: 'DIF' },
      { top: '65%', left: '70%', role: 'DIF' },
      { top: '42%', left: '20%', role: 'LAT' },
      { top: '42%', left: '80%', role: 'LAT' },
      { top: '15%', left: '50%', role: 'ATT' }
    ];
  } else if (teamSize === 7) {
    if (modulo7 === '3-2-1') {
      return [
        { top: '87%', left: '50%', role: 'POR' },
        { top: '66%', left: '20%', role: 'TS' },
        { top: '68%', left: '50%', role: 'DC' },
        { top: '66%', left: '80%', role: 'TD' },
        { top: '42%', left: '35%', role: 'CC' },
        { top: '42%', left: '65%', role: 'CC' },
        { top: '15%', left: '50%', role: 'ATT' }
      ];
    } else if (modulo7 === '2-2-2') {
      return [
        { top: '87%', left: '50%', role: 'POR' },
        { top: '66%', left: '32%', role: 'DC' },
        { top: '66%', left: '68%', role: 'DC' },
        { top: '42%', left: '34%', role: 'CC' },
        { top: '42%', left: '66%', role: 'CC' },
        { top: '15%', left: '34%', role: 'ATT' },
        { top: '15%', left: '66%', role: 'ATT' }
      ];
    } else if (modulo7 === '3-1-2') {
      return [
        { top: '87%', left: '50%', role: 'POR' },
        { top: '66%', left: '20%', role: 'TS' },
        { top: '68%', left: '50%', role: 'DC' },
        { top: '66%', left: '80%', role: 'TD' },
        { top: '43%', left: '50%', role: 'MED' },
        { top: '15%', left: '34%', role: 'ATT' },
        { top: '15%', left: '66%', role: 'ATT' }
      ];
    } else {
      return [
        { top: '87%', left: '50%', role: 'POR' },
        { top: '66%', left: '32%', role: 'DC' },
        { top: '66%', left: '68%', role: 'DC' },
        { top: '42%', left: '18%', role: 'ES' },
        { top: '44%', left: '50%', role: 'CC' },
        { top: '42%', left: '82%', role: 'ED' },
        { top: '15%', left: '50%', role: 'ATT' }
      ];
    }
  } else if (teamSize === 8) {
    if (modulo8 === '2-3-2') {
      return [
        { top: '87%', left: '50%', role: 'POR' },
        { top: '67%', left: '32%', role: 'DC' },
        { top: '67%', left: '68%', role: 'DC' },
        { top: '43%', left: '18%', role: 'ES' },
        { top: '45%', left: '50%', role: 'CC' },
        { top: '43%', left: '82%', role: 'ED' },
        { top: '15%', left: '34%', role: 'ATT' },
        { top: '15%', left: '66%', role: 'ATT' }
      ];
    } else if (modulo8 === '3-2-2') {
      return [
        { top: '87%', left: '50%', role: 'POR' },
        { top: '66%', left: '20%', role: 'TS' },
        { top: '68%', left: '50%', role: 'DC' },
        { top: '66%', left: '80%', role: 'TD' },
        { top: '43%', left: '34%', role: 'CC' },
        { top: '43%', left: '66%', role: 'CC' },
        { top: '15%', left: '34%', role: 'ATT' },
        { top: '15%', left: '66%', role: 'ATT' }
      ];
    } else if (modulo8 === '2-4-1') {
      return [
        { top: '87%', left: '50%', role: 'POR' },
        { top: '68%', left: '32%', role: 'DC' },
        { top: '68%', left: '68%', role: 'DC' },
        { top: '43%', left: '15%', role: 'CLS' },
        { top: '46%', left: '38%', role: 'MED' },
        { top: '46%', left: '62%', role: 'MED' },
        { top: '43%', left: '85%', role: 'CLD' },
        { top: '15%', left: '50%', role: 'ATT' }
      ];
    } else {
      return [
        { top: '87%', left: '50%', role: 'POR' },
        { top: '66%', left: '20%', role: 'TS' },
        { top: '68%', left: '50%', role: 'DC' },
        { top: '66%', left: '80%', role: 'TD' },
        { top: '42%', left: '18%', role: 'ES' },
        { top: '44%', left: '50%', role: 'CC' },
        { top: '42%', left: '82%', role: 'ED' },
        { top: '15%', left: '50%', role: 'ATT' }
      ];
    }
  }
  return [];
};

export const parseScorersString = (scorersInput: any): Record<string, number> => {
  if (!scorersInput) return {};
  let scorersStr = '';
  if (Array.isArray(scorersInput)) {
    scorersStr = scorersInput.join(', ');
  } else if (typeof scorersInput === 'string') {
    scorersStr = scorersInput;
  } else {
    return {};
  }

  const map: Record<string, number> = {};
  scorersStr.split(/,\s*(?![^()]*\))/).forEach((s: string) => {
    const trimmed = s.trim();
    if (!trimmed) return;
    const match = trimmed.match(/^(.*?)(?:\s*\(([^)]+)\))?$/);
    if (match) {
      const name = match[1].trim();
      let count = 1;
      const content = match[2];
      if (content) {
        if (content.includes("'")) {
          count = content.split(/,|(?:' e )|(?:' )/).filter(k => k.trim() !== '').length;
        } else {
          count = parseInt(content, 10) || 1;
        }
      }
      map[name] = (map[name] || 0) + count;
    }
  });
  return map;
};

export default function Home() {
  const [dbPlayers, setDbPlayers] = useState<Player[]>([]);

  // Helper: Riconoscimento Portiere (Ruolo preferito, secondario o tag nel nome tipo (P))
  const isGoalkeeper = (playerName: string, customDbPlayers?: Player[]): boolean => {
    if (!playerName) return false;
    const n = playerName.trim().toLowerCase();
    if (n.startsWith('(p)') || n.startsWith('(por)') || n.includes('(portiere)') || n.includes('portiere') || n.endsWith('(p)') || n.endsWith('(por)')) {
      return true;
    }
    const list = customDbPlayers || dbPlayers;
    const dbP = list.find(p => p.Nome?.toLowerCase().trim() === n || p.Nome === playerName);
    if (dbP) {
      const r1 = (dbP.Ruolo || '').toLowerCase().trim();
      const r2 = (dbP.RuoloSecondario || '').toLowerCase().trim();
      if (r1.includes('portier') || r1 === 'gk' || r1 === 'por') return true;
      if (r2.includes('portier') || r2 === 'gk' || r2 === 'por') return true;
    }
    return false;
  };

  // Helper: Posiziona il portiere in porta (indice 0 / POR) e ordina i ruoli sul campo: Difensori -> Centrocampisti -> Attaccanti
  const finalizeTeamLineup = (team: string[], customDbPlayers?: Player[]): string[] => {
    if (!team || team.length === 0) return team;
    const copy = [...team];
    const list = customDbPlayers || dbPlayers;

    const gkIdx = copy.findIndex(p => isGoalkeeper(p, list));
    let gk: string | null = null;
    if (gkIdx !== -1) {
      [gk] = copy.splice(gkIdx, 1);
    }

    const getMacroRole = (pName: string): number => {
      const dbP = list.find(x => x.Nome?.toLowerCase().trim() === pName.toLowerCase().trim() || x.Nome === pName);
      const r = (dbP?.Ruolo || '').toLowerCase();
      const rSec = (dbP?.RuoloSecondario || '').toLowerCase();
      const comb = `${r} ${rSec}`;
      if (comb.includes('difensor') || comb.includes('terzino') || comb.includes('cb') || comb.includes('rb') || comb.includes('lb')) return 1;
      if (comb.includes('attaccant') || comb.includes('punta') || comb.includes('cf') || comb.includes('ss')) return 3;
      return 2;
    };

    copy.sort((a, b) => getMacroRole(a) - getMacroRole(b));

    if (gk) {
      return [gk, ...copy];
    }
    return copy;
  };

  // Helper: Assicura che se è presente un portiere nella squadra, sia posizionato all'indice 0 (POR)
  const ensureGoalkeeperInGoal = (team: string[], customDbPlayers?: Player[]): string[] => {
    if (!team || team.length === 0) return team;
    const list = customDbPlayers || dbPlayers;
    if (isGoalkeeper(team[0], list)) return team;
    const gkIdx = team.findIndex(p => isGoalkeeper(p, list));
    if (gkIdx > 0) {
      const copy = [...team];
      const [gk] = copy.splice(gkIdx, 1);
      copy.unshift(gk);
      return copy;
    }
    return team;
  };
  const [dbCampi, setDbCampi] = useState<{id: number, nome: string, posizione_url: string | null}[]>([]);
  const [matchFormat, setMatchFormat] = useState<number>(5);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(Array(10).fill(''));
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isClustersExpanded, setIsClustersExpanded] = useState(false);
  const [algoModalOpen, setAlgoModalOpen] = useState(false);
  const [algoTab, setAlgoTab] = useState<'pesi' | 'parametri'>('pesi');
  const [algoSettings, setAlgoSettings] = useState({
    wVoto: 40,
    wWinRate: 30,
    wGolRatio: 30,
    wMvp: 15,
    balanceRoles: true
  });
  const [ovrModifiers, setOvrModifiers] = useState<Record<string, number>>({});
  const [results, setResults] = useState<Results | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [teamAName, setTeamAName] = useState('Falchi 🦅');
  const [teamBName, setTeamBName] = useState('Aquile 🦆');
  const [matchLabel, setMatchLabel] = useState('Venerdì 19 giugno - Ore 21');
  const [headerImage, setHeaderImage] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mergeTargetName, setMergeTargetName] = useState<string>('');
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlayerOldName, setEditingPlayerOldName] = useState('');
  const [editingPlayerName, setEditingPlayerName] = useState('');
  const [editingPlayerStats, setEditingPlayerStats] = useState<Partial<Player>>({});
  const [editingPlayerImage, setEditingPlayerImage] = useState<File | null>(null);
  const [newPlayerStats, setNewPlayerStats] = useState<Partial<Player>>({});
  const [newPlayerImage, setNewPlayerImage] = useState<File | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAddCampoModalOpen, setIsAddCampoModalOpen] = useState(false);
  const [campoModalMode, setCampoModalMode] = useState<'add'|'manage'>('add');
  const [selectedCampoIdToManage, setSelectedCampoIdToManage] = useState<number | null>(null);
  const [newCampoName, setNewCampoName] = useState('');
  const [newCampoUrl, setNewCampoUrl] = useState('');
  const [campoPassword, setCampoPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedToDelete, setSelectedToDelete] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);
  const [editingStadiumId, setEditingStadiumId] = useState<number | null>(null);
  const [stadiumInput, setStadiumInput] = useState('');
  const [userOverrideMaglia, setUserOverrideMaglia] = useState<'A'|'B'|null>(null);
  const [selectedPlayerForCard, setSelectedPlayerForCard] = useState<string | null>(null);
  
  // Swap state
  const [activeSwapSource, setActiveSwapSource] = useState<{name: string, team: 'teamA' | 'teamB'} | null>(null);
  const [selectedRolePlayer, setSelectedRolePlayer] = useState<{
    name: string;
    team: 'teamA' | 'teamB';
    index: number;
    role: string;
  } | null>(null);

  // Moduli tattici per 7vs7 e 8vs8
  const [modulo8TeamA, setModulo8TeamA] = useState<'3-3-1' | '2-3-2' | '3-2-2' | '2-4-1'>('3-3-1');
  const [modulo8TeamB, setModulo8TeamB] = useState<'3-3-1' | '2-3-2' | '3-2-2' | '2-4-1'>('3-3-1');
  const [modulo7TeamA, setModulo7TeamA] = useState<'2-3-1' | '3-2-1' | '2-2-2' | '3-1-2'>('2-3-1');
  const [modulo7TeamB, setModulo7TeamB] = useState<'2-3-1' | '3-2-1' | '2-2-2' | '3-1-2'>('2-3-1');
  const [isModuloModalOpen, setIsModuloModalOpen] = useState(false);
  const [moduloModalTargetTeam, setModuloModalTargetTeam] = useState<'both' | 'A' | 'B'>('both');

  // Gestione Previsione e Storico
  const [predictionSettings, setPredictionSettings] = useState<PredictionSettings>(defaultPredictionSettings);
  const [isPredictionModalOpen, setIsPredictionModalOpen] = useState(false);
  const [tempPredictionSettings, setTempPredictionSettings] = useState<PredictionSettings>(defaultPredictionSettings);

  // Update Result state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [updatingMatchId, setUpdatingMatchId] = useState<number | null>(null);
  const [updateScoreA, setUpdateScoreA] = useState('');
  const [updateScoreB, setUpdateScoreB] = useState('');
  const [updateScorersA, setUpdateScorersA] = useState<Record<string, number>>({});
  const [updateScorersB, setUpdateScorersB] = useState<Record<string, number>>({});
  const [goalMode, setGoalMode] = useState<Record<string, 'G' | 'AG'>>({});
  const [updateVoti, setUpdateVoti] = useState<Record<string, number | 's.v.'>>({});
  const [updateMVPs, setUpdateMVPs] = useState<string[]>([]);
  const [touchedVoti, setTouchedVoti] = useState<Set<string>>(new Set());
  const [updatePassword, setUpdatePassword] = useState('');
  
  // Media Archive state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isMediaArchiveOpen, setIsMediaArchiveOpen] = useState(true);
  const [mediaFilterPartita, setMediaFilterPartita] = useState<string>('');
  const [mediaFilterGiocatore, setMediaFilterGiocatore] = useState<string>('');
  const [mediaFilterTipologia, setMediaFilterTipologia] = useState<string>('');
  
  // Add Media modal state
  const [isAddMediaModalOpen, setIsAddMediaModalOpen] = useState(false);
  const [newMediaYoutubeUrl, setNewMediaYoutubeUrl] = useState('');
  const [newMediaAutori, setNewMediaAutori] = useState<string[]>([]);
  const [newMediaCoAutori, setNewMediaCoAutori] = useState<string[]>([]);
  const [newMediaTipologia, setNewMediaTipologia] = useState('');
  const [newMediaPassword, setNewMediaPassword] = useState('');
  const [isSavingMedia, setIsSavingMedia] = useState(false);
  const [isBulkMediaModalOpen, setIsBulkMediaModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  
  // Stats state
  const [statsSelectedPlayers, setStatsSelectedPlayers] = useState<string[]>([]);
  const [hiddenTrendPlayers, setHiddenTrendPlayers] = useState<string[]>([]);
  const [showSynergyA, setShowSynergyA] = useState(false);
  const [showSynergyB, setShowSynergyB] = useState(false);

  const toggleTrendPlayer = (playerName: string) => {
    setHiddenTrendPlayers(prev => 
      prev.includes(playerName) 
        ? prev.filter(p => p !== playerName) 
        : [...prev, playerName]
    );
  };

  useEffect(() => {
    if (isUpdateModalOpen && updatingMatchId) {
      const m = matches.find(x => x.id === updatingMatchId);
      if (m) {
        const [sA, sB] = (m.risultato || '0-0').split('-').map(s => s.trim());
        const originalSA = sA || '0';
        const originalSB = sB || '0';
        const isScoreChanged = updateScoreA !== originalSA || updateScoreB !== originalSB;

        if (!m.voti_giocatori || Object.keys(m.voti_giocatori).length === 0 || isScoreChanged || m.risultato === '0-0') {
          const scoreA = parseInt(updateScoreA) || 0;
          const scoreB = parseInt(updateScoreB) || 0;
          let defA = 6, defB = 6;
          if (scoreA > scoreB) { defA = 7; defB = 5; }
          else if (scoreB > scoreA) { defA = 5; defB = 7; }
          
          setUpdateVoti(prev => {
            const next = { ...prev };
            m.team_a_players?.forEach((p: string) => {
              if (!touchedVoti.has(p)) next[p] = defA;
            });
            m.team_b_players?.forEach((p: string) => {
              if (!touchedVoti.has(p)) next[p] = defB;
            });
            return next;
          });
        }
      }
    }
  }, [updateScoreA, updateScoreB, isUpdateModalOpen, updatingMatchId, matches, touchedVoti]);

  // Save Formation state
  const [isSaveFormationModalOpen, setIsSaveFormationModalOpen] = useState(false);
  const [saveFormationPassword, setSaveFormationPassword] = useState('');
  const [selectedStadium, setSelectedStadium] = useState('Seidita');

  // Classifica state
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [showGuests, setShowGuests] = useState(false);

  // Archivio Filtri
  const [archiveMonthFilter, setArchiveMonthFilter] = useState('');
  const [archiveYearFilter, setArchiveYearFilter] = useState('');
  const [archivePlayerFilter, setArchivePlayerFilter] = useState('');
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<'month'|'year'|'player'|null>(null);

  // Sfida State
  const [isSfidaModalOpen, setIsSfidaModalOpen] = useState(false);
  const [sfidaDataDa, setSfidaDataDa] = useState('');
  const [sfidaTitolo, setSfidaTitolo] = useState('');
  const [sfidaPlayers, setSfidaPlayers] = useState<string[]>([]);
  const [sfideSalvate, setSfideSalvate] = useState<any[]>([]);
  const [sfidaLeaderboard, setSfidaLeaderboard] = useState<any[]>([]);
  const [sfidaSortConfig, setSfidaSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  
  const sfidaPlayerOptions = useMemo(() => {
    return Array.from(
      new Set(
        matches.flatMap(m => [
          ...(m.team_a_players || []),
          ...(m.team_b_players || []),
        ])
      )
    ).map(p => ({ label: p, value: p })).sort((a,b) => a.label.localeCompare(b.label));
  }, [matches]);

  const requestSfidaSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sfidaSortConfig && sfidaSortConfig.key === key && sfidaSortConfig.direction === 'desc') direction = 'asc';
    setSfidaSortConfig({ key, direction });
  };

  const loadSfide = async () => {
    try {
      const r = await fetch('/api/sfide');
      const d = await r.json();
      if (d.success) setSfideSalvate(d.sfide);
    } catch(e) {}
  };
  
  useEffect(() => { loadSfide(); }, []);

  const computeSfida = () => {
    if (sfidaPlayers.length < 2) return showToast('Seleziona almeno 2 giocatori', 'error');
    let filteredMatches = matches.filter(m => {
      const mDate = new Date(m.data);
      const isInterruptedMatch = mDate.getDate() === 8 && mDate.getMonth() === 6 && mDate.getFullYear() === 2026 && m.ora && m.ora.startsWith('21');
      return !isInterruptedMatch && m.risultato && m.risultato !== '' && m.risultato !== '0-0';
    });
    if (sfidaDataDa) {
      filteredMatches = filteredMatches.filter(m => {
        if (!m.data) return true;
        return new Date(m.data) >= new Date(sfidaDataDa);
      });
    }

    const stats: Record<string, any> = {};
    sfidaPlayers.forEach(p => {
       stats[p] = { nome: p, partite_giocate: 0, vittorie: 0, pareggi: 0, sconfitte: 0, punti_assoluti: 0, gol: 0, mvp_count: 0, somma_voti: 0, partite_voto: 0, pt_partita: 0, media_voto: 0 };
    });

    filteredMatches.forEach(m => {
      const parts = m.risultato?.split('-');
      if (!parts || parts.length < 2) return;
      
      const scorA = parseInt(parts[0], 10);
      const scorB = parseInt(parts[1], 10);
      
      let winA = false, winB = false, draw = false;
      if (scorA > scorB) winA = true;
      else if (scorA < scorB) winB = true;
      else draw = true;

      const vt = typeof m.voti_giocatori === 'string' ? JSON.parse(m.voti_giocatori || '{}') : (m.voti_giocatori || {});

      sfidaPlayers.forEach(p => {
        const isTeamA = m.team_a_players?.includes(p);
        const isTeamB = m.team_b_players?.includes(p);
        if (isTeamA || isTeamB) {
          stats[p].partite_giocate += 1;
          
          if ((isTeamA && winA) || (isTeamB && winB)) { stats[p].vittorie += 1; stats[p].punti_assoluti += 3; }
          else if (draw) { stats[p].pareggi += 1; stats[p].punti_assoluti += 1; }
          else { stats[p].sconfitte += 1; }

          if (vt[p] !== undefined && Number(vt[p]) > 0) {
            stats[p].somma_voti += Number(vt[p]);
            stats[p].partite_voto += 1;
          }

          if (m.mvps && m.mvps.includes(p)) {
             stats[p].mvp_count += 1;
          }
        }
      });

      const addGoals = (scorersInput: any) => {
        const scorersMap = parseScorersString(scorersInput);
        Object.entries(scorersMap).forEach(([name, count]) => {
          if (stats[name]) {
            stats[name].gol += count;
          } else {
            const foundKey = Object.keys(stats).find(k => k.toLowerCase() === name.toLowerCase());
            if (foundKey) {
              stats[foundKey].gol += count;
            }
          }
        });
      };

      addGoals(m.marcatori_a);
      addGoals(m.marcatori_b);
    });

    const res = Object.values(stats).map(d => {
       d.pt_partita = d.partite_giocate > 0 ? parseFloat((d.punti_assoluti / d.partite_giocate).toFixed(2)) : 0;
       d.media_voto = d.partite_voto > 0 ? parseFloat((d.somma_voti / d.partite_voto).toFixed(2)) : 0;
       return d;
    });

    res.sort((a, b) => {
      if (b.punti_assoluti !== a.punti_assoluti) return b.punti_assoluti - a.punti_assoluti;
      if (b.pt_partita !== a.pt_partita) return b.pt_partita - a.pt_partita;
      if (b.media_voto !== a.media_voto) return b.media_voto - a.media_voto;
      if (b.gol !== a.gol) return b.gol - a.gol;
      return a.nome.localeCompare(b.nome);
    });
    setSfidaSortConfig(null);
    setSfidaLeaderboard(res);
  };

  const handleSaveSfida = async () => {
    if (sfidaPlayers.length < 2) return;
    let title = sfidaTitolo.trim();
    if (!title) {
        const p1 = sfidaPlayers[0], p2 = sfidaPlayers[1];
        title = `${p1} vs ${p2}`;
        if (sfidaPlayers.length > 2) title += ` e altri`;
    }
    try {
      const r = await fetch('/api/sfide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titolo: title, giocatori: sfidaPlayers, data_da: sfidaDataDa || null, is_approved: isAdmin })
      });
      if (r.ok) {
        showToast(isAdmin ? 'Sfida salvata!' : 'Sfida in attesa di approvazione degli Admin', 'success');
        loadSfide();
      } else {
        const err = await r.json();
        showToast(err.error || 'Errore durante il salvataggio.', 'error');
      }
    } catch(e: any) {
      showToast(e.message || 'Errore durante il salvataggio!', 'error');
    }
  };

  const approveSfida = async (id: number) => {
    if (!isAdmin) return;
    try {
      const r = await fetch(`/api/sfide?id=${id}`, { method: 'PUT' });
      if (r.ok) loadSfide();
    } catch(e){}
  };

  const deleteSfida = async (id: number) => {
    if (!isAdmin) return;
    if (!confirm('Sicuro di voler eliminare questa sfida?')) return;
    try {
      const r = await fetch(`/api/sfide?id=${id}`, { method: 'DELETE' });
      if (r.ok) loadSfide();
    } catch(e){}
  };

  const resetAlgoSettings = () => {
      setAlgoSettings({
        wVoto: 40,
        wWinRate: 30,
        wGolRatio: 30,
        wMvp: 15,
        balanceRoles: true
      });
  };

  const saveAlgoSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ algo_settings: algoSettings })
      });
      if (res.ok) {
        showToast('Impostazioni algoritmo salvate', 'success');
        setAlgoModalOpen(false);
      } else {
        showToast('Errore salvataggio impostazioni', 'error');
      }
    } catch(e) {
      showToast('Errore salvataggio impostazioni', 'error');
    }
  };

  const savePredictionSettings = async (newSettings: PredictionSettings) => {
    setPredictionSettings(newSettings);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('prediction_settings', JSON.stringify(newSettings));
      } catch {}
    }
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prediction_settings: newSettings })
      });
      if (res.ok) {
        showToast('Impostazioni previsione salvate', 'success');
      } else {
        showToast('Impostazioni salvate localmente', 'info');
      }
    } catch (e) {
      showToast('Impostazioni salvate localmente', 'info');
    }
    setIsPredictionModalOpen(false);
  };

  let sortedSfidaLeaderboard = [...sfidaLeaderboard];
  if (sfidaSortConfig) {
    sortedSfidaLeaderboard.sort((a, b) => {
       let aV = a[sfidaSortConfig.key];
       let bV = b[sfidaSortConfig.key];
       if (aV < bV) return sfidaSortConfig.direction === 'asc' ? -1 : 1;
       if (aV > bV) return sfidaSortConfig.direction === 'asc' ? 1 : -1;
       return 0;
    });
  }

  const filteredArchiveMatches = useMemo(() => {
    return matches.filter(m => {
      const date = new Date(m.data);
      const mMonth = date.toLocaleDateString('it-IT', { month: 'long' }).toLowerCase();
      const mYear = date.getFullYear().toString();
      
      const pF = archivePlayerFilter.toLowerCase().trim();
      const monthF = archiveMonthFilter.toLowerCase().trim();
      const yearF = archiveYearFilter.trim();
      
      if (monthF && !mMonth.includes(monthF)) return false;
      if (yearF && mYear !== yearF) return false;
      
      if (pF) {
          const matchPlayers = [
            ...(m.team_a_players || []),
            ...(m.team_b_players || []),
          ].map((p: string) => p.toLowerCase());
          
          if (!matchPlayers.some(p => p.includes(pF))) return false;
      }
      
      return true;
    });
  }, [matches, archiveMonthFilter, archiveYearFilter, archivePlayerFilter]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getRoleAbbr = (r: string | undefined) => {
    if (!r) return '-';
    switch(r) {
      case 'Centrocampista Centrale': return 'CC';
      case 'Centrocampista': return 'CC';
      case 'Difensore Centrale': return 'DC';
      case 'Difensore': return 'DC';
      case 'Terzino Destro': return 'TD';
      case 'Terzino Sinistro': return 'TS';
      case 'Terzino': return 'TER';
      case 'Attaccante': return 'ATT';
      case 'Portiere': return 'POR';
      case 'Ala Sinistra': return 'AS';
      case 'Ala Destra': return 'AD';
      case 'Ala': return 'Ala';
      default: return r;
    }
  };

  const sortedLeaderboard = useMemo(() => {
    let sortableItems = [...leaderboard];
    if (!showGuests) {
       sortableItems = sortableItems.filter(item => dbPlayers.some(p => p.Nome === item.nome));
    }
    
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (sortConfig.key === 'ruolo') {
           const roleA = dbPlayers.find(p => p.Nome === a.nome)?.Ruolo;
           const roleB = dbPlayers.find(p => p.Nome === b.nome)?.Ruolo;
           valA = getRoleAbbr(roleA);
           valB = getRoleAbbr(roleB);
        } else if (sortConfig.key !== 'nome') {
           // Forza a numero per evitare che "10" sia minore di "2"
           valA = Number(valA) || 0;
           valB = Number(valB) || 0;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [leaderboard, sortConfig, showGuests, dbPlayers]);

  const parseScorers = (scorersInput: any) => parseScorersString(scorersInput);

  const stringifyScorers = (map: Record<string, number>) => {
    return Object.entries(map)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => count > 1 ? `${name} (${count})` : name)
      .join(', ');
  };

  const weeklyData = useMemo(() => {
    const validMatches = matches.filter(m => {
      const mDate = new Date(m.data);
      const isInterruptedMatch = mDate.getDate() === 8 && mDate.getMonth() === 6 && mDate.getFullYear() === 2026 && m.ora && m.ora.startsWith('21');
      return !isInterruptedMatch && m.risultato && m.risultato !== '0-0';
    });
    if (validMatches.length === 0) return null;
    const lastMatch = validMatches[0];

    const [scoreA, scoreB] = (lastMatch.risultato || '0-0').split('-').map(s => parseInt(s.trim(), 10) || 0);
    const isDraw = scoreA === scoreB;
    const isWinnerA = scoreA > scoreB;

    let teamAPlayers = lastMatch.team_a_players || [];
    let teamBPlayers = lastMatch.team_b_players || [];

    if (!showGuests) {
      teamAPlayers = teamAPlayers.filter((p: string) => dbPlayers.some(dbp => dbp.Nome === p));
      teamBPlayers = teamBPlayers.filter((p: string) => dbPlayers.some(dbp => dbp.Nome === p));
    }

    const voti = lastMatch.voti_giocatori || {};

    const seed = lastMatch.id || 1;

    // Stable seeded pseudo-random selection
    const selectRandomSeeded = (players: string[], count: number, s: number): string[] => {
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
    const selectByVote = (team: string[], votiObj: Record<string, number | 's.v.'>, count: number, highest: boolean, baseSeed: number): string[] => {
      const playersWithVotes = team
        .filter(p => votiObj[p] !== 's.v.' && votiObj[p] !== 0)
        .map(p => ({
        name: p,
        vote: typeof votiObj[p] === 'number' ? votiObj[p] as number : 6 // Default 6 if missing
      }));

      // Group players by votes
      const groups: Record<number, string[]> = {};
      playersWithVotes.forEach(p => {
        if (!groups[p.vote]) groups[p.vote] = [];
        groups[p.vote].push(p.name);
      });

      // Get sorted unique vote counts
      const uniqueVotes = Object.keys(groups).map(Number).sort((a, b) => highest ? b - a : a - b);

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

  const statsData = useMemo(() => {
    const data: Record<string, {
        name: string,
        partiteGiocate: number,
        golFattiSquadra: number,
        golSubitiSquadra: number,
        sommaVoti: number,
        votiTrend: { matchId: number, data: string, voto: number, mediaCumulativa: number }[]
    }> = {};

    // Sort matches by date to ensure correct chronological trend
    const sortedMatches = [...matches].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    sortedMatches.forEach(m => {
        if (!m.risultato || m.risultato === '0-0') return;
        const [scoreA, scoreB] = m.risultato.split('-').map(s => parseInt(s.trim(), 10) || 0);
        
        const processPlayer = (playerName: string, teamGoalsScored: number, teamGoalsConceded: number) => {
            if (!showGuests && !dbPlayers.some(p => p.Nome === playerName)) return;
            if (!data[playerName]) {
                data[playerName] = { name: playerName, partiteGiocate: 0, golFattiSquadra: 0, golSubitiSquadra: 0, sommaVoti: 0, votiTrend: [] };
            }
            data[playerName].partiteGiocate += 1;
            data[playerName].golFattiSquadra += teamGoalsScored;
            data[playerName].golSubitiSquadra += teamGoalsConceded;
            
            if (m.voti_giocatori && m.voti_giocatori[playerName] !== undefined) {
                const voto = m.voti_giocatori[playerName];
                if (typeof voto === 'number' && voto > 0) {
                    data[playerName].sommaVoti += voto;
                    const matchDate = new Date(m.data);
                    const shortDate = `${matchDate.getDate().toString().padStart(2, '0')}/${(matchDate.getMonth()+1).toString().padStart(2, '0')}`;
                    
                    const currentMatchesWithVotes = data[playerName].votiTrend.length + 1;
                    const mediaCumulativa = Number((data[playerName].sommaVoti / currentMatchesWithVotes).toFixed(2));
                    
                    data[playerName].votiTrend.push({ 
                      matchId: m.id, 
                      data: shortDate, 
                      voto,
                      mediaCumulativa
                    });
                }
            }
        };

        m.team_a_players?.forEach(p => processPlayer(p, scoreA, scoreB));
        m.team_b_players?.forEach(p => processPlayer(p, scoreB, scoreA));
    });
    
    return Object.values(data).sort((a, b) => b.golFattiSquadra - a.golFattiSquadra);
  }, [matches, showGuests, dbPlayers]);

  const trendChartData = useMemo(() => {
    const sortedMatches = [...matches].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    
    return sortedMatches.filter(m => m.risultato && m.risultato !== '0-0').map(m => {
        const matchDate = new Date(m.data);
        const shortDate = `${matchDate.getDate().toString().padStart(2, '0')}/${(matchDate.getMonth()+1).toString().padStart(2, '0')}`;
        
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

  const getMatchTrack = (m: { team_a_players?: string[]; team_b_players?: string[] }): '5-6' | '7-8' => {
    const lenA = m.team_a_players?.length || 0;
    const lenB = m.team_b_players?.length || 0;
    const size = Math.max(lenA, lenB) || 5;
    return size >= 7 ? '7-8' : '5-6';
  };

  const historicalPredictions = useMemo(() => {
    const uniqueMatchesMap = new Set<string>();
    const validMatches = [...matches].filter(m => {
        if (!m.risultato || m.risultato === '0-0') return false;
        const teamA = (m.team_a_name || '').trim();
        const teamB = (m.team_b_name || '').trim();
        const [scoreA, scoreB] = m.risultato.split('-').map(s => s.trim());
        let key = teamA < teamB ? `${teamA}_${teamB}_${scoreA}-${scoreB}` : `${teamB}_${teamA}_${scoreB}-${scoreA}`;
        if (uniqueMatchesMap.has(key)) return false;
        uniqueMatchesMap.add(key);
        return true;
    }).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const preds: Record<number, { favorite: 'A' | 'B' | 'X', correct: boolean, track: '5-6' | '7-8', formatSize: number }> = {};
    let correctCount = 0;
    let totalCount = 0;

    validMatches.forEach((match, index) => {
       const matchFormatSize = Math.max(match.team_a_players?.length || 0, match.team_b_players?.length || 0) || 5;
       const matchTrack = getMatchTrack(match);
       // Prendi le partite passate idonee in base alle impostazioni di previsione attive
       const pastMatches = validMatches.slice(0, index).filter(m => isMatchAllowedForPrediction(m, matchFormatSize, predictionSettings));
       if (pastMatches.length === 0) return; // Non abbastanza dati storici per questa partita
       
       const data: Record<string, any> = {};
       const mvps: Record<string, number> = {};

       pastMatches.forEach(m => {
           const [sA, sB] = (m.risultato || '0-0').split('-').map(s => parseInt(s.trim(), 10) || 0);
           
           let matchMaxVote = 0;
           let matchMVPs: string[] = [];
           if (m.voti_giocatori) {
               Object.entries(m.voti_giocatori).forEach(([p, voto]) => {
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
           
           matchMVPs.forEach(p => { mvps[p] = (mvps[p] || 0) + 1; });

           const processP = (p: string, gF: number, gS: number) => {
               if (!data[p]) data[p] = { partiteGiocate: 0, golFattiSquadra: 0, golSubitiSquadra: 0, sommaVoti: 0, votiCount: 0 };
               data[p].partiteGiocate++;
               data[p].golFattiSquadra += gF;
               data[p].golSubitiSquadra += gS;
               if (m.voti_giocatori && typeof m.voti_giocatori[p] === 'number' && m.voti_giocatori[p] > 0) {
                   data[p].sommaVoti += m.voti_giocatori[p];
                   data[p].votiCount++;
               }
           };
           m.team_a_players?.forEach(p => processP(p, sA, sB));
           m.team_b_players?.forEach(p => processP(p, sB, sA));
       });

       const getTeamStats = (teamPlayers: string[]) => {
          let sumMediaVoto = 0, sumGolFattiAvg = 0, sumGolSubitiAvg = 0, totalMvp = 0, validVoto = 0, validGol = 0;
          teamPlayers.forEach(p => {
             const s = data[p];
             if (s && s.partiteGiocate > 0) {
                if (s.votiCount > 0) { sumMediaVoto += (s.sommaVoti / s.votiCount); validVoto++; }
                sumGolFattiAvg += (s.golFattiSquadra / s.partiteGiocate);
                sumGolSubitiAvg += (s.golSubitiSquadra / s.partiteGiocate);
                validGol++;
             }
             if (mvps[p]) totalMvp += mvps[p];
          });
          return {
             mediaVoto: validVoto > 0 ? sumMediaVoto / validVoto : 6,
             golFatti: validGol > 0 ? sumGolFattiAvg / validGol : 0,
             golSubiti: validGol > 0 ? sumGolSubitiAvg / validGol : 0,
             mvp: totalMvp
          };
       };

       const getSynergy = (teamPlayers: string[]) => {
          let wWins=0, wDraws=0, wLosses=0, wGF=0, wGS=0, tW=0;
          pastMatches.forEach(m => {
             const teamAP = m.team_a_players || [];
             const teamBP = m.team_b_players || [];
             const [sA, sB] = (m.risultato || '0-0').split('-').map(s => parseInt(s.trim(), 10) || 0);
             const overlapA = teamPlayers.filter(p => teamAP.includes(p)).length;
             const overlapB = teamPlayers.filter(p => teamBP.includes(p)).length;
             if (overlapA >= 2 || overlapB >= 2) {
                const bestOverlap = overlapA >= overlapB ? overlapA : overlapB;
                const isOnSideA = overlapA >= overlapB;
                const pastSize = Math.max(teamAP.length, teamBP.length) || 5;
                const maxPossibleOverlap = Math.min(matchFormatSize, pastSize);
                const weight = Math.pow(bestOverlap / Math.max(maxPossibleOverlap, 2), 2);
                const gF = isOnSideA ? sA : sB;
                const gS = isOnSideA ? sB : sA;
                if (gF > gS) wWins += weight;
                else if (gF === gS) wDraws += weight;
                else wLosses += weight;
                tW += weight;
             }
          });
          return {
             winRate: tW > 0 ? wWins / tW : 0,
             drawRate: tW > 0 ? wDraws / tW : 0,
             lossRate: tW > 0 ? wLosses / tW : 0,
             totalWeight: tW,
             avgGolFatti: tW > 0 ? wGF / tW : 0,
             avgGolSubiti: tW > 0 ? wGS / tW : 0
          };
       };

       const statsA = getTeamStats(match.team_a_players || []);
       const statsB = getTeamStats(match.team_b_players || []);
       const synA = getSynergy(match.team_a_players || []);
       const synB = getSynergy(match.team_b_players || []);

       const getComposite = (st: any, syn: any) => {
          const normVoto = (st.mediaVoto - 4) / 6;
          const normGolDiff = (st.golFatti - st.golSubiti) / Math.max(st.golFatti + st.golSubiti, 1);
          const mvpBonus = Math.min(st.mvp * 0.02, 0.1);
          const indScore = normVoto * 0.5 + normGolDiff * 0.35 + mvpBonus;
          const synScore = syn.totalWeight > 0 ? syn.winRate * 0.6 + syn.drawRate * 0.2 - syn.lossRate * 0.2 : 0.5;
          const wSyn = syn.totalWeight > 0 ? 0.4 : 0;
          const wInd = 1 - wSyn;
          return indScore * wInd + synScore * wSyn;
       };

       const compA = getComposite(statsA, synA);
       const compB = getComposite(statsB, synB);
       const diff = compA - compB;
       const sigmoid = (x: number) => 1 / (1 + Math.exp(-x * 8));
       const rawA = sigmoid(diff);
       const rawB = 1 - rawA;
       const drawBase = 0.15;
       const drawBonus = Math.max(0, 0.25 - Math.abs(diff) * 2);
       const drawPct = Math.min(drawBase + drawBonus, 0.40);
       
       const winAPct = rawA * (1 - drawPct);
       const winBPct = rawB * (1 - drawPct);
       const pctA = Math.round(winAPct * 100);
       const pctB = Math.round(winBPct * 100);
       
       const favorite = pctA > pctB ? 'A' : pctB > pctA ? 'B' : 'X';
       
       const [actA, actB] = (match.risultato || '0-0').split('-').map(s => parseInt(s.trim(), 10) || 0);
       const actual = actA > actB ? 'A' : actB > actA ? 'B' : 'X';
       
       preds[match.id] = { favorite, correct: favorite === actual, track: matchTrack, formatSize: matchFormatSize };
       
       if (favorite === actual) correctCount++;
       totalCount++;
    });

    return { 
      preds, 
      accuracy: totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 100,
      correctCount,
      totalCount
    };
  }, [matches, predictionSettings]);


  const handleUpdateGoal = (team: 'A' | 'B', player: string, delta: number) => {
    if (team === 'A') {
      setUpdateScorersA(prev => {
        const val = Math.max(0, (prev[player] || 0) + delta);
        const next = { ...prev };
        if (val === 0) delete next[player]; else next[player] = val;
        return next;
      });
    } else {
      setUpdateScorersB(prev => {
        const val = Math.max(0, (prev[player] || 0) + delta);
        const next = { ...prev };
        if (val === 0) delete next[player]; else next[player] = val;
        return next;
      });
    }
  };

  const handleUpdateVoteModal = (player: string, delta: number) => {
    setTouchedVoti(prev => new Set(prev).add(player));
    setUpdateVoti(prev => {
      let current = prev[player];
      if (current === 's.v.' || current === 0 || typeof current === 'string') current = 6;
      else if (current === undefined) current = 6;
      
      let nextVote = Number(current) + delta;
      if (nextVote > 10) nextVote = 10;
      if (nextVote <= 0) return { ...prev, [player]: 's.v.' };
      
      return { ...prev, [player]: nextVote };
    });
  };

  const handleSetVoteSV = (player: string) => {
    setTouchedVoti(prev => new Set(prev).add(player));
    setUpdateVoti(prev => ({ ...prev, [player]: 's.v.' }));
  };

  const handleToggleMVP = (player: string) => {
    setUpdateMVPs(prev => prev.includes(player) ? prev.filter(p => p !== player) : [...prev, player]);
  };

  const updatingMatch = matches.find(m => m.id === updatingMatchId);

  const { data: session } = useSession();
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').split(',').map(e => e.trim().toLowerCase());
  const isAdmin = session?.user?.email ? adminEmails.includes(session.user.email.trim().toLowerCase()) : false;

  const resultsRef = useRef<HTMLDivElement>(null);
  const pitchesRef = useRef<HTMLDivElement>(null);

  // Clean up selection on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if (activeSwapSource) {
            setActiveSwapSource(null);
        }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeSwapSource]);

  // --- Data Fetch ---
  const fetchPlayers = async () => {
    try {
      const res = await fetch(`/api/giocatori?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDbPlayers(data);
    } catch (err) {
      console.error(err);
      setError('Impossibile caricare i giocatori');
    }
  };

  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    try {
      const res = await fetch('/api/classifica?recalculate=true', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [playersRes, sessionRes, settingsRes, matchesRes, leaderboardRes, campiRes, mediaRes] = await Promise.all([
          fetch(`/api/giocatori?t=${Date.now()}`, { cache: 'no-store' }),
          fetch(`/api/session?t=${Date.now()}`, { cache: 'no-store' }),
          fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' }),
          fetch('/api/risultati', { cache: 'no-store' }),
          fetch('/api/classifica', { cache: 'no-store' }),
          fetch('/api/campi', { cache: 'no-store' }),
          fetch('/api/media', { cache: 'no-store' })
        ]);
        
        const playersData = await playersRes.json();
        const sessionData = await sessionRes.json();
        const settingsData = await settingsRes.json();
        const matchesData = await matchesRes.json();
        const leaderboardData = await leaderboardRes.json();
        const campiData = await campiRes.json().catch(() => []);
        const mediaData = await mediaRes.json().catch(() => []);

        if (playersData.error) throw new Error(playersData.error);
        setDbPlayers(playersData);
        setDbCampi(Array.isArray(campiData) ? campiData : []);
        setMatches(Array.isArray(matchesData) ? matchesData : []);
        setMediaItems(Array.isArray(mediaData) ? mediaData : []);
        if (leaderboardData.success && leaderboardData.leaderboard) {
          setLeaderboard(leaderboardData.leaderboard);
        }

        let currentLabel = 'Venerdì 19 giugno - Ore 21';
        if (settingsData && settingsData.match_label) {
          currentLabel = settingsData.match_label;
          setMatchLabel(currentLabel);
        }
        if (settingsData && settingsData.algo_settings) {
          setAlgoSettings(settingsData.algo_settings);
        }
        if (settingsData && settingsData.header_image) {
          setHeaderImage(settingsData.header_image);
        }
        if (settingsData && settingsData.prediction_settings) {
          setPredictionSettings(settingsData.prediction_settings);
          setTempPredictionSettings(settingsData.prediction_settings);
        } else if (typeof window !== 'undefined') {
          try {
            const cached = localStorage.getItem('prediction_settings');
            if (cached) {
              const parsed = JSON.parse(cached);
              setPredictionSettings(parsed);
              setTempPredictionSettings(parsed);
            }
          } catch {}
        }

        const savedMatch = Array.isArray(matchesData) && matchesData.length > 0 ? matchesData[0] : null;

        if (savedMatch && savedMatch.Stadium) {
            setSelectedStadium(savedMatch.Stadium);
        }

        if (Array.isArray(matchesData) && matchesData.length > 0 && !mediaFilterPartita) {
          const matchWithMedia = matchesData.find(m => 
            Array.isArray(mediaData) && mediaData.some(media => media.partita_id === m.id)
          );
          
          if (matchWithMedia) {
            setMediaFilterPartita(String(matchWithMedia.id));
          } else {
            setMediaFilterPartita(String(matchesData[0].id));
          }
        }

        if (sessionData) {
          // Validation Guard: Only apply session if it's complete and valid
          const sessionLen = Array.isArray(sessionData.selected_players) ? sessionData.selected_players.length : 10;
          const format = sessionLen / 2;
          const isValidSession = 
            Array.isArray(sessionData.selected_players) && 
            [10, 12, 14, 16].includes(sessionData.selected_players.length) &&
            sessionData.selected_players.every((p: string) => p !== '') &&
            Array.isArray(sessionData.team_a_players) && sessionData.team_a_players.length === format &&
            Array.isArray(sessionData.team_b_players) && sessionData.team_b_players.length === format;

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
                teamB: ensureGoalkeeperInGoal(savedMatch.team_b_players || [], playersData)
              });
            } else {
              setTeamAName(sessionData.team_a_name || 'Falchi 🦅');
              setTeamBName(sessionData.team_b_name || 'Aquile 🦆');
              setResults({
                teamA: ensureGoalkeeperInGoal(sessionData.team_a_players, playersData),
                teamB: ensureGoalkeeperInGoal(sessionData.team_b_players, playersData)
              });
            }
          }
        }
      } catch (err) {
        console.error('Initialization Error:', err);
        setError('Impossibile caricare i dati dal database');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) {
        showToast("Nome obbligatorio", "error");
        return;
    }
    if (!newPlayerStats.Ruolo?.trim()) {
        showToast("Ruolo Preferito obbligatorio", "error");
        return;
    }

    try {
      const res = await fetch('/api/giocatori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            Nome: newPlayerName.trim(),
            Ruolo: newPlayerStats.Ruolo?.trim(),
            RuoloSecondario: newPlayerStats.RuoloSecondario?.trim() || null,
            stats: { ...newPlayerStats, Nome: newPlayerName.trim(), RuoloSecondario: newPlayerStats.RuoloSecondario?.trim() || null },
            mergeTarget: mergeTargetName.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (newPlayerImage) {
        const formData = new FormData();
        formData.append('file', newPlayerImage);
        formData.append('playerName', newPlayerName.trim());
        const uploadRes = await fetch('/api/giocatori/upload-image', {
          method: 'POST',
          body: formData
        });
        if (!uploadRes.ok) throw new Error('Errore caricamento immagine');
      }
      
      showToast('Giocatore aggiunto!', 'success');
      setNewPlayerName('');
      setNewPlayerImage(null);
      setNewPlayerStats({});
      setMergeTargetName('');
      setIsAddModalOpen(false);
      await fetchPlayers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddCampo = async () => {
    if (!newCampoName.trim()) {
        showToast("Nome campo obbligatorio", "error");
        return;
    }

    try {
      const payload: any = { 
          nome: newCampoName.trim(),
          posizione_url: newCampoUrl.trim()
      };
      if (campoModalMode === 'manage' && selectedCampoIdToManage) {
          payload.id = selectedCampoIdToManage;
      }

      const res = await fetch('/api/campi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(campoModalMode === 'add' ? 'Campo aggiunto!' : 'Campo aggiornato!', 'success');
      setNewCampoName('');
      setNewCampoUrl('');
      setCampoPassword('');
      setSelectedCampoIdToManage(null);
      setIsAddCampoModalOpen(false);
      
      // Refetch campi
      const campiRes = await fetch('/api/campi', { cache: 'no-store' });
      const campiData = await campiRes.json().catch(() => []);
      setDbCampi(Array.isArray(campiData) ? campiData : []);
      setSelectedStadium(newCampoName.trim());
      
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCampo = async () => {
    if (!selectedCampoIdToManage) return;
    if (!confirm("Sei sicuro di voler eliminare questo campo?")) return;

    try {
      const res = await fetch('/api/campi', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCampoIdToManage })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Campo eliminato!', 'success');
      setNewCampoName('');
      setNewCampoUrl('');
      setCampoPassword('');
      setSelectedCampoIdToManage(null);
      setIsAddCampoModalOpen(false);
      
      // Refetch campi
      const campiRes = await fetch('/api/campi', { cache: 'no-store' });
      const campiData = await campiRes.json().catch(() => []);
      setDbCampi(Array.isArray(campiData) ? campiData : []);
      
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleEditPlayerSubmit = async () => {
    if (!editingPlayerName.trim()) {
      showToast('Nome obbligatorio', 'error');
      return;
    }


    setIsSaving(true);
    try {
      const res = await fetch('/api/giocatori/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldName: editingPlayerOldName, 
          newName: editingPlayerName.trim(), 
          newRole: editingPlayerStats.Ruolo?.trim() || '',
          newRoleSecondario: editingPlayerStats.RuoloSecondario?.trim() || null,
          stats: { ...editingPlayerStats, Nome: editingPlayerName.trim(), RuoloSecondario: editingPlayerStats.RuoloSecondario?.trim() || null }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante la modifica');

      if (editingPlayerImage) {
        const formData = new FormData();
        formData.append('file', editingPlayerImage);
        formData.append('playerName', editingPlayerName.trim());
        const uploadRes = await fetch('/api/giocatori/upload-image', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) throw new Error(uploadData.details || 'Errore caricamento immagine');
      }
      
      showToast('Giocatore aggiornato!', 'success');
      setEditingPlayerImage(null);
      setIsEditModalOpen(false);
      
      setSelectedPlayers(prev => prev.map(name => name === editingPlayerOldName ? editingPlayerName.trim() : name));
      
      setClusters(prev => prev.map(c => ({
        ...c,
        members: c.members.map(m => m === editingPlayerOldName ? editingPlayerName.trim() : m)
      })));
      
      await fetchPlayers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlayers = async () => {
    if (selectedToDelete.size === 0) return;
    

    setIsSaving(true);
    try {
        const res = await fetch('/api/giocatori/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ names: Array.from(selectedToDelete) })
        });
        if (!res.ok) throw new Error('Errore nella cancellazione');
        
        // Update UI
        setSelectedPlayers(prev => prev.filter(name => !selectedToDelete.has(name)));
        showToast('Giocatori eliminati!', 'success');
        setSelectedToDelete(new Set());
        setSearchQuery('');
        setIsManageModalOpen(false);
        await fetchPlayers();
    } catch (err: any) {
        showToast(err.message, 'error');
    } finally {
        setIsSaving(false);
    }
  };


  const handleUpdateResult = async () => {
    if (!updatingMatchId) return;

    const risultato = `${updateScoreA.trim() || '0'}-${updateScoreB.trim() || '0'}`;
    const strScorersA = stringifyScorers(updateScorersA);
    const strScorersB = stringifyScorers(updateScorersB);

    try {
      const res = await fetch('/api/risultati/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updatingMatchId,
          risultato,
          marcatori_a: strScorersA,
          marcatori_b: strScorersB,
          voti_giocatori: updateVoti,
          mvps: updateMVPs
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante l\'aggiornamento');

      showToast('Risultato aggiornato!', 'success');
      setIsUpdateModalOpen(false);

      // Aggiorna lo stato dei match localmente
      setMatches(prev => prev.map(m => m.id === updatingMatchId ? data.match : m));

      // Usa la classifica già calcolata e restituita dal backend (nessuna seconda fetch)
      if (data.leaderboard && Array.isArray(data.leaderboard)) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err: any) {
      showToast(err.message || 'Errore aggiornamento risultato', 'error');
    }
  };

  const handleDeleteMatch = async () => {
    if (!updatingMatchId) return;

    if (!confirm('Sei sicuro di voler eliminare questa partita? Questa operazione è irreversibile.')) {
      return;
    }

    try {
      const res = await fetch('/api/risultati/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updatingMatchId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante l\'eliminazione');

      showToast('Partita eliminata!', 'success');
      setIsUpdateModalOpen(false);
      setIsDeleteModalOpen(false);

      // Remove from state
      setMatches(prev => prev.filter(m => m.id !== updatingMatchId));

      // Usa la classifica già calcolata e restituita dal backend (nessuna seconda fetch)
      if (data.leaderboard && Array.isArray(data.leaderboard)) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err: any) {
      showToast(err.message || 'Errore eliminazione partita', 'error');
    }
  };

  // --- Add Media Handler ---
  const handleAddMedia = async () => {
    if (!mediaFilterPartita) { showToast('Seleziona una partita prima di aggiungere media', 'error'); return; }
    if (!newMediaYoutubeUrl) { showToast('Inserisci un link YouTube', 'error'); return; }
    if (!newMediaTipologia) { showToast('Seleziona una tipologia', 'error'); return; }
    if (!newMediaPassword) { showToast('Inserisci la password', 'error'); return; }

    // Extract youtube_id from URL
    let youtubeId = newMediaYoutubeUrl;
    const ytMatch = newMediaYoutubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    if (ytMatch) youtubeId = ytMatch[1];

    setIsSavingMedia(true);
    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partita_id: Number(mediaFilterPartita),
          giocatore: newMediaAutori.length > 0 ? newMediaAutori.join(', ') : null,
          co_giocatore: newMediaCoAutori.length > 0 ? newMediaCoAutori.join(', ') : null,
          tipologia: newMediaTipologia,
          youtube_id: youtubeId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore durante il salvataggio');

      showToast('Media aggiunto con successo!', 'success');
      setIsAddMediaModalOpen(false);
      setNewMediaYoutubeUrl(''); setNewMediaAutori([]); setNewMediaCoAutori([]); setNewMediaTipologia(''); setNewMediaPassword('');

      // Refresh media list
      const mediaRes = await fetch('/api/media', { cache: 'no-store' });
      const mediaData = await mediaRes.json().catch(() => []);
      setMediaItems(Array.isArray(mediaData) ? mediaData : []);
    } catch (err: any) {
      showToast(err.message || 'Errore salvataggio media', 'error');
    } finally {
      setIsSavingMedia(false);
    }
  };

  // --- Theme Toggle ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // --- Helpers ---
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const hashStringToHue = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
  };

  const formatResultDate = (isoString: string) => {
  const d = new Date(isoString);
  const formatter = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  return formatter.format(d);
};

const getVoteColor = (v?: number | string) => {
  if (v === 's.v.' || v === 0) return '#88929b';
  if (v === undefined || v === null) return '#88929b';
  if (typeof v === 'string') return '#88929b';
  if (v < 5) return '#e57373';
  if (v < 6) return '#f39c12';
  if (v < 7) return '#88929b';
  if (v < 8) return '#4caf50';
  if (v < 9) return '#00e676';
  return '#00ff00';
};

const formatResultTime = (timeStr?: string) => {
    return timeStr?.split(':').slice(0, 2).join(':') || '';
  };

  const normalizeScorers = (value: any) => {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'string') return value.trim();
    return '';
  };

  const hasScorers = (m: MatchResult) => {
    const a = normalizeScorers(m.marcatori_a);
    const b = normalizeScorers(m.marcatori_b);
    return a !== '' || b !== '';
  };

  const saveSession = async (currentResults: Results) => {
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_players: selectedPlayers,
          clusters,
          team_a_name: teamAName,
          team_b_name: teamBName,
          team_a_players: currentResults.teamA,
          team_b_players: currentResults.teamB
        })
      });
    } catch (err) {
      console.error('Error saving session:', err);
    }
  };

  const saveSettings = async (label: string) => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_label: label })
      });
    } catch (err) {
      console.error('Error saving settings:', err);
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

  const handleSwap = (playerA: string, teamA: 'teamA' | 'teamB', playerB: string, teamB: 'teamA' | 'teamB') => {
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
          setActiveSwapSource(null);
          showToast(`Scambio effettuato: ${playerA} ⇄ ${playerB}`, 'success');
      }
  };

  const handleRoleSwap = (teamKey: 'teamA' | 'teamB', indexFrom: number, indexTo: number) => {
      if (!results) return;
      if (indexFrom === indexTo) {
          setSelectedRolePlayer(null);
          return;
      }
      const currentList = [...results[teamKey]];
      if (indexFrom < 0 || indexFrom >= currentList.length || indexTo < 0 || indexTo >= currentList.length) {
          setSelectedRolePlayer(null);
          return;
      }
      const playerFrom = currentList[indexFrom];
      const playerTo = currentList[indexTo];

      currentList[indexFrom] = playerTo;
      currentList[indexTo] = playerFrom;

      const newResults: Results = {
          ...results,
          [teamKey]: currentList
      };

      setResults(newResults);
      saveSession(newResults);
      setSelectedRolePlayer(null);
      showToast(`Ruolo scambiato: ${playerFrom} ⇄ ${playerTo}`, 'success');
  };

  // --- Logic ---
  const getPlayerMorale = (playerName: string): { condition: 'excellent' | 'good' | 'normal' | 'poor' | 'terrible' | 'neutral', title: string } => {
    if (!matches || matches.length === 0) return { condition: 'neutral', title: 'Nessuna partita' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(today.getDate() - 14);

    const pastMatches = matches.filter(m => {
      const matchDate = new Date(m.data);
      const isInterruptedMatch = matchDate.getDate() === 8 && matchDate.getMonth() === 6 && matchDate.getFullYear() === 2026 && m.ora && m.ora.startsWith('21');
      matchDate.setHours(0, 0, 0, 0);
      return !isInterruptedMatch && matchDate.getTime() < today.getTime() && m.risultato && m.risultato !== '0-0';
    });

    const lastMatchPlayed = pastMatches.find(m => (m.team_a_players || []).includes(playerName) || (m.team_b_players || []).includes(playerName));

    if (!lastMatchPlayed) {
       return { condition: 'neutral', title: 'Mai giocato' };
    }

    const lastMatchDate = new Date(lastMatchPlayed.data);
    lastMatchDate.setHours(0, 0, 0, 0);

    if (lastMatchDate.getTime() < fourteenDaysAgo.getTime()) {
       return { condition: 'neutral', title: 'Inattivo (Fuori forma, non gioca da 14gg)' };
    }

    const vote = lastMatchPlayed.voti_giocatori?.[playerName];
    
    if (vote === undefined || vote === null || vote === 's.v.' || vote === 0) {
      return { condition: 'neutral', title: 'Senza voto' };
    }
    
    let condition: 'excellent' | 'good' | 'normal' | 'poor' | 'terrible' = 'normal';
    if (typeof vote === 'number') {
      if (vote >= 7.5) { condition = 'excellent'; }
      else if (vote >= 6.5) { condition = 'good'; }
      else if (vote >= 6) { condition = 'normal'; }
      else if (vote >= 5) { condition = 'poor'; }
      else { condition = 'terrible'; }
    }

    return { condition, title: `Ultimo voto: ${vote}` };
  };

  const handlePlayerChange = (index: number, name: string) => {
    const newSelected = [...selectedPlayers];
    newSelected[index] = name;
    setSelectedPlayers(newSelected);
    
    // Cleanup clusters if a player is deselected or changed
    const oldName = selectedPlayers[index];
    if (oldName && oldName !== name) {
        setClusters([]);
    }
  };

  const addCluster = () => {
    const id = Date.now();
    setClusters([...clusters, { id, name: `Cluster ${String.fromCharCode(65 + clusters.length)}`, members: [] }]);
    setIsClustersExpanded(true);
  };

  const removeCluster = (id: number) => {
    setClusters(clusters.filter(c => c.id !== id));
  };

  const toggleMemberInCluster = (clusterId: number, playerName: string) => {
    setClusters(clusters.map(c => {
      if (c.id === clusterId) {
        const isMember = c.members.includes(playerName);
        return {
          ...c,
          members: isMember ? c.members.filter(m => m !== playerName) : [...c.members, playerName]
        };
      }
      return c;
    }));
  };

  const getRating = (name: string, withModifier = true) => {
      const s = statsData.find(x => x.name === name);
      const l = leaderboard.find(x => x.nome === name);
      
      let base = 6.0;
      if (l && l.media_voto > 0) base = l.media_voto;
      
      let off = 0;
      let dif = 0;
      if (s && s.partiteGiocate > 0) {
          off = s.golFattiSquadra / s.partiteGiocate;
          dif = s.golSubitiSquadra / s.partiteGiocate;
      }
      
      let mvp = 0;
      let winRate = 0.5;
      if (l && l.partite_giocate > 0) {
          mvp = l.mvp_count / l.partite_giocate;
          winRate = l.vittorie / l.partite_giocate;
      }
      
      const ratingBase = (base / 10) * algoSettings.wVoto; 
      const ratingWin = winRate * algoSettings.wWinRate;
      const halfGol = algoSettings.wGolRatio / 2;
      const ratingDiff = Math.max(0, Math.min(algoSettings.wGolRatio, halfGol + (off - dif) * (algoSettings.wGolRatio/10)));
      const ratingMvp = mvp * algoSettings.wMvp;
      
      const res = ratingBase + ratingWin + ratingDiff + ratingMvp;
      return res + (withModifier ? (ovrModifiers[name] || 0) : 0);
  };

  const getSimulatedTeams = () => {
    const validPlayers = selectedPlayers.filter(Boolean);
    if (validPlayers.length !== matchFormat * 2) return null;

    const assignments = new Map<string, 'teamA' | 'teamB'>();
    for (const cluster of clusters) {
      const members = cluster.members.filter(p => validPlayers.includes(p));
      const mid = Math.floor(members.length / 2);
      members.slice(0, mid).forEach(p => assignments.set(p, 'teamA'));
      members.slice(mid).forEach(p => assignments.set(p, 'teamB'));
    }

    // Bilanciamento Portieri: se ci sono portieri, distribuiamoli tra le due squadre
    const selectedGKs = validPlayers.filter(p => isGoalkeeper(p));
    if (selectedGKs.length >= 2) {
      const unassignedGKs = selectedGKs.filter(p => !assignments.has(p));
      const gkA = selectedGKs.find(p => assignments.get(p) === 'teamA');
      const gkB = selectedGKs.find(p => assignments.get(p) === 'teamB');
      if (!gkA && !gkB && unassignedGKs.length >= 2) {
        assignments.set(unassignedGKs[0], 'teamA');
        assignments.set(unassignedGKs[1], 'teamB');
      } else if (gkA && !gkB && unassignedGKs.length >= 1) {
        assignments.set(unassignedGKs[0], 'teamB');
      } else if (!gkA && gkB && unassignedGKs.length >= 1) {
        assignments.set(unassignedGKs[0], 'teamA');
      }
    } else if (selectedGKs.length === 1 && !assignments.has(selectedGKs[0])) {
      assignments.set(selectedGKs[0], 'teamA');
    }

    const unassigned = validPlayers.filter(p => !assignments.has(p));
    let sortedUnassigned = [...unassigned];

    if (algoSettings.balanceRoles) {
      const categorized = sortedUnassigned.map(p => {
        const dbP = dbPlayers.find(x => x.Nome === p);
        const roleName = dbP ? dbP.Ruolo : 'Centrocampista';
        const s = statsData.find(x => x.name === p);
        const golRatio = (s && s.partiteGiocate > 0) ? (s.golFattiSquadra / s.partiteGiocate) : 0;
        return { name: p, role: roleName, golRatio, ovr: getRating(p), macro: '' };
      });

      const wingers = categorized.filter(c => (c.role || '').toLowerCase().includes('ala') || (c.role || '').toLowerCase().includes('jolly'));
      wingers.sort((a,b) => b.golRatio - a.golRatio);
      const half = Math.floor(wingers.length / 2);
      wingers.forEach((w, i) => {
        w.macro = i < half ? 'Offensivo' : 'Difensivo';
      });

      categorized.forEach(c => {
        if (!c.macro) {
          const r = (c.role || '').toLowerCase();
          if (r.includes('difensor') || r.includes('terzino') || r.includes('portiere')) c.macro = 'Difensivo';
          else if (r.includes('attaccante') || r.includes('trequartista') || r.includes('punta')) c.macro = 'Offensivo';
          else c.macro = 'Centrocampo';
        }
      });

      const defs = categorized.filter(c => c.macro === 'Difensivo').sort((a,b) => b.ovr - a.ovr);
      const mids = categorized.filter(c => c.macro === 'Centrocampo').sort((a,b) => b.ovr - a.ovr);
      const offs = categorized.filter(c => c.macro === 'Offensivo').sort((a,b) => b.ovr - a.ovr);
      sortedUnassigned = [...defs, ...mids, ...offs].map(c => c.name);
    } else {
      sortedUnassigned.sort((a, b) => getRating(b) - getRating(a));
    }

    const teamA: string[] = [];
    const teamB: string[] = [];
    let ratingSumA = 0;
    let ratingSumB = 0;

    for (const player of validPlayers) {
      const assigned = assignments.get(player);
      if (assigned === 'teamA' && teamA.length < matchFormat) {
        teamA.push(player);
        ratingSumA += getRating(player);
      } else if (assigned === 'teamB' && teamB.length < matchFormat) {
        teamB.push(player);
        ratingSumB += getRating(player);
      }
    }

    for (const player of sortedUnassigned) {
      const rating = getRating(player);
      if (teamA.length < matchFormat && (teamB.length === matchFormat || ratingSumA <= ratingSumB)) {
        teamA.push(player);
        ratingSumA += rating;
      } else if (teamB.length < matchFormat) {
        teamB.push(player);
        ratingSumB += rating;
      }
    }

    return {
      teamA: finalizeTeamLineup(teamA),
      teamB: finalizeTeamLineup(teamB),
      ratingSumA,
      ratingSumB,
      diff: Math.abs(ratingSumA - ratingSumB)
    };
  };

  const generateTeams = async (forceShuffle: boolean | any = false) => {
    const isShuffleForce = forceShuffle === true;
    setUserOverrideMaglia(null);
    // Validation
    if (selectedPlayers.some(p => !p)) {
      showToast(`Seleziona tutti e ${matchFormat * 2} i nomi prima di continuare`, 'error');
      return;
    }

    // Override logica di "Sostituzione Volante"
    if (!isShuffleForce && matches && matches.length > 0) {
       const latestMatch = matches[0];
       const isToday = new Date(latestMatch.data).toDateString() === new Date().toDateString();
       
       if (isToday && latestMatch.team_a_players && latestMatch.team_b_players && (latestMatch.team_a_players.length + latestMatch.team_b_players.length === matchFormat * 2)) {
          const oldPlayers = [...latestMatch.team_a_players, ...latestMatch.team_b_players];
          const inCommon = selectedPlayers.filter(p => oldPlayers.includes(p));
          
          if (inCommon.length >= (matchFormat * 2) - 3 && inCommon.length < (matchFormat * 2)) {
             const missingOld = oldPlayers.filter(p => !selectedPlayers.includes(p)); 
             const subentrati = selectedPlayers.filter(p => !oldPlayers.includes(p));
             
             if (missingOld.length === subentrati.length) {
                const teamA = [...latestMatch.team_a_players];
                const teamB = [...latestMatch.team_b_players];
                
                for (let i = 0; i < missingOld.length; i++) {
                   const oldP = missingOld[i];
                   const newP = subentrati[i];
                   
                   const idxA = teamA.indexOf(oldP);
                   if (idxA !== -1) teamA[idxA] = newP;
                   
                   const idxB = teamB.indexOf(oldP);
                   if (idxB !== -1) teamB[idxB] = newP;
                }
                
                const newResults = { 
                  teamA: ensureGoalkeeperInGoal(teamA), 
                  teamB: ensureGoalkeeperInGoal(teamB) 
                };
                setResults(newResults);
                await saveSession(newResults);
                setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                showToast(`Sostituzione Volante ( ${missingOld.join(', ')} → ${subentrati.join(', ')} ) applicata!`, 'success');
                return;
             }
          }
       }
    }

    for (const cluster of clusters) {
      if (cluster.members.length < 2) {
        showToast('Ogni cluster deve avere almeno 2 giocatori', 'error');
        return;
      }
      if (cluster.members.length > matchFormat) {
        showToast('Impossibile rispettare tutti i vincoli. Riduci la dimensione dei cluster.', 'error');
        return;
      }
    }

    // 1. Pre-assegnazione bilanciata per cluster
    const assignments = new Map<string, 'teamA' | 'teamB'>();
    
    for (const cluster of clusters) {
        const members = [...cluster.members].sort(() => Math.random() - 0.5);
        const mid = Math.floor(members.length / 2);
        
        // Randomly assign the larger group to either A or B
        const [groupA, groupB] = Math.random() > 0.5 
            ? [members.slice(0, mid), members.slice(mid)]
            : [members.slice(mid), members.slice(0, mid)];

        groupA.forEach(p => assignments.set(p, 'teamA'));
        groupB.forEach(p => assignments.set(p, 'teamB'));
    }

    // 1b. Bilanciamento Portieri: se ci sono portieri selezionati, distribuiamoli tra le due squadre
    const selectedGKs = selectedPlayers.filter(p => isGoalkeeper(p));
    if (selectedGKs.length >= 2) {
        const unassignedGKs = selectedGKs.filter(p => !assignments.has(p));
        const gkA = selectedGKs.find(p => assignments.get(p) === 'teamA');
        const gkB = selectedGKs.find(p => assignments.get(p) === 'teamB');

        if (!gkA && !gkB && unassignedGKs.length >= 2) {
            const shuffled = [...unassignedGKs].sort(() => Math.random() - 0.5);
            assignments.set(shuffled[0], 'teamA');
            assignments.set(shuffled[1], 'teamB');
        } else if (gkA && !gkB && unassignedGKs.length >= 1) {
            assignments.set(unassignedGKs[0], 'teamB');
        } else if (!gkA && gkB && unassignedGKs.length >= 1) {
            assignments.set(unassignedGKs[0], 'teamA');
        }
    } else if (selectedGKs.length === 1) {
        const singleGK = selectedGKs[0];
        if (!assignments.has(singleGK)) {
            assignments.set(singleGK, Math.random() > 0.5 ? 'teamA' : 'teamB');
        }
    }

    // 2. Assegnazione finale (Bilanciamento tramite storico Media Voto)
    const unassignedPlayers = selectedPlayers.filter(p => !assignments.has(p));
    
    let sortedUnassigned = [...unassignedPlayers];

    if (algoSettings.balanceRoles) {
        const categorized = sortedUnassigned.map(p => {
            const dbP = dbPlayers.find(x => x.Nome === p);
            let roleName = dbP ? dbP.Ruolo : 'Centrocampista Centrale';
            const s = statsData.find(x => x.name === p);
            const golRatio = (s && s.partiteGiocate > 0) ? (s.golFattiSquadra / s.partiteGiocate) : 0;
            return { name: p, role: roleName, golRatio, ovr: getRating(p) + (Math.random() * 2 - 1), macro: '' };
        });

        const wingers = categorized.filter(c => (c.role || '').toLowerCase().includes('ala') || (c.role || '').toLowerCase().includes('jolly'));
        wingers.sort((a,b) => b.golRatio - a.golRatio);
        const half = Math.floor(wingers.length / 2);
        wingers.forEach((w, i) => {
            w.macro = i < half ? 'Offensivo' : 'Difensivo';
        });

        categorized.forEach(c => {
            if (!c.macro) {
                const r = (c.role || '').toLowerCase();
                if (r.includes('difensor') || r.includes('terzino') || r.includes('portiere')) c.macro = 'Difensivo';
                else if (r.includes('attaccante') || r.includes('trequartista') || r.includes('punta')) c.macro = 'Offensivo';
                else c.macro = 'Centrocampo';
            }
        });

        const defs = categorized.filter(c => c.macro === 'Difensivo').sort((a,b) => b.ovr - a.ovr);
        const mids = categorized.filter(c => c.macro === 'Centrocampo').sort((a,b) => b.ovr - a.ovr);
        const offs = categorized.filter(c => c.macro === 'Offensivo').sort((a,b) => b.ovr - a.ovr);

        sortedUnassigned = [...defs, ...mids, ...offs].map(c => c.name);
    } else {
        sortedUnassigned.sort((a, b) => {
            return (getRating(b) - getRating(a)) + (Math.random() * 2 - 1); 
        });
    }

    const teamA: string[] = [];
    const teamB: string[] = [];
    let ratingSumA = 0;
    let ratingSumB = 0;

    try {
      // Inseriamo prima i pre-assegnati
      for (const player of selectedPlayers) {
        const assignedTeam = assignments.get(player);
        if (assignedTeam) {
            const rating = getRating(player);
            if (assignedTeam === 'teamA' && teamA.length < matchFormat) {
                teamA.push(player);
                ratingSumA += rating;
            } else if (assignedTeam === 'teamB' && teamB.length < matchFormat) {
                teamB.push(player);
                ratingSumB += rating;
            } else {
               throw new Error('Impossibile rispettare tutti i vincoli. Riduci la dimensione dei cluster.');
            }
        }
      }

      // Distribuiamo i restanti in maniera "Greedy" (al team più debole o con meno giocatori)
      for (const player of sortedUnassigned) {
          const rating = getRating(player);
          // Se la squadra A ha spazio e (B è già piena oppure A è svantaggiata)
          if (teamA.length < matchFormat && (teamB.length === matchFormat || ratingSumA <= ratingSumB)) {
              teamA.push(player);
              ratingSumA += rating;
          } else if (teamB.length < matchFormat) {
              teamB.push(player);
              ratingSumB += rating;
          } else {
              throw new Error('Impossibile completare le squadre');
          }
      }

      if (teamA.length !== matchFormat || teamB.length !== matchFormat) throw new Error('Errore nella generazione');

      const finalTeamA = finalizeTeamLineup(teamA);
      const finalTeamB = finalizeTeamLineup(teamB);

      const newResults = { teamA: finalTeamA, teamB: finalTeamB };
      setResults(newResults);
      await saveSession(newResults);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const fallbackCopyText = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showToast('Link WhatsApp copiati negli appunti! 📋', 'success');
    } catch {
      showToast('Errore durante la copia', 'error');
    }
    document.body.removeChild(textArea);
  };

  const copyMatchMediaToClipboard = (match: MatchResult) => {
    const items = mediaItems.filter(m => m.partita_id === match.id);
    if (items.length === 0) {
      showToast('Nessun video registrato per questa partita', 'info');
      return;
    }

    const fullMatchItems = items.filter(i => i.tipologia === 'Partita Completa');
    const playerItems = items.filter(i => i.tipologia !== 'Partita Completa');

    const cleanUrl = (idOrUrl: string) => {
      if (!idOrUrl) return '';
      const trimmed = idOrUrl.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
      return `https://www.youtube.com/watch?v=${trimmed}`;
    };

    // Group player items by player name
    const playerMap: Record<string, MediaItem[]> = {};
    playerItems.forEach(item => {
      const pName = (item.giocatore || 'Altri').trim();
      if (!playerMap[pName]) playerMap[pName] = [];
      playerMap[pName].push(item);
    });

    // Sort players by: most goals first, then total items
    const sortedPlayers = Object.keys(playerMap).sort((a, b) => {
      const goalsA = playerMap[a].filter(i => i.tipologia === 'Golazo' || i.tipologia === 'Gol').length;
      const goalsB = playerMap[b].filter(i => i.tipologia === 'Golazo' || i.tipologia === 'Gol').length;
      if (goalsB !== goalsA) return goalsB - goalsA;
      return playerMap[b].length - playerMap[a].length;
    });

    const matchDate = new Date(match.data);
    const today = new Date();
    const diffDays = Math.round((today.getTime() - matchDate.getTime()) / (1000 * 3600 * 24));
    const dateLabel = diffDays === 1 ? 'della partita di ieri' : `della partita del ${matchDate.toLocaleDateString('it-IT')}`;

    let message = `⚽🎬 HIGHLIGHTS & GOL | ${(match.team_a_name || 'SQUADRA A').toUpperCase()} - ${(match.team_b_name || 'SQUADRA B').toUpperCase()} 🎬⚽\n\n`;
    message += `Ecco tutti i video dei gol e delle giocate ${dateLabel}! 👇\n\n`;

    sortedPlayers.forEach(pName => {
      message += `👤 ${pName.toUpperCase()}\n`;
      const pClips = playerMap[pName];
      
      const goals = pClips.filter(c => c.tipologia === 'Golazo' || c.tipologia === 'Gol');
      const giocate = pClips.filter(c => c.tipologia === 'Giocata');
      const parate = pClips.filter(c => c.tipologia === 'Paratona' || c.tipologia === 'Parata');
      const fails = pClips.filter(c => c.tipologia === 'Epic Fail');
      const others = pClips.filter(c => !['Golazo', 'Gol', 'Giocata', 'Paratona', 'Parata', 'Epic Fail'].includes(c.tipologia));

      goals.forEach((g, idx) => {
        const label = goals.length > 1 ? `${idx + 1}° Gol` : 'Gol';
        message += `⚽ ${label}: ${cleanUrl(g.youtube_id)}\n`;
      });

      giocate.forEach((g, idx) => {
        const label = giocate.length > 1 ? `${idx + 1}ª Giocata` : 'Giocata';
        message += `✨ ${label}: ${cleanUrl(g.youtube_id)}\n`;
      });

      parate.forEach((p, idx) => {
        const label = parate.length > 1 ? `${idx + 1}ª Paratona` : 'Paratona';
        message += `🧤 ${label}: ${cleanUrl(p.youtube_id)}\n`;
      });

      fails.forEach((f, idx) => {
        const label = fails.length > 1 ? `${idx + 1}° Epic Fail` : 'Epic Fail';
        message += `🤡 ${label}: ${cleanUrl(f.youtube_id)}\n`;
      });

      others.forEach((o) => {
        message += `🎬 ${o.tipologia}: ${cleanUrl(o.youtube_id)}\n`;
      });

      message += `\n`;
    });

    if (fullMatchItems.length > 0) {
      message += `---\n`;
      fullMatchItems.forEach(f => {
        message += `🎥 Partita Completa: ${cleanUrl(f.youtube_id)}\n`;
      });
    }

    const trimmedMsg = message.trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(trimmedMsg).then(() => {
        showToast('Link WhatsApp copiati negli appunti! 📋', 'success');
      }).catch(() => {
        fallbackCopyText(trimmedMsg);
      });
    } else {
      fallbackCopyText(trimmedMsg);
    }
  };

  const copyResults = () => {
    if (!results) return;
    
    const e_soccer = String.fromCodePoint(0x26BD);
    const e_dash = String.fromCodePoint(0x2014);
    const e_ord = String.fromCodePoint(0x00AA);
    const e_cal = String.fromCodePoint(0x1F5D3, 0xFE0F);
    const e_clock = String.fromCodePoint(0x23F0);
    const e_stadium = String.fromCodePoint(0x1F3DF, 0xFE0F);
    const e_pin = String.fromCodePoint(0x1F4CD);
    const e_white = String.fromCodePoint(0x26AA);
    const e_black = String.fromCodePoint(0x26AB);

    const latestMatch = matches.length > 0 ? matches[0] : null;
    let matchHeader = `${e_soccer} *EL FUTBOL* ${e_dash} Squadre del ${new Date().toLocaleDateString('it-IT')}\n\n`;
    
    if (latestMatch) {
       const dateOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
       const formattedDate = new Date(latestMatch.data).toLocaleDateString('it-IT', dateOptions);
       matchHeader = `${e_soccer} *EL FUTBOL* ${e_dash} ${matches.length}${e_ord} Giornata\n${e_cal} *${formattedDate}* - ${e_clock} *${latestMatch.ora}*\n`;
       if (latestMatch.Stadium) {
           matchHeader += `${e_stadium} Stadio: *${latestMatch.Stadium}*\n`;
           const matchCampo = dbCampi.find(c => c.nome === latestMatch.Stadium);
           if (matchCampo && matchCampo.posizione_url) {
               matchHeader += `${e_pin} Posizione: ${matchCampo.posizione_url}\n`;
           }
       }
       matchHeader += `\n`;
    }

    const isSameAsLatest = latestMatch && latestMatch.team_a_name === teamAName && latestMatch.team_b_name === teamBName;
    const defaultLightTeam = isSameAsLatest ? (latestMatch.maglia_chiara || 'A') : 'A';
    const currentLightTeam = userOverrideMaglia || defaultLightTeam;
    
    const getShirtInfo = (team: 'A'|'B') => currentLightTeam === team ? `${e_white} *Maglie Chiare*` : `${e_black} *Maglie Scure*`;

    const text = `${matchHeader}` +
                 `*${teamAName.toUpperCase()}*\n` +
                 `${getShirtInfo('A')}\n` +
                 results.teamA.map((n, i) => `${i + 1}. ${n}`).join('\n') +
                 `\n\n*${teamBName.toUpperCase()}*\n` +
                 `${getShirtInfo('B')}\n` +
                 results.teamB.map((n, i) => `${i + 1}. ${n}`).join('\n') +
                 `\n\nMaggiori informazioni disponibili su https://el-futbol-ten.vercel.app/`;

    navigator.clipboard.writeText(text).then(() => showToast('Risultato copiato!', 'success'));
  };

  const saveFormation = async () => {
    if (!results) return;
    setIsSaving(true);
    const latestMatch = matches.length > 0 ? matches[0] : null;
    const isSameAsLatest = latestMatch && latestMatch.team_a_name === teamAName && latestMatch.team_b_name === teamBName;
    const defaultLightTeam = isSameAsLatest ? (latestMatch.maglia_chiara || 'A') : 'A';
    const currentLightTeam = userOverrideMaglia || defaultLightTeam;

    try {
      const res = await fetch('/api/salva-formazione', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_a_name: teamAName, team_b_name: teamBName, teamAPlayers: results.teamA, teamBPlayers: results.teamB, stadium: selectedStadium, matchLabel, maglia_chiara: currentLightTeam })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore nel salvataggio');
      showToast('Formazione salvata!', 'success');
      setIsSaveFormationModalOpen(false);
      setSaveFormationPassword('');

      // Ricarica l'archivio partite per riflettere subito il nuovo salvataggio
      try {
        const matchesRes = await fetch('/api/risultati', { cache: 'no-store' });
        const matchesData = await matchesRes.json();
        setMatches(Array.isArray(matchesData) ? matchesData : []);
      } catch (refreshErr) {
        console.error('Errore nel refresh archivio partite:', refreshErr);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStadium = async (m: MatchResult) => {
    try {
      const res = await fetch('/api/risultati/stadium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: m.data, ora: m.ora, stadium: stadiumInput })
      });

      const payload = await res.json();

      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Errore salvataggio stadio');
      }

      setMatches(prev =>
        prev.map(match =>
          match.id === m.id ? { ...match, Stadium: payload.match.Stadium } : match
        )
      );

      setEditingStadiumId(null);
      showToast(payload.message || 'Stadio aggiornato!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Errore salvataggio stadio', 'error');
    }
  };

  const updatePlayerVote = async (matchId: number, playerName: string, delta: number) => {
    
    try {
      const res = await fetch('/api/risultati/voti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, playerName, delta })
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.error || 'Errore');
      
      setMatches(prev => prev.map(m => m.id === matchId ? payload.match : m));
      setLeaderboard(payload.leaderboard);
      showToast('Voto aggiornato', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // --- Dynamic Options ---
  const getAvailableOptions = (currentIndex: number) => {
    const otherSelected = selectedPlayers.filter((p, i) => i !== currentIndex && p !== '');
    return dbPlayers.filter(p => !otherSelected.includes(p.Nome));
  };

  const downloadFormationImage = async () => {
    if (!pitchesRef.current) return;
    try {
      setSelectedRolePlayer(null);
      const htmlToImage = await import('html-to-image');
      setLoading(true);

      // 1) Nascondi le liste, header e controlli fuori campo per non averli nel layout del JPEG
      const elementsToHide = pitchesRef.current.querySelectorAll('.team-header, .team-list, .pitch-controls-bar, .role-selector-panel');
      const cards = pitchesRef.current.querySelectorAll('.team-card');
      
      elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');
      
      // 2) Togli le transizioni e l'overflow hidden che causavano il "taglio" del campo
      cards.forEach(c => {
         const el = c as HTMLElement;
         el.style.transition = 'none';
         el.style.overflow = 'visible';
         el.style.paddingBottom = '1.5rem';
      });

      // Lascia al browser il tempo di ricalcolare l'altezza senza le animazioni
      await new Promise(resolve => setTimeout(resolve, 150));

      const dataUrl = await htmlToImage.toJpeg(pitchesRef.current, {
        quality: 0.95,
        backgroundColor: '#0a1017',
        pixelRatio: 2
      });

      // 3) Ripristina il layout originale
      elementsToHide.forEach(el => (el as HTMLElement).style.display = '');
      cards.forEach(c => {
         const el = c as HTMLElement;
         el.style.transition = '';
         el.style.overflow = '';
         el.style.paddingBottom = '';
      });

      const link = document.createElement('a');
      link.download = `formazioni_${new Date().toISOString().split('T')[0]}.jpg`;
      link.href = dataUrl;
      link.click();
      showToast('Immagine scaricata con successo', 'success');
    } catch (e) {
      console.error(e);
      showToast("Errore durante il download dell'immagine.", 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1.5rem' }}>
        <div style={{
          width: '48px', height: '48px',
          border: '4px solid rgba(255,255,255,0.1)',
          borderTopColor: '#5de4ff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ color: '#cfe8d8', fontSize: '1rem', fontWeight: 600 }}>Caricamento dati...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="container">
      <header style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', border: '2px solid rgba(107, 155, 198, 0.6)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.8)', background: '#0a0e14', position: 'relative' }}>
          <img 
            src={headerImage || "/players/header.jpg"} 
            alt="Post Evolution Soccer" 
            style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '350px' }} 
            onError={(e) => {
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
            <label style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', zIndex: 10 }}>
              <Edit size={16} /> Modifica Copertina
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setToast({ message: "Caricamento in corso...", type: "info" });
                const fb = new FormData();
                fb.append('file', file);
                try {
                  const res = await fetch('/api/settings/upload-header', { method: 'POST', body: fb });
                  if (res.ok) {
                    const data = await res.json();
                    if (data.url) setHeaderImage(data.url);
                    setToast({ message: "Copertina aggiornata", type: "success" });
                  } else {
                    setToast({ message: "Errore caricamento", type: "error" });
                  }
                } catch(err) { setToast({ message: "Errore caricamento", type: "error" }); }
              }} />
            </label>
          )}
        </div>
        <div className="header-top" style={{ padding: '0 10px' }}>
          <div className="logo-section">
            <div className="match-info" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div 
                style={{ position: 'relative', display: 'flex', alignItems: 'center', cursor: isAdmin ? 'pointer' : 'default' }}
                onClick={(e) => {
                   if (!isAdmin) return;
                   const input = e.currentTarget.querySelector('input[type="date"]') as HTMLInputElement;
                   if (input && typeof input.showPicker === 'function') {
                      try { input.showPicker(); } catch (err) { input.focus(); }
                   } else if (input) {
                      input.focus();
                   }
                }}
              >
                <Calendar size={14} className="calendar-icon" />
                <span className="match-label-input" style={{ cursor: isAdmin ? 'pointer' : 'default', zIndex: 1, pointerEvents: 'none', paddingRight: '2px' }}>
                  {matchLabel.split(' - ')[0] || "Seleziona data..."}
                </span>
                <input 
                  type="date" 
                  disabled={!isAdmin}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: isAdmin ? 'pointer' : 'default', zIndex: 2, pointerEvents: isAdmin ? 'auto' : 'none' }}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const date = new Date(e.target.value);
                    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
                    const months = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                    
                    const dayName = days[date.getDay()];
                    const dayNum = String(date.getDate()).padStart(2, '0');
                    const monthName = months[date.getMonth()];
                    
                    const currentHour = matchLabel.match(/Ore (\d+)/)?.[1] || "21";
                    
                    const formatted = `${dayName} ${dayNum} ${monthName} - Ore ${currentHour}`;
                    setMatchLabel(formatted);
                    saveSettings(formatted);
                  }}
                />
              </div>
              
              <span className="match-label-input" style={{ fontSize: '0.85rem', width: 'auto', display: 'inline', padding: '0 2px' }}>- Ore</span>
              
              <select 
                value={matchLabel.match(/Ore (\d+)/)?.[1] || "21"}
                disabled={!isAdmin}
                onChange={(e) => {
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
                style={{ background: 'transparent', border: 'none', outline: 'none', cursor: isAdmin ? 'pointer' : 'default', fontSize: '0.85rem', padding: '0', display: 'inline', width: 'auto', appearance: isAdmin ? undefined : 'none', WebkitAppearance: isAdmin ? undefined : 'none', pointerEvents: isAdmin ? 'auto' : 'none' }}
              >
                {[17, 18, 19, 20, 21, 22, 23].map(h => (
                   <option key={h} value={h} style={{ color: 'black' }}>{h}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {session ? (
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.1)', padding: '0.3rem 0.6rem', borderRadius: '20px' }}>
                 <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#4285F4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>
                   {session.user?.email?.[0].toUpperCase()}
                 </div>
                 <span style={{ fontSize: '0.75rem', color: '#cfe8d8', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                   {session.user?.name || session.user?.email}
                 </span>
                 <button onClick={() => signOut()} style={{ background: 'none', border: 'none', color: '#e57373', cursor: 'pointer', fontSize: '0.75rem', padding: 0, fontWeight: 600 }}>Esci</button>
               </div>
            ) : (
               <button onClick={() => signIn('google')} style={{ background: '#4285F4', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>
                 Accedi
               </button>
            )}
            <button className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      <nav style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', padding: '1rem 0', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {[
          { id: 'giocatori', label: '👥 Giocatori' },
          { id: 'cluster', label: '⚡ Cluster' },
          { id: 'archivio', label: '🏆 Partite' },
          { id: 'classifica', label: '🏅 Classifica' },
          { id: 'mvp', label: '⭐ MVP' },
          { id: 'media', label: '🎥 Media' },
          { id: 'stats', label: '📊 Stats' },
          { id: 'awards', label: '🎖️ Awards', url: '/awards' }
        ].map(item => (
          <a key={item.id} href={item.url || `#${item.id}`} style={{ color: '#cfe8d8', textDecoration: 'none', whiteSpace: 'nowrap', fontSize: '0.85rem', fontWeight: 600, padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {item.label}
          </a>
        ))}
      </nav>

      {error && <div className="toast visible error" style={{position:'static', transform:'none', margin:'0 0 2rem 0'}}>{error}</div>}

      {isAdmin && (
        <>
          <section id="giocatori">
        <div style={{display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', marginBottom:'var(--space-4)', gap: '1rem'}}>
            <h2>👥 Giocatori</h2>
            <div style={{display:'flex', flexWrap:'wrap', gap:'var(--space-2)'}}>
                <button className="secondary-btn" onClick={() => setAlgoModalOpen(true)}>
                    Algoritmo
                </button>
                <button className="secondary-btn" onClick={() => setIsManageModalOpen(true)}>
                    Gestisci
                </button>
                <button className="secondary-btn" onClick={() => setIsAddModalOpen(true)}>
                    <Plus size={16}/> Aggiungi
                </button>
            </div>
        </div>
        <div className="players-grid">
          {selectedPlayers.map((val, i) => (
            <CustomDropdown
              key={i}
              index={i}
              value={val}
              options={getAvailableOptions(i)}
              onChange={(name) => handlePlayerChange(i, name)}
              placeholder="Seleziona..."
              loading={loading}
            />
          ))}
        </div>
      </section>

      {algoModalOpen && (
          <div className="modal-overlay" onClick={() => setAlgoModalOpen(false)} style={{zIndex: 1000, alignItems: 'flex-start', paddingTop: 'max(2rem, 5vh)', paddingBottom: '2rem'}}>
              <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '720px', width: '95%', maxHeight: '90vh', overflowY: 'auto'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem'}}>
                      <div>
                        <h3 style={{margin:0, color: '#3da5f5', display: 'flex', alignItems: 'center', gap: '8px'}}>
                          ⚙️ Algoritmo & Pesi Giocatori
                        </h3>
                        <span style={{ fontSize: '0.8rem', color: '#888' }}>
                          Formato attivo: Calcio a {matchFormat} ({matchFormat * 2} giocatori)
                        </span>
                      </div>
                      <button className="secondary-btn" style={{padding:'0.2rem', display:'flex'}} onClick={() => setAlgoModalOpen(false)}><X size={20} /></button>
                  </div>

                  {/* Tab switcher */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.6rem' }}>
                    <button
                      type="button"
                      onClick={() => setAlgoTab('pesi')}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: algoTab === 'pesi' ? 'rgba(61, 165, 245, 0.2)' : 'transparent',
                        color: algoTab === 'pesi' ? '#3da5f5' : '#888',
                        fontWeight: algoTab === 'pesi' ? 700 : 500,
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderBottom: algoTab === 'pesi' ? '2px solid #3da5f5' : '2px solid transparent'
                      }}
                    >
                      ⚖️ Pesi Giocatori ({selectedPlayers.filter(Boolean).length}/{matchFormat * 2})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlgoTab('parametri')}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: algoTab === 'parametri' ? 'rgba(61, 165, 245, 0.2)' : 'transparent',
                        color: algoTab === 'parametri' ? '#3da5f5' : '#888',
                        fontWeight: algoTab === 'parametri' ? 700 : 500,
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderBottom: algoTab === 'parametri' ? '2px solid #3da5f5' : '2px solid transparent'
                      }}
                    >
                      ⚙️ Parametri & Formule
                    </button>
                  </div>

                  {algoTab === 'pesi' && (() => {
                    const validPlayers = selectedPlayers.filter(Boolean);
                    const playersToShow = validPlayers.length > 0
                      ? [...validPlayers].sort((a,b) => getRating(b) - getRating(a))
                      : [...dbPlayers].map(p => p.Nome).sort((a,b) => getRating(b) - getRating(a));
                    
                    const sim = getSimulatedTeams();

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Banner Informativo */}
                        <div style={{
                          background: matchFormat === 8 ? 'rgba(255, 183, 3, 0.08)' : 'rgba(61, 165, 245, 0.08)',
                          border: `1px solid ${matchFormat === 8 ? 'rgba(255, 183, 3, 0.3)' : 'rgba(61, 165, 245, 0.25)'}`,
                          borderRadius: '8px',
                          padding: '0.85rem',
                          fontSize: '0.82rem',
                          color: '#ddd',
                          lineHeight: 1.5
                        }}>
                          {matchFormat === 8 ? (
                            <>
                              <strong style={{ color: '#ffb703', display: 'block', marginBottom: '4px' }}>
                                📌 Nota Partita a Campo a 8 (16 Giocatori)
                              </strong>
                              Non essendo presente uno storico di partite a campo a 8, le previsioni di risultato (1-X-2) sono disabilitate in UI. Qui sotto puoi esaminare i <strong>pesi individuali calcolati dall'algoritmo</strong> per ciascuno dei 16 giocatori (basati su media voto, win rate, gol e MVP) e la <strong>simulazione del bilanciamento</strong> per decidere se affidarti all'algoritmo per creare le squadre o procedere manualmente.
                            </>
                          ) : (
                            <>
                              <strong style={{ color: '#3da5f5', display: 'block', marginBottom: '4px' }}>
                                📌 Graduatoria Pesi Algoritmo (Calcio a {matchFormat})
                              </strong>
                              Visualizza i pesi calcolati dall'algoritmo per ciascun giocatore selezionato. Puoi applicare handicap manuali (+/-) per affinare il bilanciamento.
                            </>
                          )}
                        </div>

                        {validPlayers.length < matchFormat * 2 && (
                          <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#f0ad4e', background: 'rgba(240, 173, 78, 0.1)', padding: '0.5rem', borderRadius: '6px' }}>
                            ⚠️ Selezionati {validPlayers.length} su {matchFormat * 2} giocatori nella griglia principale. 
                            {validPlayers.length === 0 && ' Mostro i pesi di tutti i giocatori registrati.'}
                          </div>
                        )}

                        {/* Elenco Pesi Giocatori */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                          {playersToShow.map((p, idx) => {
                            const dbP = dbPlayers.find(x => x.Nome === p);
                            const l = leaderboard.find(x => x.nome === p);
                            const s = statsData.find(x => x.name === p);
                            
                            const baseVoto = l && l.media_voto > 0 ? l.media_voto : 6.0;
                            const partite = l?.partite_giocate || 0;
                            const winRate = partite > 0 ? Math.round((l.vittorie / partite) * 100) : 50;
                            const off = (s && s.partiteGiocate > 0) ? (s.golFattiSquadra / s.partiteGiocate) : 0;
                            const dif = (s && s.partiteGiocate > 0) ? (s.golSubitiSquadra / s.partiteGiocate) : 0;
                            const diffGol = (off - dif).toFixed(1);
                            const mvp = l?.mvp_count || 0;
                            const role = dbP?.Ruolo || 'Jolly';

                            const baseRating = getRating(p, false);
                            const currentMod = ovrModifiers[p] || 0;
                            const totalRating = (baseRating + currentMod).toFixed(1);

                            return (
                              <div 
                                key={p} 
                                style={{
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between', 
                                  background: 'rgba(255,255,255,0.04)', 
                                  padding: '8px 12px', 
                                  borderRadius: '6px',
                                  border: '1px solid rgba(255,255,255,0.06)',
                                  gap: '8px',
                                  flexWrap: 'wrap'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px', flex: '1 1 auto' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#888', minWidth: '22px' }}>
                                    {idx + 1}°
                                  </span>
                                  <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span>{p}</span>
                                      <span style={{ 
                                        fontSize: '0.68rem', 
                                        padding: '1px 6px', 
                                        borderRadius: '4px', 
                                        background: (role.includes('Difensor') || role.includes('Terzino')) ? 'rgba(52, 152, 219, 0.2)' : role.includes('Attaccan') || role.includes('Punta') ? 'rgba(231, 76, 60, 0.2)' : role.includes('Portiere') ? 'rgba(243, 156, 18, 0.2)' : 'rgba(46, 204, 113, 0.2)',
                                        color: (role.includes('Difensor') || role.includes('Terzino')) ? '#3498db' : role.includes('Attaccan') || role.includes('Punta') ? '#e74c3c' : role.includes('Portiere') ? '#f39c12' : '#2ecc71',
                                        fontWeight: 600
                                      }}>
                                        {role}
                                      </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', color: '#aaa', marginTop: '2px' }}>
                                      <span title="Media Voto">⭐ {baseVoto.toFixed(2)}</span>
                                      <span title="Win Rate">📈 {winRate}%</span>
                                      <span title="Diff Gol Media">⚽ {Number(diffGol) >= 0 ? '+' : ''}{diffGol}</span>
                                      {mvp > 0 && <span title="MVP Totali" style={{ color: '#ffd700' }}>🏅 {mvp}</span>}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  {/* Handicap modifier */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <button 
                                      type="button"
                                      onClick={() => setOvrModifiers({...ovrModifiers, [p]: currentMod - 5})} 
                                      style={{background: '#f55', color: '#fff', border: 'none', borderRadius: '4px', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem'}}
                                      title="Riduci handicap (-5)"
                                    >
                                      -
                                    </button>
                                    <span style={{color: currentMod !== 0 ? (currentMod > 0 ? '#34d680' : '#f55') : '#888', width: '28px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700}}>
                                      {currentMod > 0 ? `+${currentMod}` : currentMod}
                                    </span>
                                    <button 
                                      type="button"
                                      onClick={() => setOvrModifiers({...ovrModifiers, [p]: currentMod + 5})} 
                                      style={{background: '#34d680', color: '#fff', border: 'none', borderRadius: '4px', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem'}}
                                      title="Aumenta handicap (+5)"
                                    >
                                      +
                                    </button>
                                  </div>

                                  {/* Peso Totale */}
                                  <div style={{ textAlign: 'right', minWidth: '55px' }}>
                                    <div style={{ fontSize: '0.68rem', color: '#888', textTransform: 'uppercase' }}>Peso</div>
                                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: currentMod > 0 ? '#34d680' : currentMod < 0 ? '#f55' : '#3da5f5' }}>
                                      {totalRating}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Simulazione Squadre Algoritmo */}
                        {sim && (
                          <div style={{ background: 'rgba(61, 165, 245, 0.06)', border: '1px solid rgba(61, 165, 245, 0.25)', borderRadius: '8px', padding: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '6px' }}>
                              <strong style={{ color: '#3da5f5', fontSize: '0.9rem' }}>
                                🤖 Proposta Bilanciamento Squadre (Calcio a {matchFormat})
                              </strong>
                              <span style={{ 
                                fontSize: '0.78rem', 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                background: sim.diff <= 2 ? 'rgba(52, 214, 128, 0.15)' : 'rgba(240, 173, 78, 0.15)',
                                color: sim.diff <= 2 ? '#34d680' : '#f0ad4e',
                                fontWeight: 700
                              }}>
                                Delta Pesi: {sim.diff.toFixed(1)} pt ({sim.diff <= 2 ? 'Bilanciamento Ottimale' : 'Scarto accettabile'})
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                              {/* Squadra A */}
                              <div style={{ background: 'rgba(30, 144, 255, 0.08)', borderRadius: '6px', padding: '0.6rem', borderTop: '2px solid #1e90ff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
                                  <strong style={{ color: '#5de4ff' }}>SQUADRA A ({sim.teamA.length})</strong>
                                  <span style={{ color: '#5de4ff', fontWeight: 700 }}>Peso Tot: {sim.ratingSumA.toFixed(1)}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.78rem' }}>
                                  {sim.teamA.map(p => (
                                    <div key={p} style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc' }}>
                                      <span>{p}</span>
                                      <span style={{ fontWeight: 600, color: '#8ec5fc' }}>{getRating(p).toFixed(1)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Squadra B */}
                              <div style={{ background: 'rgba(255, 204, 0, 0.08)', borderRadius: '6px', padding: '0.6rem', borderTop: '2px solid #ffcc00' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.82rem' }}>
                                  <strong style={{ color: '#ffcc00' }}>SQUADRA B ({sim.teamB.length})</strong>
                                  <span style={{ color: '#ffcc00', fontWeight: 700 }}>Peso Tot: {sim.ratingSumB.toFixed(1)}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.78rem' }}>
                                  {sim.teamB.map(p => (
                                    <div key={p} style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc' }}>
                                      <span>{p}</span>
                                      <span style={{ fontWeight: 600, color: '#ffe066' }}>{getRating(p).toFixed(1)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {algoTab === 'parametri' && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '1.2rem'}}>
                        <div>
                            <label style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#fff', fontSize: '0.9rem'}}>
                                <span>🏆 Media Voto</span>
                                <span style={{fontWeight: 'bold', color: '#34d680'}}>{algoSettings.wVoto}</span>
                            </label>
                            <input type="range" min="0" max="100" value={algoSettings.wVoto} onChange={e => setAlgoSettings({...algoSettings, wVoto: parseInt(e.target.value)})} style={{width: '100%', cursor: 'pointer'}} />
                        </div>
                        <div>
                            <label style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#fff', fontSize: '0.9rem'}}>
                                <span>📈 Win Rate Storico</span>
                                <span style={{fontWeight: 'bold', color: '#34d680'}}>{algoSettings.wWinRate}</span>
                            </label>
                            <input type="range" min="0" max="100" value={algoSettings.wWinRate} onChange={e => setAlgoSettings({...algoSettings, wWinRate: parseInt(e.target.value)})} style={{width: '100%', cursor: 'pointer'}} />
                        </div>
                        <div>
                            <label style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#fff', fontSize: '0.9rem'}}>
                                <span>⚽ Rapporto Gol Fatti/Subiti</span>
                                <span style={{fontWeight: 'bold', color: '#34d680'}}>{algoSettings.wGolRatio}</span>
                            </label>
                            <input type="range" min="0" max="100" value={algoSettings.wGolRatio} onChange={e => setAlgoSettings({...algoSettings, wGolRatio: parseInt(e.target.value)})} style={{width: '100%', cursor: 'pointer'}} />
                        </div>
                        <div>
                            <label style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#fff', fontSize: '0.9rem'}}>
                                <span>⭐ MVP Ratio</span>
                                <span style={{fontWeight: 'bold', color: '#34d680'}}>{algoSettings.wMvp}</span>
                            </label>
                            <input type="range" min="0" max="100" value={algoSettings.wMvp} onChange={e => setAlgoSettings({...algoSettings, wMvp: parseInt(e.target.value)})} style={{width: '100%', cursor: 'pointer'}} />
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', background: 'rgba(61, 165, 245, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(61, 165, 245, 0.3)'}}>
                            <input type="checkbox" id="balanceRoles" checked={algoSettings.balanceRoles} onChange={e => setAlgoSettings({...algoSettings, balanceRoles: e.target.checked})} style={{width: '20px', height: '20px', cursor: 'pointer'}} />
                            <label htmlFor="balanceRoles" style={{fontWeight: 'bold', color: '#3da5f5', cursor: 'pointer', margin: 0, fontSize: '0.95rem'}}>
                                Bilancia Ruoli & Ali (Jolly)
                            </label>
                        </div>
                    </div>
                  )}

                  <div style={{display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap'}}>
                      {isAdmin && algoTab === 'parametri' && <button className="admin-button" onClick={saveAlgoSettings} style={{flex: 1, minWidth: '120px', padding: '0.8rem', background: '#34d680', color: '#000', fontWeight: 'bold'}}>Salva Impostazioni</button>}
                      {isAdmin && algoTab === 'parametri' && <button className="admin-button" onClick={resetAlgoSettings} style={{flex: 1, minWidth: '160px', padding: '0.8rem', background: '#f0ad4e', color: '#000', fontWeight: 'bold'}}>Ripristina Default</button>}
                      <button className="secondary-btn" style={{flex: 1, padding: '0.8rem'}} onClick={() => setAlgoModalOpen(false)}>Chiudi</button>
                  </div>
              </div>
          </div>
      )}

      {isManageModalOpen && (
          <div className="modal-overlay" onClick={() => setIsManageModalOpen(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                      <h3 style={{margin:0}}>Gestisci Giocatori</h3>
                      <button className="secondary-btn" style={{padding:'0.2rem', display:'flex'}} onClick={() => setIsManageModalOpen(false)}><X size={20} /></button>
                  </div>
                  <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cerca nome..."
                    className="modal-input"
                  />
                  <div className="players-list-scroll" style={{maxHeight:'300px', overflowY:'auto', margin:'1rem 0', border:'1px solid var(--color-border)', borderRadius:'var(--radius-md)'}}>
                    {dbPlayers
                        .filter(p => p.Nome.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(p => (
                            <div 
                                key={p.Nome} 
                                className={`player-row-select ${selectedToDelete.has(p.Nome) ? 'selected' : ''}`}
                                style={{
                                    padding:'0.8rem', borderBottom:'1px solid var(--color-border)',
                                    background: selectedToDelete.has(p.Nome) ? 'rgba(255, 68, 68, 0.15)' : 'transparent',
                                    color: selectedToDelete.has(p.Nome) ? '#ff4444' : 'var(--color-text)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span>{p.Nome}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      {p.Ruolo && <span style={{ fontSize: '0.75rem', color: '#6f9c81' }}>{p.Ruolo}</span>}
                                      {p.RuoloSecondario && <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>• {p.RuoloSecondario}</span>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                    <span 
                                        role="button" 
                                        aria-label="edit" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingPlayerOldName(p.Nome);
                                            setEditingPlayerName(p.Nome);
                                            setEditingPlayerStats({ ...p });
                                            setIsEditModalOpen(true);
                                        }}
                                        style={{ color: 'var(--color-text)', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                    >
                                        <Pencil size={16} />
                                    </span>
                                    <span 
                                        role="button" 
                                        aria-label="remove" 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const next = new Set(selectedToDelete);
                                            if (next.has(p.Nome)) next.delete(p.Nome);
                                            else next.add(p.Nome);
                                            setSelectedToDelete(next);
                                        }}
                                        style={{ 
                                            color: selectedToDelete.has(p.Nome) ? '#ff4444' : 'var(--color-text)', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            cursor: 'pointer',
                                            opacity: selectedToDelete.has(p.Nome) ? 1 : 0.6
                                        }}
                                    >
                                        <X size={18} />
                                    </span>
                                </div>
                            </div>
                    ))}
                  </div>
                  <div style={{display:'flex', gap:'var(--space-2)', marginTop:'var(--space-4)'}}>
                      <button className="secondary-btn" onClick={() => setIsManageModalOpen(false)}>Annulla</button>
                      <button 
                        className="create-teams-btn" 
                        onClick={handleDeletePlayers}
                        disabled={isSaving || selectedToDelete.size === 0}
                      >
                          {isSaving ? 'Salvataggio...' : 'Salva cambiamenti'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {(() => null)()}

      {isEditModalOpen && (() => {
          const baseRoles = ['Portiere', 'Difensore', 'Terzino Sinistro', 'Terzino Destro', 'Centrocampista Centrale', 'Ala', 'Ala Sinistra', 'Ala Destra', 'Trequartista', 'Attaccante'];
          const uniqueRoles = Array.from(new Set([...baseRoles, ...dbPlayers.map(p => p.Ruolo).filter(Boolean), ...dbPlayers.map(p => p.RuoloSecondario).filter(Boolean)]));
          
          const GK_STAT_FIELDS = [
            { key: 'tuffo', label: 'Tuffo' },
            { key: 'presa', label: 'Presa' },
            { key: 'riflessi', label: 'Riflessi' },
            { key: 'piazzamento', label: 'Piazzamento' },
            { key: 'uscite', label: 'Uscite' },
            { key: 'reattivita', label: 'Reattività' },
            { key: 'resistenza', label: 'Resistenza' },
            { key: 'rinvio', label: 'Rinvio' },
            { key: 'rissa', label: 'Rissa' },
            { key: 'altezza', label: 'Altezza' },
            { key: 'peso', label: 'Peso' },
            { key: 'Score', label: 'Score' }
          ] as const;

          const OUTFIELD_STAT_FIELDS = [
            { key: 'velocita', label: 'Velocita' },
            { key: 'accelerazione', label: 'Accelerazione' },
            { key: 'tecnica', label: 'Tecnica' },
            { key: 'contrasto', label: 'Contrasto' },
            { key: 'passaggi', label: 'Passaggi' },
            { key: 'finalizzazione', label: 'Finalizzazione' },
            { key: 'resistenza', label: 'Resistenza' },
            { key: 'dribbling', label: 'Dribbling' },
            { key: 'rissa', label: 'Rissa' },
            { key: 'altezza', label: 'Altezza' },
            { key: 'peso', label: 'Peso' },
            { key: 'Score', label: 'Score' }
          ] as const;

          const isGk = editingPlayerStats.Ruolo === 'Portiere';
          const statFields = isGk ? GK_STAT_FIELDS : OUTFIELD_STAT_FIELDS;
          const textFields = ['Skill', 'piede'] as const;

          return (
          <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
              <div className="modal-content" style={{maxWidth: '650px', width: '95%', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                      <h3 style={{margin:0}}>Modifica Giocatore</h3>
                      <button className="secondary-btn" style={{padding:'0.2rem', display:'flex'}} onClick={() => setIsEditModalOpen(false)}><X size={20} /></button>
                  </div>
                  
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                        <div>
                        <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'block' }}>Nome</label>
                        <input 
                            autoFocus
                            type="text" 
                            className="modal-input"
                            value={editingPlayerName} 
                            onChange={(e) => setEditingPlayerName(e.target.value)}
                            placeholder="Nuovo nome..."
                        />
                        </div>
                        <div>
                        <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'block' }}>Ruolo Preferito</label>
                        <select 
                            value={editingPlayerStats.Ruolo || ''} 
                            onChange={(e) => setEditingPlayerStats(prev => ({...prev, Ruolo: e.target.value}))}
                            className="modal-input" style={{ width: '100%', appearance: 'auto' }}
                        >
                            <option value="">Nessuno</option>
                            {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        </div>
                        <div>
                        <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'block' }}>Ruolo Secondario <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>(Opzionale)</span></label>
                        <select 
                            value={editingPlayerStats.RuoloSecondario || ''} 
                            onChange={(e) => setEditingPlayerStats(prev => ({...prev, RuoloSecondario: e.target.value}))}
                            className="modal-input" style={{ width: '100%', appearance: 'auto' }}
                        >
                            <option value="">Nessuno (Opzionale)</option>
                            {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        </div>
                    </div>

                    <h4 style={{marginTop: '1rem', color: '#6f9c81', borderBottom: '1px solid #23342b', paddingBottom: '0.5rem', margin:0}}>
                      {isGk ? 'Statistiche da Portiere e Fisiche' : 'Statistiche Fisiche e Tecniche'}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                        {statFields.map(f => (
                           <div key={f.key}>
                             <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'block'}}>{f.label}</label>
                             <input 
                               type="number" 
                               className="modal-input"
                               value={editingPlayerStats[f.key as keyof Player]?.toString() || ''} 
                               onChange={(e) => setEditingPlayerStats(prev => ({...prev, [f.key]: e.target.value ? parseInt(e.target.value) : null}))}
                               placeholder="-"
                             />
                           </div> 
                        ))}
                    </div>

                    <div style={{ marginTop: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'block' }}>Figurina / Immagine Profilo</label>
                        <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    setEditingPlayerImage(e.target.files[0]);
                                }
                            }}
                            className="modal-input"
                        />
                    </div>

                    <h4 style={{marginTop: '1rem', color: '#6f9c81', borderBottom: '1px solid #23342b', paddingBottom: '0.5rem', margin:0}}>Altre Informazioni</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                        {textFields.map(f => (
                           <div key={f}>
                             <label style={{textTransform:'capitalize', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'block'}}>{f}</label>
                             <input 
                               type="text" 
                               className="modal-input"
                               value={editingPlayerStats[f as keyof Player]?.toString() || ''} 
                               onChange={(e) => setEditingPlayerStats(prev => ({...prev, [f]: e.target.value}))}
                               placeholder="-"
                             />
                           </div> 
                        ))}
                    </div>

                  </div>
                  
                  <div style={{display:'flex', gap:'var(--space-2)', marginTop:'var(--space-4)'}}>
                      <button className="secondary-btn" onClick={() => setIsEditModalOpen(false)}>Annulla</button>
                      <button className="create-teams-btn" onClick={handleEditPlayerSubmit} disabled={isSaving}>
                        {isSaving ? 'Salvataggio...' : 'Salva'}
                      </button>
                  </div>
              </div>
          </div>
          );
      })()}

      {isAddModalOpen && (() => {
          const baseRoles = ['Portiere', 'Difensore', 'Terzino Sinistro', 'Terzino Destro', 'Centrocampista Centrale', 'Ala', 'Ala Sinistra', 'Ala Destra', 'Trequartista', 'Attaccante'];
          const uniqueRoles = Array.from(new Set([...baseRoles, ...dbPlayers.map(p => p.Ruolo).filter(Boolean), ...dbPlayers.map(p => p.RuoloSecondario).filter(Boolean)]));
          
          const GK_STAT_FIELDS = [
            { key: 'tuffo', label: 'Tuffo' },
            { key: 'presa', label: 'Presa' },
            { key: 'riflessi', label: 'Riflessi' },
            { key: 'piazzamento', label: 'Piazzamento' },
            { key: 'uscite', label: 'Uscite' },
            { key: 'reattivita', label: 'Reattività' },
            { key: 'resistenza', label: 'Resistenza' },
            { key: 'rinvio', label: 'Rinvio' },
            { key: 'rissa', label: 'Rissa' },
            { key: 'altezza', label: 'Altezza' },
            { key: 'peso', label: 'Peso' },
            { key: 'Score', label: 'Score' }
          ] as const;

          const OUTFIELD_STAT_FIELDS = [
            { key: 'velocita', label: 'Velocita' },
            { key: 'accelerazione', label: 'Accelerazione' },
            { key: 'tecnica', label: 'Tecnica' },
            { key: 'contrasto', label: 'Contrasto' },
            { key: 'passaggi', label: 'Passaggi' },
            { key: 'finalizzazione', label: 'Finalizzazione' },
            { key: 'resistenza', label: 'Resistenza' },
            { key: 'dribbling', label: 'Dribbling' },
            { key: 'rissa', label: 'Rissa' },
            { key: 'altezza', label: 'Altezza' },
            { key: 'peso', label: 'Peso' },
            { key: 'Score', label: 'Score' }
          ] as const;

          const isGk = newPlayerStats.Ruolo === 'Portiere';
          const statFields = isGk ? GK_STAT_FIELDS : OUTFIELD_STAT_FIELDS;
          const textFields = ['Skill', 'piede'] as const;

          return (
          <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
              <div className="modal-content" style={{maxWidth: '650px', width: '95%', margin: '0 auto', maxHeight: '90vh', overflowY: 'auto'}} onClick={e => e.stopPropagation()}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                      <h3 style={{margin:0}}>Nuovo Giocatore</h3>
                      <button className="secondary-btn" style={{padding:'0.2rem', display:'flex'}} onClick={() => setIsAddModalOpen(false)}><X size={20} /></button>
                  </div>
                  
                  <div style={{display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem'}}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                        <div>
                        <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'block' }}>Nome</label>
                        <input 
                            autoFocus
                            type="text" 
                            className="modal-input"
                            value={newPlayerName} 
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            placeholder="Nome..."
                        />
                        </div>
                        <div>
                        <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'block' }}>Ruolo Preferito <span style={{color: 'red'}}>*</span></label>
                        <select 
                            value={newPlayerStats.Ruolo || ''} 
                            onChange={(e) => setNewPlayerStats(prev => ({...prev, Ruolo: e.target.value}))}
                            className="modal-input" style={{ width: '100%', appearance: 'auto' }}
                        >
                            <option value="">Nessuno (Obbligatorio)</option>
                            {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        </div>
                        <div>
                        <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'block' }}>Ruolo Secondario <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>(Opzionale)</span></label>
                        <select 
                            value={newPlayerStats.RuoloSecondario || ''} 
                            onChange={(e) => setNewPlayerStats(prev => ({...prev, RuoloSecondario: e.target.value}))}
                            className="modal-input" style={{ width: '100%', appearance: 'auto' }}
                        >
                            <option value="">Nessuno (Opzionale)</option>
                            {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        </div>
                    </div>

                    <div style={{ marginTop: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                           Fondi con storico (Merge) 
                           <span title="Se questo giocatore aveva partecipato in passato come Ospite (es. 'Amico Riccardo'), seleziona qui il suo vecchio nome temporaneo. Tutte le partite e le statistiche associate a quel nome verranno trasferite a questo nuovo profilo." style={{ cursor: 'help', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '16px', height: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>i</span>
                        </label>
                        <select 
                            value={mergeTargetName} 
                            onChange={(e) => setMergeTargetName(e.target.value)}
                            className="modal-input" style={{ width: '100%', appearance: 'auto' }}
                        >
                            <option value="">Nessuno (Nuovo Giocatore)</option>
                            {Array.from(new Set(matches.flatMap(m => [...(m.team_a_players || []), ...(m.team_b_players || [])])))
                                 .filter(name => !dbPlayers.some(p => p.Nome === name) && name !== 'Ospite' && name !== '')
                                 .sort()
                                 .map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>

                    <h4 style={{marginTop: '1rem', color: '#6f9c81', borderBottom: '1px solid #23342b', paddingBottom: '0.5rem', margin:0}}>
                      {isGk ? 'Statistiche da Portiere e Fisiche' : 'Statistiche Fisiche e Tecniche'}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                        {statFields.map(f => (
                           <div key={f.key}>
                             <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'block'}}>{f.label}</label>
                             <input 
                               type="number" 
                               className="modal-input"
                               value={newPlayerStats[f.key as keyof Player]?.toString() || ''} 
                               onChange={(e) => setNewPlayerStats(prev => ({...prev, [f.key]: e.target.value ? parseInt(e.target.value) : null}))}
                               placeholder="-"
                             />
                           </div> 
                        ))}
                    </div>

                    <div style={{ marginTop: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: '#6f9c81', marginBottom: '0.4rem', display: 'block' }}>Figurina / Immagine Profilo</label>
                        <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    setNewPlayerImage(e.target.files[0]);
                                }
                            }}
                            className="modal-input"
                        />
                    </div>

                    <h4 style={{marginTop: '1rem', color: '#6f9c81', borderBottom: '1px solid #23342b', paddingBottom: '0.5rem', margin:0}}>Altre Informazioni</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1rem' }}>
                        {textFields.map(f => (
                           <div key={f}>
                             <label style={{textTransform:'capitalize', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem', display: 'block'}}>{f}</label>
                             <input 
                               type="text" 
                               className="modal-input"
                               value={newPlayerStats[f as keyof Player]?.toString() || ''} 
                               onChange={(e) => setNewPlayerStats(prev => ({...prev, [f]: e.target.value}))}
                               placeholder="-"
                             />
                           </div> 
                        ))}
                    </div>

                  </div>
                  
                  <div style={{display:'flex', gap:'var(--space-2)', marginTop:'var(--space-4)'}}>
                      <button className="secondary-btn" onClick={() => setIsAddModalOpen(false)}>Annulla</button>
                      <button className="create-teams-btn" onClick={handleAddPlayer}>Salva</button>
                  </div>
              </div>
          </div>
          );
      })()}

      <section id="cluster">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <h2 style={{ margin: 0 }}>⚡ Cluster di Vincolo</h2>
          {clusters.length > 0 && (
            <button 
              className="secondary-btn" 
              onClick={() => setIsClustersExpanded(!isClustersExpanded)}
              style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
            >
              {isClustersExpanded ? 'Comprimi' : 'Espandi'}
            </button>
          )}
        </div>
        <p className="section-subtitle">I giocatori dello stesso cluster saranno divisi in squadre diverse</p>
        
        {(isClustersExpanded || clusters.length === 0) && (
          <>
            <div className="clusters-list">
              {clusters.map(c => (
                <div key={c.id} className="cluster-card">
                  <div className="cluster-header">
                    <input 
                      type="text" 
                      className="cluster-name-input" 
                      value={c.name} 
                      onChange={(e) => setClusters(clusters.map(cl => cl.id === c.id ? {...cl, name: e.target.value} : cl))} 
                    />
                    <button className="remove-cluster-btn" onClick={() => removeCluster(c.id)}><X size={20} /></button>
                  </div>
                  <div className="cluster-players-selection">
                    {selectedPlayers.filter(p => p !== '').map(name => {
                       const isSelected = c.members.includes(name);
                       const isTaken = clusters.some(cl => cl.id !== c.id && cl.members.includes(name));
                       return (
                         <div 
                           key={name} 
                           className={`player-chip ${isSelected ? 'selected' : ''} ${isTaken ? 'disabled' : ''}`}
                           onClick={() => !isTaken && toggleMemberInCluster(c.id, name)}
                         >
                           {name}
                         </div>
                       );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button className="add-cluster-btn" onClick={addCluster}>
              <Plus size={18} /> Aggiungi Cluster
            </button>
          </>
        )}
      </section>

      <div className="actions-main">
        <button className="create-teams-btn" onClick={generateTeams} disabled={loading}>
          ⚽ Crea Squadre
        </button>
        <button className="clear-btn" onClick={clearState} disabled={loading}>
          <Trash2 size={20} /> PULISCI
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', gap: '0.5rem', alignItems: 'center' }}>
        <select 
          value={selectedStadium} 
          onChange={(e) => setSelectedStadium(e.target.value)}
          className="stadium-input"
          style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', fontSize: '0.9rem', width: '200px', outline: 'none', textAlign: 'center' }}
        >
          {dbCampi.map(c => (
            <option key={c.id} value={c.nome}>{c.nome}</option>
          ))}
          {dbCampi.length === 0 && <option value="Campi Sole">Campi Sole</option>}
        </select>
        <select 
          value={matchFormat}
          onChange={(e) => {
             const format = parseInt(e.target.value, 10);
             const targetCount = format * 2;
             setMatchFormat(format);
             setSelectedPlayers(prev => {
               if (prev.length < targetCount) {
                 return [...prev, ...Array(targetCount - prev.length).fill('')];
               } else if (prev.length > targetCount) {
                 return prev.slice(0, targetCount);
               }
               return prev;
             });
             if (selectedPlayers.length > targetCount) {
               setClusters(prevClusters => {
                 const keptNames = new Set(selectedPlayers.slice(0, targetCount).filter(Boolean));
                 return prevClusters.map(c => ({
                   ...c,
                   members: c.members.filter(m => keptNames.has(m))
                 }));
               });
             }
             setResults(null);
          }}
          style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)', fontSize: '0.9rem', width: '90px', outline: 'none', textAlign: 'center' }}
        >
          <option value={5}>5vs5</option>
          <option value={6}>6vs6</option>
          <option value={7}>7vs7</option>
          <option value={8}>8vs8</option>
        </select>
        {(matchFormat === 7 || matchFormat === 8) && (
          <button
            type="button"
            onClick={() => setIsModuloModalOpen(true)}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.15) 0%, rgba(41, 128, 185, 0.25) 100%)',
              color: '#3498db',
              border: '1px solid rgba(52, 152, 219, 0.4)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            title="Scegli il modulo tattico di gioco"
          >
            <LayoutGrid size={15} />
            <span>
              Modulo: {matchFormat === 8 
                ? (modulo8TeamA === modulo8TeamB ? modulo8TeamA : `${modulo8TeamA}/${modulo8TeamB}`)
                : (modulo7TeamA === modulo7TeamB ? modulo7TeamA : `${modulo7TeamA}/${modulo7TeamB}`)}
            </span>
            <ChevronDown size={13} style={{ opacity: 0.7 }} />
          </button>
        )}
        <button 
          onClick={() => {
            setCampoModalMode('add');
            setNewCampoName('');
            setNewCampoUrl('');
            setCampoPassword('');
            setSelectedCampoIdToManage(null);
            setIsAddCampoModalOpen(true);
          }}
          style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--color-surface-2)', color: 'var(--color-text)', border: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Aggiungi nuovo campo"
        >
          <Plus size={16} />
        </button>
      </div>
      </>
      )}

      {isModuloModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModuloModalOpen(false)}>
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '640px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.2) 0%, rgba(41, 128, 185, 0.3) 100%)', 
                  padding: '8px', 
                  borderRadius: '8px', 
                  border: '1px solid rgba(52, 152, 219, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#3498db'
                }}>
                  <LayoutGrid size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                    Moduli Tattici • Calcio a {matchFormat}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary, #888)' }}>
                    Seleziona lo schema tattico per la disposizione in campo
                  </p>
                </div>
              </div>
              <button 
                className="secondary-btn" 
                style={{ padding: '0.4rem', display: 'flex', borderRadius: '50%' }} 
                onClick={() => setIsModuloModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Target Team Selector */}
            <div style={{ marginBottom: '1.2rem', background: 'var(--color-surface-2, rgba(255,255,255,0.03))', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary, #aaa)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
                Applica a:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setModuloModalTargetTeam('both')}
                  style={{
                    padding: '0.5rem 0.6rem',
                    borderRadius: '6px',
                    border: moduloModalTargetTeam === 'both' ? '2px solid #3498db' : '1px solid var(--color-border)',
                    background: moduloModalTargetTeam === 'both' ? 'rgba(52, 152, 219, 0.15)' : 'transparent',
                    color: moduloModalTargetTeam === 'both' ? '#3498db' : 'var(--color-text)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Entrambe le Squadre
                </button>
                <button
                  type="button"
                  onClick={() => setModuloModalTargetTeam('A')}
                  style={{
                    padding: '0.5rem 0.6rem',
                    borderRadius: '6px',
                    border: moduloModalTargetTeam === 'A' ? '2px solid #3498db' : '1px solid var(--color-border)',
                    background: moduloModalTargetTeam === 'A' ? 'rgba(52, 152, 219, 0.15)' : 'transparent',
                    color: moduloModalTargetTeam === 'A' ? '#3498db' : 'var(--color-text)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={teamAName}
                >
                  {teamAName}
                </button>
                <button
                  type="button"
                  onClick={() => setModuloModalTargetTeam('B')}
                  style={{
                    padding: '0.5rem 0.6rem',
                    borderRadius: '6px',
                    border: moduloModalTargetTeam === 'B' ? '2px solid #3498db' : '1px solid var(--color-border)',
                    background: moduloModalTargetTeam === 'B' ? 'rgba(52, 152, 219, 0.15)' : 'transparent',
                    color: moduloModalTargetTeam === 'B' ? '#3498db' : 'var(--color-text)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={teamBName}
                >
                  {teamBName}
                </button>
              </div>
            </div>

            {/* Formations Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {(matchFormat === 8 ? [
                {
                  id: '3-3-1' as const,
                  name: '3-3-1',
                  tag: 'CONSIGLIATO',
                  tagColor: '#2ecc71',
                  tagBg: 'rgba(46, 204, 113, 0.15)',
                  tagBorder: 'rgba(46, 204, 113, 0.4)',
                  breakdown: '3 Difensori • 3 Centrocampisti • 1 Punta',
                  desc: 'Lo schema classico del Calcio a 8. Triangolo difensivo solido, mediana a 3 con ali che coprono la fascia e perno centrale d’attacco.',
                  ruoli: ['POR', 'TS', 'DC', 'TD', 'ES', 'CC', 'ED', 'ATT']
                },
                {
                  id: '2-3-2' as const,
                  name: '2-3-2',
                  tag: 'OFFENSIVO',
                  tagColor: '#e74c3c',
                  tagBg: 'rgba(231, 76, 60, 0.15)',
                  tagBorder: 'rgba(231, 76, 60, 0.4)',
                  breakdown: '2 Difensori • 3 Centrocampisti • 2 Punte',
                  desc: 'Assetto a trazione anteriore con due attaccanti che dialogano in area, supportati da una linea di centrocampo a tre e due centrali difensivi.',
                  ruoli: ['POR', 'DC', 'DC', 'ES', 'CC', 'ED', 'ATT', 'ATT']
                },
                {
                  id: '3-2-2' as const,
                  name: '3-2-2',
                  tag: 'DOPPIA PUNTA',
                  tagColor: '#3498db',
                  tagBg: 'rgba(52, 152, 219, 0.15)',
                  tagBorder: 'rgba(52, 152, 219, 0.4)',
                  breakdown: '3 Difensori • 2 Centrocampisti • 2 Punte',
                  desc: 'Massima solidità arretrata con 3 difensori, diga a due davanti alla difesa e tandem offensivo per colpire velocemente.',
                  ruoli: ['POR', 'TS', 'DC', 'TD', 'CC', 'CC', 'ATT', 'ATT']
                },
                {
                  id: '2-4-1' as const,
                  name: '2-4-1',
                  tag: 'POSSESSO PALLA',
                  tagColor: '#9b59b6',
                  tagBg: 'rgba(155, 89, 182, 0.15)',
                  tagBorder: 'rgba(155, 89, 182, 0.4)',
                  breakdown: '2 Difensori • 4 Centrocampisti • 1 Punta',
                  desc: 'Dominio del centro del campo e possesso palla con 4 interpreti a centrocampo (due centrali e due cursori laterali) a supporto dell’unica punta.',
                  ruoli: ['POR', 'DC', 'DC', 'CLS', 'MED', 'MED', 'CLD', 'ATT']
                }
              ] : [
                {
                  id: '2-3-1' as const,
                  name: '2-3-1',
                  tag: 'CONSIGLIATO',
                  tagColor: '#2ecc71',
                  tagBg: 'rgba(46, 204, 113, 0.15)',
                  tagBorder: 'rgba(46, 204, 113, 0.4)',
                  breakdown: '2 Difensori • 3 Centrocampisti • 1 Punta',
                  desc: 'Il modulo universale e più equilibrato nel Calcio a 7. Ampiezza sulle corsie esterne, cervello centrale e attaccante mobile.',
                  ruoli: ['POR', 'DC', 'DC', 'ES', 'CC', 'ED', 'ATT']
                },
                {
                  id: '3-2-1' as const,
                  name: '3-2-1',
                  tag: 'ALBERO DI NATALE',
                  tagColor: '#3498db',
                  tagBg: 'rgba(52, 152, 219, 0.15)',
                  tagBorder: 'rgba(52, 152, 219, 0.4)',
                  breakdown: '3 Difensori • 2 Centrocampisti • 1 Punta',
                  desc: 'Formazione compatta e impenetrabile. 3 difensori puri, 2 centrocampisti di contenimento e punta di sfondamento pronta alle ripartenze.',
                  ruoli: ['POR', 'TS', 'DC', 'TD', 'CC', 'CC', 'ATT']
                },
                {
                  id: '2-2-2' as const,
                  name: '2-2-2',
                  tag: 'A COPPIE',
                  tagColor: '#f39c12',
                  tagBg: 'rgba(243, 156, 18, 0.15)',
                  tagBorder: 'rgba(243, 156, 18, 0.4)',
                  breakdown: '2 Difensori • 2 Centrocampisti • 2 Punte',
                  desc: 'Schema simmetrico con 2 giocatori per linea. Ottimo per pressing alto e verticalizzazioni dirette sulle due punte.',
                  ruoli: ['POR', 'DC', 'DC', 'CC', 'CC', 'ATT', 'ATT']
                },
                {
                  id: '3-1-2' as const,
                  name: '3-1-2',
                  tag: 'DOPPIA PUNTA',
                  tagColor: '#e74c3c',
                  tagBg: 'rgba(231, 76, 60, 0.15)',
                  tagBorder: 'rgba(231, 76, 60, 0.4)',
                  breakdown: '3 Difensori • 1 Mediano • 2 Punte',
                  desc: 'Solidità difensiva con schermo davanti alla difesa e coppia di punte libere di svariare su tutto il fronte offensivo.',
                  ruoli: ['POR', 'TS', 'DC', 'TD', 'MED', 'ATT', 'ATT']
                }
              ]).map((mod) => {
                const isSelected = matchFormat === 8
                  ? (moduloModalTargetTeam === 'both' ? (modulo8TeamA === mod.id && modulo8TeamB === mod.id) : (moduloModalTargetTeam === 'A' ? modulo8TeamA === mod.id : modulo8TeamB === mod.id))
                  : (moduloModalTargetTeam === 'both' ? (modulo7TeamA === mod.id && modulo7TeamB === mod.id) : (moduloModalTargetTeam === 'A' ? modulo7TeamA === mod.id : modulo7TeamB === mod.id));

                return (
                  <div
                    key={mod.id}
                    onClick={() => {
                      if (matchFormat === 8) {
                        const mid = mod.id as '3-3-1' | '2-3-2' | '3-2-2' | '2-4-1';
                        if (moduloModalTargetTeam === 'both') {
                          setModulo8TeamA(mid);
                          setModulo8TeamB(mid);
                        } else if (moduloModalTargetTeam === 'A') {
                          setModulo8TeamA(mid);
                        } else {
                          setModulo8TeamB(mid);
                        }
                      } else {
                        const mid = mod.id as '2-3-1' | '3-2-1' | '2-2-2' | '3-1-2';
                        if (moduloModalTargetTeam === 'both') {
                          setModulo7TeamA(mid);
                          setModulo7TeamB(mid);
                        } else if (moduloModalTargetTeam === 'A') {
                          setModulo7TeamA(mid);
                        } else {
                          setModulo7TeamB(mid);
                        }
                      }
                      showToast(`Modulo ${mod.name} impostato con successo!`, 'success');
                    }}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #3498db' : '1px solid var(--color-border)',
                      background: isSelected ? 'rgba(52, 152, 219, 0.12)' : 'var(--color-surface, rgba(255,255,255,0.02))',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 12px rgba(52, 152, 219, 0.3)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: isSelected ? '#3498db' : 'var(--color-text)' }}>
                          {mod.name}
                        </span>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          color: mod.tagColor,
                          background: mod.tagBg,
                          border: `1px solid ${mod.tagBorder}`,
                          letterSpacing: '0.5px'
                        }}>
                          {mod.tag}
                        </span>
                      </div>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: isSelected ? '2px solid #3498db' : '2px solid var(--color-border)',
                        background: isSelected ? '#3498db' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff'
                      }}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.3rem' }}>
                      {mod.breakdown}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #999)', lineHeight: 1.35, marginBottom: '0.5rem' }}>
                      {mod.desc}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {mod.ruoli.map((r, i) => (
                        <span 
                          key={i}
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: r === 'POR' ? 'rgba(243, 156, 18, 0.2)' : r.includes('D') || r === 'TS' || r === 'TD' ? 'rgba(52, 152, 219, 0.2)' : r === 'ATT' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(46, 204, 113, 0.2)',
                            color: r === 'POR' ? '#f39c12' : r.includes('D') || r === 'TS' || r === 'TD' ? '#3498db' : r === 'ATT' ? '#e74c3c' : '#2ecc71',
                            border: '1px solid rgba(255,255,255,0.08)'
                          }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div style={{ marginTop: '1.2rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '0.8rem' }}>
              <button 
                type="button"
                className="primary-btn" 
                style={{ padding: '0.5rem 1.4rem', fontWeight: 700, fontSize: '0.9rem' }} 
                onClick={() => setIsModuloModalOpen(false)}
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {isPredictionModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPredictionModalOpen(false)}>
          <div 
            className="modal-content" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '680px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, rgba(93, 228, 255, 0.2) 0%, rgba(30, 144, 255, 0.3) 100%)', 
                  padding: '8px', 
                  borderRadius: '8px', 
                  border: '1px solid rgba(93, 228, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#5de4ff'
                }}>
                  <Sliders size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                    Gestisci Previsione & Storico
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary, #888)' }}>
                    Scegli quali partite archiviate considerare per le previsioni
                  </p>
                </div>
              </div>
              <button 
                className="secondary-btn" 
                style={{ padding: '0.4rem', display: 'flex', borderRadius: '50%' }} 
                onClick={() => setIsPredictionModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            {/* Informative Note */}
            <div style={{ background: 'rgba(93, 228, 255, 0.06)', border: '1px solid rgba(93, 228, 255, 0.2)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.2rem', fontSize: '0.82rem', color: '#ccc', lineHeight: 1.4 }}>
              ℹ️ Puoi scegliere se far valere lo storico del Calcio a 5 anche per 6vs6, 7vs7 e 8vs8 (opzione ideale per comitive che giocano spesso a 5), oppure dividere le statistiche per formati separati.
            </div>

            {/* Modal Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
              
              {/* Option 1: ALL (Default) */}
              <div 
                onClick={() => setTempPredictionSettings(prev => ({ ...prev, mode: 'all' }))}
                style={{
                  border: `2px solid ${tempPredictionSettings.mode === 'all' ? '#5de4ff' : 'var(--color-border)'}`,
                  background: tempPredictionSettings.mode === 'all' ? 'rgba(93, 228, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                  borderRadius: '10px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: tempPredictionSettings.mode === 'all' ? '#5de4ff' : '#fff' }}>
                    <span>🌐</span>
                    <span>Tutti i Formati Uniti (Predefinito)</span>
                    <span style={{ fontSize: '0.68rem', background: '#5de4ff', color: '#000', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                      CONSIGLIATO
                    </span>
                  </div>
                  <input 
                    type="radio" 
                    name="predictionMode" 
                    checked={tempPredictionSettings.mode === 'all'} 
                    onChange={() => {}} 
                    style={{ accentColor: '#5de4ff', cursor: 'pointer' }}
                  />
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#aaa', lineHeight: 1.4 }}>
                  Le statistiche di qualsiasi modalità (5, 6, 7, 8) valgono per tutte le altre. Quando giochi a 8 o a 7, le sinergie e i voti del Calcio a 5 vengono utilizzati direttamente per formulare la previsione.
                </p>
              </div>

              {/* Option 2: TRACKS (Due Binari) */}
              <div 
                onClick={() => setTempPredictionSettings(prev => ({ ...prev, mode: 'tracks' }))}
                style={{
                  border: `2px solid ${tempPredictionSettings.mode === 'tracks' ? '#5de4ff' : 'var(--color-border)'}`,
                  background: tempPredictionSettings.mode === 'tracks' ? 'rgba(93, 228, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                  borderRadius: '10px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: tempPredictionSettings.mode === 'tracks' ? '#5de4ff' : '#fff' }}>
                    <span>🛤️</span>
                    <span>Due Binari Separati (5&6 vs 7&8)</span>
                  </div>
                  <input 
                    type="radio" 
                    name="predictionMode" 
                    checked={tempPredictionSettings.mode === 'tracks'} 
                    onChange={() => {}} 
                    style={{ accentColor: '#5de4ff', cursor: 'pointer' }}
                  />
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#aaa', lineHeight: 1.4 }}>
                  Separa i campi piccoli (Calcio a 5 e a 6) dai campi grandi (Calcio a 7 e a 8). Le partite a 8 useranno solo partite archiviate a 7 e a 8.
                </p>
              </div>

              {/* Option 3: STRICT (Rigido) */}
              <div 
                onClick={() => setTempPredictionSettings(prev => ({ ...prev, mode: 'strict' }))}
                style={{
                  border: `2px solid ${tempPredictionSettings.mode === 'strict' ? '#5de4ff' : 'var(--color-border)'}`,
                  background: tempPredictionSettings.mode === 'strict' ? 'rgba(93, 228, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                  borderRadius: '10px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: tempPredictionSettings.mode === 'strict' ? '#5de4ff' : '#fff' }}>
                    <span>🎯</span>
                    <span>Rigoroso per Singolo Formato</span>
                  </div>
                  <input 
                    type="radio" 
                    name="predictionMode" 
                    checked={tempPredictionSettings.mode === 'strict'} 
                    onChange={() => {}} 
                    style={{ accentColor: '#5de4ff', cursor: 'pointer' }}
                  />
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#aaa', lineHeight: 1.4 }}>
                  Ciascuna modalità è completamente isolata: le partite 8vs8 considerano solo partite 8vs8, 7vs7 solo 7vs7, 5vs5 solo 5vs5.
                </p>
              </div>

              {/* Option 4: CUSTOM (Personalizzato) */}
              <div 
                onClick={() => setTempPredictionSettings(prev => ({ 
                  ...prev, 
                  mode: 'custom',
                  customMatrix: prev.customMatrix || { 5: [5, 6, 7, 8], 6: [5, 6, 7, 8], 7: [5, 6, 7, 8], 8: [5, 6, 7, 8] }
                }))}
                style={{
                  border: `2px solid ${tempPredictionSettings.mode === 'custom' ? '#5de4ff' : 'var(--color-border)'}`,
                  background: tempPredictionSettings.mode === 'custom' ? 'rgba(93, 228, 255, 0.08)' : 'rgba(255,255,255,0.02)',
                  borderRadius: '10px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', color: tempPredictionSettings.mode === 'custom' ? '#5de4ff' : '#fff' }}>
                    <span>⚙️</span>
                    <span>Personalizzato per Formato</span>
                  </div>
                  <input 
                    type="radio" 
                    name="predictionMode" 
                    checked={tempPredictionSettings.mode === 'custom'} 
                    onChange={() => {}} 
                    style={{ accentColor: '#5de4ff', cursor: 'pointer' }}
                  />
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#aaa', lineHeight: 1.4 }}>
                  Scegli manualmente con le checkbox quali formati storici attivare per ogni modalità di gioco.
                </p>

                {/* Custom Matrix UI */}
                {tempPredictionSettings.mode === 'custom' && (
                  <div 
                    onClick={e => e.stopPropagation()} 
                    style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <div style={{ fontSize: '0.78rem', color: '#ffcc00', marginBottom: '0.6rem', fontWeight: 600 }}>
                      Seleziona quali storici includere per ciascun formato di match:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {[5, 6, 7, 8].map(targetF => {
                        const currentAllowed = tempPredictionSettings.customMatrix?.[targetF as 5|6|7|8] || [5, 6, 7, 8];
                        return (
                          <div key={targetF} style={{ background: 'rgba(0,0,0,0.25)', padding: '0.5rem 0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', minWidth: '110px' }}>
                              Partita a {targetF}vs{targetF}:
                            </span>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {[5, 6, 7, 8].map(sourceF => {
                                const isChecked = currentAllowed.includes(sourceF);
                                return (
                                  <button
                                    key={sourceF}
                                    type="button"
                                    onClick={() => {
                                      setTempPredictionSettings(prev => {
                                        const mat = { ...(prev.customMatrix || { 5: [5,6,7,8], 6: [5,6,7,8], 7: [5,6,7,8], 8: [5,6,7,8] }) };
                                        const list = mat[targetF as 5|6|7|8] || [];
                                        const nextList = list.includes(sourceF)
                                          ? (list.length > 1 ? list.filter(x => x !== sourceF) : list)
                                          : [...list, sourceF].sort();
                                        mat[targetF as 5|6|7|8] = nextList;
                                        return { ...prev, customMatrix: mat };
                                      });
                                    }}
                                    style={{
                                      background: isChecked ? 'rgba(93, 228, 255, 0.25)' : 'rgba(255,255,255,0.05)',
                                      color: isChecked ? '#5de4ff' : '#666',
                                      border: `1px solid ${isChecked ? '#5de4ff' : 'rgba(255,255,255,0.1)'}`,
                                      borderRadius: '4px',
                                      padding: '3px 8px',
                                      fontSize: '0.75rem',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {isChecked ? '✓ ' : ''}{sourceF}vs{sourceF}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setTempPredictionSettings(defaultPredictionSettings)}
                style={{ fontSize: '0.8rem', color: '#ffcc00' }}
              >
                Ripristina Predefinito
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsPredictionModalOpen(false)}
                >
                  Annulla
                </button>
                <button
                  type="button"
                  className="create-teams-btn"
                  onClick={() => savePredictionSettings(tempPredictionSettings)}
                  style={{ padding: '0.6rem 1.4rem' }}
                >
                  💾 Salva Impostazioni
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {results && (() => {
        const latestMatch = matches.length > 0 ? matches[0] : null;
        const isSameAsLatest = latestMatch && latestMatch.team_a_name === teamAName && latestMatch.team_b_name === teamBName;
        const defaultLightTeam = isSameAsLatest ? (latestMatch.maglia_chiara || 'A') : 'A';
        const currentLightTeam = userOverrideMaglia || defaultLightTeam;

        const handleToggleMaglia = async () => {
          const newVal = currentLightTeam === 'A' ? 'B' : 'A';
          setUserOverrideMaglia(newVal);
          try {
              const res = await fetch('/api/session/update-maglia', {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ maglia_chiara: newVal })
              });
              if (!res.ok) throw new Error();

              const latestMatch = matches.length > 0 ? matches[0] : null;
              const isSameAsLatest = latestMatch && latestMatch.team_a_name === teamAName && latestMatch.team_b_name === teamBName;
              if (isSameAsLatest && latestMatch && latestMatch.maglia_chiara !== newVal) {
                  await fetch('/api/risultati/update-maglia', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: latestMatch.id, maglia_chiara: newVal })
                  });
                  setMatches(matches.map(m => m.id === latestMatch.id ? { ...m, maglia_chiara: newVal } : m));
              }

              showToast('Maglie invertite con successo!', 'success');
          } catch {
              setUserOverrideMaglia(currentLightTeam as 'A'|'B');
              showToast('Errore nel salvataggio maglie', 'error');
          }
        };
        
        return (
        <section className="results-section" ref={resultsRef} style={{display:'block'}}>
          <div className="teams-container" ref={pitchesRef}>
            {[ { team: 'A', name: teamAName, setName: setTeamAName, list: results.teamA, cls: 'team-falchi' },
               { team: 'B', name: teamBName, setName: setTeamBName, list: results.teamB, cls: 'team-aquile' }
            ].map(t => (
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
                  {isAdmin && <Pencil size={16} style={{opacity:0.5, cursor: 'pointer'}} />}
                </label>
                <ul className="team-list">
                  {t.list.map(name => {
                    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                    const hue = hashStringToHue(name);
                    
                    const isSwapTarget = isAdmin && activeSwapSource && activeSwapSource.team !== (t.team === 'A' ? 'teamA' : 'teamB');
                    const isSwapSource = isAdmin && activeSwapSource?.name === name;
                    const playerObj = dbPlayers.find(p => p.Nome === name);
                    const ruolo = playerObj?.Ruolo;
                    const ruoloSec = playerObj?.RuoloSecondario;
                    const morale = getPlayerMorale(name);

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
                                handleSwap(activeSwapSource!.name, activeSwapSource!.team, name, t.team === 'A' ? 'teamA' : 'teamB');
                            }
                        }}
                      >
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                            <div className="avatar" style={{background: `hsl(${hue}, 60%, 45%)`}}>{initials}</div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <span className="player-name">{name}</span>
                                    {ruolo && (
                                        <span style={{ 
                                            background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(30,40,50,0.6) 100%)', 
                                            padding: '2px 5px', 
                                            borderRadius: '2px', 
                                            fontSize: '0.6rem', 
                                            fontWeight: 'bold', 
                                            color: '#e0e0e0',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            boxShadow: 'inset 0 0 5px rgba(0,0,0,0.5)'
                                        }}>
                                            {getRoleAbbreviation(ruolo)}
                                        </span>
                                    )}
                                    <span title={morale.title} style={{ display: 'flex' }}>
                                        <PesMorale condition={morale.condition} />
                                    </span>
                                </div>
                                {ruolo && (
                                  <span style={{ fontSize: '0.75rem', color: '#6f9c81', marginTop: '0.1rem' }}>
                                    {ruolo}{ruoloSec ? ` (Sec: ${ruoloSec})` : ''}
                                  </span>
                                )}
                            </div>
                        </div>
                        {isAdmin && (
                          <button 
                              className="swap-icon-btn" 
                              onClick={(e) => { e.stopPropagation(); setActiveSwapSource({name, team: t.team === 'A' ? 'teamA' : 'teamB'}); }}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '0.4rem', color: isSwapSource ? '#fff' : 'rgba(255,255,255,0.4)' }}
                          >
                              ⇄
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {(() => {
                  const activeModulo7 = t.team === 'A' ? modulo7TeamA : modulo7TeamB;
                  const activeModulo8 = t.team === 'A' ? modulo8TeamA : modulo8TeamB;
                  const positions = getPitchPositionsForTeam(t.list.length, activeModulo7, activeModulo8);
                  const currentTeamKey = t.team === 'A' ? 'teamA' : 'teamB';

                  return (
                    <>
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
                                  handleSwap(activeSwapSource!.name, activeSwapSource!.team, name, currentTeamKey);
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
                                      handleRoleSwap(currentTeamKey, selectedRolePlayer.index, idx);
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
                                  setActiveSwapSource({name, team: currentTeamKey});
                                } else {
                                  setSelectedPlayerForCard(name);
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
                                  setSelectedPlayerForCard(p);
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
                                  onClick={() => handleRoleSwap(currentTeamKey, selectedRolePlayer.index, sIdx)}
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
                    </>
                  );
                })()}

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
                        onClick={handleToggleMaglia}
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
                        onClick={() => {
                          setModuloModalTargetTeam(t.team === 'A' ? 'A' : 'B');
                          setIsModuloModalOpen(true);
                        }}
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
            ))}
          </div>
          
          {(() => {
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
              let key = tA < tB ? `${tA}_${tB}_${scoreA}-${scoreB}` : `${tB}_${tA}_${scoreB}-${scoreA}`;
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
                Object.entries(vt).forEach(([p, voto]) => {
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
                Object.entries(m.voti_giocatori).forEach(([p, voto]) => {
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
                if (m.voti_giocatori && typeof m.voti_giocatori[p] === 'number' && m.voti_giocatori[p] > 0) {
                  trackPlayerStats[p].sommaVoti += m.voti_giocatori[p];
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
              const matchDetails: { overlap: number, maxOverlap: number, pastFormat: number, result: string, originalResult: string, weight: number, date: string, players: string[], teamNameA: string, teamNameB: string, isOnSideA: boolean }[] = [];

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
            
            let finalPredA = baseAvg + (scartoGol / 2);
            let finalPredB = baseAvg - (scartoGol / 2);
            
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
                    onClick={() => { setTempPredictionSettings(predictionSettings); setIsPredictionModalOpen(true); }}
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
                        onClick={() => { setTempPredictionSettings(predictionSettings); setIsPredictionModalOpen(true); }}
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
                    <button className="secondary-btn" onClick={() => generateTeams(true)}><RotateCcw size={18} /> Rimescola</button>
                  )}
                  {isAdmin && (
                    <button className="secondary-btn" onClick={handleToggleMaglia}><ArrowLeftRight size={18} /> Cambia Maglie</button>
                  )}
                  {(matchFormat === 7 || matchFormat === 8) && (
                    <button className="secondary-btn" onClick={() => { setModuloModalTargetTeam('both'); setIsModuloModalOpen(true); }}>
                      <LayoutGrid size={18} /> Modulo
                    </button>
                  )}
                  <button className="secondary-btn" onClick={copyResults}><Copy size={18} /> Copia Formazioni</button>
                  <button className="secondary-btn" onClick={copyStats}><MessageCircle size={18} /> Copia Stats</button>
                  <button className="secondary-btn" onClick={downloadFormationImage}><Download size={18} /> Scarica JPEG</button>
                  <button 
                    className="secondary-btn" 
                    onClick={() => { setTempPredictionSettings(predictionSettings); setIsPredictionModalOpen(true); }}
                    title="Configura se unificare le statistiche a 5 con 6vs6, 7vs7, 8vs8 o separarle"
                  >
                    <Sliders size={18} /> Gestisci Previsione
                  </button>
                </div>

                {isAdmin && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                    <button className="create-teams-btn" onClick={saveFormation} disabled={isSaving} style={{ width: '100%', maxWidth: '400px' }}>
                        {isSaving ? 'Salvataggio...' : '💾 Salva Formazione'}
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </section>
        );
      })()}

      <section className="archive-typography" id="archivio">
        <h2><Trophy size={20} style={{verticalAlign:'-3px', marginRight:'0.4rem', color:'#e8b339'}} />Archivio Partite</h2>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
           <div style={{ position: 'relative', flex: '1 1 120px' }}>
             <input 
                type="text" 
                placeholder="Mese (es. Giugno)" 
                value={archiveMonthFilter} 
                onChange={e => setArchiveMonthFilter(e.target.value)}
                onFocus={() => setActiveFilterDropdown('month')}
                onBlur={() => setTimeout(() => setActiveFilterDropdown(null), 200)}
                style={{ 
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text)',
                    outline: 'none',
                    fontSize: '0.9rem',
                    colorScheme: theme
                }}
             />
             {activeFilterDropdown === 'month' && (
                <div className="dropdown-panel" style={{ zIndex: 100, position: 'absolute', top: '100%', left: 0, width: '100%', maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                   {['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
                     .filter(m => m.toLowerCase().includes(archiveMonthFilter.toLowerCase()))
                     .map(m => (
                        <div key={m} className="dropdown-option" onClick={() => { setArchiveMonthFilter(m); setActiveFilterDropdown(null); }}>{m}</div>
                     ))}
                </div>
             )}
           </div>

           <div style={{ position: 'relative', flex: '1 1 100px' }}>
             <input 
                type="text" 
                placeholder="Anno (es. 2026)" 
                value={archiveYearFilter} 
                onChange={e => setArchiveYearFilter(e.target.value)}
                onFocus={() => setActiveFilterDropdown('year')}
                onBlur={() => setTimeout(() => setActiveFilterDropdown(null), 200)}
                style={{ 
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text)',
                    outline: 'none',
                    fontSize: '0.9rem',
                    colorScheme: theme
                }}
             />
             {activeFilterDropdown === 'year' && (
                <div className="dropdown-panel" style={{ zIndex: 100, position: 'absolute', top: '100%', left: 0, width: '100%', maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                   {Array.from(new Set(matches.map(m => new Date(m.data).getFullYear()))).sort((a,b)=>b-a)
                     .filter(y => y.toString().includes(archiveYearFilter.trim()))
                     .map(y => (
                        <div key={y} className="dropdown-option" onClick={() => { setArchiveYearFilter(y.toString()); setActiveFilterDropdown(null); }}>{y}</div>
                     ))}
                </div>
             )}
           </div>

           <div style={{ position: 'relative', flex: '1 1 120px' }}>
             <input 
                type="text" 
                placeholder="Giocatore (es. Mattia)" 
                value={archivePlayerFilter} 
                onChange={e => setArchivePlayerFilter(e.target.value)}
                onFocus={() => setActiveFilterDropdown('player')}
                onBlur={() => setTimeout(() => setActiveFilterDropdown(null), 200)}
                style={{ 
                    width: '100%',
                    padding: '0.6rem 1rem',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--color-text)',
                    outline: 'none',
                    fontSize: '0.9rem',
                    colorScheme: theme
                }}
             />
             {activeFilterDropdown === 'player' && (
                <div className="dropdown-panel" style={{ zIndex: 100, position: 'absolute', top: '100%', left: 0, width: '100%', maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                   {dbPlayers && [...dbPlayers].sort((a,b)=>a.Nome.localeCompare(b.Nome))
                     .filter(p => p.Nome.toLowerCase().includes(archivePlayerFilter.toLowerCase().trim()))
                     .map(p => (
                        <div key={p.Nome} className="dropdown-option" onClick={() => { setArchivePlayerFilter(p.Nome); setActiveFilterDropdown(null); }}>{p.Nome}</div>
                     ))}
                </div>
             )}
           </div>
        </div>

        {filteredArchiveMatches.length === 0 ? (
          <p className="section-subtitle">Nessuna partita trovata</p>
        ) : (
          <div className="matches-list">
            {filteredArchiveMatches.map(m => {
              const isExpanded = expandedMatchId === m.id;
              const isEditing = editingStadiumId === m.id;
              const isLightOnA = (m.maglia_chiara || 'A') === 'A';
              const scorersA = normalizeScorers(m.marcatori_a);
              const scorersB = normalizeScorers(m.marcatori_b);
              const [scoreA, scoreB] = (m.risultato || '0-0').split('-').map(s => s.trim());

              const mDate = new Date(m.data);
              const isInterruptedMatch = mDate.getDate() === 8 && mDate.getMonth() === 6 && mDate.getFullYear() === 2026 && m.ora && m.ora.startsWith('21');

              return (
                <div key={m.id} className={`match-card ${isExpanded ? 'expanded' : ''}`} style={isInterruptedMatch ? { filter: 'grayscale(1)', opacity: 0.6 } : {}}>
                  <div
                    className="match-summary"
                    onClick={() => setExpandedMatchId(isExpanded ? null : m.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setExpandedMatchId(isExpanded ? null : m.id)}
                  >
                    <div className="match-meta-row">
                      <span className="match-meta" style={{color: 'var(--color-primary)'}}>
                         {m.Stadium || 'Seidita'}
                      </span>
                      <span className="match-meta">
                        <Calendar size={13} />
                        {formatResultDate(m.data)}
                      </span>
                      <span className="match-meta match-meta-time">{formatResultTime(m.ora)}</span>
                    </div>
                    {isInterruptedMatch && (
                      <div style={{ textAlign: 'center', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '4px', marginBottom: '4px' }}>
                        Non valida ai fini della classifica
                      </div>
                    )}

                    <div className="match-score-area">
                      <div className="match-team match-team-a">
                        <span className="match-team-name">{m.team_a_name}</span>
                        <span className="match-tag">
                            {isLightOnA ? 'MAGLIE CHIARE' : 'MAGLIE SCURE'}
                        </span>
                      </div>

                      <div className="match-scoreboard">
                        <span className="score-num">{scoreA}</span>
                        <span className="score-sep">–</span>
                        <span className="score-num">{scoreB}</span>
                      </div>

                      <div className="match-team match-team-b">
                        <span className="match-team-name">{m.team_b_name}</span>
                        <span className="match-tag">
                            {isLightOnA ? 'MAGLIE SCURE' : 'MAGLIE CHIARE'}
                        </span>
                      </div>
                    </div>

                    <ChevronDown size={18} className={`match-chevron ${isExpanded ? 'rotated' : ''}`} />
                  </div>

                  {isExpanded && (
                    <div className="match-details">
                      {hasScorers(m) && (
                        <div className="scorers-detail">
                          <span className="scorers-label">⚽ Marcatori</span>
                          <div className="scorers-row">
                            <span className="scorers-team">{scorersA || '—'}</span>
                            <span className="scorers-divider" />
                            <span className="scorers-team">{scorersB || '—'}</span>
                          </div>
                        </div>
                      )}
                      <div className="formations-detail">
                        <div className="formation-team">
                          <span className="formation-title">{m.team_a_name}</span>
                          <ul className="formation-players">
                            {m.team_a_players.map(name => {
                              const vote = m.voti_giocatori?.[name];
                              return (
                                <li key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>{name}</span>
                                  {m.risultato && m.risultato !== '0-0' && (() => {
                                    let matchMVPs: string[] = [];
                                    if (m.mvps && m.mvps.length > 0) {
                                      matchMVPs = typeof m.mvps === 'string' ? JSON.parse(m.mvps) : (Array.isArray(m.mvps) ? m.mvps : []);
                                    } else {
                                      const allVotes = Object.values(m.voti_giocatori || {}).map(v => Number(v) || 0);
                                      const maxV = allVotes.length > 0 ? Math.max(...allVotes) : 0;
                                      if (maxV > 0 && m.voti_giocatori) {
                                        matchMVPs = Object.keys(m.voti_giocatori).filter(p => m.voti_giocatori![p] === maxV);
                                      }
                                    }
                                    const isMvp = matchMVPs.includes(name);
                                    return (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                        {isMvp && <span title="MVP" style={{ display: 'flex' }}><Medal size={14} style={{ color: '#FFD700' }} /></span>}
                                        <span style={{ fontWeight: 'bold', minWidth: '16px', textAlign: 'center', color: getVoteColor(vote) }}>{vote ?? '-'}</span>
                                      </div>
                                    );
                                  })()}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                        <div className="formation-team formation-team-b">
                          <span className="formation-title">{m.team_b_name}</span>
                          <ul className="formation-players">
                            {m.team_b_players.map(name => {
                              const vote = m.voti_giocatori?.[name];
                              return (
                                <li key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span>{name}</span>
                                  {m.risultato && m.risultato !== '0-0' && (() => {
                                    let matchMVPs: string[] = [];
                                    if (m.mvps && m.mvps.length > 0) {
                                      matchMVPs = typeof m.mvps === 'string' ? JSON.parse(m.mvps) : (Array.isArray(m.mvps) ? m.mvps : []);
                                    } else {
                                      const allVotes = Object.values(m.voti_giocatori || {}).map(v => Number(v) || 0);
                                      const maxV = allVotes.length > 0 ? Math.max(...allVotes) : 0;
                                      if (maxV > 0 && m.voti_giocatori) {
                                        matchMVPs = Object.keys(m.voti_giocatori).filter(p => m.voti_giocatori![p] === maxV);
                                      }
                                    }
                                    const isMvp = matchMVPs.includes(name);
                                    return (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                                        {isMvp && <span title="MVP" style={{ display: 'flex' }}><Medal size={14} style={{ color: '#FFD700' }} /></span>}
                                        <span style={{ fontWeight: 'bold', minWidth: '16px', textAlign: 'center', color: getVoteColor(vote) }}>{vote ?? '-'}</span>
                                      </div>
                                    );
                                  })()}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                      {historicalPredictions.preds[m.id]?.correct && (
                        <div style={{ textAlign: 'center', color: '#69f0ae', fontSize: '0.85rem', fontWeight: 'bold', margin: '0 0 1rem 0', padding: '0.5rem', background: 'rgba(105, 240, 174, 0.1)', borderRadius: '6px' }}>
                          ✨ Partita indovinata dall'algoritmo
                        </div>
                      )}
                      {mediaItems.some(x => x.partita_id === m.id) && (
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '0.8rem 0' }}>
                          <button
                            type="button"
                            className="secondary-btn"
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '6px', 
                              fontSize: '0.85rem', 
                              padding: '0.45rem 1.1rem', 
                              borderColor: 'rgba(37, 211, 102, 0.4)', 
                              color: '#25D366',
                              background: 'rgba(37, 211, 102, 0.12)',
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              copyMatchMediaToClipboard(m);
                            }}
                          >
                            <Copy size={14} />
                            <span>Copia Link Video</span>
                          </button>
                        </div>
                      )}
                      {isAdmin && (
                      <div className="match-footer" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button
                          type="button"
                          className="swap-shirts-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUpdatingMatchId(m.id);
                            const [sA, sB] = (m.risultato || '0-0').split('-').map(s => s.trim());
                            setUpdateScoreA(sA || '0');
                            setUpdateScoreB(sB || '0');
                            setUpdateScorersA(parseScorers(m.marcatori_a));
                            setUpdateScorersB(parseScorers(m.marcatori_b));
                            setUpdateVoti(m.voti_giocatori || {});
                            setUpdateMVPs(Array.isArray(m.mvps) ? m.mvps : (typeof m.mvps === 'string' ? JSON.parse(m.mvps) : []));
                            setTouchedVoti(new Set());
                            setUpdatePassword('');
                            setIsUpdateModalOpen(true);
                          }}
                        >
                          <Pencil size={14} />
                          <span>Aggiorna Risultato</span>
                        </button>
                        <button
                          type="button"
                          className="swap-shirts-btn"
                          style={{ color: '#ff6b6b', borderColor: 'rgba(255, 107, 107, 0.3)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setUpdatingMatchId(m.id);
                            setUpdatePassword('');
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Elimina Partita</span>
                        </button>
                      </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

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
                  const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                  const hue = hashStringToHue(name);
                  return (
                    <div key={name} className="weekly-stats-player-row">
                      <div className="avatar" style={{ background: `hsl(${hue}, 60%, 45%)` }}>{initials}</div>
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
                    const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                    const hue = hashStringToHue(name);
                    return (
                      <div key={name} className="weekly-stats-player-row">
                        <div className="avatar" style={{ background: `hsl(${hue}, 60%, 45%)` }}>{initials}</div>
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

      <section className="dashboard-card" id="classifica" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <h2 style={{ margin: 0 }}><Medal size={20} style={{verticalAlign:'-3px', marginRight:'0.4rem', color:'#e8b339'}} />Classifica</h2>
          <button
            className="secondary-btn"
            onClick={fetchLeaderboard}
            disabled={isLoadingLeaderboard}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}
          >
            <RotateCcw size={14} className={isLoadingLeaderboard ? 'spin' : ''} />
            {isLoadingLeaderboard ? 'Aggiornamento...' : 'Aggiorna Classifica'}
          </button>
        </div>
        <p className="section-subtitle" style={{ marginBottom: '1rem' }}>
          Classifica individuale calcolata sui risultati delle partite in archivio.
        </p>

         <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
           <button 
             onClick={() => setSortConfig({ key: 'punti_assoluti', direction: 'desc' })}
             style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', border: '1px solid #34d680', background: sortConfig?.key !== 'forma_punti' ? '#34d680' : 'transparent', color: sortConfig?.key !== 'forma_punti' ? '#0d1511' : '#34d680', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
           >
             Generale
           </button>
           <button 
             onClick={() => setSortConfig({ key: 'forma_punti', direction: 'desc' })}
             style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', border: '1px solid #34d680', background: sortConfig?.key === 'forma_punti' ? '#34d680' : 'transparent', color: sortConfig?.key === 'forma_punti' ? '#0d1511' : '#34d680', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
           >
             Stato di Forma
           </button>
           <button 
             onClick={() => setIsSfidaModalOpen(true)}
             style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', border: '1px solid #3da5f5', background: 'transparent', color: '#3da5f5', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
           >
             ⚔️ Sfida
           </button>
           <button 
             onClick={() => setShowGuests(!showGuests)}
             style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', border: '1px solid #6f9c81', background: showGuests ? 'transparent' : 'rgba(111, 156, 129, 0.15)', color: '#6f9c81', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', marginLeft: 'auto' }}
           >
             {showGuests ? '- Nascondi Guest' : '+ Guest'}
           </button>
        </div>

        {isLoadingLeaderboard ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6f9c81' }}>Caricamento classifica...</div>
        ) : leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6f9c81' }}>Nessun dato disponibile per la classifica.</div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(52, 214, 128, 0.16)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(52, 214, 128, 0.08)', borderBottom: '1px solid rgba(52, 214, 128, 0.16)' }}>
                  <th style={{ padding: '0.8rem', textAlign: 'left', color: '#9fd9b6', fontWeight: 600 }}>Pos</th>
                  <th style={{ padding: '0.8rem', textAlign: 'left', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('nome')}>
                    Nome {sortConfig?.key === 'nome' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('punti_assoluti')}>
                    Punti {sortConfig?.key === 'punti_assoluti' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('partite_giocate')}>
                    Giocate {sortConfig?.key === 'partite_giocate' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('vittorie')}>
                    V {sortConfig?.key === 'vittorie' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('pareggi')}>
                    P {sortConfig?.key === 'pareggi' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('sconfitte')}>
                    S {sortConfig?.key === 'sconfitte' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('media_voto')}>
                    Media Voto {sortConfig?.key === 'media_voto' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('mvp_count')}>
                    MVP 🏅 {sortConfig?.key === 'mvp_count' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('pt_partita')}>
                    Pt/Partita {sortConfig?.key === 'pt_partita' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('gol_fatti')}>
                    Gol {sortConfig?.key === 'gol_fatti' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('ruolo')}>
                    Ruolo {sortConfig?.key === 'ruolo' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#9fd9b6', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }} onClick={() => requestSort('forma_punti')}>
                    Forma {sortConfig?.key === 'forma_punti' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedLeaderboard.map((row, index) => {
                  const playerRole = dbPlayers.find(p => p.Nome === row.nome)?.Ruolo;
                  const isFormMode = sortConfig?.key === 'forma_punti';
                  
                  let dispPunti = row.punti_assoluti;
                  let dispGiocate = row.partite_giocate;
                  let dispV = row.vittorie ?? 0;
                  let dispP = row.pareggi ?? 0;
                  let dispS = row.sconfitte ?? 0;
                  let dispPtPartita = typeof row.pt_partita === 'number' ? row.pt_partita : parseFloat(row.pt_partita || '0');

                  if (isFormMode && row.forma) {
                    const letters = row.forma.split('-').filter(Boolean);
                    dispPunti = row.forma_punti || 0;
                    dispGiocate = letters.length;
                    dispV = letters.filter((l: string) => l === 'V').length;
                    dispP = letters.filter((l: string) => l === 'N').length;
                    dispS = letters.filter((l: string) => l === 'P').length;
                    dispPtPartita = dispGiocate > 0 ? dispPunti / dispGiocate : 0;
                  }

                  return (
                    <tr key={row.nome} style={{ borderBottom: index < sortedLeaderboard.length - 1 ? '1px solid rgba(52, 214, 128, 0.08)' : 'none', background: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.2)' }}>
                      <td style={{ padding: '0.8rem', textAlign: 'left', color: '#cfe8d8', fontWeight: index < 3 ? 'bold' : 'normal' }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}°`}
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'left', color: '#cfe8d8', fontWeight: 600 }}>{row.nome}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#e8b339', fontWeight: 'bold' }}>
                        {dispPunti}
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#cfe8d8' }}>{dispGiocate}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#81c784' }}>{dispV}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#e0e0e0' }}>{dispP}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#e57373' }}>{dispS}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#f39c12', fontWeight: 'bold' }}>
                        {row.media_voto && row.media_voto > 0 ? row.media_voto.toFixed(2) : '-'}
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#FFD700', fontWeight: 'bold' }}>
                        {(row.mvp_count || 0) > 0 ? row.mvp_count : '-'}
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#cfe8d8' }}>
                        {dispPtPartita.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#cfe8d8' }}>{row.gol_fatti}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#6f9c81', fontSize: '0.8rem' }}>{getRoleAbbr(playerRole)}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px' }}>
                        {(() => {
                           let details: any[] = [];
                           try {
                             if (row.forma_dettagli) {
                               details = typeof row.forma_dettagli === 'string' ? JSON.parse(row.forma_dettagli) : row.forma_dettagli;
                             }
                           } catch (e) {}

                           return (row.forma || '').split('-').map((letter: string, idx: number) => {
                             if (!letter) return null;
                             const bColor = letter === 'V' ? '#81c784' : letter === 'N' ? '#e0e0e0' : '#e57373';
                             
                             let hoverText = "Nessun dettaglio";
                             if (details[idx]) {
                               const d = details[idx];
                               hoverText = `${d.data} - Risultato: ${d.risultato}`;
                             }

                             return (
                               <span key={idx} title={hoverText} style={{ color: bColor, margin: '0 2px', cursor: 'help' }}>{letter}</span>
                             );
                           });
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboard-card" id="mvp" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <h2 style={{ margin: 0 }}><Medal size={20} style={{verticalAlign:'-3px', marginRight:'0.4rem', color:'#FFD700'}} />Classifica MVP</h2>
        </div>
        <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
          I migliori giocatori per numero di MVP conquistati.
        </p>
        
        {isLoadingLeaderboard ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6f9c81' }}>Caricamento classifica...</div>
        ) : leaderboard.filter(r => (r.mvp_count || 0) > 0).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6f9c81' }}>Nessun MVP assegnato finora.</div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(255, 215, 0, 0.16)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 215, 0, 0.08)', borderBottom: '1px solid rgba(255, 215, 0, 0.16)' }}>
                  <th style={{ padding: '0.8rem', textAlign: 'left', color: '#FFD700', fontWeight: 600 }}>Pos</th>
                  <th style={{ padding: '0.8rem', textAlign: 'left', color: '#FFD700', fontWeight: 600 }}>Nome</th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#FFD700', fontWeight: 600 }}>MVP 🏅</th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', color: '#FFD700', fontWeight: 600 }}>Media Voto</th>
                </tr>
              </thead>
              <tbody>
                {[...leaderboard]
                  .filter(row => (row.mvp_count || 0) > 0)
                  .sort((a, b) => {
                     const aMvp = a.mvp_count || 0;
                     const bMvp = b.mvp_count || 0;
                     if (bMvp !== aMvp) return bMvp - aMvp;
                     const aMedia = a.media_voto || 0;
                     const bMedia = b.media_voto || 0;
                     return bMedia - aMedia;
                  })
                  .map((row, index, arr) => (
                    <tr key={row.nome} style={{ borderBottom: index < arr.length - 1 ? '1px solid rgba(255, 215, 0, 0.08)' : 'none', background: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.2)' }}>
                      <td style={{ padding: '0.8rem', textAlign: 'left', color: '#cfe8d8', fontWeight: index < 3 ? 'bold' : 'normal' }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}°`}
                      </td>
                      <td style={{ padding: '0.8rem', textAlign: 'left', color: '#cfe8d8', fontWeight: 600 }}>{row.nome}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#FFD700', fontWeight: 'bold' }}>{row.mvp_count}</td>
                      <td style={{ padding: '0.8rem', textAlign: 'center', color: '#f39c12', fontWeight: 'bold' }}>{row.media_voto ? row.media_voto.toFixed(2) : '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboard-card" id="media" style={{ marginTop: '2rem' }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem', cursor: 'pointer' }}
          onClick={() => {
            const nextState = !isMediaArchiveOpen;
            setIsMediaArchiveOpen(nextState);
            if (nextState && !mediaFilterPartita) {
               if (matches.length > 0) {
                 const matchWithMedia = matches.find(m => mediaItems.some(media => media.partita_id === m.id));
                 if (matchWithMedia) {
                   setMediaFilterPartita(String(matchWithMedia.id));
                 } else {
                   setMediaFilterPartita(String(matches[0].id));
                 }
               }
            }
          }}
        >
          <h2 style={{ margin: 0 }}><Video size={20} style={{verticalAlign:'-3px', marginRight:'0.4rem', color:'#3498db'}} />Archivio Media</h2>
          <ChevronDown size={20} className={`match-chevron ${isMediaArchiveOpen ? 'rotated' : ''}`} />
        </div>
        
        {isMediaArchiveOpen && (() => {
          const selectedMatch = mediaFilterPartita ? matches.find(m => m.id === Number(mediaFilterPartita)) : null;
          const matchPlayers = selectedMatch ? [...(selectedMatch.team_a_players || []), ...(selectedMatch.team_b_players || [])] : [];
          
          return (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <p className="section-subtitle" style={{ margin: 0 }}>
                Esplora i video delle partite. Puoi filtrare per partita, giocatore o tipologia.
              </p>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button 
                    className="create-teams-btn" 
                    style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => {
                      if (!mediaFilterPartita) { showToast('Seleziona prima una partita dal filtro', 'error'); return; }
                      setNewMediaYoutubeUrl(''); setNewMediaAutori([]); setNewMediaCoAutori([]); setNewMediaTipologia(''); setNewMediaPassword('');
                      setIsAddMediaModalOpen(true);
                    }}
                  >
                    <Plus size={16} /> Aggiungi Media
                  </button>
                  <button 
                    className="secondary-btn" 
                    style={{ 
                      fontSize: '0.85rem', 
                      padding: '0.4rem 1rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.4rem',
                      borderColor: 'rgba(52, 152, 219, 0.4)',
                      background: 'rgba(52, 152, 219, 0.15)',
                      color: '#cfe8d8'
                    }}
                    onClick={() => {
                      setIsBulkMediaModalOpen(true);
                    }}
                  >
                    <Upload size={16} style={{ color: '#3498db' }} /> Carica Media in Blocco (.txt / Excel)
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', position: 'relative' }}>
               <SearchableDropdown 
                 value={mediaFilterPartita} 
                 onChange={setMediaFilterPartita}
                 placeholder="Tutte le Partite"
                 options={matches.map(m => ({ value: String(m.id), label: `${new Date(m.data).toLocaleDateString('it-IT')} - ${m.team_a_name} vs ${m.team_b_name}` }))}
               />

               <SearchableDropdown 
                 value={mediaFilterGiocatore} 
                 onChange={setMediaFilterGiocatore}
                 placeholder="Tutti i Giocatori"
                 options={dbPlayers.map(p => ({ value: p.Nome, label: p.Nome }))}
               />

               <SearchableDropdown 
                 value={mediaFilterTipologia} 
                 onChange={setMediaFilterTipologia}
                 placeholder="Tutte le Tipologie"
                 options={[
                   { value: 'Partita Completa', label: 'Partita Completa' },
                   { value: 'Giocata', label: 'Giocata' },
                   { value: 'Epic Fail', label: 'Epic Fail' },
                   { value: 'Golazo', label: 'Golazo' },
                   { value: 'Paratona', label: 'Parata / Paratona' }
                 ]}
               />
            </div>

            {selectedMatch && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(52, 152, 219, 0.2)', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.8rem', color: '#6f9c81' }}>
                  <span>{selectedMatch.Stadium || 'Campo'}</span>
                  <span>{new Date(selectedMatch.data).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span>{selectedMatch.ora ? selectedMatch.ora.substring(0, 5) : ''}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginBottom: '0.8rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#cfe8d8', textAlign: 'right', flex: 1 }}>{selectedMatch.team_a_name}</span>
                  <div style={{ background: 'rgba(52, 152, 219, 0.2)', padding: '0.3rem 0.8rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', color: '#3498db', letterSpacing: '2px' }}>
                    {selectedMatch.risultato || '0 - 0'}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#cfe8d8', textAlign: 'left', flex: 1 }}>{selectedMatch.team_b_name}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9fd9b6', marginBottom: '0.3rem', textAlign: 'center' }}>{selectedMatch.team_a_name}</div>
                    {selectedMatch.team_a_players.map(name => {
                      const vote = selectedMatch.voti_giocatori?.[name];
                      const allVotes = Object.values(selectedMatch.voti_giocatori || {}).map(v => Number(v) || 0);
                      const maxV = allVotes.length > 0 ? Math.max(...allVotes) : 0;
                      const isMvp = vote !== undefined && vote === maxV && maxV > 0;
                      return (
                        <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#cfe8d8', padding: '1px 0' }}>
                          <span>{name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isMvp && <Medal size={12} style={{ color: '#FFD700' }} />}
                            <span style={{ fontWeight: 'bold', color: getVoteColor(vote) }}>{vote ?? '-'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ width: '1px', background: 'rgba(52, 152, 219, 0.2)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9fd9b6', marginBottom: '0.3rem', textAlign: 'center' }}>{selectedMatch.team_b_name}</div>
                    {selectedMatch.team_b_players.map(name => {
                      const vote = selectedMatch.voti_giocatori?.[name];
                      const allVotes = Object.values(selectedMatch.voti_giocatori || {}).map(v => Number(v) || 0);
                      const maxV = allVotes.length > 0 ? Math.max(...allVotes) : 0;
                      const isMvp = vote !== undefined && vote === maxV && maxV > 0;
                      return (
                        <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#cfe8d8', padding: '1px 0' }}>
                          <span>{name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {isMvp && <Medal size={12} style={{ color: '#FFD700' }} />}
                            <span style={{ fontWeight: 'bold', color: getVoteColor(vote) }}>{vote ?? '-'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', borderTop: '1px solid rgba(52, 152, 219, 0.15)', paddingTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => copyMatchMediaToClipboard(selectedMatch)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(37, 211, 102, 0.15)',
                      border: '1px solid rgba(37, 211, 102, 0.45)',
                      color: '#25D366',
                      borderRadius: '8px',
                      padding: '0.45rem 1.2rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Copy size={15} />
                    <span>Copia Link Video</span>
                  </button>
                </div>
              </div>
            )}

            <div>
              {(() => {
                const filteredMedia = mediaItems.filter(m => {
                  if (mediaFilterPartita && String(m.partita_id) !== mediaFilterPartita) return false;
                  if (mediaFilterTipologia) {
                    const matchTip = m.tipologia === mediaFilterTipologia ||
                      (mediaFilterTipologia === 'Paratona' && m.tipologia === 'Parata') ||
                      (mediaFilterTipologia === 'Parata' && m.tipologia === 'Paratona');
                    if (!matchTip) return false;
                  }
                  
                  if (mediaFilterGiocatore) {
                    let playerMatches = false;
                    if (m.giocatore?.includes(mediaFilterGiocatore) || m.co_giocatore?.includes(mediaFilterGiocatore)) {
                      playerMatches = true;
                    } else {
                      const match = matches.find(x => x.id === m.partita_id);
                      if (match) {
                        const inTeamA = match.team_a_players?.includes(mediaFilterGiocatore);
                        const inTeamB = match.team_b_players?.includes(mediaFilterGiocatore);
                        const playedInMatch = inTeamA || inTeamB;
                        
                        if (m.tipologia === 'Partita Completa' && playedInMatch) {
                          playerMatches = true;
                        }
                        else if (m.giocatore === match.team_a_name && inTeamA) playerMatches = true;
                        else if (m.giocatore === match.team_b_name && inTeamB) playerMatches = true;
                        else if (m.co_giocatore === match.team_a_name && inTeamA) playerMatches = true;
                        else if (m.co_giocatore === match.team_b_name && inTeamB) playerMatches = true;
                      }
                    }
                    
                    if (!playerMatches) return false;
                  }
                  
                  return true;
                });

                if (filteredMedia.length === 0) {
                   return <div style={{ textAlign: 'center', padding: '2rem', color: '#6f9c81' }}>Nessun video {mediaFilterPartita ? 'per questa partita' : 'presente'}.</div>;
                }

                const renderMediaCard = (m: MediaItem, isLarge = false) => (
                  <div key={m.id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden', width: '100%', maxWidth: isLarge ? '800px' : 'none', margin: isLarge ? '0 auto' : '0' }}>
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                      <iframe 
                        src={`https://www.youtube.com/embed/${m.youtube_id}`} 
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      ></iframe>
                    </div>
                    <div style={{ padding: '0.8rem' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                         <span style={{ fontSize: '0.8rem', background: 'rgba(52, 152, 219, 0.2)', color: '#3498db', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{m.tipologia}</span>
                         <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                           {m.giocatore && <span style={{ fontSize: '0.8rem', color: '#9fd9b6', fontWeight: 600 }}>{m.giocatore}</span>}
                           {m.co_giocatore && <span style={{ fontSize: '0.75rem', color: '#6f9c81' }}>& {m.co_giocatore}</span>}
                           {isAdmin && (
                             <>
                               <button 
                                 onClick={() => setEditingMedia(m)}
                                 style={{ background: 'transparent', border: 'none', color: '#f59e0b', cursor: 'pointer', padding: '0 2px', marginLeft: '4px', opacity: 0.9 }}
                                 title="Modifica video"
                               >
                                 <Pencil size={13} />
                               </button>
                               <button 
                                 onClick={async () => {
                                   if (!confirm('Eliminare questo video dall\'archivio?')) return;
                                   try {
                                     const delRes = await fetch(`/api/media?id=${m.id}`, { method: 'DELETE' });
                                     if (delRes.ok) {
                                       showToast('Video eliminato!', 'success');
                                       setMediaItems(prev => prev.filter(x => x.id !== m.id));
                                     } else {
                                       showToast('Errore eliminazione', 'error');
                                     }
                                   } catch {
                                     showToast('Errore di connessione', 'error');
                                   }
                                 }}
                                 style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', padding: '0 2px', marginLeft: '3px', opacity: 0.8 }}
                                 title="Elimina video"
                               >
                                 <Trash2 size={13} />
                               </button>
                             </>
                           )}
                         </div>
                       </div>
                       {!mediaFilterPartita && (
                         <div style={{ fontSize: '0.75rem', color: '#6f9c81' }}>
                           {(() => {
                             const match = matches.find(x => x.id === m.partita_id);
                             if (!match) return `Partita ID ${m.partita_id}`;
                             return `${new Date(match.data).toLocaleDateString('it-IT')} - ${match.team_a_name} vs ${match.team_b_name}`;
                           })()}
                         </div>
                       )}
                    </div>
                  </div>
                );

                const partitaCompleta = filteredMedia.filter(m => m.tipologia === 'Partita Completa');
                const otherMedia = filteredMedia.filter(m => m.tipologia !== 'Partita Completa');
                
                const groupedMedia = otherMedia.reduce((acc, m) => {
                  if (!acc[m.tipologia]) acc[m.tipologia] = [];
                  acc[m.tipologia].push(m);
                  return acc;
                }, {} as Record<string, MediaItem[]>);

                const categoryOrder = ['Golazo', 'Epic Fail', 'Giocata'];
                const sortedCategories = Object.keys(groupedMedia).sort((a, b) => {
                  const idxA = categoryOrder.indexOf(a);
                  const idxB = categoryOrder.indexOf(b);
                  if (idxA === -1 && idxB === -1) return a.localeCompare(b);
                  if (idxA === -1) return 1;
                  if (idxB === -1) return -1;
                  return idxA - idxB;
                });

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {partitaCompleta.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                        {partitaCompleta.map(m => renderMediaCard(m, true))}
                      </div>
                    )}
                    
                    {sortedCategories.map(tipologia => (
                      <div key={tipologia} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#e8b339', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>{tipologia}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                          {groupedMedia[tipologia].map(m => renderMediaCard(m, false))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
          );
        })()}
      </section>

      <section className="dashboard-card" id="stats" style={{ marginTop: '2rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <h2 style={{ margin: 0 }}><BarChart2 size={20} style={{verticalAlign:'-3px', marginRight:'0.4rem', color:'#e8b339'}} />Statistiche</h2>
        </div>
        <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
          Statistiche generali e andamento voti.
        </p>

        {statsData.length > 0 ? (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#cfe8d8' }}>Andamento Media Voto</h3>
                <MultiSelectDropdown 
                  selectedValues={statsSelectedPlayers} 
                  onChange={(vals) => {
                    setStatsSelectedPlayers(vals);
                    setHiddenTrendPlayers([]);
                  }}
                  placeholder="Tutti i Giocatori"
                  hasAllOption={true}
                  options={statsData.map(p => ({ value: p.name, label: p.name }))}
                />
              </div>
              
              <div style={{ width: '100%', height: 320, background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  {statsSelectedPlayers.length === 1 ? (
                    <LineChart data={statsData.find(p => p.name === statsSelectedPlayers[0])?.votiTrend || []} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="data" stroke="#9fd9b6" fontSize={12} tickMargin={10} />
                      <YAxis domain={[4, 10]} stroke="#9fd9b6" fontSize={12} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1a2a3a', borderColor: '#3a4a5a', color: '#cfe8d8' }}
                        itemStyle={{ color: '#e8b339' }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px', cursor: 'pointer', userSelect: 'none' }}
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
                                textDecoration: isHidden ? 'line-through' : 'none',
                                opacity: isHidden ? 0.45 : 1,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              {value}
                            </span>
                          );
                        }}
                      />
                      <Line type="monotone" dataKey="voto" name={`Voto ${statsSelectedPlayers[0]}`} stroke="#3498db" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} hide={hiddenTrendPlayers.includes(`Voto ${statsSelectedPlayers[0]}`) || hiddenTrendPlayers.includes('voto')} />
                      <Line type="monotone" dataKey="mediaCumulativa" name="Media Cumulativa" stroke="#e8b339" strokeWidth={2} strokeDasharray="5 5" dot={false} hide={hiddenTrendPlayers.includes('Media Cumulativa') || hiddenTrendPlayers.includes('mediaCumulativa')} />
                    </LineChart>
                  ) : (
                    <LineChart data={trendChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="data" stroke="#9fd9b6" fontSize={12} tickMargin={10} />
                      <YAxis domain={[4, 10]} stroke="#9fd9b6" fontSize={12} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1a2a3a', borderColor: '#3a4a5a', color: '#cfe8d8' }}
                        itemStyle={{ color: '#cfe8d8' }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px', cursor: 'pointer', userSelect: 'none' }}
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
                                textDecoration: isHidden ? 'line-through' : 'none',
                                opacity: isHidden ? 0.45 : 1,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                            >
                              {value}
                            </span>
                          );
                        }}
                      />
                      {(statsSelectedPlayers.length > 0 
                        ? statsSelectedPlayers 
                        : statsData.filter(p => p.partiteGiocate >= (trendChartData.length / 2)).map(p => p.name)
                      ).map((playerName, idx) => (
                        <Line 
                          key={playerName}
                          type="monotone" 
                          dataKey={playerName} 
                          name={playerName} 
                          stroke={["#3498db", "#e74c3c", "#2ecc71", "#f1c40f", "#9b59b6", "#e67e22", "#1abc9c", "#34495e", "#ff7979", "#badc58"][idx % 10]} 
                          strokeWidth={2} 
                          dot={statsSelectedPlayers.length > 0 ? { r: 3 } : false} 
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
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#cfe8d8' }}>Gol Segnati e Subiti (di Squadra)</h3>
              <div style={{ width: '100%', height: Math.max(400, statsData.length * 45), background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '1rem 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                    <XAxis type="number" stroke="#9fd9b6" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="#9fd9b6" fontSize={12} width={90} tick={{fill: '#cfe8d8'}} tickFormatter={(t) => typeof t === 'string' && t.length > 12 ? t.slice(0, 12) + '...' : t} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1a2a3a', borderColor: '#3a4a5a', color: '#cfe8d8' }}
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="golFattiSquadra" name="Gol Segnati" fill="#2ecc71" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="golSubitiSquadra" name="Gol Subiti" fill="#e74c3c" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6f9c81' }}>Nessun dato statistico disponibile.</div>
        )}
      </section>

      {isAddMediaModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddMediaModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Aggiungi Media</h3>
              <button className="secondary-btn" style={{ padding: '0', background: 'transparent', border: 'none', color: '#9fd9b6', cursor: 'pointer' }} onClick={() => setIsAddMediaModalOpen(false)}><X size={20} /></button>
            </div>
            <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
              Aggiungi un video YouTube per la partita selezionata.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#6f9c81', marginBottom: '0.3rem', fontWeight: 600 }}>Link YouTube *</label>
              <input 
                type="text" 
                value={newMediaYoutubeUrl} 
                onChange={e => setNewMediaYoutubeUrl(e.target.value)} 
                placeholder="https://www.youtube.com/watch?v=..." 
                className="modal-input" 
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#6f9c81', marginBottom: '0.3rem', fontWeight: 600 }}>Autore/i (Protagonisti)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {(() => {
                  const sm = matches.find(m => m.id === Number(mediaFilterPartita));
                  if (!sm) return <span style={{fontSize:'0.8rem', color:'#6f9c81'}}>Seleziona una partita</span>;
                  const players = [...(sm.team_a_players || []), ...(sm.team_b_players || [])];
                  if (players.length === 0) return <span style={{fontSize:'0.8rem', color:'#6f9c81'}}>Nessun giocatore in questa partita</span>;
                  
                  return players.map(p => (
                    <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#cfe8d8', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={newMediaAutori.includes(p)}
                        onChange={(e) => {
                          if (e.target.checked) setNewMediaAutori([...newMediaAutori, p]);
                          else setNewMediaAutori(newMediaAutori.filter(a => a !== p));
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      {p}
                    </label>
                  ));
                })()}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#6f9c81', marginBottom: '0.3rem', fontWeight: 600 }}>Co-Autore/i (opzionale)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                {(() => {
                  const sm = matches.find(m => m.id === Number(mediaFilterPartita));
                  if (!sm) return <span style={{fontSize:'0.8rem', color:'#6f9c81'}}>Seleziona una partita</span>;
                  const players = [...(sm.team_a_players || []), ...(sm.team_b_players || [])].filter(p => !newMediaAutori.includes(p));
                  if (players.length === 0) return <span style={{fontSize:'0.8rem', color:'#6f9c81'}}>Nessun co-autore disponibile</span>;
                  
                  return players.map(p => (
                    <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#cfe8d8', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={newMediaCoAutori.includes(p)}
                        onChange={(e) => {
                          if (e.target.checked) setNewMediaCoAutori([...newMediaCoAutori, p]);
                          else setNewMediaCoAutori(newMediaCoAutori.filter(a => a !== p));
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      {p}
                    </label>
                  ));
                })()}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#6f9c81', marginBottom: '0.3rem', fontWeight: 600 }}>Categoria Video *</label>
              <select className="modal-input" value={newMediaTipologia} onChange={e => setNewMediaTipologia(e.target.value)} style={{ width: '100%' }}>
                <option value="">-- Seleziona --</option>
                <option value="Partita Completa">Partita Completa</option>
                <option value="Giocata">Giocata</option>
                <option value="Epic Fail">Epic Fail</option>
                <option value="Golazo">Golazo</option>
                <option value="Paratona">Paratona</option>
              </select>
            </div>



            <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
              <button className="secondary-btn" onClick={() => setIsAddMediaModalOpen(false)}>Annulla</button>
              <button className="create-teams-btn" onClick={handleAddMedia} disabled={isSavingMedia}>{isSavingMedia ? 'Salvataggio...' : 'Salva'}</button>
            </div>
          </div>
        </div>
      )}

      {isBulkMediaModalOpen && (
        <BulkMediaModal 
          isOpen={isBulkMediaModalOpen}
          onClose={() => setIsBulkMediaModalOpen(false)}
          matches={matches}
          dbPlayers={dbPlayers}
          initialMatchId={mediaFilterPartita}
          onSuccess={async (count) => {
            const mediaRes = await fetch('/api/media', { cache: 'no-store' });
            const mediaData = await mediaRes.json().catch(() => []);
            setMediaItems(Array.isArray(mediaData) ? mediaData : []);
          }}
          showToast={showToast}
        />
      )}

      {editingMedia && (
        <EditMediaModal
          isOpen={!!editingMedia}
          media={editingMedia}
          matches={matches}
          onClose={() => setEditingMedia(null)}
          onSaveSuccess={(updated) => {
            setMediaItems(prev => prev.map(m => m.id === updated.id ? updated : m));
          }}
          showToast={showToast}
        />
      )}


      {isUpdateModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '450px' }}>
                  <h3>Aggiorna Risultato</h3>
                  <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
                    Modifica il risultato e i marcatori della partita
                  </p>
                  
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9fd9b6', marginBottom: '0.4rem', textAlign: 'center' }}>
                            {updatingMatch?.team_a_name}
                          </span>
                          <input 
                            type="number" 
                            min="0" 
                            value={updateScoreA} 
                            onChange={e => setUpdateScoreA(e.target.value)} 
                            style={{ width: '70px', textAlign: 'center', fontSize: '1.2rem', padding: '0.5rem' }} 
                            className="modal-input" 
                          />
                      </div>
                      <span style={{ fontSize: '1.5rem', color: '#4f7560', alignSelf: 'flex-end', marginBottom: '0.5rem' }}>-</span>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#9fd9b6', marginBottom: '0.4rem', textAlign: 'center' }}>
                            {updatingMatch?.team_b_name}
                          </span>
                          <input 
                            type="number" 
                            min="0" 
                            value={updateScoreB} 
                            onChange={e => setUpdateScoreB(e.target.value)} 
                            style={{ width: '70px', textAlign: 'center', fontSize: '1.2rem', padding: '0.5rem' }} 
                            className="modal-input" 
                          />
                      </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <label style={{ fontSize: '0.8rem', color: '#6f9c81' }}>
                            Formazione e Voti {updatingMatch?.team_a_name}
                          </label>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {updatingMatch?.team_a_players?.map(player => {
                          const mode = goalMode[player] || 'G';
                          const playerKey = mode === 'G' ? player : `${player} (AG)`;
                          const targetTeam = mode === 'G' ? 'A' : 'B';
                          const count = (targetTeam === 'A' ? updateScorersA : updateScorersB)[playerKey] || 0;
                          const vote = updateVoti[player] !== undefined ? updateVoti[player] : 6;
                          return (
                            <div key={player} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                               <span style={{ fontSize: '0.9rem', color: '#cfe8d8', fontWeight: 500, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player}</span>
                               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.8rem' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                   <span style={{ fontSize: '0.7rem', color: '#9fd9b6', marginRight: '2px' }}>Voto</span>
                                   <button type="button" onClick={() => handleUpdateVoteModal(player, -0.5)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0 6px', fontSize: '1rem' }}>-</button>
                                   <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold', color: getVoteColor(vote) }}>{vote === 0 ? 's.v.' : vote}</span>
                                   <button type="button" onClick={() => handleUpdateVoteModal(player, 0.5)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0 6px', fontSize: '1rem' }}>+</button>
                                   <button type="button" onClick={() => handleSetVoteSV(player)} style={{ background: (vote === 's.v.' || vote === 0) ? '#34d680' : 'rgba(255,255,255,0.1)', border: 'none', color: (vote === 's.v.' || vote === 0) ? '#0a1922' : 'white', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '4px' }}>SV</button>
                                 </div>
                                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                   <div style={{ display: 'flex', gap: '2px', marginBottom: '2px' }}>
                                     <button type="button" onClick={() => setGoalMode({...goalMode, [player]: 'G'})} style={{ fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px', border: '1px solid #9fd9b6', background: mode === 'G' ? '#9fd9b6' : 'transparent', color: mode === 'G' ? '#0a1922' : '#9fd9b6', cursor: 'pointer' }}>G</button>
                                     <button type="button" onClick={() => setGoalMode({...goalMode, [player]: 'AG'})} style={{ fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px', border: '1px solid #ff6b6b', background: mode === 'AG' ? '#ff6b6b' : 'transparent', color: mode === 'AG' ? '#0a1922' : '#ff6b6b', cursor: 'pointer' }}>AG</button>
                                   </div>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                     <button type="button" onClick={() => handleUpdateGoal(targetTeam, playerKey, -1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0 6px', fontSize: '1rem' }}>-</button>
                                     <span style={{ width: '16px', textAlign: 'center', fontWeight: 'bold', color: count > 0 ? (mode === 'G' ? '#34d680' : '#ff6b6b') : '#cfe8d8' }}>{count}</span>
                                     <button type="button" onClick={() => handleUpdateGoal(targetTeam, playerKey, 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0 6px', fontSize: '1rem' }}>+</button>
                                   </div>
                                 </div>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <label style={{ fontSize: '0.8rem', color: '#6f9c81' }}>
                            Formazione e Voti {updatingMatch?.team_b_name}
                          </label>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {updatingMatch?.team_b_players?.map(player => {
                          const mode = goalMode[player] || 'G';
                          const playerKey = mode === 'G' ? player : `${player} (AG)`;
                          const targetTeam = mode === 'G' ? 'B' : 'A';
                          const count = (targetTeam === 'B' ? updateScorersB : updateScorersA)[playerKey] || 0;
                          const vote = updateVoti[player] !== undefined ? updateVoti[player] : 6;
                          return (
                            <div key={player} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.6rem 0.8rem', borderRadius: '8px' }}>
                               <span style={{ fontSize: '0.9rem', color: '#cfe8d8', fontWeight: 500, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player}</span>
                               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.8rem' }}>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                   <span style={{ fontSize: '0.7rem', color: '#9fd9b6', marginRight: '2px' }}>Voto</span>
                                   <button type="button" onClick={() => handleUpdateVoteModal(player, -0.5)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0 6px', fontSize: '1rem' }}>-</button>
                                   <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 'bold', color: getVoteColor(vote) }}>{vote === 0 ? 's.v.' : vote}</span>
                                   <button type="button" onClick={() => handleUpdateVoteModal(player, 0.5)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0 6px', fontSize: '1rem' }}>+</button>
                                   <button type="button" onClick={() => handleSetVoteSV(player)} style={{ background: (vote === 's.v.' || vote === 0) ? '#34d680' : 'rgba(255,255,255,0.1)', border: 'none', color: (vote === 's.v.' || vote === 0) ? '#0a1922' : 'white', borderRadius: '4px', cursor: 'pointer', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '4px' }}>SV</button>
                                 </div>
                                 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                   <div style={{ display: 'flex', gap: '2px', marginBottom: '2px' }}>
                                     <button type="button" onClick={() => setGoalMode({...goalMode, [player]: 'G'})} style={{ fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px', border: '1px solid #9fd9b6', background: mode === 'G' ? '#9fd9b6' : 'transparent', color: mode === 'G' ? '#0a1922' : '#9fd9b6', cursor: 'pointer' }}>G</button>
                                     <button type="button" onClick={() => setGoalMode({...goalMode, [player]: 'AG'})} style={{ fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px', border: '1px solid #ff6b6b', background: mode === 'AG' ? '#ff6b6b' : 'transparent', color: mode === 'AG' ? '#0a1922' : '#ff6b6b', cursor: 'pointer' }}>AG</button>
                                   </div>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                     <button type="button" onClick={() => handleUpdateGoal(targetTeam, playerKey, -1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0 6px', fontSize: '1rem' }}>-</button>
                                     <span style={{ width: '16px', textAlign: 'center', fontWeight: 'bold', color: count > 0 ? (mode === 'G' ? '#34d680' : '#ff6b6b') : '#cfe8d8' }}>{count}</span>
                                     <button type="button" onClick={() => handleUpdateGoal(targetTeam, playerKey, 1)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0 6px', fontSize: '1rem' }}>+</button>
                                   </div>
                                 </div>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                  </div>

                  <div style={{ marginBottom: '1.5rem', borderTop: '0.5px solid rgba(52, 214, 128, 0.16)', paddingTop: '1.2rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.8rem', color: '#6f9c81', fontWeight: 600 }}>
                        Scegli MVP della partita
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {[...(updatingMatch?.team_a_players || []), ...(updatingMatch?.team_b_players || [])].map(player => (
                          <div 
                            key={`mvp-${player}`}
                            onClick={() => handleToggleMVP(player)}
                            style={{ 
                              padding: '0.4rem 0.8rem', 
                              borderRadius: '20px', 
                              fontSize: '0.8rem', 
                              fontWeight: 500,
                              cursor: 'pointer',
                              background: updateMVPs.includes(player) ? '#ffd700' : 'rgba(255,255,255,0.05)',
                              color: updateMVPs.includes(player) ? '#0a1922' : '#cfe8d8',
                              border: updateMVPs.includes(player) ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.1)',
                              userSelect: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>{player}</span>
                            {updateMVPs.includes(player) && <span>🏅</span>}
                          </div>
                        ))}
                      </div>
                  </div>



                  <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button className="secondary-btn" onClick={handleDeleteMatch} style={{ color: '#ff6b6b', borderColor: 'rgba(255, 107, 107, 0.3)', padding: '0.6rem 1rem' }}>
                        <Trash2 size={16} style={{ display: 'inline', verticalAlign: '-3px', marginRight: '4px' }} />
                        Elimina
                      </button>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button className="secondary-btn" onClick={() => setIsUpdateModalOpen(false)}>Annulla</button>
                        <button className="create-teams-btn" onClick={handleUpdateResult}>Salva</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {isDeleteModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '400px' }}>
                  <h3 style={{ color: '#ff6b6b', marginBottom: '1rem' }}>Elimina Partita</h3>
                  <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
                    Sei sicuro di voler eliminare questa partita? L'operazione è irreversibile.
                  </p>
                  


                  <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      <button className="secondary-btn" onClick={() => setIsDeleteModalOpen(false)}>Annulla</button>
                      <button className="create-teams-btn" style={{ background: '#ff6b6b', boxShadow: '0 10px 15px -3px rgba(255, 107, 107, 0.3)' }} onClick={handleDeleteMatch}>Elimina</button>
                  </div>
              </div>
          </div>
      )}

      {isSaveFormationModalOpen && (
          <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '400px' }}>
                  <h3 style={{ marginBottom: '1rem' }}>Salva Formazione</h3>
                  <p className="section-subtitle" style={{ marginBottom: '1.5rem' }}>
                    Inserisci la password per salvare questa formazione.
                  </p>
                  


                  <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                      <button className="secondary-btn" onClick={() => { setIsSaveFormationModalOpen(false); setSaveFormationPassword(''); }}>Annulla</button>
                      <button className="create-teams-btn" onClick={saveFormation} disabled={isSaving}>{isSaving ? 'Salvataggio...' : 'Salva'}</button>
                  </div>
              </div>
          </div>
      )}

      {selectedPlayerForCard && (() => {
        const playerObj = dbPlayers.find(p => p.Nome === selectedPlayerForCard);
        const stats = getPlayerStats(playerObj, selectedPlayerForCard);
        const role = playerObj?.Ruolo || 'Giocatore';
        return (
          <div className="pes-modal-overlay" onClick={() => setSelectedPlayerForCard(null)}>
            <div className="pes-modal-content" onClick={e => e.stopPropagation()}>
              <div className="pes-modal-header">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h3>{selectedPlayerForCard}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', color: '#9fd9b6', textTransform: 'uppercase', fontWeight: 600 }}>{role}</span>
                    {playerObj?.RuoloSecondario && (
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.65)', background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '4px' }}>
                        Sec: {playerObj.RuoloSecondario}
                      </span>
                    )}
                  </div>
                </div>
                <button className="secondary-btn" style={{padding:'0.2rem', display:'flex', background: 'transparent', border: 'none', color: '#9fd9b6'}} onClick={() => setSelectedPlayerForCard(null)}>
                  <X size={24} />
                </button>
              </div>
              {playerObj?.Skill && (
                <div className="pes-modal-skill" style={{
                  background: 'linear-gradient(90deg, rgba(0, 180, 216, 0.2) 0%, transparent 100%)',
                  padding: '8px 16px',
                  borderBottom: '1px solid rgba(107, 155, 198, 0.3)',
                  color: '#ffcc00',
                  fontStyle: 'italic',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  "{playerObj.Skill}"
                </div>
              )}
              <div className="pes-modal-body">
                <div className="pes-left-col">
                  <div className="pes-player-image-container" style={{ width: '130px', height: '170px', border: '2px solid rgba(107, 155, 198, 0.6)', borderRadius: '4px', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img 
                      src={playerObj?.figurina || `/players/${encodeURIComponent(selectedPlayerForCard || '')}.jpg`} 
                      alt={selectedPlayerForCard || ''} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src.endsWith('.jpg')) {
                          target.src = `/players/${encodeURIComponent(selectedPlayerForCard)}.png`;
                        } else {
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = '<span style="color: rgba(255,255,255,0.3); font-size: 0.8rem; text-align: center; padding: 10px;">Nessuna Figurina</span>';
                        }
                      }}
                    />
                  </div>
                  <div className="pes-radar-container">
                    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                      <polygon className="pes-radar-polygon" points={stats.isGk ? `
                        50,${50 - (stats.tuffo / 100) * 45}
                        ${50 + (stats.presa / 100) * 43.3},${50 - (stats.presa / 100) * 25}
                        ${50 + (stats.riflessi / 100) * 43.3},${50 + (stats.riflessi / 100) * 25}
                        50,${50 + (stats.piazzamento / 100) * 45}
                        ${50 - (stats.uscite / 100) * 43.3},${50 + (stats.uscite / 100) * 25}
                        ${50 - (stats.rinvio / 100) * 43.3},${50 - (stats.rinvio / 100) * 25}
                      ` : `
                        50,${50 - (stats.velocita / 100) * 45}
                        ${50 + (stats.accelerazione / 100) * 43.3},${50 - (stats.accelerazione / 100) * 25}
                        ${50 + (stats.tecnica / 100) * 43.3},${50 + (stats.tecnica / 100) * 25}
                        50,${50 + (stats.contrasto / 100) * 45}
                        ${50 - (stats.passaggi / 100) * 43.3},${50 + (stats.passaggi / 100) * 25}
                        ${50 - (stats.finalizzazione / 100) * 43.3},${50 - (stats.finalizzazione / 100) * 25}
                      `} />
                    </svg>
                    <div className="pes-radar-labels">
                      {stats.isGk ? (
                        <>
                          <span style={{ top: '0%', left: '50%' }}>Tuf</span>
                          <span style={{ top: '25%', left: '95%' }}>Pre</span>
                          <span style={{ top: '75%', left: '95%' }}>Rif</span>
                          <span style={{ top: '100%', left: '50%' }}>Pia</span>
                          <span style={{ top: '75%', left: '5%' }}>Usc</span>
                          <span style={{ top: '25%', left: '5%' }}>Rin</span>
                        </>
                      ) : (
                        <>
                          <span style={{ top: '0%', left: '50%' }}>Vel</span>
                          <span style={{ top: '25%', left: '95%' }}>Acc</span>
                          <span style={{ top: '75%', left: '95%' }}>Tec</span>
                          <span style={{ top: '100%', left: '50%' }}>Con</span>
                          <span style={{ top: '75%', left: '5%' }}>Pas</span>
                          <span style={{ top: '25%', left: '5%' }}>Fin</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="pes-stats-col">
                  {stats.isGk ? (
                    <>
                      <div className="pes-stat-row"><span>Tuffo</span><span className="pes-stat-val">{stats.tuffo}</span></div>
                      <div className="pes-stat-row"><span>Presa</span><span className="pes-stat-val">{stats.presa}</span></div>
                      <div className="pes-stat-row"><span>Riflessi</span><span className="pes-stat-val">{stats.riflessi}</span></div>
                      <div className="pes-stat-row"><span>Piazzamento</span><span className="pes-stat-val">{stats.piazzamento}</span></div>
                      <div className="pes-stat-row"><span>Uscite</span><span className="pes-stat-val">{stats.uscite}</span></div>
                      <div className="pes-stat-row"><span>Reattività</span><span className="pes-stat-val">{stats.reattivita}</span></div>
                      <div className="pes-stat-row"><span>Rinvio</span><span className="pes-stat-val">{stats.rinvio}</span></div>
                      <div className="pes-stat-row"><span>Resistenza</span><span className="pes-stat-val">{stats.resistenza}</span></div>
                    </>
                  ) : (
                    <>
                      <div className="pes-stat-row"><span>Velocità</span><span className="pes-stat-val">{stats.velocita}</span></div>
                      <div className="pes-stat-row"><span>Accelerazione</span><span className="pes-stat-val">{stats.accelerazione}</span></div>
                      <div className="pes-stat-row"><span>Tecnica</span><span className="pes-stat-val">{stats.tecnica}</span></div>
                      <div className="pes-stat-row"><span>Contrasto</span><span className="pes-stat-val">{stats.contrasto}</span></div>
                      <div className="pes-stat-row"><span>Passaggi</span><span className="pes-stat-val">{stats.passaggi}</span></div>
                      <div className="pes-stat-row"><span>Finalizzazione</span><span className="pes-stat-val">{stats.finalizzazione}</span></div>
                      <div className="pes-stat-row"><span>Resistenza</span><span className="pes-stat-val">{stats.resistenza}</span></div>
                      <div className="pes-stat-row">
                        <span>Dribbling</span>
                        <span className="pes-stat-val" style={stats.dribbling === 100 ? { color: '#ffd700', textShadow: '0 0 5px rgba(255, 215, 0, 0.8)' } : {}}>{stats.dribbling}</span>
                      </div>
                    </>
                  )}
                  <div className="pes-stat-row">
                    <span>Probabilità di Rissa</span>
                    <span className="pes-stat-val" style={stats.rissa === 100 ? { color: '#ffd700', textShadow: '0 0 5px rgba(255, 215, 0, 0.8)' } : {}}>{stats.rissa}</span>
                  </div>
                  <div style={{ height: '10px' }} />
                  <div className="pes-stat-row"><span>Altezza</span><span className="pes-stat-val" style={{color:'white', textShadow:'none'}}>{stats.altezza} cm</span></div>
                  <div className="pes-stat-row"><span>Peso</span><span className="pes-stat-val" style={{color:'white', textShadow:'none'}}>{stats.peso} kg</span></div>
                  <div className="pes-stat-row"><span>Piede Preferito</span><span className="pes-stat-val" style={{color:'white', textShadow:'none'}}>{stats.piede}</span></div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {toast && <div className={`toast visible ${toast.type}`}>{toast.message}</div>}

      {/* Add Campo Modal */}
      {isAddCampoModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddCampoModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'nowrap' }}>
                <h2 
                  style={{ cursor: 'pointer', opacity: campoModalMode === 'add' ? 1 : 0.5, margin: 0, fontSize: '1.1rem', paddingRight: '0.8rem', borderRight: '1px solid rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }} 
                  onClick={() => { setCampoModalMode('add'); setNewCampoName(''); setNewCampoUrl(''); setCampoPassword(''); setSelectedCampoIdToManage(null); }}
                >AGGIUNGI CAMPO</h2>
                <h2 
                  style={{ cursor: 'pointer', opacity: campoModalMode === 'manage' ? 1 : 0.5, margin: 0, fontSize: '1.1rem', whiteSpace: 'nowrap' }}
                  onClick={() => setCampoModalMode('manage')}
                >GESTISCI</h2>
              </div>
              <button 
                className="secondary-btn" 
                style={{padding:'0 0 0 0.5rem', margin: 0, display:'flex', background: 'transparent', border: 'none', color: '#9fd9b6', cursor: 'pointer'}} 
                onClick={() => setIsAddCampoModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            {campoModalMode === 'manage' && (
              <div className="form-group" style={{ marginBottom: '1.2rem' }}>
                <label>Seleziona Campo da Gestire</label>
                <select 
                  className="modal-input"
                  style={{ width: '100%', padding: '0.5rem', background: 'var(--color-surface-2)', color: 'white', borderRadius: '4px' }}
                  value={selectedCampoIdToManage || ''}
                  onChange={(e) => {
                     const id = Number(e.target.value);
                     setSelectedCampoIdToManage(id);
                     const c = dbCampi.find(x => x.id === id);
                     if (c) {
                        setNewCampoName(c.nome);
                        setNewCampoUrl(c.posizione_url || '');
                     }
                  }}
                >
                  <option value="">-- Seleziona --</option>
                  {dbCampi.map(c => (
                     <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label>Nome Campo *</label>
              <input 
                type="text" 
                value={newCampoName} 
                onChange={e => setNewCampoName(e.target.value)} 
                placeholder="Es. Seidita"
                className="modal-input"
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '1.2rem' }}>
              <label>Posizione URL (Google Maps)</label>
              <input 
                type="text" 
                value={newCampoUrl} 
                onChange={e => setNewCampoUrl(e.target.value)} 
                placeholder="Es. https://maps.app.goo.gl/..."
                className="modal-input"
              />
            </div>
            

            
            <div style={{display:'flex', gap:'var(--space-2)', marginTop:'var(--space-4)', justifyContent: 'center'}}>
              {campoModalMode === 'manage' && selectedCampoIdToManage && (
                 <button 
                   className="btn-cancel"
                   style={{ background: '#d32f2f', color: 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                   onClick={handleDeleteCampo}
                 >Elimina</button>
              )}
              <button 
                className="create-teams-btn" 
                onClick={handleAddCampo}
              >
                {campoModalMode === 'add' ? 'AGGIUNGI' : 'SALVA'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .matches-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3, 0.75rem);
        }

        .match-summary {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 0.25rem 0.75rem;
          padding: 0.9rem 1.1rem 1.1rem;
          cursor: pointer;
          position: relative;
        }

        .match-meta-row {
          grid-column: 1 / -1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.6rem;
        }

        .match-meta {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          letter-spacing: 0.02em;
          color: #6f9c81;
          text-transform: capitalize;
        }

        .match-meta-time {
          font-family: var(--font-mono, monospace);
          color: #4f7560;
        }

        .match-score-area {
          grid-column: 1 / 2;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 0.9rem;
          width: 100%;
        }

        .match-team {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }

        .match-team-a {
          align-items: flex-end;
          text-align: right;
        }

        .match-team-b {
          align-items: flex-start;
          text-align: left;
        }

        .match-team-name {
          font-size: 0.92rem;
          font-weight: 600;
          color: #eafff0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 100%;
        }

        .match-team-tag {
          font-size: 0.66rem;
          color: #4f7560;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .match-scoreboard {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: #06120a;
          border: 0.5px solid rgba(52, 214, 128, 0.3);
          border-radius: 10px;
          padding: 0.35rem 0.85rem;
        }

        .score-num {
          font-family: var(--font-mono, monospace);
          font-size: 1.3rem;
          font-weight: 700;
          color: #34d680;
          min-width: 1.1ch;
          text-align: center;
        }

        .score-sep {
          color: #2e4a37;
          font-size: 0.95rem;
        }

        .match-chevron {
          grid-column: 2 / 3;
          grid-row: 2 / 3;
          color: #4f7560;
          transition: transform 0.2s ease;
          align-self: center;
        }

        .match-chevron.rotated {
          transform: rotate(180deg);
        }

        .match-details {
          border-top: 0.5px solid rgba(52, 214, 128, 0.14);
          padding: 1rem 1.1rem 1.15rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          background: rgba(52, 214, 128, 0.025);
        }

        .scorers-detail {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .scorers-label {
          font-size: 0.7rem;
          letter-spacing: 0.04em;
          color: #6f9c81;
          text-transform: uppercase;
        }

        .scorers-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 0.75rem;
        }

        .scorers-team {
          font-size: 0.85rem;
          color: #cfe8d8;
          line-height: 1.5;
        }

        .scorers-row .scorers-team:first-child {
          text-align: right;
        }

        .scorers-divider {
          width: 1px;
          align-self: stretch;
          background: rgba(52, 214, 128, 0.18);
        }

        .formations-detail {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }

        .formation-team {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .formation-team-b {
          align-items: flex-end;
        }

        .formation-team-b .formation-players {
          align-items: flex-end;
        }

        .formation-team-b .formation-title {
          text-align: right;
          width: 100%;
        }

        .formation-title {
          font-size: 0.78rem;
          font-weight: 600;
          color: #9fd9b6;
          padding-bottom: 0.35rem;
          border-bottom: 0.5px solid rgba(52, 214, 128, 0.16);
          width: 100%;
        }

        .formation-players {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          list-style: none;
          padding: 0;
          margin: 0;
          width: 100%;
        }

        .formation-players li {
          font-size: 0.84rem;
          color: #cfe8d8;
          line-height: 1.4;
        }

        @media (max-width: 520px) {
          .match-team-name {
            font-size: 0.8rem;
          }
          .score-num {
            font-size: 1.1rem;
          }
          .formations-detail {
            grid-template-columns: 1fr;
            gap: 0.9rem;
          }
          .formation-team-b {
            align-items: flex-start;
          }
          .formation-team-b .formation-players {
            align-items: flex-start;
          }
          .formation-team-b .formation-title {
            text-align: left;
          }
        }
        .admin-input {
          background: rgba(0,0,0,0.5);
          color: #fff;
          border: 1px solid rgba(61, 165, 245, 0.4);
          padding: 0.45rem 0.6rem;
          border-radius: 4px;
          font-size: 0.85rem;
          outline: none;
          width: 100%;
        }
        .admin-input[type="date"] {
          color-scheme: dark;
        }
        .admin-modal {
          overflow: visible !important;
        }
      `}</style>
      
      {/* Sfida Modal */}
      {isSfidaModalOpen && (
        <div className="modal-overlay" onClick={() => setIsSfidaModalOpen(false)} style={{ zIndex: 9999 }}>
          <div className="modal-content admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', width: '95%' }}>
            <h2 className="admin-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>⚔️ Area Sfida</h2>
            
            {sfideSalvate.length > 0 && (
               <div style={{ marginBottom: '1.5rem', background: 'var(--color-surface-2)', padding: '1rem', borderRadius: '8px' }}>
                 <h3 style={{ fontSize: '1rem', color: '#3da5f5', marginBottom: '10px' }}>Sfide Salvate:</h3>
                 <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                   {sfideSalvate.filter(s => isAdmin || s.is_approved).map(s => (
                     <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-surface)', padding: '5px 10px', borderRadius: '4px', border: s.is_approved ? '1px solid var(--color-border)' : '1px solid #f0ad4e' }}>
                       <span style={{ cursor: 'pointer', color: '#fff', fontSize: '0.9rem' }} onClick={() => { setSfidaPlayers(s.giocatori); setSfidaDataDa(s.data_da || ''); setTimeout(() => document.getElementById('calc-sfida-btn')?.click(), 100); }}>
                         {s.titolo} {s.data_da ? ` (dal ${s.data_da})` : ''} {!s.is_approved && <span style={{color: '#f0ad4e', fontSize: '0.75rem'}}> (In attesa)</span>}
                       </span>
                       {isAdmin && !s.is_approved && <button onClick={() => approveSfida(s.id)} style={{ background: 'transparent', border: 'none', color: '#34d680', cursor: 'pointer', padding: '0 5px', fontWeight: 'bold' }}>✓</button>}
                       {isAdmin && <button onClick={() => deleteSfida(s.id)} style={{ background: 'transparent', border: 'none', color: '#f55', cursor: 'pointer', padding: '0 5px' }}>x</button>}
                     </div>
                   ))}
                 </div>
               </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'flex-end' }}>
               <div style={{ flex: 1, minWidth: '200px' }}>
                 <label className="admin-label">Seleziona Giocatori (min. 2)</label>
                 <MultiSelectDropdown
                    selectedValues={sfidaPlayers}
                    options={sfidaPlayerOptions}
                    onChange={setSfidaPlayers}
                    placeholder="Scegli i giocatori"
                 />
               </div>
               <div style={{ width: '130px' }}>
                 <label className="admin-label">Data Da (Opz.)</label>
                 <input type="date" className="admin-input" value={sfidaDataDa} onChange={e => setSfidaDataDa(e.target.value)} />
               </div>
               <div style={{ flex: 1, minWidth: '150px' }}>
                 <label className="admin-label">Nome Sfida (Opz.)</label>
                 <input type="text" className="admin-input" placeholder="Es: Classifica Estiva" value={sfidaTitolo} onChange={e => setSfidaTitolo(e.target.value)} />
               </div>
               <div style={{ display: 'flex', gap: '8px' }}>
                 <button id="calc-sfida-btn" className="admin-button" onClick={computeSfida} style={{ padding: '0.7rem 1.2rem', background: '#3da5f5', color: '#000', fontWeight: 'bold' }}>Calcola</button>
                 <button className="admin-button" onClick={handleSaveSfida} style={{ padding: '0.7rem 1.2rem', background: '#34d680', color: '#000', fontWeight: 'bold' }}>{isAdmin ? 'Salva' : 'Invia'}</button>
               </div>
            </div>

            {sfidaLeaderboard.length > 0 && (
              <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '50vh', borderRadius: '8px', border: '1px solid var(--color-border)', marginTop: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(61, 165, 245, 0.1)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#3da5f5' }}>Pos</th>
                      <th style={{ padding: '10px', textAlign: 'left', color: '#3da5f5', cursor: 'pointer' }} onClick={() => requestSfidaSort('nome')}>Nominativo {sfidaSortConfig?.key==='nome'?(sfidaSortConfig.direction==='asc'?'↑':'↓'):''}</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: '#3da5f5', cursor: 'pointer' }} onClick={() => requestSfidaSort('punti_assoluti')}>Punti {sfidaSortConfig?.key==='punti_assoluti'?(sfidaSortConfig.direction==='asc'?'↑':'↓'):''}</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: '#3da5f5', cursor: 'pointer' }} onClick={() => requestSfidaSort('partite_giocate')}>Giocate {sfidaSortConfig?.key==='partite_giocate'?(sfidaSortConfig.direction==='asc'?'↑':'↓'):''}</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: '#3da5f5', cursor: 'pointer' }} onClick={() => requestSfidaSort('vittorie')}>V {sfidaSortConfig?.key==='vittorie'?(sfidaSortConfig.direction==='asc'?'↑':'↓'):''}</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: '#3da5f5', cursor: 'pointer' }} onClick={() => requestSfidaSort('pareggi')}>N {sfidaSortConfig?.key==='pareggi'?(sfidaSortConfig.direction==='asc'?'↑':'↓'):''}</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: '#3da5f5', cursor: 'pointer' }} onClick={() => requestSfidaSort('sconfitte')}>P {sfidaSortConfig?.key==='sconfitte'?(sfidaSortConfig.direction==='asc'?'↑':'↓'):''}</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: '#3da5f5', cursor: 'pointer' }} onClick={() => requestSfidaSort('media_voto')}>Media Voto {sfidaSortConfig?.key==='media_voto'?(sfidaSortConfig.direction==='asc'?'↑':'↓'):''}</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: '#3da5f5', cursor: 'pointer' }} onClick={() => requestSfidaSort('mvp_count')}>MVP {sfidaSortConfig?.key==='mvp_count'?(sfidaSortConfig.direction==='asc'?'↑':'↓'):''}</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: '#3da5f5', cursor: 'pointer' }} onClick={() => requestSfidaSort('pt_partita')}>Pt/Partita {sfidaSortConfig?.key==='pt_partita'?(sfidaSortConfig.direction==='asc'?'↑':'↓'):''}</th>
                      <th style={{ padding: '10px', textAlign: 'center', color: '#3da5f5', cursor: 'pointer' }} onClick={() => requestSfidaSort('gol')}>Gol {sfidaSortConfig?.key==='gol'?(sfidaSortConfig.direction==='asc'?'↑':'↓'):''}</th>
                    </tr>
                  </thead>
                  <tbody>
                     {sortedSfidaLeaderboard.map((p, idx) => (
                        <tr key={p.nome} style={{ borderBottom: '1px solid var(--color-border)', color: '#fff' }}>
                           <td style={{ padding: '10px', fontWeight: 'bold' }}>{idx + 1}°</td>
                           <td style={{ padding: '10px', fontWeight: 600 }}>{p.nome}</td>
                           <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#fff' }}>{p.punti_assoluti}</td>
                           <td style={{ padding: '10px', textAlign: 'center' }}>{p.partite_giocate}</td>
                           <td style={{ padding: '10px', textAlign: 'center', color: '#34d680' }}>{p.vittorie}</td>
                           <td style={{ padding: '10px', textAlign: 'center', color: '#f0ad4e' }}>{p.pareggi}</td>
                           <td style={{ padding: '10px', textAlign: 'center', color: '#d9534f' }}>{p.sconfitte}</td>
                           <td style={{ padding: '10px', textAlign: 'center' }}>{p.media_voto}</td>
                           <td style={{ padding: '10px', textAlign: 'center', color: '#ffd700' }}>{p.mvp_count}</td>
                           <td style={{ padding: '10px', textAlign: 'center' }}>{p.pt_partita}</td>
                           <td style={{ padding: '10px', textAlign: 'center' }}>{p.gol}</td>
                        </tr>
                     ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <button className="admin-button cancel-button" onClick={() => setIsSfidaModalOpen(false)} style={{ marginTop: '1.5rem', width: '100%' }}>Chiudi</button>
          </div>
        </div>
      )}
    </div>
  );
}
