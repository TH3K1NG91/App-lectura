import { Router, type IRouter } from "express";
import { eq, sql, ilike, or } from "drizzle-orm";
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
  if (user.avatarObjectPath.startsWith("http")) return user.avatarObjectPath;
  const path = user.avatarObjectPath.replace(/^\/objects/, "");
  return `/api/storage/objects${path}`;
}

function buildBannerUrl(user: typeof usersTable.$inferSelect): string | null {
  if (!user.bannerObjectPath) return null;
  if (user.bannerObjectPath.startsWith("http")) return user.bannerObjectPath;
  const path = user.bannerObjectPath.replace(/^\/objects/, "");
  return `/api/storage/objects${path}`;
}

async function getBookCount(clerkId: string): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(booksTable)
    .where(eq(booksTable.authorClerkId, clerkId));
  return count ?? 0;
}

function serializeUser(user: typeof usersTable.$inferSelect, bookCount: number) {
  return {
    id: user.id,
    clerkId: user.clerkId,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: buildAvatarUrl(user),
    bannerUrl: buildBannerUrl(user),
    bookCount,
    genrePreferences: user.genrePreferences ? JSON.parse(user.genrePreferences) : null,
    createdAt: user.createdAt,
  };
}

router.get("/users/me", requireAuth, async (req: any, res): Promise<void> => {
  const user = await getOrCreateUser(req.clerkUserId);
  const bookCount = await getBookCount(req.clerkUserId);
  res.json(serializeUser(user, bookCount));
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
  if (parsed.data.bannerObjectPath != null) updates.bannerObjectPath = parsed.data.bannerObjectPath;
  if ((parsed.data as any).genrePreferences != null) {
    updates.genrePreferences = JSON.stringify((parsed.data as any).genrePreferences);
  }

  const [updated] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.clerkId, req.clerkUserId))
    .returning();

  const bookCount = await getBookCount(req.clerkUserId);
  res.json(serializeUser(updated, bookCount));
});

router.get("/users/search", async (req, res): Promise<void> => {
  const q = ((req.query.q as string) || "").trim();
  if (!q) {
    res.json({ users: [] });
    return;
  }

  const users = await db
    .select()
    .from(usersTable)
    .where(
      or(
        ilike(usersTable.username, `%${q}%`),
        ilike(usersTable.displayName, `%${q}%`),
      ),
    )
    .limit(20);

  const results = await Promise.all(
    users.map(async (user) => {
      const bookCount = await getBookCount(user.clerkId);
      return serializeUser(user, bookCount);
    }),
  );

  res.json({ users: results });
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
  res.json(serializeUser(user, bookCount));
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
