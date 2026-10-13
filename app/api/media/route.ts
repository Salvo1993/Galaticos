import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await sql`
      SELECT id, partita_id, giocatore, co_giocatore, tipologia, youtube_id, created_at
      FROM public."Media"
      ORDER BY id DESC;
    `;
    return NextResponse.json(result);
  } catch (error) {
    console.error('Fetch Media Error:', error);
    // Return empty array if table doesn't exist yet to prevent UI crashes
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if bulk insert
    if (Array.isArray(body) || Array.isArray(body?.items)) {
      const items = Array.isArray(body) ? body : body.items;
      if (!items || items.length === 0) {
        return NextResponse.json({ success: false, error: 'Nessun elemento fornito' }, { status: 400 });
      }

      let insertedCount = 0;
      for (const item of items) {
        const { partita_id, giocatore, co_giocatore, tipologia, youtube_id } = item;
        if (!partita_id || !tipologia || !youtube_id) continue;

        await sql`
          INSERT INTO public."Media" (partita_id, giocatore, co_giocatore, tipologia, youtube_id)
          VALUES (${Number(partita_id)}, ${giocatore || null}, ${co_giocatore || null}, ${tipologia}, ${youtube_id});
        `;
        insertedCount++;
      }

      return NextResponse.json({ success: true, count: insertedCount });
    }

    // Single item insert
    const { partita_id, giocatore, co_giocatore, tipologia, youtube_id } = body;
    
    if (!partita_id || !tipologia || !youtube_id) {
      return NextResponse.json({ success: false, error: 'Parametri mancanti' }, { status: 400 });
    }
    
    await sql`
      INSERT INTO public."Media" (partita_id, giocatore, co_giocatore, tipologia, youtube_id)
      VALUES (${Number(partita_id)}, ${giocatore || null}, ${co_giocatore || null}, ${tipologia}, ${youtube_id});
    `;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Insert Media Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, partita_id, giocatore, co_giocatore, tipologia, youtube_id } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID mancante' }, { status: 400 });
    }

    if (!partita_id || !tipologia || !youtube_id) {
      return NextResponse.json({ success: false, error: 'Campi obbligatori mancanti' }, { status: 400 });
    }

    // Clean youtube_id in case a full url was passed
    let cleanYtId = String(youtube_id).trim();
    const ytMatch = cleanYtId.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    if (ytMatch) cleanYtId = ytMatch[1];

    await sql`
      UPDATE public."Media"
      SET 
        partita_id = ${Number(partita_id)},
        giocatore = ${giocatore ? String(giocatore).trim() : null},
        co_giocatore = ${co_giocatore ? String(co_giocatore).trim() : null},
        tipologia = ${String(tipologia).trim()},
        youtube_id = ${cleanYtId}
      WHERE id = ${Number(id)};
    `;

    return NextResponse.json({ 
      success: true, 
      item: {
        id: Number(id),
        partita_id: Number(partita_id),
        giocatore: giocatore ? String(giocatore).trim() : null,
        co_giocatore: co_giocatore ? String(co_giocatore).trim() : null,
        tipologia: String(tipologia).trim(),
        youtube_id: cleanYtId
      }
    });
  } catch (error: any) {
    console.error('Update Media Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID mancante' }, { status: 400 });
    }

    await sql`
      DELETE FROM public."Media"
      WHERE id = ${Number(id)};
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Media Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

