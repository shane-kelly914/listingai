const API_BASE_URL = 'https://listingai-drab-psi.vercel.app';

// Safely parse an API response. If the body isn't valid JSON (e.g. the server
// returned an HTML error page or plain-text timeout), surface the first chunk
// of the raw body in the thrown error so we can actually diagnose the problem
// instead of getting cryptic "Unexpected character: T" errors.
async function parseApiResponse(response, fallbackMsg) {
  const rawText = await response.text();
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch (_) {
    // Body wasn't JSON — build a helpful error with a preview of the body.
    const preview = rawText.slice(0, 180).replace(/\s+/g, ' ').trim();
    throw new Error(
      `Server returned non-JSON (HTTP ${response.status}). ` +
      `Body starts with: "${preview}"`
    );
  }
  if (!response.ok) {
    throw new Error(data?.error || `${fallbackMsg} (HTTP ${response.status})`);
  }
  return data;
}

export async function generateDescription(images, prompt) {
  try {
    const formattedImages = images.map(img => ({
      base64: img.base64,
      mimeType: img.mimeType || 'image/jpeg',
    }));

    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        images: formattedImages,
        prompt,
      }),
    });

    const data = await parseApiResponse(response, 'Failed to generate description');
    return data.text;
  } catch (error) {
    console.error('Error generating description:', error);
    throw error;
  }
}

export async function transcribeAudio(base64Audio, mimeType = 'audio/mp4') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: base64Audio,
        mimeType,
      }),
    });

    const data = await parseApiResponse(response, 'Failed to transcribe audio');
    return data.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

export async function createCheckoutSession(uid, email) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        email,
      }),
    });

    const data = await parseApiResponse(response, 'Failed to create checkout session');
    return data.url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function verifySubscription(uid) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/verify-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    });
    const data = await parseApiResponse(response, 'Failed to verify subscription');
    return data; // { isPro, status?, subscriptionId?, customerId? }
  } catch (error) {
    console.error('Error verifying subscription:', error);
    throw error;
  }
}
