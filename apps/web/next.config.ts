import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:3001/:path*',
      },
      {
        source: '/wallpaper/:path*',
        destination: 'http://127.0.0.1:3001/wallpaper/:path*',
      },
    ];
  },
  allowedDevOrigins: [
    '192.168.3.5',
    'localhost',
    '127.0.0.1',
    'test.example.com',
    '124.220.238.163:17498',
    '124.220.238.163',
  ],
};

export default nextConfig;
