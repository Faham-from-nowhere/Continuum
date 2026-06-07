import { Liveblocks } from "@liveblocks/node";
import { NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
});

export async function POST(request: Request) {
  try {
    const { room, user } = await request.json();

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Identify the user with Liveblocks securely
    const session = liveblocks.prepareSession(
      user.id,
      { 
        userInfo: {
          name: user.name || "Anonymous",
          color: "#" + Math.floor(Math.random() * 16777215).toString(16),
          picture: user.picture,
        }
      }
    );

    if (room) {
      session.allow(room, session.FULL_ACCESS);
    }

    const { status, body } = await session.authorize();
    return new Response(body, { status });
  } catch (error) {
    console.error("Liveblocks auth error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
