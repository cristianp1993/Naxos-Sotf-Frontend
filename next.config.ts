import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CP 2026-10-01 Oculta el header X-Powered-By para no anunciar que es Next.js
  poweredByHeader: false,
};

export default nextConfig;
