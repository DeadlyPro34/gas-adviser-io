/**
 * Temporary Socket.io client script.
 *
 * Connects to the Express server and logs all "feeUpdate" and
 * "alertTriggered" events to the console.
 *
 * Usage:  node tests/testSocketClient.js
 * Stop:   Ctrl+C
 */
const { io } = require('socket.io-client');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

console.log(`[testSocketClient] Connecting to ${SERVER_URL} ...`);

const socket = io(SERVER_URL);

socket.on('connect', () => {
  console.log(`[testSocketClient] ✅ Connected — socket id: ${socket.id}`);
});

socket.on('disconnect', (reason) => {
  console.log(`[testSocketClient] ❌ Disconnected — reason: ${reason}`);
});

socket.on('connect_error', (err) => {
  console.error(`[testSocketClient] ⚠️  Connection error: ${err.message}`);
});

// ─── Milestone 4: Live fee updates ───────────────────────────────────────────
socket.on('feeUpdate', (data) => {
  console.log('\n[testSocketClient] 📡 feeUpdate received:');
  console.log(JSON.stringify(data, null, 2));
});

// ─── Milestone 5: Alert triggers ─────────────────────────────────────────────
socket.on('alertTriggered', (data) => {
  console.log('\n[testSocketClient] 🔔 alertTriggered received:');
  console.log(JSON.stringify(data, null, 2));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[testSocketClient] Shutting down...');
  socket.disconnect();
  process.exit(0);
});

console.log('[testSocketClient] Listening for "feeUpdate" and "alertTriggered" events...');
console.log('[testSocketClient] Press Ctrl+C to stop.\n');
