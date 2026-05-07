import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "Nexio replaced four tools in my stack. The agents actually finish work — not just suggest it.",
    name: "Maya Chen",
    role: "Founder, Loop Studio",
  },
  {
    quote:
      "The fastest AI workspace I've used. The dashboard feels like Linear, the brain feels like a senior engineer.",
    name: "Daniel Park",
    role: "Staff Engineer, Vercel",
  },
  {
    quote: "I study 2x faster with Nexio. The flashcards adapt to what I actually forget.",
    name: "Aisha Rahman",
    role: "Med student, NYU",
  },
  {
    quote: "We shipped our launch in 3 days using Nexio agents. Marketing, copy, code — all of it.",
    name: "Tomás Ribeiro",
    role: "CEO, Northwind",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="relative mx-auto max-w-6xl px-4 py-24">
      <div className="mb-14 text-center">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-primary/80">Loved by builders</p>
        <h2 className="font-display text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Teams ship faster <span className="gradient-text">with Nexio.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
            whileHover={{ y: -3 }}
            className="glass rounded-3xl p-6"
          >
            <p className="text-balance text-base leading-relaxed text-foreground/90">
              "{t.quote}"
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary text-sm font-semibold text-white">
                {t.name[0]}
              </div>
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
