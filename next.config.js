/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid ENOENT rename errors from webpack's pack-file cache strategy
      config.cache = { type: "memory" };
    }
    return config;
  },
};

module.exports = nextConfig;
