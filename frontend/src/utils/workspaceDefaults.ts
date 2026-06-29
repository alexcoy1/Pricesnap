import { FinancingOption, Promotion, SubscriptionPlan, TeamMember } from '../types';

export const DEFAULT_PROMOTIONS: Promotion[] = [];

export const DEFAULT_FINANCING: FinancingOption[] = [];

export const DEFAULT_TEAM: TeamMember[] = [];

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: 'starter', name: 'Starter', priceMonthly: 29, features: ['50 quotes/month', '1 user', 'PDF export'] },
  { id: 'pro', name: 'Professional', priceMonthly: 49, features: ['Unlimited quotes', '5 team members', 'PDF export', 'Analytics'] },
  { id: 'enterprise', name: 'Enterprise', priceMonthly: 99, features: ['Unlimited everything', 'Priority support', 'Custom branding', 'API access'] },
];

export function parsePromotionsFromStorage(raw: string | null): Promotion[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return [];
    if (typeof parsed[0] === 'string') {
      return parsed.map((name: string, i: number) => ({
        id: `migrated-${i}`,
        name,
        discountPct: 10,
        validUntil: '',
        description: '',
        active: true,
        createdAt: new Date().toISOString(),
      }));
    }
    return parsed as Promotion[];
  } catch {
    return [];
  }
}

export function activePromotionNames(promotions: Promotion[]): string[] {
  return promotions.filter((p) => p.active).map((p) => p.name);
}
