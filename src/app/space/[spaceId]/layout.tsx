"use client";

import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/contexts/SidebarContext";

export default function SpaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="relative h-screen bg-gray-50">
        {/* Sidebar floats over content */}
        <div className="absolute top-3 left-3 bottom-3 z-[400] pointer-events-none">
          <div className="pointer-events-auto h-full">
            <AppSidebar />
          </div>
        </div>
        <main className="h-full w-full flex flex-col overflow-hidden">{children}</main>
      </div>
    </SidebarProvider>
  );
}
