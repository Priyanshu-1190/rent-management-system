import type { NextConfig } from "next";
import path from "path";

const devPort = process.env.PORT || "3000";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    `localhost:${devPort}`,
    `127.0.0.1:${devPort}`,
    `10.11.255.1`,
  ],
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;
