import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : (Array.isArray(body?.items) ? body.items : []);

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Nessun media fornito' }, { status: 400 });
    }

    let inserted = 0;
    const errors: string[] = [];

    for (const item of items) {
      const { partita_id, giocatore, co_giocatore, tipologia, youtube_id } = item;
      if (!partita_id || !tipologia || !youtube_id) {
        errors.push(`Riga non valida (campi mancanti): ${JSON.stringify(item)}`);
        continue;
      }

      await sql`
        INSERT INTO public."Media" (partita_id, giocatore, co_giocatore, tipologia, youtube_id)
        VALUES (${Number(partita_id)}, ${giocatore || null}, ${co_giocatore || null}, ${tipologia}, ${youtube_id});
      `;
      inserted++;
    }

    return NextResponse.json({
      success: true,
      insertedCount: inserted,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Bulk Insert Media Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Errore bulk insert' }, { status: 500 });
  }
}
