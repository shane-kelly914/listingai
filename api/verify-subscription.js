// Vercel serverless function: POST /api/verify-subscription
// Accepts { uid } and checks Stripe for any active subscription linked
// to that Firebase uid via client_reference_id (set when the Checkout
// Session was created in /api/checkout). Returns { isPro } so the
// client can update its own Firestore doc.
//
// This avoids needing a server-side Firebase Admin SDK (blocked by
// Google's default org policy on service account key creation). The
// mobile app is already authenticated and has write access to its own
// user doc.

export const config = {
  maxDuration: 15,
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
  if (!stripeKey) {
    return res.status(500).json({
      error: 'Server misconfigured: STRIPE_SECRET_KEY is not set.',
    });
  }

  try {
    const { uid } = req.body || {};
    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "uid".' });
    }

    // Look for the most recent Checkout Session with this uid as the
    // client_reference_id. Stripe caps list?limit at 100, newest first.
    const sessionsRes = await fetch(
      'https://api.stripe.com/v1/checkout/sessions?limit=100',
      { headers: { Authorization: `Bearer ${stripeKey}` } },
    );
    const sessionsText = await sessionsRes.text();
    let sessions;
    try {
      sessions = JSON.parse(sessionsText);
    } catch {
      return res.status(502).json({
        error: `Stripe returned non-JSON: ${sessionsText.slice(0, 200)}`,
      });
    }
    if (!sessionsRes.ok) {
      return res.status(sessionsRes.status).json({
        error: sessions?.error?.message || 'Stripe list sessions failed',
      });
    }

    const match = (sessions?.data || []).find(
      s => s.client_reference_id === uid || s?.metadata?.uid === uid,
    );

    if (!match || !match.subscription) {
      return res.status(200).json({ isPro: false, reason: 'no_session' });
    }

    // Fetch the linked subscription to check its status.
    const subRes = await fetch(
      `https://api.stripe.com/v1/subscriptions/${match.subscription}`,
      { headers: { Authorization: `Bearer ${stripeKey}` } },
    );
    const subText = await subRes.text();
    let sub;
    try {
      sub = JSON.parse(subText);
    } catch {
      return res.status(502).json({
        error: `Stripe returned non-JSON: ${subText.slice(0, 200)}`,
      });
    }
    if (!subRes.ok) {
      return res.status(subRes.status).json({
        error: sub?.error?.message || 'Stripe subscription lookup failed',
      });
    }

    const isPro = sub.status === 'active' || sub.status === 'trialing';
    return res.status(200).json({
      isPro,
      status: sub.status,
      customerId: sub.customer,
      subscriptionId: sub.id,
    });
  } catch (err) {
    console.error('[/api/verify-subscription]', err);
    return res.status(500).json({
      error: err?.message || 'Internal server error',
    });
  }
}
