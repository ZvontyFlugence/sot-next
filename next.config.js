module.exports = {
  env: {
    MONGO_URI: process.env.MONGO_URI,
    DEFAULT_IMG: 'https://state-of-turmoil.net/default-comp.png',
    DEFAULT_USER_IMG: 'https://state-of-turmoil.net/default-user.jpg',
    NEXT_PUBLIC_LOGO: 'https://state-of-turmoil.net/logo_transparent.png',
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
