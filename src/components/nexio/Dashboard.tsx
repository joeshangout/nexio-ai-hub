import { motion } from "framer-motion";
import {
  Search,
  Home,
  MessageSquare,
  Bot,
  FolderKanban,
  Settings,
  Sparkles,
  Activity,
  Cpu,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const sidebar = [
  { icon: Home, label: "Home", active: true },
  { icon: MessageSquare, label: "Chat" },
  { icon: Bot, label: "Agents" },
  { icon: FolderKanban, label: "Projects" },
  { icon: Settings, label: "Settings" },
];

const activity = [
  { icon: CheckCircle2, text: "Agent · Inbox triage finished", time: "now", status: "ok" },
  { icon: Loader2, text: "Researching: 'edge AI inference'", time: "12s", status: "run" },
  { icon: Cpu, text: "GPT-5.4 reasoning · 1.2s", time: "1m", status: "ok" },
  { icon: CheckCircle2, text: "Drafted launch post · approved", time: "4m", status: "ok" },
];

export function Dashboard() {
  return (
    <section id="dashboard" className="relative mx-auto max-w-6xl px-4 py-24">
      <div className="mb-14 text-center">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-primary/80">The product</p>
        <h2 className="font-display text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          A workspace that <span className="gradient-text">thinks with you.</span>
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="glass-strong relative mx-auto rounded-[2rem] p-2 shadow-elegant"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-50"
          style={{ background: "var(--gradient-primary)", filter: "blur(40px)", zIndex: -1 }}
        />
        <div className="grid grid-cols-12 gap-2 rounded-3xl bg-background/40 p-3 min-h-[520px]">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-3 lg:col-span-2 rounded-2xl border border-white/5 bg-background/30 p-3">
            <div className="mb-4 flex items-center gap-2 px-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-sm font-semibold">Nexio</span>
            </div>
            <nav className="space-y-1">
              {sidebar.map((s) => (
                <button
                  key={s.label}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs transition ${
                    s.active ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5"
                  }`}
                >
                  <s.icon className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">{s.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main */}
          <div className="col-span-12 md:col-span-9 lg:col-span-7 rounded-2xl border border-white/5 bg-background/30 p-4">
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-white/5 bg-background/30 px-3 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Ask Nexio anything…</span>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/5 bg-background/30 p-4">
                <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  You
                </div>
                <p className="text-sm">Plan my week and prep for Thursday's launch.</p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-primary">
                  <Sparkles className="h-3 w-3" /> Nexio
                </div>
                <p className="text-sm leading-relaxed">
                  I drafted a 5-day plan, blocked focus time, and prepared 3 launch assets.
                  Approve to dispatch agents.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Plan", "Draft post", "Slides", "Email"].map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-white/10 bg-background/40 px-2.5 py-1 text-[10px]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div className="h-3 w-2/3 animate-shimmer rounded-full" />
              <div className="h-3 w-1/2 animate-shimmer rounded-full" />
            </div>
          </div>

          {/* Activity */}
          <aside className="col-span-12 lg:col-span-3 rounded-2xl border border-white/5 bg-background/30 p-3">
            <div className="mb-3 flex items-center gap-2 px-1">
              <Activity className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">Live AI activity</span>
            </div>
            <ul className="space-y-2">
              {activity.map((a, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-xl border border-white/5 bg-background/30 p-2.5"
                >
                  <a.icon
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                      a.status === "run" ? "animate-spin text-primary" : "text-primary"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] leading-snug">{a.text}</p>
                    <p className="text-[10px] text-muted-foreground">{a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </motion.div>
    </section>
  );
}
