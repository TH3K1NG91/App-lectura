import { useState } from "react";
import { Link } from "wouter";
import { useListPublicBooks } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Download, MessageCircle, BookOpen, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { coverUrl } from "@/lib/cover-url";

const GENRES = [
  "All", "Fiction", "Classic Literature", "Non-Fiction", "Fantasy", "Romance",
  "Mystery", "Science Fiction", "Biography", "History", "Adventure", "Poetry",
  "Drama", "Historical Fiction", "Self-Help",
];

type Tab = "books" | "people";

function useUserSearch(q: string) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (query: string) => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.users || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  return { results, loading, search };
}

export default function Browse() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("books");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const { results: userResults, loading: usersLoading, search: searchUsers } = useUserSearch("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    const t = setTimeout(() => {
      setDebouncedSearch(value);
      if (tab === "people") searchUsers(value);
    }, 400);
    return () => clearTimeout(t);
  };

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    if (newTab === "people" && search) searchUsers(search);
  };

  const { data, isLoading } = useListPublicBooks({
    search: tab === "books" ? (debouncedSearch || undefined) : undefined,
    genre: tab === "books" && selectedGenre !== "All" ? selectedGenre : undefined,
    limit: 50,
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">{t("browse.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("browse.subtitle")}</p>
        </div>
        <div className="w-full md:w-auto flex items-center relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={tab === "books" ? t("browse.searchPlaceholder") : t("browse.searchPeople")}
            className="pl-9 w-full md:w-80 bg-card"
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-0">
        <button
          onClick={() => handleTabChange("books")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === "books"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          {t("browse.books")}
        </button>
        <button
          onClick={() => handleTabChange("people")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            tab === "people"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          {t("browse.people")}
        </button>
      </div>

      {/* Books Tab */}
      {tab === "books" && (
        <>
          <div className="flex overflow-x-auto pb-4 mb-6 gap-2 hide-scrollbar">
            {GENRES.map((genre) => (
              <Button
                key={genre}
                variant={selectedGenre === genre ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGenre(genre)}
                className={`whitespace-nowrap rounded-full ${selectedGenre === genre ? "bg-primary text-primary-foreground" : ""}`}
              >
                {genre === "All" ? t("browse.allGenres") : genre}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <Skeleton className="aspect-[2/3] w-full rounded-md" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : (data?.books?.length ?? 0) === 0 ? (
            <div className="py-20 text-center flex flex-col items-center bg-card/50 rounded-xl border border-border border-dashed">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">{t("browse.noResults")}</h3>
              <p className="text-muted-foreground">{t("browse.noResultsHint")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
              {data?.books.map((book) => (
                <Link key={book.id} href={`/book/${book.id}`}>
                  <div className="group cursor-pointer flex flex-col h-full">
                    <div className="relative aspect-[2/3] mb-3 overflow-hidden rounded-md border border-border shadow-sm group-hover:shadow-md transition-all duration-300">
                      {book.coverObjectPath ? (
                        <img
                          src={coverUrl(book.coverObjectPath)!}
                          alt={`Cover of ${book.title}`}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-card flex flex-col items-center justify-center p-4 text-center group-hover:bg-accent transition-colors">
                          <BookOpen className="h-8 w-8 text-primary/50 mb-2" />
                          <span className="font-serif font-bold text-foreground text-sm line-clamp-3 leading-snug">
                            {book.title}
                          </span>
                        </div>
                      )}
                      {book.genre && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm hover:bg-background/90 text-xs">
                            {book.genre}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1">
                      <h3 className="font-bold text-foreground leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors text-sm">
                        {book.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                        {t("book.by")} {book.authorName}
                      </p>
                      <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />{book.downloadCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />{book.commentCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* People Tab */}
      {tab === "people" && (
        <div>
          {!search && (
            <div className="py-20 text-center flex flex-col items-center text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-30" />
              <p>{t("browse.searchPeople")}</p>
            </div>
          )}
          {search && usersLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          )}
          {search && !usersLoading && userResults.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center bg-card/50 rounded-xl border border-border border-dashed">
              <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">{t("browse.noPeople")}</p>
            </div>
          )}
          {userResults.length > 0 && (
            <div className="space-y-2">
              {userResults.map((u: any) => (
                <Link key={u.clerkId} href={`/profile/${u.clerkId}`}>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={u.avatarUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {(u.displayName || u.username || "?").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{u.displayName || u.username}</p>
                      <p className="text-sm text-muted-foreground">@{u.username}</p>
                      {u.bio && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{u.bio}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-foreground">{u.bookCount}</p>
                      <p className="text-xs text-muted-foreground">libros</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
