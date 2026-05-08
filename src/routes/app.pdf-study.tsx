import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, Loader2, Upload, FileText, Layers, ListChecks } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/nexio/AppShell";
import {
  generateFlashcards,
  generateQuiz,
  generateSummary,
  type Flashcard,
  type QuizQuestion,
  type SummaryResult,
} from "@/lib/study";

export const Route = createFileRoute("/app/pdf-study")({
  head: () => ({
    meta: [
      { title: "PDF Study Helper — Nexio" },
      {
        name: "description",
        content: "Upload a PDF and generate summaries, flashcards, and quizzes instantly.",
      },
    ],
  }),
  component: PdfStudyPage,
});

type Tab = "summary" | "flashcards" | "quiz";

function PdfStudyPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [fileName, setFileName] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [text, setText] = useState("");
  const [tab, setTab] = useState<Tab>("summary");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const onFile = async (file: File) => {
    setError(null);
    setFileName(file.name);
    setSummary(null);
    setCards(null);
    setQuestions(null);
    setExtracting(true);
    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const pdfjs = await import("pdfjs-dist");
        // Vite-friendly worker URL
        const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

        const buf = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        let out = "";
        const max = Math.min(doc.numPages, 50);
        for (let i = 1; i <= max; i++) {
          const page = await doc.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .map((it) => ("str" in it ? (it as { str: string }).str : ""))
            .join(" ");
          out += pageText + "\n\n";
        }
        setText(out.trim());
      } else if (file.type.startsWith("text/") || file.name.match(/\.(txt|md)$/i)) {
        setText(await file.text());
      } else {
        throw new Error("Unsupported file type. Upload a PDF or text file.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read file");
      setFileName(null);
    } finally {
      setExtracting(false);
    }
  };

  const run = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      if (tab === "summary") setSummary(await generateSummary(text));
      else if (tab === "flashcards") {
        const r = await generateFlashcards(text);
        setCards(r.cards.filter((c) => c.question && c.answer));
      } else {
        const r = await generateQuiz(text);
        setQuestions(
          r.questions.filter(
            (q) => q.options?.length === 4 && q.correctIndex >= 0 && q.correctIndex <= 3,
          ),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "summary", label: "Summary", icon: FileText },
    { id: "flashcards", label: "Flashcards", icon: Layers },
    { id: "quiz", label: "Quiz", icon: ListChecks },
  ];

  return (
    <AppShell title="PDF Study Helper">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 md:px-8">
        <div className="glass-strong rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight">
                Study any document
              </h2>
              <p className="text-sm text-muted-foreground">
                Upload a PDF or text file. Nexio extracts the contents and helps you study.
              </p>
            </div>
          </div>

          <div
            className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-10 text-center transition hover:bg-white/5"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) onFile(f);
            }}
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">
              {fileName ?? "Click or drop a PDF / .txt file"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Up to 50 pages processed locally in your browser.
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,text/plain,.md,.pdf,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </div>

          {extracting && (
            <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Extracting text…
            </p>
          )}
          {text && !extracting && (
            <p className="mt-3 text-xs text-muted-foreground">
              {text.length.toLocaleString()} characters ready.
            </p>
          )}
          {error && (
            <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>

        {text && (
          <div className="glass-strong rounded-3xl p-2">
            <div className="flex flex-wrap items-center gap-1 p-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      active ? "bg-white text-black" : "text-muted-foreground hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {t.label}
                  </button>
                );
              })}
            </div>

            <div className="p-4">
              <button
                onClick={run}
                disabled={busy}
                className="glow-button flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {busy
                  ? "Generating…"
                  : tab === "summary"
                    ? "Generate summary"
                    : tab === "flashcards"
                      ? "Generate flashcards"
                      : "Generate quiz"}
              </button>

              <div className="mt-5">
                {tab === "summary" && summary && (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <h3 className="font-display text-lg font-bold">{summary.title}</h3>
                    <ReactMarkdown>{summary.summary}</ReactMarkdown>
                    {summary.keyTerms?.length > 0 && (
                      <>
                        <h4 className="font-display font-bold">Key terms</h4>
                        <ul>
                          {summary.keyTerms.map((k) => (
                            <li key={k.term}>
                              <strong>{k.term}:</strong> {k.definition}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
                {tab === "flashcards" && cards && (
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {cards.map((c, i) => (
                      <li
                        key={i}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Q{i + 1}
                        </p>
                        <p className="mt-1 font-semibold">{c.question}</p>
                        <p className="mt-2 text-muted-foreground">{c.answer}</p>
                      </li>
                    ))}
                  </ul>
                )}
                {tab === "quiz" && questions && (
                  <ul className="space-y-4">
                    {questions.map((q, i) => (
                      <li
                        key={i}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm"
                      >
                        <p className="font-semibold">
                          {i + 1}. {q.question}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {q.options.map((opt, j) => (
                            <li
                              key={j}
                              className={`rounded-lg px-3 py-1.5 ${
                                j === q.correctIndex
                                  ? "bg-emerald-400/10 text-emerald-200"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {String.fromCharCode(65 + j)}. {opt}
                            </li>
                          ))}
                        </ul>
                        {q.explanation && (
                          <p className="mt-2 text-xs text-muted-foreground">{q.explanation}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
