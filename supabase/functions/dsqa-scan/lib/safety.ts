// Adapted from philipairlind-hub/seo-regression-guard@965a29a src/safety.ts (same owner). Import paths only.
import { LIMITS } from "./config.ts";
import { isIpLiteral, isPublicIp } from "./ip.ts";

export class SafetyError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

const BLOCKED_SUFFIXES = [
  "localhost", "local", "localdomain", "internal", "intranet", "lan", "home", "corp",
  "home.arpa", "arpa", "onion", "test", "invalid", "example",
];

/** Adds https:// to bare hostnames, trims whitespace. */
export function normalizeInput(raw: string): string {
  const s = raw.trim();
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) return `https://${s}`;
  return s;
}

/**
 * Syntactic validation. Throws SafetyError. DNS-level checks happen in assertPublicHost.
 */
export function validateUrl(raw: string, selfHosts: string[] = []): URL {
  if (raw.length > LIMITS.maxUrlLength) throw new SafetyError("url_too_long", "URL is longer than 2048 characters.");
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new SafetyError("invalid_url", "This is not a valid URL.");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:")
    throw new SafetyError("unsupported_scheme", "Only http and https URLs can be checked.");
  if (u.username || u.password) throw new SafetyError("credentials_in_url", "URLs with embedded credentials are not allowed.");
  if (u.port && u.port !== "80" && u.port !== "443")
    throw new SafetyError("port_not_allowed", "Only the standard ports 80 and 443 are allowed.");
  const host = u.hostname.toLowerCase().replace(/\.$/, "");
  if (isIpLiteral(host)) throw new SafetyError("ip_literal", "Enter a domain name, not an IP address.");
  if (!host.includes(".")) throw new SafetyError("not_public_hostname", "This is not a public hostname.");
  for (const suf of BLOCKED_SUFFIXES) {
    if (host === suf || host.endsWith(`.${suf}`))
      throw new SafetyError("not_public_hostname", "This hostname is reserved for private or test use.");
  }
  if (!/^[a-z0-9.-]+$/.test(host) || host.split(".").some((l) => !l || l.length > 63 || l.startsWith("-") || l.endsWith("-")))
    throw new SafetyError("invalid_hostname", "The hostname is not valid.");
  if (selfHosts.some((h) => host === h || host.endsWith(`.${h}`)))
    throw new SafetyError("self_reference", "The checker cannot check itself.");
  u.hash = "";
  return u;
}

export type Resolver = (host: string) => Promise<string[]>;

/**
 * Resolves the host and rejects if ANY address is non-public. Fails closed when DNS fails.
 * Limitation: the runtime's fetch() resolves DNS again (TOCTOU / rebinding window). On
 * Cloudflare Workers, outbound fetch cannot reach private networks, which closes that gap
 * in production; the check here is defence in depth and protects local/Node runs.
 */
export async function assertPublicHost(host: string, resolve: Resolver, cache?: Map<string, Promise<string[]>>): Promise<string[]> {
  let p = cache?.get(host);
  if (!p) {
    p = resolve(host);
    cache?.set(host, p);
  }
  let ips: string[];
  try {
    ips = await p;
  } catch (e) {
    if (e instanceof SafetyError) throw e;
    throw new SafetyError("dns_failure", `DNS lookup failed for ${host}.`);
  }
  if (ips.length === 0) throw new SafetyError("dns_no_address", `${host} has no A or AAAA record.`);
  const bad = ips.find((ip) => !isPublicIp(ip));
  if (bad) throw new SafetyError("private_address", `${host} resolves to a non-public address and cannot be checked.`);
  return ips;
}

/** DNS-over-HTTPS resolver (Cloudflare JSON API). */
export function dohResolver(fetchFn: typeof fetch, endpoint = "https://cloudflare-dns.com/dns-query"): Resolver {
  return async (host) => {
    const q = async (type: "A" | "AAAA") => {
      const res = await fetchFn(`${endpoint}?name=${encodeURIComponent(host)}&type=${type}`, {
        headers: { accept: "application/dns-json" },
      });
      if (!res.ok) throw new Error(`doh ${res.status}`);
      const j = (await res.json()) as { Status: number; Answer?: { type: number; data: string }[] };
      if (j.Status === 3) throw new SafetyError("dns_nxdomain", `${host} does not exist (NXDOMAIN).`);
      if (j.Status !== 0) throw new Error(`doh status ${j.Status}`);
      return (j.Answer ?? []).filter((a) => a.type === 1 || a.type === 28).map((a) => a.data);
    };
    const [a, aaaa] = await Promise.all([q("A"), q("AAAA")]);
    return [...a, ...aaaa];
  };
}
