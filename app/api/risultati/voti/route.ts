import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';
import { recalculateAndSaveClassifica } from '../../../../lib/classifica-utils';

export async function POST(req: Request) {
  try {
    const { matchId, playerName, delta, password } = await req.json();

    if (password !== 'ramborambo') {
      return NextResponse.json({ success: false, error: 'Password non valida' }, { status: 401 });
    }

    if (!matchId || !playerName || delta === undefined) {
      return NextResponse.json({ success: false, error: 'Dati mancanti' }, { status: 400 });
    }

    const currentMatch = await sql`SELECT * FROM public."Risultati" WHERE id = ${matchId}`;
    
    if (currentMatch.length === 0) {
      return NextResponse.json({ success: false, error: 'Partita non trovata' }, { status: 404 });
    }

    const m = currentMatch[0];
    let voti = m.voti_giocatori || {};
    
    // Se non esiste ancora un voto, assumiamo che parta da 6 come default base per evitare NaN
    const currentVote = voti[playerName] !== undefined ? voti[playerName] : 6;
    voti[playerName] = currentVote + delta;

    const result = await sql`
      UPDATE public."Risultati"
      SET voti_giocatori = ${JSON.stringify(voti)}::jsonb
      WHERE id = ${matchId}
      RETURNING *;
    `;

    // Ricalcola la classifica per aggiornare la media voto
    const leaderboard = await recalculateAndSaveClassifica(sql);

    return NextResponse.json({
      success: true,
      match: result[0],
      leaderboard,
    });
  } catch (error: any) {
    console.error('Update Vote Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Errore interno' }, { status: 500 });
  }
}
