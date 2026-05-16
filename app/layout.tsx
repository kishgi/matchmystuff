import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { AppShell } from "@/components/AppShell";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { Toaster } from "@/components/Toaster";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MatchMyStuff",
  description: "AI-powered lost and found platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" className={`${spaceGrotesk.variable} h-full`} suppressHydrationWarning>
        <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
          <ConvexClientProvider>
            <AppShell>{children}</AppShell>
            <Toaster />
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
