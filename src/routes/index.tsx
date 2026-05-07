import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/nexio/Navbar";
import { Hero } from "@/components/nexio/Hero";
import { Features } from "@/components/nexio/Features";
import { Dashboard } from "@/components/nexio/Dashboard";
import { Pricing } from "@/components/nexio/Pricing";
import { Testimonials } from "@/components/nexio/Testimonials";
import { Footer } from "@/components/nexio/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nexio — Your AI workspace for everything" },
      {
        name: "description",
        content:
          "Nexio is the futuristic AI workspace for study, code, agents, content, and productivity. Built for makers.",
      },
      { property: "og:title", content: "Nexio — Your AI workspace for everything" },
      {
        property: "og:description",
        content: "Study, code, automate, and create with one calm AI canvas.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Dashboard />
        <Pricing />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
