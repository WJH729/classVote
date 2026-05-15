import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:3001/:path*',
      },
      {
        source: '/wallpaper/image',
        destination: 'http://127.0.0.1:3001/wallpaper/image',
      },
    ];
  },
  allowedDevOrigins: ['192.168.3.5', 'localhost', 'test.example.com', '124.220.238.163:17498', '124.220.238.163'],
};

export default nextConfig;
