import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Auto Post - LinkedIn Poster",
  description: "Post to LinkedIn with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
