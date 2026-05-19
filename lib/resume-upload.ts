import { mkdir, readFile, readdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { clearGapAnalysis } from "@/lib/gap-store";

export type ResumeMeta = {
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  storedFileName: string;
};

const UPLOAD_ROOT = path.join(process.cwd(), ".resume-upload");
const META_FILE = "meta.json";

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_EXT = new Set([".pdf", ".doc", ".docx"]);

const MIME_FOR_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function getUserUploadDir(userId: string): string {
  return path.join(UPLOAD_ROOT, userId);
}

function getMetaPath(userId: string): string {
  return path.join(getUserUploadDir(userId), META_FILE);
}

function safeExtension(fileName: string): string | null {
  const ext = path.extname(fileName).toLowerCase();
  return ALLOWED_EXT.has(ext) ? ext : null;
}

export async function getResumeMeta(userId: string): Promise<ResumeMeta | null> {
  try {
    const raw = await readFile(getMetaPath(userId), "utf8");
    const parsed = JSON.parse(raw) as Partial<ResumeMeta>;
    if (
      typeof parsed.originalFileName !== "string" ||
      typeof parsed.mimeType !== "string" ||
      typeof parsed.sizeBytes !== "number" ||
      typeof parsed.uploadedAt !== "string" ||
      typeof parsed.storedFileName !== "string"
    ) {
      return null;
    }
    return parsed as ResumeMeta;
  } catch {
    return null;
  }
}

async function removeStoredFiles(userId: string): Promise<void> {
  const dir = getUserUploadDir(userId);
  try {
    const names = await readdir(dir);
    for (const name of names) {
      if (name === META_FILE) continue;
      if (name.startsWith("resume-")) {
        await unlink(path.join(dir, name));
      }
    }
  } catch {
    // ignore missing dir
  }
}

export async function saveResumeFromUpload(
  userId: string,
  file: File,
): Promise<ResumeMeta> {
  const ext = safeExtension(file.name);
  if (!ext) {
    throw new Error("invalid file type; use PDF, DOC, or DOCX");
  }

  if (file.size > MAX_BYTES) {
    throw new Error(`file too large (max ${MAX_BYTES / (1024 * 1024)} MB)`);
  }

  const declaredMime = file.type || MIME_FOR_EXT[ext];
  const allowedMime = new Set(Object.values(MIME_FOR_EXT));
  if (
    declaredMime &&
    declaredMime !== "application/octet-stream" &&
    !allowedMime.has(declaredMime)
  ) {
    throw new Error("invalid file type");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadDir = getUserUploadDir(userId);

  await mkdir(uploadDir, { recursive: true });
  await removeStoredFiles(userId);

  const storedFileName = `resume-${Date.now()}${ext}`;
  const storedPath = path.join(uploadDir, storedFileName);
  await writeFile(storedPath, buffer);

  const meta: ResumeMeta = {
    originalFileName: file.name,
    mimeType: MIME_FOR_EXT[ext],
    sizeBytes: buffer.length,
    uploadedAt: new Date().toISOString(),
    storedFileName,
  };

  await writeFile(getMetaPath(userId), JSON.stringify(meta, null, 0), "utf8");
  await clearGapAnalysis(userId);
  return meta;
}

export function getResumeFilePath(userId: string, meta: ResumeMeta): string {
  return path.join(getUserUploadDir(userId), meta.storedFileName);
}

export async function deleteResume(userId: string): Promise<void> {
  const meta = await getResumeMeta(userId);
  try {
    if (meta) {
      await unlink(path.join(getUserUploadDir(userId), meta.storedFileName)).catch(
        () => {},
      );
    }
    await unlink(getMetaPath(userId)).catch(() => {});
  } catch {
    // ignore
  }
  await removeStoredFiles(userId);
  await clearGapAnalysis(userId);
}
