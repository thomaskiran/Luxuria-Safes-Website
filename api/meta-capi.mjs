/**
 * Luxuria Safes — Zoho CRM → Meta Conversions API
 * POST /api/meta-capi
 *
 * Called by Zoho CRM workflow webhooks when an enquiry or deal reaches a
 * stage Meta should learn from. Reads the record from Zoho (so the webhook
 * carries no personal data), hashes the identifiers, sends one event to
 * Meta, and records the event on the CRM record so it is only ever sent once.
 *
 * Webhook request (from Zoho):
 *   header  x-webhook-secret: <CRM_WEBHOOK_SECRET>   (or ?key=<secret>)
 *   body    module=Leads|Deals, record_id=<id>, event=QualifiedLead|QuoteSent|Purchase
 *           (JSON or form-encoded — both accepted)
 *
 * Environment variables: see lib/meta-capi.mjs and lib/zoho.mjs, plus
 *   CRM_WEBHOOK_SECRET   long random string shared with the Zoho webhook.
 */
import { timingSafeEqual } from 'node:crypto';
import { buildUserData, fbcFromClickId, metaEnabled, sendMetaEvent } from '../lib/meta-capi.mjs';
import { getRecord, updateRecord } from '../lib/zoho.mjs';

// Which event may come from which module.
const EVENTS = {
  QualifiedLead: ['Leads'],
  QuoteSent: ['Leads', 'Deals'],
  Purchase: ['Deals'],
};

function secretOk(req) {
  const expected = process.env.CRM_WEBHOOK_SECRET || '';
  const given = String(req.headers['x-webhook-secret'] || (req.query && req.query.key) || '');
  if (!expected || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

const sentList = (v) => String(v || '').split(/[;,]\s*/).map((s) => s.split(' ')[0]).filter(Boolean);

async function collect(module, record) {
  if (module === 'Leads') {
    const created = Date.parse(record.Created_Time);
    return {
      user: {
        email: record.Email,
        phones: [record.Mobile, record.Phone, record.WhatsApp_Number],
        firstName: record.First_Name,
        lastName: record.Last_Name,
        externalId: record.id,
        leadId: record.leadchain0__Social_Lead_ID,
        fbc: fbcFromClickId(record.FBCLID, created),
        fbp: record.FBP,
      },
      custom: {},
    };
  }

  // Deals: identity lives on the linked Contact.
  const contactId = record.Contact_Name && record.Contact_Name.id;
  const contact = contactId ? await getRecord('Contacts', contactId) : null;
  const custom = {};
  if (Number(record.Amount) > 0) {
    custom.value = Number(record.Amount);
    custom.currency = record.Currency || 'KWD';
  }
  return {
    user: {
      email: contact && contact.Email,
      phones: contact ? [contact.Mobile, contact.Phone] : [],
      firstName: contact && contact.First_Name,
      lastName: contact && contact.Last_Name,
      leadId: record.leadchain0__Social_Lead_ID,
    },
    custom,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }
  if (!secretOk(req)) return res.status(401).json({ ok: false, error: 'unauthorised' });

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = Object.fromEntries(new URLSearchParams(body)); }
  }
  const module = String(body.module || '');
  const recordId = String(body.record_id || '');
  const eventName = String(body.event || '');

  if (!EVENTS[eventName] || !EVENTS[eventName].includes(module) || !/^\d{6,}$/.test(recordId)) {
    return res.status(400).json({ ok: false, error: 'bad_request' });
  }
  if (!metaEnabled()) return res.status(200).json({ ok: true, skipped: 'meta_not_configured' });

  try {
    const record = await getRecord(module, recordId);
    if (!record) return res.status(200).json({ ok: true, skipped: 'record_not_found' });

    // Once per record per event, whatever the workflow does.
    if (sentList(record.Meta_Events_Sent).includes(eventName)) {
      return res.status(200).json({ ok: true, skipped: 'already_sent' });
    }

    const { user, custom } = await collect(module, record);
    const userData = buildUserData(user);
    if (!userData.em && !userData.ph && !userData.lead_id && !userData.fbc && !userData.fbp) {
      return res.status(200).json({ ok: true, skipped: 'no_identifiers' });
    }

    const result = await sendMetaEvent({
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: `${module}-${recordId}-${eventName}`,
      action_source: 'system_generated',
      user_data: userData,
      custom_data: { ...custom, event_source: 'crm', lead_event_source: 'Zoho CRM' },
    });

    if (!result.ok) return res.status(200).json({ ok: false, error: 'meta_rejected', status: result.status });

    const stamp = `${eventName} ${new Date().toISOString().slice(0, 10)}`;
    const log = [record.Meta_Events_Sent, stamp].filter(Boolean).join('; ').slice(0, 255);
    await updateRecord(module, recordId, { Meta_Events_Sent: log });

    return res.status(200).json({ ok: true, sent: eventName });
  } catch (err) {
    console.error('meta-capi handler error', err.message);
    return res.status(200).json({ ok: false, error: 'internal' });
  }
}
