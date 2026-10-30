export const VERSION = "1.0.0";

export const LIMITS = {
  maxUrlLength: 2048,
  maxRedirects: 5,
  perRequestTimeoutMs: 12_000,
  totalBudgetMs: 25_000,
  maxHtmlBytes: 2_000_000,
  maxSubrequests: 20,
  // abuse limits (enforced in the database function)
  perIpPerHour: 10,
  globalPerDay: 300,
} as const;

export const USER_AGENT = `DanishStorefrontQA/${VERSION} (+single-page check of public Danish storefront text)`;
