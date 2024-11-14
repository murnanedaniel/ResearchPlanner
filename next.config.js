/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        optimizeCss: false,
        esmExternals: 'loose'
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    webpack: (config) => {
        config.resolve.fallback = { fs: false, path: false };
        return config;
    },
    poweredByHeader: false,
    generateEtags: false,
    compress: false
}

module.exports = nextConfig