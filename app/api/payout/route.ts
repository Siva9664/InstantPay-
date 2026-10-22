/**
 * app/api/payout/route.ts
 * POST /api/payout
 */

import { NextRequest, NextResponse } from "next/server";
import { createPayout } from "@/lib/paypal";
import { addPayout } from "@/lib/storage";
import { Payout, PayoutAPIResponse } from "@/types";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { client_name, job_type, amount, currency } = await req.json();

    if (!client_name || !job_type || typeof amount !== "number") {
      return NextResponse.json(
        { success: false, error: "client_name, job_type and amount are required" },
        { status: 400 }
      );
    }

    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { success: false, error: "PayPal credentials not configured" },
        { status: 500 }
      );
    }

    const id = randomUUID();
    const senderBatchId = `ip_${Date.now()}_${id.slice(0, 8)}`;

    console.log(`[/api/payout] Creating payout for ${client_name} — ${job_type} — ₹${amount}`);

    const result = await createPayout(amount, client_name, job_type, senderBatchId);

    const payout: Payout = {
      id,
      client_name,
      job_type,
      amount,
      currency: currency ?? "INR",
      transaction_id: result.payout_batch_id,
      status: "SUCCESS",
      created_at: new Date().toISOString(),
      receiver_email: result.receiver_email,
    };

    addPayout(payout);
    console.log(`[/api/payout] ✅ Success — batch: ${result.payout_batch_id}`);

    return NextResponse.json({ success: true, payout } satisfies PayoutAPIResponse);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/payout]", msg);
    return NextResponse.json(
      { success: false, error: msg } satisfies PayoutAPIResponse,
      { status: 500 }
    );
  }
}
