/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/teacher", destination: "/teacher/dashboard", permanent: false },
      { source: "/student", destination: "/student/dashboard", permanent: false },
    ];
  },
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
