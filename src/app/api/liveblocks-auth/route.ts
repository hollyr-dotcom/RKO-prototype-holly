import { Liveblocks } from "@liveblocks/node";
import { requireAuth } from "@/lib/auth/serverAuth";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    // Read the room ID from the request body (sent by the Liveblocks client)
    const { room } = await req.json();

    const session = liveblocks.prepareSession(user.uid, {
      userInfo: {
        name: user.displayName || user.email.split("@")[0],
        email: user.email,
        avatar: user.photoURL || undefined,
      },
    });

    // Grant full access to the requested room (all rooms belong to org)
    if (room) {
      session.allow(room, session.FULL_ACCESS);
    }

    const { status, body } = await session.authorize();
    return new Response(body, { status });
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }
}
