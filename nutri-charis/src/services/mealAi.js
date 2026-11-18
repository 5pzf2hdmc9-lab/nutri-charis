import { supabase } from '../supabaseClient';

/**
 * Server `/api/generate-meals` only (GEMINI_API_KEY). No browser key fallback.
 * Sends the current Supabase access token; the route requires a dietitian row.
 */
export async function callMealAi(promptText) {
  const prompt = String(promptText || '').slice(0, 12000);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user?.id) {
    throw new Error('Απαιτείται πιστοποίηση για την υπηρεσία AI.');
  }
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) {
    throw new Error('Απαιτείται πιστοποίηση για την υπηρεσία AI.');
  }

  const res = await fetch('/api/generate-meals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ promptText: prompt })
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok && typeof data?.text === 'string' && data.text.trim()) {
    return data.text;
  }
  throw new Error(data?.error || 'Αποτυχία AI υπηρεσίας.');
}

export function parseAiJson(rawText, fallback) {
  const text = String(rawText || '').trim();
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}
