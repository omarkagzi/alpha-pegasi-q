import { NextRequest, NextResponse } from 'next/server';
import type { WebhookPayload } from 'dodopayments/resources';
import { DODO_CONFIG } from '@/lib/dodo/config';
import { claimFounderSeat } from '@/lib/dodo/founderCounter';
import { createClient } from '@supabase/supabase-js';
import { Webhook } from 'standardwebhooks';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headers = Object.fromEntries(request.headers);

  // Verify webhook signature using standardwebhooks.
  // (SDK export is WebhookPayload, not WebhookEvent as the plan documented.)
  let payload: WebhookPayload;
  try {
    const wh = new Webhook(DODO_CONFIG.webhookSecret);
    payload = wh.verify(body, headers) as WebhookPayload;
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const eventType = payload.type;

  switch (eventType) {
    case 'subscription.active': {
      // Narrow the union — subscription events carry the Subscription payload_type.
      if (payload.data.payload_type !== 'Subscription') {
        console.error('Webhook: subscription.active with non-Subscription payload');
        break;
      }
      const data = payload.data;
      const userId = data.metadata?.supabase_user_id;
      const isFounder = data.metadata?.is_founder === 'true';

      if (!userId) {
        console.error('Webhook: missing supabase_user_id in metadata');
        break;
      }

      // Claim founder seat if applicable
      let founderSeatNumber: number | null = null;
      if (isFounder) {
        founderSeatNumber = await claimFounderSeat();
      }

      // Update user to steward
      await supabaseAdmin
        .from('users')
        .update({
          tier: 'steward',
          dodo_subscription_id: data.subscription_id,
          subscription_status: 'active',
          ...(founderSeatNumber ? { founder_seat_number: founderSeatNumber } : {}),
        })
        .eq('id', userId);

      console.log(`User ${userId} upgraded to steward (founder seat: ${founderSeatNumber ?? 'N/A'})`);
      break;
    }

    case 'subscription.cancelled': {
      if (payload.data.payload_type !== 'Subscription') break;
      const data = payload.data;
      const userId = data.metadata?.supabase_user_id;

      if (userId) {
        await supabaseAdmin
          .from('users')
          .update({
            tier: 'traveler',
            subscription_status: 'canceled',
          })
          .eq('id', userId);

        console.log(`User ${userId} downgraded to traveler (subscription canceled)`);
      }
      break;
    }

    case 'subscription.failed': {
      if (payload.data.payload_type !== 'Subscription') break;
      const data = payload.data;
      const userId = data.metadata?.supabase_user_id;

      if (userId) {
        await supabaseAdmin
          .from('users')
          .update({ subscription_status: 'past_due' })
          .eq('id', userId);

        console.log(`User ${userId} payment failed — marked as past_due`);
        // TODO post-launch: send notification email, implement 3-day grace period
      }
      break;
    }

    default:
      // Unhandled event type — log and ignore
      console.log(`Unhandled webhook event: ${eventType}`);
  }

  return NextResponse.json({ received: true });
}
