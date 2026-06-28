import type { NextConfig } from "next";

const backendUrl = (
  process.env.BACKEND_INTERNAL_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  "http://localhost:8000"
).replace(/\/+$/, "");

const backendApiPrefixes = ["auth", "creator", "users", "instances"] as const;

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        ...backendApiPrefixes.map((prefix) => ({
          source: `/${prefix}/:path*`,
          destination: `${backendUrl}/${prefix}/:path*`,
        })),
        {
          source: "/admin/login/:path*",
          has: [
            {
              type: "header",
              key: "content-type",
              value: "application/json.*",
            },
          ],
          destination: `${backendUrl}/admin/login/:path*`,
        },
        {
          source: "/admin/instances/:path*",
          destination: `${backendUrl}/admin/instances/:path*`,
        },
        {
          source: "/admin/creators/:path*",
          destination: `${backendUrl}/admin/creators/:path*`,
        },
        {
          source: "/admin/invite-creator/:path*",
          destination: `${backendUrl}/admin/invite-creator/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
