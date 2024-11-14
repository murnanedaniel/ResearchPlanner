/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        esmExternals: 'loose'
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    webpack: (config) => {
        config.resolve.fallback = { fs: false, path: false };
        return config;
    },
    productionBrowserSourceMaps: false,
    swcMinify: true,
    compress: true
}

module.exports = nextConfig