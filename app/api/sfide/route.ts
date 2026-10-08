import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS public."Sfide" (
        id SERIAL PRIMARY KEY,
        titolo VARCHAR(255) NOT NULL,
        giocatori JSONB NOT NULL,
        data_da VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    const sfide = await sql`SELECT * FROM public."Sfide" ORDER BY created_at DESC`;
    // The previous implementation mapped players inside frontend? Wait, frontend expects: 
    // d.sfide = array of { id, titolo, giocatori, data_da }
    return NextResponse.json({ success: true, sfide });
  } catch (error: any) {
    console.error('Fetch Sfide Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { titolo, giocatori, data_da } = await req.json();
    await sql`
      INSERT INTO public."Sfide" (titolo, giocatori, data_da)
      VALUES (${titolo}, ${JSON.stringify(giocatori)}::jsonb, ${data_da || null})
    `;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save Sfida Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID required' });
    
    await sql`DELETE FROM public."Sfide" WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Sfida Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
