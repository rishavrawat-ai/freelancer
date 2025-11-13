import {
  Briefcase,
  CalendarRange,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { RoleAwareSidebar } from "@/components/dashboard/RoleAwareSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const metrics = [
  {
    label: "Active contracts",
    value: "4",
    trend: "+1 this week",
    icon: Briefcase
  },
  {
    label: "Proposals sent",
    value: "12",
    trend: "3 awaiting reply",
    icon: Sparkles
  },
  {
    label: "Avg. response time",
    value: "2.4 hrs",
    trend: "Faster than 82% of peers",
    icon: Clock
  }
];

const pipeline = [
  {
    title: "AI onboarding revamp",
    client: "Arcadia Systems",
    status: "Review in progress",
    due: "Due Friday"
  },
  {
    title: "Brand film microsite",
    client: "Northwind Films",
    status: "Kickoff scheduled",
    due: "Starts next week"
  },
  {
    title: "Founder deck polish",
    client: "Chroma Labs",
    status: "Waiting on feedback",
    due: "Revisions due tomorrow"
  }
];

const messages = [
  {
    from: "Leah Park",
    company: "Tempo.fm",
    excerpt: "Loved your exploration — can you add a version with darker gradients?",
    time: "12m ago"
  },
  {
    from: "Ahmed Rafay",
    company: "Lightspeed",
    excerpt: "Contracts signed! Kicking off as soon as you drop the onboarding doc.",
    time: "1h ago"
  }
];

const availability = [
  {
    label: "Discovery & ideation",
    progress: 80
  },
  {
    label: "Design & prototyping",
    progress: 55
  },
  {
    label: "Implementation & QA",
    progress: 35
  }
];

const FreelancerDashboard = () => {
  return (
    <RoleAwareSidebar>
      <div className="flex flex-col gap-6 p-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Today</p>
            <h1 className="text-2xl font-semibold leading-tight">Freelancer control room</h1>
            <p className="text-muted-foreground">
              Track pitches, monitor replies, and stay ahead of deliverables.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SidebarTrigger className="md:hidden" />
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarRange className="size-4" />
              Sync calendar
            </Button>
            <Button size="sm" className="gap-2">
              <MessageSquare className="size-4" />
              Quick reply
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label} className="border-dashed">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="size-4 text-primary" />
                    {metric.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-3xl font-semibold">{metric.value}</p>
                  <p className="text-sm text-muted-foreground">{metric.trend}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Active pipeline</CardTitle>
              <CardDescription>Priority projects requiring action</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pipeline.map((project) => (
                <div
                  key={project.title}
                  className="flex flex-col gap-2 rounded-lg border bg-card/50 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold leading-tight">{project.title}</p>
                    <p className="text-sm text-muted-foreground">{project.client}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">{project.status}</Badge>
                    <p className="text-sm text-muted-foreground">{project.due}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Practice load</CardTitle>
              <CardDescription>Where your hours are committed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availability.map((track) => (
                <div key={track.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{track.label}</span>
                    <span className="text-muted-foreground">{track.progress}%</span>
                  </div>
                  <Progress value={track.progress} />
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Inbox</CardTitle>
              <CardDescription>Replies and invites waiting on you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.from}
                  className="rounded-lg border bg-card/60 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{message.from}</p>
                      <p className="text-sm text-muted-foreground">{message.company}</p>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="size-3" />
                      High intent
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{message.excerpt}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{message.time}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reminders</CardTitle>
              <CardDescription>Keep the momentum with quick nudges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border bg-card/40 p-3">
                <Clock className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Follow up with Chroma Labs</p>
                  <p className="text-xs text-muted-foreground">Draft ready to send</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-card/40 p-3">
                <Briefcase className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Prep Aurora workshop assets</p>
                  <p className="text-xs text-muted-foreground">Session in 36 hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </RoleAwareSidebar>
  );
};

export default FreelancerDashboard;

