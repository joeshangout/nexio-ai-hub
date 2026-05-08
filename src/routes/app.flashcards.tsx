import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Plus,
  RotateCcw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/nexio/AppShell";
import { generateFlashcards, type Flashcard } from "@/lib/study";

type Deck = { id: string; title: string; created_at: string };

export const Route = createFileRoute("/app/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcard Generator — Nexio" },
      {
        name: "description",
        content: "Paste notes and turn them into AI-powered flashcards in seconds.",
      },
    ],
  }),
  component: FlashcardsPage,
});

function FlashcardsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("decks")
      .select("id,title,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setDecks((data ?? []) as Deck[]));
  }, [user]);

  const loadDeck = async (id: string) => {
    setActiveDeckId(id);
    setIdx(0);
    setFlipped(false);
    const { data } = await supabase
      .from("flashcards")
      .select("question,answer,position")
      .eq("deck_id", id)
      .order("position", { ascending: true });
    setCards((data ?? []).map((c) => ({ question: c.question, answer: c.answer })));
  };

  const generate = async () => {
    if (!text.trim() || !user) return;
    setBusy(true);
    setError(null);
    try {
      const result = await generateFlashcards(text);
      const cleanCards = (result.cards ?? []).filter((c) => c.question && c.answer);
      if (!cleanCards.length) throw new Error("No cards generated. Try more material.");

      const { data: deck, error: derr } = await supabase
        .from("decks")
        .insert({
          user_id: user.id,
          title: result.title || "Untitled deck",
          source_text: text.slice(0, 8000),
        })
        .select("id,title,created_at")
        .single();
      if (derr || !deck) throw derr ?? new Error("Failed to save deck");

      const rows = cleanCards.map((c, i) => ({
        deck_id: deck.id,
        user_id: user.id,
        question: c.question,
        answer: c.answer,
        position: i,
      }));
      await supabase.from("flashcards").insert(rows);

      setDecks((prev) => [deck as Deck, ...prev]);
      setActiveDeckId(deck.id);
      setCards(cleanCards);
      setIdx(0);
      setFlipped(false);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  const deleteDeck = async (id: string) => {
    await supabase.from("decks").delete().eq("id", id);
    setDecks((prev) => prev.filter((d) => d.id !== id));
    if (activeDeckId === id) {
      setActiveDeckId(null);
      setCards([]);
    }
  };

  const exportDeck = () => {
    const blob = new Blob([JSON.stringify({ cards }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexio-flashcards-${activeDeckId ?? "deck"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const next = () => {
    setFlipped(false);
    setIdx((i) => (i + 1) % Math.max(cards.length, 1));
  };
  const prev = () => {
    setFlipped(false);
    setIdx((i) => (i - 1 + cards.length) % Math.max(cards.length, 1));
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AppShell title="Flashcards">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:px-8">
        {!cards.length ? (
          <div className="glass-strong rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight">
                  Turn notes into flashcards
                </h2>
                <p className="text-sm text-muted-foreground">
                  Paste any notes, lecture text, or summary. Nexio creates a deck instantly.
                </p>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your notes here…"
              rows={10}
              className="mt-5 w-full resize-y rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none placeholder:text-muted-foreground focus:border-white/30"
            />
            {error && (
              <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}
            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{text.length.toLocaleString()} chars</p>
              <button
                onClick={generate}
                disabled={busy || !text.trim()}
                className="glow-button flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {busy ? "Generating…" : "Generate flashcards"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div className="flex w-full items-center justify-between text-sm text-muted-foreground">
              <span>
                Card {idx + 1} of {cards.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportDeck}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                >
                  <Download className="h-3.5 w-3.5" /> Export
                </button>
                <button
                  onClick={() => {
                    setCards([]);
                    setActiveDeckId(null);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                >
                  <Plus className="h-3.5 w-3.5" /> New deck
                </button>
              </div>
            </div>

            <div
              className="perspective-1000 w-full max-w-2xl cursor-pointer"
              onClick={() => setFlipped((f) => !f)}
            >
              <div
                className={`preserve-3d relative h-80 w-full transition-transform duration-500 ${
                  flipped ? "rotate-y-180" : ""
                }`}
              >
                <div className="backface-hidden glass-strong absolute inset-0 flex flex-col items-center justify-center rounded-3xl p-8 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Question
                  </p>
                  <p className="mt-4 font-display text-2xl font-bold tracking-tight md:text-3xl">
                    {cards[idx].question}
                  </p>
                  <p className="mt-6 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <RotateCcw className="h-3 w-3" /> Tap to reveal
                  </p>
                </div>
                <div className="backface-hidden rotate-y-180 absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-white p-8 text-center text-black">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-black/60">
                    Answer
                  </p>
                  <p className="mt-4 text-lg font-medium leading-relaxed md:text-xl">
                    {cards[idx].answer}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={prev}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={next}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {decks.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Saved decks
            </p>
            <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {decks.map((d) => (
                <li
                  key={d.id}
                  className={`group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm transition hover:border-white/20 ${
                    activeDeckId === d.id ? "ring-1 ring-white/40" : ""
                  }`}
                >
                  <button onClick={() => loadDeck(d.id)} className="flex-1 truncate text-left">
                    {d.title}
                  </button>
                  <button
                    onClick={() => deleteDeck(d.id)}
                    className="rounded p-1 opacity-0 transition group-hover:opacity-100 hover:bg-white/10"
                    aria-label="Delete deck"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </AppShell>
  );
}
