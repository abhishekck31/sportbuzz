import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
const arcjetMode = process.env.ARCJET_MODE === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';

if (!arcjetKey) {
    console.warn('ARCJET_KEY environment variable is missing. Arcjet security features will be disabled.');
}

export const httpArcjet = arcjetKey ?
    arcjet({
        key: arcjetKey,
        rules: [
            shield({ mode: arcjetMode }),
            detectBot({ mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', "CATEGORY:PREVIEW"] }),
            slidingWindow({ mode: arcjetMode, interval: '10s', max: 50 })
        ],
    }) : null;

export const wsArcjet = arcjetKey ?
    arcjet({
        key: arcjetKey,
        rules: [
            shield({ mode: arcjetMode }),
            detectBot({ mode: arcjetMode, allow: ['CATEGORY:SEARCH_ENGINE', "CATEGORY:PREVIEW"] }),
            slidingWindow({ mode: arcjetMode, interval: '2s', max: 5 })
        ],
    }) : null;

export function securityMiddleware() {
    return async (req, res, next) => {
        if (!httpArcjet) return next();

        // DetectBot requires a User-Agent header. If it's missing, we provide a fallback
        // to avoid Arcjet throwing an internal error.
        if (!req.headers['user-agent']) {
            req.headers['user-agent'] = 'unknown';
        }

        try {
            const decision = await httpArcjet.protect(req);

            if (decision.isDenied()) {
                if (decision.reason.isRateLimit()) {
                    return res.status(429).json({ error: 'Too many requests.' });
                }

                return res.status(403).json({ error: 'Forbidden.' });
            }
        } catch (e) {
            console.error('Arcjet middleware error', e);
            return res.status(503).json({ error: 'Service Unavailable' });
        }

        next();
    }
}
