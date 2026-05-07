import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  Plus,
  Send,
  Trash2,
  LogOut,
  Loader2,
  Menu,
  X,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { streamChat } from "@/lib/chat-stream";
import { ThemeSwitcher } from "@/components/nexio/ThemeSwitcher";

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
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  // Load conversations
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

  // Load messages when conversation changes
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
    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: "New chat" })
      .select("id,title,updated_at")
      .single();
    if (error || !data) return;
    setConversations((prev) => [data as Conversation, ...prev]);
    setActiveId(data.id);
    setMessages([]);
    setSidebarOpen(false);
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

    let assistantBuf = "";
    const upsert = (chunk: string) => {
      assistantBuf += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id.startsWith("stream-")) {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantBuf } : m,
          );
        }
        return [...prev, { id: `stream-${Date.now()}`, role: "assistant", content: assistantBuf }];
      });
    };

    try {
      await streamChat({ conversationId: convoId!, content: text, onDelta: upsert });
      // Refresh sidebar order/title
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative flex h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-mesh" />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-white/10 bg-background/80 backdrop-blur-xl transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-3">
          <div className="flex items-center justify-between px-2 py-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                <Sparkles className="h-4 w-4 text-white" />
              </span>
              <span className="font-display text-base font-semibold">Nexio</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1.5 hover:bg-white/10 md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={newChat}
            className="glow-button mt-2 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> New chat
          </button>

          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              History
            </p>
            <ul className="space-y-1">
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
                      setSidebarOpen(false);
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
                      aria-label="Delete chat"
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

          <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-xs font-semibold text-white">
                {user.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThemeSwitcher />
              <button
                onClick={signOut}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Main */}
      <main className="flex h-full flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 hover:bg-white/10 md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="truncate font-display text-base font-semibold">{activeTitle}</h1>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {messages.length === 0 && !sending && (
              <div className="mt-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h2 className="mt-5 font-display text-2xl font-semibold">
                  Your AI workspace for everything.
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ask Nexio anything — research, code, content, or planning.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <MessageBubble key={m.id} role={m.role} content={m.content} />
            ))}

            {sending && messages[messages.length - 1]?.role !== "assistant" && (
              <MessageBubble role="assistant" content="" pending />
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
            className="glass-strong mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl p-2 shadow-elegant"
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
      </main>
    </div>
  );
}

function MessageBubble({
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
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-primary text-primary-foreground shadow-glow"
            : "glass border border-white/10"
        }`}
      >
        {pending ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
          </span>
        ) : (
          <>
            {content}
            {role === "assistant" && content && <span className="animate-caret">▍</span>}
          </>
        )}
      </div>
    </div>
  );
}
