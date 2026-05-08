import { Link } from "wouter";
import { useGetMyLibrary, useRemoveFromLibrary } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Download, Bookmark, BookmarkCheck, MessageCircle } from "lucide-react";

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function Library() {
  const { data, isLoading, refetch } = useGetMyLibrary();
  const removeFromLibrary = useRemoveFromLibrary();
  const { toast } = useToast();

  function handleRemove(bookId: number) {
    removeFromLibrary.mutate(
      { bookId },
      {
        onSuccess: () => {
          refetch();
          toast({ title: "Removed from library" });
        },
        onError: () => toast({ title: "Failed to remove", variant: "destructive" }),
      },
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">My Library</h1>
        <p className="text-muted-foreground mt-1">Books you have saved for later</p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 bg-card rounded-xl border border-border">
              <Skeleton className="w-20 shrink-0 aspect-[2/3] rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && data?.entries.length === 0 && (
        <div className="py-20 text-center flex flex-col items-center bg-card/50 rounded-xl border border-dashed border-border">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
          <h3 className="text-xl font-bold mb-2">Your library is empty</h3>
          <p className="text-muted-foreground mb-6">Start browsing and save books to your collection.</p>
          <Link href="/browse">
            <Button>Browse Books</Button>
          </Link>
        </div>
      )}

      {!isLoading && (data?.entries.length ?? 0) > 0 && (
        <div className="space-y-4">
          {data?.entries.map((entry: any) => {
            const book = entry.book;
            return (
              <div
                key={entry.id}
                className="flex gap-4 md:gap-6 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors group"
              >
                <Link href={`/book/${book.id}`} className="shrink-0">
                  <div className="w-16 md:w-20 aspect-[2/3] rounded-md overflow-hidden border border-border bg-amber-50">
                    {book.coverObjectPath ? (
                      <img
                        src={`/api/storage/objects${book.coverObjectPath.replace(/^\/objects/, "")}`}
                        alt={`Cover of ${book.title}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-amber-50 to-amber-100">
                        <BookOpen className="h-6 w-6 text-amber-300" />
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/book/${book.id}`}>
                        <h3 className="font-bold text-foreground leading-snug hover:text-primary transition-colors line-clamp-2 mb-1">
                          {book.title}
                        </h3>
                      </Link>
                      <Link href={`/profile/${book.authorId}`} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        by {book.authorName}
                      </Link>
                    </div>

                    <button
                      onClick={() => handleRemove(book.id)}
                      disabled={removeFromLibrary.isPending}
                      className="shrink-0 text-primary hover:text-destructive transition-colors mt-0.5"
                      title="Remove from library"
                    >
                      <BookmarkCheck className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-auto pt-3">
                    {book.genre && <Badge variant="secondary" className="text-xs">{book.genre}</Badge>}
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">{book.fileFormat}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Download className="h-3 w-3" /> {book.downloadCount}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> {book.commentCount ?? 0}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Saved {formatDate(entry.savedAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
