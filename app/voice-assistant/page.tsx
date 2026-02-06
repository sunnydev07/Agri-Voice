"use client";

import React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Globe,
  ImagePlus,
  Loader2,
  Mic,
  MicOff,
  Send,
  Trash2,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { SpeechRecognition, SpeechRecognitionEvent } from "types/speech-recognition";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  image?: string;
  lang?: string;
}

const LANGUAGES = [
  { code: "en-US", label: "English", short: "EN" },
  { code: "hi-IN", label: "Hindi", short: "HI" },
  { code: "ta-IN", label: "Tamil", short: "TA" },
  { code: "te-IN", label: "Telugu", short: "TE" },
  { code: "kn-IN", label: "Kannada", short: "KN" },
  { code: "mr-IN", label: "Marathi", short: "MR" },
  { code: "bn-IN", label: "Bengali", short: "BN" },
  { code: "gu-IN", label: "Gujarati", short: "GU" },
  { code: "pa-IN", label: "Punjabi", short: "PA" },
];

export default function VoiceAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Namaste! I am Agri-Voice, your multilingual AI farming assistant. You can speak your question in any language, or type it below. I can help with crop advice, disease diagnosis, weather, government schemes, and more.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Thinking...");
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en-US");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [interimText, setInterimText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Setup speech recognition with selected language
  useEffect(() => {
    const SpeechRecognitionAPI =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let final = "";
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        if (final) {
          setInput((prev) => prev + final);
          setInterimText("");
        } else {
          setInterimText(interim);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setInterimText("");
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText("");
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, [selectedLang]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimText("");
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const speakText = useCallback(
    (text: string) => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.lang = selectedLang;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      }
    },
    [selectedLang]
  );

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text && !imagePreview) return;
    if (!isOnline) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content:
            "You appear to be offline. Please check your internet connection and try again.",
        },
      ]);
      return;
    }

    const langLabel =
      LANGUAGES.find((l) => l.code === selectedLang)?.label || "English";

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text || "Please analyze this crop image.",
      image: imagePreview || undefined,
      lang: langLabel,
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
            message: `[User is speaking in ${langLabel}. Please respond in ${langLabel} if possible, otherwise in English.]\n\n${userMessage.content}`,
            image: userMessage.image || null,
          }),
        });

        const data = await res.json();

        if (data.rateLimited && attempt < MAX_CLIENT_RETRIES - 1) {
          const waitSec = Math.min(15 * (attempt + 1), 45);
          setLoadingStatus(
            `API busy, retrying in ${waitSec}s (attempt ${attempt + 2}/${MAX_CLIENT_RETRIES})...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, waitSec * 1000)
          );
          continue;
        }

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            data.response ||
            data.error ||
            "Sorry, I could not process that.",
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
          await new Promise((resolve) =>
            setTimeout(resolve, waitSec * 1000)
          );
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

  const currentLang = LANGUAGES.find((l) => l.code === selectedLang);

  return (
    <div className="relative flex h-screen flex-col">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="glass-strong relative z-50 px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  Voice Assistant
                </h1>
                <p className="text-xs text-muted-foreground">
                  Multilingual AI farming help
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Online indicator */}
            <div
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${isOnline ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}
            >
              {isOnline ? (
                <Wifi className="h-3 w-3" />
              ) : (
                <WifiOff className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            {/* Language picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLangPicker(!showLangPicker)}
                className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:glow-green"
              >
                <Globe className="h-3.5 w-3.5 text-primary" />
                {currentLang?.short}
              </button>
              {showLangPicker && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLangPicker(false)}
                    onKeyDown={() => {}}
                    role="presentation"
                  />
                  <div className="glass-strong absolute right-0 top-full z-50 mt-1.5 w-44 rounded-xl py-1.5 shadow-xl">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setSelectedLang(lang.code);
                          setShowLangPicker(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-primary/5 ${selectedLang === lang.code ? "text-primary" : "text-foreground"}`}
                      >
                        <span>{lang.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {lang.short}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Speaking indicator */}
            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs text-accent"
              >
                <VolumeX className="h-3 w-3" />
                Stop
              </button>
            )}
            {/* Clear */}
            <button
              type="button"
              onClick={() =>
                setMessages([
                  {
                    id: "welcome",
                    role: "assistant",
                    content:
                      "Chat cleared. How can I help with your farming needs?",
                  },
                ])
              }
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "glass text-foreground rounded-bl-md"
                }`}
              >
                {msg.image && (
                  <img
                    src={msg.image || "/placeholder.svg"}
                    alt="Uploaded crop"
                    className="mb-2 max-h-40 rounded-lg object-cover"
                  />
                )}
                {msg.lang && msg.role === "user" && (
                  <span className="mb-1 block text-[10px] opacity-60">
                    {msg.lang}
                  </span>
                )}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {msg.content}
                </p>
                {msg.role === "assistant" && msg.id !== "welcome" && (
                  <button
                    type="button"
                    onClick={() => speakText(msg.content)}
                    className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-primary"
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
              <div className="glass flex items-center gap-2 rounded-2xl rounded-bl-md px-4 py-3">
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

      {/* Interim speech text */}
      {interimText && (
        <div className="relative z-10 border-t border-border/30 px-4 py-2">
          <div className="mx-auto max-w-3xl">
            <p className="animate-pulse text-sm italic text-muted-foreground">
              {interimText}
            </p>
          </div>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="relative z-10 border-t border-border/50 px-4 pt-3">
          <div className="mx-auto max-w-3xl">
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
        </div>
      )}

      {/* Input area */}
      <div className="glass-strong relative z-10 px-4 py-3 md:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
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
            className="flex-shrink-0 rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            aria-label="Upload crop image"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={toggleListening}
            className={`flex-shrink-0 rounded-xl p-2.5 transition-colors ${
              isListening
                ? "bg-destructive/20 text-destructive animate-voice-pulse"
                : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
            }`}
            aria-label={isListening ? "Stop recording" : "Start voice input"}
          >
            {isListening ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
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
            placeholder={
              isListening
                ? `Listening in ${currentLang?.label}...`
                : "Ask about crops, diseases, prices..."
            }
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            disabled={loading}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={loading || (!input.trim() && !imagePreview)}
            className="flex-shrink-0 rounded-xl bg-primary p-2.5 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            aria-label="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
