import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

/** Always use this app folder as the Turbopack root (avoids picking ~/pnpm-lock.yaml). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
