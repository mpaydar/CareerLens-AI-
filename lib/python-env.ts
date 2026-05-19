import path from "path";

export const SKILLS_SERVICE_DIR = path.join(process.cwd(), "skills-service");

/**
 * Absolute path to the Python executable for skills-service scripts.
 * Set PYTHON_PATH in npm scripts (see package.json "dev") — do not reference
 * .venv paths here (Turbopack follows those symlinks and breaks the bundle).
 * Relative PYTHON_PATH is resolved from the project root, not skills-service/.
 */
export function getPythonCommand(): string {
  const fromEnv = process.env.PYTHON_PATH?.trim();
  if (fromEnv) {
    return path.isAbsolute(fromEnv)
      ? fromEnv
      : path.resolve(process.cwd(), fromEnv);
  }
  return process.platform === "win32" ? "python" : "python3";
}
