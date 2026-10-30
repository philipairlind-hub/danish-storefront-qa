// Adapted from philipairlind-hub/seo-regression-guard@965a29a src/http.ts (same owner). Import paths + accept-language option.
import { LIMITS } from "./config.ts";
import { assertPublicHost, type Resolver, SafetyError, validateUrl } from "./safety.ts";

export interface Deps {
  fetch: typeof fetch;
  resolve: Resolver;
  now: () => number;
  userAgent: string;
  selfHosts?: string[];
  timeoutMs?: number; // per-request override (tests)
}

/** Shared per-check context: subrequest budget, DNS cache, deadline. */
export class CheckContext {
  subrequests = 0;
  dnsCache = new Map<string, Promise<string[]>>();
  readonly deadline: number;
  constructor(public deps: Deps, totalMs: number = LIMITS.totalBudgetMs) {
    this.deadline = deps.now() + totalMs;
  }
  take(n = 1) {
    if (this.subrequests + n > LIMITS.maxSubrequests)
      throw new FetchError("budget_exhausted", "Request budget for this check was used up.");
    this.subrequests += n;
  }
  remainingMs() {
    return this.deadline - this.deps.now();
  }
}

export type NetworkErrorCode =
  | "timeout" | "tls_error" | "connection_error" | "dns_failure" | "budget_exhausted"
  | "redirect_loop" | "too_many_redirects" | "redirect_missing_location" | "unsafe_redirect" | "body_read_error";

export class FetchError extends Error {
  constructor(public code: NetworkErrorCode, message: string) {
    super(message);
  }
}

export interface Hop {
  url: string;
  status: number;
  location: string | null;
}

export interface FetchedResponse {
  url: string;
  status: number;
  headers: Headers;
  body: string;
  bytesRead: number;
  truncated: boolean;
  stoppedAtHeadEnd: boolean;
}

export interface ChainResult {
  hops: Hop[]; // every response before the final one (3xx)
  final?: FetchedResponse;
  error?: { code: string; message: string; atUrl: string };
}

const REDIRECT = new Set([301, 302, 303, 307, 308]);

export function classifyFetchError(e: unknown): FetchError {
  if (e instanceof FetchError) return e;
  const err = e as { name?: string; message?: string; cause?: { code?: string; message?: string } };
  const code = err?.cause?.code ?? "";
  const msg = `${err?.message ?? ""} ${err?.cause?.message ?? ""} ${code}`;
  if (err?.name === "AbortError" || err?.name === "TimeoutError" || /timeout|timed out|UND_ERR_.*TIMEOUT/i.test(msg))
    return new FetchError("timeout", "The server did not respond in time.");
  if (/CERT|SSL|TLS|certificate|self[- ]signed|handshake/i.test(msg))
    return new FetchError("tls_error", "The TLS certificate or handshake failed.");
  if (/ENOTFOUND|EAI_AGAIN|getaddrinfo|DNS/i.test(msg)) return new FetchError("dns_failure", "DNS lookup failed.");
  return new FetchError("connection_error", "The connection failed or was reset.");
}

async function readCapped(res: Response, maxBytes: number, stopAtHeadEnd: boolean) {
  const reader = res.body?.getReader();
  if (!reader) return { text: "", bytes: 0, truncated: false, stopped: false };
  const dec = new TextDecoder("utf-8", { fatal: false });
  let text = "";
  let bytes = 0;
  let truncated = false;
  let stopped = false;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const remaining = maxBytes - bytes;
    const chunk = value.byteLength > remaining ? value.subarray(0, remaining) : value;
    bytes += chunk.byteLength;
    const before = text.length;
    text += dec.decode(chunk, { stream: true });
    if (value.byteLength > remaining) {
      truncated = true;
      break;
    }
    if (stopAtHeadEnd) {
      const scanFrom = Math.max(0, before - 8);
      const idx = text.slice(scanFrom).search(/<\/head\s*>/i);
      if (idx >= 0) {
        stopped = true;
        break;
      }
    }
    if (bytes >= maxBytes) {
      truncated = true;
      break;
    }
  }
  text += dec.decode();
  try {
    await reader.cancel();
  } catch {
    /* ignore */
  }
  return { text, bytes, truncated, stopped };
}

/**
 * Fetches a URL following redirects manually. Every hop is re-validated (scheme, port,
 * hostname, DNS → public IPs). Never sends cookies or credentials.
 */
export async function fetchChain(
  start: URL,
  ctx: CheckContext,
  opts: { maxRedirects: number; maxBytes: number; stopAtHeadEnd: boolean; accept: string; acceptLanguage?: string },
): Promise<ChainResult> {
  const hops: Hop[] = [];
  const seen = new Set<string>();
  let current = start;
  for (let i = 0; i <= opts.maxRedirects; i++) {
    const href = current.href;
    if (seen.has(href)) return { hops, error: { code: "redirect_loop", message: "The redirect chain loops back to a URL it already visited.", atUrl: href } };
    seen.add(href);
    try {
      await assertPublicHost(current.hostname.replace(/\.$/, ""), (h) => {
        ctx.take(2); // A + AAAA lookups
        return ctx.deps.resolve(h);
      }, ctx.dnsCache);
    } catch (e) {
      if (e instanceof SafetyError) {
        const unsafe = e.code === "private_address";
        return {
          hops,
          error: {
            code: unsafe ? (i === 0 ? "private_address" : "unsafe_redirect") : e.code,
            message: unsafe && i > 0 ? `A redirect pointed to ${current.hostname}, which resolves to a non-public address. It was not followed.` : e.message,
            atUrl: href,
          },
        };
      }
      const fe = classifyFetchError(e);
      return { hops, error: { code: fe.code, message: fe.message, atUrl: href } };
    }
    const ms = Math.min(ctx.deps.timeoutMs ?? LIMITS.perRequestTimeoutMs, ctx.remainingMs());
    if (ms <= 0) return { hops, error: { code: "timeout", message: "The overall time budget for this check ran out.", atUrl: href } };
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), ms);
    try {
      ctx.take();
      const res = await ctx.deps.fetch(href, {
        method: "GET",
        redirect: "manual",
        signal: ac.signal,
        headers: { "user-agent": ctx.deps.userAgent, accept: opts.accept, "accept-language": opts.acceptLanguage ?? "en" },
      });
      if (REDIRECT.has(res.status)) {
        const loc = res.headers.get("location");
        try {
          await res.body?.cancel();
        } catch {
          /* ignore */
        }
        hops.push({ url: href, status: res.status, location: loc });
        if (!loc) return { hops, error: { code: "redirect_missing_location", message: `HTTP ${res.status} without a Location header.`, atUrl: href } };
        let next: URL;
        try {
          next = validateUrl(new URL(loc, href).href, ctx.deps.selfHosts);
        } catch (e) {
          const msg = e instanceof SafetyError ? e.message : "Invalid redirect target.";
          return { hops, error: { code: "unsafe_redirect", message: `Redirect to ${loc} was not followed: ${msg}`, atUrl: href } };
        }
        current = next;
        continue;
      }
      const body = await readCapped(res, opts.maxBytes, opts.stopAtHeadEnd);
      return {
        hops,
        final: {
          url: href,
          status: res.status,
          headers: res.headers,
          body: body.text,
          bytesRead: body.bytes,
          truncated: body.truncated,
          stoppedAtHeadEnd: body.stopped,
        },
      };
    } catch (e) {
      const fe = classifyFetchError(e);
      return { hops, error: { code: fe.code, message: fe.message, atUrl: href } };
    } finally {
      clearTimeout(timer);
    }
  }
  return { hops, error: { code: "too_many_redirects", message: `More than ${opts.maxRedirects} redirects.`, atUrl: current.href } };
}
