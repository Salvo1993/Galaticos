import fs from 'fs';
import path from 'path';

// Known players for auto-detection
const KNOWN_PLAYERS = [
  'Tommaso LG', 'Michelangelo', 'Pino', 'Davide A', 'Davide', 
  'Pepito', 'Riccardo', 'MarcoM', 'Marco', 'Giuseppe LB', 
  'Giuseppe G', 'SalvoM', 'Salvo', 'Luca', 'SergioF', 'Sergio', 
  'Ale Buttitta', 'Ale LM', 'AntonioS', 'Fulì', 'Fuli', 'Pietro The Rock'
];

export async function fetchOEmbedTitle(url) {
  try {
    const res = await fetch('https://www.youtube.com/oembed?url=' + encodeURIComponent(url) + '&format=json');
    if (res.ok) {
      const data = await res.json();
      return data.title || '';
    }
  } catch (e) {
    // ignore
  }
  return '';
}

export function parseClipTitle(title, url, defaultMatch = 'Hollywood - Bollywood 2-17 del 12/10/2026') {
  let partita = defaultMatch;
  let autore = '';
  let categoria = 'Golazo';
  let coAutore = '';

  const clean = title.replace(/\s+/g, ' ').trim();

  // Partita
  if (/atene.*sparta/i.test(clean)) partita = 'Atene - Sparta';
  else if (/2026\s*09\s*07/i.test(clean)) partita = '07/09/2026 - MALENIANI vs MELONIANI';
  else if (/hollywood.*bollywood|2026\s*10\s*12/i.test(clean)) partita = 'Hollywood - Bollywood 2-17 del 12/10/2026';

  // Categoria
  if (/parata/i.test(clean)) categoria = 'Parata';
  else if (/fail/i.test(clean)) categoria = 'Epic Fail';
  else if (/giocata/i.test(clean)) categoria = 'Giocata';
  else if (/partita completa|2-20|2-17/i.test(clean)) categoria = 'Partita Completa';
  else if (/gol|eurogol/i.test(clean)) categoria = 'Golazo';

  // Autore from known players
  for (const p of KNOWN_PLAYERS) {
    const regex = new RegExp(`\\b${p.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (regex.test(clean)) {
      autore = p;
      break;
    }
  }

  // Dynamic author extraction fallback (works for all players in El Futbol and Galaticos)
  if (!autore) {
    const parts = clean.split(/\s*[-–]\s*/);
    let candidate = parts.length > 1 ? parts[parts.length - 1] : clean;
    const assistMatch = candidate.match(/assist\s+([A-Za-z0-9\s]+)/i);
    if (assistMatch) {
      coAutore = assistMatch[1].trim();
      candidate = candidate.replace(new RegExp(`\\s*assist\\s+${coAutore}`, 'i'), '').trim();
    }
    autore = candidate
      .replace(/(\d+\s*)?(eurogol|gol|goals?)\b.*$/i, '')
      .replace(/\b(giocata|parata|paratona|fail|epic fail)\b.*$/i, '')
      .replace(/\b\d+-\d+\b.*$/i, '')
      .replace(/^[-–:\s]+|[-–:\s]+$/g, '')
      .trim();
  }

  // Fallback for full match
  if (categoria === 'Partita Completa' && !autore) {
    autore = 'Hollywood';
  }

  return { partita, url, autore, categoria, coAutore };
}

async function main() {
  const inputFile = process.argv[2] || 'media_recuperati.txt';
  const fullPath = path.resolve(process.cwd(), inputFile);

  if (!fs.existsSync(fullPath)) {
    console.error(`File non trovato: ${fullPath}`);
    process.exit(1);
  }

  console.log(`Lettura file: ${inputFile}...`);
  const content = fs.readFileSync(fullPath, 'utf-8');
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const outputRows = [];
  outputRows.push('Partita\tLink YouTube\tAutore\tCategoria\tCo-Autori');

  for (const line of lines) {
    const parts = line.split('\t').map(p => p.trim());
    let title = '';
    let url = '';

    if (parts.length >= 2) {
      if (/youtu\.be|youtube\.com/.test(parts[1])) {
        title = parts[0];
        url = parts[1];
      } else if (/youtu\.be|youtube\.com/.test(parts[0])) {
        url = parts[0];
        title = parts[1];
      }
    } else if (parts.length === 1 && /youtu\.be|youtube\.com/.test(parts[0])) {
      url = parts[0];
    }

    if (!title || /^\d+:\d+(:\d+)?$/.test(title)) {
      console.log(`Recupero titolo per ${url}...`);
      title = await fetchOEmbedTitle(url);
    }

    if (url) {
      const parsed = parseClipTitle(title, url);
      if (parsed.partita.includes('Hollywood') || parsed.partita.includes('12/10/2026')) {
        outputRows.push(`${parsed.partita}\t${parsed.url}\t${parsed.autore}\t${parsed.categoria}\t${parsed.coAutore}`);
        console.log(`  ✓ ${title} -> Autore: ${parsed.autore || '-'}, Cat: ${parsed.categoria}`);
      }
    }
  }

  const resultText = outputRows.join('\n');
  const targetFile = path.resolve(process.cwd(), 'media_pronti_per_db.txt');
  fs.writeFileSync(targetFile, resultText, 'utf-8');

  console.log(`\n======================================================`);
  console.log(`File generato con successo: ${targetFile}`);
  console.log(`Totale video ultima partita compilati: ${outputRows.length - 1}`);
  console.log(`======================================================\n`);
}

main().catch(console.error);
