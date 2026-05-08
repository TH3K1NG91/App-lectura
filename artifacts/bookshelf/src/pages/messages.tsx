import { Link } from "wouter";
import { useListConversations } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";

function formatTime(d: string | Date) {
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Messages() {
  const { data, isLoading } = useListConversations();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">Your conversations</p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (data?.conversations.length === 0 || !data) && (
        <div className="py-20 text-center flex flex-col items-center bg-card/50 rounded-xl border border-dashed border-border">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
          <h3 className="text-xl font-bold mb-2">No conversations yet</h3>
          <p className="text-muted-foreground text-sm">
            Visit an author's profile to start a conversation.
          </p>
        </div>
      )}

      {!isLoading && (data?.conversations.length ?? 0) > 0 && (
        <div className="space-y-2">
          {data?.conversations.map((conv: any) => {
            const other = conv.otherUser;
            const displayName = other.displayName || other.username;
            return (
              <Link key={other.clerkId} href={`/messages/${other.clerkId}`}>
                <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:bg-card/80 transition-all cursor-pointer group">
                  <Avatar className="h-12 w-12 border border-border shrink-0">
                    <AvatarImage src={other.avatarUrl ?? undefined} />
                    <AvatarFallback className="bg-amber-100 text-amber-800 font-serif text-lg">
                      {displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {displayName}
                      </p>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage.content}
                      </p>
                      {conv.unreadCount > 0 && (
                        <Badge className="shrink-0 h-5 min-w-[20px] flex items-center justify-center text-xs">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
