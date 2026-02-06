"use client";

import React from "react"

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, ImageIcon, Loader2 } from "lucide-react";
import type { ChatMessage, User } from "@/lib/community-store";

interface ChatTabProps {
  currentUser: User;
  users: User[];
}

export function ChatTab({ currentUser }: ChatTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTimestamp = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchMessages = useCallback(async (since?: number) => {
    try {
      const url = since
        ? `/api/community/messages?since=${since}`
        : "/api/community/messages";
      const res = await fetch(url);
      const data = await res.json();
      if (since && data.messages.length > 0) {
        setMessages((prev) => {
          const ids = new Set(prev.map((m) => m.id));
          const newMsgs = data.messages.filter((m: ChatMessage) => !ids.has(m.id));
          return [...prev, ...newMsgs];
        });
      } else if (!since) {
        setMessages(data.messages);
      }
      if (data.messages.length > 0) {
        lastTimestamp.current = Math.max(
          ...data.messages.map((m: ChatMessage) => m.timestamp)
        );
      }
    } catch {
      // Ignore fetch errors
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Poll for new messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages(lastTimestamp.current);
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text && !imagePreview) return;

    setSending(true);
    try {
      await fetch("/api/community/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          content: text || "Shared an image",
          type: imagePreview ? "image" : "text",
          imageUrl: imagePreview || undefined,
        }),
      });
      setInput("");
      setImagePreview(null);
      await fetchMessages(lastTimestamp.current);
    } catch {
      // Ignore errors
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto p-4"
        style={{ maxHeight: "calc(100vh - 340px)" }}
      >
        {messages.map((msg) => {
          const isOwn = msg.userId === currentUser.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isOwn
                    ? "bg-primary/20 text-primary"
                    : "bg-accent/20 text-accent"
                }`}
              >
                {msg.userAvatar}
              </div>
              <div className={`max-w-[75%] ${isOwn ? "text-right" : ""}`}>
                <div className="mb-0.5 flex items-center gap-2">
                  <span className={`text-xs font-medium text-foreground ${isOwn ? "ml-auto" : ""}`}>
                    {isOwn ? "You" : msg.userName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>

                {msg.type === "payment" && (
                  <div className="glass rounded-xl border border-primary/20 p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                        <span className="text-sm font-bold text-primary">Rs.</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary">
                          Rs.{msg.paymentData?.amount}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          to {msg.paymentData?.toName}
                          {msg.paymentData?.note ? ` - "${msg.paymentData.note}"` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {msg.type === "bond" && (
                  <div className="glass rounded-xl border border-accent/20 p-3">
                    <p className="text-sm text-accent">{msg.content}</p>
                  </div>
                )}

                {msg.type === "image" && msg.imageUrl && (
                  <div className="glass overflow-hidden rounded-xl">
                    <img
                      src={msg.imageUrl || "/placeholder.svg"}
                      alt="shared"
                      className="max-h-48 w-full object-cover"
                    />
                    {msg.content && msg.content !== "Shared an image" && (
                      <p className="p-2 text-sm text-foreground">{msg.content}</p>
                    )}
                  </div>
                )}

                {msg.type === "text" && (
                  <div
                    className={`rounded-2xl px-3.5 py-2 ${
                      isOwn
                        ? "glass-strong rounded-br-md text-foreground"
                        : "glass-subtle rounded-bl-md text-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="border-t border-border/30 px-4 py-2">
          <div className="relative inline-block">
            <img
              src={imagePreview || "/placeholder.svg"}
              alt="preview"
              className="h-20 rounded-lg object-cover"
            />
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground"
            >
              x
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border/30 p-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || (!input.trim() && !imagePreview)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:bg-primary/80 disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
