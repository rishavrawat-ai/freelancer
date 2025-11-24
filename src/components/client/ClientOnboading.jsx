import { useState } from "react";
import { EvervaultCard } from "@/components/ui/evervault-card";
import ChatDialog from "./ChatDialog";
import {
  Code,
  Target,
  Video,
  Megaphone,
  Palette,
  FileText,
  Heart,
  Headphones,
  ClipboardList,
  Mic,
} from "lucide-react";

const features = [
  {
    title: "Development & Tech",
    description: "Websites, apps and custom software development.",
    price: "Starting at ₹20,000",
    icon: Code,
  },
  {
    title: "Lead Generation",
    description: "Targeted leads & outreach campaigns to grow sales funnel.",
    price: "Starting at ₹15,000",
    icon: Target,
  },
  {
    title: "Video Services",
    description: "Promo, explainer, ads and product videos.",
    price: "Starting at ₹7,500",
    icon: Video,
  },
  {
    title: "Digital Marketing",
    description: "SEO, ads, social and performance marketing.",
    price: "Starting at ₹10,000",
    icon: Megaphone,
  },
  {
    title: "Creative & Design",
    description: "Logo, branding, UI/UX and visual design services.",
    price: "Starting at ₹3,500",
    icon: Palette,
  },
  {
    title: "Writing & Content",
    description: "Blogs, website copy, ad copy and scripts.",
    price: "Starting at ₹2,000",
    icon: FileText,
  },
  {
    title: "Lifestyle & Personal",
    description: "Fitness, styling, wellness and personal coaching.",
    price: "Starting at ₹2,500",
    icon: Heart,
  },
  {
    title: "Customer Support",
    description: "Chat, email or voice support setup and staffing.",
    price: "Starting at ₹8,000",
    icon: Headphones,
  },
  {
    title: "Administrative Services",
    description: "Data entry, scheduling, research and VA support.",
    price: "Starting at ₹3,000",
    icon: ClipboardList,
  },
  {
    title: "Audio Services",
    description: "Voiceover, podcast editing, music & audio production.",
    price: "Starting at ₹2,000",
    icon: Mic,
  },
];

const ClientOnboading = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleCardClick = (feature) => {
    setSelectedService(feature);
    setIsChatOpen(true);
  };

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {features.map((feature, index) => (
          <div key={index} onClick={() => handleCardClick(feature)} className="cursor-pointer">
            <EvervaultCard text={feature.title} className="h-72">
              <div className="text-center space-y-3 flex flex-col items-center">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
                <p className="text-sm font-medium text-primary pt-2">
                  {feature.price}
                </p>
              </div>
            </EvervaultCard>
          </div>
        ))}
      </div>

      <ChatDialog
        isOpen={isChatOpen}
        onClose={setIsChatOpen}
        service={selectedService}
      />
    </section>
  );
};

export default ClientOnboading;
