import React from "react";
import SyntheticHero from "@/components/synthetic-hero";

const Onboading = () => {
  return (
    <div className="w-screen h-screen flex flex-col relative">
      <SyntheticHero
        title="Choose"
        titleHighlight="your way"
        description="Join our network of freelancers and connect with clients who value your talent."
        badgeText="Smarter way to connect freelancers & clients"
        badgeLabel="NEW"
        ctaButtons={[
          { text: "Hiring ->", href: "/client", primary: true },
          { text: "Earn Money", href: "#earn", primary: true },
        ]}
        microDetails={[]}
      />
    </div>
  );
};

export default Onboading;
