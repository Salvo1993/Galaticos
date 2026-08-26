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
    const { partita_id, giocatore, co_giocatore, tipologia, youtube_id, password } = body;
    
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: 'Password non valida' }, { status: 401 });
    }
    
    if (!partita_id || !tipologia || !youtube_id) {
      return NextResponse.json({ success: false, error: 'Parametri mancanti' }, { status: 400 });
    }
    
    await sql`
      INSERT INTO public."Media" (partita_id, giocatore, co_giocatore, tipologia, youtube_id)
      VALUES (${partita_id}, ${giocatore || null}, ${co_giocatore || null}, ${tipologia}, ${youtube_id})
    `;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Insert Media Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

