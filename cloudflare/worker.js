// Cloudflare Worker — Watt's the Answer leaderboard API
// Paste this entire file into the Worker editor at
// https://dash.cloudflare.com → Workers & Pages → wattstheanswer-api → Edit code

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // Health check
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

    // POST /leaderboard — insert { name, score, time, amount }
    if (request.method === 'POST') {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: 'Invalid JSON' }, 400);
      }

      const name = String(body.name || '').trim().slice(0, 50);
      const score = Number(body.score);
      const time = Number(body.time);
      const amount = String(body.amount || '').slice(0, 50);

      if (!name) return json({ error: 'name required' }, 400);
      if (!Number.isFinite(score) || score < 0) return json({ error: 'score must be a non-negative number' }, 400);
      if (!Number.isFinite(time) || time < 0) return json({ error: 'time must be a non-negative number' }, 400);
      if (!amount) return json({ error: 'amount required' }, 400);

      try {
        await env.DB.prepare(
          `INSERT INTO leaderboard (name, score, time, amount) VALUES (?, ?, ?, ?)`
        ).bind(name, score, time, amount).run();
        return json({ ok: true });
      } catch (err) {
        return json({ error: String(err) }, 500);
      }
    }

    return json({ error: 'Method not allowed' }, 405);
  },
};
