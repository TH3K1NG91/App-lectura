import { Link } from "wouter";
import { useGetUserProfile, useGetUserBooks } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, Download, MessageCircle, MessageSquare, CalendarDays } from "lucide-react";

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long" });
}

export default function Profile({ userId }: { userId: string }) {
  const { data: user, isLoading: userLoading } = useGetUserProfile(userId);
  const { data: booksData, isLoading: booksLoading } = useGetUserBooks(userId);

  if (userLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex gap-6 mb-10">
          <Skeleton className="h-24 w-24 rounded-full shrink-0" />
          <div className="flex-1 space-y-3 pt-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-[2/3] w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <h2 className="text-2xl font-bold mb-2">User not found</h2>
        <p className="text-muted-foreground">This profile doesn't exist or has been removed.</p>
      </div>
    );
  }

  const displayName = user.displayName || user.username;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10 p-6 bg-card rounded-2xl border border-border">
        <Avatar className="h-20 w-20 border-2 border-border">
          <AvatarImage src={user.avatarUrl ?? undefined} />
          <AvatarFallback className="text-2xl bg-amber-100 text-amber-800 font-serif">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-serif font-bold text-foreground">{displayName}</h1>
          <p className="text-muted-foreground text-sm mb-2">@{user.username}</p>
          {user.bio && <p className="text-sm text-foreground/80 leading-relaxed max-w-xl mb-3">{user.bio}</p>}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {user.bookCount} {user.bookCount === 1 ? "book" : "books"}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Joined {formatDate(user.createdAt)}
            </span>
          </div>
        </div>

        <Link href={`/messages/${userId}`}>
          <Button variant="outline" className="gap-2 shrink-0">
            <MessageSquare className="h-4 w-4" />
            Message
          </Button>
        </Link>
      </div>

      {/* Books */}
      <div>
        <h2 className="text-xl font-serif font-bold mb-6 text-foreground">
          Books by {displayName}
        </h2>

        {booksLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-[2/3] w-full rounded-md" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        )}

        {!booksLoading && (booksData?.books.length === 0 || !booksData) && (
          <div className="py-16 text-center bg-card/50 rounded-xl border border-dashed border-border">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">No public books yet.</p>
          </div>
        )}

        {!booksLoading && (booksData?.books.length ?? 0) > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
            {booksData?.books.map((book: any) => (
              <Link key={book.id} href={`/book/${book.id}`}>
                <div className="group cursor-pointer flex flex-col h-full">
                  <div className="relative aspect-[2/3] mb-3 overflow-hidden rounded-md border border-border shadow-sm group-hover:shadow-md transition-all duration-300">
                    {book.coverObjectPath ? (
                      <img
                        src={`/api/storage/objects${book.coverObjectPath.replace(/^\/objects/, "")}`}
                        alt={book.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-amber-50 flex flex-col items-center justify-center p-4 text-center">
                        <BookOpen className="h-8 w-8 text-amber-300 mb-2" />
                        <span className="font-serif font-bold text-amber-900 text-sm line-clamp-3 leading-snug">
                          {book.title}
                        </span>
                      </div>
                    )}
                    {book.genre && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">
                          {book.genre}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-foreground leading-tight line-clamp-2 mb-1 text-sm group-hover:text-primary transition-colors">
                    {book.title}
                  </h3>
                  <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" /> {book.downloadCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> {book.commentCount || 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
