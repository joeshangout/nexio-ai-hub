import { motion } from "framer-motion";
import { BookOpen, Code2, Bot, PenLine, Zap } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Study",
    desc: "Adaptive flashcards, spaced repetition, and tutors that explain like a friend.",
    tag: "Learn",
  },
  {
    icon: Code2,
    title: "Coding",
    desc: "Multi-file refactors, test generation, and live pair programming with context.",
    tag: "Build",
  },
  {
    icon: Bot,
    title: "AI Agents",
    desc: "Compose autonomous workflows that browse, call APIs, and report results.",
    tag: "Automate",
  },
  {
    icon: PenLine,
    title: "Content Creation",
    desc: "Long-form drafts, social threads, and on-brand visuals — generated together.",
    tag: "Create",
  },
  {
    icon: Zap,
    title: "Productivity",
    desc: "Inbox triage, meeting notes, and a calendar that schedules itself around you.",
    tag: "Flow",
  },
];

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-6xl px-4 py-24">
      <div className="mb-14 max-w-2xl">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-primary/80">Capabilities</p>
        <h2 className="font-display text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          One workspace.
          <br />
          <span className="gradient-text">Every workflow.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            whileHover={{ y: -4 }}
            className={`glass group relative overflow-hidden rounded-3xl p-6 ${
              i === 0 ? "lg:col-span-2 lg:row-span-1" : ""
            }`}
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-primary opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30" />
            <div className="relative">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {f.tag}
                </span>
              </div>
              <h3 className="font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
