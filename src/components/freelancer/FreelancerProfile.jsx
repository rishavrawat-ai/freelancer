import { Trash2, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/auth-storage";
import { toast } from "sonner";

const SectionCard = ({ title, actionLabel, onAction, children }) => (
  <div className="space-y-2 border-b border-border/60 pb-5 last:border-0">
    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
      <span>{title}</span>
      <button
        type="button"
        onClick={onAction}
        className="text-[11px] font-semibold text-primary tracking-[0.35em]"
      >
        {actionLabel}
      </button>
    </div>
    {children}
  </div>
);

const serviceOptions = [
  "Web development",
  "App development",
  "UI/UX design",
  "Product strategy",
  "AI/ML integration",
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";
const buildUrl = (path) => `${API_BASE_URL}${path}`;

const initialWorkForm = {
  company: "",
  position: "",
  from: "",
  to: "",
  description: "",
};

const FreelancerProfile = () => {
  const [modalType, setModalType] = useState(null);
  const [skills, setSkills] = useState([]); // [{ name }]
  const [workExperience, setWorkExperience] = useState([]); // array of {title, period, description}
  const [services, setServices] = useState([]); // string[]
  const [skillForm, setSkillForm] = useState({ name: "" });
  const [workForm, setWorkForm] = useState(initialWorkForm);
  const [editingIndex, setEditingIndex] = useState(null); // null = adding, number = editing

  const [personal, setPersonal] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
  });
  const [session, setSession] = useState(null);

  useEffect(() => {
    const authSession = getSession();
    setSession(authSession);

    if (authSession?.user) {
      setPersonal((prev) => ({
        ...prev,
        name: authSession.user.fullName ?? authSession.user.name ?? prev.name,
        email: authSession.user.email ?? prev.email,
      }));
    }

    const loadProfile = async () => {
      if (!authSession?.user?.email) return;

      try {
        const response = await fetch(
          buildUrl(`/profile?email=${encodeURIComponent(authSession.user.email)}`)
        );

        if (!response.ok) {
          console.warn("Profile GET not ok:", response.status);
          return;
        }

        const { data = {} } = await response.json();

        // personal
        setPersonal((prev) => ({
          ...prev,
          name: data.personal?.name ?? prev.name,
          email: data.personal?.email ?? prev.email,
          phone: data.personal?.phone ?? "",
          location: data.personal?.location ?? "",
        }));

        // skills come from prisma as string[]
        const skillsFromApi = Array.isArray(data.skills) ? data.skills : [];
        setSkills(
          skillsFromApi.map((s) =>
            typeof s === "string" ? { name: s } : { name: String(s?.name ?? "") }
          )
        );

        setWorkExperience(data.workExperience ?? []);
        setServices(Array.isArray(data.services) ? data.services : []);
      } catch (error) {
        console.error("Unable to load profile", error);
      }
    };

    loadProfile();
  }, []);

  // ----- Skills -----
  const addSkill = () => {
    const name = skillForm.name.trim();
    if (!name) return;
    setSkills((prev) => [...prev, { name }]);
    setSkillForm({ name: "" });
    setModalType(null);
  };

  const deleteSkill = (index) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  // ----- Work Experience (add + edit) -----
  const openCreateExperienceModal = () => {
    setEditingIndex(null);
    setWorkForm(initialWorkForm);
    setModalType("work");
  };

  const openEditExperienceModal = (item, index) => {
    const [position, company] = (item.title ?? "").split(" · ");
    const [from, to] = (item.period ?? " – ").split(" – ");

    setWorkForm({
      company: company ?? "",
      position: position ?? "",
      from: from ?? "",
      to: to ?? "",
      description: item.description ?? "",
    });

    setEditingIndex(index);
    setModalType("work");
  };

  const saveExperience = () => {
    const { company, position, from, to, description } = workForm;
    if (!company.trim() || !position.trim() || !from.trim() || !to.trim()) return;

    const newItem = {
      title: `${position.trim()} · ${company.trim()}`,
      period: `${from.trim()} – ${to.trim()}`,
      description: description.trim(),
    };

    if (editingIndex !== null) {
      // update
      setWorkExperience((prev) =>
        prev.map((item, idx) => (idx === editingIndex ? newItem : item))
      );
    } else {
      // add
      setWorkExperience((prev) => [...prev, newItem]);
    }

    setWorkForm(initialWorkForm);
    setEditingIndex(null);
    setModalType(null);
  };

  const deleteExperience = (index) => {
    setWorkExperience((prev) => prev.filter((_, i) => i !== index));
  };

  // ----- Save to backend -----
  const handleSave = async () => {
    if (!personal.email) {
      toast.error("Cannot save profile", {
        description: "Missing email on your profile.",
      });
      return;
    }

    // prisma User.skills is String[]
    const skillsForApi = skills
      .map((s) => (typeof s === "string" ? s : s.name))
      .map((s) => s?.trim())
      .filter(Boolean);

    const payload = {
      personal: {
        name: personal.name,
        email: personal.email,
        phone: personal.phone,
        location: personal.location,
      },
      skills: skillsForApi,
      workExperience,
      services,
    };

    console.log("Saving profile payload:", payload);

    try {
      const response = await fetch(buildUrl("/profile"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.accessToken
            ? { Authorization: `Bearer ${session.accessToken}` }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      console.log("Save response:", response.status, text);

      if (!response.ok) {
        toast.error("Save failed", {
          description: "Check backend logs for more details.",
        });
        return;
      }

      toast.success("Profile saved", {
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Save failed", error);
      toast.error("Save failed", {
        description: "Something went wrong. Check console for details.",
      });
    }
  };

  // ----- Sections descriptor -----
  const sectionContent = useMemo(
    () => [
      {
        title: "Skills",
        actionLabel: "Add Skill",
        onAction: () => setModalType("skill"),
        items: skills,
        onDelete: deleteSkill,
        onEdit: null,
      },
      {
        title: "Work Experience",
        actionLabel: "Add Work Experience",
        onAction: openCreateExperienceModal,
        items: workExperience,
        onDelete: deleteExperience,
        onEdit: openEditExperienceModal,
      },
    ],
    [skills, workExperience]
  );

  const emptyMessage = (label) => (
    <p className="text-sm text-muted-foreground">
      {`No ${label.toLowerCase()} yet`}
    </p>
  );

  return (
    <section className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background text-foreground relative">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
        {/* Header */}
        <div className="rounded-[28px] border border-border/70 bg-card/90 backdrop-blur shadow-xl shadow-black/30 px-6 py-7">
          <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground/80">
            Profile
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">
            {personal.name || "Your name"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {personal.email || "your@email.com"}
          </p>
          {(personal.location || personal.phone) && (
            <p className="mt-2 text-xs text-muted-foreground">
              {personal.location && <span>{personal.location}</span>}
              {personal.location && personal.phone && <span> • </span>}
              {personal.phone && <span>{personal.phone}</span>}
            </p>
          )}
        </div>

        {/* Services */}
        <div className="rounded-full border border-border/70 bg-card/80 backdrop-blur px-4 py-3 flex items-center gap-3 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground/80 shrink-0">
            Services
          </span>

          <div className="flex flex-wrap gap-2">
            {serviceOptions.map((option) => {
              const isActive = services.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  className={`relative rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] transition
                    ${
                      isActive
                        ? "border border-primary/80 bg-primary/15 text-primary shadow-[0_0_0_1px_rgba(250,204,21,0.35)]"
                        : "border-border/60 text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/5"
                    }`}
                  onClick={() =>
                    setServices((prev) =>
                      prev.includes(option)
                        ? prev.filter((item) => item !== option)
                        : [...prev, option]
                    )
                  }
                >
                  <span className="relative z-10">{option}</span>
                  {isActive && (
                    <span className="pointer-events-none absolute inset-0 rounded-full bg-primary/10 blur-[2px]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Skills & Experience */}
        <div className="rounded-[28px] border border-border/70 bg-card/95 backdrop-blur p-6 shadow-2xl shadow-black/40">
          {sectionContent.map((section) => (
            <SectionCard
              key={section.title}
              title={section.title}
              actionLabel={section.actionLabel}
              onAction={section.onAction}
            >
              {section.items.length ? (
                <div className="space-y-3 pt-3">
                  {section.items.map((item, index) => (
                    <article
                      key={`${section.title}-${index}`}
                      className="flex items-center justify-between rounded-2xl border border-border/70 bg-card/90 p-4 text-sm shadow-sm hover:shadow-lg hover:border-primary/70 hover:-translate-y-0.5 transition"
                    >
                      <div>
                        {/* Title as h1 + paragraph(s) */}
                        <h1 className="text-base sm:text-lg font-semibold text-foreground">
                          {item.title || item.name || item}
                        </h1>
                        {item.period && (
                          <p className="mt-1 text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
                            {item.period}
                          </p>
                        )}
                        {item.description && (
                          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {section.onEdit && (
                          <button
                            type="button"
                            onClick={() => section.onEdit(item, index)}
                            className="rounded-full p-1.5 hover:bg-muted/40 transition"
                            aria-label="Edit"
                          >
                            <Pencil className="size-4 text-muted-foreground" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => section.onDelete(index)}
                          className="rounded-full p-1.5 hover:bg-muted/40 transition"
                          aria-label="Delete"
                        >
                          <Trash2 className="size-4 text-muted-foreground" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="pt-3">{emptyMessage(section.title)}</div>
              )}
            </SectionCard>
          ))}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-full bg-primary px-7 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-background transition hover:bg-primary/85 shadow-md hover:shadow-lg"
            >
              Save profile
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card/95 backdrop-blur p-6 shadow-2xl shadow-black/50">
            {modalType === "skill" ? (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  Add Skill
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Give the skill a name so clients can quickly scan your strengths.
                </p>
                <input
                  value={skillForm.name}
                  onChange={(event) =>
                    setSkillForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Skill name"
                  className="mt-4 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                />
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addSkill}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background hover:bg-primary/85"
                  >
                    Add
                  </button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-lg font-semibold text-foreground">
                  {editingIndex !== null ? "Edit Work Experience" : "Add Work Experience"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Capture your role, timeline, and the impact you had.
                </p>

                <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Company
                  <input
                    value={workForm.company}
                    onChange={(event) =>
                      setWorkForm((prev) => ({
                        ...prev,
                        company: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                  />
                </label>

                <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Position
                  <input
                    value={workForm.position}
                    onChange={(event) =>
                      setWorkForm((prev) => ({
                        ...prev,
                        position: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                  />
                </label>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    From
                    <input
                      value={workForm.from}
                      onChange={(event) =>
                        setWorkForm((prev) => ({
                          ...prev,
                          from: event.target.value,
                        }))
                      }
                      placeholder="Jan 2020"
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>
                  <label className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                    To
                    <input
                      value={workForm.to}
                      onChange={(event) =>
                        setWorkForm((prev) => ({
                          ...prev,
                          to: event.target.value,
                        }))
                      }
                      placeholder="Present"
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                    />
                  </label>
                </div>

                <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Description
                  <textarea
                    value={workForm.description}
                    onChange={(event) =>
                      setWorkForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/70"
                  />
                </label>

                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModalType(null);
                      setEditingIndex(null);
                      setWorkForm(initialWorkForm);
                    }}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveExperience}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background hover:bg-primary/85"
                  >
                    {editingIndex !== null ? "Update" : "Save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default FreelancerProfile;
