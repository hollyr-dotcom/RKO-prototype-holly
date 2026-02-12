"use client";

import { LiveblocksProvider } from "@liveblocks/react";
import { useAuth } from "@/hooks/useAuth";
import { getSessionUser } from "@/lib/userIdentity";

export function Providers({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // During auth loading or when not authenticated, render children without Liveblocks
  // (AuthGate will handle showing login screen)
  if (!user) {
    return <>{children}</>;
  }

  const sessionUser = getSessionUser(user);

  return (
    <LiveblocksProvider
      publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!}
    >
      {children}
    </LiveblocksProvider>
  );
}
