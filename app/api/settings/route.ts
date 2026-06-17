import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const settings = await sql`SELECT match_label FROM public."SiteSettings" WHERE id = 1`;
    return NextResponse.json(settings[0] || { match_label: 'Venerdì 19 giugno - Ore 21' });
  } catch (error) {
    console.error('Fetch Settings Error:', error);
    return NextResponse.json({ match_label: 'Venerdì 19 giugno - Ore 21' });
  }
}

export async function POST(req: Request) {
  try {
    const { match_label } = await req.json();
    await sql`
      INSERT INTO public."SiteSettings" (id, match_label, updated_at)
      VALUES (1, ${match_label}, NOW())
      ON CONFLICT (id) DO UPDATE
      SET
        match_label = EXCLUDED.match_label,
        updated_at = NOW();
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save Settings Error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
