import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // Legge l'ultima sessione basandosi sul timestamp o sull'ID
    const session = await sql`
      SELECT * FROM public."LatestSession" 
      ORDER BY updated_at DESC, id DESC 
      LIMIT 1
    `;
    return NextResponse.json(session[0] || null);
  } catch (error) {
    console.error('Fetch Session Error:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { selected_players, clusters, team_a_name, team_b_name, team_a_players, team_b_players } = body;

    // Use UPSERT with fixed ID 1 for singleton session
    await sql`
      INSERT INTO public."LatestSession" (
        id, selected_players, clusters, team_a_name, team_b_name, team_a_players, team_b_players, updated_at
      )
      VALUES (
        1,
        ${JSON.stringify(selected_players || [])}, 
        ${JSON.stringify(clusters || [])}, 
        ${team_a_name || 'Falchi 🦅'}, 
        ${team_b_name || 'Aquile 🦆'}, 
        ${JSON.stringify(team_a_players || [])}, 
        ${JSON.stringify(team_b_players || [])}, 
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        selected_players = EXCLUDED.selected_players,
        clusters = EXCLUDED.clusters,
        team_a_name = EXCLUDED.team_a_name,
        team_b_name = EXCLUDED.team_b_name,
        team_a_players = EXCLUDED.team_a_players,
        team_b_players = EXCLUDED.team_b_players,
        updated_at = NOW();
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save Session Error:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}
