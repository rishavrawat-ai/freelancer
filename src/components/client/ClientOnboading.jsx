import { EvervaultCard } from "@/components/ui/evervault-card";

const features = [
  {
    title: "Curated Talent Pools",
    description:
      "Bookmark, tag, and compare the freelancers you love. Keep shortlists organized for every project.",
  },
  {
    title: "Brief Broadcasts",
    description:
      "Send project briefs to selected talent with one click and track who responds in real time.",
  },
  {
    title: "Collaboration Notes",
    description:
      "Log interviews, rate candidates, and share thoughts with stakeholders directly inside Markify.",
  },
  {
    title: "Secure Handoffs",
    description:
      "Generate signed agreements, deliverables checklists, and final payment reminders automatically.",
  },
  {
    title: "Curated Talent Pools",
    description:
      "Bookmark, tag, and compare the freelancers you love. Keep shortlists organized for every project.",
  },
  {
    title: "Brief Broadcasts",
    description:
      "Send project briefs to selected talent with one click and track who responds in real time.",
  },
  {
    title: "Collaboration Notes",
    description:
      "Log interviews, rate candidates, and share thoughts with stakeholders directly inside Markify.",
  },
  {
    title: "Secure Handoffs",
    description:
      "Generate signed agreements, deliverables checklists, and final payment reminders automatically.",
  },
];

const ClientOnboading = () => {
  return (
    <section className="mt-10 space-y-6 text-foreground transition-colors">
      <div className="text-center space-y-2">
        <p className="text-lg uppercase tracking-[0.4em] text-primary">
          Services
        </p>
        <h2 className="text-3xl font-semibold">
          Clarity across every step of the freelance lifecycle.
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <EvervaultCard key={index} text={feature.title} className="h-72">
            <div className="text-center space-y-3">
              <span className="block text-sm font-semibold text-primary">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          </EvervaultCard>
        ))}
      </div>
    </section>
  );
};

export default ClientOnboading;