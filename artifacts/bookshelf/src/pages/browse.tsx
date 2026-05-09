import { useState } from "react";
import { Link } from "wouter";
import { useListPublicBooks } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Download, MessageCircle, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { coverUrl } from "@/lib/cover-url";

const GENRES = ["All", "Fiction", "Classic Literature", "Non-Fiction", "Fantasy", "Romance", "Mystery", "Science Fiction", "Biography", "History", "Adventure", "Poetry", "Drama", "Historical Fiction", "Self-Help"];

export default function Browse() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setTimeout(() => setDebouncedSearch(value), 500);
  };

  const { data, isLoading } = useListPublicBooks({
    search: debouncedSearch || undefined,
    genre: selectedGenre !== "All" ? selectedGenre : undefined,
    limit: 50
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">{t("browse.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("browse.subtitle")}</p>
        </div>
        
        <div className="w-full md:w-auto flex items-center relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder={t("browse.searchPlaceholder")} 
            className="pl-9 w-full md:w-80 bg-card"
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Genre Filter */}
      <div className="flex overflow-x-auto pb-4 mb-6 scrollbar-hide gap-2 hide-scrollbar">
        {GENRES.map((genre) => (
          <Button
            key={genre}
            variant={selectedGenre === genre ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedGenre(genre)}
            className="whitespace-nowrap rounded-full"
          >
            {genre}
          </Button>
        ))}
      </div>

      {/* Books Grid */}
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
          <h3 className="text-xl font-bold mb-2">No books found</h3>
          <p className="text-muted-foreground">Try adjusting your search or selecting a different genre.</p>
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
                    <div className="w-full h-full bg-amber-50 dark:bg-amber-900/20 flex flex-col items-center justify-center p-4 text-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">
                      <BookOpen className="h-8 w-8 text-amber-300 mb-2" />
                      <span className="font-serif font-bold text-amber-900 dark:text-amber-100 text-sm line-clamp-3 leading-snug">
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
                  <h3 className="font-bold text-foreground leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                    by {book.authorName}
                  </p>
                  
                  <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {book.downloadCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {book.commentCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}