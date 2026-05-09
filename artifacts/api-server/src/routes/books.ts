import { Router, type IRouter } from "express";
import { eq, and, desc, ilike, sql, or } from "drizzle-orm";
import {
  db,
  booksTable,
  usersTable,
  libraryTable,
  commentsTable,
} from "@workspace/db";
import {
  CreateBookBody,
  UpdateBookBody,
  ListPublicBooksQueryParams,
  GetTrendingBooksQueryParams,
  GetUserBooksQueryParams,
} from "@workspace/api-zod";
import {
  requireAuth,
  optionalAuth,
  getOrCreateUser,
  buildAvatarUrl,
} from "./users";

const router: IRouter = Router();

async function buildBook(
  book: typeof booksTable.$inferSelect,
  currentClerkId?: string,
): Promise<object> {
  const [author] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, book.authorClerkId));

  const [{ count: commentCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(commentsTable)
    .where(eq(commentsTable.bookId, book.id));

  let inLibrary = false;
  if (currentClerkId) {
    const [libEntry] = await db
      .select()
      .from(libraryTable)
      .where(
        and(
          eq(libraryTable.userClerkId, currentClerkId),
          eq(libraryTable.bookId, book.id),
        ),
      );
    inLibrary = !!libEntry;
  }

  return {
    id: book.id,
    title: book.title,
    description: book.description,
    genre: book.genre,
    authorId: book.authorClerkId,
    authorName: author?.displayName || author?.username || "Unknown",
    coverObjectPath: book.coverObjectPath,
    fileObjectPath: book.fileObjectPath,
    fileFormat: book.fileFormat,
    isPublic: book.isPublic,
    downloadCount: book.downloadCount,
    commentCount: commentCount ?? 0,
    inLibrary,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };
}

router.get("/books", optionalAuth, async (req: any, res): Promise<void> => {
  const parsed = ListPublicBooksQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : { limit: 20, offset: 0 };
  const auth = req.clerkUserId;

  let query = db
    .select()
    .from(booksTable)
    .where(eq(booksTable.isPublic, true))
    .$dynamic();

  if (params.search) {
    query = query.where(
      and(
        eq(booksTable.isPublic, true),
        or(
          ilike(booksTable.title, `%${params.search}%`),
          ilike(booksTable.description, `%${params.search}%`),
        ),
      ),
    );
  }

  if (params.genre) {
    query = query.where(
      and(eq(booksTable.isPublic, true), eq(booksTable.genre, params.genre)),
    );
  }

  const allBooks = await query
    .orderBy(desc(booksTable.createdAt))
    .limit(params.limit ?? 20)
    .offset(params.offset ?? 0);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(booksTable)
    .where(eq(booksTable.isPublic, true));

  const books = await Promise.all(allBooks.map((b) => buildBook(b, auth)));
  res.json({ books, total: total ?? 0 });
});

router.get(
  "/books/trending",
  optionalAuth,
  async (req: any, res): Promise<void> => {
    const parsed = GetTrendingBooksQueryParams.safeParse(req.query);
    const limit = parsed.success ? (parsed.data.limit ?? 10) : 10;

    const trending = await db
      .select()
      .from(booksTable)
      .where(eq(booksTable.isPublic, true))
      .orderBy(desc(booksTable.downloadCount), desc(booksTable.createdAt))
      .limit(limit);

    const books = await Promise.all(
      trending.map((b) => buildBook(b, req.clerkUserId)),
    );
    res.json({ books, total: books.length });
  },
);

router.get(
  "/books/:bookId",
  optionalAuth,
  async (req: any, res): Promise<void> => {
    const raw = Array.isArray(req.params.bookId)
      ? req.params.bookId[0]
      : req.params.bookId;
    const bookId = parseInt(raw, 10);

    const [book] = await db
      .select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId));

    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }

    if (!book.isPublic && book.authorClerkId !== req.clerkUserId) {
      res.status(404).json({ error: "Book not found" });
      return;
    }

    const built = await buildBook(book, req.clerkUserId);
    res.json(built);
  },
);

router.post("/books", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = CreateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await getOrCreateUser(req.clerkUserId);

  const [book] = await db
    .insert(booksTable)
    .values({
      title: parsed.data.title,
      description: parsed.data.description,
      genre: parsed.data.genre,
      authorClerkId: req.clerkUserId,
      coverObjectPath: parsed.data.coverObjectPath,
      fileObjectPath: parsed.data.fileObjectPath,
      fileFormat: parsed.data.fileFormat,
      isPublic: parsed.data.isPublic ?? true,
    })
    .returning();

  const built = await buildBook(book, req.clerkUserId);
  res.status(201).json(built);
});

router.patch(
  "/books/:bookId",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const raw = Array.isArray(req.params.bookId)
      ? req.params.bookId[0]
      : req.params.bookId;
    const bookId = parseInt(raw, 10);

    const parsed = UpdateBookBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const [book] = await db
      .select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId));

    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }

    if (book.authorClerkId !== req.clerkUserId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const updates: Partial<typeof booksTable.$inferInsert> = {};
    if (parsed.data.title != null) updates.title = parsed.data.title;
    if (parsed.data.description != null)
      updates.description = parsed.data.description;
    if (parsed.data.genre != null) updates.genre = parsed.data.genre;
    if (parsed.data.coverObjectPath != null)
      updates.coverObjectPath = parsed.data.coverObjectPath;
    if (parsed.data.isPublic != null) updates.isPublic = parsed.data.isPublic;
    if (parsed.data.fileObjectPath != null)
      updates.fileObjectPath = parsed.data.fileObjectPath;
    if (parsed.data.fileFormat != null)
      updates.fileFormat = parsed.data.fileFormat;

    const [updated] = await db
      .update(booksTable)
      .set(updates)
      .where(eq(booksTable.id, bookId))
      .returning();

    const built = await buildBook(updated, req.clerkUserId);
    res.json(built);
  },
);

router.delete(
  "/books/:bookId",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const raw = Array.isArray(req.params.bookId)
      ? req.params.bookId[0]
      : req.params.bookId;
    const bookId = parseInt(raw, 10);

    const [book] = await db
      .select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId));

    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }

    if (book.authorClerkId !== req.clerkUserId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db.delete(booksTable).where(eq(booksTable.id, bookId));
    res.sendStatus(204);
  },
);

router.post(
  "/books/:bookId/download",
  optionalAuth,
  async (req: any, res): Promise<void> => {
    const raw = Array.isArray(req.params.bookId)
      ? req.params.bookId[0]
      : req.params.bookId;
    const bookId = parseInt(raw, 10);

    const [book] = await db
      .select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId));

    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }

    if (!book.isPublic && book.authorClerkId !== req.clerkUserId) {
      res.status(404).json({ error: "Book not found" });
      return;
    }

    await db
      .update(booksTable)
      .set({ downloadCount: book.downloadCount + 1 })
      .where(eq(booksTable.id, bookId));

    const fileUrl = book.fileObjectPath.startsWith("http")
      ? book.fileObjectPath
      : `/api/storage/objects${book.fileObjectPath.replace(/^\/objects/, "")}`;
    res.json({ fileUrl });
  },
);

router.get(
  "/users/:userId/books",
  optionalAuth,
  async (req: any, res): Promise<void> => {
    const raw = Array.isArray(req.params.userId)
      ? req.params.userId[0]
      : req.params.userId;
    const parsed = GetUserBooksQueryParams.safeParse(req.query);
    const includePrivate = parsed.success
      ? (parsed.data.includePrivate ?? false)
      : false;

    const isOwnProfile = req.clerkUserId === raw;
    const showPrivate = includePrivate && isOwnProfile;

    let userBooks;
    if (showPrivate) {
      userBooks = await db
        .select()
        .from(booksTable)
        .where(eq(booksTable.authorClerkId, raw))
        .orderBy(desc(booksTable.createdAt));
    } else {
      userBooks = await db
        .select()
        .from(booksTable)
        .where(
          and(eq(booksTable.authorClerkId, raw), eq(booksTable.isPublic, true)),
        )
        .orderBy(desc(booksTable.createdAt));
    }

    const books = await Promise.all(
      userBooks.map((b) => buildBook(b, req.clerkUserId)),
    );
    res.json({ books, total: books.length });
  },
);

export default router;
