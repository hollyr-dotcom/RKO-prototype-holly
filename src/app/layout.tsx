import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Providers } from "./Providers";
import { ChatProvider } from "@/providers/ChatProvider";
import { SidebarProvider } from "@/providers/SidebarProvider";
import { AuthGate } from "@/components/AuthGate";
import { NavigationShell } from "@/components/NavigationShell";

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AI Canvas",
  description: "Visual collaboration with AI agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${notoSans.variable} font-sans antialiased`}>
        <SessionProvider>
          <Providers>
            <AuthGate>
              <SidebarProvider>
                <ChatProvider>
                  <NavigationShell>{children}</NavigationShell>
                </ChatProvider>
              </SidebarProvider>
            </AuthGate>
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
