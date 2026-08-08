import Stripe from 'stripe';
import { supabaseAdmin } from '../../src/utils/client.server';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function handler(event: any) {
  if (!stripeSecretKey || !stripeWebhookSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Stripe webhook is not configured' }),
    };
  }

  const payload = event.body ?? '';
  const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];

  if (!signature) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing Stripe signature header' }) };
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-11-15' });

  let stripeEvent: Stripe.Event;
  try {
    stripeEvent = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret);
  } catch (error: unknown) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid webhook signature' }),
    };
  }

  try {
    await supabaseAdmin.from('stripe_webhook_events').insert({
      event_id: stripeEvent.id,
      event_type: stripeEvent.type,
      payload: stripeEvent,
      received_at: new Date().toISOString(),
    });
  } catch {
    // silently ignore storage failures, stripe event handling can be extended later.
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
}
