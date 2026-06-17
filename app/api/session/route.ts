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

    // INSERT semplice, l'ID sarà generato automaticamente dal database
    await sql`
      INSERT INTO public."LatestSession" (
        selected_players, clusters, team_a_name, team_b_name, team_a_players, team_b_players, updated_at
      )
      VALUES (
        ${JSON.stringify(selected_players)}, 
        ${JSON.stringify(clusters)}, 
        ${team_a_name}, 
        ${team_b_name}, 
        ${JSON.stringify(team_a_players)}, 
        ${JSON.stringify(team_b_players)}, 
        NOW()
      );
    `;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save Session Error:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}
