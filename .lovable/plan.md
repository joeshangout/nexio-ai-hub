# Nexio Student v1 — Plan

Your message lists ~30 features. Shipping all of them in one pass would mean lots of shallow, half-broken tools. Per your own guidance ("3 INSANELY GOOD student tools"), I'll do exactly that plus the visual refresh and sidebar. Everything else becomes a follow-up.

Note on the OpenAI key: backend already uses the **Lovable AI Gateway** (no key needed, streaming, free during promo). I'll keep that. If you specifically want OpenAI calls instead, say the word and I'll switch the edge function over to your `OPENAI_API_KEY` (stored as the `NEXIO` secret? please confirm the secret name).

## What I'll build now

### 1. Theme: "Bold White on Black / Glass"
- Pure black background (`#000`), bold white type, SF-Pro-style stack (`-apple-system, "SF Pro Display", Inter`).
- Heavy glassmorphism: backdrop-blur, 1px white/10 borders, soft white glow shadows.
- Update `src/styles.css` tokens + `ThemeSwitcher` default.
- Auth page redesigned to match (you're on `/auth` now and it needs polish).

### 2. App shell with persistent sidebar
- New `/app` layout route using shadcn `Sidebar` (always visible, collapsible to icons).
- Sidebar items: **Chat · Flashcards · Quiz · PDF Study** (others greyed "Soon").
- Move existing chat to `/app/chat`.

### 3. Flashcards (`/app/flashcards`)
- Paste notes → AI generates Q/A cards (JSON via Lovable AI structured output, `google/gemini-3-flash-preview`).
- Flip animation (CSS 3D transform), keyboard nav, deck saved to DB.
- Export to JSON/CSV.

### 4. Quiz Generator (`/app/quiz`)
- Paste notes → AI generates MCQs (4 options + correct + explanation).
- Progress bar, instant feedback, final score, animated transitions.

### 5. PDF Study Helper (`/app/pdf-study`)
- Upload PDF → text extracted client-side with `pdfjs-dist`.
- Tabs: Summary · Flashcards · Quiz · Ask (chat over the doc).

## Database

New tables (RLS: owner-only):
- `decks` (id, user_id, title, source_text, created_at)
- `flashcards` (id, deck_id, user_id, question, answer, position)
- `quizzes` (id, user_id, title, source_text, created_at)
- `quiz_questions` (id, quiz_id, user_id, question, options jsonb, correct_index, explanation, position)
- `quiz_attempts` (id, quiz_id, user_id, score, total, created_at)

## Edge functions

Extend `supabase/functions/chat` OR add `generate-study` function that returns structured JSON for flashcards/quiz/summary. Streaming kept for chat; structured calls are non-streaming.

## Explicitly NOT in this pass
Homework explainer, notes cleaner, study planner, essay improver, last-minute mode, class modes, ELI12 toggle, voice mode, streaks, group study, spaces, note scanner, custom agents, lock-in mode, AI website builder, pfp generator, roast mode, social sharing, student-vs-creator onboarding, memory profile, workspace tabs.

These are good ideas — we add them in follow-up turns once the core 3 feel great. Pushing them all in now will produce a pile of mediocre features, which is exactly the trap your own brief warns against.

## Confirm before I start
1. **Scope OK?** Ship theme + sidebar + Flashcards + Quiz + PDF Study now, queue the rest?
2. **AI provider**: keep Lovable AI Gateway (recommended) or switch to your OpenAI key?

Reply "go" (or with changes) and I'll implement.
