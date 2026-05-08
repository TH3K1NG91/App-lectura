import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, booksTable } from "@workspace/db";
import { getAuth } from "@clerk/express";
import { UpdateMeBody } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.clerkUserId = userId;
  next();
}

async function getOrCreateUser(clerkId: string) {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));

  if (existing) return existing;

  const username = `user_${clerkId.slice(-8)}`;
  const [created] = await db
    .insert(usersTable)
    .values({ clerkId, username })
    .returning();
  return created;
}

function buildAvatarUrl(user: typeof usersTable.$inferSelect): string | null {
  if (!user.avatarObjectPath) return null;
  return `/api/storage/objects${user.avatarObjectPath}`;
}

async function getBookCount(clerkId: string): Promise<number> {
  const books = await db
    .select({ id: booksTable.id })
    .from(booksTable)
    .where(eq(booksTable.authorClerkId, clerkId));
  return books.length;
}

router.get("/users/me", requireAuth, async (req: any, res): Promise<void> => {
  const user = await getOrCreateUser(req.clerkUserId);
  const bookCount = await getBookCount(req.clerkUserId);
  res.json({
    id: user.id,
    clerkId: user.clerkId,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: buildAvatarUrl(user),
    bookCount,
    createdAt: user.createdAt,
  });
});

router.patch("/users/me", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await getOrCreateUser(req.clerkUserId);

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.username != null) updates.username = parsed.data.username;
  if (parsed.data.displayName != null) updates.displayName = parsed.data.displayName;
  if (parsed.data.bio != null) updates.bio = parsed.data.bio;
  if (parsed.data.avatarObjectPath != null) updates.avatarObjectPath = parsed.data.avatarObjectPath;

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.clerkId, req.clerkUserId))
    .returning();

  const bookCount = await getBookCount(req.clerkUserId);
  res.json({
    id: updated.id,
    clerkId: updated.clerkId,
    username: updated.username,
    displayName: updated.displayName,
    bio: updated.bio,
    avatarUrl: buildAvatarUrl(updated),
    bookCount,
    createdAt: updated.createdAt,
  });
});

router.get("/users/:userId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, raw));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const bookCount = await getBookCount(user.clerkId);
  res.json({
    id: user.id,
    clerkId: user.clerkId,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: buildAvatarUrl(user),
    bookCount,
    createdAt: user.createdAt,
  });
});

function optionalAuth(req: any, _res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (userId) {
    req.clerkUserId = userId;
  }
  next();
}

export { requireAuth, optionalAuth, getOrCreateUser, buildAvatarUrl };
export default router;
