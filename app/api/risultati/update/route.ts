import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';

export async function POST(req: Request) {
  try {
    const { id, risultato, marcatori_a, marcatori_b, password } = await req.json();

    if (password !== 'ramborambo') {
      return NextResponse.json({ success: false, error: 'Password non valida' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID partita mancante' }, { status: 400 });
    }

    const result = await sql`
      UPDATE public."Risultati"
      SET risultato = ${risultato}, marcatori_a = ${marcatori_a}, marcatori_b = ${marcatori_b}
      WHERE id = ${id}
      RETURNING *;
    `;

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: 'Partita non trovata' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Risultato aggiornato con successo',
      match: result[0]
    });
  } catch (error) {
    console.error('Update Result Error:', error);
    return NextResponse.json({ success: false, error: 'Errore interno nel salvataggio' }, { status: 500 });
  }
}
