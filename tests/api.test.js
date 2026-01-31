import { test } from 'node:test';
import assert from 'node:assert';
import app from '../src/index.js';
import http from 'http';

test('Server health check', async (t) => {
    const server = http.createServer(app);

    // Start server on a random port for testing
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    await t.test('GET / returns 200 and dashboard title', async () => {
        const res = await fetch(`${baseUrl}/`);
        const text = await res.text();

        assert.strictEqual(res.status, 200);
        assert.match(text, /Sportz \| Live Real-Time Dashboard/);
    });

    // Cleanup
    await new Promise((resolve) => server.close(resolve));
});
