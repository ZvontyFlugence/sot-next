module.exports = {
  swcMinify: true,
  env: {
    MONGO_URI: process.env.MONGO_URI,
    DEFAULT_IMG: `${process.env.URI}/default-comp.png`,
    DEFAULT_USER_IMG: `${process.env.URI}/default-user.jpg`,
    URI: process.env.URI,
    NEXT_PUBLIC_GMAP_KEY: process.env.GMAP_KEY,
    NEXT_PUBLIC_MAINTENANCE_MODE: process.env.NEXT_PUBLIC_MAINTENANCE_MODE,
    JWT_SECRET: process.env.JWT_SECRET,
  },
  async rewrites() {
    return [
      {
        source: '/api/gmap/:path*',
        destination: 'https://maps.googleapis.com/:path*',
      },
    ]
  },
};
