import { NeonQueryFunction } from '@neondatabase/serverless';

export interface LeaderboardEntry {
  nome: string;
  partite_giocate: number;
  vittorie: number;
  pareggi: number;
  sconfitte: number;
  punti_assoluti: number;
  gol_fatti: number;
  pt_partita: number;
  media_voto: number;
  mvp_count: number;
}

const parseScorersStr = (scorersInput: any): Record<string, number> => {
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
  scorersStr.split(',').forEach(s => {
    const trimmed = s.trim();
    if (!trimmed) return;
    const match = trimmed.match(/^(.*?)(?:\s*\((\d+)\))?$/);
    if (match) {
      const name = match[1].trim();
      const count = match[2] ? parseInt(match[2], 10) : 1;
      map[name] = (map[name] || 0) + count;
    }
  });
  return map;
};

export async function recalculateAndSaveClassifica(sql: NeonQueryFunction<false, false>): Promise<LeaderboardEntry[]> {
  // Legge tutti i risultati validi (non 0-0, non vuoti)
  const matches = await sql`
    SELECT * FROM public."Risultati"
    WHERE risultato IS NOT NULL
      AND risultato != ''
      AND risultato != '0-0'
  `;

  const stats: Record<string, { partite_giocate: number; punti_assoluti: number; gol_fatti: number; vittorie: number; pareggi: number; sconfitte: number; somma_voti: number; partite_voto: number; mvp_count: number }> = {};

  matches.forEach((m: any) => {
    const [scoreAStr, scoreBStr] = m.risultato.split('-');
    if (scoreAStr === undefined || scoreBStr === undefined) return;
    const scoreA = parseInt(scoreAStr.trim(), 10);
    const scoreB = parseInt(scoreBStr.trim(), 10);
    if (isNaN(scoreA) || isNaN(scoreB)) return;

    const matchDate = new Date(m.data);
    const isInterruptedMatch = matchDate.getDate() === 8 && matchDate.getMonth() === 6 && matchDate.getFullYear() === 2026 && m.ora && m.ora.startsWith('21');
    if (isInterruptedMatch) return;

    const teamAWin = scoreA > scoreB;
    const teamBWin = scoreB > scoreA;
    const draw = scoreA === scoreB;

    const playersA = Array.isArray(m.team_a_players) ? m.team_a_players : [];
    const playersB = Array.isArray(m.team_b_players) ? m.team_b_players : [];

    const voti = m.voti_giocatori || {};
    
    let maxVote = 0;
    const allPlayersInMatch = [...playersA, ...playersB];
    allPlayersInMatch.forEach(p => {
      if (voti[p] !== undefined && typeof voti[p] === 'number' && voti[p] > maxVote) {
        maxVote = voti[p];
      }
    });
    const mvpsInMatch = maxVote > 0 ? allPlayersInMatch.filter(p => voti[p] === maxVote) : [];

    playersA.forEach((p: string) => {
      if (!stats[p]) stats[p] = { partite_giocate: 0, punti_assoluti: 0, gol_fatti: 0, vittorie: 0, pareggi: 0, sconfitte: 0, somma_voti: 0, partite_voto: 0, mvp_count: 0 };
      stats[p].partite_giocate += 1;
      if (teamAWin) { stats[p].punti_assoluti += 3; stats[p].vittorie += 1; }
      else if (draw) { stats[p].punti_assoluti += 1; stats[p].pareggi += 1; }
      else { stats[p].sconfitte += 1; }
      
      if (voti[p] !== undefined && typeof voti[p] === 'number') {
         stats[p].somma_voti += voti[p];
         stats[p].partite_voto += 1;
      }
      if (mvpsInMatch.includes(p)) {
        stats[p].mvp_count += 1;
      }
    });

    playersB.forEach((p: string) => {
      if (!stats[p]) stats[p] = { partite_giocate: 0, punti_assoluti: 0, gol_fatti: 0, vittorie: 0, pareggi: 0, sconfitte: 0, somma_voti: 0, partite_voto: 0, mvp_count: 0 };
      stats[p].partite_giocate += 1;
      if (teamBWin) { stats[p].punti_assoluti += 3; stats[p].vittorie += 1; }
      else if (draw) { stats[p].punti_assoluti += 1; stats[p].pareggi += 1; }
      else { stats[p].sconfitte += 1; }
      
      if (voti[p] !== undefined && typeof voti[p] === 'number') {
         stats[p].somma_voti += voti[p];
         stats[p].partite_voto += 1;
      }
      if (mvpsInMatch.includes(p)) {
        stats[p].mvp_count += 1;
      }
    });

    const scorersA = parseScorersStr(m.marcatori_a);
    const scorersB = parseScorersStr(m.marcatori_b);

    Object.entries(scorersA).forEach(([name, count]) => {
      if (!stats[name]) stats[name] = { partite_giocate: 0, punti_assoluti: 0, gol_fatti: 0, vittorie: 0, pareggi: 0, sconfitte: 0, somma_voti: 0, partite_voto: 0, mvp_count: 0 };
      stats[name].gol_fatti += count as number;
    });

    Object.entries(scorersB).forEach(([name, count]) => {
      if (!stats[name]) stats[name] = { partite_giocate: 0, punti_assoluti: 0, gol_fatti: 0, vittorie: 0, pareggi: 0, sconfitte: 0, somma_voti: 0, partite_voto: 0, mvp_count: 0 };
      stats[name].gol_fatti += count as number;
    });
  });

  let leaderboard: LeaderboardEntry[] = Object.entries(stats)
    .filter(([nome, data]) => data.partite_giocate > 0)
    .map(([nome, data]) => {
      const pt_partita = data.partite_giocate > 0
        ? parseFloat((data.punti_assoluti / data.partite_giocate).toFixed(2))
        : 0;
      const media_voto = data.partite_voto > 0
        ? parseFloat((data.somma_voti / data.partite_voto).toFixed(2))
        : 0;
      return { nome, ...data, pt_partita, media_voto };
    });

  // Ordina: punti_assoluti DESC, pt_partita DESC, media_voto DESC, gol_fatti DESC, nome ASC
  leaderboard.sort((a, b) => {
    if (b.punti_assoluti !== a.punti_assoluti) return b.punti_assoluti - a.punti_assoluti;
    if (b.pt_partita !== a.pt_partita) return b.pt_partita - a.pt_partita;
    if (b.media_voto !== a.media_voto) return b.media_voto - a.media_voto;
    if (b.gol_fatti !== a.gol_fatti) return b.gol_fatti - a.gol_fatti;
    return a.nome.localeCompare(b.nome);
  });

  // Aggiungi colonne dinamicamente se non esistono
  await sql`ALTER TABLE public."classifica" ADD COLUMN IF NOT EXISTS vittorie INTEGER DEFAULT 0`;
  await sql`ALTER TABLE public."classifica" ADD COLUMN IF NOT EXISTS pareggi INTEGER DEFAULT 0`;
  await sql`ALTER TABLE public."classifica" ADD COLUMN IF NOT EXISTS sconfitte INTEGER DEFAULT 0`;

  await sql`ALTER TABLE public."classifica" ADD COLUMN IF NOT EXISTS media_voto REAL DEFAULT 0`;
  await sql`ALTER TABLE public."classifica" ADD COLUMN IF NOT EXISTS mvp_count INTEGER DEFAULT 0`;

  // Aggiorna la tabella classifica nel DB
  await sql`DELETE FROM public."classifica"`;

  for (const p of leaderboard) {
    await sql`
      INSERT INTO public."classifica" (nome, pt_partita, partite_giocate, punti_assoluti, gol_fatti, vittorie, pareggi, sconfitte, media_voto, mvp_count)
      VALUES (${p.nome}, ${p.pt_partita}, ${p.partite_giocate}, ${p.punti_assoluti}, ${p.gol_fatti}, ${p.vittorie}, ${p.pareggi}, ${p.sconfitte}, ${p.media_voto}, ${p.mvp_count})
    `;
  }

  return leaderboard;
}
