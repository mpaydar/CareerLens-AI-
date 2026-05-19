import { readFile, writeFile, unlink } from "fs/promises";
import path from "path";
import type { GapAnalysis } from "@/lib/gap-analysis-types";
import type { StoredGapAnalysis } from "@/lib/gap-types";

export type { StoredGapAnalysis } from "@/lib/gap-types";

function getGapFilePath(userId: string): string {
  return path.join(process.cwd(), `.gap-analysis-${userId}.json`);
}

export async function getStoredGapAnalysis(
  userId: string,
): Promise<StoredGapAnalysis | null> {
  try {
    const raw = await readFile(getGapFilePath(userId), "utf8");
    return JSON.parse(raw) as StoredGapAnalysis;
  } catch {
    return null;
  }
}

export async function saveGapAnalysis(
  userId: string,
  analysis: GapAnalysis,
  meta: { jobDescriptionPreview: string; resumeFileName: string },
): Promise<StoredGapAnalysis> {
  const stored: StoredGapAnalysis = {
    ...analysis,
    ...meta,
  };
  await writeFile(getGapFilePath(userId), JSON.stringify(stored, null, 0), "utf8");
  return stored;
}

export async function clearGapAnalysis(userId: string): Promise<void> {
  try {
    await unlink(getGapFilePath(userId));
  } catch {
    // ignore
  }
}
