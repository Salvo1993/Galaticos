export interface MatchRef {
  id: number;
  data: string;
  team_a_name: string;
  team_b_name: string;
  risultato?: string | null;
}

export interface ParsedMediaRow {
  id: string; // Unique temporary ID for UI key
  rawLine: string;
  partitaStr: string;
  matchedMatchId: number | null;
  confidence: number;
  youtubeUrl: string;
  youtubeId: string;
  autore: string;
  categoria: string;
  coAutore: string;
  isValid: boolean;
  error?: string;
}

/**
 * Extracts 11-char YouTube video ID from various URL formats or raw ID.
 */
export function extractYoutubeId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();

  // Already a clean 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // watch?v=... with possible other query params
  const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vMatch) return vMatch[1];

  // youtu.be/..., /embed/..., /shorts/..., /live/..., /v/...
  const pathMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/);
  if (pathMatch) return pathMatch[1];

  return trimmed;
}

/**
 * Normalizes category into standard values:
 * 'Golazo' | 'Epic Fail' | 'Paratona' | 'Giocata' | 'Partita Completa'
 */
export function normalizeCategory(cat: string): string {
  const c = (cat || '').trim().toLowerCase();
  if (c.includes('partita') || c.includes('completa') || c.includes('full')) return 'Partita Completa';
  if (c.includes('sintesi') || c.includes('highlights') || c.includes('highlight') || c.includes('recap')) return 'Sintesi';
  if (c.includes('gol') || c.includes('golazo') || c.includes('goal')) return 'Golazo';
  if (c.includes('fail') || c.includes('epic')) return 'Epic Fail';
  if (c.includes('parat')) return 'Paratona';
  if (c.includes('giocat')) return 'Giocata';
  return cat.trim() || 'Giocata';
}

/**
 * Checks if a string looks like a known media category.
 */
export function isMediaCategory(val: string): boolean {
  const v = (val || '').trim().toLowerCase();
  return (
    v.includes('gol') ||
    v.includes('fail') ||
    v.includes('parat') ||
    v.includes('giocat') ||
    v.includes('partita') ||
    v.includes('completa') ||
    v.includes('sintesi') ||
    v.includes('highlight')
  );
}

/**
 * Extracts date components from a free-text string.
 */
export function extractDateFromText(str: string): { day: number; month: number; year: number } | null {
  if (!str) return null;

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const itMatch = str.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
  if (itMatch) {
    let y = parseInt(itMatch[3], 10);
    if (y < 100) y += 2000;
    return { day: parseInt(itMatch[1], 10), month: parseInt(itMatch[2], 10), year: y };
  }

  // YYYY-MM-DD
  const isoMatch = str.match(/\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/);
  if (isoMatch) {
    return { day: parseInt(isoMatch[3], 10), month: parseInt(isoMatch[2], 10), year: parseInt(isoMatch[1], 10) };
  }

  // Italian textual month: "12 ottobre 2026", "7 settembre 2026"
  const months: Record<string, number> = {
    gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6,
    luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12
  };
  const textMatch = str.toLowerCase().match(/\b(\d{1,2})\s+([a-z]+)\s+(\d{4})\b/);
  if (textMatch && months[textMatch[2]]) {
    return { day: parseInt(textMatch[1], 10), month: months[textMatch[2]], year: parseInt(textMatch[3], 10) };
  }

  return null;
}

/**
 * Extracts date components from match data ISO string (e.g. '2026-10-12').
 */
export function getMatchDateParts(matchData: string): { day: number; month: number; year: number } | null {
  if (!matchData) return null;
  const iso = matchData.slice(0, 10);
  const parts = iso.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return { day: d, month: m, year: y };
  }
  const d = new Date(matchData);
  if (!isNaN(d.getTime())) {
    return { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
  }
  return null;
}

function normalizeString(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Intelligent match finding against list of matches.
 */
export function findBestMatch(partitaQuery: string, matches: MatchRef[]): { matchId: number | null; confidence: number } {
  if (!partitaQuery || !matches || matches.length === 0) {
    return { matchId: null, confidence: 0 };
  }

  const cleanQuery = partitaQuery.trim();

  // 1. Direct ID check (#14 or 14)
  const idMatch = cleanQuery.replace(/^#/, '');
  const parsedId = parseInt(idMatch, 10);
  if (!isNaN(parsedId) && String(parsedId) === idMatch && matches.some(m => m.id === parsedId)) {
    return { matchId: parsedId, confidence: 100 };
  }

  const queryDate = extractDateFromText(cleanQuery);
  const normQuery = normalizeString(cleanQuery);

  let bestMatch: MatchRef | null = null;
  let highestScore = 0;

  for (const m of matches) {
    let score = 0;
    const mDate = getMatchDateParts(m.data);

    // Date score (+60)
    if (queryDate && mDate) {
      if (queryDate.day === mDate.day && queryDate.month === mDate.month && queryDate.year === mDate.year) {
        score += 60;
      }
    }

    // Teams score (+40 if both, +20 if one)
    const normA = normalizeString(m.team_a_name);
    const normB = normalizeString(m.team_b_name);

    const aInQuery = normA.length > 2 && normQuery.includes(normA);
    const bInQuery = normB.length > 2 && normQuery.includes(normB);

    if (aInQuery && bInQuery) score += 40;
    else if (aInQuery || bInQuery) score += 20;

    // Score comparison (+15)
    if (m.risultato) {
      const normRes = normalizeString(m.risultato);
      if (normRes && normQuery.includes(normRes)) {
        score += 15;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = m;
    }
  }

  if (highestScore >= 30 && bestMatch) {
    return { matchId: bestMatch.id, confidence: highestScore };
  }

  return { matchId: null, confidence: highestScore };
}

/**
 * Auto-detect delimiter from text (tab, semicolon, pipe, comma).
 */
export function detectDelimiter(text: string): string {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return '\t';

  const counts: Record<string, number> = { '\t': 0, ';': 0, '|': 0, ',': 0 };
  for (const l of lines) {
    for (const d of Object.keys(counts)) {
      counts[d] += l.split(d).length - 1;
    }
  }

  let best = '\t';
  let max = 0;
  for (const [d, c] of Object.entries(counts)) {
    if (c > max) {
      max = c;
      best = d;
    }
  }
  return max > 0 ? best : '\t';
}

/**
 * Splits a line by delimiter respecting quotes.
 */
export function splitRow(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' || ch === "'") {
      inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result.map(s => s.replace(/^["']|["']$/g, '').trim());
}

/**
 * Checks if a row is a header line (e.g. 'Partita | Link YouTube | Autore | Categoria | Co-Autori').
 */
export function isHeaderRow(cols: string[]): boolean {
  const combined = cols.join(' ').toLowerCase();
  return (
    (combined.includes('partita') || combined.includes('match')) &&
    (combined.includes('link') || combined.includes('youtube') || combined.includes('url') || combined.includes('video')) &&
    (combined.includes('autore') || combined.includes('categoria'))
  );
}

/**
 * Parses raw text into ParsedMediaRow items with match detection.
 */
export function parseMediaText(
  rawText: string,
  matches: MatchRef[],
  forcedDelimiter?: string,
  defaultMatchId?: number | null
): ParsedMediaRow[] {
  if (!rawText || !rawText.trim()) return [];

  const delimiter = forcedDelimiter && forcedDelimiter !== 'auto' 
    ? forcedDelimiter 
    : detectDelimiter(rawText);

  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const parsedRows: ParsedMediaRow[] = [];

  lines.forEach((line, index) => {
    const cols = splitRow(line, delimiter);

    // Skip empty lines or headers
    if (cols.length === 0 || (cols.length === 1 && !cols[0])) return;
    if (isHeaderRow(cols)) return;

    let partitaStr = '';
    let linkStr = '';
    let autoreStr = '';
    let categoriaStr = '';
    let coAutoreStr = '';

    // Smart Column Identification
    const ytIndex = cols.findIndex(c => /youtube\.com|youtu\.be|^[a-zA-Z0-9_-]{11}$/i.test(c));
    const catIndex = cols.findIndex(c => isMediaCategory(c));

    if (ytIndex !== -1) {
      linkStr = cols[ytIndex] || '';

      if (catIndex !== -1 && catIndex !== ytIndex) {
        categoriaStr = cols[catIndex] || '';
      }

      // Remaining columns for Partita, Autore, Co-Autori
      const remainingIndices = cols
        .map((_, i) => i)
        .filter(i => i !== ytIndex && i !== catIndex);

      if (remainingIndices.length > 0) {
        partitaStr = cols[remainingIndices[0]] || '';
      }
      if (remainingIndices.length > 1) {
        autoreStr = cols[remainingIndices[1]] || '';
      }
      if (remainingIndices.length > 2) {
        coAutoreStr = cols.slice(remainingIndices[2]).join(', ');
      }
    } else {
      // Positional Fallback: Partita | Link | Autore | Categoria | Co-Autori
      partitaStr = cols[0] || '';
      linkStr = cols[1] || '';
      autoreStr = cols[2] || '';

      // Check if col[3] is category or col[4] is category
      if (cols[3] && isMediaCategory(cols[3])) {
        categoriaStr = cols[3];
        coAutoreStr = cols.slice(4).join(', ');
      } else if (cols[4] && isMediaCategory(cols[4])) {
        coAutoreStr = cols[3];
        categoriaStr = cols[4];
      } else {
        categoriaStr = cols[3] || 'Giocata';
        coAutoreStr = cols.slice(4).join(', ');
      }
    }

    const cleanYoutubeId = extractYoutubeId(linkStr);
    const normalizedCat = normalizeCategory(categoriaStr);

    // Match detection
    let matchedId: number | null = null;
    let confidence = 0;

    if (partitaStr) {
      const matchResult = findBestMatch(partitaStr, matches);
      matchedId = matchResult.matchId;
      confidence = matchResult.confidence;
    }

    // Fallback to defaultMatchId if not found and default is provided
    if (!matchedId && defaultMatchId) {
      matchedId = defaultMatchId;
      confidence = 50;
    }

    // Validation
    const errors: string[] = [];
    if (!matchedId) errors.push('Partita non trovata o non selezionata');
    if (!cleanYoutubeId || cleanYoutubeId.length !== 11) errors.push('Link YouTube non valido');
    if (!normalizedCat) errors.push('Categoria mancante');

    parsedRows.push({
      id: `row-${index}-${Date.now()}`,
      rawLine: line,
      partitaStr,
      matchedMatchId: matchedId,
      confidence,
      youtubeUrl: linkStr,
      youtubeId: cleanYoutubeId,
      autore: autoreStr,
      categoria: normalizedCat,
      coAutore: coAutoreStr,
      isValid: errors.length === 0,
      error: errors.join(', ')
    });
  });

  return parsedRows;
}

/**
 * Generates an example TSV template content.
 */
export function generateSampleTxt(): string {
  return [
    'Partita\tLink YouTube\tAutore\tCategoria\tCo-Autori',
    'Hollywood - Bollywood 2-17 del 12/10/2026\thttps://youtu.be/dQw4w9WgXcQ\tSergioF\tGolazo\tLuca',
    'Hollywood - Bollywood 2-17 del 12/10/2026\thttps://youtu.be/dQw4w9WgXcQ\tMichelangelo\tEpic Fail\t',
    'Hollywood - Bollywood 2-17 del 12/10/2026\thttps://youtu.be/dQw4w9WgXcQ\tSalvoM\tParata\t',
    'Hollywood - Bollywood 2-17 del 12/10/2026\thttps://youtu.be/dQw4w9WgXcQ\tHollywood\tPartita Completa\t'
  ].join('\n');
}

/**
 * 1-Click extraction script to run in YouTube Studio console.
 */
export const YOUTUBE_STUDIO_SNIPPET = `(() => {
  const rows = Array.from(document.querySelectorAll('ytcp-video-row'));
  if (!rows.length) return alert("⚠️ Nessun video trovato. Apri la schermata Contenuti/Caricamenti di YouTube Studio!");

  const videos = [];
  for (const row of rows) {
    const titleEl = row.querySelector('#video-title, ytcp-video-title a');
    if (!titleEl) continue;
    const title = (titleEl.textContent || '').trim();
    const href = titleEl.getAttribute('href') || '';
    const idMatch = href.match(/\\/video\\/([a-zA-Z0-9_-]{11})/);
    if (idMatch && title) {
      videos.push({ title, url: \`https://youtu.be/\${idMatch[1]}\` });
    }
  }

  const firstTitle = videos[0]?.title || '';
  const dateMatch = firstTitle.match(/\\d{4}[\\s\\-_/]\\d{2}[\\s\\-_/]\\d{2}/)?.[0] || '';
  const matchFilter = dateMatch || firstTitle.split(/\\s*[-–]\\s*/)[0]?.trim() || '';
  const matchName = dateMatch || firstTitle.split(/\\s*[-–]\\s*/).slice(0, 2).join(' - ') || 'Ultima Partita';

  const tsv = ['Partita\\tLink YouTube\\tAutore\\tCategoria\\tCo-Autori'];
  let count = 0;

  for (const v of videos) {
    if (matchFilter && !v.title.toLowerCase().includes(matchFilter.toLowerCase())) continue;

    let cat = 'Golazo';
    if (/parata|paratona/i.test(v.title)) cat = 'Parata';
    else if (/fail|epic/i.test(v.title)) cat = 'Epic Fail';
    else if (/giocata/i.test(v.title)) cat = 'Giocata';
    else if (/partita completa|\\bfull\\b/i.test(v.title)) cat = 'Partita Completa';
    else if (/sintesi|\\bhighlights?\\b|\\brecap\\b/i.test(v.title)) cat = 'Sintesi';

    let coAutore = '';
    const assistMatch = v.title.match(/assist\\s+([A-Za-z0-9\\s]+)/i);
    if (assistMatch) {
      coAutore = assistMatch[1].trim();
    }

    let cleanTitle = v.title.replace(new RegExp(\`\\\\s*assist\\\\s+\${coAutore}\`, 'i'), '').trim();

    let autore = '';
    if (cat === 'Partita Completa' || cat === 'Sintesi') {
      autore = '';
    } else {
      const parts = cleanTitle.split(/\\s*[-–]\\s*/);
      if (parts.length >= 4) {
        autore = parts[parts.length - 2].trim();
      } else if (parts.length === 3) {
        const lastPart = parts[2].trim();
        const midPart = parts[1].trim();
        if (/^(golazo|gol|epic fail|fail|parata|paratona|giocata)\\b/i.test(lastPart)) {
          autore = midPart;
        } else {
          autore = lastPart
            .replace(/(\\d+\\s*)?(eurogol|golazo|gol|goals?)\\b.*$/i, '')
            .replace(/\\b(giocata|parata|paratona|fail|epic fail)\\b.*$/i, '')
            .replace(/\\b\\d+-\\d+\\b.*$/i, '')
            .replace(/^[-–:\\s]+|[-–:\\s]+$/g, '')
            .trim();
        }
      } else {
        const candidate = parts[parts.length - 1].trim();
        autore = candidate
          .replace(/(\\d+\\s*)?(eurogol|golazo|gol|goals?)\\b.*$/i, '')
          .replace(/\\b(giocata|parata|paratona|fail|epic fail)\\b.*$/i, '')
          .replace(/\\b\\d+-\\d+\\b.*$/i, '')
          .replace(/^[-–:\\s]+|[-–:\\s]+$/g, '')
          .trim();
      }
    }

    if (/^\\d+$/.test(autore)) {
      autore = '';
    }

    tsv.push(\`\${matchName}\\t\${v.url}\\t\${autore}\\t\${cat}\\t\${coAutore}\`);
    count++;
  }

  const result = tsv.join('\\n');
  navigator.clipboard.writeText(result);
  const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'media_pronti_per_db.txt';
  a.click();

  alert(\`✅ \${count} video dell'ultima partita estratti!\\n- Partita: \${matchName}\\n- Autori estratti dinamicamente\\n- Testo copiato negli appunti (pronto per Ctrl+V sul sito)\\n- File "media_pronti_per_db.txt" scaricato!\`);
})();`;


