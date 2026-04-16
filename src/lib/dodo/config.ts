import DodoPayments from 'dodopayments';

if (!process.env.DODO_API_KEY) {
  throw new Error('DODO_API_KEY is not set');
}

export const dodo = new DodoPayments({
  bearerToken: process.env.DODO_API_KEY,
});

export const DODO_CONFIG = {
  founderProductId: process.env.DODO_FOUNDER_PRODUCT_ID ?? '',
  standardProductId: process.env.DODO_STANDARD_PRODUCT_ID ?? '',
  webhookSecret: process.env.DODO_WEBHOOK_SECRET ?? '',
  founderSeatsMax: 500,
} as const;
