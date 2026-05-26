/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@playhub/ui", "@playhub/core", "@playhub/config"],
  webpack: (config) => {
    config.resolve.symlinks = false;
    // Allow webpack to resolve hoisted workspace packages from the monorepo root
    config.resolve.modules = [
      ...( config.resolve.modules || ["node_modules"]),
      path.resolve(__dirname, "../node_modules"),
    ];
    return config;
  },
};

module.exports = nextConfig;
