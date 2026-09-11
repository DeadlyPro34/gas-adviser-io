# P04 — DeFi Fee & Timing Predictor

A real-time Ethereum gas price tracking and predictive recommendation platform built using the MERN stack (MongoDB, Express, React, Node.js), Socket.io, and node-cron.

## 🚀 Overview

Users looking to make blockchain transactions often lack context on whether current gas prices are high, low, or likely to drop. This project polls real-time gas prices from Etherscan's Gas Tracker API, stores rolling historical readings in MongoDB, and provides users with:
- **Live Fee Gauge**: Instant status on Safe, Propose, and Fast gwei.
- **Historical Chart**: Visualizing 24-hour fee trends via Recharts.
- **Timing Recommendation**: Smart percentile recommendations ("Transact Now" vs "Wait").
- **Custom Threshold Alerts**: Socket.io real-time browser/in-app notifications when gas drops below target thresholds.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Mongoose (MongoDB), Socket.io, node-cron, Axios, dotenv, CORS.
- **Frontend**: React (Vite), Tailwind CSS, Recharts, Socket.io-client, Lucide Icons, Axios.
- **Data Source**: Etherscan Gas Tracker API (`https://api.etherscan.io`).

---

## 📂 Project Structure

```
Defi2026/
├── server/             # Express + Mongoose + Socket.io + node-cron backend
│   ├── .env.example    # Template for environment variables
│   ├── .env            # Local configuration (gitignored)
│   ├── server.js       # Entry point & API routes
│   └── package.json
├── client/             # React + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── App.jsx     # Main React interface
│   │   ├── main.jsx
│   │   └── index.css   # Tailwind setup & glassmorphism styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── Project_overview/   # Full project requirements & milestones
└── README.md           # Project documentation & setup guide
```

---

## 🚦 Quick Start Guide

### 1. Prerequisites
- Node.js (v18+)
- npm (v9+)
- MongoDB running locally OR a MongoDB Atlas cluster URI.

### 2. Backend Setup (`/server`)
```bash
cd server
npm install
cp .env.example .env
```
Edit `server/.env` with your configuration:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/defi-gas-predictor
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```
Start the backend development server:
```bash
npm run dev
```
The server will run on `http://localhost:5000`. Test the health check at `http://localhost:5000/api/health`.

### 3. Frontend Setup (`/client`)
```bash
cd client
npm install
npm run dev
```
The frontend will start on `http://localhost:5173`.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend status & database connection state |
| `GET` | `/api/fees/current` | Latest gas fee reading with 24h percentile label |
| `GET` | `/api/fees/history?hours=N` | Historical readings from the last N hours (default 24) |

---

## 🧪 API Examples (curl)

### Health Check
```bash
curl http://localhost:5000/api/health
```
```json
{
  "status": "ok",
  "message": "DeFi Fee & Timing Predictor Backend is running.",
  "timestamp": "2026-09-10T23:22:00.000Z",
  "dbState": "connected"
}
```

### Get Current Fee (with Percentile Label)
```bash
curl http://localhost:5000/api/fees/current
```
```json
{
  "_id": "664f1a2b3c4d5e6f7a8b9c0d",
  "timestamp": "2026-09-10T23:20:00.000Z",
  "chain": "ethereum",
  "safeGwei": 15,
  "proposeGwei": 20,
  "fastGwei": 25,
  "__v": 0,
  "percentile": 60,
  "label": "normal"
}
```
The `label` field is computed from the 24-hour percentile of `proposeGwei`:
- **`"low"`** — percentile < 33 (cheaper than most recent readings — good time to transact)
- **`"normal"`** — percentile 33–67 (average range)
- **`"high"`** — percentile > 67 (more expensive than most recent readings — consider waiting)

### Get Fee History (last N hours)
```bash
# Default: last 24 hours
curl http://localhost:5000/api/fees/history

# Last 6 hours
curl "http://localhost:5000/api/fees/history?hours=6"
```
```json
[
  {
    "_id": "664f19003c4d5e6f7a8b9c01",
    "timestamp": "2026-09-10T17:00:00.000Z",
    "chain": "ethereum",
    "safeGwei": 12,
    "proposeGwei": 18,
    "fastGwei": 22,
    "__v": 0
  },
  {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "timestamp": "2026-09-10T23:20:00.000Z",
    "chain": "ethereum",
    "safeGwei": 15,
    "proposeGwei": 20,
    "fastGwei": 25,
    "__v": 0
  }
]
```
Results are sorted oldest → newest for direct use in charting libraries like Recharts.

---

## 🧪 Running Tests

```bash
cd server
npm test
```

Tests use Node.js built-in `node:test` runner and verify the percentile computation logic.

---

## 📝 License

MIT License
