/**
 * app/api/history/route.ts
 * GET /api/history
 */

import { NextResponse } from "next/server";
import { getHistory, getStats } from "@/lib/storage";
import { HistoryAPIResponse } from "@/types";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: getHistory(),
      stats: getStats(),
    } satisfies HistoryAPIResponse);
  } catch (err) {
    console.error("[/api/history]", err);
    return NextResponse.json(
      {
        success: false,
        data: [],
        stats: { totalPayouts: 0, totalAmount: 0, successCount: 0 },
        error: "Failed to load history",
      } satisfies HistoryAPIResponse,
      { status: 500 }
    );
  }
}
