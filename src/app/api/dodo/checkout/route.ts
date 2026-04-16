import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { dodo, DODO_CONFIG } from '@/lib/dodo/config';
import { getFounderStatus } from '@/lib/dodo/founderCounter';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  // 1. Auth check
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Get user from Supabase
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, tier, dodo_customer_id')
    .eq('clerk_id', clerkId)
    .single();

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 3. Already a steward?
  if (user.tier === 'steward') {
    return NextResponse.json({ error: 'Already a Steward' }, { status: 400 });
  }

  // 4. Determine product based on founder availability
  const founderStatus = await getFounderStatus();
  const productId = founderStatus.isFounderAvailable
    ? DODO_CONFIG.founderProductId
    : DODO_CONFIG.standardProductId;

  // 5. Get or create Dodo customer
  let customerId = user.dodo_customer_id;
  if (!customerId) {
    const customer = await dodo.customers.create({
      name: clerkId,
      email: '', // Will be populated from Clerk if available
    });
    customerId = customer.customer_id;

    await supabaseAdmin
      .from('users')
      .update({ dodo_customer_id: customerId })
      .eq('id', user.id);
  }

  // 6. Create subscription via Dodo checkout
  // payment_link: true tells Dodo to generate a hosted checkout URL.
  // billing.country is a default; the customer confirms/edits on the hosted page.
  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? '';

  const subscription = await dodo.subscriptions.create({
    customer: { customer_id: customerId },
    product_id: productId,
    quantity: 1,
    billing: { country: 'US' },
    payment_link: true,
    return_url: `${origin}/world?upgraded=true`,
    metadata: {
      supabase_user_id: user.id,
      is_founder: founderStatus.isFounderAvailable ? 'true' : 'false',
    },
  });

  if (!subscription.payment_link) {
    console.error('[Dodo Checkout] No payment_link returned from Dodo');
    return NextResponse.json({ error: 'Checkout unavailable' }, { status: 502 });
  }

  return NextResponse.json({ url: subscription.payment_link });
}
