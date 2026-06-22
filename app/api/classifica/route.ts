import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';

export async function GET() {
  try {
    const matches = await sql`SELECT * FROM public."Risultati" WHERE risultato IS NOT NULL AND risultato != ''`;
    
    const stats: Record<string, { partite_giocate: number, punti_assoluti: number, gol_fatti: number }> = {};

    matches.forEach(m => {
      // Parse score
      const [scoreAStr, scoreBStr] = m.risultato.split('-');
      if (scoreAStr === undefined || scoreBStr === undefined) return;
      const scoreA = parseInt(scoreAStr.trim(), 10);
      const scoreB = parseInt(scoreBStr.trim(), 10);
      
      if (isNaN(scoreA) || isNaN(scoreB)) return;

      const teamAWin = scoreA > scoreB;
      const teamBWin = scoreB > scoreA;
      const draw = scoreA === scoreB;

      // Ensure players are arrays
      const playersA = Array.isArray(m.team_a_players) ? m.team_a_players : [];
      const playersB = Array.isArray(m.team_b_players) ? m.team_b_players : [];

      playersA.forEach((p: string) => {
        if (!stats[p]) stats[p] = { partite_giocate: 0, punti_assoluti: 0, gol_fatti: 0 };
        stats[p].partite_giocate += 1;
        if (teamAWin) stats[p].punti_assoluti += 3;
        else if (draw) stats[p].punti_assoluti += 1;
      });

      playersB.forEach((p: string) => {
        if (!stats[p]) stats[p] = { partite_giocate: 0, punti_assoluti: 0, gol_fatti: 0 };
        stats[p].partite_giocate += 1;
        if (teamBWin) stats[p].punti_assoluti += 3;
        else if (draw) stats[p].punti_assoluti += 1;
      });

      // Parse goals
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

      const scorersA = parseScorersStr(m.marcatori_a);
      const scorersB = parseScorersStr(m.marcatori_b);

      Object.entries(scorersA).forEach(([name, count]) => {
        if (!stats[name]) stats[name] = { partite_giocate: 0, punti_assoluti: 0, gol_fatti: 0 };
        stats[name].gol_fatti += count;
      });

      Object.entries(scorersB).forEach(([name, count]) => {
        if (!stats[name]) stats[name] = { partite_giocate: 0, punti_assoluti: 0, gol_fatti: 0 };
        stats[name].gol_fatti += count;
      });
    });

    const leaderboard = Object.entries(stats).map(([nome, data]) => {
      const pt_partita = data.partite_giocate > 0 ? (data.punti_assoluti / data.partite_giocate).toFixed(2) : '0.00';
      return {
        nome,
        ...data,
        pt_partita: parseFloat(pt_partita)
      };
    });

    // Sort by pt_partita DESC, then punti_assoluti DESC, then gol_fatti DESC
    leaderboard.sort((a, b) => {
      if (b.pt_partita !== a.pt_partita) return b.pt_partita - a.pt_partita;
      if (b.punti_assoluti !== a.punti_assoluti) return b.punti_assoluti - a.punti_assoluti;
      if (b.gol_fatti !== a.gol_fatti) return b.gol_fatti - a.gol_fatti;
      return a.nome.localeCompare(b.nome);
    });

    // Only update DB if we have data
    if (leaderboard.length > 0) {
      // Run sequentially or in a transaction. Delete then insert is easy.
      await sql`DELETE FROM public."classifica"`;
      
      for (const p of leaderboard) {
        await sql`
          INSERT INTO public."classifica" (nome, pt_partita, partite_giocate, punti_assoluti, gol_fatti)
          VALUES (${p.nome}, ${p.pt_partita}, ${p.partite_giocate}, ${p.punti_assoluti}, ${p.gol_fatti})
        `;
      }
    } else {
      // fallback if it's empty, we might want to just read from table just in case?
      // actually if there are no matches, leaderboard is empty, that's fine.
    }

    return NextResponse.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Classifica Error:', error);
    return NextResponse.json({ success: false, error: 'Errore nel calcolo della classifica' }, { status: 500 });
  }
}
