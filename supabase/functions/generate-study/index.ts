// Generate structured study content (flashcards, quiz, summary) via Lovable AI Gateway.
// Returns JSON. Auth required. Persistence (decks/quizzes) is handled by the caller.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Kind = "flashcards" | "quiz" | "summary";

const PROMPTS: Record<Kind, { system: string; userPrefix: string }> = {
  flashcards: {
    system:
      "You are a study assistant that converts source material into high-quality flashcards. Output STRICT JSON: { \"title\": string, \"cards\": [{ \"question\": string, \"answer\": string }] }. 8-20 cards. Questions short and specific; answers complete but concise. No markdown.",
    userPrefix: "Create flashcards from the following material:\n\n",
  },
  quiz: {
    system:
      "You are a study assistant that creates multiple-choice quizzes. Output STRICT JSON: { \"title\": string, \"questions\": [{ \"question\": string, \"options\": [string,string,string,string], \"correctIndex\": number (0-3), \"explanation\": string }] }. 5-10 questions. Exactly 4 options each. Options plausible but only one correct. No markdown.",
    userPrefix: "Create a quiz from the following material:\n\n",
  },
  summary: {
    system:
      "You are a study assistant that summarizes notes for quick revision. Output STRICT JSON: { \"title\": string, \"summary\": string (markdown bullets allowed), \"keyTerms\": [{ \"term\": string, \"definition\": string }] }.",
    userPrefix: "Summarize the following material:\n\n",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { kind, text } = (await req.json()) as { kind: Kind; text: string };
    if (!kind || !PROMPTS[kind] || !text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing kind or text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const trimmed = text.slice(0, 24000); // safety cap

    const cfg = PROMPTS[kind];
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: cfg.system },
          { role: "user", content: cfg.userPrefix + trimmed },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      const msg =
        status === 429
          ? "Rate limit reached. Try again shortly."
          : status === 402
            ? "AI credits exhausted. Add credits in Workspace settings."
            : "AI gateway error";
      return new Response(JSON.stringify({ error: msg }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await aiResp.json();
    const content: string = payload.choices?.[0]?.message?.content ?? "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      // try to extract first {...} block
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : {};
    }

    return new Response(JSON.stringify({ data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-study error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
