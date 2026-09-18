import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the Base44 preview origin to access dev assets/HMR.
  // The preview origin is https://3000-<sandbox-suffix>; Next.js gates dev
  // requests by origin and a bare '*' wildcard does not match, so we add
  // the hostname explicitly.
  allowedDevOrigins: process.env.BASE44_PUBLIC_HOST_SUFFIX
    ? ["3000-" + process.env.BASE44_PUBLIC_HOST_SUFFIX]
    : [],
};

export default nextConfig;
