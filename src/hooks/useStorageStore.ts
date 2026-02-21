import { useEffect, useState } from "react";
import { useRoom } from "@/liveblocks.config";
import { LiveMap } from "@liveblocks/client";
import {
  computed,
  createPresenceStateDerivation,
  createTLStore,
  react,
  defaultShapeUtils,
  DocumentRecordType,
  InstancePresenceRecordType,
  PageRecordType,
  TLDOCUMENT_ID,
  TLAnyShapeUtilConstructor,
  TLDocument,
  TLInstancePresence,
  TLPageId,
  TLRecord,
  TLStoreEventInfo,
  TLStoreWithStatus,
} from "tldraw";
import type { IndexKey } from "tldraw";

export function useStorageStore({
  shapeUtils = [],
  user,
}: Partial<{
  shapeUtils: TLAnyShapeUtilConstructor[];
  user: {
    id: string;
    color: string;
    name: string;
  };
}>) {
  const room = useRoom();

  const [store] = useState(() => {
    const store = createTLStore({
      shapeUtils: [...defaultShapeUtils, ...shapeUtils],
    });
    return store;
  });

  const [storeWithStatus, setStoreWithStatus] = useState<TLStoreWithStatus>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    const unsubs: (() => void)[] = [];
    setStoreWithStatus({ status: "loading" });

    async function setup() {
      const { root } = await room.getStorage();

      // If the effect was cleaned up while we were awaiting storage,
      // bail out to prevent orphaned listeners and duplicate syncs.
      if (cancelled) return;

      // Get the LiveMap for records -- we use `any` for the LiveMap value type
      // because tldraw's TLRecord doesn't satisfy LiveBlocks' Lson constraint.
      // All reads are cast to TLRecord at the consumption site.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const liveRecords = root.get("records") as unknown as LiveMap<string, any>;
      if (!liveRecords) {
        return;
      }

      // Initialize tldraw store with records from LiveBlocks Storage
      // Filter out shape records whose type isn't registered (e.g. removed custom shapes)
      const knownTypes = new Set(
        [...defaultShapeUtils, ...shapeUtils].map((u) => u.type)
      );
      const records = [...liveRecords.values()].filter((r: TLRecord) => {
        if (r.typeName === "shape" && "type" in r) {
          return knownTypes.has((r as { type: string }).type);
        }
        return true;
      }).map((r: TLRecord) => {
        // Patch missing props for shapes that predate migrations
        if (r.typeName === "shape" && (r as any).type === "peoplelist") {
          const props = (r as any).props;
          if (props && props.colorScheme === undefined) {
            return { ...r, props: { ...props, colorScheme: "" } };
          }
        }
        if (r.typeName === "shape" && (r as any).type === "connector-line") {
          const props = (r as any).props;
          if (props && (props.fromId === undefined || props.toId === undefined)) {
            return { ...r, props: { ...props, fromId: props.fromId ?? "", toId: props.toId ?? "" } };
          }
        }
        return r;
      });

      // Guard: prevent init events from syncing back to Liveblocks.
      // Orphaned listeners from a previous setup() (caused by effect re-runs
      // during Liveblocks reconnection or React Strict Mode) could otherwise
      // echo clear/put changes back to Liveblocks, duplicating content for
      // all connected clients.
      let isInitializing = true;

      store.clear();
      store.put(
        [
          DocumentRecordType.create({
            id: TLDOCUMENT_ID as TLDocument["id"],
          }),
          PageRecordType.create({
            id: "page:page" as TLPageId,
            name: "Page 1",
            index: "a1" as IndexKey,
          }),
          ...records,
        ],
        "initialize"
      );

      // Bail out if cleaned up during store initialization
      if (cancelled) return;

      // -----------------------------------------------------------
      // Sync local tldraw document changes → LiveBlocks Storage
      // -----------------------------------------------------------
      unsubs.push(
        store.listen(
          ({ changes }: TLStoreEventInfo) => {
            // Skip syncing during store initialization
            if (isInitializing) return;

            room.batch(() => {
              Object.values(changes.added).forEach((record) => {
                liveRecords.set(record.id, record);
              });

              Object.values(changes.updated).forEach(([_, record]) => {
                liveRecords.set(record.id, record);
              });

              Object.values(changes.removed).forEach((record) => {
                liveRecords.delete(record.id);
              });
            });
          },
          { source: "user", scope: "document" }
        )
      );

      // -----------------------------------------------------------
      // Sync local tldraw session/presence changes → LiveBlocks Presence
      // -----------------------------------------------------------
      function syncStoreWithPresence({ changes }: TLStoreEventInfo) {
        room.batch(() => {
          Object.values(changes.added).forEach((record) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            room.updatePresence({ [record.id]: record } as any);
          });

          Object.values(changes.updated).forEach(([_, record]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            room.updatePresence({ [record.id]: record } as any);
          });

          Object.values(changes.removed).forEach((record) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            room.updatePresence({ [record.id]: null } as any);
          });
        });
      }

      unsubs.push(
        store.listen(syncStoreWithPresence, {
          source: "user",
          scope: "session",
        })
      );

      unsubs.push(
        store.listen(syncStoreWithPresence, {
          source: "user",
          scope: "presence",
        })
      );

      // -----------------------------------------------------------
      // Sync LiveBlocks Storage changes → tldraw store
      // -----------------------------------------------------------
      unsubs.push(
        room.subscribe(
          liveRecords,
          (storageChanges) => {
            const toRemove: TLRecord["id"][] = [];
            const toPut: TLRecord[] = [];

            for (const update of storageChanges) {
              if (update.type !== "LiveMap") {
                continue;
              }

              for (const [id, { type }] of Object.entries(update.updates)) {
                switch (type) {
                  case "delete": {
                    toRemove.push(id as TLRecord["id"]);
                    break;
                  }
                  case "update": {
                    const curr = update.node.get(id);
                    if (curr) {
                      toPut.push(curr as unknown as TLRecord);
                    }
                    break;
                  }
                }
              }
            }

            // Merge remote changes into tldraw (source: "remote")
            store.mergeRemoteChanges(() => {
              if (toRemove.length) {
                store.remove(toRemove);
              }
              if (toPut.length) {
                store.put(toPut);
              }
            });
          },
          { isDeep: true }
        )
      );

      // -----------------------------------------------------------
      // Set up user presence (cursor, selection, etc.)
      // -----------------------------------------------------------
      const userPreferences = computed<{
        id: string;
        color: string;
        name: string;
      }>("userPreferences", () => {
        if (!user) {
          throw new Error("Failed to get user");
        }
        return {
          id: user.id,
          color: user.color,
          name: user.name,
        };
      });

      // Use the connection ID as a unique session identifier
      const connectionIdString = "" + (room.getSelf()?.connectionId || 0);

      const presenceDerivation = createPresenceStateDerivation(
        userPreferences,
        InstancePresenceRecordType.createId(connectionIdString)
      )(store);

      // Push initial presence to LiveBlocks
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      room.updatePresence({
        presence: presenceDerivation.get() ?? null,
      } as any);

      // Reactively sync tldraw presence → LiveBlocks
      unsubs.push(
        react("when presence changes", () => {
          const presence = presenceDerivation.get() ?? null;
          requestAnimationFrame(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            room.updatePresence({ presence } as any);
          });
        })
      );

      // -----------------------------------------------------------
      // Sync LiveBlocks presence from others → tldraw store
      // -----------------------------------------------------------
      unsubs.push(
        room.subscribe("others", (others, event) => {
          const toRemove: TLInstancePresence["id"][] = [];
          const toPut: TLInstancePresence[] = [];

          switch (event.type) {
            case "leave": {
              if (event.user.connectionId) {
                toRemove.push(
                  InstancePresenceRecordType.createId(
                    `${event.user.connectionId}`
                  )
                );
              }
              break;
            }

            case "reset": {
              others.forEach((other) => {
                toRemove.push(
                  InstancePresenceRecordType.createId(`${other.connectionId}`)
                );
              });
              break;
            }

            case "enter":
            case "update": {
              const presence = event?.user?.presence as
                | Record<string, unknown>
                | undefined;
              if (presence?.presence) {
                toPut.push(
                  presence.presence as unknown as TLInstancePresence
                );
              }
              break;
            }
          }

          // Merge other users' presence into tldraw as remote changes
          store.mergeRemoteChanges(() => {
            if (toRemove.length) {
              store.remove(toRemove);
            }
            if (toPut.length) {
              store.put(toPut);
            }
          });
        })
      );

      // -----------------------------------------------------------
      // Initialization complete — allow local→remote sync
      // -----------------------------------------------------------
      isInitializing = false;

      setStoreWithStatus({
        store,
        status: "synced-remote",
        connectionStatus: "online",
      });
    }

    setup();

    return () => {
      cancelled = true;
      unsubs.forEach((fn) => fn());
      unsubs.length = 0;
    };
  }, [room, store, user]);

  return storeWithStatus;
}
