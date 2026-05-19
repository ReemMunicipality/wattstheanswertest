// Cloudflare Worker — Watt's the Answer leaderboard API
// Paste this entire file into the Worker editor at
// https://dash.cloudflare.com → Workers & Pages → wattstheanswer-api → Edit code

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

// Only these scores are achievable in the real game (matches moneyLadder in script.js).
const VALID_SCORES = new Set([
  0, 100, 200, 500, 1000, 2000, 4000, 6000, 8000,
  10000, 15000, 25000, 50000, 75000, 100000, 150000,
  250000, 500000, 750000, 900000, 1000000,
]);

// 20 questions × 30s = 600s natural max. Allow generous headroom for the
// "Add Time" helpline and small clock drift, but reject anything absurd.
const MIN_GAME_TIME_SECONDS = 20;   // sub-1s/question is impossible
const MAX_GAME_TIME_SECONDS = 900;  // 15 min ceiling

// Per-IP rate limit window for score submissions.
const RATE_LIMIT_WINDOW_SECONDS = 30;

// Same-name + same-score replay window.
const DUP_WINDOW_SECONDS = 60;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function formatAmount(score) {
  return score.toLocaleString('en-US') + ' Points';
}

function sanitizeName(raw) {
  return String(raw || '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, 30);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    if (url.pathname === '/' || url.pathname === '/health') {
      return json({ ok: true, service: 'wattstheanswer-api' });
    }

    if (url.pathname !== '/leaderboard') {
      return json({ error: 'Not found' }, 404);
    }

    // GET /leaderboard — top 15 by score desc, time asc
    if (request.method === 'GET') {
      try {
        const { results } = await env.DB.prepare(
          `SELECT name, score, time, amount
             FROM leaderboard
             ORDER BY score DESC, time ASC
             LIMIT 15`
        ).all();
        return json({ data: results });
      } catch (err) {
        return json({ error: String(err) }, 500);
      }
    }

    // POST /leaderboard — insert { name, score, time }
    if (request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'Invalid JSON' }, 400);
      }

      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const now = Math.floor(Date.now() / 1000);

      // 1. Per-IP rate limit
      try {
        const recent = await env.DB.prepare(
          `SELECT ts FROM submission_log WHERE ip = ? AND ts > ? LIMIT 1`
        ).bind(ip, now - RATE_LIMIT_WINDOW_SECONDS).first();
        if (recent) {
          return json({ error: 'Too many submissions — please wait a moment' }, 429);
        }
      } catch (e) {
        // If the log table doesn't exist yet, fall through — primary insert will still validate.
      }

      // 2. Name
      const name = sanitizeName(body.name);
      if (!name) return json({ error: 'name required' }, 400);

      // 3. Score must be on the ladder
      const score = Number(body.score);
      if (!Number.isInteger(score) || !VALID_SCORES.has(score)) {
        return json({ error: 'score is not a valid prize-ladder value' }, 400);
      }

      // 4. Time bounds
      const time = Number(body.time);
      if (!Number.isFinite(time) || time < MIN_GAME_TIME_SECONDS || time > MAX_GAME_TIME_SECONDS) {
        return json({ error: 'time is implausible' }, 400);
      }

      // 5. Reject obvious replays (same name + same score in the last minute)
      try {
        const dup = await env.DB.prepare(
          `SELECT id FROM leaderboard
             WHERE name = ? AND score = ? AND created_at > ?
             LIMIT 1`
        ).bind(name, score, now - DUP_WINDOW_SECONDS).first();
        if (dup) return json({ error: 'duplicate submission' }, 409);
      } catch (e) {
        // ignore — the insert will still succeed; this check is a soft guard
      }

      // Derive the formatted amount on the server — never trust the client's label
      const amount = formatAmount(score);

      try {
        await env.DB.prepare(
          `INSERT INTO leaderboard (name, score, time, amount) VALUES (?, ?, ?, ?)`
        ).bind(name, score, Math.round(time), amount).run();

        // Log this IP submission. Best-effort; failure does not affect the insert.
        try {
          await env.DB.prepare(
            `INSERT INTO submission_log (ip, ts) VALUES (?, ?)`
          ).bind(ip, now).run();
          // Opportunistic cleanup — drop log rows older than a day.
          await env.DB.prepare(
            `DELETE FROM submission_log WHERE ts < ?`
          ).bind(now - 86400).run();
        } catch (e) { /* log table optional */ }

        return json({ ok: true });
      } catch (err) {
        return json({ error: String(err) }, 500);
      }
    }

    return json({ error: 'Method not allowed' }, 405);
  },
};
