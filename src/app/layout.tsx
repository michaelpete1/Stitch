import "./globals.css";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/AuthContext";
import AnimatedBackground from "@/app/components/AnimatedBackground";
import BrandIntro from "@/app/components/BrandIntro";
import ConsentGate from "@/app/components/ConsentGate";
import ServiceWorkerRegistration from "@/app/components/ServiceWorkerRegistration";

export const metadata: Metadata = {
  title: "Stitch",
  description:
    "Organize, track, and excel in your courses with our intuitive platform.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stitch",
  },
  icons: {
    icon: "/stitch-mark.png",
    shortcut: "/favicon.ico",
    apple: "/stitch-mark.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1026",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <AnimatedBackground />
        <AuthProvider>
          <ServiceWorkerRegistration />
          <BrandIntro><ConsentGate>{children}</ConsentGate></BrandIntro>
        </AuthProvider>
      </body>
    </html>
  );
}
