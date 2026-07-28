import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';
import { recalculateAndSaveClassifica } from '../../../../lib/classifica-utils';

export async function POST(req: Request) {
  try {
    const { id, risultato, marcatori_a, marcatori_b, voti_giocatori, password } = await req.json();

    if (password !== 'ramborambo') {
      return NextResponse.json({ success: false, error: 'Password non valida' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID partita mancante' }, { status: 400 });
    }

    const currentMatch = await sql`SELECT * FROM public."Risultati" WHERE id = ${id}`;
    if (currentMatch.length === 0) {
      return NextResponse.json({ success: false, error: 'Partita non trovata' }, { status: 404 });
    }
    
    const m = currentMatch[0];
    let voti = (voti_giocatori && Object.keys(voti_giocatori).length > 0) ? voti_giocatori : (m.voti_giocatori || {});

    // Se stiamo salvando un risultato definitivo e i voti sono vuoti, assegniamo i default
    if (Object.keys(voti).length === 0 && risultato && risultato !== '0-0') {
      const [scoreAStr, scoreBStr] = risultato.split('-');
      const scoreA = parseInt(scoreAStr?.trim(), 10);
      const scoreB = parseInt(scoreBStr?.trim(), 10);
      
      if (!isNaN(scoreA) && !isNaN(scoreB)) {
        const teamAWin = scoreA > scoreB;
        const teamBWin = scoreB > scoreA;
        const draw = scoreA === scoreB;
        
        const playersA = Array.isArray(m.team_a_players) ? m.team_a_players : [];
        const playersB = Array.isArray(m.team_b_players) ? m.team_b_players : [];
        
        playersA.forEach((p: string) => {
          if (teamAWin) voti[p] = 7;
          else if (teamBWin) voti[p] = 5;
          else voti[p] = 6;
        });
        
        playersB.forEach((p: string) => {
          if (teamBWin) voti[p] = 7;
          else if (teamAWin) voti[p] = 5;
          else voti[p] = 6;
        });
      }
    }

    const result = await sql`
      UPDATE public."Risultati"
      SET risultato = ${risultato}, 
          marcatori_a = ${JSON.stringify(marcatori_a)}::jsonb, 
          marcatori_b = ${JSON.stringify(marcatori_b)}::jsonb,
          voti_giocatori = ${JSON.stringify(voti)}::jsonb
      WHERE id = ${id}
      RETURNING *;
    `;

    // Ricalcola e salva la classifica in modo atomico dopo ogni aggiornamento risultato
    const leaderboard = await recalculateAndSaveClassifica(sql);

    return NextResponse.json({
      success: true,
      message: 'Risultato aggiornato con successo',
      match: result[0],
      leaderboard,
    });
  } catch (error: any) {
    console.error('Update Result Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Errore interno nel salvataggio' }, { status: 500 });
  }
}
