/**
 * app/api/chat/route.ts
 * POST /api/chat
 */

import { NextRequest, NextResponse } from "next/server";
import { processMessage } from "@/lib/ai";
import { ChatAPIResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const aiResponse = await processMessage(message, history ?? []);

    return NextResponse.json({ success: true, aiResponse } satisfies ChatAPIResponse);
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal error",
        aiResponse: {
          intent: "other",
          client_name: null,
          job_type: null,
          amount: null,
          currency: "INR",
          confidence: 0,
          message: "Sorry, something went wrong. Please try again.",
        },
      } satisfies ChatAPIResponse,
      { status: 500 }
    );
  }
}
