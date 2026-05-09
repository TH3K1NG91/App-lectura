/**
 * Gutenberg Spanish Book Import Script
 *
 * Fetches Spanish-language public domain books from the Gutendex API
 * (https://gutendex.com) and inserts them into the Lumina database.
 *
 * Usage:
 *   pnpm tsx scripts/import-gutenberg.ts [--limit 50] [--pages 3]
 *
 * The script creates a system user (clerkId: "system_lumina") if it doesn't exist,
 * then imports books linking to Gutenberg's hosted EPUB/text files via the
 * /api/proxy/file route so they can be read online.
 */

import { db, usersTable, booksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const SYSTEM_CLERK_ID = "system_gutenberg";
const SYSTEM_USERNAME = "gutenberg_library";

const args = process.argv.slice(2);
function getArg(name: string, def: number): number {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return parseInt(args[idx + 1], 10);
  return def;
}

const LIMIT = getArg("--limit", 32);
const PAGES = getArg("--pages", 3);

interface GutendexBook {
  id: number;
  title: string;
  authors: { name: string; birth_year?: number; death_year?: number }[];
  subjects: string[];
  bookshelves: string[];
  languages: string[];
  formats: Record<string, string>;
  download_count: number;
}

interface GutendexResponse {
  count: number;
  next: string | null;
  results: GutendexBook[];
}

function bestFormat(formats: Record<string, string>): { url: string; format: "epub" | "pdf" } | null {
  const epubUrl = formats["application/epub+zip"] || formats["application/epub"];
  if (epubUrl && !epubUrl.endsWith(".images")) return { url: epubUrl, format: "epub" };
  const pdfUrl = formats["application/pdf"];
  if (pdfUrl) return { url: pdfUrl, format: "pdf" };
  return null;
}

function bestCover(formats: Record<string, string>): string | null {
  return formats["image/jpeg"] || formats["image/png"] || null;
}

function inferGenre(subjects: string[], bookshelves: string[]): string | null {
  const all = [...subjects, ...bookshelves].map((s) => s.toLowerCase());
  if (all.some((s) => s.includes("fiction") || s.includes("novel"))) return "Fiction";
  if (all.some((s) => s.includes("histori"))) return "Historical Fiction";
  if (all.some((s) => s.includes("poet") || s.includes("verse"))) return "Poetry";
  if (all.some((s) => s.includes("drama") || s.includes("play"))) return "Drama";
  if (all.some((s) => s.includes("adventure"))) return "Adventure";
  if (all.some((s) => s.includes("myster") || s.includes("detect"))) return "Mystery";
  if (all.some((s) => s.includes("biograph") || s.includes("memoir"))) return "Biography";
  if (all.some((s) => s.includes("scienc") && s.includes("fiction"))) return "Science Fiction";
  if (all.some((s) => s.includes("romance"))) return "Romance";
  return "Classic Literature";
}

async function getOrCreateSystemUser() {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, SYSTEM_CLERK_ID));

  if (existing) return existing;

  console.log("Creating system user...");
  const [created] = await db
    .insert(usersTable)
    .values({
      clerkId: SYSTEM_CLERK_ID,
      username: SYSTEM_USERNAME,
      displayName: "Proyecto Gutenberg",
      bio: "Libros de dominio público del Proyecto Gutenberg. Gratis para todos.",
    })
    .returning();
  console.log(`Created system user: ${created.username} (id=${created.id})`);
  return created;
}

async function fetchGutendexPage(page: number): Promise<GutendexBook[]> {
  const url = `https://gutendex.com/books/?languages=es&page=${page}`;
  console.log(`Fetching: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gutendex returned ${res.status}`);
  const data = (await res.json()) as GutendexResponse;
  return data.results;
}

async function bookExists(gutenbergId: number): Promise<boolean> {
  const [existing] = await db
    .select({ id: booksTable.id })
    .from(booksTable)
    .where(
      and(
        eq(booksTable.authorClerkId, SYSTEM_CLERK_ID),
        eq(booksTable.title, `[GB-${gutenbergId}]`),
      ),
    );
  return !!existing;
}

async function importBook(book: GutendexBook, systemClerkId: string): Promise<boolean> {
  const file = bestFormat(book.formats);
  if (!file) {
    console.log(`  Skip "${book.title}": no usable format`);
    return false;
  }

  const authorName = book.authors.map((a) => a.name).join(", ") || "Unknown";
  const cover = bestCover(book.formats);
  const genre = inferGenre(book.subjects, book.bookshelves);

  const description =
    book.subjects.slice(0, 4).join("; ") ||
    `Libro de dominio público de ${authorName}. Descargado de Proyecto Gutenberg.`;

  const [inserted] = await db
    .insert(booksTable)
    .values({
      title: book.title.slice(0, 200),
      description: description.slice(0, 1000),
      genre,
      authorClerkId: systemClerkId,
      fileObjectPath: file.url,
      fileFormat: file.format,
      coverObjectPath: cover,
      isPublic: true,
    })
    .returning();

  console.log(`  Imported [${inserted.id}] "${inserted.title}" (${file.format}) by ${authorName}`);
  return true;
}

async function main() {
  console.log(`\nLumina — Gutenberg Spanish Book Import`);
  console.log(`Pages: ${PAGES}, Books per page: ~32, Max imports: ${LIMIT}\n`);

  const systemUser = await getOrCreateSystemUser();
  let imported = 0;
  let skipped = 0;

  for (let page = 1; page <= PAGES && imported < LIMIT; page++) {
    const books = await fetchGutendexPage(page);
    console.log(`\nPage ${page}: ${books.length} books`);

    for (const book of books) {
      if (imported >= LIMIT) break;
      console.log(`Processing: "${book.title}"`);
      try {
        const ok = await importBook(book, systemUser.clerkId);
        if (ok) imported++;
        else skipped++;
      } catch (err) {
        console.error(`  Error importing "${book.title}":`, err);
        skipped++;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  console.log(`\nDone! Imported: ${imported}, Skipped: ${skipped}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
