import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { Player } from '@/types';

// --- Custom Player Selection Dropdown ---
export interface CustomDropdownProps {
  value: string;
  options: Player[];
  onChange: (name: string) => void;
  placeholder: string;
  loading: boolean;
  index: number;
}

export function CustomDropdown({ value, options, onChange, placeholder, loading, index }: CustomDropdownProps) {
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
export interface SearchableDropdownProps {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  placeholder: string;
}

export function SearchableDropdown({ value, options, onChange, placeholder }: SearchableDropdownProps) {
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
export interface MultiSelectDropdownProps {
  selectedValues: string[];
  options: { label: string; value: string }[];
  onChange: (values: string[]) => void;
  placeholder: string;
  hasAllOption?: boolean;
}

export function MultiSelectDropdown({ selectedValues, options, onChange, placeholder, hasAllOption = false }: MultiSelectDropdownProps) {
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
