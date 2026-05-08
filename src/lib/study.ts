import { supabase } from "@/integrations/supabase/client";

const URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-study`;

export type Flashcard = { question: string; answer: string };
export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};
export type FlashcardResult = { title: string; cards: Flashcard[] };
export type QuizResult = { title: string; questions: QuizQuestion[] };
export type SummaryResult = {
  title: string;
  summary: string;
  keyTerms: { term: string; definition: string }[];
};

async function call<T>(kind: "flashcards" | "quiz" | "summary", text: string): Promise<T> {
  const { data: s } = await supabase.auth.getSession();
  const token = s.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const resp = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ kind, text }),
  });
  const json = await resp.json();
  if (!resp.ok) throw new Error(json.error || "Generation failed");
  return json.data as T;
}

export const generateFlashcards = (text: string) => call<FlashcardResult>("flashcards", text);
export const generateQuiz = (text: string) => call<QuizResult>("quiz", text);
export const generateSummary = (text: string) => call<SummaryResult>("summary", text);
