import { useState, useRef } from "react";
import { Link } from "wouter";
import { useUser } from "@clerk/react";
import {
  useGetMe,
  useUpdateMe,
  useGetUserBooks,
  useRequestUploadUrl,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { BookOpen, Download, MessageCircle, Pencil, Camera, Check, X, CalendarDays, ImagePlus } from "lucide-react";
import { coverUrl } from "@/lib/cover-url";

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long" });
}

async function uploadFileToStorage(
  file: File,
  mutate: (data: any, callbacks: any) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    mutate(
      { data: { name: file.name, size: file.size, contentType: file.type } },
      {
        onSuccess: async (r: any) => {
          await fetch(r.uploadURL, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });
          resolve(r.objectPath);
        },
        onError: reject,
      },
    );
  });
}

export default function Me() {
  const { user: clerkUser } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { data: me, isLoading, refetch } = useGetMe();
  const { data: booksData } = useGetUserBooks(
    me?.clerkId ?? "",
    { includePrivate: true },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { query: { enabled: !!me?.clerkId } as any },
  );

  const updateMe = useUpdateMe();
  const requestUploadUrl = useRequestUploadUrl();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  function startEdit() {
    setDisplayName(me?.displayName ?? "");
    setUsername(me?.username ?? "");
    setBio(me?.bio ?? "");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function saveProfile() {
    setIsSaving(true);
    updateMe.mutate(
      {
        data: {
          displayName: displayName || undefined,
          username: username || undefined,
          bio: bio || undefined,
        },
      },
      {
        onSuccess: () => {
          refetch();
          setEditing(false);
          toast({ title: t("profile.saveChanges") + " ✓" });
          setIsSaving(false);
        },
        onError: () => {
          toast({ title: "Failed to update profile", variant: "destructive" });
          setIsSaving(false);
        },
      },
    );
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const objectPath = await uploadFileToStorage(file, requestUploadUrl.mutate);
      await new Promise<void>((resolve, reject) => {
        updateMe.mutate(
          { data: { avatarObjectPath: objectPath } },
          { onSuccess: () => { refetch(); resolve(); }, onError: reject },
        );
      });
      toast({ title: "Avatar updated" });
    } catch {
      toast({ title: "Failed to upload avatar", variant: "destructive" });
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const objectPath = await uploadFileToStorage(file, requestUploadUrl.mutate);
      await new Promise<void>((resolve, reject) => {
        updateMe.mutate(
          { data: { bannerObjectPath: objectPath } },
          { onSuccess: () => { refetch(); resolve(); }, onError: reject },
        );
      });
      toast({ title: "Banner updated" });
    } catch {
      toast({ title: "Failed to upload banner", variant: "destructive" });
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-40 w-full rounded-2xl mb-4" />
        <div className="flex gap-6 mb-10">
          <Skeleton className="h-24 w-24 rounded-full shrink-0" />
          <div className="flex-1 space-y-3 pt-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
    );
  }

  const displayNameValue = me?.displayName || me?.username || "Reader";

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12">
      {/* Banner */}
      <div className="relative h-44 sm:h-56 rounded-b-2xl overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 mb-0 group">
        {(me as any)?.bannerUrl ? (
          <img
            src={(me as any).bannerUrl}
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-amber-100 via-orange-50 to-amber-200" />
        )}
        <button
          onClick={() => bannerInputRef.current?.click()}
          disabled={isUploadingBanner}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs px-3 py-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100"
          title={t("profile.changeBanner")}
        >
          <ImagePlus className="h-3.5 w-3.5" />
          {isUploadingBanner ? "Uploading..." : t("profile.changeBanner")}
        </button>
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
      </div>

      {/* Profile card below banner */}
      <div className="px-4 sm:px-6 -mt-12 mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar with overlap */}
          <div className="relative shrink-0 mt-0">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={me?.avatarUrl ?? clerkUser?.imageUrl} />
              <AvatarFallback className="text-3xl bg-amber-100 text-amber-800 font-serif">
                {displayNameValue.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploadingAvatar}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background hover:bg-primary/90 transition-colors"
              title={t("profile.changeAvatar")}
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Info / Edit Form */}
          <div className="flex-1 min-w-0 pt-14 sm:pt-14">
            {editing ? (
              <div className="space-y-4 bg-card border border-border rounded-2xl p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="displayName">{t("profile.displayName")}</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t("profile.displayName")}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="username">{t("profile.username")}</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={t("profile.username")}
                      className="bg-background"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bio">{t("profile.bio")}</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder={t("profile.bioPlaceholder")}
                    className="resize-none bg-background"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveProfile} disabled={isSaving} className="gap-1.5">
                    <Check className="h-3.5 w-3.5" />
                    {isSaving ? t("profile.saving") : t("profile.saveChanges")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                    <X className="h-3.5 w-3.5 mr-1" />
                    {t("profile.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h2 className="text-xl font-bold text-foreground">{displayNameValue}</h2>
                  <Button size="sm" variant="outline" onClick={startEdit} className="gap-1.5 shrink-0">
                    <Pencil className="h-3.5 w-3.5" />
                    {t("profile.editProfile")}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">@{me?.username}</p>
                {me?.bio ? (
                  <p className="text-sm text-foreground/80 leading-relaxed max-w-xl mb-3">{me.bio}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic mb-3">{t("profile.noBio")}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    {me?.bookCount ?? 0} {(me?.bookCount ?? 0) === 1 ? t("profile.book") : t("profile.books")}
                  </span>
                  {me?.createdAt && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      {t("profile.joinedDate")} {formatDate(me.createdAt as any)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator className="mb-8" />

      {/* My Books */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif font-bold text-foreground">{t("profile.myBooks")}</h2>
          <Link href="/upload">
            <Button size="sm" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {t("profile.uploadNew")}
            </Button>
          </Link>
        </div>

        {!booksData && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-[2/3] w-full rounded-md" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        )}

        {booksData?.books.length === 0 && (
          <div className="py-16 text-center bg-card/50 rounded-xl border border-dashed border-border">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground mb-4">{t("profile.noBooks")}</p>
            <Link href="/upload">
              <Button>{t("profile.uploadFirst")}</Button>
            </Link>
          </div>
        )}

        {(booksData?.books.length ?? 0) > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-10">
            {booksData?.books.map((book: any) => (
              <div key={book.id} className="group flex flex-col h-full">
                <Link href={`/book/${book.id}`}>
                  <div className="relative aspect-[2/3] mb-3 overflow-hidden rounded-md border border-border shadow-sm group-hover:shadow-md transition-all duration-300 cursor-pointer">
                    {book.coverObjectPath ? (
                      <img
                        src={coverUrl(book.coverObjectPath)!}
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
                    {!book.isPublic && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="outline" className="bg-background/80 text-xs">{t("book.private")}</Badge>
                      </div>
                    )}
                    {book.genre && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs">{book.genre}</Badge>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-foreground leading-tight line-clamp-2 mb-1 text-sm group-hover:text-primary transition-colors cursor-pointer">
                    {book.title}
                  </h3>
                </Link>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" /> {book.downloadCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" /> {book.commentCount || 0}
                    </span>
                  </div>
                  <Link href={`/upload?edit=${book.id}`}>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground">
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
