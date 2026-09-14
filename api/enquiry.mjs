/**
 * Luxuria Safes — website enquiry endpoint
 * POST /api/enquiry
 *
 * Receives the contact form, validates it, and creates or updates an Enquiry
 * in Zoho CRM. Zoho credentials live in Vercel environment variables and are
 * never exposed to the browser.
 *
 * Required environment variables:
 *   ZOHO_CLIENT_ID
 *   ZOHO_CLIENT_SECRET
 *   ZOHO_REFRESH_TOKEN
 *   ZOHO_ACCOUNTS_HOST   e.g. accounts.zoho.com
 *   ZOHO_API_HOST        e.g. www.zohoapis.com
 */

const LEADS_LAYOUT_ID = '7470322000000769013'; // Customized Luxuria safe Lead form

// Access tokens last an hour. Cache in module scope so warm invocations reuse it.
let tokenCache = { value: null, expiresAt: 0 };

async function getAccessToken() {
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
  if (!body.access_token) {
    throw new Error(`Zoho token refresh failed: ${body.error || res.status}`);
  }

  tokenCache = {
    value: body.access_token,
    // Refresh a minute early rather than racing the expiry.
    expiresAt: Date.now() + ((body.expires_in || 3600) - 60) * 1000,
  };
  return tokenCache.value;
}

function zohoFetch(path, token, options = {}) {
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

/* ---------------------------------------------------------------- helpers */

const clean = (v, max = 255) =>
  typeof v === 'string'
    ? v.replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, max)
    : '';

const looksLikeEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

// Keep digits, spaces and the usual separators; drop anything else.
const cleanPhone = (v) => clean(v, 30).replace(/[^\d+()\-\s]/g, '');

function splitName(full) {
  const parts = clean(full, 120).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: '', last: parts[0] };
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

/** Zoho search criteria need parentheses escaped in the value. */
const criteriaValue = (v) => v.replace(/[()]/g, '');

async function findExistingLead(token, { email, phone, whatsapp }) {
  const attempts = [];
  if (email) attempts.push(`(Email:equals:${criteriaValue(email)})`);
  if (phone) attempts.push(`(Phone:equals:${criteriaValue(phone)})`);
  if (whatsapp) attempts.push(`(WhatsApp_Number:equals:${criteriaValue(whatsapp)})`);

  for (const criteria of attempts) {
    const res = await zohoFetch(
      `/crm/v8/Leads/search?criteria=${encodeURIComponent(criteria)}`,
      token
    );
    if (res.status === 204) continue; // no match
    if (!res.ok) continue;            // don't let a search failure block creation
    const body = await res.json();
    if (body.data && body.data.length) return body.data[0];
  }
  return null;
}

/* ------------------------------------------------------------------ route */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      ok: false,
      error: 'method_not_allowed',
      message: 'This endpoint only accepts form submissions.',
    });
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch { payload = {}; }
  }
  payload = payload || {};

  // Honeypot. Real people never fill this in; it is hidden from view and from
  // screen readers. Return success so a bot learns nothing.
  if (clean(payload.company_website)) {
    return res.status(200).json({ ok: true });
  }

  // Anything submitted within 2s of the form rendering is automated.
  const renderedAt = Number(payload.rendered_at);
  if (Number.isFinite(renderedAt) && Date.now() - renderedAt < 2000) {
    return res.status(200).json({ ok: true });
  }

  const { first, last } = splitName(payload.name);
  const email = clean(payload.email, 100).toLowerCase();
  const phone = cleanPhone(payload.phone);
  const whatsapp = cleanPhone(payload.whatsapp);
  const message = clean(payload.message, 4000);
  const company = clean(payload.company, 100);
  const productId = /^\d{6,}$/.test(String(payload.product_id || '')) ? String(payload.product_id) : '';
  const productName = clean(payload.product_name, 120);

  const errors = [];
  if (!last) errors.push('name');
  if (email && !looksLikeEmail(email)) errors.push('email');
  if (!email && !phone && !whatsapp) errors.push('contact_method');
  if (!message) errors.push('message');

  if (errors.length) {
    return res.status(400).json({
      ok: false,
      error: 'validation_failed',
      fields: errors,
      message:
        errors.includes('contact_method')
          ? 'Please give us at least one way to reach you — email, phone or WhatsApp.'
          : 'Please check the highlighted fields.',
    });
  }

  const record = {
    Last_Name: last,
    First_Name: first || undefined,
    Email: email || undefined,
    Phone: phone || undefined,
    WhatsApp_Number: whatsapp || undefined,
    Company: company || undefined,
    Description: message,
    Lead_Source: 'Website',
    Lead_Channel: 'Website Form',
    Lead_Status: 'New',
    Layout: { id: LEADS_LAYOUT_ID },

    UTM_Source: clean(payload.utm_source) || undefined,
    UTM_Medium: clean(payload.utm_medium) || undefined,
    UTM_Campaign: clean(payload.utm_campaign) || undefined,
    UTM_Term: clean(payload.utm_term) || undefined,
    UTM_Content: clean(payload.utm_content) || undefined,
    Google_Click_ID: clean(payload.gclid) || undefined,
    FBCLID: clean(payload.fbclid) || undefined,
    Campaign_ID: clean(payload.campaign_id, 100) || undefined,
    Ad_Set_ID: clean(payload.adset_id, 100) || undefined,
    Ad_ID: clean(payload.ad_id, 100) || undefined,
    Landing_Page_URL: clean(payload.landing_page, 450) || undefined,
    Form_Submission_ID: clean(payload.submission_id, 100) || undefined,
  };

  if (productId) record.Product_Interested_In = { id: productId };

  Object.keys(record).forEach((k) => record[k] === undefined && delete record[k]);

  try {
    const token = await getAccessToken();
    const existing = await findExistingLead(token, { email, phone, whatsapp });

    if (existing) {
      // Someone who already exists has enquired again. Don't create a second
      // record — attach the enquiry as a note so the history stays in one place.
      const noteLines = [
        `New website enquiry — ${new Date().toISOString()}`,
        productName ? `Product interest: ${productName}` : null,
        record.Landing_Page_URL ? `Landing page: ${record.Landing_Page_URL}` : null,
        record.UTM_Campaign ? `Campaign: ${record.UTM_Campaign}` : null,
        '',
        message,
      ].filter(Boolean);

      await zohoFetch('/crm/v8/Notes', token, {
        method: 'POST',
        body: JSON.stringify({
          data: [{
            Note_Title: 'Website enquiry',
            Note_Content: noteLines.join('\n').slice(0, 32000),
            Parent_Id: { id: existing.id },
            se_module: 'Leads',
          }],
        }),
      });

      return res.status(200).json({ ok: true, duplicate: true });
    }

    // Round-robin the enquiry between the Sales Team users.
    //
    // Zoho does NOT apply assignment rules automatically to records created
    // through the API - only to its own web forms and imports. The rule has to
    // be named explicitly with `lar_id`. (`apply_feature_execution` does not do
    // this; using it took the form down on 14 Sep 2026.)
    //
    // Rule: 'Website enquiry round robin', Chris and Kevin.
    const ASSIGNMENT_RULE_ID = '7470322000002353017';

    const createLead = async (withAssignment) => {
      const payload = { data: [record], trigger: ['workflow'] };
      if (withAssignment) payload.lar_id = ASSIGNMENT_RULE_ID;
      const res = await zohoFetch('/crm/v8/Leads', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      return { res, json, row: json && json.data && json.data[0] };
    };

    let attempt = await createLead(true);

    // Never lose an enquiry because of the assignment parameter. If Zoho
    // rejects it for any reason, create the lead without it and let someone
    // assign the owner by hand.
    const duplicate = attempt.row && attempt.row.code === 'DUPLICATE_DATA';
    if (!attempt.res.ok && !duplicate) {
      console.error(
        'Zoho rejected the assignment rule - retrying without it',
        JSON.stringify(attempt.json)
      );
      attempt = await createLead(false);
    }

    const createRes = attempt.res;
    const created = attempt.json;
    const row = attempt.row;

    // The unique Form_Submission_ID means a double-click or a retry lands here.
    // That is the guard working, not a failure — tell the browser it succeeded.
    if (row && row.code === 'DUPLICATE_DATA') {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    if (!createRes.ok || !row || row.code !== 'SUCCESS') {
      console.error('Zoho lead creation failed', JSON.stringify(created));
      return res.status(502).json({
        ok: false,
        error: 'crm_error',
        message: 'We could not record your enquiry just now. Please email info@luxuriasafes.com.',
      });
    }

    return res.status(200).json({ ok: true, id: row.details && row.details.id });
  } catch (err) {
    console.error('Enquiry handler error', err);
    return res.status(502).json({
      ok: false,
      error: 'upstream_error',
      message: 'We could not record your enquiry just now. Please email info@luxuriasafes.com.',
    });
  }
}
