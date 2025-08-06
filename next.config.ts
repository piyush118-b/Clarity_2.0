import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Expose environment variables to the client-side
  env: {
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  },
  // Optimize static file handling
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-icons'],
  },
  // Configure asset handling for Vercel
  images: {
    unoptimized: true, // Disable Next.js image optimization for static export
    formats: ['image/webp', 'image/avif'],
  },
  // Ensure video and image files are properly served
  async headers() {
    return [
      {
        source: '/(.*)\\.(mp4|webm|ogg|jpg|jpeg|png|gif|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  // Handle large assets
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(mp4|webm|ogg)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/media/',
          outputPath: 'static/media/',
        },
      },
    });
    return config;
  },
};

export default nextConfig;
