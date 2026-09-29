import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Otteniamo l'ultima partita inserita
    const matches = await sql`
      SELECT * FROM public."Risultati" 
      ORDER BY data DESC, ora DESC
      LIMIT 1
    `;
    
    if (!matches || matches.length === 0) {
      return NextResponse.json({ error: 'Nessuna partita trovata' }, { status: 404 });
    }

    return NextResponse.json(matches[0], {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Fetch Live Match Error:', error);
    return NextResponse.json({ error: 'Failed to fetch live match' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, risultato, marcatori_a, marcatori_b } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID partita mancante' }, { status: 400 });
    }

    await sql`
      UPDATE public."Risultati"
      SET 
        risultato = ${risultato},
        marcatori_a = ${JSON.stringify(marcatori_a)}::jsonb,
        marcatori_b = ${JSON.stringify(marcatori_b)}::jsonb
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update Live Match Error:', error);
    return NextResponse.json({ error: 'Failed to update live match' }, { status: 500 });
  }
}
