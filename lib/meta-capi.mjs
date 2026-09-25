/**
 * Luxuria Safes — Meta Conversions API helper.
 *
 * Shared by /api/enquiry (website Lead event) and /api/meta-capi (events
 * triggered by Zoho CRM). Everything personal is SHA-256 hashed before it
 * leaves this server, as Meta requires.
 *
 * Environment variables:
 *   META_DATASET_ID        Events Manager dataset (pixel) ID. Not secret.
 *   META_CAPI_TOKEN        Conversions API access token. Secret.
 *   META_TEST_EVENT_CODE   Optional. While set, events show under
 *                          Events Manager → Test Events and are not used
 *                          for ad optimisation. Remove to go live.
 *   META_GRAPH_VERSION     Optional, default v23.0.
 *
 * If META_DATASET_ID or META_CAPI_TOKEN is missing, every call is a no-op, so
 * this code can ship before the Meta side is configured.
 */
import { createHash } from 'node:crypto';

export const metaEnabled = () =>
  Boolean(process.env.META_DATASET_ID && process.env.META_CAPI_TOKEN);

const sha256 = (v) => createHash('sha256').update(v).digest('hex');

const norm = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');

/** Meta wants digits only, with country code. Kuwait local numbers are 8 digits. */
export function normalisePhone(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 8) d = '965' + d;
  return d.length >= 8 ? d : '';
}

/** Names: lowercase, letters only (Arabic letters kept), no punctuation or spaces. */
const normName = (v) => norm(v).replace(/[^\p{L}]/gu, '');

/**
 * Build Meta `user_data` from plain values. Unknown/empty values are left out.
 * `fbc`, `fbp`, IP and user agent are NOT hashed — Meta's rule.
 */
export function buildUserData({
  email, phones = [], firstName, lastName, country = 'kw',
  externalId, leadId, fbc, fbp, ip, userAgent,
}) {
  const ud = {};
  const em = norm(email);
  if (em) ud.em = [sha256(em)];

  const ph = [...new Set(phones.map(normalisePhone).filter(Boolean))];
  if (ph.length) ud.ph = ph.map(sha256);

  const fn = normName(firstName);
  const ln = normName(lastName);
  if (fn) ud.fn = [sha256(fn)];
  if (ln) ud.ln = [sha256(ln)];
  if (country) ud.country = [sha256(norm(country))];
  if (externalId) ud.external_id = [sha256(String(externalId))];

  // Meta lead ID from an instant form. Sent raw, as an integer.
  if (leadId && /^\d{10,20}$/.test(String(leadId))) ud.lead_id = Number(leadId);

  if (fbc) ud.fbc = fbc;
  if (fbp) ud.fbp = fbp;
  if (ip) ud.client_ip_address = ip;
  if (userAgent) ud.client_user_agent = userAgent;
  return ud;
}

/** Rebuild the `fbc` value from a stored fbclid and the time it was captured. */
export function fbcFromClickId(fbclid, capturedAtMs) {
  if (!fbclid) return '';
  const ts = Number.isFinite(capturedAtMs) ? capturedAtMs : Date.now();
  return `fb.1.${ts}.${fbclid}`;
}

/**
 * Send one event. Never throws: returns { ok, skipped?, status?, body? }.
 * `timeoutMs` keeps a slow Meta response from holding up the caller.
 */
export async function sendMetaEvent(event, { timeoutMs = 4000 } = {}) {
  if (!metaEnabled()) return { ok: false, skipped: 'meta_not_configured' };

  const version = process.env.META_GRAPH_VERSION || 'v23.0';
  const url =
    `https://graph.facebook.com/${version}/${encodeURIComponent(process.env.META_DATASET_ID)}` +
    `/events?access_token=${encodeURIComponent(process.env.META_CAPI_TOKEN)}`;

  const body = { data: [event] };
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Log Meta's error, never the token.
      console.error('Meta CAPI rejected event', event.event_name, JSON.stringify(json.error || json));
    }
    return { ok: res.ok, status: res.status, body: json };
  } catch (err) {
    console.error('Meta CAPI request failed', event.event_name, err.name === 'AbortError' ? 'timeout' : err.message);
    return { ok: false, error: err.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}
