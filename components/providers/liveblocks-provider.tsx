"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense
} from "@liveblocks/react/suspense";
import { useUser } from "@clerk/clerk-react";

export function LiveblocksClientProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();

  if (!process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY) {
    return <>{children}</>;
  }

  if (!isLoaded) {
    return <div>Loading workspace...</div>;
  }

  // We use the auth endpoint directly here with a custom callback to pass Clerk user data
  return (
    <LiveblocksProvider 
      authEndpoint={async (room) => {
        const response = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            room,
            user: user ? {
              id: user.id,
              name: user.firstName || user.username || "Anonymous",
              picture: user.imageUrl,
            } : {
              id: "anonymous",
              name: "Anonymous",
            }
          }),
        });
        
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Liveblocks auth failed: ${response.status} ${text}`);
        }
        
        return await response.json();
      }}
    >
      {children}
    </LiveblocksProvider>
  );
}

export function LiveblocksRoomProvider({ 
  children, 
  roomId 
}: { 
  children: ReactNode;
  roomId: string;
}) {
  if (!process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY) {
    return <>{children}</>;
  }

  return (
    <RoomProvider id={roomId} initialPresence={{}}>
      <ClientSideSuspense fallback={<div>Loading Editor Realtime...</div>}>
        {children}
      </ClientSideSuspense>
    </RoomProvider>
  );
}
