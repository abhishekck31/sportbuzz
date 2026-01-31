# Sportz Backend: Real-Time Sports Broadcasting Engine

A high-performance backend service designed for live sports coverage, featuring real-time data streaming via WebSockets, robust security shielding, and structured data validation.

![Project Banner](public/readme/readme-hero.webp)

## 🚀 Overview

Sportz is a production-grade backend engine that handles live match scores and play-by-play commentary. It combines the reliability of RESTful APIs with the speed of WebSockets to deliver instantaneous updates to clients. The system is architected to handle high-concurrency real-time updates while maintaining strict security and data integrity.

### 🛠️ Core Technology Stack

- **Runtime**: Node.js with Express 5 (Next-gen Express)
- **Real-Time**: WebSockets (`ws` library) with custom subscription management
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **Security**: Arcjet (Shielding, Rate Limiting, and Bot Protection)
- **Validation**: Zod (Schema-first validation for all inputs)
- **Monitoring**: Site24x7 APM Insight

## ✨ Key Technical Achievements

### 1. Real-Time Broadcasting Architecture
Implemented a robust WebSocket server that supports:
- **Per-Match Subscriptions**: Clients only receive data for the matches they follow.
- **Heartbeat & Cleanup**: Automated ping/pong mechanism to prune stale connections.
- **Backpressure Protection**: Closes connections if the client falls too far behind (buffered amount > 1MB).
- **Graceful Failover**: Handlers for connection errors and unexpected closures.

### 2. Multi-Layer Security Shielding
Integrated **Arcjet** to protect the engine at both the HTTP and WebSocket levels:
- **Rate Limiting**: Sliding window rate limits to prevent API abuse.
- **Bot Detection**: Automated blocking of malicious crawlers while allowing search engine indexing.
- **Handshake Security**: Security checks implemented at the WebSocket upgrade level before connections are promoted.

### 3. Type-Safe Data Layer
Utilized **Drizzle ORM** and **Zod** to ensure:
- **Zero-Trust Input**: Every request (REST and WS) is validated against strict schemas.
- **Chronological Integrity**: Specialized validation logic ensuring match start/end times are logically consistent.
- **Database Scalability**: Efficient indexing on match statuses and creation timestamps.

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Arcjet Account (for security features)

### Installation
1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd sportbuzz
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   DATABASE_URL=your_postgres_url
   ARCJET_KEY=your_arcjet_key
   APMINSIGHT_LICENSE_KEY=your_key
   PORT=8000
   ```
4. Run migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
5. Start the engine:
   ```bash
   npm run dev
   ```
6. **Live Dashboard**:
   Open `http://localhost:8000` in your browser to view the real-time sports dashboard.

## 📡 API Reference

### REST Endpoints
- `GET /matches`: Fetch recent and live matches with pagination.
- `POST /matches`: Create a new match event.
- `PATCH /matches/:id/score`: Update live scores (broadcasts automatically).
- `GET /matches/:id/commentary`: Retrieve play-by-play history.

### WebSocket Events
- **Connect**: `ws://localhost:8000/ws`
- **Subscribe**: `{ "type": "subscribe", "matchId": 123 }`
- **Updates**: Clients receive `{ "type": "commentary", "data": { ... } }` in real-time.

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
