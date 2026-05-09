import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import { useConversation, ConversationProvider } from "@elevenlabs/react";
import { Mic, MicOff, Loader2, Volume2, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/nexio/AppShell";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/app/voice")({
  component: VoicePage,
});

const AGENT_ID = "agent_3801kr2bse75fb8v64bwgccr1jam";

type Msg = { role: "user" | "agent"; text: string; id: string };

function VoicePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [level, setLevel] = useState(0);
  const rafRef = useRef<number | null>(null);

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

  // Audio level visualizer
  useEffect(() => {
    if (!isConnected) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setLevel(0);
      return;
    }
    const tick = () => {
      const v = isSpeaking
        ? conversation.getOutputVolume?.() ?? 0
        : conversation.getInputVolume?.() ?? 0;
      setLevel(v);
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
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: "webrtc",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to start";
      setError(msg);
      toast.error(msg);
    } finally {
      setConnecting(false);
    }
  }, [conversation]);

  const stop = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {}
  }, [conversation]);

  if (loading || !user) return null;

  const ringScale = 1 + Math.min(level * 1.2, 0.6);

  return (
    <AppShell title="Nexio Voice">
      <div className="mx-auto flex h-full max-w-3xl flex-col px-4 py-6 md:px-8">
        {/* Hero / orb */}
        <div className="relative flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] p-10 backdrop-blur-2xl">
          <div className="relative flex h-56 w-56 items-center justify-center">
            {/* glow rings */}
            <div
              className="absolute inset-0 rounded-full bg-white/10 blur-2xl transition-transform duration-150"
              style={{ transform: `scale(${ringScale})` }}
            />
            <div
              className="absolute inset-4 rounded-full border border-white/20 transition-transform duration-150"
              style={{ transform: `scale(${ringScale * 0.95})` }}
            />
            <div
              className={`relative flex h-32 w-32 items-center justify-center rounded-full bg-white text-black shadow-glow transition ${
                isConnected ? "animate-pulse" : ""
              }`}
            >
              {isSpeaking ? (
                <Volume2 className="h-12 w-12" />
              ) : isConnected ? (
                <Mic className="h-12 w-12" />
              ) : (
                <MicOff className="h-12 w-12" />
              )}
            </div>
          </div>

          <div className="mt-6 text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight">
              {isConnected
                ? isSpeaking
                  ? "Nexio is speaking…"
                  : "Listening…"
                : "Talk to Nexio"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Real-time voice conversations powered by ElevenLabs.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3">
            {!isConnected ? (
              <button
                onClick={start}
                disabled={connecting}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-glow transition hover:scale-105 disabled:opacity-60"
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
              <button
                onClick={stop}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-white/20"
              >
                <MicOff className="h-4 w-4" /> End conversation
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                isConnected ? "bg-emerald-400" : "bg-muted-foreground/50"
              }`}
            />
            {status}
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
            <h3 className="font-display text-sm font-semibold tracking-tight">Transcript</h3>
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
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
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
