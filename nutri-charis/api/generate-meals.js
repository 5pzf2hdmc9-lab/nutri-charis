const { checkRateLimit } = require('../src/lib/rateLimitServer');

const MAX_PROMPT = 12000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim().slice(0, 64);
  return req.socket?.remoteAddress || 'unknown';
}

function sanitizePrompt(text) {
  return String(text || '')
    .replace(/<\/?user_input>/gi, '')
    .slice(0, MAX_PROMPT);
}

function supabaseEnv() {
  const url = String(process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || '')
    .trim()
    .replace(/\/$/, '');
  const anon = String(process.env.SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();
  if (!url.startsWith('https://') || !anon || /service_role|sb_secret/i.test(anon)) return null;
  return { url, anon };
}

/** Valid session + dietitians row (RLS: select own). Rejects anonymous quota burn. */
async function requireDietitian(req) {
  const header = req.headers.authorization || '';
  const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token || token.length > 4096) return null;
  const env = supabaseEnv();
  if (!env) return null;
  const userRes = await fetch(`${env.url}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: env.anon }
  });
  if (!userRes.ok) return null;
  const user = await userRes.json();
  if (!user?.id || !UUID_RE.test(user.id)) return null;
  const dietRes = await fetch(`${env.url}/rest/v1/dietitians?user_id=eq.${user.id}&select=user_id`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: env.anon,
      Accept: 'application/json'
    }
  });
  if (!dietRes.ok) return null;
  const rows = await dietRes.json();
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return user;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  const ipLimit = checkRateLimit(`ai:${ip}`, 20, 15 * 60 * 1000);
  if (!ipLimit.allowed) {
    res.setHeader('Retry-After', String(ipLimit.retryAfterSec));
    return res.status(429).json({
      error: `Πάρα πολλά αιτήματα. Δοκιμάστε ξανά σε ${ipLimit.retryAfterSec} δευτερόλεπτα.`
    });
  }

  const dietitian = await requireDietitian(req);
  if (!dietitian) {
    return res.status(401).json({ error: 'Απαιτείται συνεδρία διαιτολόγου για την υπηρεσία AI.' });
  }

  const userLimit = checkRateLimit(`ai:user:${dietitian.id}`, 30, 15 * 60 * 1000);
  if (!userLimit.allowed) {
    res.setHeader('Retry-After', String(userLimit.retryAfterSec));
    return res.status(429).json({
      error: `Πάρα πολλά αιτήματα. Δοκιμάστε ξανά σε ${userLimit.retryAfterSec} δευτερόλεπτα.`
    });
  }

  // Server-side key only — ignore any client-supplied secret.
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const { promptText } = req.body || {};

  if (!apiKey) {
    return res.status(503).json({ error: 'AI service not configured on server.' });
  }
  if (!promptText || typeof promptText !== 'string') {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const safePrompt = sanitizePrompt(promptText);
  const wrapped = `Οδηγίες συστήματος: Απάντησε μόνο με διατροφικό περιεχόμενο.\n<user_input>\n${safePrompt}\n</user_input>`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: wrapped }] }]
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Gemini API Error'
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
