const express = require('express');
const router = express.Router();

// POST /api/assistant
// body: { prompt: string }
router.post('/', async (req, res) => {
  const { prompt } = req.body ?? {};
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ status: 'error', message: 'Missing prompt' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    const canned = `Hi — I can help with electrical safety, wiring troubleshooting, and appliance handling. Example advice: Always switch off the mains before working on wiring, use proper PPE, and call a licensed electrician for fixed wiring faults.`;
    return res.json({ status: 'success', data: { reply: canned, note: 'no_api_key' } });
  }

  try {
    // Make sure SDK picks up the configured key
    process.env.GEMINI_API_KEY = apiKey;

    // Load the official GenAI client (supports both require and dynamic import)
    let GoogleGenAI;
    try {
      GoogleGenAI = require('@google/genai').GoogleGenAI;
    } catch (e) {
      // ESM-only package: dynamic import fallback
      const mod = await import('@google/genai');
      GoogleGenAI = mod.GoogleGenAI;
    }

    if (!GoogleGenAI) {
      throw new Error('The @google/genai package is not available or did not expose GoogleGenAI');
    }

    const ai = new GoogleGenAI({}); // client reads key from env

    // Use the simple generateContent API
    const sdkRes = await ai.models.generateContent({ model, contents: prompt });

    // Many SDK shapes are possible — extract text safely
    const reply =
      sdkRes?.text ||
      sdkRes?.output?.text ||
      sdkRes?.outputs?.[0]?.content?.[0]?.text ||
      (typeof sdkRes === 'object' ? JSON.stringify(sdkRes) : String(sdkRes));

    return res.json({ status: 'success', data: { reply: String(reply) } });
  } catch (err) {
    console.error('Assistant error (genai):', err?.response ?? err?.message ?? err);
    return res.status(500).json({ status: 'error', message: 'Assistant request failed', detail: err?.message ?? err });
  }
});

module.exports = router;
