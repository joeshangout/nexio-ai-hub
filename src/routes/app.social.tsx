import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Flame, Users, Newspaper, Trophy, Sparkles } from "lucide-react";
import { AppShell } from "@/components/nexio/AppShell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/app/social")({
  head: () => ({
    meta: [
      { title: "Nexio Social — Streaks, Friends & Feed" },
      { name: "description", content: "Build study streaks, add friends, and share what you learn." },
    ],
  }),
  component: SocialPage,
});

function SocialPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);
  if (loading || !user) return null;

  const streak = 4;
  const xp = 1240;
  const level = 6;

  return (
    <AppShell title="Social">
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Stat icon={Flame} label="Day streak" value={`${streak}🔥`} />
          <Stat icon={Trophy} label="Level" value={`Lv ${level}`} />
          <Stat icon={Sparkles} label="XP" value={`${xp}`} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Panel title="Friends" icon={Users}>
            <p className="text-sm text-muted-foreground">
              Add classmates to compete on streaks and share study guides.
            </p>
            <button className="glow-button mt-4 rounded-xl px-4 py-2 text-sm">
              Invite friends
            </button>
            <p className="mt-3 text-xs text-muted-foreground/70">Coming soon</p>
          </Panel>

          <Panel title="Nexio Feed" icon={Newspaper}>
            <ul className="space-y-3 text-sm">
              {[
                { who: "Alex", what: "shared a Biology flashcard deck", t: "2h" },
                { who: "Maya", what: "hit a 14 day streak 🔥", t: "5h" },
                { who: "Sam", what: "aced AP Calculus quiz (94%)", t: "1d" },
              ].map((p, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-accent text-xs font-bold text-white">
                    {p.who[0]}
                  </div>
                  <div className="flex-1">
                    <p>
                      <span className="font-semibold">{p.who}</span>{" "}
                      <span className="text-muted-foreground">{p.what}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground/60">{p.t} ago</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground/70">Preview — feed coming soon</p>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4" /> {label}
      </div>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-strong rounded-3xl p-6">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
      </div>
      {children}
    </section>
  );
}
