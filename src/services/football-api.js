import { WebSocket } from 'ws';
import { db } from '../db/db.js';
import { matches } from '../db/schema.js';
import { eq, or, and } from 'drizzle-orm';

const API_KEY = process.env.ALLSPORTS_API_KEY;
const WS_URL = `wss://wss.allsportsapi.com/live_events?APIkey=${API_KEY}`;

export function startFootballService(app) {
    if (!API_KEY) {
        console.warn('⚽ ALLSPORTS_API_KEY is missing. Football service disabled.');
        return;
    }

    console.log('⚽ Starting Football Live Service...');

    let socket;

    function connect() {
        console.log('⚽ Connecting to AllSportsAPI WebSocket...');
        socket = new WebSocket(WS_URL);

        socket.on('open', () => {
            console.log('⚽ Connected to AllSportsAPI');
        });

        socket.on('message', async (data) => {
            try {
                const matchesData = JSON.parse(data.toString());
                if (Array.isArray(matchesData)) {
                    for (const matchUpdate of matchesData) {
                        await handleMatchUpdate(matchUpdate, app);
                    }
                }
            } catch (err) {
                console.error('⚽ Error processing football message:', err);
            }
        });

        socket.on('error', (err) => {
            console.error('⚽ WebSocket error:', err);
        });

        socket.on('close', () => {
            console.log('⚽ Connection closed. Reconnecting in 5s...');
            setTimeout(connect, 5000);
        });
    }

    connect();
}

async function handleMatchUpdate(update, app) {
    const homeTeamName = update.event_home_team;
    const awayTeamName = update.event_away_team;

    // Find match in DB
    // We try to match by team names (case-insensitive would be better, but let's start simple)
    const existingMatches = await db.select()
        .from(matches)
        .where(
            and(
                eq(matches.sport, 'football'),
                eq(matches.homeTeam, homeTeamName),
                eq(matches.awayTeam, awayTeamName)
            )
        )
        .limit(1);

    if (existingMatches.length === 0) {
        console.log(`⚽ Creating new football match: ${homeTeamName} vs ${awayTeamName}`);
        const now = new Date();
        const endTime = new Date(now.getTime() + 105 * 60 * 1000); // ~105 mins duration

        try {
            const [created] = await db.insert(matches).values({
                sport: 'football',
                homeTeam: homeTeamName,
                awayTeam: awayTeamName,
                status: 'live',
                startTime: now,
                endTime: endTime,
                homeScore: 0,
                awayScore: 0,
            }).returning();

            if (app.locals.broadcastMatchCreated) {
                app.locals.broadcastMatchCreated(created);
            }

            // Re-run with the created match
            await handleMatchUpdate(update, app);
        } catch (err) {
            console.error('⚽ Failed to create football match:', err);
        }
        return;
    }

    const match = existingMatches[0];
    const results = update.event_final_result || update.event_halftime_result || "0 - 0";
    const [homeScoreStr, awayScoreStr] = results.split(' - ');
    const homeScore = parseInt(homeScoreStr, 10) || 0;
    const awayScore = parseInt(awayScoreStr, 10) || 0;

    // Build metadata
    const metadata = {
        goalscorers: update.goalscorers || [],
        cards: update.cards || [],
        substitutes: update.substitutes || [],
        statistics: update.statistics || [],
        lineups: update.lineups || {},
        event_status: update.event_status,
        event_time: update.event_time,
        league_name: update.league_name,
    };

    // Update DB
    const [updated] = await db.update(matches)
        .set({
            homeScore,
            awayScore,
            metadata,
        })
        .where(eq(matches.id, match.id))
        .returning();

    if (updated && app.locals.broadcastScoreUpdate) {
        app.locals.broadcastScoreUpdate(match.id, {
            homeScore: updated.homeScore,
            awayScore: updated.awayScore,
            metadata: updated.metadata,
        });
        console.log(`⚽ [Match ${match.id}] Score updated from API: ${homeScore}-${awayScore}`);
    }
}
