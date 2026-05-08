import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Send, Trash2, Loader2, Sparkles, MessageSquare, History } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { streamChat } from "@/lib/chat-stream";
import { AppShell } from "@/components/nexio/AppShell";

type Conversation = { id: string; title: string; updated_at: string };
type Message = { id: string; role: "user" | "assistant" | "system"; content: string };

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Nexio Chat" },
      { name: "description", content: "Your private Nexio AI workspace." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("conversations")
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        const list = (data ?? []) as Conversation[];
        setConversations(list);
        if (!activeId && list.length) setActiveId(list[0].id);
      });
  }, [user]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    supabase
      .from("messages")
      .select("id,role,content")
      .eq("conversation_id", activeId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data ?? []) as Message[]));
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const newChat = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: "New chat" })
      .select("id,title,updated_at")
      .single();
    if (!data) return;
    setConversations((prev) => [data as Conversation, ...prev]);
    setActiveId(data.id);
    setMessages([]);
    setHistoryOpen(false);
  };

  const deleteConvo = async (id: string) => {
    await supabase.from("conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending || !user) return;
    setError(null);
    let convoId = activeId;
    if (!convoId) {
      const { data } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: "New chat" })
        .select("id,title,updated_at")
        .single();
      if (!data) return;
      convoId = data.id;
      setConversations((prev) => [data as Conversation, ...prev]);
      setActiveId(convoId);
    }

    const userMsg: Message = { id: `tmp-${Date.now()}`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    let buf = "";
    const upsert = (chunk: string) => {
      buf += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id.startsWith("stream-")) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: buf } : m));
        }
        return [...prev, { id: `stream-${Date.now()}`, role: "assistant", content: buf }];
      });
    };

    try {
      await streamChat({ conversationId: convoId!, content: text, onDelta: upsert });
      const { data } = await supabase
        .from("conversations")
        .select("id,title,updated_at")
        .order("updated_at", { ascending: false });
      if (data) setConversations(data as Conversation[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const activeTitle = useMemo(
    () => conversations.find((c) => c.id === activeId)?.title ?? "New chat",
    [conversations, activeId],
  );

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const HistoryList = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Recent
        </p>
        <button
          onClick={newChat}
          className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs font-medium hover:bg-white/20"
        >
          <Plus className="h-3 w-3" /> New
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto px-2 pb-3">
        {conversations.map((c) => (
          <li key={c.id}>
            <div
              className={`group flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm transition ${
                c.id === activeId
                  ? "bg-white/10 text-foreground"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
              onClick={() => {
                setActiveId(c.id);
                setHistoryOpen(false);
              }}
            >
              <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="flex-1 truncate">{c.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConvo(c.id);
                }}
                className="rounded p-1 opacity-0 transition group-hover:opacity-100 hover:bg-white/10"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        ))}
        {conversations.length === 0 && (
          <p className="px-2 py-4 text-xs text-muted-foreground">No chats yet.</p>
        )}
      </ul>
    </div>
  );

  return (
    <AppShell
      title={activeTitle}
      rightSlot={
        <button
          onClick={() => setHistoryOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium hover:bg-white/10"
        >
          <History className="h-3.5 w-3.5" />
          History
        </button>
      }
      contentClassName="flex-1 min-h-0 flex"
    >
      {/* Secondary history panel */}
      <aside
        className={`absolute right-0 top-[57px] z-20 h-[calc(100%-57px)] w-72 transform border-l border-white/10 bg-black/80 backdrop-blur-2xl transition-transform duration-300 md:static md:h-auto md:translate-x-0 ${
          historyOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
        } md:order-2 md:border-l md:border-r-0 md:w-64`}
      >
        {HistoryList}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:order-1">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {messages.length === 0 && !sending && (
              <div className="mt-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-black shadow-glow">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="mt-5 font-display text-3xl font-bold tracking-tight">
                  Your AI workspace for everything.
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ask Nexio anything — research, code, content, or planning.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <Bubble key={m.id} role={m.role} content={m.content} />
            ))}

            {sending && messages[messages.length - 1]?.role !== "assistant" && (
              <Bubble role="assistant" content="" pending />
            )}
          </div>
        </div>

        {error && (
          <div className="mx-auto w-full max-w-3xl px-4 pb-2 md:px-8">
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          </div>
        )}

        <div className="border-t border-white/10 px-4 py-4 md:px-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="glass-strong mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl p-2"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Message Nexio…"
              rows={1}
              className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="glow-button flex h-10 w-10 items-center justify-center rounded-xl disabled:opacity-50"
              aria-label="Send"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground">
            Nexio can make mistakes. Verify important info.
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function Bubble({
  role,
  content,
  pending,
}: {
  role: "user" | "assistant" | "system";
  content: string;
  pending?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-black shadow-glow">
          <Sparkles className="h-4 w-4" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-white text-black font-medium"
            : "glass border border-white/10 text-foreground"
        }`}
      >
        {pending ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
          </span>
        ) : isUser ? (
          <span className="whitespace-pre-wrap">{content}</span>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none prose-pre:bg-black/60 prose-pre:border prose-pre:border-white/10 prose-code:text-foreground">
            <ReactMarkdown>{content}</ReactMarkdown>
            {content && <span className="animate-caret">▍</span>}
          </div>
        )}
      </div>
    </div>
  );
}
