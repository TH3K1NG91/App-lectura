import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db, commentsTable, booksTable, usersTable } from "@workspace/db";
import { CreateCommentBody } from "@workspace/api-zod";
import { requireAuth, getOrCreateUser, buildAvatarUrl } from "./users";

const router: IRouter = Router();

router.get("/books/:bookId/comments", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.bookId) ? req.params.bookId[0] : req.params.bookId;
  const bookId = parseInt(raw, 10);

  const rows = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.bookId, bookId))
    .orderBy(asc(commentsTable.createdAt));

  const comments = await Promise.all(
    rows.map(async (c) => {
      const [author] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.clerkId, c.authorClerkId));
      return {
        id: c.id,
        bookId: c.bookId,
        authorId: c.authorClerkId,
        authorName: author?.displayName || author?.username || "Unknown",
        authorAvatarUrl: author ? buildAvatarUrl(author) : null,
        content: c.content,
        createdAt: c.createdAt,
      };
    }),
  );

  res.json({ comments });
});

router.post(
  "/books/:bookId/comments",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const raw = Array.isArray(req.params.bookId) ? req.params.bookId[0] : req.params.bookId;
    const bookId = parseInt(raw, 10);

    const parsed = CreateCommentBody.safeParse(req.body);
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

    await getOrCreateUser(req.clerkUserId);

    const [comment] = await db
      .insert(commentsTable)
      .values({
        bookId,
        authorClerkId: req.clerkUserId,
        content: parsed.data.content,
      })
      .returning();

    const [author] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, req.clerkUserId));

    res.status(201).json({
      id: comment.id,
      bookId: comment.bookId,
      authorId: comment.authorClerkId,
      authorName: author?.displayName || author?.username || "Unknown",
      authorAvatarUrl: author ? buildAvatarUrl(author) : null,
      content: comment.content,
      createdAt: comment.createdAt,
    });
  },
);

router.delete(
  "/books/:bookId/comments/:commentId",
  requireAuth,
  async (req: any, res): Promise<void> => {
    const rawBook = Array.isArray(req.params.bookId) ? req.params.bookId[0] : req.params.bookId;
    const rawComment = Array.isArray(req.params.commentId) ? req.params.commentId[0] : req.params.commentId;
    const bookId = parseInt(rawBook, 10);
    const commentId = parseInt(rawComment, 10);

    const [comment] = await db
      .select()
      .from(commentsTable)
      .where(and(eq(commentsTable.id, commentId), eq(commentsTable.bookId, bookId)));

    if (!comment) {
      res.status(404).json({ error: "Comment not found" });
      return;
    }

    const [book] = await db
      .select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId));

    const isAuthor = comment.authorClerkId === req.clerkUserId;
    const isBookOwner = book?.authorClerkId === req.clerkUserId;

    if (!isAuthor && !isBookOwner) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db.delete(commentsTable).where(eq(commentsTable.id, commentId));
    res.sendStatus(204);
  },
);

export default router;
