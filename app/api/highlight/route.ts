import { NextResponse } from "next/server";
import {
  appendHighlightChunk,
  clearHighlightState,
  getHighlightState,
} from "@/lib/highlight-store";
import { clearGapAnalysis } from "@/lib/gap-store";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET() {
  const state = await getHighlightState();
  return NextResponse.json(state, {
    headers: CORS_HEADERS,
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      text?: string;
      sourceUrl?: string;
    };

    const text = (body.text ?? "").trim();
    const sourceUrl = (body.sourceUrl ?? "").trim();

    if (!text) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const state = await appendHighlightChunk(text, sourceUrl);
    return NextResponse.json(state, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "invalid request body" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}

export async function DELETE() {
  const state = await clearHighlightState();
  await clearGapAnalysis();
  return NextResponse.json(state, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
