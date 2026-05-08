import { Router, type IRouter } from "express";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { db, messagesTable, usersTable } from "@workspace/db";
import { SendMessageBody } from "@workspace/api-zod";
import { requireAuth, getOrCreateUser, buildAvatarUrl } from "./users";

const router: IRouter = Router();

async function getUserProfile(clerkId: string) {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));

  if (!user) return null;

  const books = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));

  return {
    id: user.id,
    clerkId: user.clerkId,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: buildAvatarUrl(user),
    bookCount: books.length,
    createdAt: user.createdAt,
  };
}

router.get("/messages/conversations", requireAuth, async (req: any, res): Promise<void> => {
  const myId = req.clerkUserId;

  const allMessages = await db
    .select()
    .from(messagesTable)
    .where(
      or(
        eq(messagesTable.senderClerkId, myId),
        eq(messagesTable.receiverClerkId, myId),
      ),
    )
    .orderBy(desc(messagesTable.createdAt));

  const conversationMap = new Map<string, typeof allMessages[0]>();
  for (const msg of allMessages) {
    const otherId = msg.senderClerkId === myId ? msg.receiverClerkId : msg.senderClerkId;
    if (!conversationMap.has(otherId)) {
      conversationMap.set(otherId, msg);
    }
  }

  const conversations = await Promise.all(
    Array.from(conversationMap.entries()).map(async ([otherId, lastMsg]) => {
      const otherUser = await getUserProfile(otherId);
      if (!otherUser) return null;

      const [{ unread }] = await db
        .select({ unread: sql<number>`count(*)::int` })
        .from(messagesTable)
        .where(
          and(
            eq(messagesTable.senderClerkId, otherId),
            eq(messagesTable.receiverClerkId, myId),
            eq(messagesTable.read, false),
          ),
        );

      return {
        otherUser,
        lastMessage: {
          id: lastMsg.id,
          senderId: lastMsg.senderClerkId,
          receiverId: lastMsg.receiverClerkId,
          content: lastMsg.content,
          read: lastMsg.read,
          createdAt: lastMsg.createdAt,
        },
        unreadCount: unread ?? 0,
      };
    }),
  );

  res.json({ conversations: conversations.filter(Boolean) });
});

router.get("/messages/:otherUserId", requireAuth, async (req: any, res): Promise<void> => {
  const myId = req.clerkUserId;
  const raw = Array.isArray(req.params.otherUserId) ? req.params.otherUserId[0] : req.params.otherUserId;

  const messages = await db
    .select()
    .from(messagesTable)
    .where(
      or(
        and(eq(messagesTable.senderClerkId, myId), eq(messagesTable.receiverClerkId, raw)),
        and(eq(messagesTable.senderClerkId, raw), eq(messagesTable.receiverClerkId, myId)),
      ),
    )
    .orderBy(desc(messagesTable.createdAt));

  await db
    .update(messagesTable)
    .set({ read: true })
    .where(
      and(eq(messagesTable.senderClerkId, raw), eq(messagesTable.receiverClerkId, myId)),
    );

  const otherUser = await getUserProfile(raw);
  if (!otherUser) {
    await getOrCreateUser(raw);
    const fallback = await getUserProfile(raw);
    res.json({
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderClerkId,
        receiverId: m.receiverClerkId,
        content: m.content,
        read: m.read,
        createdAt: m.createdAt,
      })),
      otherUser: fallback,
    });
    return;
  }

  res.json({
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.senderClerkId,
      receiverId: m.receiverClerkId,
      content: m.content,
      read: m.read,
      createdAt: m.createdAt,
    })),
    otherUser,
  });
});

router.post("/messages/:otherUserId", requireAuth, async (req: any, res): Promise<void> => {
  const myId = req.clerkUserId;
  const raw = Array.isArray(req.params.otherUserId) ? req.params.otherUserId[0] : req.params.otherUserId;

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await getOrCreateUser(myId);

  const [message] = await db
    .insert(messagesTable)
    .values({
      senderClerkId: myId,
      receiverClerkId: raw,
      content: parsed.data.content,
    })
    .returning();

  res.status(201).json({
    id: message.id,
    senderId: message.senderClerkId,
    receiverId: message.receiverClerkId,
    content: message.content,
    read: message.read,
    createdAt: message.createdAt,
  });
});

export default router;
