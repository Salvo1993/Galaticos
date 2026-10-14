import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';
import { assertAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  const authError = await assertAdmin(req);
  if (authError) return authError;

  try {
    await sql`ALTER TABLE public."Giocatori" ADD COLUMN IF NOT EXISTS figurina TEXT;`;
    return NextResponse.json({ success: true, message: "Colonna 'figurina' creata con successo nel Database!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
