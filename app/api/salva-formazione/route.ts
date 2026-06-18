import { NextResponse } from 'next/server';
import { sql } from '../../../lib/db';

const months: Record<string, string> = {
  'gennaio': '01', 'febbraio': '02', 'marzo': '03', 'aprile': '04',
  'maggio': '05', 'giugno': '06', 'luglio': '07', 'agosto': '08',
  'settembre': '09', 'ottobre': '10', 'novembre': '11', 'dicembre': '12'
};

export async function POST(req: Request) {
  try {
    const { 
        selected_players, clusters, team_a_name, team_b_name, 
        teamAPlayers, teamBPlayers 
    } = await req.json();

    console.log('Backend Received Data for Saving:', { team_a_name, team_b_name, teamAPlayersLength: teamAPlayers?.length });

    if (!team_a_name || !team_b_name || !Array.isArray(teamAPlayers) || !Array.isArray(teamBPlayers)) {
      return NextResponse.json({ error: 'Dati squadra mancanti o invalidi' }, { status: 400 });
    }

    // Parse match_label for key (data + ora)
    const settings = await sql`SELECT match_label FROM public."SiteSettings" WHERE id = 1`;
    const matchLabel = settings[0]?.match_label || 'Venerdì 19 giugno - Ore 21';
    const parts = matchLabel.split('-').map((p: string) => p.trim());
    const datePart = parts[0].split(' ');
    const day = datePart[1];
    const monthName = datePart[2].toLowerCase();
    const month = months[monthName] || '01';
    const dateStr = `2026-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const timePart = parts[1].toLowerCase().replace('ore', '').trim();
    const timeStr = `${timePart.padStart(2, '0')}:00`;

    // Transactional Atomic Operation
    await (sql as any).begin(async (tx: any) => {
        // A) Upsert LatestSession (id=1, Singleton)
        await tx`
          INSERT INTO public."LatestSession" (
            id, selected_players, clusters, team_a_name, team_b_name, team_a_players, team_b_players, updated_at
          )
          VALUES (
            1,
            ${JSON.stringify(selected_players || [])}::jsonb, 
            ${JSON.stringify(clusters || [])}::jsonb, 
            ${team_a_name}, 
            ${team_b_name}, 
            ${JSON.stringify(teamAPlayers)}::jsonb, 
            ${JSON.stringify(teamBPlayers)}::jsonb, 
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

        // B) Upsert Risultati (by data + ora)
        const existing = await tx`
          SELECT id FROM public."Risultati" 
          WHERE data = ${dateStr} AND ora = ${timeStr}
        `;

        if (existing.length > 0) {
          console.log('Updating existing match record:', existing[0].id);
          await tx`
            UPDATE public."Risultati"
            SET team_a_name = ${team_a_name},
                team_b_name = ${team_b_name},
                team_a_players = ${JSON.stringify(teamAPlayers)}::jsonb,
                team_b_players = ${JSON.stringify(teamBPlayers)}::jsonb
            WHERE id = ${existing[0].id}
          `;
        } else {
          console.log('Inserting new match record');
          await tx`
            INSERT INTO public."Risultati" (data, ora, team_a_name, team_b_name, team_a_players, team_b_players)
            VALUES (${dateStr}, ${timeStr}, ${team_a_name}, ${team_b_name}, ${JSON.stringify(teamAPlayers)}::jsonb, ${JSON.stringify(teamBPlayers)}::jsonb)
          `;
        }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save Formation Error:', error);
    return NextResponse.json({ error: 'Failed to save formation' }, { status: 500 });
  }
}
