import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';

export async function POST(req: Request) {
  try {
    const { maglia_chiara } = await req.json();
    await sql`UPDATE public."LatestSession" SET maglia_chiara = ${maglia_chiara} WHERE id = 1`;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Errore' }, { status: 500 });
  }
}
