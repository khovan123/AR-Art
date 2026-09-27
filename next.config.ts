import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["mind-ar"],
  turbopack: {
    resolveAlias: {
      fs: {
        browser: "./src/shims/empty.ts",
      },
    },
  },
};

export default nextConfig;
