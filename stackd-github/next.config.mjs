
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/stackd",
  assetPrefix: "/stackd",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
