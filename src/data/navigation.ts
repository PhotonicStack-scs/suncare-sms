import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Building2,
  FileText,
  Receipt,
  History,
  Plug,
  Zap,
  Settings,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    id: "menu",
    label: "Menu",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "planning",
        label: "Serviceplanlegging",
        href: "/planning",
        icon: Calendar,
      },
      {
        id: "visits",
        label: "Arbeidsordre",
        href: "/visits",
        icon: ClipboardList,
      },
      {
        id: "installations",
        label: "Anlegg",
        href: "/installations",
        icon: Building2,
      },
      {
        id: "agreements",
        label: "Avtaler",
        href: "/agreements",
        icon: FileText,
      },
      {
        id: "invoices",
        label: "Faktura",
        href: "/invoices",
        icon: Receipt,
      },
      {
        id: "history",
        label: "Historikk",
        href: "/history",
        icon: History,
      },
    ],
  },
  {
    id: "features",
    label: "Funksjoner",
    items: [
      {
        id: "integrations",
        label: "Integrasjoner",
        href: "/integrations",
        icon: Plug,
      },
      {
        id: "automation",
        label: "Automatisering",
        href: "/automation",
        icon: Zap,
      },
    ],
  },
  {
    id: "tools",
    label: "Verktøy",
    items: [
      {
        id: "settings",
        label: "Innstillinger",
        href: "/settings",
        icon: Settings,
      },
      {
        id: "help",
        label: "Hjelp",
        href: "/help",
        icon: HelpCircle,
      },
    ],
  },
];
