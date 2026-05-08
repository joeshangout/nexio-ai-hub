import { useEffect, useState } from "react";
import { Palette } from "lucide-react";

const THEMES = [
  { id: "", label: "Apple Dark", swatch: "linear-gradient(135deg,#000,#222)" },
  { id: "theme-bold-white", label: "Bold White", swatch: "linear-gradient(135deg,#fff,#e9d5ff)" },
  { id: "theme-sunset", label: "Sunset", swatch: "linear-gradient(135deg,#f59e0b,#ec4899)" },
  { id: "theme-emerald", label: "Emerald", swatch: "linear-gradient(135deg,#10b981,#06b6d4)" },
];

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("nexio-theme") || "";
    setTheme(saved);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    THEMES.forEach((t) => t.id && root.classList.remove(t.id));
    if (theme) root.classList.add(theme);
    localStorage.setItem("nexio-theme", theme);
  }, [theme]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="glass hover:ring-glow flex h-10 w-10 items-center justify-center rounded-full transition"
        aria-label="Switch theme"
      >
        <Palette className="h-4 w-4" />
      </button>
      {open && (
        <div className="glass-strong absolute right-0 mt-2 w-52 rounded-2xl p-2 shadow-elegant z-50">
          <p className="px-3 py-1.5 text-xs uppercase tracking-wider text-muted-foreground">Theme</p>
          {THEMES.map((t) => (
            <button
              key={t.id || "default"}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-white/5"
            >
              <span className="h-5 w-5 rounded-full border border-white/20" style={{ background: t.swatch }} />
              <span className="flex-1 text-left">{t.label}</span>
              {theme === t.id && <span className="h-2 w-2 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
