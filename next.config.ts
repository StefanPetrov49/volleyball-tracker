import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The share-preview image reads team logos and fonts from disk;
  // make sure Vercel ships those files with the serverless function.
  outputFileTracingIncludes: {
    "/results/**": ["./public/teams/**/*", "./assets/fonts/**/*"],
  },
};

export default nextConfig;
