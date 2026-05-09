import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL is required");

const pool = new pg.Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

const SYSTEM_CLERK_ID = "gutenberg_system";
const GUTENDEX_URL = "https://gutendex.com/books";

interface GutendexBook {
  id: number;
  title: string;
  authors: { name: string; birth_year?: number; death_year?: number }[];
  subjects: string[];
  languages: string[];
  formats: Record<string, string>;
  download_count: number;
}

interface GutendexResponse {
  count: number;
  next: string | null;
  results: GutendexBook[];
}

const GENRE_MAP: [string, string][] = [
  ["detective and mystery", "Mystery"],
  ["science fiction", "Science Fiction"],
  ["adventure stories", "Adventure"],
  ["romance", "Romance"],
  ["horror tales", "Horror"],
  ["poetry", "Poetry"],
  ["drama", "Drama"],
  ["history", "History"],
  ["philosophy", "Non-Fiction"],
  ["short stories", "Fiction"],
  ["historical fiction", "Historical Fiction"],
  ["fantasy", "Fantasy"],
  ["biography", "Biography"],
  ["fiction", "Fiction"],
];

function detectGenre(subjects: string[]): string {
  for (const subject of subjects) {
    const lower = subject.toLowerCase();
    for (const [keyword, genre] of GENRE_MAP) {
      if (lower.includes(keyword)) return genre;
    }
  }
  return "Classic Literature";
}

function getEpubUrl(formats: Record<string, string>): string | null {
  return formats["application/epub+zip"] || null;
}

function getCoverUrl(formats: Record<string, string>): string | null {
  return formats["image/jpeg"] || null;
}

async function fetchPage(url: string): Promise<GutendexResponse> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.json() as Promise<GutendexResponse>;
}

async function ensureSystemUser() {
  const existing = await pool.query(
    "SELECT id FROM users WHERE clerk_id = $1 LIMIT 1",
    [SYSTEM_CLERK_ID],
  );
  if (existing.rows.length > 0) {
    console.log("System user already exists");
    return;
  }
  await pool.query(
    "INSERT INTO users (clerk_id, username) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [SYSTEM_CLERK_ID, "project_gutenberg"],
  );
  console.log("Created system user for Project Gutenberg");
}

async function main() {
  console.log("Starting Project Gutenberg import...\n");

  await ensureSystemUser();

  let imported = 0;
  let skipped = 0;
  let pageUrl: string | null = `${GUTENDEX_URL}?languages=en`;

  while (imported < 60 && pageUrl) {
    console.log(`Fetching page: ${pageUrl}`);
    const page = await fetchPage(pageUrl);
    console.log(`  → ${page.results.length} results on this page`);

    for (const book of page.results) {
      if (imported >= 60) break;

      const epubUrl = getEpubUrl(book.formats);
      if (!epubUrl) {
        skipped++;
        continue;
      }

      const coverUrl = getCoverUrl(book.formats);
      const authorName =
        book.authors
          .map((a) => a.name.split(",").reverse().join(" ").trim())
          .join(", ") || "Unknown";
      const genre = detectGenre(book.subjects);
      const description =
        `A classic work by ${authorName}. Originally published in the public domain and available via Project Gutenberg.` +
        (book.subjects.length > 0
          ? ` Subjects: ${book.subjects.slice(0, 3).join("; ")}.`
          : "");

      try {
        await pool.query(
          `INSERT INTO books (title, description, genre, author_clerk_id, cover_object_path, file_object_path, file_format, is_public, download_count)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            book.title.slice(0, 200),
            description,
            genre,
            SYSTEM_CLERK_ID,
            coverUrl,
            epubUrl,
            "epub",
            true,
            Math.min(Math.floor(book.download_count / 100), 9999),
          ],
        );
        imported++;
        console.log(`  [${imported}] ${book.title.slice(0, 70)}`);
      } catch (err: any) {
        console.error(`  ✗ "${book.title.slice(0, 50)}": ${err.message}`);
        skipped++;
      }
    }

    pageUrl = page.next;
  }

  console.log(`\n✓ Done! Imported ${imported} books, skipped ${skipped}.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
