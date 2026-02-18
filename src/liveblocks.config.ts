"use client";

import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
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
