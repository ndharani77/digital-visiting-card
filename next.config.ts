import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  async rewrites() {
    return [{ source: "/f/:identifier", destination: "/create-card" }];
  },
};
export default nextConfig;
