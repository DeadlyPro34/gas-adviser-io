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

---

## 📝 License

MIT License
