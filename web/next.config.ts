import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The POC has no server-only routes, so emit static HTML that can be hosted
  // privately in S3 and served through CloudFront.
  output: "export",
};

export default nextConfig;
