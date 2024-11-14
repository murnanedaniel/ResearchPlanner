/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    experimental: {
        // This will allow better optimization
        optimizeCss: true,
        // Helps with module resolution
        esmExternals: 'loose'
    },
    // Add this to help with MDX editor
    webpack: (config) => {
        config.resolve.fallback = { fs: false, path: false };
        return config;
    }
}

module.exports = nextConfig