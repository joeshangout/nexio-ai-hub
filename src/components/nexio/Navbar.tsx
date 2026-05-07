import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useAuth } from "@/lib/auth-context";

const links = [
  { href: "#features", label: "Features" },
  { href: "#dashboard", label: "Product" },
  { href: "#pricing", label: "Pricing" },
  { href: "#testimonials", label: "Customers" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={`glass flex w-full max-w-6xl items-center justify-between rounded-full px-3 py-2 transition-all duration-300 ${
          scrolled ? "shadow-elegant" : ""
        }`}
      >
        <a href="#" className="flex items-center gap-2 pl-3">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Nexio</span>
        </a>
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-1.5 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <Link
            to={user ? "/chat" : "/auth"}
            className="glow-button hidden rounded-full px-5 py-2 text-sm font-medium md:inline-block"
          >
            {user ? "Open Nexio" : "Get Nexio"}
          </Link>
        </div>
      </nav>
    </header>
  );
}
