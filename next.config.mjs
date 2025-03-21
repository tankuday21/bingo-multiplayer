/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['framer-motion'],
    swcMinify: true,
    images: {
      domains: ['your-domain-if-needed.com'],
    },
    experimental: {
      serverComponentsExternalPackages: ['mongodb'],
    },
    webpack: (config) => {
      config.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        type: "javascript/auto",
      });
      return config;
    },
    env: {
      NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    },
    async headers() {
      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'X-DNS-Prefetch-Control',
              value: 'on'
            },
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains'
            },
            {
              key: 'X-Frame-Options',
              value: 'SAMEORIGIN'
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff'
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin'
            },
            {
              key: 'Permissions-Policy',
              value: 'camera=(), microphone=(), geolocation=()'
            }
          ]
        }
      ]
    }
  };
  
  export default nextConfig;