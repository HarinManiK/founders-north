import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["jsdom", "imapflow", "@mozilla/readability"],
};

export default nextConfig;
