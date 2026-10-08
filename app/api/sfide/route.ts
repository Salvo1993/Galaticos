import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';

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
    try { await sql`ALTER TABLE public."Sfide" ADD COLUMN is_approved BOOLEAN DEFAULT false`; } catch(e){}
    try { await sql`UPDATE public."Sfide" SET is_approved = true WHERE is_approved IS NULL`; } catch(e){}

    const sfide = await sql`SELECT * FROM public."Sfide" ORDER BY created_at DESC`;
    return NextResponse.json({ success: true, sfide });
  } catch (error: any) {
    console.error('Fetch Sfide Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { titolo, giocatori, data_da, is_approved } = await req.json();
    
    if (!is_approved) {
        const countRes = await sql`SELECT COUNT(*) as c FROM public."Sfide" WHERE is_approved = false`;
        if (parseInt(countRes[0].c) >= 5) {
            return NextResponse.json({ success: false, error: 'Limite di 5 sfide in attesa raggiunto.' }, { status: 400 });
        }
    }

    await sql`
      INSERT INTO public."Sfide" (titolo, giocatori, data_da, is_approved)
      VALUES (${titolo}, ${JSON.stringify(giocatori)}::jsonb, ${data_da || null}, ${is_approved ? true : false})
    `;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save Sfida Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID required' });
    
    await sql`UPDATE public."Sfide" SET is_approved = true WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Approve Sfida Error:', error);
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
