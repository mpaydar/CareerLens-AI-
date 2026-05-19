import { spawn } from "child_process";
import path from "path";
import type { GapAnalysis } from "@/lib/gap-analysis-types";
import { runGeminiGapAnalysis } from "@/lib/gap-analysis-gemini";
import { getPythonCommand, SKILLS_SERVICE_DIR } from "@/lib/python-env";
import { readResumeText } from "@/lib/resume-text";

export type {
  ContextMismatchDetail,
  GapAnalysis,
  MissingSkillInsight,
  SkillContextSnapshot,
} from "@/lib/gap-analysis-types";

const ANALYZE_SCRIPT = path.join(SKILLS_SERVICE_DIR, "analyze.py");

function useGeminiGapAnalysis(): boolean {
  return Boolean(process.env.VERCEL);
}

async function runPythonGapAnalysis(
  resumePath: string,
  jobDescription: string,
): Promise<GapAnalysis> {
  const payload = JSON.stringify({
    resumePath,
    jobDescription,
  });

  const pythonCmd = getPythonCommand();

  return new Promise((resolve, reject) => {
    const child = spawn(pythonCmd, [ANALYZE_SCRIPT], {
      cwd: SKILLS_SERVICE_DIR,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      reject(
        new Error(
          `Failed to start Python (${pythonCmd}). Run: npm run skills:setup — ${err.message}`,
        ),
      );
    });

    child.on("close", (code) => {
      const trimmed = stdout.trim();
      if (!trimmed) {
        reject(
          new Error(
            stderr.trim() ||
              `Skills analysis failed (exit ${code ?? "unknown"})`,
          ),
        );
        return;
      }

      try {
        const parsed = JSON.parse(trimmed) as GapAnalysis & { error?: string };
        if (parsed.error) {
          reject(new Error(parsed.error));
          return;
        }
        if (code !== 0) {
          reject(new Error(parsed.error || `Analysis exited with ${code}`));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error(stderr.trim() || "Invalid analysis output"));
      }
    });

    child.stdin.write(payload);
    child.stdin.end();
  });
}

export async function runGapAnalysis(
  resumePath: string,
  jobDescription: string,
): Promise<GapAnalysis> {
  if (useGeminiGapAnalysis()) {
    const resumeText = await readResumeText(resumePath);
    return runGeminiGapAnalysis(resumeText, jobDescription);
  }

  try {
    return await runPythonGapAnalysis(resumePath, jobDescription);
  } catch (pythonError) {
    try {
      const resumeText = await readResumeText(resumePath);
      return runGeminiGapAnalysis(resumeText, jobDescription);
    } catch {
      throw pythonError;
    }
  }
}
