import { Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSession } from "@/lib/auth-storage";

const SectionCard = ({ title, actionLabel, onAction, children }) => (
  <div className="space-y-2 border-b border-border pb-5 last:border-0">
    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
      <span>{title}</span>
      <button
        type="button"
        onClick={onAction}
        className="text-xs font-semibold text-primary tracking-[0.5em]">
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

const FreelancerProfile = () => {
  const [modalType, setModalType] = useState(null);
  const [skills, setSkills] = useState([]);
  const [workExperience, setWorkExperience] = useState([]);
  const [services, setServices] = useState([]);
  const [skillForm, setSkillForm] = useState({ name: "" });
  const [workForm, setWorkForm] = useState({
    company: "",
    position: "",
    from: "",
    to: "",
    description: "",
  });
  const [personal, setPersonal] = useState({ name: "", email: "" });
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
      if (!authSession?.user?.email) {
        return;
      }
      try {
        const headers = authSession?.accessToken
          ? { Authorization: `Bearer ${authSession.accessToken}` }
          : undefined;
        const response = await fetch(
          buildUrl(
            `/profile?email=${encodeURIComponent(authSession.user.email)}`
          ),
          { headers }
        );
        if (!response.ok) {
          return;
        }
        const { data = {} } = await response.json();
    setPersonal((prev) => ({
      name: data.personal?.name ?? prev.name,
      email: data.personal?.email ?? prev.email,
    }));
        setSkills(data.skills ?? []);
        setWorkExperience(data.workExperience ?? []);
        setServices(data.services ?? []);
      } catch (error) {
        console.error("Unable to load profile", error);
      }
    };

    loadProfile();
  }, []);

  const addSkill = () => {
    const name = skillForm.name.trim();
    if (!name) {
      return;
    }
    setSkills((prev) => [...prev, { name }]);
    setSkillForm({ name: "" });
    setModalType(null);
  };

  const addExperience = () => {
    const { company, position, from, to, description } = workForm;
    if (!company || !position || !from || !to) {
      return;
    }
    setWorkExperience((prev) => [
      ...prev,
      {
        title: `${position} · ${company}`,
        period: `${from} – ${to}`,
        description: description.trim(),
      },
    ]);
    setWorkForm({
      company: "",
      position: "",
      from: "",
      to: "",
      description: "",
    });
    setModalType(null);
  };

  const handleSave = async () => {
    const headers = {
      "Content-Type": "application/json",
      ...(session?.accessToken
        ? { Authorization: `Bearer ${session.accessToken}` }
        : {}),
    };
    try {
      const response = await fetch(buildUrl("/profile"), {
        method: "POST",
        headers,
        body: JSON.stringify({ personal, skills, workExperience, services }),
      });
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Save failed: ${err}`);
      }
      alert("Profile saved");
    } catch (error) {
      console.error("Save failed", error);
    }
  };

  const sectionContent = useMemo(
    () => [
      {
        title: "Skills",
        actionLabel: "Add Skill",
        onAction: () => setModalType("skill"),
        items: skills,
      },
      {
        title: "Work Experience",
        actionLabel: "Add Work Experience",
        onAction: () => setModalType("work"),
        items: workExperience,
      },
    ],
    [skills, workExperience]
  );

  const emptyMessage = (label) => (
    <p className="text-sm text-muted-foreground">{`No ${label.toLowerCase()} yet`}</p>
  );

  return (
    <section className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
        <div className="rounded-[28px] border border-border bg-card p-6 shadow-lg shadow-muted-foreground/30">
          <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Profile
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            {personal.name || "Your name"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {personal.email || "your@email.com"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 font-semibold text-xs uppercase tracking-[0.35em]">
          {serviceOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`rounded-full border px-3 py-1 ${
                services.includes(option)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
              onClick={() =>
                setServices((prev) =>
                  prev.includes(option)
                    ? prev.filter((item) => item !== option)
                    : [...prev, option]
                )
              }>
              {option}
            </button>
          ))}
        </div>
        <div className="rounded-[28px] border border-border bg-card p-6 shadow-xl shadow-muted-foreground/30">
          {sectionContent.map((section) => (
            <SectionCard
              key={section.title}
              title={section.title}
              actionLabel={section.actionLabel}
              onAction={section.onAction}>
              {section.items.length ? (
                <div className="space-y-3 pt-3">
                  {section.items.map((item, index) => (
                    <div
                      key={`${section.title}-${index}`}
                      className="flex items-center justify-between rounded-2xl border border-border bg-card/80 p-4 text-sm">
                      <div>
                        <p className="font-semibold text-foreground">
                          {item.title || item.name}
                        </p>
                        {item.period && (
                          <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground">
                            {item.period}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <Trash2 className="size-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-3">{emptyMessage(section.title)}</div>
              )}
            </SectionCard>
          ))}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-2xl bg-primary px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background transition hover:bg-primary/80">
              Save profile
            </button>
          </div>
        </div>
      </div>
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/40">
            {modalType === "skill" ? (
              <>
                <h3 className="text-lg font-semibold text-foreground">
                  Add Skill
                </h3>
                <p className="text-sm text-muted-foreground">
                  Give the skill a name.
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
                  className="mt-4 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addSkill}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background">
                    Add
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-foreground">
                  Add Work Experience
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add company, position, dates, and description.
                </p>
                <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Company
                </label>
                <input
                  value={workForm.company}
                  onChange={(event) =>
                    setWorkForm((prev) => ({
                      ...prev,
                      company: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
                <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Position
                </label>
                <input
                  value={workForm.position}
                  onChange={(event) =>
                    setWorkForm((prev) => ({
                      ...prev,
                      position: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
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
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground"
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
                      className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                    />
                  </label>
                </div>
                <label className="mt-3 block text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                  Description
                </label>
                <textarea
                  value={workForm.description}
                  onChange={(event) =>
                    setWorkForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className="mt-1 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="rounded-2xl border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="rounded-2xl bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-background">
                    Save
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
