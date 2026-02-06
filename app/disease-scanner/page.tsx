"use client";

import React from "react"

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Bug,
  Leaf,
  ShieldCheck,
  Sprout,
  X,
  RefreshCw,
} from "lucide-react";

interface Diagnosis {
  disease_name: string;
  confidence: number;
  severity: string;
  description: string;
  symptoms: string[];
  treatment: string[];
  prevention: string[];
  crop_type: string;
  organic_treatment: string;
}

export default function DiseaseScannerPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Analyzing crop image...");
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setDiagnosis(null);
      setError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const analyzeCrop = async () => {
    if (!imagePreview) return;

    setLoading(true);
    setLoadingStatus("Analyzing crop image...");
    setError(null);
    setDiagnosis(null);

    const MAX_RETRIES = 2;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await fetch("/api/disease-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: imagePreview,
            description: description || null,
          }),
        });

        const data = await res.json();

        if (data.rateLimited && attempt < MAX_RETRIES - 1) {
          setLoadingStatus(
            `API busy, retrying in 15s (attempt ${attempt + 2}/${MAX_RETRIES})...`
          );
          await new Promise((resolve) => setTimeout(resolve, 15000));
          continue;
        }

        if (data.diagnosis) {
          setDiagnosis(data.diagnosis);
        } else if (data.error) {
          setError(data.error);
        }
        break;
      } catch {
        if (attempt < MAX_RETRIES - 1) {
          setLoadingStatus("Connection issue, retrying...");
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }
        setError(
          "Failed to connect to the analysis service. Please try again."
        );
      }
    }

    setLoading(false);
  };

  const resetScan = () => {
    setImagePreview(null);
    setDescription("");
    setDiagnosis(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const severityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "low":
        return "text-primary bg-primary/10";
      case "medium":
        return "text-accent bg-accent/10";
      case "high":
        return "text-destructive bg-destructive/10";
      case "critical":
        return "text-destructive bg-destructive/20";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-destructive/5 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="glass-strong sticky top-0 z-50 px-4 py-3 md:px-6">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors hover:bg-primary/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                <Bug className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  Crop Disease Scanner
                </h1>
                <p className="text-xs text-muted-foreground">
                  AI-powered crop diagnosis
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-6 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Upload Panel */}
            <div className="flex flex-col gap-4">
              <div className="glass rounded-2xl p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Upload Crop Image
                </h2>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageUpload}
                />

                {!imagePreview ? (
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="glass-subtle flex items-center justify-center gap-3 rounded-xl p-8 text-muted-foreground transition-all hover:text-primary hover:glow-green"
                    >
                      <Camera className="h-8 w-8" />
                      <div className="text-left">
                        <p className="font-medium text-foreground">
                          Take a Photo
                        </p>
                        <p className="text-xs">
                          Use your camera to capture the crop
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="glass-subtle flex items-center justify-center gap-3 rounded-xl p-8 text-muted-foreground transition-all hover:text-accent hover:glow-amber"
                    >
                      <Upload className="h-8 w-8" />
                      <div className="text-left">
                        <p className="font-medium text-foreground">
                          Upload from Gallery
                        </p>
                        <p className="text-xs">
                          Select an existing crop photo
                        </p>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Uploaded crop"
                      className="w-full rounded-xl object-cover"
                      style={{ maxHeight: 320 }}
                    />
                    <button
                      type="button"
                      onClick={resetScan}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-destructive/20 hover:text-destructive"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {imagePreview && (
                <div className="glass rounded-2xl p-6">
                  <label
                    htmlFor="crop-desc"
                    className="mb-2 block text-sm font-medium text-foreground"
                  >
                    Additional Details (Optional)
                  </label>
                  <textarea
                    id="crop-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Yellowing leaves on tomato plant, spotted for 3 days..."
                    rows={3}
                    className="w-full rounded-xl bg-secondary/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />

                  <button
                    type="button"
                    onClick={analyzeCrop}
                    disabled={loading}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 glow-green"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {loadingStatus}
                      </>
                    ) : (
                      <>
                        <Bug className="h-5 w-5" />
                        Analyze Crop
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Results Panel */}
            <div className="flex flex-col gap-4">
              {!diagnosis && !error && !loading && (
                <div className="glass rounded-2xl p-8 text-center">
                  <Sprout className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Ready to Scan
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Upload a photo of your crop and our AI will identify
                    diseases, provide treatment recommendations, and suggest
                    preventive measures.
                  </p>
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <div className="glass-subtle rounded-xl p-3 text-center">
                      <Bug className="mx-auto mb-1 h-5 w-5 text-destructive" />
                      <p className="text-[11px] text-muted-foreground">
                        Disease ID
                      </p>
                    </div>
                    <div className="glass-subtle rounded-xl p-3 text-center">
                      <Leaf className="mx-auto mb-1 h-5 w-5 text-primary" />
                      <p className="text-[11px] text-muted-foreground">
                        Treatment
                      </p>
                    </div>
                    <div className="glass-subtle rounded-xl p-3 text-center">
                      <ShieldCheck className="mx-auto mb-1 h-5 w-5 text-accent" />
                      <p className="text-[11px] text-muted-foreground">
                        Prevention
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {loading && (
                <div className="glass rounded-2xl p-8 text-center">
                  <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {loadingStatus}
                  </p>
                </div>
              )}

              {error && (
                <div className="glass rounded-2xl border-destructive/30 p-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Analysis Error
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {error}
                      </p>
                      <button
                        type="button"
                        onClick={analyzeCrop}
                        className="mt-3 flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {diagnosis && (
                <>
                  {/* Diagnosis Header */}
                  <div className="glass rounded-2xl p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {diagnosis.disease_name?.toLowerCase() ===
                          "healthy" ? (
                            <CheckCircle2 className="h-6 w-6 text-primary" />
                          ) : (
                            <AlertTriangle className="h-6 w-6 text-destructive" />
                          )}
                          <h3 className="text-xl font-bold text-foreground">
                            {diagnosis.disease_name}
                          </h3>
                        </div>
                        {diagnosis.crop_type && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Crop: {diagnosis.crop_type}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div
                          className={`rounded-full px-3 py-1 text-xs font-medium ${severityColor(diagnosis.severity)}`}
                        >
                          {diagnosis.severity}
                        </div>
                        <div className="flex items-center gap-1 font-mono text-sm text-muted-foreground">
                          <span className="text-primary">
                            {diagnosis.confidence}%
                          </span>{" "}
                          confidence
                        </div>
                      </div>
                    </div>
                    {diagnosis.description && (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {diagnosis.description}
                      </p>
                    )}
                  </div>

                  {/* Confidence Bar */}
                  <div className="glass rounded-2xl p-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Confidence Score
                      </span>
                      <span className="font-mono text-primary">
                        {diagnosis.confidence}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-700"
                        style={{ width: `${diagnosis.confidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Symptoms */}
                  {diagnosis.symptoms?.length > 0 && (
                    <div className="glass rounded-2xl p-6">
                      <h4 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                        <AlertTriangle className="h-4 w-4 text-accent" />
                        Symptoms Identified
                      </h4>
                      <ul className="flex flex-col gap-2">
                        {diagnosis.symptoms.map((s, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Treatment */}
                  {diagnosis.treatment?.length > 0 && (
                    <div className="glass rounded-2xl p-6">
                      <h4 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                        <Leaf className="h-4 w-4 text-primary" />
                        Treatment Recommendations
                      </h4>
                      <ul className="flex flex-col gap-2">
                        {diagnosis.treatment.map((t, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Prevention */}
                  {diagnosis.prevention?.length > 0 && (
                    <div className="glass rounded-2xl p-6">
                      <h4 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                        <ShieldCheck className="h-4 w-4 text-chart-3" />
                        Preventive Measures
                      </h4>
                      <ul className="flex flex-col gap-2">
                        {diagnosis.prevention.map((p, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-chart-3" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Organic Treatment */}
                  {diagnosis.organic_treatment &&
                    diagnosis.organic_treatment !== "N/A" && (
                      <div className="glass rounded-2xl border-primary/20 p-6">
                        <h4 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                          <Sprout className="h-4 w-4 text-chart-4" />
                          Organic Treatment
                        </h4>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {diagnosis.organic_treatment}
                        </p>
                      </div>
                    )}

                  <button
                    type="button"
                    onClick={resetScan}
                    className="glass flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-foreground transition-all hover:glow-green"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Scan Another Crop
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
