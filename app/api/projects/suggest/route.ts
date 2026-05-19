import { NextResponse } from "next/server";
import { resolveProjectRequest } from "@/lib/project-request";
import { suggestProjectMeta } from "@/lib/skill-projects";

/** Returns 3 project outlines for a skill cluster; fetch guides via /api/projects/guide. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      skill?: string;
      skills?: string[];
      neededFor?: string;
      contextSummary?: string;
      clusterLabel?: string;
      clusterKind?: "technical" | "domain" | "soft";
    };

    const skills =
      Array.isArray(body.skills) && body.skills.length > 0
        ? body.skills
        : body.skill
          ? [body.skill]
          : [];

    const { resumePath, jobDescription, neededFor, clusterLabel, clusterKind } =
      await resolveProjectRequest(skills, body.contextSummary ?? body.neededFor, {
        clusterLabel: body.clusterLabel,
        clusterKind: body.clusterKind,
      });

    const result = await suggestProjectMeta(resumePath, jobDescription, {
      skills,
      clusterLabel,
      clusterKind,
      neededFor,
    });

    return NextResponse.json({
      skill: result.skill,
      skills,
      clusterLabel,
      projects: result.projects.map((p) => ({ ...p, instructionGuide: "" })),
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "failed to suggest projects";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
