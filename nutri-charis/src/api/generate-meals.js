/**
 * Not the live Vercel route. /api/generate-meals.js (project root) is.
 * This file used to proxy a client-supplied Gemini key. That path is closed.
 */
export default async function handler(req, res) {
  if (req?.body && Object.prototype.hasOwnProperty.call(req.body, 'apiKey')) {
    /* never forward */
  }
  if (typeof res?.status === 'function') {
    res.setHeader?.('Cache-Control', 'no-store');
    return res.status(410).json({
      error: 'Τα κλειδιά AI δεν γίνονται δεκτά από τον browser. Χρησιμοποιήστε τον server /api/generate-meals.'
    });
  }
  throw new Error('Client API keys are not accepted.');
}
