import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';
import { assertAdmin, getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    try {
      const sfide = await sql`SELECT * FROM public."Sfide" ORDER BY created_at DESC`;
      return NextResponse.json({ success: true, sfide });
    } catch {
      // Table doesn't exist yet, create it
      await sql`
        CREATE TABLE IF NOT EXISTS public."Sfide" (
          id SERIAL PRIMARY KEY,
          titolo VARCHAR(255) NOT NULL,
          giocatori JSONB NOT NULL,
          data_da VARCHAR(20),
          is_approved BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      const sfide = await sql`SELECT * FROM public."Sfide" ORDER BY created_at DESC`;
      return NextResponse.json({ success: true, sfide });
    }
  } catch (error: any) {
    console.error('Fetch Sfide Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { titolo, giocatori, data_da, is_approved } = await req.json();
    
    // Check if user is trying to auto-approve
    let approved = false;
    if (is_approved) {
      const { isAdmin } = await getAdminSession(req);
      approved = isAdmin;
    }

    if (!approved) {
      const countRes = await sql`SELECT COUNT(*) as c FROM public."Sfide" WHERE is_approved = false`;
      if (parseInt(countRes[0].c) >= 5) {
        return NextResponse.json({ success: false, error: 'Limite di 5 sfide in attesa raggiunto.' }, { status: 400 });
      }
    }

    await sql`
      INSERT INTO public."Sfide" (titolo, giocatori, data_da, is_approved)
      VALUES (${titolo}, ${JSON.stringify(giocatori)}::jsonb, ${data_da || null}, ${approved})
    `;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Save Sfida Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const authError = await assertAdmin(req);
  if (authError) return authError;

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
  const authError = await assertAdmin(req);
  if (authError) return authError;

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

