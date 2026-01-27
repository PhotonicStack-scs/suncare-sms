"use client";

import { Plus, Minus, Package } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { formatMoney } from "~/types/common";

interface AddonProduct {
  id: string;
  name: string;
  description: string | null;
  category: string;
  basePrice: unknown; // Decimal from Prisma
  unit: string | null;
  isActive: boolean;
}

interface SelectedAddon {
  addonId: string;
  quantity: number;
}

interface AddonSelectorProps {
  products: AddonProduct[];
  selectedAddons: SelectedAddon[];
  onChange: (addons: SelectedAddon[]) => void;
  className?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  MAINTENANCE: "Vedlikehold",
  MONITORING: "Overvåkning",
  PRIORITY: "Prioritet",
  EQUIPMENT: "Utstyr",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  MAINTENANCE: "Ekstra vedlikeholdstjenester",
  MONITORING: "Overvåkning og rapportering",
  PRIORITY: "Prioritert service og respons",
  EQUIPMENT: "Utstyr og utvidede garantier",
};

export function AddonSelector({
  products,
  selectedAddons,
  onChange,
  className,
}: AddonSelectorProps) {
  // Group products by category
  const productsByCategory = products.reduce(
    (acc, product) => {
      const category = product.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    },
    {} as Record<string, AddonProduct[]>
  );

  const getSelectedQuantity = (addonId: string): number => {
    return selectedAddons.find((a) => a.addonId === addonId)?.quantity ?? 0;
  };

  const updateQuantity = (addonId: string, quantity: number) => {
    if (quantity <= 0) {
      onChange(selectedAddons.filter((a) => a.addonId !== addonId));
    } else {
      const existing = selectedAddons.find((a) => a.addonId === addonId);
      if (existing) {
        onChange(
          selectedAddons.map((a) =>
            a.addonId === addonId ? { ...a, quantity } : a
          )
        );
      } else {
        onChange([...selectedAddons, { addonId, quantity }]);
      }
    }
  };

  if (products.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Package className="size-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Ingen tilleggsprodukter tilgjengelig
        </p>
      </div>
    );
  }

  const categories = Object.keys(productsByCategory);

  return (
    <div className={cn("space-y-6", className)}>
      <p className="text-sm text-muted-foreground">
        Velg tilleggsprodukter for å utvide serviceavtalen. Alle priser er
        per år.
      </p>

      {categories.map((category) => (
        <div key={category} className="space-y-3">
          <div>
            <h3 className="font-medium">
              {CATEGORY_LABELS[category] ?? category}
            </h3>
            <p className="text-sm text-muted-foreground">
              {CATEGORY_DESCRIPTIONS[category]}
            </p>
          </div>

          <div className="grid gap-3">
            {productsByCategory[category]?.map((product) => {
              const quantity = getSelectedQuantity(product.id);
              const isSelected = quantity > 0;

              return (
                <div
                  key={product.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border-2 p-4 transition-colors",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{product.name}</span>
                      {product.unit && (
                        <span className="text-xs text-muted-foreground">
                          (per {product.unit})
                        </span>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {product.description}
                      </p>
                    )}
                    <p className="text-sm font-medium text-primary mt-1">
                      {formatMoney({
                        amount: Number(product.basePrice),
                        currency: "NOK",
                      })}
                      /år
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                        >
                          <Minus className="size-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuantity(product.id, 1)}
                      >
                        <Plus className="size-4" />
                        Legg til
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Selected Summary */}
      {selectedAddons.length > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
          <h4 className="font-medium text-sm mb-2">
            Valgte tilleggsprodukter ({selectedAddons.length})
          </h4>
          <ul className="text-sm space-y-1">
            {selectedAddons.map((selected) => {
              const product = products.find((p) => p.id === selected.addonId);
              if (!product) return null;
              return (
                <li
                  key={selected.addonId}
                  className="flex items-center justify-between"
                >
                  <span>
                    {product.name} × {selected.quantity}
                  </span>
                  <span className="text-muted-foreground">
                    {formatMoney({
                      amount: Number(product.basePrice) * selected.quantity,
                      currency: "NOK",
                    })}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
