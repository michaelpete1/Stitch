import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/AuthContext";
import AnimatedBackground from "@/app/components/AnimatedBackground";
import BrandIntro from "@/app/components/BrandIntro";
import ConsentGate from "@/app/components/ConsentGate";

export const metadata: Metadata = {
  title: "Stitch",
  description:
    "Organize, track, and excel in your courses with our intuitive platform.",
  icons: {
    icon: "/stitch-mark.png",
    shortcut: "/favicon.ico",
    apple: "/stitch-mark.png",
  },
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
          <BrandIntro><ConsentGate>{children}</ConsentGate></BrandIntro>
        </AuthProvider>
      </body>
    </html>
  );
}
