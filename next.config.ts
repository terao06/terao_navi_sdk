import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  reactStrictMode: true,
  // Turbopackを明示的に有効化（Next.js 16+）
  turbopack: {},
  async headers() {
    return [
      {
        // chat.jsへのCORSヘッダーを設定
        source: "/chat.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
      {
        // APIエンドポイントへのCORSヘッダーを設定
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type" },
        ],
      },
    ];
  },
};

export default nextConfig;
