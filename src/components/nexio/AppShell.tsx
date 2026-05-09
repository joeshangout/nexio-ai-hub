import { type ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  MessageSquare,
  Layers,
  ListChecks,
  FileText,
  Menu,
  X,
  LogOut,
  BookOpen,
  CalendarDays,
  Wand2,
  Lock,
  Mic,
  Code2,
  Globe2,
  Bug,
  Lightbulb,
  Rocket,
  Users,
  Flame,
  Newspaper,
  FolderOpen,
  Bookmark,
  Bot,
  LayoutTemplate,
  GraduationCap,
  Headphones,
  Languages,
  PenLine,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ThemeSwitcher } from "@/components/nexio/ThemeSwitcher";

type Item = {
  label: string;
  to?: string;
  icon: React.ComponentType<{ className?: string }>;
  soon?: boolean;
};

type Section = { id: string; label: string; items: Item[]; defaultOpen?: boolean };

const SECTIONS: Section[] = [
  {
    id: "general",
    label: "General",
    defaultOpen: true,
    items: [
      { label: "AI Chat", to: "/chat", icon: MessageSquare },
      { label: "Saved", icon: Bookmark, soon: true },
    ],
  },
  {
    id: "edu",
    label: "Edu Tools",
    defaultOpen: true,
    items: [
      { label: "Flashcards", to: "/app/flashcards", icon: Layers },
      { label: "Quiz Generator", to: "/app/quiz", icon: ListChecks },
      { label: "PDF Study", to: "/app/pdf-study", icon: FileText },
      { label: "Homework Help", icon: BookOpen, soon: true },
      { label: "Last Minute Mode", icon: Flame, soon: true },
      { label: "Notes Cleaner", icon: Wand2, soon: true },
      { label: "Essay Improver", icon: PenLine, soon: true },
      { label: "Study Planner", icon: CalendarDays, soon: true },
    ],
  },
  {
    id: "voice",
    label: "Nexio Voice",
    defaultOpen: true,
    items: [
      { label: "Voice Chat", to: "/app/voice", icon: Mic },
      { label: "Study Tutor", icon: GraduationCap, soon: true },
      { label: "Interview Practice", icon: Headphones, soon: true },
      { label: "Language Practice", icon: Languages, soon: true },
    ],
  },
  {
    id: "code",
    label: "CodeSpace",
    items: [
      { label: "Coding Assistant", icon: Code2, soon: true },
      { label: "Website Builder", icon: Globe2, soon: true },
      { label: "Debugger", icon: Bug, soon: true },
      { label: "Code Explainer", icon: Lightbulb, soon: true },
      { label: "Project Generator", icon: Rocket, soon: true },
    ],
  },
  {
    id: "social",
    label: "Social",
    items: [
      { label: "Friends", to: "/app/social", icon: Users },
      { label: "Streaks", to: "/app/social", icon: Flame },
      { label: "Nexio Feed", to: "/app/social", icon: Newspaper },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    items: [
      { label: "Files", icon: FolderOpen, soon: true },
      { label: "Projects", icon: Bookmark, soon: true },
      { label: "AI Agents", icon: Bot, soon: true },
      { label: "Templates", icon: LayoutTemplate, soon: true },
    ],
  },
];

export function AppShell({
  title,
  children,
  rightSlot,
  contentClassName,
}: {
  title: string;
  children: ReactNode;
  rightSlot?: ReactNode;
  contentClassName?: string;
}) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SECTIONS.map((s) => [s.id, !s.defaultOpen])),
  );

  const isActive = (to?: string) => !!to && location.pathname === to;

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      <div className="absolute inset-0 -z-10 bg-gradient-mesh" />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-white/10 bg-black/80 backdrop-blur-2xl transition-transform duration-300 md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-3">
          <div className="flex items-center justify-between px-2 py-2">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-black shadow-glow">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="font-display text-base font-bold tracking-tight">Nexio</span>
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 hover:bg-white/10 md:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
            {SECTIONS.map((section) => {
              const isCollapsed = collapsed[section.id];
              return (
                <div key={section.id}>
                  <button
                    onClick={() =>
                      setCollapsed((c) => ({ ...c, [section.id]: !c[section.id] }))
                    }
                    className="flex w-full items-center justify-between px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition hover:text-foreground"
                  >
                    {section.label}
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                    />
                  </button>
                  {!isCollapsed && (
                    <ul className="mt-1 space-y-0.5">
                      {section.items.map((it) => {
                        const Icon = it.icon;
                        if (it.soon) {
                          return (
                            <li key={it.label}>
                              <div className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground/50">
                                <Icon className="h-4 w-4" />
                                <span className="flex-1">{it.label}</span>
                                <Lock className="h-3 w-3" />
                              </div>
                            </li>
                          );
                        }
                        const active = isActive(it.to);
                        return (
                          <li key={it.label}>
                            <Link
                              to={it.to!}
                              onClick={() => setOpen(false)}
                              className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                                active
                                  ? "bg-white text-black shadow-glow"
                                  : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              {it.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-accent text-xs font-bold text-white shadow-glow">
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center gap-1">
              <ThemeSwitcher />
              <button
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/auth" });
                }}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {open && (
        <button
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <main className="flex h-full flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 hover:bg-white/10 md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="truncate font-display text-base font-bold tracking-tight">{title}</h1>
          </div>
          {rightSlot}
        </header>
        <div className={contentClassName ?? "flex-1 overflow-y-auto"}>{children}</div>
      </main>
    </div>
  );
}
