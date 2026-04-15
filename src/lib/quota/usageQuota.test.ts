import { getQuotaLimit, type QuotaCheckResult } from './usageQuota';

describe('getQuotaLimit', () => {
  it('returns 10 for traveler tier', () => {
    expect(getQuotaLimit('traveler')).toBe(10);
  });

  it('returns 50 for steward tier', () => {
    expect(getQuotaLimit('steward')).toBe(50);
  });

  it('returns 10 for unknown tier (safe default)', () => {
    expect(getQuotaLimit('visitor' as any)).toBe(10);
  });
});
