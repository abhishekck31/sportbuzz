import { z } from 'zod';

/**
 * Constants for Match Status
 */
export const MATCH_STATUS = {
    SCHEDULED: 'scheduled',
    LIVE: 'live',
    FINISHED: 'finished'
};

/**
 * Validates query parameters for listing matches.
 * limit: optional coerced positive integer, max 100.
 */
export const listMatchesQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
    status: z.nativeEnum(MATCH_STATUS).optional()
});

/**
 * Validates URL parameters for a specific match ID.
 * id: required coerced positive integer.
 */
export const matchIdParamSchema = z.object({
    id: z.coerce.number().int().positive()
});

/**
 * Validates the creation of a new match.
 * Includes chronological check for startTime and endTime.
 */
export const createMatchSchema = z.object({
    sport: z.string().trim().min(1, "Sport is required"),
    homeTeam: z.string().trim().min(1, "Home team is required"),
    awayTeam: z.string().trim().min(1, "Away team is required"),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "startTime must be a valid ISO date string"
    }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "endTime must be a valid ISO date string"
    }),
    homeScore: z.coerce.number().int().nonnegative().optional(),
    awayScore: z.coerce.number().int().nonnegative().optional()
}).superRefine((data, ctx) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "endTime must be chronologically after startTime",
            path: ["endTime"]
        });
    }
});

/**
 * Validates score updates for an existing match.
 * Requires both scores as coerced non-negative integers.
 */
export const updateScoreSchema = z.object({
    homeScore: z.coerce.number().int().nonnegative(),
    awayScore: z.coerce.number().int().nonnegative()
});
