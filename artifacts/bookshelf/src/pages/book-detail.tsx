import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import {
  useGetBook,
  useDownloadBook,
  useAddToLibrary,
  useRemoveFromLibrary,
  useListComments,
  useCreateComment,
  useDeleteComment,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { BookReader } from "@/components/book-reader";
import {
  BookOpen,
  Download,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  Trash2,
  ArrowLeft,
  Lock,
  Send,
} from "lucide-react";

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getFileUrl(objectPath: string | null | undefined): string | null {
  if (!objectPath) return null;
  return `/api/storage/objects${objectPath.replace(/^\/objects/, "")}`;
}

export default function BookDetail({ bookId }: { bookId: string }) {
  const { user, isSignedIn } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [commentText, setCommentText] = useState("");
  const [showReader, setShowReader] = useState(false);

  const bookIdNum = parseInt(bookId, 10);
  const { data: book, isLoading, refetch } = useGetBook(bookIdNum);
  const { data: commentsData, refetch: refetchComments } = useListComments(bookIdNum);

  const download = useDownloadBook();
  const addToLibrary = useAddToLibrary();
  const removeFromLibrary = useRemoveFromLibrary();
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  function handleReadOnline() {
    if (!isSignedIn) {
      setLocation("/sign-in");
      return;
    }
    setShowReader(true);
  }

  function handleDownload() {
    if (!isSignedIn) {
      setLocation("/sign-in");
      return;
    }
    download.mutate(
      { bookId: bookIdNum },
      {
        onSuccess: (result: any) => {
          const fileUrl = result?.fileUrl;
          if (fileUrl) {
            const ext = book?.fileFormat === "epub" ? ".epub" : ".pdf";
            const a = document.createElement("a");
            a.href = fileUrl;
            a.download = `${book?.title || "book"}${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
          toast({ title: "Download started" });
          refetch();
        },
        onError: (err: any) => {
          const msg = err?.data?.error || "Download failed. Please try again.";
          toast({ title: msg, variant: "destructive" });
        },
      },
    );
  }

  function handleLibraryToggle() {
    if (!isSignedIn) {
      setLocation("/sign-in");
      return;
    }
    if (book?.inLibrary) {
      removeFromLibrary.mutate(
        { bookId: bookIdNum },
        {
          onSuccess: () => {
            refetch();
            toast({ title: "Removed from library" });
          },
          onError: (err: any) => {
            const msg = err?.data?.error || "Could not remove from library.";
            toast({ title: msg, variant: "destructive" });
          },
        },
      );
    } else {
      addToLibrary.mutate(
        { bookId: bookIdNum },
        {
          onSuccess: () => {
            refetch();
            toast({ title: "Saved to library!" });
          },
          onError: (err: any) => {
            const msg = err?.data?.error || "Could not save to library.";
            toast({ title: msg, variant: "destructive" });
          },
        },
      );
    }
  }

  function handleComment() {
    if (!commentText.trim()) return;
    createComment.mutate(
      { bookId: bookIdNum, data: { content: commentText.trim() } },
      {
        onSuccess: () => {
          setCommentText("");
          refetchComments();
        },
        onError: () => toast({ title: "Failed to post comment", variant: "destructive" }),
      },
    );
  }

  function handleDeleteComment(commentId: number) {
    deleteComment.mutate(
      { bookId: bookIdNum, commentId },
      {
        onSuccess: () => refetchComments(),
        onError: () => toast({ title: "Failed to delete comment", variant: "destructive" }),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex flex-col md:flex-row gap-10">
          <Skeleton className="w-full md:w-64 shrink-0 aspect-[2/3] rounded-xl" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <div className="flex gap-3">
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container mx-auto px-4 py-20 text-center max-w-md">
        <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-40" />
        <h2 className="text-2xl font-bold mb-2">Book not found</h2>
        <p className="text-muted-foreground mb-6">This book may have been removed or made private.</p>
        <Link href="/browse">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Browse
          </Button>
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === book.authorId;
  const fileUrl = getFileUrl(book.fileObjectPath);

  return (
    <>
      {showReader && fileUrl && (
        <BookReader
          fileUrl={fileUrl}
          fileFormat={book.fileFormat ?? "pdf"}
          title={book.title}
          onClose={() => setShowReader(false)}
        />
      )}

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link href="/browse" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Browse
        </Link>

        <div className="flex flex-col md:flex-row gap-10 mb-12">
          {/* Cover */}
          <div className="shrink-0 w-full md:w-56 lg:w-64">
            <div className="aspect-[2/3] rounded-xl overflow-hidden border border-border shadow-lg bg-amber-50">
              {book.coverObjectPath ? (
                <img
                  src={`/api/storage/objects${book.coverObjectPath.replace(/^\/objects/, "")}`}
                  alt={`Cover of ${book.title}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-amber-50 to-amber-100">
                  <BookOpen className="h-12 w-12 text-amber-300 mb-3" />
                  <span className="font-serif font-bold text-amber-900 text-lg leading-snug">
                    {book.title}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight">
                {book.title}
              </h1>
              {!book.isPublic && (
                <Badge variant="outline" className="shrink-0 mt-1 gap-1 text-muted-foreground">
                  <Lock className="h-3 w-3" /> Private
                </Badge>
              )}
            </div>

            <Link href={`/profile/${book.authorId}`} className="text-primary hover:underline font-medium mb-3">
              by {book.authorName}
            </Link>

            <div className="flex flex-wrap items-center gap-3 mb-5">
              {book.genre && <Badge variant="secondary">{book.genre}</Badge>}
              <span className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
                {book.fileFormat}
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Download className="h-3.5 w-3.5" /> {book.downloadCount} downloads
              </span>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" /> {book.commentCount} comments
              </span>
            </div>

            {book.description && (
              <p className="text-muted-foreground leading-relaxed mb-6 text-base max-w-2xl">
                {book.description}
              </p>
            )}

            <p className="text-xs text-muted-foreground mb-6">
              Uploaded {formatDate(book.createdAt)}
            </p>

            <div className="flex flex-wrap gap-3 mt-auto">
              <Button onClick={handleReadOnline} className="gap-2">
                <BookOpen className="h-4 w-4" />
                Read Online
              </Button>

              <Button onClick={handleDownload} disabled={download.isPending} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                {download.isPending ? "Preparing..." : "Download"}
              </Button>

              <Button
                variant="outline"
                onClick={handleLibraryToggle}
                disabled={addToLibrary.isPending || removeFromLibrary.isPending}
                className="gap-2"
              >
                {book.inLibrary ? (
                  <>
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    Save to Library
                  </>
                )}
              </Button>

              {isOwner && (
                <Link href={`/upload?edit=${book.id}`}>
                  <Button variant="ghost">Edit</Button>
                </Link>
              )}

              {isOwner && (
                <Link href={`/profile/me`}>
                  <Button variant="ghost">My Books</Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <Separator className="mb-10" />

        {/* Comments */}
        <section>
          <h2 className="text-xl font-serif font-bold mb-6 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Discussion ({commentsData?.comments.length ?? 0})
          </h2>

          {isSignedIn && (
            <div className="mb-8 flex flex-col gap-3">
              <Textarea
                placeholder="Share your thoughts on this book..."
                className="resize-none bg-card"
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) handleComment();
                }}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleComment}
                  disabled={!commentText.trim() || createComment.isPending}
                  className="gap-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  {createComment.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          )}

          {!isSignedIn && (
            <div className="mb-8 p-4 rounded-xl border border-border bg-card/50 text-center text-sm text-muted-foreground">
              <Link href="/sign-in" className="text-primary hover:underline font-medium">Sign in</Link> to join the discussion.
            </div>
          )}

          {commentsData?.comments.length === 0 && (
            <div className="py-12 text-center bg-card/50 rounded-xl border border-dashed border-border">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground">No comments yet. Be the first to share your thoughts.</p>
            </div>
          )}

          <div className="space-y-6">
            {commentsData?.comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-4 group">
                <Link href={`/profile/${comment.authorId}`}>
                  <Avatar className="h-9 w-9 shrink-0 border border-border">
                    <AvatarImage src={comment.authorAvatarUrl ?? undefined} />
                    <AvatarFallback className="text-xs bg-amber-100 text-amber-800">
                      {comment.authorName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/profile/${comment.authorId}`} className="font-semibold text-sm hover:text-primary transition-colors">
                        {comment.authorName}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    {(user?.id === comment.authorId || isOwner) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
