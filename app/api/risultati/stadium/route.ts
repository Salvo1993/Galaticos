import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';

export async function POST(req: Request) {
  try {
    const { data, ora, stadium } = await req.json();

    if (!data || !ora) {
      return NextResponse.json({ success: false, error: 'Chiave partita mancante' }, { status: 400 });
    }

    // Normalizza data se necessario (se arriva formato ISO, converti in YYYY-MM-DD)
    const normalizedData = data.includes('T') ? data.split('T')[0] : data;

    const result = await sql`
      UPDATE public."Risultati"
      SET "Stadium" = ${stadium || null}
      WHERE data = ${normalizedData} AND ora = ${ora}
      RETURNING id, data, ora, "Stadium";
    `;

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: 'Partita non trovata' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Stadio aggiornato con successo',
      match: result[0]
    });
  } catch (error) {
    console.error('Update Stadium Error:', error);
    return NextResponse.json({ success: false, error: 'Errore interno nel salvataggio' }, { status: 500 });
  }
}
