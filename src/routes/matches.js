import { Router } from 'express';
import { db } from '../db/index.js';
import { matches } from '../db/schema.js';
import { createMatchSchema, listMatchesQuerySchema } from '../validation/matches.js';
import { getMatchStatus } from '../utils/match-status.js';
import { desc, eq, and } from 'drizzle-orm';

export const matchRouter = Router();
const MAX_LIMIT = 100;

matchRouter.get('/', async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid Query.',
            details: parsed.error.format()
        });
    }

    const { limit: queryLimit, status } = parsed.data;
    const limit = Math.min(queryLimit ?? 50, MAX_LIMIT);

    try {
        const filters = [];
        if (status) {
            filters.push(eq(matches.status, status));
        }

        const data = await db
            .select()
            .from(matches)
            .where(filters.length > 0 ? and(...filters) : undefined)
            .orderBy(desc(matches.startTime))
            .limit(limit);

        res.json({ data });
    } catch (e) {
        console.error('List Matches Error:', e);
        res.status(500).json({
            error: 'Failed to list matches.',
            details: e.message
        });
    }
});

matchRouter.post('/', async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            error: 'Invalid payload.',
            details: parsed.error.format()
        });
    }

    const { sport, homeTeam, awayTeam, startTime, endTime, homeScore, awayScore } = parsed.data;

    try {
        const [event] = await db.insert(matches).values({
            sport,
            homeTeam,
            awayTeam,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: getMatchStatus(startTime, endTime),
        }).returning();

        return res.status(201).json({ message: 'Match created successfully.', event });
    } catch (e) {
        console.error('Create Match Error:', e);
        res.status(500).json({
            error: 'Failed to create match.',
            details: e.message
        });
    }
});