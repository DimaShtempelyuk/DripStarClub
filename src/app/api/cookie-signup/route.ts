// Stub signup endpoint for the cookie game's email gate. Validates + records for
// now; swap the marked section for a real ESP (Klaviyo/Mailchimp) or a Shopify
// customer-create with marketing consent later. (Plan §7.)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const data = (body ?? {}) as { email?: unknown; consent?: unknown };
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const consent = data.consent === true;

  if (!EMAIL_RE.test(email)) {
    return Response.json({ ok: false, error: 'invalid_email' }, { status: 422 });
  }

  // TODO(real): forward to the ESP / create a Shopify customer here.
  console.log('[cookie-signup]', { email, consent, at: new Date().toISOString() });

  return Response.json({ ok: true });
}
