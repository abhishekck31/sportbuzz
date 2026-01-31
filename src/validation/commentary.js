import { z } from 'zod';

/**
 * Schema for validating query parameters when listing commentary.
 */
export const listCommentaryQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .optional(),
});

/**
 * Schema for validating the body when creating a new commentary entry.
 */
export const createCommentarySchema = z.object({
  minute: z.number().int().nonnegative(),
  sequence: z.number().int().nonnegative(),
  period: z.string().trim().min(1),
  eventType: z.string().trim().min(1),
  actor: z.string().trim().min(1),
  team: z.string().trim().min(1),
  message: z.string().trim().min(1),
  metadata: z.record(z.string(), z.any()).default({}),
  tags: z.array(z.string()).default([]),
});
