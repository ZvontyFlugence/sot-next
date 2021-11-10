module.exports = {
  swcMinify: true,
  env: {
    MONGO_URI: process.env.MONGO_URI,
    DEFAULT_IMG: `${process.env.URI}/default-comp.png`,
    DEFAULT_USER_IMG: `${process.env.URI}/default-user.jpg`,
    NEXT_PUBLIC_LOGO: `${process.env.URI}/logo_transparent.png`,
    URI: process.env.URI,
    NEXT_PUBLIC_GMAP_KEY: process.env.GMAP_KEY,
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
