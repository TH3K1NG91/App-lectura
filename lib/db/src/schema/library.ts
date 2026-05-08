import { pgTable, serial, timestamp, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const libraryTable = pgTable("library", {
  id: serial("id").primaryKey(),
  userClerkId: text("user_clerk_id").notNull(),
  bookId: integer("book_id").notNull(),
  savedAt: timestamp("saved_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLibrarySchema = createInsertSchema(libraryTable).omit({
  id: true,
  savedAt: true,
});
export type InsertLibrary = z.infer<typeof insertLibrarySchema>;
export type Library = typeof libraryTable.$inferSelect;
