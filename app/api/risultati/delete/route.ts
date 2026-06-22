import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';

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

    return NextResponse.json({ 
      success: true, 
      message: 'Partita eliminata con successo'
    });
  } catch (error) {
    console.error('Delete Match Error:', error);
    return NextResponse.json({ success: false, error: 'Errore interno durante l\'eliminazione' }, { status: 500 });
  }
}
