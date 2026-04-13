// Vercel serverless function: POST /api/checkout
// Accepts { uid, email } and returns { url } for a Stripe Checkout Session.

export const config = {
  maxDuration: 30,
};

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

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const appUrl = process.env.APP_URL || 'https://listing-ai.app';

  if (!stripeKey || !priceId) {
    return res.status(500).json({
      error: 'Server misconfigured: STRIPE_SECRET_KEY or STRIPE_PRICE_ID is not set.',
    });
  }

  try {
    const { uid, email } = req.body || {};
    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "uid".' });
    }

    // Build x-www-form-urlencoded body for Stripe's REST API.
    const params = new URLSearchParams();
    params.append('mode', 'subscription');
    params.append('line_items[0][price]', priceId);
    params.append('line_items[0][quantity]', '1');
    params.append('success_url', `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`);
    params.append('cancel_url', `${appUrl}/cancel`);
    params.append('client_reference_id', uid);
    params.append('metadata[uid]', uid);
    if (email && typeof email === 'string') {
      params.append('customer_email', email);
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const rawText = await stripeRes.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return res.status(502).json({
        error: `Upstream returned non-JSON (HTTP ${stripeRes.status}): ${rawText.slice(0, 200)}`,
      });
    }

    if (!stripeRes.ok) {
      return res.status(stripeRes.status).json({
        error: data?.error?.message || 'Stripe request failed',
      });
    }

    if (!data?.url) {
      return res.status(502).json({ error: 'Stripe did not return a checkout URL.' });
    }

    return res.status(200).json({ url: data.url });
  } catch (err) {
    console.error('[/api/checkout]', err);
    return res.status(500).json({
      error: err?.message || 'Internal server error',
    });
  }
}
