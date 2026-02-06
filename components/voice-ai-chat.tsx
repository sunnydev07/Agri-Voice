"use client";

import React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot,
  ImagePlus,
  Loader2,
  Mic,
  MicOff,
  Send,
  X,
  MessageSquare,
  Trash2,
  Volume2,
} from "lucide-react";
import { SpeechRecognition, SpeechRecognitionEvent } from "web-speech-api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
}

export function VoiceAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Namaste! I am Agri-Voice, your AI farming assistant. Ask me anything about crops, diseases, soil health, or government schemes. You can also speak your question or upload a crop image for diagnosis.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string>("Thinking...");
  const [isListening, setIsListening] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Setup speech recognition
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text && !imagePreview) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text || "Please analyze this crop image.",
      image: imagePreview || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setImagePreview(null);
    setLoading(true);
    setLoadingStatus("Thinking...");

    const MAX_CLIENT_RETRIES = 3;
    let success = false;

    for (let attempt = 0; attempt < MAX_CLIENT_RETRIES; attempt++) {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage.content,
            image: userMessage.image || null,
          }),
        });

        const data = await res.json();

        // If the server exhausted its retries and flagged rate limiting,
        // we retry from the client side with a visible status
        if (data.rateLimited && attempt < MAX_CLIENT_RETRIES - 1) {
          const waitSec = Math.min(15 * (attempt + 1), 45);
          setLoadingStatus(
            `API busy, retrying in ${waitSec}s (attempt ${attempt + 2}/${MAX_CLIENT_RETRIES})...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
          continue;
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response || data.error || "Sorry, I could not process that.",
        };

        setMessages((prev) => [...prev, assistantMessage]);
        success = true;
        break;
      } catch {
        if (attempt < MAX_CLIENT_RETRIES - 1) {
          const waitSec = 5 * (attempt + 1);
          setLoadingStatus(
            `Connection issue, retrying in ${waitSec}s (attempt ${attempt + 2}/${MAX_CLIENT_RETRIES})...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
          continue;
        }
      }
    }

    if (!success) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "The AI service is very busy right now. Please wait a minute and try again.",
        },
      ]);
    }

    setLoading(false);
    setLoadingStatus("Thinking...");
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 glow-green"
          aria-label="Open AI Assistant"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[380px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl glass-strong glow-green shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Agri-Voice AI</p>
                <p className="text-[10px] text-primary">Gemini-powered</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: "welcome",
                      role: "assistant",
                      content:
                        "Chat cleared. How can I help you with your farming needs?",
                    },
                  ])
                }
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex flex-col gap-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "glass-subtle text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.image && (
                      <img
                        src={msg.image || "/placeholder.svg"}
                        alt="Uploaded crop"
                        className="mb-2 max-h-32 rounded-lg object-cover"
                      />
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </p>
                    {msg.role === "assistant" && msg.id !== "welcome" && (
                      <button
                        type="button"
                        onClick={() => speakText(msg.content)}
                        className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-primary"
                      >
                        <Volume2 className="h-3 w-3" />
                        Listen
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="glass-subtle flex items-center gap-2 rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {loadingStatus}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Image preview */}
          {imagePreview && (
            <div className="border-t border-border/50 px-3 pt-2">
              <div className="relative inline-block">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="h-16 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="border-t border-border/50 p-3">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label="Upload crop image"
              >
                <ImagePlus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={toggleListening}
                className={`flex-shrink-0 rounded-lg p-2 transition-colors ${
                  isListening
                    ? "bg-destructive/20 text-destructive animate-voice-pulse"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                }`}
                aria-label={isListening ? "Stop recording" : "Start voice input"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={isListening ? "Listening..." : "Ask about crops, diseases..."}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                disabled={loading}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={loading || (!input.trim() && !imagePreview)}
                className="flex-shrink-0 rounded-lg bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
