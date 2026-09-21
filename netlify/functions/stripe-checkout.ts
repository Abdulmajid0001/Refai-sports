import Stripe from 'stripe';
import { supabaseAdmin } from '../../src/utils/client.server';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function handler(event: any) {
  if (!stripeSecretKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Stripe secret key not configured' }),
    };
  }

  const body = JSON.parse(event.body || '{}');
  const plan = String(body.plan || '').trim();
  if (!plan) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing plan identifier' }),
    };
  }

  const { data: planData, error: planError } = await supabaseAdmin
    .from('subscription_plans')
    .select('stripe_price_id')
    .eq('slug', plan)
    .maybeSingle();

  if (planError || !planData?.stripe_price_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Stripe price ID for plan is not configured' }),
    };
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2022-11-15' });
  const origin = event.headers?.origin || `http://${event.headers?.host || 'localhost:5173'}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: planData.stripe_price_id, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancel`,
      metadata: { plan },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url ?? null }),
    };
  } catch (error: unknown) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'Stripe checkout failed' }),
    };
  }
}
