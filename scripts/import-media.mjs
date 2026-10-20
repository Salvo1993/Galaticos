import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';

// 1. Resolve DB Connection String
function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.POSTGRES_URL) return process.env.POSTGRES_URL;

  // Try reading from .env.local or .env
  const envFiles = ['.env.local', '.env'];
  for (const envFile of envFiles) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const match = content.match(/(?:DATABASE_URL|POSTGRES_URL)=["']?([^"'\r\n]+)["']?/);
      if (match && match[1]) {
        return match[1];
      }
    }
  }

  // Fallback to known Neon connection string if available in other scripts
  return 'postgresql://neondb_owner:npg_TOhvPS9Zqf8I@ep-lingering-frost-a2i0975n-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require';
}

function extractYoutubeId(input) {
  if (!input) return '';
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vMatch) return vMatch[1];
  const pathMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/);
  if (pathMatch) return pathMatch[1];
  return trimmed;
}

function normalizeCategory(cat) {
  const c = (cat || '').trim().toLowerCase();
  if (c.includes('partita') || c.includes('completa') || c.includes('full')) return 'Partita Completa';
  if (c.includes('sintesi') || c.includes('highlights') || c.includes('highlight') || c.includes('recap')) return 'Sintesi';
  if (c.includes('gol') || c.includes('golazo') || c.includes('goal')) return 'Golazo';
  if (c.includes('fail') || c.includes('epic')) return 'Epic Fail';
  if (c.includes('parat')) return 'Paratona';
  if (c.includes('giocat')) return 'Giocata';
  return cat.trim() || 'Giocata';
}

function isMediaCategory(val) {
  const v = (val || '').trim().toLowerCase();
  return (
    v.includes('gol') ||
    v.includes('fail') ||
    v.includes('parat') ||
    v.includes('giocat') ||
    v.includes('partita') ||
    v.includes('completa')
  );
}

function extractDate(str) {
  if (!str) return null;
  const itMatch = str.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
  if (itMatch) {
    let y = parseInt(itMatch[3], 10);
    if (y < 100) y += 2000;
    return { day: parseInt(itMatch[1], 10), month: parseInt(itMatch[2], 10), year: y };
  }
  const isoMatch = str.match(/\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/);
  if (isoMatch) {
    return { day: parseInt(isoMatch[3], 10), month: parseInt(isoMatch[2], 10), year: parseInt(isoMatch[1], 10) };
  }
  const months = {
    gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6,
    luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12
  };
  const textMatch = str.toLowerCase().match(/\b(\d{1,2})\s+([a-z]+)\s+(\d{4})\b/);
  if (textMatch && months[textMatch[2]]) {
    return { day: parseInt(textMatch[1], 10), month: months[textMatch[2]], year: parseInt(textMatch[3], 10) };
  }
  return null;
}

function getMatchDateParts(matchData) {
  if (!matchData) return null;
  const iso = String(matchData).slice(0, 10);
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

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findBestMatch(partitaQuery, matches) {
  if (!partitaQuery || !matches || matches.length === 0) return null;
  const clean = partitaQuery.trim().replace(/^#/, '');
  const parsedId = parseInt(clean, 10);
  if (!isNaN(parsedId) && String(parsedId) === clean) {
    const direct = matches.find(m => m.id === parsedId);
    if (direct) return direct;
  }

  const queryDate = extractDate(partitaQuery);
  const normQuery = normalize(partitaQuery);

  let best = null;
  let highestScore = 0;

  for (const m of matches) {
    let score = 0;
    const mDate = getMatchDateParts(m.data);

    if (queryDate && mDate) {
      if (queryDate.day === mDate.day && queryDate.month === mDate.month && queryDate.year === mDate.year) {
        score += 60;
      }
    }

    const normA = normalize(m.team_a_name);
    const normB = normalize(m.team_b_name);

    const aInQuery = normA.length > 2 && normQuery.includes(normA);
    const bInQuery = normB.length > 2 && normQuery.includes(normB);

    if (aInQuery && bInQuery) score += 40;
    else if (aInQuery || bInQuery) score += 20;

    if (m.risultato) {
      const normRes = normalize(m.risultato);
      if (normRes && normQuery.includes(normRes)) score += 15;
    }

    if (score > highestScore) {
      highestScore = score;
      best = m;
    }
  }

  return highestScore >= 30 ? best : null;
}

function detectDelimiter(text) {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return '\t';
  const counts = { '\t': 0, ';': 0, '|': 0, ',': 0 };
  for (const l of lines) {
    for (const d of Object.keys(counts)) {
      counts[d] += l.split(d).length - 1;
    }
  }
  let best = '\t';
  let max = 0;
  for (const [d, c] of Object.entries(counts)) {
    if (c > max) { max = c; best = d; }
  }
  return max > 0 ? best : '\t';
}

function splitRow(line, delimiter) {
  const result = [];
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

async function main() {
  const args = process.argv.slice(2);
  const filePath = args[0];

  if (!filePath) {
    console.log(`
======================================================================
  CARICAMENTO IN BLOCCO ARCHIVIO MEDIA NEL DATABASE
======================================================================
Uso:
  node scripts/import-media.mjs <percorso-file.txt>

Formato atteso (separato da Tab o ';'):
  Partita | Link YouTube | Autore | Categoria | Co-Autori (opzionale)

Esempio di riga:
  Hollywood - Bollywood 2-17 del 12/10/2026	https://youtu.be/dQw4w9WgXcQ	SergioF	Golazo	Luca

Categorie accettate:
  - Golazo
  - Epic Fail
  - Parata / Paratona
  - Giocata
  - Partita Completa
======================================================================
`);
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`ERRORE: File non trovato: ${fullPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const dbUrl = getDatabaseUrl();
  console.log(`Connessione al database...`);
  const sql = neon(dbUrl);

  // Fetch matches from DB
  console.log(`Recupero partite esistenti dal DB...`);
  const matches = await sql`
    SELECT id, data, ora, team_a_name, team_b_name, risultato
    FROM public."Risultati"
    ORDER BY id DESC;
  `;
  console.log(`Trovate ${matches.length} partite nel database.`);

  const delimiter = detectDelimiter(content);
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const itemsToInsert = [];
  let skipped = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cols = splitRow(line, delimiter);

    // Skip headers
    const combined = cols.join(' ').toLowerCase();
    if (combined.includes('partita') && combined.includes('youtube')) {
      continue;
    }

    let partitaStr = cols[0] || '';
    let linkStr = cols[1] || '';
    let autoreStr = cols[2] || '';
    let categoriaStr = cols[3] || '';
    let coAutoreStr = cols.slice(4).join(', ');

    // Smart column swap if needed
    const ytIndex = cols.findIndex(c => /youtube\.com|youtu\.be|^[a-zA-Z0-9_-]{11}$/i.test(c));
    if (ytIndex !== -1 && ytIndex !== 1) {
      linkStr = cols[ytIndex];
      const remaining = cols.filter((_, idx) => idx !== ytIndex);
      partitaStr = remaining[0] || '';
      autoreStr = remaining[1] || '';
      categoriaStr = remaining[2] || '';
      coAutoreStr = remaining.slice(3).join(', ');
    }

    // Check if category is at index 4 and coAutore at index 3
    if (cols[4] && isMediaCategory(cols[4]) && !isMediaCategory(cols[3])) {
      coAutoreStr = cols[3];
      categoriaStr = cols[4];
    }

    const ytId = extractYoutubeId(linkStr);
    const cat = normalizeCategory(categoriaStr);
    const match = findBestMatch(partitaStr, matches);

    if (!match) {
      console.warn(`[Riga ${i + 1}] ⚠️ Partita non identificata per: "${partitaStr}". Riga saltata.`);
      skipped++;
      continue;
    }

    if (!ytId || ytId.length !== 11) {
      console.warn(`[Riga ${i + 1}] ⚠️ YouTube ID non valido: "${linkStr}". Riga saltata.`);
      skipped++;
      continue;
    }

    itemsToInsert.push({
      lineNum: i + 1,
      partita_id: match.id,
      matchSummary: `${match.data.slice(0, 10)} - ${match.team_a_name} vs ${match.team_b_name}`,
      giocatore: autoreStr || null,
      co_giocatore: coAutoreStr || null,
      tipologia: cat,
      youtube_id: ytId
    });
  }

  console.log(`\nMedia pronti per l'inserimento: ${itemsToInsert.length} (Righe saltate: ${skipped})`);

  let count = 0;
  for (const item of itemsToInsert) {
    await sql`
      INSERT INTO public."Media" (partita_id, giocatore, co_giocatore, tipologia, youtube_id)
      VALUES (${item.partita_id}, ${item.giocatore}, ${item.co_giocatore}, ${item.tipologia}, ${item.youtube_id});
    `;
    console.log(`  ✓ [Riga ${item.lineNum}] Partita ${item.partita_id} (${item.matchSummary}) | ${item.tipologia} | ${item.giocatore || '-'} | YouTube: ${item.youtube_id}`);
    count++;
  }

  console.log(`\n======================================================`);
  console.log(`🎉 SUCCESSO: ${count} media inseriti nell'Archivio Media!`);
  console.log(`======================================================\n`);
}

main().catch(err => {
  console.error('ERRORE:', err);
  process.exit(1);
});
