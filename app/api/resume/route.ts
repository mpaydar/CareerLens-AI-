import { NextResponse } from "next/server";
import {
  deleteResume,
  getResumeMeta,
  saveResumeFromUpload,
} from "@/lib/resume-upload";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET() {
  const meta = await getResumeMeta();
  return NextResponse.json({ meta }, { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
      return NextResponse.json(
        { error: "expected file field" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const meta = await saveResumeFromUpload(file);
    return NextResponse.json({ meta }, { headers: CORS_HEADERS });
  } catch (e) {
    const message = e instanceof Error ? e.message : "upload failed";
    return NextResponse.json(
      { error: message },
      { status: 400, headers: CORS_HEADERS },
    );
  }
}

export async function DELETE() {
  await deleteResume();
  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
