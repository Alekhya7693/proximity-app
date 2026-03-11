/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/login",
        permanent: false,
        has: [
          {
            type: "cookie",
            key: "admin_token",
            value: undefined,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
