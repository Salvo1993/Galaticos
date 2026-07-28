import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';
import { recalculateAndSaveClassifica } from '../../../../lib/classifica-utils';

export async function POST(req: Request) {
  try {
    const { id, password } = await req.json();

    if (password !== 'ramborambo') {
      return NextResponse.json({ success: false, error: 'Password non valida' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID partita mancante' }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM public."Risultati"
      WHERE id = ${id}
      RETURNING id;
    `;

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: 'Partita non trovata' }, { status: 404 });
    }

    // Ricalcola e salva la classifica in modo atomico dopo ogni eliminazione
    const leaderboard = await recalculateAndSaveClassifica(sql);

    return NextResponse.json({
      success: true,
      message: 'Partita eliminata con successo',
      leaderboard,
    });
  } catch (error: any) {
    console.error('Delete Match Error:', error);
    return NextResponse.json({ success: false, error: "Errore interno durante l'eliminazione" }, { status: 500 });
  }
}
