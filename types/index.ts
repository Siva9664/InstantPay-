/**
 * types/index.ts
 * InstantPay AI – Core TypeScript interfaces
 */

// ── Chat ──────────────────────────────────────────────────────────────────────

/** A single chat message in the conversation */
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  /** Present on AI messages that triggered a payout confirmation */
  payoutData?: PendingPayout;
  /** Present on AI messages after a successful payout */
  completedPayoutId?: string;
}

// ── Payout ────────────────────────────────────────────────────────────────────

/** Extracted payout details awaiting user confirmation */
export interface PendingPayout {
  client_name: string;
  job_type: string;
  amount: number;
  currency: string;
}

/** Completed payout record stored in history.json */
export interface Payout {
  id: string;
  client_name: string;
  job_type: string;
  amount: number;
  currency: string;
  /** PayPal batch / transaction ID */
  transaction_id: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  created_at: string;
  receiver_email: string;
}

// ── AI ────────────────────────────────────────────────────────────────────────

/** Structured response always returned by lib/ai.ts */
export interface AIResponse {
  intent: "create_payout" | "confirm" | "clarify" | "other";
  client_name: string | null;
  job_type: string | null;
  amount: number | null;
  currency: "INR";
  confidence: number;
  /** Human-readable message displayed to the user */
  message: string;
}

// ── API response shapes ───────────────────────────────────────────────────────

export interface ChatAPIResponse {
  success: boolean;
  aiResponse: AIResponse;
  error?: string;
}

export interface PayoutAPIResponse {
  success: boolean;
  payout?: Payout;
  error?: string;
}

export interface HistoryAPIResponse {
  success: boolean;
  data: Payout[];
  stats: {
    totalPayouts: number;
    totalAmount: number;
    successCount: number;
  };
  error?: string;
}
