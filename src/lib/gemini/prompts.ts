/**
 * Prompt templates for AI report generation
 */

export const REPORT_SYSTEM_PROMPT = `Du er en servicerapport-generator for EnergiSmart Norge AS.
Du genererer profesjonelle servicerapporter basert på sjekklistedata.

VIKTIGE REGLER:
1. Skriv alltid på norsk (bokmål)
2. Bruk profesjonelt, men forståelig språk
3. Unngå teknisk sjargong med mindre det er nødvendig
4. Vær objektiv og faktabasert
5. Gi konkrete anbefalinger

RAPPORTSTRUKTUR:
1. Kort oppsummering (2-3 setninger)
2. Hovedfunn kategorisert etter alvorlighet (kritisk/alvorlig/moderat/mindre)
3. Konkrete anbefalinger med prioritering
4. Produksjonsdata og trender (hvis tilgjengelig)
5. Neste planlagte service`;

export interface ReportGenerationInput {
  customerName: string;
  installationAddress: string;
  systemType: string;
  installDate: string;
  lastServiceDate?: string;
  visitDate: string;
  visitType: string;
  technicianName: string;
  checklistItems: Array<{
    category: string;
    description: string;
    status: string;
    value?: string;
    notes?: string;
    severity?: string;
  }>;
  productionData?: {
    expected: number;
    actual: number;
    percentage: number;
  };
}

export function generateReportPrompt(input: ReportGenerationInput): string {
  const checklistSummary = input.checklistItems
    .map((item) => {
      let line = `- [${item.category}] ${item.description}: ${item.status}`;
      if (item.value) line += ` (verdi: ${item.value})`;
      if (item.severity) line += ` [${item.severity}]`;
      if (item.notes) line += ` - ${item.notes}`;
      return line;
    })
    .join("\n");

  const productionSection = input.productionData
    ? `
PRODUKSJONSDATA:
- Forventet produksjon: ${input.productionData.expected} kWh
- Faktisk produksjon: ${input.productionData.actual} kWh
- Ytelse: ${input.productionData.percentage}%`
    : "";

  return `Generer en profesjonell servicerapport basert på følgende informasjon:

KUNDEINFORMASJON:
- Kundenavn: ${input.customerName}
- Adresse: ${input.installationAddress}
- Systemtype: ${input.systemType}
- Installasjonsdato: ${input.installDate}
${input.lastServiceDate ? `- Forrige service: ${input.lastServiceDate}` : ""}

BESØKSINFORMASJON:
- Besøksdato: ${input.visitDate}
- Besøkstype: ${input.visitType}
- Tekniker: ${input.technicianName}

SJEKKLISTEDATA:
${checklistSummary}
${productionSection}

Generer en komplett servicerapport som inkluderer:
1. Oppsummering (2-3 positive setninger om systemets tilstand)
2. Hovedfunn (gruppert etter alvorlighet: kritisk, alvorlig, moderat, mindre)
3. Anbefalinger (konkrete tiltak med prioritering)
4. Neste service (anbefalt tidspunkt og hva som bør gjøres)`;
}

export interface ReportOutput {
  summary: string;
  findings: {
    critical: string[];
    serious: string[];
    moderate: string[];
    minor: string[];
  };
  recommendations: Array<{
    priority: "høy" | "middels" | "lav";
    action: string;
    reason: string;
  }>;
  nextService: {
    recommendedDate: string;
    tasks: string[];
  };
  overallStatus: "utmerket" | "god" | "akseptabel" | "krever oppfølging";
}

export function generateStructuredReportPrompt(input: ReportGenerationInput): string {
  const basePrompt = generateReportPrompt(input);
  
  return `${basePrompt}

Returner rapporten som JSON med følgende struktur:
{
  "summary": "Kort oppsummering av besøket",
  "findings": {
    "critical": ["Liste over kritiske funn"],
    "serious": ["Liste over alvorlige funn"],
    "moderate": ["Liste over moderate funn"],
    "minor": ["Liste over mindre funn"]
  },
  "recommendations": [
    {
      "priority": "høy|middels|lav",
      "action": "Beskrivelse av tiltak",
      "reason": "Begrunnelse"
    }
  ],
  "nextService": {
    "recommendedDate": "Anbefalt dato (f.eks. 'om 6 måneder', 'våren 2025')",
    "tasks": ["Liste over oppgaver for neste service"]
  },
  "overallStatus": "utmerket|god|akseptabel|krever oppfølging"
}`;
}
