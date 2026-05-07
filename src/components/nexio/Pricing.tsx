import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/forever",
    desc: "Get started with the essentials.",
    features: ["50 AI messages / day", "Basic agents", "Single workspace", "Community support"],
    cta: "Start free",
  },
  {
    name: "Plus",
    price: "$20",
    period: "/month",
    desc: "For everyday creators and pros.",
    features: [
      "Unlimited messages",
      "GPT-5.4 + Gemini",
      "10 custom agents",
      "Connectors (Stripe, Docs)",
      "Priority speed",
    ],
    cta: "Upgrade to Plus",
    highlight: true,
  },
  {
    name: "MAX",
    price: "$60",
    period: "/month",
    desc: "Maximum reasoning, agents & limits.",
    features: [
      "Everything in Plus",
      "GPT-5.5 Pro reasoning",
      "Unlimited agents",
      "Team workspace",
      "API & webhooks",
    ],
    cta: "Go MAX",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative mx-auto max-w-6xl px-4 py-24">
      <div className="mb-14 text-center">
        <p className="mb-3 text-sm uppercase tracking-[0.2em] text-primary/80">Pricing</p>
        <h2 className="font-display text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Simple plans. <span className="gradient-text">Serious power.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            whileHover={{ y: -6 }}
            className={`relative overflow-hidden rounded-3xl p-6 ${
              p.highlight
                ? "glass-strong ring-glow border border-primary/30"
                : "glass border border-white/5"
            }`}
          >
            {p.highlight && (
              <span className="absolute right-4 top-4 rounded-full bg-gradient-primary px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white shadow-glow">
                Popular
              </span>
            )}
            <h3 className="font-display text-2xl font-semibold">{p.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-display text-5xl font-semibold tracking-tight">{p.price}</span>
              <span className="text-sm text-muted-foreground">{p.period}</span>
            </div>
            <button
              className={`mt-6 w-full rounded-full py-3 text-sm font-medium transition ${
                p.highlight
                  ? "glow-button"
                  : "glass hover:bg-white/10"
              }`}
            >
              {p.cta}
            </button>
            <ul className="mt-6 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-foreground/90">{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
