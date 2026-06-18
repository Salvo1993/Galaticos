import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';

// Questa route deve sempre leggere dati freschi dal DB: niente cache statica
// di Next.js né cache Edge/CDN di Vercel, altrimenti dopo "Salva Formazione"
// l'Archivio Partite continua a mostrare dati vecchi (visto in produzione
// come risposta "304 Not Modified" / "Status: HIT" sulla cache di Vercel).
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const matches = await sql`
      SELECT * FROM public."Risultati" 
      ORDER BY data DESC, ora DESC
    `;
    return NextResponse.json(matches, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Fetch Matches Error:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}
