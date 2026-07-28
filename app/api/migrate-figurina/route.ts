import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';

export async function GET() {
  try {
    await sql`ALTER TABLE public."Giocatori" ADD COLUMN IF NOT EXISTS figurina TEXT;`;
    return NextResponse.json({ success: true, message: "Colonna 'figurina' creata con successo nel Database!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
