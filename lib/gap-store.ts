import { readFile, writeFile } from "fs/promises";
import path from "path";
import type { GapAnalysis } from "@/lib/gap-analysis-types";
import type { StoredGapAnalysis } from "@/lib/gap-types";

export type { StoredGapAnalysis } from "@/lib/gap-types";

const GAP_FILE = path.join(process.cwd(), ".gap-analysis.json");

export async function getStoredGapAnalysis(): Promise<StoredGapAnalysis | null> {
  try {
    const raw = await readFile(GAP_FILE, "utf8");
    return JSON.parse(raw) as StoredGapAnalysis;
  } catch {
    return null;
  }
}

export async function saveGapAnalysis(
  analysis: GapAnalysis,
  meta: { jobDescriptionPreview: string; resumeFileName: string },
): Promise<StoredGapAnalysis> {
  const stored: StoredGapAnalysis = {
    ...analysis,
    ...meta,
  };
  await writeFile(GAP_FILE, JSON.stringify(stored, null, 0), "utf8");
  return stored;
}

export async function clearGapAnalysis(): Promise<void> {
  try {
    const { unlink } = await import("fs/promises");
    await unlink(GAP_FILE);
  } catch {
    // ignore
  }
}
