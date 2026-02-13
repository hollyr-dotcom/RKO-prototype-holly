import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";
import { ChatProvider } from "@/providers/ChatProvider";
import { SidebarProvider } from "@/providers/SidebarProvider";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthGate } from "@/components/AuthGate";
import { ChatShell } from "@/components/ChatShell";

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
        <Providers>
          <AuthGate>
            <SidebarProvider>
              <ChatProvider>
                <div className="flex h-screen bg-gray-50">
                  <AppSidebar />
                  <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
                  <ChatShell />
                </div>
              </ChatProvider>
            </SidebarProvider>
          </AuthGate>
        </Providers>
      </body>
    </html>
  );
}
