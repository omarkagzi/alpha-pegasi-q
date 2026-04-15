import { choosePolicy, type Feature, type Tier, type LlmPolicy } from './policyRouter';

describe('choosePolicy', () => {
  describe('chat feature', () => {
    it('returns lite model for traveler tier', () => {
      const policy = choosePolicy('chat', 'traveler');
      expect(policy.provider).toBe('groq');
      expect(policy.model).toBe('llama-3.1-8b-instant');
      expect(policy.maxTokens).toBeLessThanOrEqual(1024);
    });

    it('returns versatile model for steward tier', () => {
      const policy = choosePolicy('chat', 'steward');
      expect(policy.provider).toBe('groq');
      expect(policy.model).toBe('llama-3.3-70b-versatile');
      expect(policy.maxTokens).toBeGreaterThan(1024);
    });
  });

  describe('background features', () => {
    const backgroundFeatures: Feature[] = ['heartbeat', 'journal', 'summary', 'sentiment'];

    backgroundFeatures.forEach((feature) => {
      it(`uses lite model for ${feature} regardless of tier`, () => {
        const travelerPolicy = choosePolicy(feature, 'traveler');
        const stewardPolicy = choosePolicy(feature, 'steward');
        expect(travelerPolicy.model).toBe('llama-3.1-8b-instant');
        expect(stewardPolicy.model).toBe('llama-3.1-8b-instant');
      });
    });
  });

  describe('fallback chain', () => {
    it('includes gemini fallback for all policies', () => {
      const policy = choosePolicy('chat', 'traveler');
      expect(policy.fallbackProvider).toBe('gemini');
      expect(policy.fallbackModel).toBe('gemini-2.0-flash');
    });
  });

  describe('response format', () => {
    it('uses json for heartbeat', () => {
      const policy = choosePolicy('heartbeat', 'traveler');
      expect(policy.responseFormat).toBe('json');
    });

    it('uses text for chat', () => {
      const policy = choosePolicy('chat', 'traveler');
      expect(policy.responseFormat).toBe('text');
    });

    it('uses json for sentiment', () => {
      const policy = choosePolicy('sentiment', 'traveler');
      expect(policy.responseFormat).toBe('json');
    });
  });
});
