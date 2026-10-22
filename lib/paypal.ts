/**
 * lib/paypal.ts
 * PayPal Payouts REST API – Sandbox mode
 * Handles OAuth2 client-credentials flow + payout creation.
 */

const BASE = "https://api-m.sandbox.paypal.com";

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;

/** Sandbox receiver email — replace with real gig worker email in production */
export const SANDBOX_RECEIVER =
  process.env.PAYPAL_SANDBOX_RECEIVER_EMAIL ??
  "sb-gig47worker@business.example.com";

// ── Token cache ────────────────────────────────────────────────────────────────
let _cachedToken: { value: string; expiresAt: number } | null = null;

/** Fetch (and cache) a PayPal OAuth2 access token */
export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (_cachedToken && _cachedToken.expiresAt > now) return _cachedToken.value;

  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${creds}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`PayPal auth failed (${res.status}): ${txt}`);
  }

  const data = await res.json();
  _cachedToken = {
    value: data.access_token,
    // 60 s safety buffer before actual expiry
    expiresAt: now + (data.expires_in - 60) * 1000,
  };
  return _cachedToken.value;
}

// ── Payout ─────────────────────────────────────────────────────────────────────

export interface PayPalPayoutResult {
  payout_batch_id: string;
  status: string;
  receiver_email: string;
}

/**
 * Create a PayPal Payout item to the sandbox receiver.
 *
 * NOTE: PayPal Sandbox uses USD internally. For the hackathon demo we map
 * the INR amount 1:1 to USD. In production you would either:
 *  a) Use a real INR merchant account, OR
 *  b) Apply a live exchange rate before calling the API.
 */
export async function createPayout(
  amount: number,
  clientName: string,
  jobType: string,
  senderBatchId: string
): Promise<PayPalPayoutResult> {
  const token = await getAccessToken();

  const body = {
    sender_batch_header: {
      sender_batch_id: senderBatchId,
      email_subject: `InstantPay AI – Payment for ${jobType}`,
      email_message: `You've received ₹${amount.toFixed(2)} from client ${clientName} via InstantPay AI.`,
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: {
          value: amount.toFixed(2),
          currency: "USD", // Sandbox limitation — see note above
        },
        receiver: SANDBOX_RECEIVER,
        note: `${jobType} – client: ${clientName}`,
        sender_item_id: `item_${senderBatchId}`,
      },
    ],
  };

  const res = await fetch(`${BASE}/v1/payments/payouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[paypal.ts] Payout failed:", err);
    throw new Error(
      (err as { message?: string }).message ??
        `PayPal payout failed with status ${res.status}`
    );
  }

  const data = await res.json();
  return {
    payout_batch_id: data.batch_header?.payout_batch_id ?? senderBatchId,
    status: data.batch_header?.batch_status ?? "PENDING",
    receiver_email: SANDBOX_RECEIVER,
  };
}

/** Fetch status of an existing payout batch */
export async function getPayoutBatchStatus(batchId: string) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v1/payments/payouts/${batchId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
  return res.json();
}
