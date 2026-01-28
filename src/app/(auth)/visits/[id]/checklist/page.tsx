"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, FileText, AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ChecklistForm } from "~/components/features/checklists";
import { api } from "~/trpc/react";

interface ChecklistPageProps {
  params: Promise<{ id: string }>;
}

export default function ChecklistPage({ params }: ChecklistPageProps) {
  const { id: visitId } = use(params);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(
    null
  );

  // Fetch visit with checklists
  const { data: visit, isLoading: loadingVisit } =
    api.visit.getById.useQuery(visitId);

  // Fetch available templates for creating new checklist
  const { data: templates } = api.checklists.getTemplates.useQuery({
    systemType: visit?.agreement?.installation?.systemType,
  });

  // Create checklist mutation
  const createChecklist = api.checklists.createFromTemplate.useMutation({
    onSuccess: (newChecklist) => {
      setSelectedChecklistId(newChecklist.id);
    },
  });

  // Select first checklist by default
  useEffect(() => {
    if (visit?.checklists && visit.checklists.length > 0 && !selectedChecklistId) {
      setSelectedChecklistId(visit.checklists[0]!.id);
    }
  }, [visit?.checklists, selectedChecklistId]);

  if (loadingVisit) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="size-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Besøket ble ikke funnet</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/visits">Tilbake til besøk</Link>
        </Button>
      </div>
    );
  }

  const checklists = visit.checklists ?? [];
  const hasChecklists = checklists.length > 0;

  // If we have a selected checklist, show the form
  if (selectedChecklistId) {
    return (
      <ChecklistForm visitId={visitId} checklistId={selectedChecklistId} />
    );
  }

  // Otherwise show checklist selection or creation
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sjekklister</h1>
        <p className="text-muted-foreground">
          {visit.agreement.installation.customer.name} •{" "}
          {visit.agreement.installation.address}
        </p>
      </div>

      {/* Existing Checklists */}
      {hasChecklists && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Eksisterende sjekklister</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {checklists.map((checklist) => (
                <li key={checklist.id} className="py-3 first:pt-0 last:pb-0">
                  <button
                    onClick={() => setSelectedChecklistId(checklist.id)}
                    className="w-full flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-accent/50 text-left"
                  >
                    <div>
                      <p className="font-medium">
                        {checklist.template?.name ?? "Sjekkliste"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {checklist.items?.length ?? 0} punkter •{" "}
                        {checklist.status === "COMPLETED"
                          ? "Fullført"
                          : checklist.status === "IN_PROGRESS"
                            ? "Pågår"
                            : "Ikke startet"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Åpne
                    </Button>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Create New Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Opprett ny sjekkliste</CardTitle>
        </CardHeader>
        <CardContent>
          {templates && templates.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() =>
                    createChecklist.mutate({
                      visitId,
                      templateId: template.id,
                      technicianId: visit.technicianId,
                    })
                  }
                  disabled={createChecklist.isPending}
                  className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-accent/50 text-left transition-colors disabled:opacity-50"
                >
                  <FileText className="size-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {template.systemType} • {template._count?.items ?? 0} punkter
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="size-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Ingen maler tilgjengelig for denne systemtypen
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back button */}
      <div className="flex justify-start">
        <Button variant="outline" asChild>
          <Link href={`/visits/${visitId}`}>
            Tilbake til besøk
          </Link>
        </Button>
      </div>
    </div>
  );
}
