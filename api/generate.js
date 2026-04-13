// Vercel serverless function: POST /api/generate
// Accepts { images: [{ base64, mimeType }], prompt } and returns { text }.
// Uses OpenAI GPT-4o (Vision) via the Chat Completions API.

export const config = {
  // Larger body limit to accept multiple base64-encoded photos.
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    // CORS preflight (useful if called from web too)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Server misconfigured: OPENAI_API_KEY is not set.',
    });
  }

  try {
    const { images, prompt } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "prompt".' });
    }
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Provide at least one image.' });
    }

    // Build multi-modal content: text prompt + each image as a data URL.
    const content = [
      { type: 'text', text: prompt },
      ...images.map(img => ({
        type: 'image_url',
        image_url: {
          url: `data:${img.mimeType || 'image/jpeg'};base64,${img.base64}`,
        },
      })),
    ];

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 2000,
        messages: [{ role: 'user', content }],
      }),
    });

    const rawText = await openaiRes.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(502).json({
        error: `Upstream returned non-JSON (HTTP ${openaiRes.status}): ${rawText.slice(0, 200)}`,
      });
    }

    if (!openaiRes.ok) {
      return res.status(openaiRes.status).json({
        error: data?.error?.message || 'OpenAI request failed',
      });
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      return res.status(502).json({ error: 'Empty response from OpenAI.' });
    }

    return res.status(200).json({ text });
  } catch (err) {
    console.error('[/api/generate]', err);
    return res.status(500).json({
      error: err?.message || 'Internal server error',
    });
  }
}
