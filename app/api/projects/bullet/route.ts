import { NextResponse } from "next/server";
import { resolveProjectRequest } from "@/lib/project-request";
import {
  generateBulletFromGithubProject,
  type SkillProjectSuggestion,
} from "@/lib/skill-projects";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      skill?: string;
      skills?: string[];
      neededFor?: string;
      contextSummary?: string;
      clusterLabel?: string;
      clusterKind?: "technical" | "domain" | "soft";
      githubUrl?: string;
      project?: SkillProjectSuggestion;
    };

    const githubUrl =
      typeof body.githubUrl === "string" ? body.githubUrl.trim() : "";
    if (!githubUrl) {
      return NextResponse.json(
        { error: "githubUrl is required" },
        { status: 400 },
      );
    }

    if (!body.project?.title || !body.project?.instructionGuide) {
      return NextResponse.json(
        { error: "project selection is required" },
        { status: 400 },
      );
    }

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

    const result = await generateBulletFromGithubProject(
      resumePath,
      jobDescription,
      { skills, clusterLabel, clusterKind, neededFor },
      body.project,
      githubUrl,
    );

    return NextResponse.json(result);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "failed to generate resume bullet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
