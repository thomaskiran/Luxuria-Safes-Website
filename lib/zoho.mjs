/**
 * Luxuria Safes — minimal Zoho CRM client for server functions.
 * Same credentials as /api/enquiry (ZOHO_CLIENT_ID / _SECRET / _REFRESH_TOKEN,
 * ZOHO_ACCOUNTS_HOST, ZOHO_API_HOST).
 */

let tokenCache = { value: null, expiresAt: 0 };

export async function getAccessToken() {
  if (tokenCache.value && Date.now() < tokenCache.expiresAt) return tokenCache.value;

  const host = process.env.ZOHO_ACCOUNTS_HOST || 'accounts.zoho.com';
  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });

  const res = await fetch(`https://${host}/oauth/v2/token?${params}`, { method: 'POST' });
  const body = await res.json();
  if (!body.access_token) throw new Error(`Zoho token refresh failed: ${body.error || res.status}`);

  tokenCache = {
    value: body.access_token,
    expiresAt: Date.now() + ((body.expires_in || 3600) - 60) * 1000,
  };
  return tokenCache.value;
}

export async function zohoFetch(path, options = {}) {
  const token = await getAccessToken();
  const host = process.env.ZOHO_API_HOST || 'www.zohoapis.com';
  return fetch(`https://${host}${path}`, {
    ...options,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
}

/** Returns the record, or null if it does not exist / cannot be read. */
export async function getRecord(module, id) {
  const res = await zohoFetch(`/crm/v8/${module}/${id}`);
  if (res.status === 204 || !res.ok) {
    if (res.status !== 204) console.error(`Zoho read ${module}/${id} failed`, res.status, await res.text());
    return null;
  }
  const body = await res.json();
  return (body.data && body.data[0]) || null;
}

/** Update fields without firing workflows (so writing the log can't loop). */
export async function updateRecord(module, id, fields) {
  const res = await zohoFetch(`/crm/v8/${module}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ data: [fields], trigger: [] }),
  });
  if (!res.ok) console.error(`Zoho update ${module}/${id} failed`, res.status, await res.text());
  return res.ok;
}
