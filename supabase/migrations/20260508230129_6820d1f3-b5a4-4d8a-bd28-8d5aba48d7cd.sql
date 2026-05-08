
create table public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null default 'Untitled deck',
  source_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.decks enable row level security;
create policy "decks owner select" on public.decks for select using (auth.uid() = user_id);
create policy "decks owner insert" on public.decks for insert with check (auth.uid() = user_id);
create policy "decks owner update" on public.decks for update using (auth.uid() = user_id);
create policy "decks owner delete" on public.decks for delete using (auth.uid() = user_id);
create trigger decks_updated_at before update on public.decks for each row execute function public.set_updated_at();

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.decks(id) on delete cascade,
  user_id uuid not null,
  question text not null,
  answer text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.flashcards enable row level security;
create policy "flashcards owner select" on public.flashcards for select using (auth.uid() = user_id);
create policy "flashcards owner insert" on public.flashcards for insert with check (auth.uid() = user_id);
create policy "flashcards owner update" on public.flashcards for update using (auth.uid() = user_id);
create policy "flashcards owner delete" on public.flashcards for delete using (auth.uid() = user_id);
create index flashcards_deck_idx on public.flashcards(deck_id, position);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null default 'Untitled quiz',
  source_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.quizzes enable row level security;
create policy "quizzes owner select" on public.quizzes for select using (auth.uid() = user_id);
create policy "quizzes owner insert" on public.quizzes for insert with check (auth.uid() = user_id);
create policy "quizzes owner update" on public.quizzes for update using (auth.uid() = user_id);
create policy "quizzes owner delete" on public.quizzes for delete using (auth.uid() = user_id);
create trigger quizzes_updated_at before update on public.quizzes for each row execute function public.set_updated_at();

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null,
  question text not null,
  options jsonb not null,
  correct_index int not null,
  explanation text,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.quiz_questions enable row level security;
create policy "qq owner select" on public.quiz_questions for select using (auth.uid() = user_id);
create policy "qq owner insert" on public.quiz_questions for insert with check (auth.uid() = user_id);
create policy "qq owner update" on public.quiz_questions for update using (auth.uid() = user_id);
create policy "qq owner delete" on public.quiz_questions for delete using (auth.uid() = user_id);
create index quiz_questions_quiz_idx on public.quiz_questions(quiz_id, position);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null,
  score int not null,
  total int not null,
  created_at timestamptz not null default now()
);
alter table public.quiz_attempts enable row level security;
create policy "qa owner select" on public.quiz_attempts for select using (auth.uid() = user_id);
create policy "qa owner insert" on public.quiz_attempts for insert with check (auth.uid() = user_id);
create policy "qa owner delete" on public.quiz_attempts for delete using (auth.uid() = user_id);
