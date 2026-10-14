import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const revalidate = 0;

export async function GET() {
  try {
    try {
        await sql`ALTER TABLE public."SiteSettings" ADD COLUMN IF NOT EXISTS algo_settings JSONB DEFAULT '{"wVoto": 40, "wWinRate": 30, "wGolRatio": 30, "wMvp": 15, "balanceRoles": true}'::jsonb`;
    } catch(e) {}
    try {
        await sql`ALTER TABLE public."SiteSettings" ADD COLUMN IF NOT EXISTS header_image TEXT`;
    } catch(e) {}
    try {
        await sql`ALTER TABLE public."SiteSettings" ADD COLUMN IF NOT EXISTS prediction_settings JSONB DEFAULT '{"mode": "all"}'::jsonb`;
    } catch(e) {}
    
    const settings = await sql`SELECT match_label, algo_settings, header_image, prediction_settings FROM public."SiteSettings" WHERE id = 1`;
    return NextResponse.json(settings[0] || { 
      match_label: 'Venerdì 19 giugno - Ore 21', 
      algo_settings: {wVoto: 40, wWinRate: 30, wGolRatio: 30, wMvp: 15, balanceRoles: true},
      prediction_settings: { mode: 'all' }
    });
  } catch (error) {
    console.error('Fetch Settings Error:', error);
    return NextResponse.json({ 
      match_label: 'Venerdì 19 giugno - Ore 21', 
      algo_settings: {wVoto: 40, wWinRate: 30, wGolRatio: 30, wMvp: 15, balanceRoles: true},
      prediction_settings: { mode: 'all' }
    });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { match_label, algo_settings, prediction_settings } = data;

    try {
      await sql`ALTER TABLE public."SiteSettings" ADD COLUMN IF NOT EXISTS prediction_settings JSONB DEFAULT '{"mode": "all"}'::jsonb`;
    } catch(e) {}

    await sql`
      INSERT INTO public."SiteSettings" (id, updated_at)
      VALUES (1, NOW())
      ON CONFLICT (id) DO NOTHING;
    `;

    if (match_label !== undefined) {
      await sql`UPDATE public."SiteSettings" SET match_label = ${match_label}, updated_at = NOW() WHERE id = 1`;
    }
    if (algo_settings !== undefined) {
      await sql`UPDATE public."SiteSettings" SET algo_settings = ${JSON.stringify(algo_settings)}::jsonb, updated_at = NOW() WHERE id = 1`;
    }
    if (prediction_settings !== undefined) {
      await sql`UPDATE public."SiteSettings" SET prediction_settings = ${JSON.stringify(prediction_settings)}::jsonb, updated_at = NOW() WHERE id = 1`;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save Settings Error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
