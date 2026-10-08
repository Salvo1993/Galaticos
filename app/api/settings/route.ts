import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const revalidate = 0;

export async function GET() {
  try {
    try {
        await sql`ALTER TABLE public."SiteSettings" ADD COLUMN algo_settings JSONB DEFAULT '{"wVoto": 50, "wWinRate": 30, "wGolRatio": 20, "wMvp": 15, "balanceRoles": true}'::jsonb`;
    } catch(e) {}
    
    const settings = await sql`SELECT match_label, algo_settings FROM public."SiteSettings" WHERE id = 1`;
    return NextResponse.json(settings[0] || { match_label: 'Venerdì 19 giugno - Ore 21', algo_settings: {wVoto: 50, wWinRate: 30, wGolRatio: 20, wMvp: 15, balanceRoles: true} });
  } catch (error) {
    console.error('Fetch Settings Error:', error);
    return NextResponse.json({ match_label: 'Venerdì 19 giugno - Ore 21', algo_settings: {wVoto: 50, wWinRate: 30, wGolRatio: 20, wMvp: 15, balanceRoles: true} });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { match_label, algo_settings } = data;

    if (algo_settings && !match_label) {
       await sql`UPDATE public."SiteSettings" SET algo_settings = ${JSON.stringify(algo_settings)}::jsonb, updated_at = NOW() WHERE id = 1`;
    } else if (match_label && !algo_settings) {
       await sql`
         INSERT INTO public."SiteSettings" (id, match_label, updated_at)
         VALUES (1, ${match_label}, NOW())
         ON CONFLICT (id) DO UPDATE SET match_label = EXCLUDED.match_label, updated_at = NOW();
       `;
    } else if (match_label && algo_settings) {
       await sql`
         INSERT INTO public."SiteSettings" (id, match_label, algo_settings, updated_at)
         VALUES (1, ${match_label}, ${JSON.stringify(algo_settings)}::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET match_label = EXCLUDED.match_label, algo_settings = EXCLUDED.algo_settings, updated_at = NOW();
       `;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save Settings Error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
