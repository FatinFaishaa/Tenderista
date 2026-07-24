import type { Metadata, Viewport } from "next";
import { Poppins, Pacifico, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const pacifico = Pacifico({
  variable: "--font-pacifico",
  subsets: ["latin"],
  weight: "400",
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tenderista",
  description: "Staff operations and financial management for restaurant branches",
  icons: {
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    title: "Tenderista",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#8B1A1A",
};

// Runs before paint so the manual theme choice (or system preference on first
// visit) applies immediately — no flash of the wrong theme.
const themeBootstrapScript = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${pacifico.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <Script
          id="theme-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
