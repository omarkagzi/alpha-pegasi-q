import posthog from 'posthog-js';

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    posthog.capture(event, properties);
  }
}

export const analytics = {
  // Acquisition funnel
  landingPageView: () => trackEvent('landing_page_view'),
  signupStarted: () => trackEvent('signup_started'),
  signupCompleted: () => trackEvent('signup_completed'),
  firstWorldLoad: () => trackEvent('first_world_load'),

  // Engagement
  firstChatSent: (agentId: string) => trackEvent('first_chat_sent', { agent_id: agentId }),
  chatTurn: (agentId: string, turnNumber: number) =>
    trackEvent('chat_turn', { agent_id: agentId, turn_number: turnNumber }),
  chatCapHit: (tier: string, turnsUsed: number) =>
    trackEvent('chat_cap_hit', { tier, turns_used: turnsUsed }),
  activityFeedViewed: () => trackEvent('activity_feed_viewed'),
  journalViewed: (agentId: string) => trackEvent('journal_viewed', { agent_id: agentId }),

  // Conversion
  upgradePageViewed: (trigger: string) => trackEvent('upgrade_page_viewed', { trigger }),
  checkoutStarted: (priceId: string) => trackEvent('checkout_started', { price_id: priceId }),
  checkoutCompleted: (priceId: string, founderSeat?: number) =>
    trackEvent('checkout_completed', { price_id: priceId, founder_seat_number: founderSeat }),
};
