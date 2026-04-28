import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@tdt/db", "@tdt/types"],
};

export default nextConfig;
