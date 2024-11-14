/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        optimizeCss: true,
        esmExternals: 'loose'
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    webpack: (config) => {
        config.resolve.fallback = { fs: false, path: false };
        return config;
    }
}

module.exports = nextConfig