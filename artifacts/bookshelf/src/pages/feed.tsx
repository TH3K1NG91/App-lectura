import { useRef, useState } from "react";
import { Link } from "wouter";
import { useGetMe, useListPublicBooks, useGetTrendingBooks, useUpdateMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Download, MessageCircle, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { coverUrl } from "@/lib/cover-url";
import { GenreQuiz } from "@/components/genre-quiz";
import { useQueryClient } from "@tanstack/react-query";

function BookCard({ book }: { book: any }) {
  return (
    <Link href={`/book/${book.id}`}>
      <div className="group cursor-pointer shrink-0 w-36 sm:w-44 flex flex-col">
        <div className="relative aspect-[2/3] mb-2 overflow-hidden rounded-lg border border-border shadow-sm group-hover:shadow-md transition-all duration-300">
          {book.coverObjectPath ? (
            <img
              src={coverUrl(book.coverObjectPath)!}
              alt={book.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-card flex flex-col items-center justify-center p-3 text-center group-hover:bg-accent transition-colors">
              <BookOpen className="h-6 w-6 text-primary/50 mb-1.5" />
              <span className="font-serif font-bold text-foreground text-xs line-clamp-3 leading-snug">{book.title}</span>
            </div>
          )}
          {book.genre && (
            <div className="absolute top-1.5 left-1.5">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs py-0">{book.genre}</Badge>
            </div>
          )}
        </div>
        <h3 className="font-semibold text-foreground leading-tight line-clamp-2 text-xs group-hover:text-primary transition-colors">{book.title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">by {book.authorName}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5"><Download className="h-2.5 w-2.5" />{book.downloadCount}</span>
          <span className="flex items-center gap-0.5"><MessageCircle className="h-2.5 w-2.5" />{book.commentCount || 0}</span>
        </div>
      </div>
    </Link>
  );
}

function BookCarousel({ title, subtitle, genre }: { title: string; subtitle?: string; genre?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useListPublicBooks({ genre, limit: 20 });

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  }

  if (!isLoading && (!data?.books || data.books.length === 0)) return null;

  return (
    <section className="mb-12">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll("left")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll("right")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3 hide-scrollbar scroll-smooth"
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shrink-0 w-36 sm:w-44">
                <Skeleton className="aspect-[2/3] w-full rounded-lg mb-2" />
                <Skeleton className="h-3 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          : data?.books.map((book: any) => <BookCard key={book.id} book={book} />)
        }
      </div>
    </section>
  );
}

function TrendingCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useGetTrendingBooks({ limit: 20 });

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  }

  if (!isLoading && (!data?.books || data.books.length === 0)) return null;

  return (
    <section className="mb-12">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            En tendencia
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Los más descargados ahora</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll("left")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll("right")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-3 hide-scrollbar scroll-smooth">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shrink-0 w-36 sm:w-44">
                <Skeleton className="aspect-[2/3] w-full rounded-lg mb-2" />
                <Skeleton className="h-3 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          : (data?.books || []).map((book: any) => <BookCard key={book.id} book={book} />)
        }
      </div>
    </section>
  );
}

export default function Feed() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: me, isLoading: meLoading } = useGetMe();
  const updateMe = useUpdateMe();
  const [showQuiz, setShowQuiz] = useState(false);

  const genrePrefs: string[] = (me as any)?.genrePreferences || [];

  async function handleQuizComplete(genres: string[]) {
    updateMe.mutate(
      { data: { genrePreferences: genres } as any },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["getMe"] });
          setShowQuiz(false);
        },
      },
    );
  }

  if (meLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-10" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="mb-12">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="flex gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="shrink-0 w-36">
                  <Skeleton className="aspect-[2/3] w-full rounded-lg mb-2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const displayName = (me as any)?.displayName || (me as any)?.username || "lector";

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {showQuiz && (
        <GenreQuiz
          onComplete={handleQuizComplete}
          onSkip={() => setShowQuiz(false)}
        />
      )}

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
          ¡Hola, {displayName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">{t("feed.subtitle")}</p>
      </div>

      {/* Trending always first */}
      <TrendingCarousel />

      {/* Genre-based carousels */}
      {genrePrefs.length > 0 ? (
        genrePrefs.map((genre) => (
          <BookCarousel
            key={genre}
            title={genre}
            subtitle={`${t("feed.basedOn")} ${genre}`}
            genre={genre}
          />
        ))
      ) : (
        <>
          <BookCarousel title="Ficción" genre="Fiction" />
          <BookCarousel title="Clásicos" genre="Classic Literature" />
          <BookCarousel title="Aventura" genre="Adventure" />
          <BookCarousel title="Fantasía" genre="Fantasy" />
          <BookCarousel title="Misterio" genre="Mystery" />
          <BookCarousel title="Ciencia Ficción" genre="Science Fiction" />

          <div className="mt-8 p-6 rounded-2xl bg-card border border-border border-dashed text-center">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-serif font-bold text-lg mb-2">{t("feed.noPreferences")}</h3>
            <Button
              className="mt-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setShowQuiz(true)}
            >
              {t("feed.setPreferences")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
