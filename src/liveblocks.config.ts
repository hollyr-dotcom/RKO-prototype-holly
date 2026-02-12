"use client";

import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY || "pk_dev_placeholder",
  throttle: 16,
});

export const {
  RoomProvider,
  useRoom,
  useSelf,
  useOthers,
  useStorage,
  useMutation,
  useThreads,
  useCreateThread,
  useEditThreadMetadata,
  useDeleteThread,
  useMarkThreadAsResolved,
} = createRoomContext(client);
