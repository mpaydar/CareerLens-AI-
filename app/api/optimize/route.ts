import { NextResponse } from "next/server";
import { getHighlightState } from "@/lib/highlight-store";
import {
  optimizeResumeBullet,
  type OptimizeMode,
} from "@/lib/resume-optimizer";
import {
  getResumeFilePath,
  getResumeMeta,
} from "@/lib/resume-upload";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      skill?: string;
      mode?: OptimizeMode;
      neededFor?: string;
    };
    const skill = typeof body.skill === "string" ? body.skill.trim() : "";
    const mode =
      body.mode === "missing" || body.mode === "reframe" ? body.mode : undefined;
    const neededFor =
      typeof body.neededFor === "string" ? body.neededFor.trim() : undefined;

    if (!skill) {
      return NextResponse.json({ error: "skill is required" }, { status: 400 });
    }

    const resumeMeta = await getResumeMeta();
    if (!resumeMeta) {
      return NextResponse.json(
        { error: "upload a resume first" },
        { status: 400 },
      );
    }

    const highlight = await getHighlightState();
    const jobDescription = highlight.text.trim();
    if (jobDescription.length < 20) {
      return NextResponse.json(
        { error: "highlight a job description first" },
        { status: 400 },
      );
    }

    const result = await optimizeResumeBullet(
      getResumeFilePath(resumeMeta),
      jobDescription,
      skill,
      { mode, neededFor },
    );

    return NextResponse.json(result);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "failed to optimize resume bullet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
