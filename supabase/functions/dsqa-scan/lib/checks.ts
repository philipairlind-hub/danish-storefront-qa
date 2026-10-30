// Danish Storefront QA — machine checks (TypeScript port of prototype v0.4 + fixes).
// Fixes vs prototype: hidden inputs and hidden/aria-hidden subtrees are ignored;
// "Translation missing" keys report WHERE they were found (visible text, attribute, script).
import { Parser } from "htmlparser2";

export type Severity = "high" | "medium" | "low";
export type Location = "text" | "attribute" | "script" | "page";

export interface Finding {
  check: "T1" | "T2" | "T3" | "T4" | "F1" | "F2" | "F3" | "F4";
  severity: Severity;
  message: string;
  evidence: string;
  location: Location;
  /** attribute name when location === "attribute" */
  attribute?: string;
  /** true only for server-rendered text a shopper would normally see */
  visible: boolean;
}

export interface CheckResult {
  htmlLang: string | null;
  textNodes: number;
  findings: Finding[];
  summary: Record<string, number>;
  visibleFindings: number;
}

const EN_FUNC = new Set(`the and of to for with your you our is are this that be in on at from
 by or not all new more now free shop add cart view sold out size guide read
 reviews review checkout subscribe sign up login log in account search menu
 close continue shopping quantity price sale buy only left in stock shipping
 returns about contact help wishlist filter sort show less`.split(/\s+/).filter(Boolean));
const DA_FUNC = new Set(`og at det en et i på til for med er af som har ikke den de du vi
 din dit dine jeres vores kan skal vil fra eller men også alle mere nu gratis
 køb læg kurv indkøbskurv vis størrelse udsolgt lager levering fragt
 returnering kasse betaling nyhedsbrev tilmeld log ind konto søg luk
 fortsæt antal pris tilbud kun tilbage hjælp ønskeliste sorter vis færre`.split(/\s+/).filter(Boolean));
const SE_NO_ONLY = new Set(`och inte köp köpa varukorg lägg kassan storlek leverans frakt
 frakten ditt mitt våra vår här där bara nyheter
 handlekurv handlevogn legg kjøp`.split(/\s+/).filter(Boolean));
// Swedish UI words flagged even when capitalised (brand names with ä/ö are not)
const SE_UI = new Set(["sök", "köp", "köpvillkor", "varukorg", "kassa", "kassan", "logga",
  "kundtjänst", "leveransvillkor", "integritetspolicy", "nyhetsbrev", "prenumerera", "lägg",
  "handla", "fraktfritt", "storleksguide", "önskelista", "mina", "sidor", "tillbaka", "stäng"]);
const EN_UI = new Set(["add to cart", "add to bag", "sold out", "buy now", "shop now",
  "size guide", "free shipping", "checkout", "view cart", "your cart", "continue shopping",
  "quantity", "in stock", "out of stock", "subscribe", "sign up", "read more", "load more",
  "reviews", "write a review", "you may also like", "related products", "search", "close",
  "account", "login", "log in", "shipping", "returns", "newsletter", "filter", "sort by"]);

const SKIP_TAGS = new Set(["script", "style", "noscript", "svg", "template"]);
const ATTRS = ["aria-label", "placeholder", "title", "alt", "value"];
const ATTR_TAGS = new Set(["button", "input", "a", "img", "label"]);
const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
  "param", "source", "track", "wbr"]);
const MISSING_RE = /translation missing:?\s*[a-z_.\-]+/gi;

const words = (s: string) => s.toLowerCase().match(/[a-zæøåäöé]+/g) ?? [];
const clip = (s: string, n = 160) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

function isHiddenEl(name: string, a: Record<string, string>): boolean {
  if ("hidden" in a) return true;
  if ((a["aria-hidden"] ?? "").toLowerCase() === "true") return true;
  const style = (a.style ?? "").replace(/\s+/g, "").toLowerCase();
  if (style.includes("display:none") || style.includes("visibility:hidden")) return true;
  if (name === "input" && (a.type ?? "").toLowerCase() === "hidden") return true;
  return false;
}

interface Chunk { kind: "text" | "attribute"; attr?: string; value: string }

export function runChecks(html: string): CheckResult {
  const chunks: Chunk[] = [];
  const scriptHits: string[] = [];
  let htmlLang: string | null = null;
  const hreflang: string[] = [];
  // stack of [tag, hiddenOrSkipped]
  const stack: Array<[string, boolean]> = [];
  let suppressed = 0; // >0 while inside a skipped or hidden subtree
  let inScript = 0;

  const parser = new Parser({
    onopentag(name, attribs) {
      const a: Record<string, string> = {};
      for (const [k, v] of Object.entries(attribs)) a[k.toLowerCase()] = v ?? "";
      if (name === "html" && htmlLang === null) htmlLang = (a.lang ?? "").toLowerCase();
      if (name === "link" && (a.rel ?? "").toLowerCase() === "alternate" && a.hreflang) hreflang.push(a.hreflang.toLowerCase());
      const hidden = SKIP_TAGS.has(name) || isHiddenEl(name, a);
      if (name === "script") inScript++;
      if (suppressed === 0 && !hidden && ATTR_TAGS.has(name)) {
        for (const k of ATTRS) {
          const v = (a[k] ?? "").trim();
          if (!v) continue;
          if (k === "value" && !(name === "button" || (name === "input" && ["submit", "button", "reset"].includes((a.type ?? "").toLowerCase())))) continue;
          chunks.push({ kind: "attribute", attr: k, value: v });
        }
      }
      if (VOID.has(name)) return; // no close tag will follow
      stack.push([name, hidden]);
      if (hidden) suppressed++;
    },
    onclosetag(name) {
      if (VOID.has(name)) return;
      // pop to the matching tag (htmlparser2 emits implied closes in order)
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i][0] === name) {
          while (stack.length > i) {
            const [t, h] = stack.pop()!;
            if (h) suppressed--;
            if (t === "script") inScript = Math.max(0, inScript - 1);
          }
          break;
        }
      }
    },
    ontext(data) {
      if (inScript > 0) {
        for (const m of data.matchAll(MISSING_RE)) scriptHits.push(m[0]);
        return;
      }
      if (suppressed > 0) return;
      const t = data.replace(/\s+/g, " ").trim();
      if (t) chunks.push({ kind: "text", value: t });
    },
  }, { decodeEntities: true, lowerCaseTags: true, lowerCaseAttributeNames: true });
  parser.write(html);
  parser.end();

  const findings: Finding[] = [];
  const seen = new Set<string>();
  const add = (f: Finding) => {
    const key = `${f.check}|${f.location}|${f.evidence.slice(0, 80)}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push(f);
  };
  const loc = (c: Chunk) => (c.kind === "text" ? { location: "text" as const, visible: true } : { location: "attribute" as const, attribute: c.attr, visible: false });
  const label = (c: Chunk) => (c.kind === "text" ? c.value : `${c.attr}="${c.value}"`);

  if (!(htmlLang ?? "").startsWith("da"))
    add({ check: "F1", severity: "medium", message: "Page language attribute is not Danish", evidence: `<html lang="${htmlLang ?? ""}">`, location: "page", visible: false });
  if (hreflang.length && !hreflang.some((h) => h === "da" || h === "da-dk"))
    add({ check: "F4", severity: "low", message: "hreflang alternates exist but none for da / da-DK", evidence: hreflang.slice(0, 8).join(", "), location: "page", visible: false });
  for (const hit of scriptHits)
    add({ check: "T1", severity: "low", message: "Untranslated key inside a script (not necessarily shown)", evidence: hit, location: "script", visible: false });

  for (const c of chunks) {
    const t = c.value;
    const tl = t.toLowerCase().replace(/^[\s:.!›»]+|[\s:.!›»]+$/g, "");
    const lw = words(t);
    const L = loc(c);
    // T1 untranslated keys
    for (const m of t.matchAll(MISSING_RE))
      add({ check: "T1", severity: c.kind === "text" ? "high" : "medium", message: "Untranslated theme/app key", evidence: c.kind === "text" ? m[0] : `${c.attr}="${m[0]}"`, ...L });
    if (/translation missing/i.test(t)) continue;
    // T2 English UI strings
    if (t.length <= 40 && EN_UI.has(tl)) {
      add({ check: "T2", severity: c.kind === "text" ? "high" : "medium", message: "English UI text on a Danish page", evidence: label(c), ...L });
      continue;
    }
    // T3 English text blocks
    if (lw.length >= 6) {
      const en = lw.filter((w) => EN_FUNC.has(w)).length;
      const da = lw.filter((w) => DA_FUNC.has(w)).length;
      if (en >= 3 && en > 2 * Math.max(da, 1) - 1 && da <= 1)
        add({ check: "T3", severity: "medium", message: "Text block reads as English, not Danish", evidence: clip(label(c)), ...L });
    }
    // T4 Swedish / Norwegian leftovers
    const low = t.toLowerCase();
    if (/[äö]/.test(low) && !/[æø]/.test(low)) {
      const raw = t.match(/[A-Za-zÆØÅæøåÄÖäöÉé]+/g) ?? [];
      let se = raw.filter((w) => (/[äö]/.test(w) && w[0] === w[0].toLowerCase()) || SE_NO_ONLY.has(w.toLowerCase()) || SE_UI.has(w.toLowerCase()));
      if (c.kind === "attribute" && c.attr === "alt" && /\.(jpe?g|png|webp|gif|svg)$/i.test(t.trim())) {
        if (se.length || raw.some((w) => /[äö]/.test(w)))
          add({ check: "T4", severity: "medium", message: "Swedish file name used as image alt text", evidence: clip(label(c)), ...L });
        se = [];
      }
      if (se.length) add({ check: "T4", severity: c.kind === "text" ? "high" : "medium", message: "Swedish word on a Danish page", evidence: clip(label(c)), ...L });
    } else if (lw.filter((w) => SE_NO_ONLY.has(w)).length >= 2) {
      add({ check: "T4", severity: "medium", message: "Swedish/Norwegian words on a Danish page", evidence: clip(label(c)), ...L });
    }
    // F2 foreign currency
    if (/(\bSEK\b|\bNOK\b|\bEUR\b|€|\$|£)\s?\d|\d\s?(SEK|NOK|EUR|€)(?!\w)/.test(t))
      add({ check: "F2", severity: "low", message: "Non-DKK price shown (may be intentional)", evidence: clip(label(c)), ...L });
    // F3 decimal point in DKK price
    if (/(\bkr\.?|\bDKK)\s?\d{1,5}\.\d{2}\b|\b\d{1,5}\.\d{2}\s?(kr\b|DKK)/.test(t))
      add({ check: "F3", severity: "low", message: "Price uses a decimal point (Danish uses a comma)", evidence: clip(label(c)), ...L });
  }

  const summary: Record<string, number> = { T1: 0, T2: 0, T3: 0, T4: 0, F1: 0, F2: 0, F3: 0, F4: 0 };
  for (const f of findings) summary[f.check]++;
  const order: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  findings.sort((a, b) => Number(b.visible) - Number(a.visible) || order[a.severity] - order[b.severity]);
  return {
    htmlLang,
    textNodes: chunks.filter((c) => c.kind === "text").length,
    findings,
    summary,
    visibleFindings: findings.filter((f) => f.visible).length,
  };
}
