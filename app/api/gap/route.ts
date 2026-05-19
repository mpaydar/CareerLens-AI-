import { NextResponse } from "next/server";
import { getHighlightState } from "@/lib/highlight-store";
import {
  clearGapAnalysis,
  getStoredGapAnalysis,
  saveGapAnalysis,
} from "@/lib/gap-store";
import { runGapAnalysis } from "@/lib/skills-analyzer";
import {
  getResumeFilePath,
  getResumeMeta,
} from "@/lib/resume-upload";

export async function GET() {
  const analysis = await getStoredGapAnalysis();
  const resumeMeta = await getResumeMeta();
  const highlight = await getHighlightState();

  return NextResponse.json({
    analysis,
    ready: Boolean(resumeMeta && highlight.text.trim().length >= 20),
    resumeMeta,
    highlightPreview: highlight.text.slice(0, 200),
  });
}

export async function POST(request: Request) {
  const resumeMeta = await getResumeMeta();
  const highlight = await getHighlightState();

  if (!resumeMeta) {
    return NextResponse.json(
      { error: "upload a resume first" },
      { status: 400 },
    );
  }

  let jobDescription = highlight.text.trim();
  try {
    const body = (await request.json()) as { jobDescription?: string };
    if (body.jobDescription?.trim()) {
      jobDescription = body.jobDescription.trim();
    }
  } catch {
    // use stored highlight when body is empty
  }
  if (jobDescription.length < 20) {
    return NextResponse.json(
      { error: "highlight a job description (at least 20 characters)" },
      { status: 400 },
    );
  }

  try {
    const analysis = await runGapAnalysis(
      getResumeFilePath(resumeMeta),
      jobDescription,
    );

    const stored = await saveGapAnalysis(analysis, {
      jobDescriptionPreview: jobDescription.slice(0, 280),
      resumeFileName: resumeMeta.originalFileName,
    });

    return NextResponse.json({ analysis: stored });
  } catch (e) {
    const message = e instanceof Error ? e.message : "analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  await clearGapAnalysis();
  return NextResponse.json({ ok: true });
}
