import { Liveblocks } from "@liveblocks/node";
import { requireAuth } from "@/lib/auth/serverAuth";

function getLiveblocks() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  return new Liveblocks({ secret });
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    const liveblocks = getLiveblocks();

    const { room } = await req.json();

    const session = liveblocks.prepareSession(user.uid, {
      userInfo: {
        name: user.displayName || user.email.split("@")[0],
        email: user.email,
        avatar: user.photoURL || undefined,
      },
    });

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
