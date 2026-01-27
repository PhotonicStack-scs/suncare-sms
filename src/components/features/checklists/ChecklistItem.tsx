"use client";

import { useState } from "react";
import {
  Check,
  X,
  Minus,
  Camera,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

type ItemStatus = "PENDING" | "PASSED" | "FAILED" | "NOT_APPLICABLE";
type Severity = "CRITICAL" | "SERIOUS" | "MODERATE" | "MINOR";

interface ChecklistItemProps {
  item: {
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
  };
  onUpdate: (updates: {
    status?: ItemStatus;
    value?: string | null;
    numericValue?: number | null;
    notes?: string | null;
    severity?: Severity | null;
  }) => void;
  className?: string;
}

const SEVERITY_INFO: Record<Severity, { label: string; color: string }> = {
  CRITICAL: { label: "Kritisk", color: "bg-destructive text-destructive-foreground" },
  SERIOUS: { label: "Alvorlig", color: "bg-orange-500 text-white" },
  MODERATE: { label: "Moderat", color: "bg-yellow-500 text-black" },
  MINOR: { label: "Mindre", color: "bg-green-500 text-white" },
};

export function ChecklistItem({ item, onUpdate, className }: ChecklistItemProps) {
  const [showNotes, setShowNotes] = useState(!!item.notes);
  const [showSeverity, setShowSeverity] = useState(item.status === "FAILED");

  const handleStatusChange = (status: ItemStatus) => {
    onUpdate({ status });
    if (status === "FAILED") {
      setShowSeverity(true);
    } else {
      setShowSeverity(false);
      onUpdate({ status, severity: null });
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border p-4 transition-colors",
        item.status === "PASSED" && "bg-success/5 border-success/30",
        item.status === "FAILED" && "bg-destructive/5 border-destructive/30",
        item.status === "NOT_APPLICABLE" && "bg-muted/50",
        className
      )}
    >
      {/* Description */}
      <div className="mb-3">
        <p className="font-medium">{item.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Type: {item.inputType}
        </p>
      </div>

      {/* Yes/No Input Type */}
      {(item.inputType === "YES_NO" || item.inputType === "PASS_FAIL") && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={item.status === "PASSED" ? "default" : "outline"}
            size="sm"
            className={cn(
              item.status === "PASSED" && "bg-success hover:bg-success/90"
            )}
            onClick={() => handleStatusChange("PASSED")}
          >
            <Check className="size-4" />
            OK
          </Button>
          <Button
            type="button"
            variant={item.status === "FAILED" ? "default" : "outline"}
            size="sm"
            className={cn(
              item.status === "FAILED" && "bg-destructive hover:bg-destructive/90"
            )}
            onClick={() => handleStatusChange("FAILED")}
          >
            <X className="size-4" />
            Avvik
          </Button>
          <Button
            type="button"
            variant={item.status === "NOT_APPLICABLE" ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange("NOT_APPLICABLE")}
          >
            <Minus className="size-4" />
            N/A
          </Button>
        </div>
      )}

      {/* Numeric Input Type */}
      {item.inputType === "NUMERIC" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={item.numericValue ?? ""}
              onChange={(e) =>
                onUpdate({
                  numericValue: e.target.value ? parseFloat(e.target.value) : null,
                  status: "PASSED",
                })
              }
              placeholder="Verdi..."
              className="w-32"
            />
            <div className="flex gap-1">
              <Button
                type="button"
                variant={item.status === "PASSED" ? "default" : "outline"}
                size="icon-sm"
                onClick={() => handleStatusChange("PASSED")}
              >
                <Check className="size-3" />
              </Button>
              <Button
                type="button"
                variant={item.status === "FAILED" ? "default" : "outline"}
                size="icon-sm"
                className={cn(
                  item.status === "FAILED" && "bg-destructive"
                )}
                onClick={() => handleStatusChange("FAILED")}
              >
                <X className="size-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Text Input Type */}
      {item.inputType === "TEXT" && (
        <div className="space-y-2">
          <Input
            type="text"
            value={item.value ?? ""}
            onChange={(e) =>
              onUpdate({
                value: e.target.value || null,
                status: e.target.value ? "PASSED" : "PENDING",
              })
            }
            placeholder="Skriv inn verdi..."
          />
        </div>
      )}

      {/* Multiple Choice */}
      {item.inputType === "MULTIPLE_CHOICE" && (
        <div className="flex flex-wrap gap-2">
          {["1", "2", "3", "4", "5"].map((val) => (
            <Button
              key={val}
              type="button"
              variant={item.value === val ? "default" : "outline"}
              size="sm"
              onClick={() => onUpdate({ value: val, status: "PASSED" })}
            >
              {val}
            </Button>
          ))}
        </div>
      )}

      {/* Severity Selection (for failed items) */}
      {showSeverity && item.status === "FAILED" && (
        <div className="mt-3 p-3 bg-destructive/10 rounded-md space-y-2">
          <Label className="text-sm flex items-center gap-2">
            <AlertTriangle className="size-4" />
            Alvorlighetsgrad
          </Label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(SEVERITY_INFO) as [Severity, typeof SEVERITY_INFO.CRITICAL][]).map(
              ([severity, info]) => (
                <Button
                  key={severity}
                  type="button"
                  variant={item.severity === severity ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    item.severity === severity && info.color
                  )}
                  onClick={() => onUpdate({ severity })}
                >
                  {info.label}
                </Button>
              )
            )}
          </div>
        </div>
      )}

      {/* Notes toggle and input */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform",
              showNotes && "rotate-180"
            )}
          />
          {showNotes ? "Skjul notater" : "Legg til notater"}
        </button>

        {showNotes && (
          <textarea
            value={item.notes ?? ""}
            onChange={(e) => onUpdate({ notes: e.target.value || null })}
            placeholder="Skriv notater her..."
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-16"
          />
        )}
      </div>
    </div>
  );
}
