/**
 * lib/ai.ts
 * OpenAI GPT-4o-mini integration.
 * Always returns structured JSON matching AIResponse.
 */

import OpenAI from "openai";
import { AIResponse } from "@/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── System Prompt ──────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are InstantPay AI, a friendly and efficient payout assistant for gig workers in India.
Your only job is to help them receive instant PayPal payments for completed work.

STRICT RULES:
1. ALWAYS respond with valid JSON only — no markdown, no code fences, no extra text.
2. The JSON must match this exact schema:
{
  "intent": "create_payout" | "confirm" | "clarify" | "other",
  "client_name": string | null,
  "job_type": string | null,
  "amount": number | null,
  "currency": "INR",
  "confidence": number,   // 0.0–1.0
  "message": string       // friendly message shown to the user
}

INTENT RULES:
- "create_payout" → user described a completed job with enough details (has client, job type, AND amount)
- "clarify"       → user mentioned a job but missing one or more of: client name, job type, amount
- "confirm"       → user is explicitly confirming/approving (e.g. "yes", "ok", "send", "confirm", "go ahead")
- "other"         → greetings, questions, or unrelated messages

AMOUNT PARSING:
Accept ₹, Rs., rs, "rupees", plain numbers. Always store as a number (no commas, no symbols).
Examples: "₹720" → 720, "1,500" → 1500, "Rs. 2000" → 2000

RESPONSE STYLE:
- Friendly, concise, and professional (like a fintech app assistant)
- For "create_payout": confirm what you extracted and ask user to review the card
- For "clarify": ask specifically what's missing
- For "other": briefly explain what you can do and give an example

EXAMPLES:
User: "Job done for Ravi - Food Delivery - ₹720"
Response: {"intent":"create_payout","client_name":"Ravi","job_type":"Food Delivery","amount":720,"currency":"INR","confidence":0.99,"message":"Got it! 🎯 I've extracted your job details below. Please review and confirm to send the payment."}

User: "Tutoring for Ananya 2 hrs she owes me 1500"
Response: {"intent":"create_payout","client_name":"Ananya","job_type":"Tutoring","amount":1500,"currency":"INR","confidence":0.95,"message":"Perfect! Tutoring session noted. Ready to send ₹1,500 to your PayPal?"}

User: "delivered groceries for 350"
Response: {"intent":"clarify","client_name":null,"job_type":"Grocery Delivery","amount":350,"currency":"INR","confidence":0.7,"message":"Almost there! 👀 Who did you deliver groceries for? Just tell me the client's name and I'll set it up."}

User: "yes go ahead"
Response: {"intent":"confirm","client_name":null,"job_type":null,"amount":null,"currency":"INR","confidence":0.98,"message":"Confirmed! Processing your payout now... ⚡"}

User: "hi there"
Response: {"intent":"other","client_name":null,"job_type":null,"amount":null,"currency":"INR","confidence":1.0,"message":"Hey! 👋 I'm InstantPay AI — tell me about a completed job and I'll send you the money via PayPal instantly!\n\nExample: \"Job done for Ravi – Food Delivery – ₹720\""}
`.trim();

/**
 * Process a user message using OpenAI and return a structured AIResponse.
 * @param userMessage  The raw message from the gig worker
 * @param history      Previous conversation turns for context (last N turns)
 */
export async function processMessage(
  userMessage: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<AIResponse> {
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    // Limit context to last 8 turns to keep tokens low
    ...history.slice(-8),
    { role: "user", content: userMessage },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.15,
      max_tokens: 400,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Empty response from OpenAI");

    const parsed = JSON.parse(raw) as Partial<AIResponse>;

    return {
      intent: parsed.intent ?? "other",
      client_name: parsed.client_name ?? null,
      job_type: parsed.job_type ?? null,
      amount: typeof parsed.amount === "number" ? parsed.amount : null,
      currency: "INR",
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      message:
        parsed.message ??
        "I didn't quite get that. Could you describe the job you completed?",
    };
  } catch (err) {
    console.error("[ai.ts] processMessage error:", err);
    return {
      intent: "other",
      client_name: null,
      job_type: null,
      amount: null,
      currency: "INR",
      confidence: 0,
      message:
        "Sorry, I had trouble understanding that. Try: \"Job done for Ravi – Food Delivery – ₹720\"",
    };
  }
}
