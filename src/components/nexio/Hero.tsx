import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Sparkles, Wand2 } from "lucide-react";
import { Particles } from "./Particles";

const PROMPTS = [
  "Plan a 3-day study sprint for my finals…",
  "Refactor this React component and add tests…",
  "Draft a launch tweet for my new SaaS…",
  "Summarize today's meeting and assign tasks…",
];

function useTypingLoop(items: string[], speed = 35, pause = 1600) {
  const [i, setI] = useState(0);
  const [text, setText] = useState("");
  const [del, setDel] = useState(false);

  useEffect(() => {
    const current = items[i];
    if (!del && text === current) {
      const t = setTimeout(() => setDel(true), pause);
      return () => clearTimeout(t);
    }
    if (del && text === "") {
      setDel(false);
      setI((i + 1) % items.length);
      return;
    }
    const t = setTimeout(
      () => setText(del ? current.slice(0, text.length - 1) : current.slice(0, text.length + 1)),
      del ? speed / 2 : speed,
    );
    return () => clearTimeout(t);
  }, [text, del, i, items, speed, pause]);

  return text;
}

export function Hero() {
  const typed = useTypingLoop(PROMPTS);

  return (
    <section className="relative isolate overflow-hidden pt-36 pb-20 md:pt-44 md:pb-28">
      <Particles count={36} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 h-[600px]"
        style={{ background: "var(--gradient-glow)" }}
      />
      <div className="mx-auto max-w-6xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          <span className="text-muted-foreground">Nexio v2 · GPT-5.4 reasoning live</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="font-display text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl"
        >
          Your AI workspace
          <br />
          for <span className="gradient-text">everything.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg"
        >
          Study, code, automate, and create in one calm canvas. Nexio orchestrates agents,
          documents, and tools — so you stay in flow.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mx-auto mt-12 max-w-2xl"
        >
          <div className="glass-strong animate-pulse-glow group relative rounded-3xl p-2">
            <div className="flex items-center gap-2 rounded-2xl bg-background/40 px-4 py-3">
              <Sparkles className="h-5 w-5 shrink-0 text-primary" />
              <div className="flex-1 text-left text-sm md:text-base">
                <span className="text-foreground/90">{typed}</span>
                <span className="animate-caret ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-primary md:h-5" />
              </div>
              <button className="glow-button flex h-9 w-9 items-center justify-center rounded-xl">
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Wand2 className="h-3.5 w-3.5" />
              <span>Try:</span>
              {["Plan my week", "Debug a bug", "Write a post", "Build an agent"].map((s) => (
                <button
                  key={s}
                  className="rounded-full border border-white/10 px-2.5 py-1 transition hover:border-primary/50 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <a href="#pricing" className="glow-button rounded-full px-6 py-3 text-sm font-medium">
            Start for free
          </a>
          <a
            href="#dashboard"
            className="glass rounded-full px-6 py-3 text-sm font-medium hover:bg-white/5"
          >
            See it in action →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
