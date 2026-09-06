import type { NextConfig } from "next";
const config: NextConfig = {
  transpilePackages: ["@gameagent/ui", "@gameagent/protocol"],
};
export default config;
