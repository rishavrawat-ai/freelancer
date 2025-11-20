"use client"

import React, { useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  FileText,
  MessageSquare,
  Target,
  TrendingUp,
  Clock,
} from "lucide-react"

import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ClientTopBar } from "@/components/client/ClientTopBar"

const phases = [
  {
    id: 1,
    name: "Requirement Gathering",
    status: "active",
    tasks: [
      {
        id: "a",
        name: "Client brief and scope definition",
        status: "pending",
        due: "Dec 25, 2025",
      },
      {
        id: "b",
        name: "Finalize functional and non-functional needs",
        status: "pending",
        due: "Dec 25, 2025",
      },
      {
        id: "c",
        name: "Agree on acceptance criteria",
        status: "pending",
        due: "Dec 25, 2025",
      },
    ],
  },
  {
    id: 2,
    name: "Planning & Design",
    status: "queued",
  },
  {
    id: 3,
    name: "Development & Testing",
    status: "queued",
  },
  {
    id: 4,
    name: "Final Handover",
    status: "queued",
  },
]

const activities = [
  { title: "Requirements finalized", time: "3 days ago" },
  { title: "Client approved wireframes", time: "1 day ago" },
  { title: "Prototype 75% complete", time: "5 hours ago" },
  { title: "Design submitted for review", time: "2 hours ago" },
]

const todoItems = [
  { id: "req", label: "Requirement Gathering" },
  { id: "plan", label: "Planning & Design" },
  { id: "dev", label: "Development & Testing" },
  { id: "handover", label: "Final Handover" },
]

const projectMeta = [
  {
    id: "launch",
    title: "Development & Tech",
    freelancer: "Aniket Thakur",
    progress: 0,
    eta: "Dec 30, 2025",
    milestones: "0/12",
    issues: 4,
  },
  {
    id: "email-suite",
    title: "Lifecycle Email Automation",
    freelancer: "Nova Growth Lab",
    progress: 18,
    eta: "Jan 10, 2026",
    milestones: "3/10",
    issues: 1,
  },
  {
    id: "portal",
    title: "Investor Portal Refresh",
    freelancer: "Beacon Ventures",
    progress: 100,
    eta: "Nov 11, 2025",
    milestones: "12/12",
    issues: 0,
  },
]

const ClientProjectDetailContent = () => {
  const { projectId } = useParams()
  const [checkedTasks, setCheckedTasks] = useState({})
  const [expandedPhase, setExpandedPhase] = useState(1)

  const project = useMemo(() => {
    return projectMeta.find((meta) => meta.id === projectId) ?? projectMeta[0]
  }, [projectId])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="space-y-6 p-6">
        <ClientTopBar label={`${project.title} detail`} />

        <div className="grid gap-6 lg:grid-cols-12">
          <aside className="space-y-4 lg:col-span-3">
            {phases.map((phase) => {
              const isOpen = expandedPhase === phase.id
              return (
                <Card
                  key={phase.id}
                  className={`border transition-all duration-300 ${
                    phase.status === "active"
                      ? "border-primary/40 bg-gradient-to-b from-primary/15 via-background to-background shadow-[0_20px_80px_-60px_rgba(253,200,0,0.9)]"
                      : "border-border/50 bg-card/80 hover:border-border/70"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPhase(isOpen ? 0 : phase.id)
                    }
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left"
                  >
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                        phase.status === "active"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {phase.id}
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <h3 className="text-sm font-semibold text-foreground">
                        {phase.name}
                      </h3>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                        Phase
                      </p>
                    </div>
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-xs text-muted-foreground transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      ▾
                    </div>
                  </button>
                  {phase.tasks && isOpen && (
                    <div className="space-y-3 border-t border-border/40 px-4 pb-4 pt-3">
                      {phase.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-xl border border-border/60 bg-background/90 px-4 py-3 text-xs shadow-[0_15px_50px_-45px_rgba(0,0,0,0.8)]"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className=" text-sm leading-relaxed">
                              {task.id}. {task.name}
                            </p>
                            <Badge
                              variant="secondary"
                              className="text-[10px]"
                            >
                              Pending
                            </Badge>
                          </div>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Due: {task.due}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )
            })}
          </aside>

          <main className="space-y-6 lg:col-span-6">
            <Card className="border border-border/60 bg-card/80">
              <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-3xl font-semibold">{project.title}</h1>
                  <p className="text-sm text-muted-foreground">
                    Freelancer:{" "}
                    <span className="text-foreground font-medium">
                      {project.freelancer}
                    </span>
                    , started: Dec 1, 2025
                  </p>
                </div>
                <div className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-2 text-right">
                  <p className="text-xs text-muted-foreground">Progress</p>
                  <p className="text-2xl font-bold text-primary">
                    {project.progress}%
                  </p>
                </div>
              </div>
              <div className="grid gap-3 border-t border-border/40 p-6 text-center sm:grid-cols-3">
                <div className="rounded-xl border border-border/50 bg-card/70 p-4">
                  <p className="mb-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Estimate delivery
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {project.eta}
                  </p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/70 p-4">
                  <p className="mb-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Target className="h-3.5 w-3.5" />
                    Milestones
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {project.milestones}
                  </p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/70 p-4">
                  <p className="mb-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Open issues
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {project.issues}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border border-border/60 bg-card/80 p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Current status</h2>
                <Button variant="ghost" size="sm">
                  Overview
                </Button>
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                      <p className="text-sm font-semibold text-primary">
                        Requirement Gathering
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {project.progress}% done
                    </span>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Client brief and scope definition.
                  </p>
                  <Button className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </Button>
                </div>
                <div className="rounded-2xl border border-border/50 bg-card/70 p-5">
                  <div className="flex items-center gap-3">
                    <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-muted-foreground/40" />
                    <div>
                      <p className="text-sm font-semibold">Planning & Design</p>
                      <p className="text-sm text-muted-foreground">
                        Waiting for client approval or dependency completion.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="border border-border/60 bg-card/80 p-6">
              <h2 className="mb-4 text-xl font-semibold">Project to-do list</h2>
              <div className="space-y-3">
                {todoItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-2xl border border-border/50 bg-card/60 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={item.id}
                        checked={checkedTasks[item.id] || false}
                        onCheckedChange={(checked) =>
                          setCheckedTasks((prev) => ({
                            ...prev,
                            [item.id]: Boolean(checked),
                          }))
                        }
                      />
                      <label
                        htmlFor={item.id}
                        className="cursor-pointer text-sm font-medium text-foreground"
                      >
                        {item.label}
                      </label>
                    </div>
                    <Button size="sm" className="rounded-full">
                      Verify
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </main>

          <aside className="space-y-6 lg:col-span-3">
            <Card className="border border-border/60 bg-card/80 p-5">
              <div className="mb-5 flex items-center gap-2">
                <div className="rounded-lg border border-primary/20 p-1.5">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-primary">
                  Activity log
                </h2>
              </div>
              <div className="space-y-2">
                {activities.map((activity, index) => (
                  <div key={activity.title}>
                    <div className="flex items-start gap-3 rounded-xl p-3 hover:bg-muted/50">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {activity.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                    {index < activities.length - 1 && (
                      <Separator className="bg-border/70" />
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border border-border/60 bg-card/80 p-5">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg border border-primary/20 p-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-primary">
                  Documents & files
                </h2>
              </div>
              <div className="rounded-2xl border border-dashed border-border/70 py-8 text-center text-sm text-muted-foreground">
                No files attached.
              </div>
            </Card>

            <Card className="border border-border/60 bg-card/80 p-5">
              <h2 className="mb-4 text-lg font-semibold text-primary">
                Payment summary
              </h2>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Total project cost
                  </span>
                  <span className="font-semibold text-foreground">$0.00</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="font-semibold text-emerald-400">$0.00</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-3">
                  <span className="font-medium text-foreground">Remaining</span>
                  <span className="text-lg font-semibold text-primary">
                    $0.00
                  </span>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  )
}

const ClientProjectDetail = () => {
  return (
    <RoleAwareSidebar>
      <ClientProjectDetailContent />
    </RoleAwareSidebar>
  )
}

export default ClientProjectDetail
