import { NextResponse } from 'next/server';

// Stripe webhook handler — extend with subscription logic
export async function POST(req: Request) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  // TODO: verify with stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  // Handle customer.subscription.created, updated, deleted

  return NextResponse.json({ received: true });
}
