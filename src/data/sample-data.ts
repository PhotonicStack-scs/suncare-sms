/**
 * Sample data for development and testing
 * This data can be used for UI development before the database is fully set up
 */

import type { VisitStatus, VisitType } from "~/types/visits";
import type { AgreementStatus, AgreementType, SlaLevel } from "~/types/agreements";
import type { SystemType } from "~/types/installations";

// Sample customers
export const SAMPLE_CUSTOMERS = [
  {
    id: "cust_1",
    tripletexId: 12345,
    name: "Solgård Borettslag",
    orgNumber: "912345678",
    email: "styret@solgard-bl.no",
    phone: "+47 22 33 44 55",
    contactPerson: "Kari Nordmann",
    postalAddress: "Solveien 15, 0123 Oslo",
  },
  {
    id: "cust_2",
    tripletexId: 12346,
    name: "Grønn Industri AS",
    orgNumber: "987654321",
    email: "drift@gronnindustri.no",
    phone: "+47 33 44 55 66",
    contactPerson: "Ola Hansen",
    postalAddress: "Industriveien 88, 5000 Bergen",
  },
  {
    id: "cust_3",
    tripletexId: 12347,
    name: "Villa Solheim",
    orgNumber: null,
    email: "per.solheim@gmail.com",
    phone: "+47 99 88 77 66",
    contactPerson: "Per Solheim",
    postalAddress: "Fjellveien 42, 7000 Trondheim",
  },
];

// Sample installations
export const SAMPLE_INSTALLATIONS = [
  {
    id: "inst_1",
    customerId: "cust_1",
    address: "Solveien 15",
    city: "Oslo",
    postalCode: "0123",
    systemType: "SOLAR_PANEL" as SystemType,
    capacityKw: 45.5,
    installDate: new Date("2022-06-15"),
    inverterType: "SolarEdge SE10K",
    panelCount: 140,
    panelType: "JA Solar 325W",
  },
  {
    id: "inst_2",
    customerId: "cust_2",
    address: "Industriveien 88",
    city: "Bergen",
    postalCode: "5000",
    systemType: "COMBINED" as SystemType,
    capacityKw: 120.0,
    installDate: new Date("2023-03-20"),
    inverterType: "Huawei SUN2000-100KTL",
    panelCount: 300,
    batteryKwh: 100,
  },
  {
    id: "inst_3",
    customerId: "cust_3",
    address: "Fjellveien 42",
    city: "Trondheim",
    postalCode: "7000",
    systemType: "BESS" as SystemType,
    capacityKw: 12.0,
    installDate: new Date("2024-01-10"),
    batteryKwh: 13.5,
    batteryType: "Tesla Powerwall 2",
  },
];

// Sample agreements
export const SAMPLE_AGREEMENTS = [
  {
    id: "agr_1",
    installationId: "inst_1",
    agreementNumber: "SA-2024-ABC123",
    agreementType: "STANDARD" as AgreementType,
    status: "ACTIVE" as AgreementStatus,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    basePrice: 4500,
    slaLevel: "STANDARD" as SlaLevel,
    autoRenew: true,
    visitFrequency: 2,
  },
  {
    id: "agr_2",
    installationId: "inst_2",
    agreementNumber: "SA-2024-DEF456",
    agreementType: "PREMIUM" as AgreementType,
    status: "ACTIVE" as AgreementStatus,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    basePrice: 15000,
    slaLevel: "PRIORITY" as SlaLevel,
    autoRenew: true,
    visitFrequency: 4,
  },
  {
    id: "agr_3",
    installationId: "inst_3",
    agreementNumber: "SA-2024-GHI789",
    agreementType: "BASIC" as AgreementType,
    status: "ACTIVE" as AgreementStatus,
    startDate: new Date("2024-06-01"),
    endDate: new Date("2025-05-31"),
    basePrice: 2500,
    slaLevel: "STANDARD" as SlaLevel,
    autoRenew: false,
    visitFrequency: 1,
  },
];

// Sample visits
export const SAMPLE_VISITS = [
  {
    id: "visit_1",
    agreementId: "agr_1",
    technicianId: "tech_1",
    scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    status: "SCHEDULED" as VisitStatus,
    visitType: "SEMI_ANNUAL" as VisitType,
    customerName: "Solgård Borettslag",
    address: "Solveien 15, Oslo",
  },
  {
    id: "visit_2",
    agreementId: "agr_2",
    technicianId: "tech_2",
    scheduledDate: new Date(), // Today
    status: "IN_PROGRESS" as VisitStatus,
    visitType: "QUARTERLY" as VisitType,
    customerName: "Grønn Industri AS",
    address: "Industriveien 88, Bergen",
  },
  {
    id: "visit_3",
    agreementId: "agr_1",
    technicianId: "tech_1",
    scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    actualEndDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    status: "COMPLETED" as VisitStatus,
    visitType: "SEMI_ANNUAL" as VisitType,
    customerName: "Solgård Borettslag",
    address: "Solveien 15, Oslo",
    durationMinutes: 90,
  },
  {
    id: "visit_4",
    agreementId: "agr_3",
    technicianId: "tech_1",
    scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    status: "SCHEDULED" as VisitStatus,
    visitType: "ANNUAL_INSPECTION" as VisitType,
    customerName: "Villa Solheim",
    address: "Fjellveien 42, Trondheim",
  },
];

// Sample KPI data for dashboard
export const SAMPLE_KPIS = {
  scheduledVisits: {
    value: 12,
    previousValue: 10,
    change: 2,
    changePercent: 20,
    trend: "up" as const,
  },
  activeAgreements: {
    value: 45,
    previousValue: 42,
    change: 3,
    changePercent: 7.1,
    trend: "up" as const,
  },
  pendingInvoices: {
    value: 8,
    previousValue: 12,
    change: -4,
    changePercent: -33.3,
    trend: "down" as const,
  },
  technicianUtilization: {
    value: 78,
    previousValue: 75,
    change: 3,
    changePercent: 4,
    trend: "up" as const,
  },
};

// Sample chart data for monthly visits
export const SAMPLE_MONTHLY_VISITS = [
  { month: "Jan", visits: 28, target: 30 },
  { month: "Feb", visits: 32, target: 30 },
  { month: "Mar", visits: 35, target: 32 },
  { month: "Apr", visits: 42, target: 35 },
  { month: "Mai", visits: 38, target: 35 },
  { month: "Jun", visits: 25, target: 30 },
  { month: "Jul", visits: 15, target: 20 },
  { month: "Aug", visits: 45, target: 40 },
  { month: "Sep", visits: 52, target: 45 }, // Current month highlighted
];

// Sample technicians
export const SAMPLE_TECHNICIANS = [
  {
    id: "tech_1",
    name: "Anders Berg",
    email: "anders.berg@energismart.no",
    phone: "+47 90 12 34 56",
    certifications: ["FSE", "Solar Level 2", "Roof/Fall"],
  },
  {
    id: "tech_2",
    name: "Lisa Johansen",
    email: "lisa.johansen@energismart.no",
    phone: "+47 91 23 45 67",
    certifications: ["FSE", "Solar Level 2", "BESS", "High Voltage"],
  },
  {
    id: "tech_3",
    name: "Erik Olsen",
    email: "erik.olsen@energismart.no",
    phone: "+47 92 34 56 78",
    certifications: ["FSE", "Solar Level 1"],
  },
];
