import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const awards = await sql`
      SELECT * FROM public."Awards" 
      ORDER BY mese_anno ASC
    `;
    
    return NextResponse.json({ success: true, awards });
  } catch (error: any) {
    console.error('Fetch Awards Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch awards' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mese_anno, primo_posto, secondo_posto, terzo_posto, stats_details } = body;

    if (!mese_anno || !primo_posto || !stats_details) {
      return NextResponse.json({ success: false, error: 'Mancano parametri essenziali' }, { status: 400 });
    }

    await sql`
      INSERT INTO public."Awards" (mese_anno, primo_posto, secondo_posto, terzo_posto, stats_details)
      VALUES (${mese_anno}, ${primo_posto}, ${secondo_posto}, ${terzo_posto}, ${JSON.stringify(stats_details)}::jsonb)
      ON CONFLICT (mese_anno) 
      DO UPDATE SET 
        primo_posto = EXCLUDED.primo_posto,
        secondo_posto = EXCLUDED.secondo_posto,
        terzo_posto = EXCLUDED.terzo_posto,
        stats_details = EXCLUDED.stats_details
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save Award Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save award' }, { status: 500 });
  }
}
