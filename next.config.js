module.exports = {
  env: {
    MONGO_URI: process.env.MONGO_URI,
    DEFAULT_IMG: 'http://143.244.155.196:8080/default-comp.png',
    DEFAULT_USER_IMG: 'http://143.244.155.196:8080/default-user.jpg',
    NEXT_PUBLIC_LOGO: 'http://143.244.155.196:8080/logo_transparent.png',
    URI: 'http://143.244.155.196:8080',
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
