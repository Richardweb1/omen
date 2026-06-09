import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/builder",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
