import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative mx-auto mt-12 max-w-6xl px-4 pb-12">
      <div className="glass rounded-3xl p-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-lg font-semibold">Nexio</span>
          </div>
          <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#dashboard" className="hover:text-foreground">Product</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#testimonials" className="hover:text-foreground">Customers</a>
          </nav>
          <p className="text-xs text-muted-foreground">© 2026 Nexio Labs · Built for makers</p>
        </div>
      </div>
    </footer>
  );
}
