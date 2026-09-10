import { NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';

export async function POST(req: Request) {
  try {
    const { password, maglia_chiara } = await req.json();
    if (password !== 'ramborambo') return NextResponse.json({ success: false, error: 'Password errata' }, { status: 401 });
    await sql`UPDATE public."LatestSession" SET maglia_chiara = ${maglia_chiara} WHERE id = 1`;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Errore' }, { status: 500 });
  }
}
