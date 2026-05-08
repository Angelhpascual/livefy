import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Logo, títulos, elementos destacados — estilo Spotify
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

// Texto general — ultra legible en móvil
const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Livefy",
  description: "Elige la música de tu noche",
  openGraph: {
    title: "Livefy",
    description: "Elige la música de tu noche",
    type: "website",
    siteName: "Livefy",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${plusJakarta.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1DB954" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Livefy" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: "var(--font-body), sans-serif" }}>
        {children}
        <Toaster
          position="top-center"
          expand={false}
          gap={8}
          toastOptions={{
            style: {
              fontFamily: "var(--font-body), sans-serif",
              backgroundColor: '#ffffff',
              border: 'none',
              color: '#111111',
              borderRadius: '16px',
              fontSize: '14px',
              fontWeight: '600',
              padding: '14px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              maxWidth: '340px',
            },
          }}
        />
      </body>
    </html>
  );
}
