"use client";

import React from "react"

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Heart,
  MessageCircle,
  ImagePlus,
  Send,
  Loader2,
  X,
} from "lucide-react";
import type { User, ImagePost } from "@/lib/community-store";

interface GalleryTabProps {
  currentUser: User;
}

export function GalleryTab({ currentUser }: GalleryTabProps) {
  const [posts, setPosts] = useState<ImagePost[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/community/images");
      const data = await res.json();
      setPosts(data.images || []);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target?.result as string);
      setShowUpload(true);
    };
    reader.readAsDataURL(file);
  };

  const upload = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      await fetch("/api/community/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "upload",
          userId: currentUser.id,
          imageUrl: preview,
          caption,
        }),
      });
      setPreview(null);
      setCaption("");
      setShowUpload(false);
      await fetchPosts();
    } catch {
      // Ignore
    } finally {
      setUploading(false);
    }
  };

  const toggleLike = async (imageId: string) => {
    try {
      await fetch("/api/community/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "like",
          imageId,
          userId: currentUser.id,
        }),
      });
      await fetchPosts();
    } catch {
      // Ignore
    }
  };

  const addComment = async (imageId: string) => {
    const text = commentInput[imageId]?.trim();
    if (!text) return;
    try {
      await fetch("/api/community/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "comment",
          imageId,
          userId: currentUser.id,
          text,
        }),
      });
      setCommentInput((prev) => ({ ...prev, [imageId]: "" }));
      await fetchPosts();
    } catch {
      // Ignore
    }
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className="space-y-4 p-4" style={{ maxHeight: "calc(100vh - 340px)", overflowY: "auto" }}>
      {/* Upload Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Community Gallery</h3>
        <div>
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
            className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20"
          >
            <ImagePlus className="h-3.5 w-3.5" />
            Upload Photo
          </button>
        </div>
      </div>

      {/* Upload Preview */}
      {showUpload && preview && (
        <div className="glass rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground">New Post</h4>
            <button
              type="button"
              onClick={() => { setShowUpload(false); setPreview(null); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <img
            src={preview || "/placeholder.svg"}
            alt="upload preview"
            className="mb-3 max-h-48 w-full rounded-xl object-cover"
          />
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            className="mb-3 w-full rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          <button
            type="button"
            onClick={upload}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/80 disabled:opacity-40"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share with Community"}
          </button>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => {
          const isLiked = post.likes.includes(currentUser.id);
          const showAllComments = expandedComments.has(post.id);

          return (
            <div key={post.id} className="glass overflow-hidden rounded-2xl">
              {/* Header */}
              <div className="flex items-center gap-2.5 p-3 pb-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                  {post.userAvatar}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{post.userName}</p>
                  <p className="text-[10px] text-muted-foreground">{formatTime(post.timestamp)}</p>
                </div>
              </div>

              {/* Image */}
              <div className="mt-2">
                <img
                  src={post.imageUrl || "/placeholder.svg"}
                  alt={post.caption}
                  className="w-full object-cover"
                  style={{ maxHeight: "280px" }}
                />
              </div>

              {/* Actions */}
              <div className="p-3">
                <div className="mb-2 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${
                      isLiked
                        ? "text-destructive"
                        : "text-muted-foreground hover:text-destructive"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                    {post.likes.length}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedComments((prev) => {
                        const next = new Set(prev);
                        if (next.has(post.id)) next.delete(post.id);
                        else next.add(post.id);
                        return next;
                      })
                    }
                    className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {post.comments.length}
                  </button>
                </div>

                {post.caption && (
                  <p className="mb-2 text-sm text-foreground">
                    <span className="mr-1 font-semibold">{post.userName}</span>
                    {post.caption}
                  </p>
                )}

                {/* Comments */}
                {post.comments.length > 0 && (
                  <div className="space-y-1.5">
                    {(showAllComments ? post.comments : post.comments.slice(-2)).map((c, i) => (
                      <p key={`${c.userId}-${i}`} className="text-xs text-foreground">
                        <span className="mr-1 font-semibold">{c.userName}</span>
                        <span className="text-muted-foreground">{c.text}</span>
                      </p>
                    ))}
                    {!showAllComments && post.comments.length > 2 && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedComments((prev) => new Set(prev).add(post.id))
                        }
                        className="text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        View all {post.comments.length} comments
                      </button>
                    )}
                  </div>
                )}

                {/* Add comment */}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={commentInput[post.id] || ""}
                    onChange={(e) =>
                      setCommentInput((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && addComment(post.id)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  {commentInput[post.id]?.trim() && (
                    <button
                      type="button"
                      onClick={() => addComment(post.id)}
                      className="text-primary"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
