import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.ncaa.com",
        pathname: "/sites/default/files/images/logos/**",
      },
    ],
  },
};

export default nextConfig;
