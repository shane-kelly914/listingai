// Vercel serverless function: POST /api/stripe-webhook
// Listens for Stripe events and flips users to Pro in Firestore on
// successful subscription payments.
//
// Required env vars:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET     (whsec_...)
//   FIREBASE_PROJECT_ID
//   FIREBASE_CLIENT_EMAIL     (service account)
//   FIREBASE_PRIVATE_KEY      (service account, escape \n as \\n)

import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const config = {
  api: {
    // Stripe needs the raw body for signature verification.
    bodyParser: false,
  },
  maxDuration: 30,
};

function initFirebase() {
  if (getApps().length) return;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeKey || !webhookSecret) {
    return res.status(500).json({ error: 'Server misconfigured: Stripe keys missing.' });
  }

  const stripe = new Stripe(stripeKey);

  let event;
  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook signature failed: ${err.message}` });
  }

  try {
    initFirebase();
    const db = getFirestore();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const uid = session.client_reference_id || session.metadata?.uid;
        if (uid) {
          await db.collection('users').doc(uid).set(
            {
              isPro: true,
              stripeCustomerId: session.customer || null,
              stripeSubscriptionId: session.subscription || null,
              proActivatedAt: new Date(),
            },
            { merge: true },
          );
          console.log(`[stripe-webhook] Pro activated for ${uid}`);
        } else {
          console.warn('[stripe-webhook] checkout.session.completed without uid');
        }
        break;
      }

      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const status = sub.status;
        // active, trialing => Pro; past_due/canceled/unpaid => not Pro
        const isPro = status === 'active' || status === 'trialing';
        const customerId = sub.customer;
        const snapshot = await db
          .collection('users')
          .where('stripeCustomerId', '==', customerId)
          .limit(1)
          .get();
        if (!snapshot.empty) {
          await snapshot.docs[0].ref.set(
            { isPro, subscriptionStatus: status },
            { merge: true },
          );
          console.log(`[stripe-webhook] ${snapshot.docs[0].id} isPro=${isPro} (${status})`);
        }
        break;
      }

      default:
        // Ignore other events.
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[stripe-webhook] handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}
