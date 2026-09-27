/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/index.html" },
        { source: "/teacher/:section", destination: "/teacher.html" },
        { source: "/student/:section", destination: "/student.html" },
      ],
    };
  },
};

module.exports = nextConfig;
