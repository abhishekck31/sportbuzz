import AgentAPI from "apminsight";
import dotenv from 'dotenv';
dotenv.config();

AgentAPI.config({
  licenseKey: process.env.APMINSIGHT_LICENSE_KEY,
  appName: "sportz-backend",
});

import express from 'express';
import http from 'http';
import cors from 'cors';
import { matchRouter } from "./routes/matches.js";
import { attachWebSocketServer } from "./ws/server.js";
import { securityMiddleware } from "./arcjet.js";
import { commentaryRouter } from "./routes/commentary.js";
import { startFootballService } from "./services/football-api.js";

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use(securityMiddleware());

app.use('/matches', matchRouter);
app.use('/matches/:id/commentary', commentaryRouter);

const { broadcastMatchCreated, broadcastCommentary, broadcastScoreUpdate } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;
app.locals.broadcastScoreUpdate = broadcastScoreUpdate;
startFootballService(app);

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server.listen(PORT, HOST, () => {
    const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;

    console.log(`Server is running on ${baseUrl}`);
    console.log(`WebSocket Server is running on ${baseUrl.replace('http', 'ws')}/ws`);
  });
}

export default app;
