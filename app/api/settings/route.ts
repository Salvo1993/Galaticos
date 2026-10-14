import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    try {
      await sql`ALTER TABLE public."SiteSettings" ADD COLUMN IF NOT EXISTS algo_settings JSONB DEFAULT '{"wVoto": 40, "wWinRate": 30, "wGolRatio": 30, "wMvp": 15, "balanceRoles": true}'::jsonb`;
    } catch (e) {}
    try {
      await sql`ALTER TABLE public."SiteSettings" ADD COLUMN IF NOT EXISTS header_image TEXT`;
    } catch (e) {}
    try {
      await sql`ALTER TABLE public."SiteSettings" ADD COLUMN IF NOT EXISTS prediction_settings JSONB DEFAULT '{"mode": "all"}'::jsonb`;
    } catch (e) {}
    try {
      await sql`ALTER TABLE public."SiteSettings" ADD COLUMN IF NOT EXISTS modulo_settings JSONB DEFAULT '{"modulo7TeamA": "2-3-1", "modulo7TeamB": "2-3-1", "modulo8TeamA": "3-3-1", "modulo8TeamB": "3-3-1"}'::jsonb`;
    } catch (e) {}
    
    // Fetch settings row (try id = 1 first, or first existing row)
    let rows = await sql`SELECT id, match_label, algo_settings, header_image, prediction_settings, modulo_settings FROM public."SiteSettings" WHERE id = 1`;
    if (!rows || rows.length === 0) {
      rows = await sql`SELECT id, match_label, algo_settings, header_image, prediction_settings, modulo_settings FROM public."SiteSettings" ORDER BY id ASC LIMIT 1`;
    }

    const row = rows && rows.length > 0 ? rows[0] : null;

    if (!row) {
      return NextResponse.json({ 
        match_label: 'Venerdì 19 giugno - Ore 21', 
        algo_settings: { wVoto: 40, wWinRate: 30, wGolRatio: 30, wMvp: 15, balanceRoles: true },
        header_image: null,
        prediction_settings: null,
        modulo_settings: null
      });
    }

    return NextResponse.json({ 
      match_label: row.match_label || 'Venerdì 19 giugno - Ore 21', 
      algo_settings: row.algo_settings || { wVoto: 40, wWinRate: 30, wGolRatio: 30, wMvp: 15, balanceRoles: true },
      header_image: row.header_image || null,
      prediction_settings: row.prediction_settings || null,
      modulo_settings: row.modulo_settings || null
    });
  } catch (error: any) {
    console.error('Fetch Settings Error:', error);
    return NextResponse.json({ 
      match_label: 'Venerdì 19 giugno - Ore 21', 
      algo_settings: { wVoto: 40, wWinRate: 30, wGolRatio: 30, wMvp: 15, balanceRoles: true },
      header_image: null,
      prediction_settings: null,
      modulo_settings: null
    });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { match_label, algo_settings, prediction_settings, modulo_settings } = data;

    try {
      await sql`ALTER TABLE public."SiteSettings" ADD COLUMN IF NOT EXISTS prediction_settings JSONB DEFAULT '{"mode": "all"}'::jsonb`;
    } catch (e) {}
    try {
      await sql`ALTER TABLE public."SiteSettings" ADD COLUMN IF NOT EXISTS modulo_settings JSONB DEFAULT '{"modulo7TeamA": "2-3-1", "modulo7TeamB": "2-3-1", "modulo8TeamA": "3-3-1", "modulo8TeamB": "3-3-1"}'::jsonb`;
    } catch (e) {}

    // Find existing row or insert a new one
    let existing = await sql`SELECT id FROM public."SiteSettings" WHERE id = 1`;
    if (!existing || existing.length === 0) {
      existing = await sql`SELECT id FROM public."SiteSettings" ORDER BY id ASC LIMIT 1`;
    }

    if (!existing || existing.length === 0) {
      await sql`
        INSERT INTO public."SiteSettings" (id, match_label, algo_settings, prediction_settings, modulo_settings, updated_at)
        VALUES (
          1,
          ${match_label || 'Venerdì 19 giugno - Ore 21'},
          ${JSON.stringify(algo_settings || { wVoto: 40, wWinRate: 30, wGolRatio: 30, wMvp: 15, balanceRoles: true })}::jsonb,
          ${JSON.stringify(prediction_settings || { mode: 'all' })}::jsonb,
          ${JSON.stringify(modulo_settings || { modulo7TeamA: '2-3-1', modulo7TeamB: '2-3-1', modulo8TeamA: '3-3-1', modulo8TeamB: '3-3-1' })}::jsonb,
          NOW()
        )
      `;
    } else {
      const targetId = existing[0].id;
      if (match_label !== undefined) {
        await sql`UPDATE public."SiteSettings" SET match_label = ${match_label}, updated_at = NOW() WHERE id = ${targetId}`;
      }
      if (algo_settings !== undefined) {
        await sql`UPDATE public."SiteSettings" SET algo_settings = ${JSON.stringify(algo_settings)}::jsonb, updated_at = NOW() WHERE id = ${targetId}`;
      }
      if (prediction_settings !== undefined) {
        await sql`UPDATE public."SiteSettings" SET prediction_settings = ${JSON.stringify(prediction_settings)}::jsonb, updated_at = NOW() WHERE id = ${targetId}`;
      }
      if (modulo_settings !== undefined) {
        await sql`UPDATE public."SiteSettings" SET modulo_settings = ${JSON.stringify(modulo_settings)}::jsonb, updated_at = NOW() WHERE id = ${targetId}`;
      }
    }

    return NextResponse.json({ success: true, prediction_settings, modulo_settings });
  } catch (error: any) {
    console.error('Save Settings Error:', error);
    return NextResponse.json({ error: 'Failed to save settings', details: error?.message || String(error) }, { status: 500 });
  }
}
