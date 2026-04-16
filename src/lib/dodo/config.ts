import DodoPayments from 'dodopayments';

// Lazy instantiation via Proxy: the Dodo client is constructed (and env var
// checked) only on first property access — not at module import. This keeps
// `next build` working even when DODO_API_KEY is empty, while still failing
// loudly at request time if the var is unset in a live environment.
let _client: DodoPayments | null = null;

function getClient(): DodoPayments {
  if (!_client) {
    if (!process.env.DODO_API_KEY) {
      throw new Error('DODO_API_KEY is not set');
    }
    _client = new DodoPayments({ bearerToken: process.env.DODO_API_KEY });
  }
  return _client;
}

export const dodo = new Proxy({} as DodoPayments, {
  get(_target, prop) {
    const client = getClient() as unknown as Record<string | symbol, unknown>;
    return client[prop];
  },
});

export const DODO_CONFIG = {
  founderProductId: process.env.DODO_FOUNDER_PRODUCT_ID ?? '',
  standardProductId: process.env.DODO_STANDARD_PRODUCT_ID ?? '',
  webhookSecret: process.env.DODO_WEBHOOK_SECRET ?? '',
  founderSeatsMax: 500,
} as const;
