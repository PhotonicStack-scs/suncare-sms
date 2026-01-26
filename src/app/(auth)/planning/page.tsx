import { Suspense } from "react";
import { Calendar, Plus, Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { SkeletonCard } from "~/components/ui/skeleton";
import { api } from "~/trpc/server";

export const metadata = {
  title: "Serviceplanlegging | Suncare",
  description: "Planlegg og administrer servicebesøk",
};

async function PlanningStats() {
  const stats = await api.visit.getStats();

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            I dag
          </CardTitle>
          <Calendar className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.today}</div>
          <p className="text-xs text-muted-foreground">planlagte besøk</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Denne uken
          </CardTitle>
          <Clock className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.thisWeek}</div>
          <p className="text-xs text-muted-foreground">besøk totalt</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Venter
          </CardTitle>
          <Users className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.scheduled}</div>
          <p className="text-xs text-muted-foreground">ikke tildelt</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Fullført denne mnd
          </CardTitle>
          <Calendar className="size-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {stats.completedThisMonth}
          </div>
          <p className="text-xs text-muted-foreground">besøk</p>
        </CardContent>
      </Card>
    </div>
  );
}

async function TodayVisits() {
  const visits = await api.visit.getToday();

  if (visits.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="size-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Ingen besøk planlagt i dag</p>
          <Button>
            <Plus className="size-4" />
            Planlegg besøk
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dagens besøk</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visits.map((visit) => (
            <div
              key={visit.id}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="space-y-1">
                <p className="font-medium">
                  {visit.agreement.installation.customer.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {visit.agreement.installation.address},{" "}
                  {visit.agreement.installation.city}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(visit.scheduledDate).toLocaleTimeString("nb-NO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {visit.scheduledEnd &&
                    ` - ${new Date(visit.scheduledEnd).toLocaleTimeString("nb-NO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    visit.status === "SCHEDULED"
                      ? "bg-info/15 text-info"
                      : visit.status === "IN_PROGRESS"
                      ? "bg-warning/15 text-warning"
                      : visit.status === "COMPLETED"
                      ? "bg-success/15 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {visit.status === "SCHEDULED"
                    ? "Planlagt"
                    : visit.status === "IN_PROGRESS"
                    ? "Pågår"
                    : visit.status === "COMPLETED"
                    ? "Fullført"
                    : visit.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlanningPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Serviceplanlegging</h1>
          <p className="text-muted-foreground">
            Planlegg og koordiner servicebesøk for teknikere
          </p>
        </div>
        <Button>
          <Plus className="size-4" />
          Nytt besøk
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        }
      >
        <PlanningStats />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={<SkeletonCard />}>
          <TodayVisits />
        </Suspense>

        <Card>
          <CardHeader>
            <CardTitle>Kalender</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-12">
              Kalendervisning kommer snart
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
