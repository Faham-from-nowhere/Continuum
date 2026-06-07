import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ConvexClientProvider } from "@/components/providers/convex-provider";
import { Toaster } from "sonner";
import { ModalProvider } from "@/components/providers/modal-provider";
import { EdgeStoreProvider } from "@/lib/edgestore";
import { LiveblocksClientProvider } from "@/components/providers/liveblocks-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Continuum",
  description: "The connected workspace for better, faster and more efficient work.",
  manifest: "/manifest.json",
  icons: [
    {
      rel: "icon",
      url: "/logo.png",
      media: "(prefers-color-scheme: light)",
    },
    {
      rel: "icon",
      url: "/logo-dark.png",
      media: "(prefers-color-scheme: dark)",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <ConvexClientProvider>
          <EdgeStoreProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="continuum-theme-2">
            <Toaster position="bottom-center"/>
            <ModalProvider />
            <LiveblocksClientProvider>
              {children}
            </LiveblocksClientProvider>
          </ThemeProvider>
        </EdgeStoreProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
