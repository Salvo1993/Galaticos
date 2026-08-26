import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await sql`
      SELECT id, partita_id, giocatore, tipologia, youtube_id, created_at
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
