import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stitch',
  description: 'Organize, track, and excel in your courses with our intuitive platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      
      <body>
        {children}
      </body>
    </html>
  );
}