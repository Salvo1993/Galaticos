import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';

const months: Record<string, string> = {
  'gennaio': '01', 'febbraio': '02', 'marzo': '03', 'aprile': '04',
  'maggio': '05', 'giugno': '06', 'luglio': '07', 'agosto': '08',
  'settembre': '09', 'ottobre': '10', 'novembre': '11', 'dicembre': '12'
};

export async function POST(req: Request) {
  try {
    const { team_a_name, team_b_name, teamAPlayers, teamBPlayers } = await req.json();
    console.log('Backend Received Data:', { team_a_name, team_b_name, teamAPlayers, teamBPlayers });

    if (!team_a_name || !team_b_name || !Array.isArray(teamAPlayers) || !Array.isArray(teamBPlayers)) {
      return NextResponse.json({ error: 'Dati squadra mancanti o invalidi' }, { status: 400 });
    }

    // 1. Get match_label
    const settings = await sql`SELECT match_label FROM public."SiteSettings" WHERE id = 1`;
    const matchLabel = settings[0]?.match_label || 'Venerdì 19 giugno - Ore 21';

    // 2. Parse match_label (e.g., "Venerdì 19 giugno - Ore 21")
    const parts = matchLabel.split('-').map((p: string) => p.trim());
    const datePart = parts[0].split(' ');
    const day = datePart[1];
    const monthName = datePart[2].toLowerCase();
    const month = months[monthName] || '01';
    const dateStr = `2026-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    const timePart = parts[1].toLowerCase().replace('ore', '').trim();
    const timeStr = `${timePart.padStart(2, '0')}:00`;

    // 3. Upsert
    await sql`
      INSERT INTO public."Risultati" (id, data, ora, team_a_name, team_b_name, team_a_players, team_b_players)
      VALUES (1, ${dateStr}, ${timeStr}, ${team_a_name}, ${team_b_name}, ${JSON.stringify(teamAPlayers)}, ${JSON.stringify(teamBPlayers)})
      ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data,
        ora = EXCLUDED.ora,
        team_a_name = EXCLUDED.team_a_name,
        team_b_name = EXCLUDED.team_b_name,
        team_a_players = EXCLUDED.team_a_players,
        team_b_players = EXCLUDED.team_b_players;
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save Formation Error:', error);
    return NextResponse.json({ error: 'Failed to save formation' }, { status: 500 });
  }
}
