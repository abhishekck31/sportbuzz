import {
    MATCH_STATUS,
    listMatchesQuerySchema,
    matchIdParamSchema,
    createMatchSchema
} from './src/validation/matches.js';

console.log('--- Testing MATCH_STATUS ---');
console.log(MATCH_STATUS);

console.log('\n--- Testing listMatchesQuerySchema ---');
const validQuery = { limit: '50' };
const invalidQuery = { limit: '150' };

console.log('Valid Query (limit 50):', listMatchesQuerySchema.safeParse(validQuery).success);
console.log('Invalid Query (limit 150):', listMatchesQuerySchema.safeParse(invalidQuery).success);

console.log('\n--- Testing matchIdParamSchema ---');
const validId = { id: '10' };
const invalidId = { id: '-5' };

console.log('Valid ID (10):', matchIdParamSchema.safeParse(validId).success);
console.log('Invalid ID (-5):', matchIdParamSchema.safeParse(invalidId).success);

console.log('\n--- Testing createMatchSchema ---');
const validMatch = {
    sport: 'Football',
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    startTime: '2026-01-21T14:00:00Z',
    endTime: '2026-01-21T16:00:00Z',
    homeScore: '0',
    awayScore: '0'
};

const invalidTimeMatch = {
    ...validMatch,
    startTime: '2026-01-21T16:00:00Z',
    endTime: '2026-01-21T14:00:00Z', // endTime before startTime
};

const validResult = createMatchSchema.safeParse(validMatch);
console.log('Valid Match:', validResult.success);
if (!validResult.success) console.log('Errors:', validResult.error.format());

const invalidResult = createMatchSchema.safeParse(invalidTimeMatch);
console.log('Invalid Time Match (End < Start):', invalidResult.success);
if (!invalidResult.success) {
    console.log('Expected Error Message:', invalidResult.error.issues[0].message);
}
