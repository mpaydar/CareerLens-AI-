import { NextResponse } from "next/server";
import {
  appendHighlightChunk,
  clearHighlightState,
  GLOBAL_HIGHLIGHT_SCOPE,
} from "@/lib/highlight-store";
import { getHighlightForSession, getHighlightScopeId } from "@/lib/highlight-scope";
import { getAuthenticatedUser } from "@/lib/auth";
import { clearGapAnalysis } from "@/lib/gap-store";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET() {
  const state = await getHighlightForSession();
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

    const scopeId = await getHighlightScopeId();
    const state = await appendHighlightChunk(text, sourceUrl, scopeId);

    if (scopeId !== GLOBAL_HIGHLIGHT_SCOPE) {
      await appendHighlightChunk(text, sourceUrl, GLOBAL_HIGHLIGHT_SCOPE);
    }

    return NextResponse.json(state, { headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "invalid request body" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}

export async function DELETE() {
  const scopeId = await getHighlightScopeId();
  const state = await clearHighlightState(scopeId);
  const user = await getAuthenticatedUser();
  if (user) {
    await clearGapAnalysis(user.id);
  }
  return NextResponse.json(state, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
