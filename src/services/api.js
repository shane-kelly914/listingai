const API_BASE_URL = 'https://listingai-drab-psi.vercel.app';

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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate description');
    }

    const data = await response.json();
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to transcribe audio');
    }

    const data = await response.json();
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}
