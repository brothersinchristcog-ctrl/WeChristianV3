import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow access from local network device (e.g. mobile phone) and localhost IP
  allowedDevOrigins: ['192.168.1.36', '127.0.0.1'],
};

export default nextConfig;
