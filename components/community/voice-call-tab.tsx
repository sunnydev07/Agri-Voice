"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Users,
  Loader2,
  Radio,
} from "lucide-react";
import type { User } from "@/lib/community-store";

interface VoiceCallTabProps {
  currentUser: User;
  users: User[];
}

type CallStatus = "idle" | "calling" | "ringing" | "connected" | "ended";

export function VoiceCallTab({ currentUser, users }: VoiceCallTabProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callTarget, setCallTarget] = useState<User | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const signalingRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const otherUsers = users.filter((u) => u.id !== currentUser.id);

  const cleanup = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    if (signalingRef.current) {
      clearInterval(signalingRef.current);
      signalingRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const setupAudioAnalyser = (stream: MediaStream) => {
    try {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAudioLevel(avg / 255);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Audio analyser not supported
    }
  };

  const startCall = async (target: User) => {
    setCallTarget(target);
    setCallStatus("calling");
    setCallDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setupAudioAnalyser(stream);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          await fetch("/api/community/signal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              from: currentUser.id,
              to: target.id,
              type: "candidate",
              data: JSON.stringify(event.candidate),
            }),
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await fetch("/api/community/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: currentUser.id,
          to: target.id,
          type: "offer",
          data: JSON.stringify(offer),
        }),
      });

      // Simulate connection (in real app, the other peer would answer)
      // For demo, auto-answer after 2 seconds
      setTimeout(async () => {
        if (callStatus === "calling" || true) {
          setCallStatus("connected");
          callTimerRef.current = setInterval(() => {
            setCallDuration((d) => d + 1);
          }, 1000);
        }
      }, 2000);

      // Poll for signaling messages
      let lastSignalTime = Date.now();
      signalingRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/community/signal?userId=${currentUser.id}&since=${lastSignalTime}`
          );
          const data = await res.json();
          lastSignalTime = Date.now();

          for (const signal of data.signals || []) {
            if (signal.type === "answer" && pc.signalingState !== "stable") {
              await pc.setRemoteDescription(JSON.parse(signal.data));
            }
            if (signal.type === "candidate") {
              await pc.addIceCandidate(new RTCIceCandidate(JSON.parse(signal.data)));
            }
            if (signal.type === "hangup") {
              endCall();
            }
          }
        } catch {
          // Ignore polling errors
        }
      }, 1000);
    } catch {
      setCallStatus("idle");
      setCallTarget(null);
      cleanup();
    }
  };

  const endCall = async () => {
    if (callTarget) {
      await fetch("/api/community/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: currentUser.id,
          to: callTarget.id,
          type: "hangup",
          data: "",
        }),
      }).catch(() => {});
    }

    setCallStatus("ended");
    cleanup();
    setTimeout(() => {
      setCallStatus("idle");
      setCallTarget(null);
      setCallDuration(0);
      setAudioLevel(0);
    }, 2000);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleSpeaker = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !isSpeakerOff;
    }
    setIsSpeakerOff(!isSpeakerOff);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-4" style={{ maxHeight: "calc(100vh - 340px)", overflowY: "auto" }}>
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Active call */}
      {(callStatus === "calling" || callStatus === "connected" || callStatus === "ended") && callTarget && (
        <div className="glass glow-green mb-6 rounded-2xl p-6">
          <div className="flex flex-col items-center">
            {/* Avatar with audio visualizer */}
            <div className="relative mb-4">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold transition-all ${
                  callStatus === "connected"
                    ? "bg-primary/20 text-primary"
                    : callStatus === "ended"
                    ? "bg-destructive/20 text-destructive"
                    : "bg-accent/20 text-accent"
                }`}
                style={
                  callStatus === "connected"
                    ? { boxShadow: `0 0 ${20 + audioLevel * 40}px hsla(142, 55%, 49%, ${0.2 + audioLevel * 0.4})` }
                    : undefined
                }
              >
                {callTarget.avatar}
              </div>
              {callStatus === "connected" && (
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                  <Radio className="h-3 w-3 animate-pulse text-primary-foreground" />
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold text-foreground">{callTarget.name}</h3>
            <p className="text-xs text-muted-foreground">{callTarget.location}</p>

            <div className="mt-2">
              {callStatus === "calling" && (
                <div className="flex items-center gap-2 text-accent">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="text-sm">Calling...</span>
                </div>
              )}
              {callStatus === "connected" && (
                <span className="font-mono text-sm text-primary">
                  {formatDuration(callDuration)}
                </span>
              )}
              {callStatus === "ended" && (
                <span className="text-sm text-muted-foreground">Call ended</span>
              )}
            </div>

            {/* Audio level bars */}
            {callStatus === "connected" && (
              <div className="mt-3 flex items-end gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-primary transition-all"
                    style={{
                      height: `${Math.max(4, Math.min(32, audioLevel * 40 * (1 + Math.sin(Date.now() / 200 + i))))}px`,
                      opacity: 0.4 + audioLevel * 0.6,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Call controls */}
            {callStatus !== "ended" && (
              <div className="mt-5 flex items-center gap-4">
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                    isMuted
                      ? "bg-destructive/20 text-destructive"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={endCall}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-all hover:bg-destructive/80"
                >
                  <PhoneOff className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={toggleSpeaker}
                  className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                    isSpeakerOff
                      ? "bg-destructive/20 text-destructive"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  {isSpeakerOff ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User list for calling */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Call a Farmer</h3>
        </div>
        <div className="space-y-2">
          {otherUsers.map((user) => (
            <div
              key={user.id}
              className="glass flex items-center justify-between rounded-xl p-3"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
                    {user.avatar}
                  </span>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground">{user.location}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => startCall(user)}
                disabled={callStatus !== "idle"}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-xs font-medium text-primary transition-all hover:bg-primary/20 disabled:opacity-40"
              >
                <Phone className="h-3.5 w-3.5" />
                Call
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 glass-subtle rounded-xl p-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Voice calls use WebRTC for peer-to-peer audio. Calls are encrypted end-to-end.
          Ensure microphone access is granted for voice calls. In this demo, calls are simulated
          with your own audio loopback.
        </p>
      </div>
    </div>
  );
}
