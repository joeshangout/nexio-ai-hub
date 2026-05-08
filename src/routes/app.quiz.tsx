import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, Loader2, Check, X, ChevronRight, RotateCcw, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/nexio/AppShell";
import { generateQuiz, type QuizQuestion } from "@/lib/study";

type QuizMeta = { id: string; title: string; created_at: string };

export const Route = createFileRoute("/app/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz Generator — Nexio" },
      { name: "description", content: "AI-generated multiple-choice quizzes from your notes." },
    ],
  }),
  component: QuizPage,
});

function QuizPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<QuizMeta[]>([]);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("quizzes")
      .select("id,title,created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setQuizzes((data ?? []) as QuizMeta[]));
  }, [user]);

  const reset = () => {
    setStep(0);
    setSelected(null);
    setRevealed(false);
    setAnswers([]);
  };

  const loadQuiz = async (id: string) => {
    setActiveQuizId(id);
    reset();
    const { data } = await supabase
      .from("quiz_questions")
      .select("question,options,correct_index,explanation,position")
      .eq("quiz_id", id)
      .order("position", { ascending: true });
    setQuestions(
      (data ?? []).map((q) => ({
        question: q.question,
        options: (q.options as string[]) ?? [],
        correctIndex: q.correct_index,
        explanation: q.explanation ?? undefined,
      })),
    );
  };

  const generate = async () => {
    if (!text.trim() || !user) return;
    setBusy(true);
    setError(null);
    try {
      const result = await generateQuiz(text);
      const valid = (result.questions ?? []).filter(
        (q) =>
          q.question &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          typeof q.correctIndex === "number" &&
          q.correctIndex >= 0 &&
          q.correctIndex <= 3,
      );
      if (!valid.length) throw new Error("No valid questions generated. Try more material.");

      const { data: quiz, error: qerr } = await supabase
        .from("quizzes")
        .insert({
          user_id: user.id,
          title: result.title || "Untitled quiz",
          source_text: text.slice(0, 8000),
        })
        .select("id,title,created_at")
        .single();
      if (qerr || !quiz) throw qerr ?? new Error("Failed to save quiz");

      const rows = valid.map((q, i) => ({
        quiz_id: quiz.id,
        user_id: user.id,
        question: q.question,
        options: q.options,
        correct_index: q.correctIndex,
        explanation: q.explanation ?? null,
        position: i,
      }));
      await supabase.from("quiz_questions").insert(rows);

      setQuizzes((prev) => [quiz as QuizMeta, ...prev]);
      setActiveQuizId(quiz.id);
      setQuestions(valid);
      reset();
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  };

  const submit = (i: number) => {
    if (revealed) return;
    setSelected(i);
    setRevealed(true);
    setAnswers((a) => [...a, i]);
  };

  const advance = async () => {
    setSelected(null);
    setRevealed(false);
    if (step + 1 >= questions.length) {
      // finish
      const score = answers.reduce(
        (acc, a, i) => acc + (a === questions[i].correctIndex ? 1 : 0),
        0,
      );
      if (user && activeQuizId) {
        await supabase.from("quiz_attempts").insert({
          quiz_id: activeQuizId,
          user_id: user.id,
          score,
          total: questions.length,
        });
      }
      setStep(questions.length); // results screen
    } else {
      setStep((s) => s + 1);
    }
  };

  const deleteQuiz = async (id: string) => {
    await supabase.from("quizzes").delete().eq("id", id);
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
    if (activeQuizId === id) {
      setActiveQuizId(null);
      setQuestions([]);
      reset();
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const finished = questions.length > 0 && step >= questions.length;
  const score = answers.reduce(
    (acc, a, i) => acc + (questions[i] && a === questions[i].correctIndex ? 1 : 0),
    0,
  );
  const progress = questions.length ? Math.min(step / questions.length, 1) : 0;

  return (
    <AppShell title="Quiz Generator">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-8">
        {!questions.length ? (
          <div className="glass-strong rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight">Make a quiz</h2>
                <p className="text-sm text-muted-foreground">
                  Paste study material — Nexio writes 5-10 multiple-choice questions.
                </p>
              </div>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your notes…"
              rows={10}
              className="mt-5 w-full resize-y rounded-2xl border border-white/10 bg-white/5 p-4 text-sm outline-none placeholder:text-muted-foreground focus:border-white/30"
            />
            {error && (
              <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}
            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={generate}
                disabled={busy || !text.trim()}
                className="glow-button flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {busy ? "Generating…" : "Generate quiz"}
              </button>
            </div>
          </div>
        ) : finished ? (
          <div className="glass-strong rounded-3xl p-8 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Result
            </p>
            <p className="mt-3 font-display text-5xl font-bold tracking-tight">
              {score}
              <span className="text-muted-foreground">/{questions.length}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {Math.round((score / questions.length) * 100)}% correct
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={reset}
                className="glow-button flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm"
              >
                <RotateCcw className="h-4 w-4" /> Retry
              </button>
              <button
                onClick={() => {
                  setQuestions([]);
                  setActiveQuizId(null);
                  reset();
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium hover:bg-white/10"
              >
                New quiz
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Question {step + 1} of {questions.length}
                </span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>

            <div className="glass-strong rounded-3xl p-6 md:p-8">
              <h3 className="font-display text-xl font-bold leading-snug tracking-tight md:text-2xl">
                {questions[step].question}
              </h3>
              <ul className="mt-5 space-y-2">
                {questions[step].options.map((opt, i) => {
                  const isCorrect = i === questions[step].correctIndex;
                  const isSelected = selected === i;
                  let style =
                    "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20";
                  if (revealed) {
                    if (isCorrect) style = "border-emerald-400/40 bg-emerald-400/10";
                    else if (isSelected) style = "border-rose-400/40 bg-rose-400/10";
                    else style = "border-white/5 bg-white/[0.02] opacity-60";
                  }
                  return (
                    <li key={i}>
                      <button
                        onClick={() => submit(i)}
                        disabled={revealed}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${style}`}
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/20 text-[11px] font-semibold">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {revealed && isCorrect && <Check className="h-4 w-4 text-emerald-400" />}
                        {revealed && isSelected && !isCorrect && (
                          <X className="h-4 w-4 text-rose-400" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {revealed && questions[step].explanation && (
                <p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-muted-foreground">
                  {questions[step].explanation}
                </p>
              )}
              {revealed && (
                <div className="mt-5 flex justify-end">
                  <button
                    onClick={advance}
                    className="glow-button flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm"
                  >
                    {step + 1 >= questions.length ? "See result" : "Next"}{" "}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {quizzes.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Saved quizzes
            </p>
            <ul className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {quizzes.map((q) => (
                <li
                  key={q.id}
                  className={`group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm transition hover:border-white/20 ${
                    activeQuizId === q.id ? "ring-1 ring-white/40" : ""
                  }`}
                >
                  <button onClick={() => loadQuiz(q.id)} className="flex-1 truncate text-left">
                    {q.title}
                  </button>
                  <button
                    onClick={() => deleteQuiz(q.id)}
                    className="rounded p-1 opacity-0 transition group-hover:opacity-100 hover:bg-white/10"
                    aria-label="Delete quiz"
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
