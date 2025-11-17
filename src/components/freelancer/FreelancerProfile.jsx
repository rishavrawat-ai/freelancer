import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  BadgeCheck,
  Briefcase,
  Clock,
  Globe,
  GraduationCap,
  Link2,
  Pencil,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PROFILE_SECTIONS } from "@/constants/freelancerProfileSections";
import {
  computeCompletion,
  loadFreelancerProfile,
  saveFreelancerProfile,
} from "@/lib/freelancer-profile";

const quickSections = [
  { label: "Resume headline", action: "Edit" },
  { label: "Specialties", action: "Update" },
  { label: "Experience", action: "Add details" },
  { label: "Education", action: "Add degree" },
  { label: "Portfolio links", action: "Showcase work" },
  { label: "Availability", action: "Update" },
];

const initialFormState = PROFILE_SECTIONS.reduce(
  (acc, section) => ({ ...acc, [section.key]: "" }),
  {}
);

const formatTimestamp = (value) => {
  if (!value) {
    return "Not updated yet";
  }

  try {
    const date = new Date(value);
    return `Last updated ${date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  } catch {
    return "Updated recently";
  }
};

const FreelancerProfile = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const stored = loadFreelancerProfile();
    setFormValues((prev) => ({ ...prev, ...stored.values }));
    setLastUpdated(stored.updatedAt);
  }, []);

  const completion = useMemo(
    () => computeCompletion(formValues),
    [formValues]
  );

  const heroChips = useMemo(() => {
    const headline = formValues.resumeHeadline?.trim();
    const availability = formValues.availabilityPreferences?.trim();
    const location = formValues.portfolioLinks?.trim();

    return [
      {
        icon: Briefcase,
        label: headline || "Add your headline",
      },
      {
        icon: Clock,
        label: availability || "Share availability & rates",
      },
      {
        icon: Globe,
        label: location || "Link your portfolio & socials",
      },
    ];
  }, [formValues]);

  const handleChange = (key) => (event) => {
    const { value } = event.target;
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = saveFreelancerProfile(formValues);
      setLastUpdated(payload.updatedAt);
      toast.success("Profile updated successfully.");
      navigate("/freelancer", { replace: true });
    } catch (error) {
      toast.error(error?.message || "Unable to update your profile right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900/70 text-white">
      <div className="mx-auto flex min-h-svh max-w-6xl flex-col gap-6 px-4 py-10 lg:flex-row lg:py-14">
        <aside className="flex w-full flex-shrink-0 flex-col gap-6 rounded-3xl border border-white/10 bg-white/5/50 p-6 shadow-2xl shadow-black/40 backdrop-blur lg:w-72">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="size-28 rounded-full border-4 border-white/20 bg-gradient-to-tr from-yellow-400/40 to-yellow-300/70 shadow-inner shadow-black/60" />
              <span className="absolute inset-0 grid place-items-center text-2xl font-semibold text-yellow-300">
                {completion}%
              </span>
            </div>
            <h2 className="text-xl font-semibold">Profile strength</h2>
            <p className="text-sm text-white/70">
              Complete the sections below to reach 100%
            </p>
            <p className="text-xs text-white/50">{formatTimestamp(lastUpdated)}</p>
          </div>
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
              Quick updates
            </p>
            <div className="space-y-3">
              {quickSections.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm"
                >
                  <span className="text-white/80">{item.label}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold uppercase tracking-wide text-yellow-300 hover:text-yellow-200"
                  >
                    {item.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-green-300" />
              <div>
                <p className="text-sm font-medium text-white">Verify identity</p>
                <p className="text-xs text-white/70">
                  Add govt ID + video check to unlock badges.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="mt-4 w-full rounded-2xl bg-white/90 text-slate-900 hover:bg-white"
            >
              Start verification
            </Button>
          </div>
        </aside>

        <div className="flex-1 space-y-6">
          <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-2xl shadow-black/50 lg:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white/70">
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-yellow-300">
                    Freelancer profile
                  </span>
                  <BadgeCheck className="size-4 text-green-300" />
                  <span className="text-xs text-white/60">
                    {formatTimestamp(lastUpdated)}
                  </span>
                </div>
                <h1 className="text-3xl font-semibold leading-tight">
                  Bring your best work to the surface
                </h1>
                <p className="text-sm text-white/70">
                  Complete your narrative, upload work samples, and let the network know when you are
                  available. Profiles that hit 90%+ visibility get 2.8x more invites.
                </p>
                <div className="flex flex-wrap gap-3">
                  {heroChips.map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-4 py-1 text-sm text-white/80"
                    >
                      <Icon className="size-4 text-yellow-300" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <Button
                  variant="outline"
                  className="w-full rounded-2xl border-white/30 text-white hover:border-white hover:bg-white/5 md:w-auto"
                >
                  Upload resume
                </Button>
                <Button className="w-full rounded-2xl bg-yellow-400 text-slate-950 hover:bg-yellow-300 md:w-auto">
                  Add project summary
                </Button>
              </div>
            </div>
          </header>

          <Card className="border-white/10 bg-slate-950/70 text-white shadow-xl shadow-black/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Core profile details</CardTitle>
                <p className="text-sm text-white/60">
                  Keep these up to date so your dashboard stays tailored to you.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full border border-white/10 hover:border-white/30"
              >
                <Pencil className="size-4 text-white" />
                <span className="sr-only">Edit profile</span>
              </Button>
            </CardHeader>
            <CardContent>
              <form className="grid gap-5" onSubmit={handleSubmit}>
                {PROFILE_SECTIONS.map((section) => {
                  const value = formValues[section.key] ?? "";
                  const isInput = section.type === "input";

                  return (
                    <div
                      key={section.key}
                      className="rounded-2xl border border-white/10 bg-black/40 p-5 shadow-inner shadow-black/20"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-white">{section.title}</p>
                          <p className="text-sm text-white/60">{section.description}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          className="rounded-full border border-white/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-white/70 hover:border-white/40"
                        >
                          Add note
                        </Button>
                      </div>
                      <div className="mt-4 space-y-2">
                        <Label className="text-xs uppercase tracking-[0.3em] text-white/50">
                          Details
                        </Label>
                        {isInput ? (
                          <Input
                            type="url"
                            placeholder={section.placeholder}
                            value={value}
                            onChange={handleChange(section.key)}
                            className="rounded-2xl border-white/10 bg-black/30 text-white placeholder:text-white/40"
                          />
                        ) : (
                          <Textarea
                            rows={section.rows ?? 4}
                            placeholder={section.placeholder}
                            value={value}
                            onChange={handleChange(section.key)}
                            className="rounded-2xl border-white/10 bg-black/30 text-white placeholder:text-white/40"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl border-white/20 text-white hover:border-white/70 hover:bg-white/5 sm:min-w-[150px]"
                    onClick={() => navigate("/freelancer")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-2xl bg-yellow-400 px-6 py-2 text-slate-950 hover:bg-yellow-300 sm:min-w-[180px]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-white/10 bg-black/50 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="size-4 text-primary" />
                  Showcase case studies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-white/70">
                <p>
                  Pin three recent pieces of work to show your craft. We recommend one strategic,
                  one visual, and one technical example.
                </p>
                <Button
                  variant="outline"
                  className="rounded-2xl border-white/20 text-white hover:border-white/70 hover:bg-white/5"
                >
                  Add work sample
                </Button>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-black/50 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="size-4 text-primary" />
                  Education & credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-white/70">
                <p>
                  Share degrees, bootcamps, and certifications that prove your foundation. Include
                  the year and any awards or specializations.
                </p>
                <Button className="rounded-2xl bg-yellow-400 text-slate-900 hover:bg-yellow-300">
                  Add certification
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
            <CardContent className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-yellow-300">Visibility</p>
                <h3 className="text-2xl font-semibold">Elevate your profile with AI polish</h3>
                <p className="text-white/70">
                  Coming soon: auto-summarize experience, detect gaps, and generate description
                  starters.
                </p>
              </div>
              <Button disabled className="rounded-2xl bg-white/10 text-white">
                Upgrade (soon)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FreelancerProfile;
