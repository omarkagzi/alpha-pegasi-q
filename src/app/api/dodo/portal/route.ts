import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { dodo } from '@/lib/dodo/config';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(_request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('dodo_customer_id, dodo_subscription_id')
    .eq('clerk_id', clerkId)
    .single();

  if (!user?.dodo_customer_id) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }

  // Dodo provides a hosted customer portal — return its URL for client redirect.
  // SDK path is customers.customerPortal.create(customerId, params) — the plan
  // called it customers.createCustomerPortal(...), which doesn't exist on the
  // current SDK.
  const portalSession = await dodo.customers.customerPortal.create(
    user.dodo_customer_id,
    { send_email: false }
  );

  return NextResponse.json({ url: portalSession.link });
}
