"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, AlertCircle, FileText, DollarSign, Send, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { ClientTopBar } from "@/components/client/ClientTopBar";
import { useAuth } from "@/context/AuthContext";

const initialPhases = [
  {
    id: "1",
    name: "Requirements & Planning",
    status: "completed",
    progress: 100
  },
  {
    id: "2",
    name: "Design & Architecture",
    status: "in-progress",
    progress: 65
  },
  {
    id: "3",
    name: "Development",
    status: "pending",
    progress: 0
  },
  {
    id: "4",
    name: "Testing & Deployment",
    status: "pending",
    progress: 0
  }
];

const initialTasks = [
  { id: "1", title: "Define project requirements", phase: "1", status: "completed" },
  { id: "2", title: "Create system architecture", phase: "2", status: "completed" },
  { id: "3", title: "Design UI mockups", phase: "2", status: "in-progress" },
  { id: "4", title: "API specification", phase: "2", status: "pending" }
];

const initialMessages = [
  {
    id: "1",
    sender: "assistant",
    text: "Hello! How can I help you with your project today?",
    timestamp: new Date()
  }
];

const getPhaseIcon = (status) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    case "in-progress":
      return <AlertCircle className="w-5 h-5 text-blue-600" />;
    default:
      return <Circle className="w-5 h-5 text-gray-400" />;
  }
};

const getStatusBadge = (status) => {
  const variants = {
    completed: "default",
    "in-progress": "secondary",
    pending: "outline"
  };
  return variants[status] || "outline";
};

const mapStatus = (status = "") => {
  const normalized = status.toString().toUpperCase();
  if (normalized === "COMPLETED") return "completed";
  if (normalized === "IN_PROGRESS" || normalized === "OPEN") return "in-progress";
  return "pending";
};

const ProjectDashboard = () => {
  const { projectId } = useParams();
  const { authFetch, isAuthenticated } = useAuth();
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    let active = true;
    const fetchProject = async () => {
      setIsLoading(true);
      try {
        const response = await authFetch("/projects");
        const payload = await response.json().catch(() => null);
        const list = Array.isArray(payload?.data) ? payload.data : [];
        const match = list.find((item) => String(item.id) === String(projectId)) || null;
        if (active) {
          setProject(match);
        }
      } catch (error) {
        console.error("Failed to load project detail:", error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchProject();
    return () => {
      active = false;
    };
  }, [authFetch, isAuthenticated, projectId]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setTimeout(() => {
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: "I understand. Let me help you with that.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 500);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const userMessage = {
        id: Date.now().toString(),
        sender: "user",
        text: `Uploaded document: ${file.name}`,
        timestamp: new Date(),
        attachment: {
          name: file.name,
          size: `${(file.size / 1024).toFixed(2)} KB`
        }
      };

      setMessages((prev) => [...prev, userMessage]);

      setTimeout(() => {
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: `Document "${file.name}" received. I'll review it and help you accordingly.`,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }, 500);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const overallProgress = useMemo(() => {
    if (project?.progress !== undefined && project?.progress !== null) {
      const value = Number(project.progress);
      return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
    }
    const status = mapStatus(project?.status);
    if (status === "completed") return 100;
    if (status === "in-progress") return 45;
    return 10;
  }, [project]);

  const derivedPhases = useMemo(() => {
    const step = 100 / initialPhases.length;
    return initialPhases.map((phase, index) => {
      const phaseValue = Math.max(0, Math.min(step, overallProgress - index * step));
      const normalized = Math.round((phaseValue / step) * 100);
      let status = "pending";
      if (normalized >= 100) status = "completed";
      else if (normalized > 0) status = "in-progress";
      return {
        ...phase,
        status,
        progress: normalized
      };
    });
  }, [overallProgress]);

  const derivedTasks = useMemo(() => {
    return initialTasks.map((task) => {
      const phaseStatus = derivedPhases.find((p) => p.id === task.phase)?.status || task.status;
      if (phaseStatus === "completed") {
        return { ...task, status: "completed" };
      }
      if (phaseStatus === "in-progress" && task.status === "completed") {
        return task;
      }
      return { ...task, status: phaseStatus === "in-progress" ? "in-progress" : "pending" };
    });
  }, [derivedPhases]);

  const completedPhases = derivedPhases.filter((p) => p.status === "completed").length;
  const pageTitle = project?.title ? `Project: ${project.title}` : "Project Dashboard";
  const totalBudget = useMemo(() => {
    if (project?.budget !== undefined && project?.budget !== null) {
      const value = Number(project.budget);
      if (Number.isFinite(value)) return Math.max(0, value);
    }
    return 50000;
  }, [project]);
  const spentBudget = useMemo(() => Math.round(totalBudget * 0.5), [totalBudget]);
  const remainingBudget = useMemo(() => Math.max(0, totalBudget - spentBudget), [spentBudget, totalBudget]);

  return (
    <RoleAwareSidebar>
      <div className="mt-5 ml-5">
      <ClientTopBar title={pageTitle} />
      </div>
        
      <div className="min-h-screen bg-background text-foreground p-6 md:p-8 w-full">
        <div className="w-full max-w-full mx-auto space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{pageTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading project details..." : "Track project progress and manage tasks efficiently"}
            </p>
          </div>
          {!isLoading && !project && (
            <div className="rounded-lg border border-border/60 bg-accent/40 px-4 py-3 text-sm text-muted-foreground">
              No project data found for this link. Showing sample progress so you can preview the layout.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground/90">Overall Progress</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">{Math.round(overallProgress)}%</div>
                <Progress value={overallProgress} className="mt-3 h-2" />
              </CardContent>
            </Card>

            <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground/90">Completed Phases</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">
                  {completedPhases}/{derivedPhases.length}
                </div>
                <p className="text-xs text-muted-foreground mt-2">phases completed</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-foreground">Project Phases</CardTitle>
                  <CardDescription className="text-muted-foreground">Monitor each phase of your project</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {derivedPhases.map((phase) => (
                    <div
                      key={phase.id}
                      className="flex items-start gap-3 pb-3 border-b border-border/60 last:border-0 last:pb-0"
                    >
                      <div className="mt-1">{getPhaseIcon(phase.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-sm text-foreground">{phase.name}</h3>
                          <Badge
                            variant={getStatusBadge(phase.status)}
                            className="rounded-full bg-primary text-primary-foreground text-[11px] font-medium px-2 py-0.5"
                          >
                            {phase.status === "in-progress"
                              ? "In Progress"
                              : phase.status === "completed"
                              ? "Completed"
                              : "Pending"}
                          </Badge>
                        </div>
                        <Progress value={phase.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">{phase.progress}% complete</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-foreground">Tasks & Checklist</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {derivedTasks.filter((t) => t.status === "completed").length} of {derivedTasks.length} tasks completed
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {derivedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card hover:bg-accent transition-colors"
                    >
                      {task.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      )}
                      <span
                        className={`flex-1 text-sm ${
                          task.status === "completed" ? "line-through text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </span>
                      <Badge variant="outline" className="text-xs border-border/60 text-muted-foreground">
                        Phase {task.phase}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-foreground">
                    <FileText className="w-4 h-4" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    No documents attached yet. Upload project documentation here.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-foreground">
                    <DollarSign className="w-4 h-4" />
                    Budget Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex justify-between items-center pb-2 border-b border-border/60">
                    <span>Total Budget</span>
                    <span className="font-semibold text-foreground">₹{totalBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-border/60">
                    <span>Spent</span>
                    <span className="font-semibold text-emerald-600">₹{spentBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Remaining</span>
                    <span className="font-semibold text-foreground">₹{remainingBudget.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex flex-col h-96 border border-border/60 bg-card/80 shadow-sm backdrop-blur">
                <CardHeader className="border-b border-border/60">
                  <CardTitle className="text-base text-foreground">Project Chat</CardTitle>
                  <CardDescription className="text-muted-foreground">Ask questions and share documents</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto space-y-3 py-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className="space-y-1">
                        <div
                          className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                            message.sender === "user"
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-muted text-foreground rounded-bl-none border border-border/60"
                          }`}
                        >
                          {message.text}
                        </div>
                        {message.attachment && (
                          <div
                            className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                              message.sender === "user"
                                ? "bg-primary/20 text-foreground"
                                : "bg-accent text-accent-foreground border border-border/60"
                            }`}
                          >
                            <FileText className="w-3 h-3" />
                            {message.attachment.name} ({message.attachment.size})
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
                <div className="border-t border-border/60 p-3 flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="h-9 text-sm bg-muted border-border/60"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    size="sm"
                    variant="outline"
                    className="h-9 w-9 p-0 border-border/60"
                    title="Upload document"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                  />
                  <Button onClick={handleSendMessage} size="sm" variant="default" className="h-9 w-9 p-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </RoleAwareSidebar>
  );
};

const ClientProjectDetail = () => <ProjectDashboard />;

export default ClientProjectDetail;
