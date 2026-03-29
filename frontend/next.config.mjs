import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid resolving repo parent (extra lockfiles) — cuts dev work and RAM
  turbopack: {
    root: __dirname,
  },
  // Fewer modules to trace in dev — helps RAM and compile time
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
