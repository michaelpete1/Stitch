/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "http://localhost:3000",        // Default local dev
    "http://192.168.20.36:3000"     // Your LAN IP and port
    // Add any other origins you use for development here
  ],
  images: {
    domains: ['randomuser.me'],
  },
}

module.exports = nextConfig