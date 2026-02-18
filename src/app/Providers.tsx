"use client";

import { LiveblocksProvider } from "@liveblocks/react";
import { useAuth } from "@/hooks/useAuth";

export function Providers({ children }: { children: React.ReactNode }) {
  const { user, isConfigured } = useAuth();

  // Skip LiveblocksProvider only when auth is configured but user hasn't signed in yet.
  // In local dev (auth not configured), always render it — the auth endpoint returns a mock user.
  if (isConfigured && !user) {
    return <>{children}</>;
  }

  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      {children}
    </LiveblocksProvider>
  );
}
