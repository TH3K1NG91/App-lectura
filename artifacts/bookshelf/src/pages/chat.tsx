import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useUser } from "@clerk/react";
import { useGetMessages, useSendMessage } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send } from "lucide-react";

function formatTime(d: string | Date) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
function formatDay(d: string | Date) {
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

export default function Chat({ userId }: { userId: string }) {
  const { user: clerkUser } = useUser();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = useGetMessages(userId);
  const sendMessage = useSendMessage();

  const other = data?.otherUser;
  const messages = data?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const interval = setInterval(() => refetch(), 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  function handleSend() {
    if (!message.trim()) return;
    const content = message.trim();
    setMessage("");
    sendMessage.mutate(
      { otherUserId: userId, data: { content } },
      {
        onSuccess: () => refetch(),
        onError: () => toast({ title: "Failed to send message", variant: "destructive" }),
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const otherDisplayName = other?.displayName || other?.username || "User";

  const reversedMessages = [...messages].reverse();
  const dayGroups: { day: string; msgs: typeof messages }[] = [];
  for (const msg of reversedMessages) {
    const day = formatDay(msg.createdAt);
    const last = dayGroups[dayGroups.length - 1];
    if (last && last.day === day) {
      last.msgs.push(msg);
    } else {
      dayGroups.push({ day, msgs: [msg] });
    }
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur shrink-0">
        <Link href="/messages">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        {isLoading ? (
          <>
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <Link href={`/profile/${userId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={other?.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-amber-100 text-amber-800 font-serif">
                {otherDisplayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm leading-none">{otherDisplayName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">@{other?.username}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {isLoading && (
          <div className="space-y-4 pt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex gap-3 ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
                <Skeleton className={`h-10 ${i % 2 === 0 ? "w-48" : "w-36"} rounded-2xl`} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && reversedMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs mt-1">Start the conversation!</p>
          </div>
        )}

        {!isLoading && dayGroups.map(({ day, msgs }) => (
          <div key={day}>
            <div className="flex items-center justify-center mb-4">
              <span className="text-xs text-muted-foreground bg-background px-3 py-1 rounded-full border border-border">
                {day}
              </span>
            </div>
            <div className="space-y-2">
              {msgs.map((msg) => {
                const isMe = msg.senderId === clerkUser?.id;
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                    {!isMe && (
                      <Avatar className="h-7 w-7 border border-border shrink-0 mb-0.5">
                        <AvatarImage src={other?.avatarUrl ?? undefined} />
                        <AvatarFallback className="bg-amber-100 text-amber-800 text-xs">
                          {otherDisplayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`group flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[70%]`}>
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-card border border-border rounded-bl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-border bg-background">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-card"
            autoFocus
          />
          <Button
            onClick={handleSend}
            disabled={!message.trim() || sendMessage.isPending}
            size="icon"
            className="h-10 w-10 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
