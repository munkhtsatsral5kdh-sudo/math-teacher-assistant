export const metadata = {
  title: "Математикийн багшийн туслах",
  description: "6–9-р ангийн математик. Багш, сурагч.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}
