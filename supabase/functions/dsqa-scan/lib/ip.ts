// Copied from philipairlind-hub/seo-regression-guard@965a29a src/ip.ts (same owner). Unchanged.
// Strict IP classification. Only globally routable unicast addresses are "public".
// IPv6 uses an allowlist (2000::/3) minus special-purpose blocks, so new or exotic
// ranges fail closed.

export function parseIPv4(s: string): number[] | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
  if (!m) return null;
  const o = m.slice(1).map(Number);
  if (o.some((n) => n > 255)) return null;
  // Reject leading zeros ("010") to avoid octal ambiguity.
  if (m.slice(1).some((p) => p.length > 1 && p.startsWith("0"))) return null;
  return o;
}

export function isPublicIPv4(o: number[]): boolean {
  const [a, b, c] = o;
  if (a === 0) return false; // 0.0.0.0/8
  if (a === 10) return false; // private
  if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT 100.64/10
  if (a === 127) return false; // loopback
  if (a === 169 && b === 254) return false; // link-local, cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return false; // private
  if (a === 192 && b === 0 && c === 0) return false; // IETF protocol assignments
  if (a === 192 && b === 0 && c === 2) return false; // TEST-NET-1
  if (a === 192 && b === 88 && c === 99) return false; // 6to4 relay anycast
  if (a === 192 && b === 168) return false; // private
  if (a === 198 && (b === 18 || b === 19)) return false; // benchmarking
  if (a === 198 && b === 51 && c === 100) return false; // TEST-NET-2
  if (a === 203 && b === 0 && c === 113) return false; // TEST-NET-3
  if (a >= 224) return false; // multicast, reserved, broadcast
  return true;
}

export function parseIPv6(input: string): number[] | null {
  let s = input.trim().toLowerCase();
  if (s.startsWith("[") && s.endsWith("]")) s = s.slice(1, -1);
  if (s.includes("%")) return null; // zone ids never allowed
  if (!/^[0-9a-f:.]+$/.test(s)) return null;
  let v4tail: number[] | null = null;
  if (s.includes(".")) {
    const lastColon = s.lastIndexOf(":");
    const v4 = parseIPv4(s.slice(lastColon + 1));
    if (!v4) return null;
    v4tail = [(v4[0] << 8) | v4[1], (v4[2] << 8) | v4[3]];
    s = s.slice(0, lastColon + 1) + "0:0"; // two placeholder groups, replaced below
  }
  const parts = s.split("::");
  if (parts.length > 2) return null;
  const head = parts[0] ? parts[0].split(":") : [];
  const rest = parts.length === 2 && parts[1] ? parts[1].split(":") : [];
  const toNum = (g: string) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN);
  const h = head.map(toNum);
  const r = rest.map(toNum);
  if ([...h, ...r].some(Number.isNaN)) return null;
  const total = h.length + r.length;
  let groups: number[];
  if (parts.length === 1) {
    if (total !== 8) return null;
    groups = [...h, ...r];
  } else {
    if (total > 7) return null;
    groups = [...h, ...new Array(8 - total).fill(0), ...r];
  }
  if (v4tail) groups.splice(6, 2, ...v4tail);
  return groups;
}

export function isPublicIPv6(g: number[]): boolean {
  // Only 2000::/3 global unicast is eligible.
  if ((g[0] & 0xe000) !== 0x2000) return false;
  if (g[0] === 0x2001 && g[1] < 0x0200) return false; // 2001::/23 IETF special (incl. Teredo 2001::/32)
  if (g[0] === 0x2001 && g[1] === 0x0db8) return false; // documentation
  if (g[0] === 0x2002) return false; // 6to4 can tunnel to private v4
  if (g[0] === 0x3fff && g[1] < 0x1000) return false; // 3fff::/20 documentation
  return true;
}

export function isIpLiteral(host: string): boolean {
  return parseIPv4(host) !== null || host.startsWith("[") || parseIPv6(host) !== null;
}

/** True only for addresses a public web crawler should ever connect to. */
export function isPublicIp(ip: string): boolean {
  const v4 = parseIPv4(ip);
  if (v4) return isPublicIPv4(v4);
  const v6 = parseIPv6(ip);
  if (v6) return isPublicIPv6(v6);
  return false;
}
