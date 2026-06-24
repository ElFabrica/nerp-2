import type { NextConfig } from "next";

const s3BucketHostname = process.env.NEXT_PUBLIC_S3_BUCKET_CONSTRUCTOR_URL;

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "erp-limas-app.t3.storage.dev",
        port: "",
        protocol: "https",
      },

      {
        hostname: "placehold.co",
        port: "",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
