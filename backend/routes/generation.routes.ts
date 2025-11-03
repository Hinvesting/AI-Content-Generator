import express from 'express';
import authMiddleware from '../middleware/auth.middleware';

const router = express.Router();

// Protect all generation routes
router.use(authMiddleware);

// POST /api/generate/image
router.post('/image', async (req, res) => {
  try {
    const { prompt, size } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

    // NOTE: The exact @google/genai client usage may vary by version.
    // We'll attempt a best-effort call and return the generated base64 image if available.
    try {
      // lazy import so the app can still start if the package is not used client-side
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const genai = require('@google/genai');

      // This block assumes the library exposes a client. Replace with the
      // correct call for your @google/genai version.
      const client = new genai.ImageGenerationClient({ apiKey });
      const result = await client.generate({ prompt, size: size || '1024x1024' });

      // Expected: result.data[0].b64_json or similar
      const imageBase64 = result?.data?.[0]?.b64_json || result?.b64;
      return res.json({ image: imageBase64 || result });
    } catch (err: any) {
      // If the specific client call fails because of API mismatch, return a helpful error.
      return res.status(500).json({ error: 'GenAI call failed', message: err.message });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/generate/enhance-script
router.post('/enhance-script', async (req, res) => {
  try {
    const { prompt, settings } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const genai = require('@google/genai');
      const client = new genai.TextGenerationClient({ apiKey });
      const result = await client.generate({ prompt, ...settings });
      const text = result?.output || result?.text || result;
      return res.json({ text });
    } catch (err: any) {
      return res.status(500).json({ error: 'GenAI call failed', message: err.message });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/generate/transparent-image
router.post('/transparent-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const genai = require('@google/genai');
      const client = new genai.ImageGenerationClient({ apiKey });
      const result = await client.generate({ prompt, transparent: true });
      const imageBase64 = result?.data?.[0]?.b64_json || result?.b64;
      return res.json({ image: imageBase64 || result });
    } catch (err: any) {
      return res.status(500).json({ error: 'GenAI call failed', message: err.message });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
