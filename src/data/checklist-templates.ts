import type { InputType } from "~/types/checklists";

/**
 * Checklist Template Data for MVP
 * These templates can be seeded into the database
 */

export interface ChecklistTemplateData {
  name: string;
  description: string;
  systemType: "SOLAR_PANEL" | "BESS" | "COMBINED";
  visitType: "ANNUAL_INSPECTION" | "SEMI_ANNUAL" | "QUARTERLY" | "EMERGENCY" | "REPAIR" | "INSTALLATION";
  items: Array<{
    category: string;
    description: string;
    inputType: InputType;
    isMandatory: boolean;
    photoRequired: boolean;
    minValue?: number;
    maxValue?: number;
    options?: string[];
    helpText?: string;
    sortOrder: number;
  }>;
}

export const ANNUAL_SOLAR_INSPECTION: ChecklistTemplateData = {
  name: "Årlig inspeksjon - Solceller",
  description: "Komplett årlig serviceinspeksjon for solcelleanlegg",
  systemType: "SOLAR_PANEL",
  visitType: "ANNUAL_INSPECTION",
  items: [
    // Category 1: Safety and Access
    {
      category: "Sikkerhet og tilgang",
      description: "HMS-vurdering gjennomført før start",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: false,
      helpText: "Bekreft at HMS-sjekk er utført",
      sortOrder: 1,
    },
    {
      category: "Sikkerhet og tilgang",
      description: "Tilgang til anlegg verifisert",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 2,
    },
    {
      category: "Sikkerhet og tilgang",
      description: "Nødstopp identifisert og testet",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 3,
    },
    {
      category: "Sikkerhet og tilgang",
      description: "Foto av HMS-tavle/merking",
      inputType: "IMAGE",
      isMandatory: true,
      photoRequired: true,
      sortOrder: 4,
    },

    // Category 2: Solar Panels
    {
      category: "Solcellepaneler",
      description: "Visuell inspeksjon - fysiske skader",
      inputType: "YES_NO_NA",
      isMandatory: true,
      photoRequired: true,
      helpText: "Sjekk for sprekker, deformasjoner eller skader",
      sortOrder: 5,
    },
    {
      category: "Solcellepaneler",
      description: "Smuss/avfall på paneler",
      inputType: "NUMERIC",
      isMandatory: true,
      photoRequired: false,
      minValue: 1,
      maxValue: 5,
      helpText: "1 = rent, 5 = mye smuss",
      sortOrder: 6,
    },
    {
      category: "Solcellepaneler",
      description: "Rengjøring utført",
      inputType: "YES_NO",
      isMandatory: false,
      photoRequired: false,
      sortOrder: 7,
    },
    {
      category: "Solcellepaneler",
      description: "Hotspot-skanning utført",
      inputType: "YES_NO_NA",
      isMandatory: false,
      photoRequired: true,
      helpText: "Bruk varmekamera hvis tilgjengelig",
      sortOrder: 8,
    },
    {
      category: "Solcellepaneler",
      description: "Antall mikrosprekker identifisert",
      inputType: "NUMERIC",
      isMandatory: false,
      photoRequired: false,
      minValue: 0,
      sortOrder: 9,
    },
    {
      category: "Solcellepaneler",
      description: "Festepunkter kontrollert",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 10,
    },

    // Category 3: Inverters
    {
      category: "Invertere",
      description: "Inverter status OK",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 11,
    },
    {
      category: "Invertere",
      description: "Feilkoder registrert",
      inputType: "TEXT",
      isMandatory: false,
      photoRequired: false,
      helpText: "Skriv inn eventuelle feilkoder",
      sortOrder: 12,
    },
    {
      category: "Invertere",
      description: "Firmware-versjon",
      inputType: "TEXT",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 13,
    },
    {
      category: "Invertere",
      description: "Ventilasjonsåpninger rene",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 14,
    },
    {
      category: "Invertere",
      description: "AC-spenning målt (V)",
      inputType: "ELECTRICAL_MEASUREMENT",
      isMandatory: true,
      photoRequired: false,
      minValue: 200,
      maxValue: 260,
      sortOrder: 15,
    },
    {
      category: "Invertere",
      description: "DC-spenning målt (V)",
      inputType: "ELECTRICAL_MEASUREMENT",
      isMandatory: true,
      photoRequired: false,
      minValue: 200,
      maxValue: 600,
      sortOrder: 16,
    },
    {
      category: "Invertere",
      description: "Produksjonsavlesning (kWh)",
      inputType: "NUMERIC",
      isMandatory: true,
      photoRequired: true,
      sortOrder: 17,
    },

    // Category 4: Cables and Connections
    {
      category: "Kabler og koblinger",
      description: "Visuell inspeksjon av kabler",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: true,
      sortOrder: 18,
    },
    {
      category: "Kabler og koblinger",
      description: "MC4-koblinger kontrollert",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 19,
    },
    {
      category: "Kabler og koblinger",
      description: "Jordfeiltest utført",
      inputType: "YES_NO_NA",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 20,
    },
    {
      category: "Kabler og koblinger",
      description: "Kabelgjennomføringer tettet",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 21,
    },

    // Category 5: Mounting and Structure
    {
      category: "Montering og konstruksjon",
      description: "Takklemmer/monteringssystem OK",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 22,
    },
    {
      category: "Montering og konstruksjon",
      description: "Korrosjon observert",
      inputType: "YES_NO_NA",
      isMandatory: false,
      photoRequired: true,
      sortOrder: 23,
    },
    {
      category: "Montering og konstruksjon",
      description: "Taktetting OK",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 24,
    },

    // Category 6: Performance and Documentation
    {
      category: "Ytelse og dokumentasjon",
      description: "Sammenligning med forventet produksjon (%)",
      inputType: "NUMERIC",
      isMandatory: true,
      photoRequired: false,
      helpText: "Faktisk produksjon i forhold til forventet",
      sortOrder: 25,
    },
    {
      category: "Ytelse og dokumentasjon",
      description: "Avvik notert",
      inputType: "TEXT",
      isMandatory: false,
      photoRequired: false,
      sortOrder: 26,
    },
    {
      category: "Ytelse og dokumentasjon",
      description: "Anbefalinger",
      inputType: "TEXT",
      isMandatory: false,
      photoRequired: false,
      sortOrder: 27,
    },
    {
      category: "Ytelse og dokumentasjon",
      description: "Kundesignatur",
      inputType: "SIGNATURE",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 28,
    },
    {
      category: "Ytelse og dokumentasjon",
      description: "Generelle kommentarer",
      inputType: "TEXT",
      isMandatory: false,
      photoRequired: false,
      sortOrder: 29,
    },
  ],
};

export const BESS_INSPECTION: ChecklistTemplateData = {
  name: "Batteriinspeksjon - BESS",
  description: "Inspeksjon av batterilagringssystem",
  systemType: "BESS",
  visitType: "ANNUAL_INSPECTION",
  items: [
    // Safety
    {
      category: "Sikkerhet",
      description: "HMS-vurdering gjennomført",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 1,
    },
    {
      category: "Sikkerhet",
      description: "Nødstopp fungerer",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 2,
    },
    {
      category: "Sikkerhet",
      description: "Brannslukker tilgjengelig",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 3,
    },

    // Battery Status
    {
      category: "Batteristatus",
      description: "Batterikapasitet målt (%)",
      inputType: "NUMERIC",
      isMandatory: true,
      photoRequired: false,
      minValue: 0,
      maxValue: 100,
      sortOrder: 4,
    },
    {
      category: "Batteristatus",
      description: "Antall ladekretser",
      inputType: "NUMERIC",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 5,
    },
    {
      category: "Batteristatus",
      description: "Cellbalansering OK",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 6,
    },
    {
      category: "Batteristatus",
      description: "Temperaturavlesning (°C)",
      inputType: "TEMPERATURE",
      isMandatory: true,
      photoRequired: false,
      minValue: 0,
      maxValue: 60,
      sortOrder: 7,
    },

    // Visual Inspection
    {
      category: "Visuell inspeksjon",
      description: "Batteriskap i god stand",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: true,
      sortOrder: 8,
    },
    {
      category: "Visuell inspeksjon",
      description: "Ingen tegn på lekkasje",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 9,
    },
    {
      category: "Visuell inspeksjon",
      description: "Ventilasjon fungerer",
      inputType: "YES_NO",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 10,
    },

    // Documentation
    {
      category: "Dokumentasjon",
      description: "Firmware-versjon",
      inputType: "TEXT",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 11,
    },
    {
      category: "Dokumentasjon",
      description: "Anbefalinger",
      inputType: "TEXT",
      isMandatory: false,
      photoRequired: false,
      sortOrder: 12,
    },
    {
      category: "Dokumentasjon",
      description: "Kundesignatur",
      inputType: "SIGNATURE",
      isMandatory: true,
      photoRequired: false,
      sortOrder: 13,
    },
  ],
};

// Export all templates
export const CHECKLIST_TEMPLATES = [
  ANNUAL_SOLAR_INSPECTION,
  BESS_INSPECTION,
];

// Seed function for database
export async function seedChecklistTemplates(db: {
  checklistTemplate: {
    upsert: (args: {
      where: { name_version: { name: string; version: number } };
      create: {
        name: string;
        description: string | null;
        systemType: string;
        visitType: string;
        version: number;
        items: { create: Array<{
          category: string;
          description: string;
          inputType: string;
          isMandatory: boolean;
          photoRequired: boolean;
          minValue?: number;
          maxValue?: number;
          options?: string;
          helpText?: string;
          sortOrder: number;
        }> };
      };
      update: Record<string, never>;
    }) => Promise<unknown>;
  };
}) {
  for (const template of CHECKLIST_TEMPLATES) {
    await db.checklistTemplate.upsert({
      where: {
        name_version: {
          name: template.name,
          version: 1,
        },
      },
      create: {
        name: template.name,
        description: template.description,
        systemType: template.systemType,
        visitType: template.visitType,
        version: 1,
        items: {
          create: template.items.map((item) => ({
            category: item.category,
            description: item.description,
            inputType: item.inputType,
            isMandatory: item.isMandatory,
            photoRequired: item.photoRequired,
            minValue: item.minValue,
            maxValue: item.maxValue,
            options: item.options ? JSON.stringify(item.options) : undefined,
            helpText: item.helpText,
            sortOrder: item.sortOrder,
          })),
        },
      },
      update: {},
    });
  }
}
