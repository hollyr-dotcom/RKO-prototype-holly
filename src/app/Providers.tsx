"use client";

import { LiveblocksProvider } from "@liveblocks/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LiveblocksProvider
      publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!}
    >
      {children}
    </LiveblocksProvider>
  );
}
