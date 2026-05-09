import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { useConversation, ConversationProvider } from "@elevenlabs/react";
import { Mic, MicOff, Loader2, Volume2, AlertCircle, Sparkles, GraduationCap, Headphones, Languages } from "lucide-react";
import { AppShell } from "@/components/nexio/AppShell";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/app/voice")({
  head: () => ({
    meta: [
      { title: "Nexio Voice — Talk to your AI" },
      { name: "description", content: "Cinematic real-time voice conversations with your Nexio AI." },
    ],
  }),
  component: VoicePageWrapper,
});

function VoicePageWrapper() {
  return (
    <ConversationProvider>
      <VoicePage />
    </ConversationProvider>
  );
}

const AGENT_ID = "agent_3801kr2bse75fb8v64bwgccr1jam";

type Msg = { role: "user" | "agent"; text: string; id: string };

type Mode = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  prompt?: string;
  firstMessage?: string;
};

const MODES: Mode[] = [
  { id: "general", label: "General", icon: Sparkles },
  {
    id: "tutor",
    label: "Study Tutor",
    icon: GraduationCap,
    prompt:
      "You are a patient, encouraging study tutor for a student. Explain concepts clearly with simple analogies, ask Socratic questions to check understanding, and quiz them after each topic.",
    firstMessage: "Hey! What subject should we tackle today?",
  },
  {
    id: "interview",
    label: "Interview Coach",
    icon: Headphones,
    prompt:
      "You are an experienced interview coach. Conduct realistic mock interviews, ask one question at a time, listen, then give actionable feedback on structure, content, and delivery.",
    firstMessage: "Ready when you are. What role are we practicing for?",
  },
  {
    id: "language",
    label: "Language Practice",
    icon: Languages,
    prompt:
      "You are a friendly language practice partner. Have natural conversations, gently correct mistakes, and adapt difficulty to the user's level.",
    firstMessage: "Hola! Which language would you like to practice today?",
  },
];

function VoicePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [level, setLevel] = useState(0);
  const [bars, setBars] = useState<number[]>(() => Array(28).fill(0));
  const [mode, setMode] = useState<Mode>(MODES[0]);
  const [pushToTalk, setPushToTalk] = useState(false);
  const [muted, setMuted] = useState(false);
  const rafRef = useRef<number | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const conversation = useConversation({
    onConnect: () => toast.success("Connected to Nexio Voice"),
    onDisconnect: () => toast.message("Conversation ended"),
    onError: (e) => {
      const msg = typeof e === "string" ? e : (e as Error)?.message ?? "Voice error";
      setError(msg);
      toast.error(msg);
    },
    onMessage: (m: { source?: string; message?: string }) => {
      const text = m?.message;
      if (!text) return;
      const role: "user" | "agent" = m.source === "user" ? "user" : "agent";
      setMessages((prev) => [...prev, { role, text, id: crypto.randomUUID() }]);
    },
  });

  const status = conversation.status;
  const isConnected = status === "connected";
  const isSpeaking = conversation.isSpeaking;

  // Visualizer — frequency data when available, level fallback
  useEffect(() => {
    if (!isConnected) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setLevel(0);
      setBars((b) => b.map(() => 0));
      return;
    }
    const tick = () => {
      const v = isSpeaking
        ? conversation.getOutputVolume?.() ?? 0
        : conversation.getInputVolume?.() ?? 0;
      setLevel(v);

      const freq = isSpeaking
        ? conversation.getOutputByteFrequencyData?.()
        : conversation.getInputByteFrequencyData?.();
      if (freq && freq.length) {
        const N = 28;
        const step = Math.floor(freq.length / N) || 1;
        const next: number[] = [];
        for (let i = 0; i < N; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) sum += freq[i * step + j] ?? 0;
          next.push(sum / step / 255);
        }
        setBars(next);
      } else {
        setBars((prev) => prev.map(() => Math.min(1, v + Math.random() * 0.15)));
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isConnected, isSpeaking, conversation]);

  const start = useCallback(async () => {
    setError(null);
    setConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      // mute mic for push-to-talk start
      if (pushToTalk) stream.getAudioTracks().forEach((t) => (t.enabled = false));
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "webrtc",
        ...(mode.prompt || mode.firstMessage
          ? {
              overrides: {
                agent: {
                  ...(mode.prompt ? { prompt: { prompt: mode.prompt } } : {}),
                  ...(mode.firstMessage ? { firstMessage: mode.firstMessage } : {}),
                },
              },
            }
          : {}),
      } as Parameters<typeof conversation.startSession>[0]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start";
      setError(msg);
      toast.error(msg);
    } finally {
      setConnecting(false);
    }
  }, [conversation, mode, pushToTalk]);

  const stop = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {}
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
  }, [conversation]);

  const setMicEnabled = (enabled: boolean) => {
    micStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = enabled));
    setMuted(!enabled);
  };

  if (loading || !user) return null;

  const ringScale = 1 + Math.min(level * 1.2, 0.6);

  return (
    <AppShell title="Nexio Voice">
      <div className="mx-auto flex h-full max-w-4xl flex-col px-4 py-6 md:px-8">
        {/* Mode selector */}
        <div className="mb-4 flex flex-wrap gap-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = m.id === mode.id;
            return (
              <button
                key={m.id}
                onClick={() => !isConnected && setMode(m)}
                disabled={isConnected}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-white/30 bg-white text-black shadow-glow"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground disabled:opacity-50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Hero / cinematic orb */}
        <div className="glass-strong relative flex flex-col items-center justify-center overflow-hidden rounded-[2rem] p-10">
          {/* ambient gradient */}
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 30%, oklch(0.72 0.2 245 / 18%), transparent 70%), radial-gradient(40% 40% at 70% 80%, oklch(0.7 0.27 305 / 15%), transparent 70%)",
            }}
          />

          <div className="relative flex h-64 w-64 items-center justify-center">
            <div
              className="absolute inset-0 rounded-full blur-3xl transition-transform duration-150"
              style={{
                transform: `scale(${ringScale})`,
                background:
                  "radial-gradient(circle, oklch(0.72 0.2 245 / 50%), oklch(0.7 0.27 305 / 30%) 60%, transparent 70%)",
              }}
            />
            <div
              className="absolute inset-2 rounded-full border border-white/15 transition-transform duration-150"
              style={{ transform: `scale(${ringScale * 0.95})` }}
            />
            <div
              className="absolute inset-8 rounded-full border border-white/10 transition-transform duration-200"
              style={{ transform: `scale(${1 + level * 0.6})` }}
            />
            <div
              className={`relative flex h-36 w-36 items-center justify-center rounded-full bg-white text-black shadow-glow transition ${
                isConnected ? "animate-pulse-glow" : ""
              }`}
            >
              {isSpeaking ? (
                <Volume2 className="h-14 w-14" />
              ) : isConnected ? (
                <Mic className="h-14 w-14" />
              ) : (
                <Sparkles className="h-14 w-14" />
              )}
            </div>
          </div>

          {/* waveform */}
          <div className="mt-6 flex h-12 items-end gap-1">
            {bars.map((b, i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-gradient-to-t from-white/30 to-white transition-[height] duration-75"
                style={{ height: `${Math.max(6, b * 48)}px` }}
              />
            ))}
          </div>

          <div className="mt-4 text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {!isConnected
                ? `Talk to Nexio · ${mode.label}`
                : isSpeaking
                  ? "Nexio is speaking…"
                  : muted
                    ? "Mic muted"
                    : "Listening…"}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {isConnected
                ? "Speak naturally — Nexio will respond in real time."
                : "Real-time, low-latency voice powered by ElevenLabs."}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {!isConnected ? (
              <button
                onClick={start}
                disabled={connecting}
                className="glow-button inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm disabled:opacity-60"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Connecting…
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" /> Start conversation
                  </>
                )}
              </button>
            ) : (
              <>
                {pushToTalk ? (
                  <button
                    onMouseDown={() => setMicEnabled(true)}
                    onMouseUp={() => setMicEnabled(false)}
                    onTouchStart={() => setMicEnabled(true)}
                    onTouchEnd={() => setMicEnabled(false)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/20 active:bg-white active:text-black"
                  >
                    <Mic className="h-4 w-4" /> Hold to talk
                  </button>
                ) : (
                  <button
                    onClick={() => setMicEnabled(muted)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
                  >
                    {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {muted ? "Unmute" : "Mute"}
                  </button>
                )}
                <button
                  onClick={stop}
                  className="inline-flex items-center gap-2 rounded-full bg-destructive/90 px-5 py-3 text-sm font-semibold text-white transition hover:bg-destructive"
                >
                  End
                </button>
              </>
            )}
          </div>

          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isConnected ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/50"
                }`}
              />
              {status}
            </span>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={pushToTalk}
                onChange={(e) => {
                  setPushToTalk(e.target.checked);
                  if (isConnected) setMicEnabled(!e.target.checked);
                }}
                className="h-3 w-3 accent-white"
              />
              Push to talk
            </label>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs text-red-300">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        {/* Transcript */}
        <div className="mt-6 flex-1 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <h3 className="font-display text-sm font-semibold tracking-tight">Live transcript</h3>
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>
          <div className="max-h-[40vh] space-y-3 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Your conversation will appear here.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex animate-fade-in ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      m.role === "user"
                        ? "bg-white text-black"
                        : "border border-white/10 bg-white/5 text-foreground"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
