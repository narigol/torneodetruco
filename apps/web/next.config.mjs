import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@tdt/db", "@tdt/types"],
  experimental: {
    turbo: false,
  },
};

export default nextConfig;
