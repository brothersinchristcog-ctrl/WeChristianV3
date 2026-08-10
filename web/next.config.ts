import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow access from local network device (e.g. mobile phone)
  allowedDevOrigins: ['192.168.1.36'],
};

export default nextConfig;
