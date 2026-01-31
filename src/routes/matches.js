import { Router } from 'express';
import { createMatchSchema, listMatchesQuerySchema, matchIdParamSchema, updateScoreSchema, MATCH_STATUS } from "../validation/matches.js";
import { matches } from "../db/schema.js";
import { db } from "../db/db.js";
import { getMatchStatus, syncMatchStatus } from "../utils/match-status.js";
import { desc, eq } from "drizzle-orm";

export const matchRouter = Router();

const MAX_LIMIT = 100;

matchRouter.get('/', async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid query.', details: parsed.error.issues });
    }

    const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);

    try {
        const data = await db
            .select()
            .from(matches)
            .orderBy((desc(matches.createdAt)))
            .limit(limit)

        res.json({ data });
    } catch (e) {
        res.status(500).json({ error: 'Failed to list matches.' });
    }
})

matchRouter.post('/', async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload.', details: parsed.error.issues });
    }

    const { data: { startTime, endTime, homeScore, awayScore } } = parsed;

    try {
        const [event] = await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            homeScore: homeScore ?? 0,
            awayScore: awayScore ?? 0,
            status: getMatchStatus(startTime, endTime),
        }).returning();

        if (res.app.locals.broadcastMatchCreated) {
            res.app.locals.broadcastMatchCreated(event);
        }

        res.status(201).json({ data: event });
    } catch (e) {
        res.status(500).json({ error: 'Failed to create match.', details: JSON.stringify(e) });
    }
})

matchRouter.patch('/:id/score', async (req, res) => {
    try {
        if (!updateScoreSchema) {
            return res.status(500).json({ error: 'Schema missing' });
        }
        const matchId = Number.parseInt(req.params.id, 10);
        const bodyParsed = updateScoreSchema.safeParse(req.body);

        if (!bodyParsed.success) {
            return res.status(400).json({ error: 'Invalid score data.' });
        }

        const homeScore = bodyParsed.data.homeScore;
        const awayScore = bodyParsed.data.awayScore;
        const metadata = bodyParsed.data.metadata ?? null;

        const [updated] = await db
            .update(matches)
            .set({
                homeScore,
                awayScore,
                metadata,
            })
            .where(eq(matches.id, matchId))
            .returning();

        if (!updated) {
            return res.status(404).json({ error: 'Match not found.' });
        }

        const broadcast = req.app.locals.broadcastScoreUpdate;
        if (broadcast) {
            broadcast(matchId, {
                homeScore: updated.homeScore,
                awayScore: updated.awayScore,
                metadata: updated.metadata,
            });
        }

        return res.json({ data: updated });
    } catch (err) {
        console.error('Error in PATCH /matches/:id/score:', err);
        return res.status(500).json({
            error: 'Failed to update score',
            message: err?.message || String(err),
            stack: err?.stack
        });
    }
});
