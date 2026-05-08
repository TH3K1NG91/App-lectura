import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react";

interface BookReaderProps {
  fileUrl: string;
  fileFormat: string;
  title: string;
  onClose: () => void;
}

function PdfReader({ fileUrl }: { fileUrl: string }) {
  return (
    <iframe
      src={fileUrl}
      className="w-full h-full border-0"
      title="PDF Reader"
    />
  );
}

function EpubReader({ fileUrl, title }: { fileUrl: string; title: string }) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<any>(null);
  const bookRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initEpub() {
      if (!viewerRef.current) return;
      try {
        const Epub = (await import("epubjs")).default;
        if (cancelled) return;

        const book = Epub(fileUrl);
        bookRef.current = book;

        const rendition = book.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          spread: "none",
        });
        renditionRef.current = rendition;

        await rendition.display();
        if (!cancelled) setIsLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError("Failed to load EPUB. The file may be corrupted or unsupported.");
          setIsLoading(false);
        }
      }
    }

    initEpub();

    return () => {
      cancelled = true;
      if (bookRef.current) {
        try { bookRef.current.destroy(); } catch {}
        bookRef.current = null;
        renditionRef.current = null;
      }
    };
  }, [fileUrl]);

  function prevPage() {
    renditionRef.current?.prev();
  }
  function nextPage() {
    renditionRef.current?.next();
  }

  return (
    <div className="flex flex-col h-full">
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="flex-1 flex items-center justify-center text-center px-8">
          <p className="text-muted-foreground">{error}</p>
        </div>
      )}
      <div ref={viewerRef} className="flex-1 min-h-0" style={{ display: isLoading || error ? "none" : "block" }} />
      {!isLoading && !error && (
        <div className="shrink-0 flex items-center justify-between px-6 py-3 border-t border-border bg-card">
          <Button variant="outline" size="sm" onClick={prevPage} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground font-serif">{title}</span>
          <Button variant="outline" size="sm" onClick={nextPage} className="gap-1">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export function BookReader({ fileUrl, fileFormat, title, onClose }: BookReaderProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card shadow-sm">
        <h2 className="font-serif font-semibold text-base truncate max-w-[60%]">{title}</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5 shrink-0">
          <X className="h-4 w-4" /> Close Reader
        </Button>
      </div>
      <div className="flex-1 min-h-0">
        {fileFormat === "epub" ? (
          <EpubReader fileUrl={fileUrl} title={title} />
        ) : (
          <PdfReader fileUrl={fileUrl} />
        )}
      </div>
    </div>
  );
}
