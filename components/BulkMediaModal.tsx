'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Upload, X, FileText, Check, AlertCircle, Trash2, Plus, Download, Copy, Sparkles, CheckCircle2, Youtube, HelpCircle } from 'lucide-react';
import { 
  parseMediaText, 
  extractYoutubeId, 
  normalizeCategory, 
  generateSampleTxt, 
  YOUTUBE_STUDIO_SNIPPET,
  ParsedMediaRow, 
  MatchRef 
} from '@/lib/media-import-utils';

interface BulkMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: MatchRef[];
  dbPlayers?: { Nome: string }[];
  initialMatchId?: string;
  onSuccess: (count: number) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function BulkMediaModal({
  isOpen,
  onClose,
  matches,
  dbPlayers = [],
  initialMatchId,
  onSuccess,
  showToast
}: BulkMediaModalProps) {
  const [rawText, setRawText] = useState('');
  const [delimiter, setDelimiter] = useState('auto');
  const [defaultMatchId, setDefaultMatchId] = useState<string>(initialMatchId || '');
  const [rows, setRows] = useState<ParsedMediaRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedExample, setCopiedExample] = useState(false);
  const [copiedYtScript, setCopiedYtScript] = useState(false);
  const [showYtGuide, setShowYtGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'preview'>('input');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handler to parse text
  const handleParse = (textToParse: string, delim = delimiter, defMatch = defaultMatchId) => {
    const parsed = parseMediaText(
      textToParse,
      matches,
      delim,
      defMatch ? Number(defMatch) : null
    );
    setRows(parsed);
    if (parsed.length > 0) {
      setActiveTab('preview');
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      setRawText(content);
      handleParse(content, delimiter, defaultMatchId);
      showToast(`File caricato: rilevate ${content.split('\n').filter(l => l.trim()).length} righe`, 'info');
    };
    reader.readAsText(file);
  };

  // Copy sample
  const handleCopyExample = () => {
    const sample = generateSampleTxt();
    navigator.clipboard.writeText(sample);
    setCopiedExample(true);
    setTimeout(() => setCopiedExample(false), 2000);
    showToast('Formato di esempio copiato negli appunti!', 'success');
  };

  // Copy YouTube Studio console script
  const handleCopyYtScript = () => {
    navigator.clipboard.writeText(YOUTUBE_STUDIO_SNIPPET);
    setCopiedYtScript(true);
    setTimeout(() => setCopiedYtScript(false), 2500);
    showToast('Script YouTube Studio copiato! Incollalo nella Console (F12) su YouTube Studio', 'success');
  };

  // Download sample .txt file
  const handleDownloadSample = () => {
    const sample = generateSampleTxt();
    const blob = new Blob([sample], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'esempio_import_media.txt';
    link.click();
    URL.revokeObjectURL(url);
    showToast('File di esempio scaricato!', 'success');
  };

  // Update specific row
  const updateRow = (index: number, updates: Partial<ParsedMediaRow>) => {
    setRows(prev => {
      const next = [...prev];
      const cur = { ...next[index], ...updates };

      // Re-validate
      const errs: string[] = [];
      if (!cur.matchedMatchId) errs.push('Seleziona una partita');
      if (!cur.youtubeId || cur.youtubeId.length !== 11) errs.push('Link YouTube non valido');
      if (!cur.categoria) errs.push('Seleziona una categoria');

      cur.isValid = errs.length === 0;
      cur.error = errs.join(', ');
      next[index] = cur;
      return next;
    });
  };

  // Delete row
  const deleteRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  // Add empty row
  const addEmptyRow = () => {
    const newRow: ParsedMediaRow = {
      id: `manual-${Date.now()}`,
      rawLine: '',
      partitaStr: '',
      matchedMatchId: defaultMatchId ? Number(defaultMatchId) : (matches.length > 0 ? matches[0].id : null),
      confidence: 100,
      youtubeUrl: '',
      youtubeId: '',
      autore: '',
      categoria: 'Golazo',
      coAutore: '',
      isValid: false,
      error: 'Inserisci link YouTube'
    };
    setRows(prev => [...prev, newRow]);
    setActiveTab('preview');
  };

  // Apply default match to all rows
  const applyMatchToAll = (matchIdToApply: number) => {
    setRows(prev => prev.map(r => {
      const updated = { ...r, matchedMatchId: matchIdToApply };
      const errs: string[] = [];
      if (!updated.matchedMatchId) errs.push('Seleziona una partita');
      if (!updated.youtubeId || updated.youtubeId.length !== 11) errs.push('Link YouTube non valido');
      if (!updated.categoria) errs.push('Seleziona una categoria');
      updated.isValid = errs.length === 0;
      updated.error = errs.join(', ');
      return updated;
    }));
    showToast('Partita applicata a tutte le righe', 'info');
  };

  // Save all valid rows to DB
  const handleSaveBulk = async () => {
    const validRows = rows.filter(r => r.isValid && r.matchedMatchId && r.youtubeId && r.categoria);
    if (validRows.length === 0) {
      showToast('Nessuna riga valida da caricare. Controlla gli errori.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = validRows.map(r => ({
        partita_id: r.matchedMatchId,
        giocatore: r.autore?.trim() || null,
        co_giocatore: r.coAutore?.trim() || null,
        tipologia: r.categoria,
        youtube_id: r.youtubeId
      }));

      const res = await fetch('/api/media/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Errore durante il salvataggio dei media');
      }

      showToast(`Caricati con successo ${data.insertedCount || validRows.length} video nell'Archivio Media!`, 'success');
      onSuccess(data.insertedCount || validRows.length);
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Errore durante il caricamento', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const validCount = rows.filter(r => r.isValid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '920px', 
          width: '95vw', 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: '1.5rem',
          background: 'var(--color-surface, #151f2b)',
          border: '1px solid var(--color-border, rgba(107, 155, 198, 0.4))',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.8rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Upload size={22} style={{ color: 'var(--color-primary, #00b4d8)' }} />
              <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#fff', fontWeight: 700 }}>Carica Media in Blocco</h2>
            </div>
            <p className="section-subtitle" style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem' }}>
              Estrai i video da YouTube Studio o incolla da Excel per importare tutti i video in un colpo solo.
            </p>
          </div>
          <button 
            className="secondary-btn" 
            style={{ padding: '4px', background: 'transparent', border: 'none', color: '#9fd9b6', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
          <button 
            type="button"
            className="secondary-btn"
            style={{ 
              padding: '0.4rem 1rem', 
              fontSize: '0.85rem', 
              background: activeTab === 'input' ? 'rgba(0, 180, 216, 0.25)' : 'transparent',
              borderColor: activeTab === 'input' ? 'var(--color-primary, #00b4d8)' : 'rgba(255,255,255,0.1)',
              color: activeTab === 'input' ? '#fff' : 'var(--color-text-muted, #88a0b5)',
              fontWeight: activeTab === 'input' ? 700 : 500
            }}
            onClick={() => setActiveTab('input')}
          >
            1. Incolla Testo / Carica File
          </button>

          <button 
            type="button"
            className="secondary-btn"
            style={{ 
              padding: '0.4rem 1rem', 
              fontSize: '0.85rem', 
              background: activeTab === 'preview' ? 'rgba(0, 180, 216, 0.25)' : 'transparent',
              borderColor: activeTab === 'preview' ? 'var(--color-primary, #00b4d8)' : 'rgba(255,255,255,0.1)',
              color: activeTab === 'preview' ? '#fff' : 'var(--color-text-muted, #88a0b5)',
              fontWeight: activeTab === 'preview' ? 700 : 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
            onClick={() => setActiveTab('preview')}
          >
            2. Anteprima & Modifica ({rows.length})
            {rows.length > 0 && (
              <span style={{ 
                background: invalidCount === 0 ? '#2ecc71' : '#f39c12', 
                color: '#000', 
                borderRadius: '10px', 
                padding: '1px 6px', 
                fontSize: '0.75rem', 
                fontWeight: 700 
              }}>
                {validCount}/{rows.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Input & Upload */}
        {activeTab === 'input' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '4px' }}>
            {/* PASSO 1: SCRIPT YOUTUBE STUDIO */}
            <div style={{ 
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(30, 41, 59, 0.75) 100%)', 
              border: '1px solid rgba(239, 68, 68, 0.45)', 
              borderRadius: '10px', 
              padding: '1rem',
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    background: '#ef4444', 
                    borderRadius: '8px', 
                    width: '40px', 
                    height: '40px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#fff', 
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)'
                  }}>
                    <Youtube size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ 
                        background: '#ef4444', 
                        color: '#fff', 
                        fontSize: '0.7rem', 
                        fontWeight: 800, 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        letterSpacing: '0.5px' 
                      }}>
                        PASSO 1 (CONSIGLIATO)
                      </span>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                        Estrai i video da YouTube Studio in 1 Click
                      </h3>
                    </div>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#cbd5e1' }}>
                      Copia lo script qui sotto ed eseguilo nella Console (F12) su YouTube Studio &gt; <b>Contenuti / Caricamenti</b>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button 
                    type="button"
                    onClick={handleCopyYtScript}
                    style={{ 
                      background: copiedYtScript ? '#10b981' : '#ef4444', 
                      color: '#fff', 
                      border: 'none', 
                      padding: '0.5rem 1rem', 
                      borderRadius: '6px', 
                      fontSize: '0.82rem', 
                      fontWeight: 700, 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      boxShadow: '0 2px 10px rgba(239, 68, 68, 0.4)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {copiedYtScript ? <Check size={16} /> : <Copy size={16} />}
                    {copiedYtScript ? 'Script Copiato negli Appunti!' : 'Copia Script YouTube Studio'}
                  </button>

                  <button 
                    type="button"
                    className="secondary-btn"
                    style={{ 
                      fontSize: '0.8rem', 
                      padding: '0.48rem 0.8rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px',
                      background: showYtGuide ? 'rgba(255,255,255,0.12)' : 'transparent',
                      color: '#cbd5e1',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                    onClick={() => setShowYtGuide(prev => !prev)}
                  >
                    <HelpCircle size={15} />
                    {showYtGuide ? 'Nascondi Guida' : 'Come funziona? (3 Step)'}
                  </button>
                </div>
              </div>

              {/* Guida 3 Step YouTube */}
              {showYtGuide && (
                <div style={{ 
                  marginTop: '0.85rem', 
                  paddingTop: '0.85rem', 
                  borderTop: '1px solid rgba(255, 68, 68, 0.25)', 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', 
                  gap: '0.75rem' 
                }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.7rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.76rem', marginBottom: '3px' }}>1. VAI SU YOUTUBE STUDIO</div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                      Apri <a href="https://studio.youtube.com" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>studio.youtube.com</a> ➔ Sezione <b>Contenuti</b> (scheda <i>Caricamenti</i>).
                    </p>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.7rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.76rem', marginBottom: '3px' }}>2. APRI LA CONSOLE (F12)</div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                      Premi <b>F12</b> ➔ Scheda <b>Console</b> ➔ Incolla lo script copiato con <b>Ctrl+V</b> e premi <b>Invio</b>.
                    </p>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.7rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.76rem', marginBottom: '3px' }}>3. ESTRAZIONE E INCOLLA</div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>
                      Lo script copia i dati negli appunti e scarica <code>media_pronti_per_db.txt</code>. Torna qui sotto al <b>Passo 2</b> e premi <b>Ctrl+V</b>!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Header PASSO 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', marginBottom: '-0.3rem' }}>
              <span style={{ 
                background: 'var(--color-primary, #00b4d8)', 
                color: '#000', 
                fontSize: '0.7rem', 
                fontWeight: 800, 
                padding: '2px 6px', 
                borderRadius: '4px', 
                letterSpacing: '0.5px' 
              }}>
                PASSO 2
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                Incolla il testo estratto o carica il file
              </span>
            </div>

            {/* Guide & Sample Format Box */}
            <div style={{ background: 'rgba(0, 180, 216, 0.08)', border: '1px solid rgba(0, 180, 216, 0.25)', borderRadius: '8px', padding: '0.8rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#00d4ff', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Sparkles size={16} /> Formato Colonne Excel:
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button 
                    type="button"
                    className="secondary-btn" 
                    style={{ fontSize: '0.75rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
                    onClick={handleCopyYtScript}
                  >
                    <Youtube size={13} style={{ color: '#ef4444' }} /> {copiedYtScript ? 'Script Copiato!' : 'Copia Script YouTube'}
                  </button>
                  <button 
                    type="button"
                    className="secondary-btn" 
                    style={{ fontSize: '0.75rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={handleCopyExample}
                  >
                    {copiedExample ? <Check size={13} style={{ color: '#2ecc71' }} /> : <Copy size={13} />}
                    {copiedExample ? 'Copiato!' : 'Copia Esempio'}
                  </button>
                  <button 
                    type="button"
                    className="secondary-btn" 
                    style={{ fontSize: '0.75rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={handleDownloadSample}
                  >
                    <Download size={13} /> Scarica File .txt
                  </button>
                </div>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#cfe8d8', fontFamily: 'monospace', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                Partita [TAB] Link YouTube [TAB] Autore [TAB] Categoria [TAB] Co-Autori
              </div>
              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted, #88a0b5)' }}>
                💡 <b>Consiglio:</b> Seleziona le celle nel tuo Excel (es. 5 colonne) e premi <b>Ctrl+C</b>, poi incolla direttamente qui sotto! La partita viene riconosciuta automaticamente dal nome o dalla data (es. <i>Hollywood - Bollywood 2-17 del 12/10/2026</i>).
              </p>
            </div>

            {/* Drag & Drop File Selector */}
            <div 
              style={{ 
                border: '2px dashed rgba(52, 152, 219, 0.4)', 
                borderRadius: '8px', 
                padding: '1.2rem', 
                textAlign: 'center', 
                background: 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'border-color 0.2s'
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = ev => {
                    const content = String(ev.target?.result || '');
                    setRawText(content);
                    handleParse(content, delimiter, defaultMatchId);
                    showToast(`File caricato: rilevate righe`, 'info');
                  };
                  reader.readAsText(file);
                }
              }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".txt,.csv,.tsv" 
                style={{ display: 'none' }} 
                onChange={handleFileUpload} 
              />
              <FileText size={28} style={{ color: 'var(--color-primary, #00b4d8)', marginBottom: '0.4rem' }} />
              <div style={{ fontSize: '0.9rem', color: '#cfe8d8', fontWeight: 600 }}>
                Trascina qui il file media_pronti_per_db.txt, oppure clicca per sfogliare
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #88a0b5)', marginTop: '0.2rem' }}>
                Supporta file scaricati dallo script YouTube o file da Excel (.txt, .csv, .tsv)
              </div>
            </div>

            {/* Textarea Paste */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #88a0b5)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Oppure incolla qui il testo (premi <b>Ctrl+V</b> se hai appena eseguito lo script su YouTube Studio):</span>
                {rawText && (
                  <button 
                    type="button" 
                    onClick={() => setRawText('')}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Pulisci testo
                  </button>
                )}
              </label>
              <textarea 
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={"Hollywood - Bollywood 2-17 del 12/10/2026\thttps://youtu.be/dQw4w9WgXcQ\tSergioF\tGolazo\tLuca\nHollywood - Bollywood 2-17 del 12/10/2026\thttps://youtu.be/dQw4w9WgXcQ\tMichelangelo\tEpic Fail"}
                className="modal-input"
                style={{ 
                  minHeight: '140px', 
                  fontFamily: 'monospace', 
                  fontSize: '0.8rem', 
                  lineHeight: '1.4', 
                  resize: 'vertical',
                  whiteSpace: 'pre'
                }}
              />
            </div>

            {/* Options bar */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.8rem', borderRadius: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #88a0b5)', fontWeight: 600 }}>Separatore Colonne:</label>
                <select 
                  className="modal-input" 
                  value={delimiter} 
                  onChange={e => setDelimiter(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                >
                  <option value="auto">Riconoscimento Automatico (Consigliato)</option>
                  <option value="&#9;">Tabulazione (\t) [Copia/Incolla Excel]</option>
                  <option value=";">Punto e virgola (;) [CSV Excel Italia]</option>
                  <option value=",">Virgola (,) [Standard CSV]</option>
                  <option value="|">Barra verticale (|)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1, minWidth: '220px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #88a0b5)', fontWeight: 600 }}>Partita Predefinita (se non indicata nel testo):</label>
                <select 
                  className="modal-input" 
                  value={defaultMatchId} 
                  onChange={e => setDefaultMatchId(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                >
                  <option value="">-- Nessuna (Riconosci dal testo della riga) --</option>
                  {matches.map(m => (
                    <option key={m.id} value={String(m.id)}>
                      {new Date(m.data).toLocaleDateString('it-IT')} - {m.team_a_name} vs {m.team_b_name} {m.risultato ? `(${m.risultato})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end' }}>
                <button 
                  type="button"
                  className="create-teams-btn" 
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  onClick={() => {
                    if (!rawText.trim()) {
                      showToast('Incolla del testo o seleziona un file prima di analizzare', 'error');
                      return;
                    }
                    handleParse(rawText, delimiter, defaultMatchId);
                  }}
                >
                  <Sparkles size={16} /> Analizza & Anteprima
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Preview & Edit Table */}
        {activeTab === 'preview' && (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '4px' }}>
            {/* Top Stats & Quick Batch Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.85rem', color: '#cfe8d8', fontWeight: 600 }}>
                  Totale righe: <b style={{ color: '#fff' }}>{rows.length}</b>
                </span>
                <span style={{ fontSize: '0.8rem', background: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  ✓ {validCount} Pronte
                </span>
                {invalidCount > 0 && (
                  <span style={{ fontSize: '0.8rem', background: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    ⚠️ {invalidCount} Da Verificare
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {defaultMatchId && (
                  <button 
                    type="button"
                    className="secondary-btn" 
                    style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                    onClick={() => applyMatchToAll(Number(defaultMatchId))}
                  >
                    Assegna Partita Predefinita a Tutte
                  </button>
                )}
                <button 
                  type="button"
                  className="secondary-btn" 
                  style={{ fontSize: '0.75rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={addEmptyRow}
                >
                  <Plus size={14} /> Aggiungi Riga
                </button>
              </div>
            </div>

            {/* Datalist for Players auto-completion */}
            <datalist id="db-players-list">
              {dbPlayers.map(p => (
                <option key={p.Nome} value={p.Nome} />
              ))}
            </datalist>

            {/* Rows Table */}
            {rows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted, #88a0b5)' }}>
                Nessuna riga caricata. Torna al primo passaggio per incollare il testo o caricare un file.
                <div style={{ marginTop: '1rem' }}>
                  <button className="secondary-btn" onClick={() => setActiveTab('input')}>
                    Torna all'inserimento testo
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {rows.map((row, idx) => (
                  <div 
                    key={row.id}
                    style={{ 
                      background: row.isValid ? 'rgba(255,255,255,0.03)' : 'rgba(231, 76, 60, 0.08)',
                      border: row.isValid ? '1px solid rgba(52, 152, 219, 0.2)' : '1px solid rgba(231, 76, 60, 0.4)',
                      borderRadius: '8px',
                      padding: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem'
                    }}
                  >
                    {/* Top Row: Index, Status & Match selector */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary, #00b4d8)', background: 'rgba(0,180,216,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                          #{idx + 1}
                        </span>
                        {row.isValid ? (
                          <span style={{ fontSize: '0.75rem', color: '#2ecc71', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={14} /> Valido
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#e74c3c', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <AlertCircle size={14} /> {row.error || 'Dati incompleti'}
                          </span>
                        )}
                        {row.confidence > 0 && row.confidence < 100 && (
                          <span style={{ fontSize: '0.7rem', color: '#e8b339', background: 'rgba(232, 179, 57, 0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                            Match Rilevato ({row.confidence}%)
                          </span>
                        )}
                      </div>

                      <button 
                        type="button"
                        onClick={() => deleteRow(idx)}
                        style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer', padding: '2px 4px', opacity: 0.8 }}
                        title="Rimuovi riga"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Middle: Match selector dropdown */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #88a0b5)', minWidth: '60px' }}>Partita:</label>
                      <select 
                        className="modal-input"
                        value={row.matchedMatchId ? String(row.matchedMatchId) : ''}
                        onChange={e => updateRow(idx, { matchedMatchId: e.target.value ? Number(e.target.value) : null })}
                        style={{ flex: 1, minWidth: '240px', fontSize: '0.8rem', borderColor: !row.matchedMatchId ? '#e74c3c' : undefined }}
                      >
                        <option value="">-- Seleziona la Partita associata --</option>
                        {matches.map(m => (
                          <option key={m.id} value={String(m.id)}>
                            {new Date(m.data).toLocaleDateString('it-IT')} - {m.team_a_name} vs {m.team_b_name} {m.risultato ? `(${m.risultato})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Bottom: YouTube link, Autore, Categoria, Co-Autori */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted, #88a0b5)', marginBottom: '2px' }}>Link YouTube / ID:</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input 
                            type="text" 
                            className="modal-input" 
                            value={row.youtubeUrl} 
                            placeholder="https://youtu.be/... o ID"
                            onChange={e => {
                              const val = e.target.value;
                              const cleanId = extractYoutubeId(val);
                              updateRow(idx, { youtubeUrl: val, youtubeId: cleanId });
                            }}
                            style={{ flex: 1, fontSize: '0.8rem', padding: '0.35rem 0.5rem', borderColor: !row.youtubeId ? '#e74c3c' : undefined }}
                          />
                          {row.youtubeId && row.youtubeId.length === 11 && (
                            <a 
                              href={`https://www.youtube.com/watch?v=${row.youtubeId}`} 
                              target="_blank" 
                              rel="noreferrer"
                              style={{ fontSize: '0.7rem', color: '#00d4ff', textDecoration: 'none', padding: '2px 4px' }}
                              title="Apri su YouTube"
                            >
                              ▶
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted, #88a0b5)', marginBottom: '2px' }}>Autore (Protagonista):</label>
                        <input 
                          type="text" 
                          list="db-players-list"
                          className="modal-input" 
                          value={row.autore} 
                          placeholder="es. SergioF o Nome Squadra"
                          onChange={e => updateRow(idx, { autore: e.target.value })}
                          style={{ width: '100%', fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted, #88a0b5)', marginBottom: '2px' }}>Categoria Video:</label>
                        <select 
                          className="modal-input" 
                          value={row.categoria} 
                          onChange={e => updateRow(idx, { categoria: e.target.value })}
                          style={{ width: '100%', fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                        >
                          <option value="Golazo">Golazo</option>
                          <option value="Epic Fail">Epic Fail</option>
                          <option value="Paratona">Paratona (Parata)</option>
                          <option value="Giocata">Giocata</option>
                          <option value="Partita Completa">Partita Completa</option>
                          <option value="Sintesi">Sintesi</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted, #88a0b5)', marginBottom: '2px' }}>Co-Autori (opzionale):</label>
                        <input 
                          type="text" 
                          list="db-players-list"
                          className="modal-input" 
                          value={row.coAutore} 
                          placeholder="es. Assistman..."
                          onChange={e => updateRow(idx, { coAutore: e.target.value })}
                          style={{ width: '100%', fontSize: '0.8rem', padding: '0.35rem 0.5rem' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap', gap: '0.8rem' }}>
          <div>
            {rows.length > 0 && (
              <span style={{ fontSize: '0.85rem', color: '#cfe8d8' }}>
                Pronti per il caricamento: <b style={{ color: validCount > 0 ? '#2ecc71' : '#e74c3c' }}>{validCount} su {rows.length}</b> media
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button 
              type="button"
              className="secondary-btn" 
              onClick={onClose}
              disabled={isSaving}
            >
              Annulla
            </button>

            {activeTab === 'input' ? (
              <button 
                type="button"
                className="create-teams-btn" 
                onClick={() => {
                  if (!rawText.trim()) {
                    showToast('Incolla del testo o seleziona un file prima di procedere', 'error');
                    return;
                  }
                  handleParse(rawText, delimiter, defaultMatchId);
                }}
              >
                Vai all'Anteprima →
              </button>
            ) : (
              <button 
                type="button"
                className="create-teams-btn" 
                onClick={handleSaveBulk}
                disabled={isSaving || validCount === 0}
                style={{ 
                  opacity: (isSaving || validCount === 0) ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {isSaving ? 'Salvataggio nel DB...' : `💾 Carica ${validCount} Media nel DB`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
