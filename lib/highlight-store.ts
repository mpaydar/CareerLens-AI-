import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { extractJobId } from "@/lib/job-id";

export type HighlightState = {
  text: string;
  sourceUrl: string;
  jobId: string;
  updatedAt: string;
};

const HIGHLIGHT_SEPARATOR = "\n\n---\n\n";

const defaultState: HighlightState = {
  text: "",
  sourceUrl: "",
  jobId: "",
  updatedAt: "",
};

function getStatePath(): string {
  return path.join(process.cwd(), ".highlight-state.json");
}

function parseState(raw: string): HighlightState {
  try {
    const parsed = JSON.parse(raw) as Partial<HighlightState>;
    return {
      text: typeof parsed.text === "string" ? parsed.text : "",
      sourceUrl: typeof parsed.sourceUrl === "string" ? parsed.sourceUrl : "",
      jobId: typeof parsed.jobId === "string" ? parsed.jobId : "",
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return { ...defaultState };
  }
}

async function writeState(state: HighlightState): Promise<HighlightState> {
  const filePath = getStatePath();
  await mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, JSON.stringify(state), "utf8");
  await rename(tmpPath, filePath);
  return state;
}

function chunkAlreadyPresent(existing: string, chunk: string): boolean {
  const trimmed = chunk.trim();
  if (!trimmed) {
    return true;
  }
  if (existing.trim() === trimmed) {
    return true;
  }
  // Only skip if this exact chunk was already appended (not if it appears inside earlier text).
  return existing
    .split(HIGHLIGHT_SEPARATOR)
    .map((part) => part.trim())
    .includes(trimmed);
}

function appendChunk(existing: string, chunk: string): string {
  const trimmed = chunk.trim();
  if (!trimmed) {
    return existing;
  }
  if (!existing.trim()) {
    return trimmed;
  }
  if (chunkAlreadyPresent(existing, trimmed)) {
    return existing;
  }
  return `${existing.trimEnd()}${HIGHLIGHT_SEPARATOR}${trimmed}`;
}

function shouldReplaceForJobChange(
  current: HighlightState,
  incomingJobId: string,
): boolean {
  if (!current.text.trim()) {
    return false;
  }
  if (!incomingJobId) {
    return false;
  }
  if (!current.jobId) {
    return false;
  }
  return incomingJobId !== current.jobId;
}

export async function getHighlightState(): Promise<HighlightState> {
  try {
    const raw = await readFile(getStatePath(), "utf8");
    return parseState(raw);
  } catch {
    return { ...defaultState };
  }
}

/** Append highlight for same job id; replace all text when job id changes. */
export async function appendHighlightChunk(
  chunk: string,
  sourceUrl: string,
): Promise<HighlightState> {
  const trimmedChunk = chunk.trim();
  if (!trimmedChunk) {
    return getHighlightState();
  }

  const current = await getHighlightState();
  const incomingJobId = extractJobId(sourceUrl);

  let nextText: string;
  let nextJobId: string;

  if (shouldReplaceForJobChange(current, incomingJobId)) {
    nextText = trimmedChunk;
    nextJobId = incomingJobId;
  } else if (!current.text.trim()) {
    nextText = trimmedChunk;
    nextJobId = incomingJobId || current.jobId;
  } else {
    nextText = appendChunk(current.text, trimmedChunk);
    nextJobId = incomingJobId || current.jobId;
  }

  const nextState: HighlightState = {
    text: nextText,
    sourceUrl: sourceUrl || current.sourceUrl,
    jobId: nextJobId,
    updatedAt: new Date().toISOString(),
  };

  return writeState(nextState);
}

export async function clearHighlightState(): Promise<HighlightState> {
  return writeState({ ...defaultState });
}
