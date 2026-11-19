import { communityRoute, json } from "@/lib/community/http";
import { unreadMessages } from "@/lib/community/inbox";

export const GET = communityRoute(async (_request, uid) => json({ senders: await unreadMessages(uid) }));
