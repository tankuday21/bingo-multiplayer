import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans"; // GeistSans import
import { GeistMono } from "geist/font/mono"; // GeistMono import
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Bingo Multiplayer Game",
  description: "A fun, real-time multiplayer bingo game with modern UI and themes",
  keywords: ["bingo", "game", "multiplayer", "online", "real-time"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.className} ${GeistMono.variable} antialiased min-h-screen`}>
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}