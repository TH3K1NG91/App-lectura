import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Sparkles, Check } from "lucide-react";

const GENRES = [
  "Fiction", "Classic Literature", "Non-Fiction", "Fantasy", "Romance",
  "Mystery", "Science Fiction", "Biography", "History", "Adventure",
  "Poetry", "Drama", "Historical Fiction", "Self-Help",
];

interface GenreQuizProps {
  onComplete: (genres: string[]) => void;
  onSkip: () => void;
}

export function GenreQuiz({ onComplete, onSkip }: GenreQuizProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(genre: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(genre)) next.delete(genre);
      else next.add(genre);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-8 flex flex-col gap-6 max-h-[90dvh] overflow-y-auto">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mb-4">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-foreground">{t("quiz.title")}</h2>
          <p className="text-muted-foreground text-sm mt-2">{t("quiz.subtitle")}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {GENRES.map((genre) => {
            const active = selected.has(genre);
            return (
              <button
                key={genre}
                onClick={() => toggle(genre)}
                className={`relative flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left ${
                  active
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-accent"
                }`}
              >
                <div className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${active ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                  {active && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
                {genre}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            disabled={selected.size === 0}
            onClick={() => onComplete(Array.from(selected))}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t("quiz.confirm")}
          </Button>
          <Button variant="ghost" onClick={onSkip} className="shrink-0 text-muted-foreground">
            {t("quiz.skip")}
          </Button>
        </div>

        {selected.size > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            {selected.size} género{selected.size !== 1 ? "s" : ""} seleccionado{selected.size !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
