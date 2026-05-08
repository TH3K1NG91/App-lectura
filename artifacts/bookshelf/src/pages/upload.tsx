import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useCreateBook, useRequestUploadUrl, getListPublicBooksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, BookOpen, X, FileText, ImagePlus } from "lucide-react";

const GENRES = ["Fiction", "Non-Fiction", "Fantasy", "Romance", "Mystery", "Sci-Fi", "Biography", "History", "Self-Help"];

async function uploadFile(
  file: File,
  requestUploadUrl: (data: { name: string; size: number; contentType: string }) => Promise<{ uploadURL: string; objectPath: string }>,
): Promise<string> {
  const { uploadURL, objectPath } = await requestUploadUrl({
    name: file.name,
    size: file.size,
    contentType: file.type,
  });
  await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  return objectPath;
}

export default function Upload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bookFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const createBook = useCreateBook();
  const requestUploadUrl = useRequestUploadUrl();

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  }

  function handleBookFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBookFile(file);
  }

  function removeCover() {
    setCoverFile(null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
    if (coverFileRef.current) coverFileRef.current.value = "";
  }

  function getFileFormat(file: File): string {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "epub") return "epub";
    return "pdf";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bookFile || !title.trim()) return;

    setIsSubmitting(true);
    try {
      const doRequest = (data: { name: string; size: number; contentType: string }) =>
        new Promise<{ uploadURL: string; objectPath: string }>((resolve, reject) => {
          requestUploadUrl.mutate(
            { data },
            { onSuccess: (r: any) => resolve(r), onError: reject },
          );
        });

      const fileObjectPath = await uploadFile(bookFile, doRequest);

      let coverObjectPath: string | undefined;
      if (coverFile) {
        coverObjectPath = await uploadFile(coverFile, doRequest);
      }

      const fileFormat = getFileFormat(bookFile);

      await new Promise<void>((resolve, reject) => {
        createBook.mutate(
          {
            data: {
              title: title.trim(),
              description: description.trim() || undefined,
              genre: genre || undefined,
              isPublic,
              fileObjectPath,
              fileFormat,
              coverObjectPath,
            },
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getListPublicBooksQueryKey() });
              queryClient.invalidateQueries({ queryKey: ["/api/users"] });
              toast({ title: "Book uploaded successfully!" });
              setLocation("/profile/me");
              resolve();
            },
            onError: () => {
              toast({ title: "Failed to create book entry", variant: "destructive" });
              reject();
            },
          },
        );
      });
    } catch {
      toast({ title: "Upload failed. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Upload a Book</h1>
        <p className="text-muted-foreground mt-1">Share your story with the community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Image */}
        <div className="space-y-2">
          <Label>Cover Image (optional)</Label>
          <div
            className="relative aspect-[2/3] w-40 rounded-xl overflow-hidden border-2 border-dashed border-border bg-card cursor-pointer hover:border-primary/50 transition-colors group"
            onClick={() => coverFileRef.current?.click()}
          >
            {coverPreview ? (
              <>
                <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeCover(); }}
                  className="absolute top-2 right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2 p-4 text-center">
                <ImagePlus className="h-8 w-8 opacity-40" />
                <span className="text-xs leading-tight">Click to add cover</span>
              </div>
            )}
          </div>
          <input
            ref={coverFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverChange}
          />
        </div>

        {/* Book File */}
        <div className="space-y-2">
          <Label htmlFor="book-file">
            Book File <span className="text-destructive">*</span>
          </Label>
          <div
            className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${
              bookFile ? "border-primary/50 bg-primary/5" : "border-border bg-card hover:border-primary/40"
            }`}
            onClick={() => bookFileRef.current?.click()}
          >
            {bookFile ? (
              <>
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-center">
                  <p className="font-medium text-sm">{bookFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {(bookFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setBookFile(null); if (bookFileRef.current) bookFileRef.current.value = ""; }}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <UploadCloud className="h-10 w-10 text-muted-foreground opacity-50" />
                <div className="text-center">
                  <p className="font-medium text-sm text-muted-foreground">Click to upload PDF or EPUB</p>
                  <p className="text-xs text-muted-foreground mt-1">Supported: .pdf, .epub</p>
                </div>
              </>
            )}
          </div>
          <input
            ref={bookFileRef}
            type="file"
            accept=".pdf,.epub"
            className="hidden"
            onChange={handleBookFileChange}
          />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title"
            placeholder="Enter book title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-card"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="What is your book about? Give readers a taste..."
            className="resize-none bg-card"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Genre */}
        <div className="space-y-2">
          <Label>Genre</Label>
          <Select value={genre} onValueChange={setGenre}>
            <SelectTrigger className="bg-card">
              <SelectValue placeholder="Select a genre..." />
            </SelectTrigger>
            <SelectContent>
              {GENRES.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
          <div>
            <p className="font-medium text-sm">Make this book public</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isPublic ? "Anyone can browse and download your book." : "Only you can see this book."}
            </p>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={!bookFile || !title.trim() || isSubmitting}
            className="flex-1 gap-2"
          >
            <BookOpen className="h-4 w-4" />
            {isSubmitting ? "Uploading..." : "Publish Book"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setLocation("/browse")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
