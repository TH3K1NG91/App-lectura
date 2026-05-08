import { Router, type IRouter } from "express";
import { and, eq, desc } from "drizzle-orm";
import { db, libraryTable, booksTable, usersTable, commentsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { requireAuth } from "./users";

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
    inLibrary: true,
    createdAt: book.createdAt,
    updatedAt: book.updatedAt,
  };
}

router.get("/library", requireAuth, async (req: any, res): Promise<void> => {
  const entries = await db
    .select()
    .from(libraryTable)
    .where(eq(libraryTable.userClerkId, req.clerkUserId))
    .orderBy(desc(libraryTable.savedAt));

  const result = await Promise.all(
    entries.map(async (entry) => {
      const [book] = await db
        .select()
        .from(booksTable)
        .where(eq(booksTable.id, entry.bookId));

      if (!book) return null;

      const builtBook = await buildBook(book, req.clerkUserId);
      return {
        id: entry.id,
        bookId: entry.bookId,
        userId: entry.userClerkId,
        savedAt: entry.savedAt,
        book: builtBook,
      };
    }),
  );

  res.json({ entries: result.filter(Boolean) });
});

router.post("/library/:bookId", requireAuth, async (req: any, res): Promise<void> => {
  const raw = Array.isArray(req.params.bookId) ? req.params.bookId[0] : req.params.bookId;
  const bookId = parseInt(raw, 10);

  const [existing] = await db
    .select()
    .from(libraryTable)
    .where(
      and(
        eq(libraryTable.userClerkId, req.clerkUserId),
        eq(libraryTable.bookId, bookId),
      ),
    );

  if (existing) {
    res.status(400).json({ error: "Already in library" });
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

  const [entry] = await db
    .insert(libraryTable)
    .values({ userClerkId: req.clerkUserId, bookId })
    .returning();

  const builtBook = await buildBook(book, req.clerkUserId);
  res.status(201).json({
    id: entry.id,
    bookId: entry.bookId,
    userId: entry.userClerkId,
    savedAt: entry.savedAt,
    book: builtBook,
  });
});

router.delete("/library/:bookId", requireAuth, async (req: any, res): Promise<void> => {
  const raw = Array.isArray(req.params.bookId) ? req.params.bookId[0] : req.params.bookId;
  const bookId = parseInt(raw, 10);

  const [existing] = await db
    .select()
    .from(libraryTable)
    .where(
      and(
        eq(libraryTable.userClerkId, req.clerkUserId),
        eq(libraryTable.bookId, bookId),
      ),
    );

  if (!existing) {
    res.status(404).json({ error: "Not in library" });
    return;
  }

  await db
    .delete(libraryTable)
    .where(
      and(
        eq(libraryTable.userClerkId, req.clerkUserId),
        eq(libraryTable.bookId, bookId),
      ),
    );

  res.sendStatus(204);
});

export default router;
