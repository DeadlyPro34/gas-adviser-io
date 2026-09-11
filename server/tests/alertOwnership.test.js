/**
 * Alert Ownership Isolation Test
 *
 * Verifies that a second user gets 404 when trying to view or delete
 * the first user's alert. Runs against the live server on PORT.
 *
 * Prerequisites:
 *   - Server must be running with MongoDB connected
 *   - Run: node tests/alertOwnership.test.js
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

const BASE = `http://localhost:${process.env.PORT || 5000}`;

// ── Minimal HTTP helpers (no external deps) ─────────────────────────────────

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const payload = body ? JSON.stringify(body) : null;

    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Test state ──────────────────────────────────────────────────────────────

const ts = Date.now();
const userA = {
  fullName: 'Test User A',
  email: `testa-${ts}@test.com`,
  password: 'password123',
  token: null,
};
const userB = {
  fullName: 'Test User B',
  email: `testb-${ts}@test.com`,
  password: 'password456',
  token: null,
};
let alertIdFromA = null;

// ── Tests ───────────────────────────────────────────────────────────────────

describe('Alert Ownership Isolation', () => {
  before(async () => {
    // Register both users
    const resA = await request('POST', '/api/auth/register', {
      fullName: userA.fullName,
      email: userA.email,
      password: userA.password,
    });
    assert.equal(resA.status, 201, `Register User A failed: ${JSON.stringify(resA.data)}`);
    userA.token = resA.data.token;

    const resB = await request('POST', '/api/auth/register', {
      fullName: userB.fullName,
      email: userB.email,
      password: userB.password,
    });
    assert.equal(resB.status, 201, `Register User B failed: ${JSON.stringify(resB.data)}`);
    userB.token = resB.data.token;

    // User A creates an alert
    const alertRes = await request(
      'POST',
      '/api/alerts',
      { chain: 'ethereum', thresholdGwei: 15 },
      userA.token
    );
    assert.equal(alertRes.status, 201, `Create alert failed: ${JSON.stringify(alertRes.data)}`);
    alertIdFromA = alertRes.data._id;
    assert.ok(alertIdFromA, 'Alert ID should be defined');
  });

  it('User A can see their own alert', async () => {
    const res = await request('GET', '/api/alerts', null, userA.token);
    assert.equal(res.status, 200);
    const found = res.data.find((a) => a._id === alertIdFromA);
    assert.ok(found, 'User A should see their own alert');
  });

  it('User B cannot see User A\'s alert in their list', async () => {
    const res = await request('GET', '/api/alerts', null, userB.token);
    assert.equal(res.status, 200);
    const found = res.data.find((a) => a._id === alertIdFromA);
    assert.equal(found, undefined, 'User B must NOT see User A\'s alert');
  });

  it('User B gets 404 when trying to delete User A\'s alert', async () => {
    const res = await request('DELETE', `/api/alerts/${alertIdFromA}`, null, userB.token);
    assert.equal(res.status, 404, `Expected 404, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  it('User A can still delete their own alert', async () => {
    const res = await request('DELETE', `/api/alerts/${alertIdFromA}`, null, userA.token);
    assert.equal(res.status, 200);
  });

  it('Unauthenticated request to alerts returns 401', async () => {
    const res = await request('GET', '/api/alerts', null, null);
    assert.equal(res.status, 401);
  });
});
