const { checkRateLimit } = require('../src/lib/rateLimitServer');

const MAX_PROMPT = 12000;

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length) return xf.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function sanitizePrompt(text) {
  return String(text || '')
    .replace(/<\/?user_input>/gi, '')
    .slice(0, MAX_PROMPT);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  const rl = checkRateLimit(`ai:${ip}`, 20, 15 * 60 * 1000);
  if (!rl.allowed) {
    res.setHeader('Retry-After', String(rl.retryAfterSec));
    return res.status(429).json({
      error: `Πάρα πολλά αιτήματα. Δοκιμάστε ξανά σε ${rl.retryAfterSec} δευτερόλεπτα.`
    });
  }

  // Server-side key only — never accept client-supplied secrets.
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
