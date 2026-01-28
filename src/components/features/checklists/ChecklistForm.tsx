"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  Loader2,
  ChevronLeft,
  Clock,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { StatusBadge } from "~/components/ui/badge";
import { api } from "~/trpc/react";
import { ChecklistCategory } from "./ChecklistCategory";

type ItemStatus = "PENDING" | "PASSED" | "FAILED" | "NOT_APPLICABLE";
type Severity = "CRITICAL" | "SERIOUS" | "MODERATE" | "MINOR";

interface ChecklistItemData {
  id: string;
  category: string;
  description: string;
  inputType: string;
  status: ItemStatus;
  value?: string | null;
  numericValue?: number | null;
  notes?: string | null;
  photoUrl?: string | null;
  severity?: Severity | null;
  order: number;
}

interface ChecklistFormProps {
  visitId: string;
  checklistId: string;
}

export function ChecklistForm({ visitId, checklistId }: ChecklistFormProps) {
  const router = useRouter();
  const [items, setItems] = useState<ChecklistItemData[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    data: checklist,
    isLoading,
  } = api.checklists.getById.useQuery(checklistId);

  const updateItem = api.checklists.updateItem.useMutation({
    onSuccess: () => {
      setLastSaved(new Date());
    },
  });

  const completeChecklist = api.checklists.complete.useMutation({
    onSuccess: () => {
      router.push(`/visits/${visitId}`);
    },
  });

  // Initialize items from checklist data
  useEffect(() => {
    if (checklist?.items) {
      setItems(
        checklist.items.map((item, index) => ({
          id: item.id,
          category: item.category ?? "GENERAL",
          description: item.description ?? "",
          inputType: item.inputType ?? "YES_NO",
          status: (item.status as ItemStatus) ?? "PENDING",
          value: item.value,
          numericValue: item.numericValue ? Number(item.numericValue) : null,
          notes: item.notes,
          photoUrl: item.photoUrl,
          severity: item.severity as Severity | null,
          order: index,
        }))
      );
    }
  }, [checklist]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped = items.reduce(
      (acc, item) => {
        const category = item.category;
        const categoryItems = (acc[category] ??= []);
        categoryItems.push(item);
        return acc;
      },
      {} as Record<string, ChecklistItemData[]>
    );

    // Sort items within each category by order
    Object.keys(grouped).forEach((category) => {
      grouped[category]?.sort((a, b) => a.order - b.order);
    });

    return grouped;
  }, [items]);

  // Calculate progress
  const progress = useMemo(() => {
    const total = items.length;
    const completed = items.filter((item) => item.status !== "PENDING").length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [items]);

  const handleItemUpdate = useCallback(
    (
      itemId: string,
      updates: {
        status?: ItemStatus;
        value?: string | null;
        numericValue?: number | null;
        notes?: string | null;
        severity?: Severity | null;
      }
    ) => {
      // Update local state immediately
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      );

      // Save to server (debounced would be better in production)
      setIsSaving(true);
      updateItem.mutate(
        {
          itemId,
          ...updates,
        },
        {
          onSettled: () => setIsSaving(false),
        }
      );
    },
    [updateItem]
  );

  const handleComplete = async () => {
    // Check if all items are completed
    const pendingItems = items.filter((item) => item.status === "PENDING");
    if (pendingItems.length > 0) {
      alert(`Det gjenstår ${pendingItems.length} punkter. Fullfør alle punkter før du avslutter.`);
      return;
    }

    await completeChecklist.mutateAsync({
      id: checklistId,
      items: items.map((item) => ({
        itemId: item.id,
        status: item.status,
        value: item.value ?? undefined,
        numericValue: item.numericValue ?? undefined,
        notes: item.notes ?? undefined,
        severity: item.severity ?? undefined,
      })),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="size-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Sjekklisten ble ikke funnet</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href={`/visits/${visitId}`}>Tilbake til besøk</Link>
        </Button>
      </div>
    );
  }

  const categories = Object.keys(itemsByCategory);
  const failedItems = items.filter((item) => item.status === "FAILED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/visits/${visitId}`}>
              <ChevronLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {checklist.template?.name ?? "Sjekkliste"}
            </h1>
            <p className="text-muted-foreground">
              {checklist.template?.systemType ?? ""} •{" "}
              {items.length} kontrollpunkter
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Lagrer...
            </span>
          )}
          {lastSaved && !isSaving && (
            <span className="text-sm text-muted-foreground">
              <Clock className="size-4 inline mr-1" />
              Lagret {lastSaved.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <Button
            onClick={handleComplete}
            disabled={completeChecklist.isPending || progress < 100}
          >
            {completeChecklist.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Fullfører...
              </>
            ) : (
              <>
                <CheckCircle className="size-4" />
                Fullfør sjekkliste
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Fremdrift</span>
                <span className="text-sm text-muted-foreground">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg text-success">
                  {items.filter((i) => i.status === "PASSED").length}
                </div>
                <div className="text-muted-foreground">OK</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-destructive">
                  {failedItems.length}
                </div>
                <div className="text-muted-foreground">Avvik</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg text-muted-foreground">
                  {items.filter((i) => i.status === "PENDING").length}
                </div>
                <div className="text-muted-foreground">Gjenstår</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deviations Summary (if any) */}
      {failedItems.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertCircle className="size-5" />
              Registrerte avvik ({failedItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {failedItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-2 text-sm"
                >
                  {item.severity && (
                    <StatusBadge
                      variant={
                        item.severity === "CRITICAL" || item.severity === "SERIOUS"
                          ? "blocked"
                          : "scheduled"
                      }
                    >
                      {item.severity}
                    </StatusBadge>
                  )}
                  <span>{item.description}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Categories */}
      <div className="space-y-4">
        {categories.map((category, index) => (
          <ChecklistCategory
            key={category}
            category={category}
            items={itemsByCategory[category] ?? []}
            onItemUpdate={handleItemUpdate}
            defaultExpanded={index === 0}
          />
        ))}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Ingen kontrollpunkter i denne sjekklisten
            </p>
          </CardContent>
        </Card>
      )}

      {/* Floating action button for mobile */}
      {progress === 100 && (
        <div className="fixed bottom-4 left-4 right-4 sm:hidden">
          <Button
            className="w-full"
            size="lg"
            onClick={handleComplete}
            disabled={completeChecklist.isPending}
          >
            {completeChecklist.isPending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <CheckCircle className="size-5" />
            )}
            Fullfør sjekkliste
          </Button>
        </div>
      )}
    </div>
  );
}
