import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await sql`ALTER TABLE public."Risultati" ADD COLUMN IF NOT EXISTS "Stadium" TEXT;`;
    await sql`ALTER TABLE public."Giocatori" ADD COLUMN IF NOT EXISTS "Skill" TEXT;`;
    await sql`ALTER TABLE public."Giocatori" ADD COLUMN IF NOT EXISTS "origine_punteggi" TEXT;`;
    await sql`ALTER TABLE public."Risultati" ADD COLUMN IF NOT EXISTS "voti_giocatori" JSONB;`;
    await sql`ALTER TABLE public."classifica" ADD COLUMN IF NOT EXISTS "media_voto" REAL DEFAULT 0;`;
    await sql`
      CREATE TABLE IF NOT EXISTS public."Media" (
        id SERIAL PRIMARY KEY,
        partita_id INTEGER REFERENCES public."Risultati"(id) ON DELETE CASCADE,
        giocatore TEXT,
        co_giocatore TEXT,
        tipologia TEXT NOT NULL,
        youtube_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await sql`ALTER TABLE public."Media" ADD COLUMN IF NOT EXISTS co_giocatore TEXT;`;
    
    return NextResponse.json({ success: true, message: "Database columns and tables added successfully!" });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
