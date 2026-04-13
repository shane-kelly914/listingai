// Vercel serverless function: POST /api/transcribe
// Accepts { audio: base64, mimeType } and returns { text }.
// Uses OpenAI Whisper via the Audio Transcriptions API.

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
  maxDuration: 60,
};

// Map mime types to reasonable filenames/extensions. Whisper uses the
// filename extension to infer format.
function extensionFor(mimeType) {
  const mt = (mimeType || '').toLowerCase();
  if (mt.includes('mp4') || mt.includes('m4a') || mt.includes('aac')) return 'm4a';
  if (mt.includes('mpeg') || mt.includes('mp3')) return 'mp3';
  if (mt.includes('wav')) return 'wav';
  if (mt.includes('webm')) return 'webm';
  if (mt.includes('ogg')) return 'ogg';
  if (mt.includes('flac')) return 'flac';
  return 'm4a';
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
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
    const { audio, mimeType } = req.body || {};
    if (!audio || typeof audio !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "audio" (base64 string expected).' });
    }

    const ext = extensionFor(mimeType);
    const effectiveMime = mimeType || 'audio/mp4';
    const audioBuffer = Buffer.from(audio, 'base64');

    // Build multipart/form-data body for the Whisper endpoint.
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: effectiveMime });
    formData.append('file', blob, `audio.${ext}`);
    formData.append('model', 'whisper-1');

    const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
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
        error: data?.error?.message || 'OpenAI transcription failed',
      });
    }

    const text = data?.text;
    if (typeof text !== 'string') {
      return res.status(502).json({ error: 'Empty response from OpenAI.' });
    }

    return res.status(200).json({ text });
  } catch (err) {
    console.error('[/api/transcribe]', err);
    return res.status(500).json({
      error: err?.message || 'Internal server error',
    });
  }
}
