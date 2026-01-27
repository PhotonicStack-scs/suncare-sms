# Service Management System - Scheduling Component Design

## Teknisk designdokument for planleggingskomponenten

**Dokument:** Teknisk Design  
**Dato:** 27. januar 2026  
**Versjon:** 1.0  
**Status:** Utkast

---

## 1. Oversikt

Dette dokumentet beskriver hvordan planleggingskomponenten for Service Management System (SMS) skal bygges for å dele ressurser med Ressursplanlegger-appen via `@energismart/shared`-pakken.

### 1.1 Mål

1. **Delt ressurspool** - Samme teknikere/ansatte brukes i begge systemer
2. **Konfliktfri planlegging** - Ingen dobbeltbooking på tvers av apper
3. **Effektiv ruteoptimering** - Maksimer servicebesøk per dag
4. **Sanntids tilgjengelighet** - Alltid oppdatert status på ressurser

### 1.2 Arkitekturoversikt

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ENERGISMART PLATTFORM                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────┐              ┌─────────────────────┐           │
│  │   RESSURSPLANLEGGER │              │   SERVICE MANAGEMENT │           │
│  │                     │              │       SYSTEM         │           │
│  │  ┌───────────────┐  │              │  ┌───────────────┐   │           │
│  │  │  Assignments  │  │              │  │ ServiceVisits │   │           │
│  │  │  (Prosjekter) │  │              │  │ (Service)     │   │           │
│  │  └───────┬───────┘  │              │  └───────┬───────┘   │           │
│  │          │          │              │          │           │           │
│  └──────────┼──────────┘              └──────────┼───────────┘           │
│             │                                    │                       │
│             ▼                                    ▼                       │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    @energismart/shared                           │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │    │
│  │  │  Employees  │  │   Absences  │  │   isEmployeeAvailable() │  │    │
│  │  │  (Ansatte)  │  │   (Fravær)  │  │   (Tilgjengelighet)     │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │    │
│  │                                                                  │    │
│  │  ┌─────────────────────────────────────────────────────────────┐│    │
│  │  │                    Upstash Redis                            ││    │
│  │  │  Assignments │ ServiceVisits │ Absences │ ResourceBlocks    ││    │
│  │  └─────────────────────────────────────────────────────────────┘│    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Datamodell

### 2.1 Delte entiteter (via @energismart/shared)

Disse entitetene er felles for begge apper og lagres i delt Redis:

#### Employee (Ansatt/Tekniker)

```typescript
// Fra @energismart/shared
interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;           // 'technician', 'electrician', 'installer', etc.
  canWorkAs: EmployeeRole[];    // Roller denne personen kan jobbe som
  certifications?: Certification[];  // FSE, Solar Level 1/2, BESS, etc.
  homeAddress?: Address;        // For reisetidsberegning
  phone?: string;
  googleCalendarId?: string;
  active: boolean;
  // ...
}
```

#### Absence (Fravær)

```typescript
// Fra @energismart/shared
interface Absence {
  employeeId: string;
  date: string;               // YYYY-MM-DD
  type: AbsenceType;          // 'vacation' | 'sick' | 'leave'
  source: 'tripletex' | 'manual';
}
```

#### ResourceBlock (Manuell blokkering)

```typescript
// Fra @energismart/shared
interface ResourceBlock {
  id: string;
  employeeId: string;
  date: string;
  reason: string;
  source: BlockingSource;     // 'absence' | 'project' | 'service' | 'manual'
  sourceId?: string;
  sourceApp?: string;         // 'ressursplanlegger' | 'service-management'
  createdAt: string;
}
```

### 2.2 Ressursplanlegger-spesifikke entiteter

Lagres i delt Redis, men "eies" av Ressursplanlegger:

#### Assignment (Prosjekt-tildeling)

```typescript
// Fra @energismart/shared
interface Assignment {
  id: string;
  projectId: string;
  date: string;               // YYYY-MM-DD
  employeeId?: string;
  role: JobType;
  hours: number;
  status: AssignmentStatus;
  // ...
}
```

### 2.3 SMS-spesifikke entiteter

Lagres i delt Redis, "eies" av Service Management System:

#### ServiceVisit (Servicebesøk)

```typescript
// Fra @energismart/shared (type definisjon)
interface ServiceVisit {
  id: string;
  agreementId?: string;       // Serviceavtale-ID
  installationId?: string;    // Installasjon-ID
  customerId?: string;        // Tripletex kunde-ID
  
  // Tidspunkt
  scheduledDate: string;      // YYYY-MM-DD
  scheduledTime?: string;     // HH:MM
  estimatedDuration: number;  // Minutter
  
  // Tildelt tekniker
  technicianId: string;       // Employee ID fra @energismart/shared
  
  // Lokasjon
  address: string;
  postalCode?: string;
  city?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  
  // Status
  status: ServiceVisitStatus;
  
  // Metadata
  visitType: 'inspection' | 'maintenance' | 'repair' | 'emergency';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Utført arbeid
  actualStartTime?: string;
  actualEndTime?: string;
  checklistId?: string;
  
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
}

type ServiceVisitStatus = 
  | 'scheduled'     // Planlagt
  | 'confirmed'     // Bekreftet av kunde
  | 'in_progress'   // Pågår
  | 'completed'     // Fullført
  | 'cancelled'     // Kansellert
  | 'rescheduled';  // Ombooket
```

### 2.4 Redis-nøkler

Allerede definert i `@energismart/shared`:

```typescript
// Service Management spesifikke nøkler
RedisKeys = {
  // ...eksisterende...
  
  // ServiceVisits
  serviceVisit: (id: string) => `service_visit:${id}`,
  serviceVisitsIndex: () => 'index:service_visits',
  serviceVisitsByDate: (date: string) => `index:service_visits:by_date:${date}`,
  serviceVisitsByTechnician: (employeeId: string) => `index:service_visits:by_technician:${employeeId}`,
  serviceVisitsByAgreement: (agreementId: string) => `index:service_visits:by_agreement:${agreementId}`,
  serviceVisitsByStatus: (status: string) => `index:service_visits:by_status:${status}`,
}
```

---

## 3. Tilgjengelighetssjekk

### 3.1 Sentral tilgjengelighetslogikk

`@energismart/shared` inneholder `isEmployeeAvailable()` som sjekker tilgjengelighet på tvers av alle apper:

```typescript
import { isEmployeeAvailable } from '@energismart/shared';

// Sjekk om tekniker er tilgjengelig
const availability = await isEmployeeAvailable(technicianId, '2026-01-28');

if (!availability.available) {
  console.log(`Blokkert av: ${availability.blockedBy}`);
  // 'absence' | 'project' | 'service' | 'manual'
  
  console.log(`Detaljer: ${availability.blockingDetails?.description}`);
  // "Tildelt prosjekt (8 timer)" eller "Servicebesøk planlagt (120 min)"
  
  console.log(`App: ${availability.blockingDetails?.app}`);
  // "ressursplanlegger" eller "service-management"
}
```

### 3.2 Sjekkrekkefølge

Tilgjengelighetssjekken går gjennom i denne rekkefølgen:

```
1. Fravær (absence)
   └─ Ferie, sykdom, permisjon fra Tripletex
   
2. Manuell blokkering (manual)
   └─ Admin-satt blokkering (kurs, møter, etc.)
   
3. Prosjekt-assignment (project)
   └─ Tildelt prosjekt i Ressursplanlegger
   
4. Servicebesøk (service)
   └─ Planlagt servicebesøk i SMS
```

### 3.3 Hente tilgjengelige teknikere

```typescript
import { getAvailableEmployees } from '@energismart/shared';

// Hent alle tilgjengelige teknikere for en dato
const availableTechnicians = await getAvailableEmployees(
  '2026-01-28',
  'technician'  // Filtrer på rolle
);

// Resultat: Employee[] - kun de som er tilgjengelige
```

---

## 4. Planleggingsflyt

### 4.1 Opprett ServiceVisit

```typescript
// src/lib/services/service-visits.ts

import { 
  db, 
  RedisKeys, 
  isEmployeeAvailable,
  wouldCreateConflict 
} from '@energismart/shared';
import { v4 as uuidv4 } from 'uuid';

interface CreateServiceVisitInput {
  agreementId?: string;
  installationId?: string;
  customerId?: string;
  technicianId: string;
  scheduledDate: string;
  scheduledTime?: string;
  estimatedDuration: number;
  address: string;
  postalCode?: string;
  city?: string;
  visitType: ServiceVisit['visitType'];
  priority: ServiceVisit['priority'];
  notes?: string;
}

export async function createServiceVisit(
  input: CreateServiceVisitInput
): Promise<ServiceVisit> {
  // 1. Sjekk tilgjengelighet FØRST
  const conflict = await wouldCreateConflict(
    input.technicianId,
    input.scheduledDate
  );
  
  if (conflict.hasConflict) {
    throw new Error(
      `Tekniker ikke tilgjengelig: ${conflict.conflictDetails?.description} ` +
      `(${conflict.conflictDetails?.app})`
    );
  }
  
  // 2. Opprett servicebesøk
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const visit: ServiceVisit = {
    id,
    ...input,
    status: 'scheduled',
    createdAt: now,
    updatedAt: now,
  };
  
  // 3. Lagre i delt Redis
  await db.set(RedisKeys.serviceVisit(id), visit);
  
  // 4. Oppdater indekser
  await db.sadd(RedisKeys.serviceVisitsIndex(), id);
  await db.sadd(RedisKeys.serviceVisitsByDate(input.scheduledDate), id);
  await db.sadd(RedisKeys.serviceVisitsByTechnician(input.technicianId), id);
  await db.sadd(RedisKeys.serviceVisitsByStatus('scheduled'), id);
  
  if (input.agreementId) {
    await db.sadd(RedisKeys.serviceVisitsByAgreement(input.agreementId), id);
  }
  
  return visit;
}
```

### 4.2 Dataflyt: Booking på tvers av apper

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SCENARIO: Planlegger booker tekniker Ole for servicebesøk 28. januar   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  SMS Planner UI │     │ @energismart/   │     │  Upstash Redis  │
│                 │     │    shared       │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  1. createServiceVisit()                      │
         │─────────────────────────────▶                 │
         │                       │                       │
         │                       │  2. isEmployeeAvailable()
         │                       │──────────────────────▶│
         │                       │                       │
         │                       │  3. Check absence     │
         │                       │◀─────────────────────│
         │                       │                       │
         │                       │  4. Check assignment  │
         │                       │◀─────────────────────│
         │                       │                       │
         │                       │  5. Check service_visit
         │                       │◀─────────────────────│
         │                       │                       │
         │                       │  6. { available: true }
         │◀─────────────────────│                       │
         │                       │                       │
         │  7. Store visit       │                       │
         │─────────────────────────────────────────────▶│
         │                       │                       │
         │  8. Update indexes    │                       │
         │─────────────────────────────────────────────▶│
         │                       │                       │
         │  9. Visit created ✓   │                       │
         │◀──────────────────────────────────────────────│
         │                       │                       │
         
         
┌─────────────────────────────────────────────────────────────────────────┐
│  SENERE: Ressursplanlegger prøver å booke Ole på prosjekt samme dag     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Ressursplanlegger│     │ @energismart/   │     │  Upstash Redis  │
│    UI           │     │    shared       │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  1. createAssignment()│                       │
         │─────────────────────────────▶                 │
         │                       │                       │
         │                       │  2. isEmployeeAvailable()
         │                       │──────────────────────▶│
         │                       │                       │
         │                       │  3. Check absence     │
         │                       │◀─────────────────────│ OK
         │                       │                       │
         │                       │  4. Check assignment  │
         │                       │◀─────────────────────│ OK
         │                       │                       │
         │                       │  5. Check service_visit
         │                       │◀─────────────────────│ BLOCKED!
         │                       │                       │
         │  6. { available: false, blockedBy: 'service' }
         │◀─────────────────────│                       │
         │                       │                       │
         │  7. FEIL: "Ole er booket på servicebesøk"    │
         │◀──────────────────────────────────────────────│
```

---

## 5. Kalendervisning

### 5.1 Daglig oversikt (Planner View)

```typescript
// src/lib/services/scheduler.ts

import {
  getActiveEmployees,
  getEmployeesWhoCanWorkAs,
  checkAvailabilityBatch,
  getAssignmentsByDate,
  getServiceVisitsByDate,
} from '@energismart/shared';

interface DailyScheduleView {
  date: string;
  technicians: TechnicianDayView[];
}

interface TechnicianDayView {
  employee: Employee;
  availability: {
    available: boolean;
    blockedBy?: string;
    blockingDetails?: string;
  };
  serviceVisits: ServiceVisit[];
  projectAssignment?: Assignment;  // Fra Ressursplanlegger
  totalHours: number;
  utilization: number;  // 0-100%
}

export async function getDailySchedule(date: string): Promise<DailyScheduleView> {
  // 1. Hent alle teknikere
  const technicians = await getEmployeesWhoCanWorkAs('technician');
  
  // 2. Sjekk tilgjengelighet for alle
  const availability = await checkAvailabilityBatch(
    technicians.map(t => t.id),
    date
  );
  
  // 3. Hent dagens servicebesøk
  const visits = await getServiceVisitsByDate(date);
  const visitsByTechnician = groupBy(visits, 'technicianId');
  
  // 4. Hent prosjekt-assignments (for å vise i oversikten)
  const assignments = await getAssignmentsByDate(date);
  const assignmentsByEmployee = groupBy(assignments, 'employeeId');
  
  // 5. Bygg visning
  const technicianViews: TechnicianDayView[] = technicians.map(tech => {
    const techAvailability = availability.get(tech.id);
    const techVisits = visitsByTechnician[tech.id] || [];
    const techAssignment = assignmentsByEmployee[tech.id]?.[0];
    
    // Beregn total arbeidstid
    const visitHours = techVisits.reduce((sum, v) => sum + v.estimatedDuration / 60, 0);
    const assignmentHours = techAssignment?.hours || 0;
    const totalHours = visitHours + assignmentHours;
    
    return {
      employee: tech,
      availability: {
        available: techAvailability?.available ?? true,
        blockedBy: techAvailability?.blockedBy,
        blockingDetails: techAvailability?.blockingDetails?.description,
      },
      serviceVisits: techVisits,
      projectAssignment: techAssignment,
      totalHours,
      utilization: Math.round((totalHours / 8) * 100),  // Anta 8-timers dag
    };
  });
  
  return {
    date,
    technicians: technicianViews,
  };
}
```

### 5.2 UI-komponent for kalender

```tsx
// src/components/scheduler/DailyCalendar.tsx

'use client';

import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { nb } from 'date-fns/locale';

interface DailyCalendarProps {
  initialDate?: Date;
}

export function DailyCalendar({ initialDate = new Date() }: DailyCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [schedule, setSchedule] = useState<DailyScheduleView | null>(null);
  
  // Hent data når dato endres
  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    fetch(`/api/scheduler/daily?date=${dateStr}`)
      .then(res => res.json())
      .then(data => setSchedule(data));
  }, [selectedDate]);
  
  return (
    <div className="space-y-4">
      {/* Dato-velger */}
      <div className="flex items-center gap-4">
        <Button onClick={() => setSelectedDate(d => addDays(d, -1))}>
          Forrige dag
        </Button>
        <h2 className="text-xl font-semibold">
          {format(selectedDate, 'EEEE d. MMMM yyyy', { locale: nb })}
        </h2>
        <Button onClick={() => setSelectedDate(d => addDays(d, 1))}>
          Neste dag
        </Button>
      </div>
      
      {/* Tekniker-liste */}
      <div className="grid gap-4">
        {schedule?.technicians.map(tech => (
          <TechnicianDayCard
            key={tech.employee.id}
            technician={tech}
            onBookVisit={() => {/* Åpne booking-dialog */}}
          />
        ))}
      </div>
    </div>
  );
}

function TechnicianDayCard({ technician, onBookVisit }) {
  const { employee, availability, serviceVisits, projectAssignment, utilization } = technician;
  
  return (
    <Card className={cn(
      "p-4",
      !availability.available && "opacity-60 bg-gray-100"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={employee.avatarUrl} />
            <AvatarFallback>{employee.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{employee.name}</h3>
            <p className="text-sm text-muted-foreground">
              {employee.role} • {utilization}% kapasitet
            </p>
          </div>
        </div>
        
        {/* Status-indikator */}
        {!availability.available && (
          <Badge variant="destructive">
            {availability.blockedBy === 'project' && 'På prosjekt'}
            {availability.blockedBy === 'service' && 'Servicebesøk'}
            {availability.blockedBy === 'absence' && 'Fravær'}
          </Badge>
        )}
      </div>
      
      {/* Dagens oppgaver */}
      <div className="mt-4 space-y-2">
        {/* Prosjekt fra Ressursplanlegger */}
        {projectAssignment && (
          <div className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded">
            <Building className="h-4 w-4 text-blue-600" />
            <span>Prosjekt: {projectAssignment.hours} timer</span>
            <Badge variant="outline" className="text-xs">Ressursplanlegger</Badge>
          </div>
        )}
        
        {/* Servicebesøk */}
        {serviceVisits.map(visit => (
          <div key={visit.id} className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded">
            <Wrench className="h-4 w-4 text-green-600" />
            <span>
              {visit.scheduledTime} - {visit.address}
              ({visit.estimatedDuration} min)
            </span>
          </div>
        ))}
        
        {/* Book ny */}
        {availability.available && (
          <Button variant="outline" size="sm" onClick={onBookVisit}>
            + Legg til servicebesøk
          </Button>
        )}
      </div>
    </Card>
  );
}
```

---

## 6. Ruteoptimering

### 6.1 Optimeringsalgoritme

```typescript
// src/lib/services/route-optimizer.ts

import { getActiveEmployees, checkAvailabilityBatch } from '@energismart/shared';

interface OptimizationInput {
  date: string;
  unassignedVisits: ServiceVisit[];
  fixedAssignments?: Map<string, string>;  // visitId -> technicianId
}

interface OptimizationResult {
  assignments: {
    visitId: string;
    technicianId: string;
    estimatedArrival: string;
    travelTimeMinutes: number;
  }[];
  unassigned: string[];  // Visits som ikke kunne tildeles
  totalTravelTime: number;
  metrics: {
    visitsPerTechnician: Map<string, number>;
    avgTravelTime: number;
  };
}

export async function optimizeRoutes(
  input: OptimizationInput
): Promise<OptimizationResult> {
  const { date, unassignedVisits, fixedAssignments } = input;
  
  // 1. Hent tilgjengelige teknikere
  const technicians = await getEmployeesWhoCanWorkAs('technician');
  const availability = await checkAvailabilityBatch(
    technicians.map(t => t.id),
    date
  );
  
  const availableTechnicians = technicians.filter(t => 
    availability.get(t.id)?.available
  );
  
  if (availableTechnicians.length === 0) {
    return {
      assignments: [],
      unassigned: unassignedVisits.map(v => v.id),
      totalTravelTime: 0,
      metrics: { visitsPerTechnician: new Map(), avgTravelTime: 0 },
    };
  }
  
  // 2. Beregn avstandsmatrise (Google Distance Matrix API)
  const locations = [
    ...availableTechnicians.map(t => t.homeAddress),
    ...unassignedVisits.map(v => ({ 
      street: v.address, 
      postalCode: v.postalCode, 
      city: v.city 
    })),
  ].filter(Boolean);
  
  const distanceMatrix = await calculateDistanceMatrix(locations);
  
  // 3. Kjør optimering (greedy nearest-neighbor med forbedringer)
  const assignments = greedyRouteAssignment(
    availableTechnicians,
    unassignedVisits,
    distanceMatrix,
    fixedAssignments
  );
  
  return assignments;
}

function greedyRouteAssignment(
  technicians: Employee[],
  visits: ServiceVisit[],
  distances: DistanceMatrix,
  fixed?: Map<string, string>
): OptimizationResult {
  const assignments: OptimizationResult['assignments'] = [];
  const technicianSchedules = new Map<string, ScheduleSlot[]>();
  const unassigned: string[] = [];
  
  // Initialiser tekniker-schedules
  for (const tech of technicians) {
    technicianSchedules.set(tech.id, [{
      start: '08:00',
      end: '16:00',
      location: tech.homeAddress,
    }]);
  }
  
  // Sorter besøk etter prioritet
  const sortedVisits = [...visits].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  // Tildel hvert besøk
  for (const visit of sortedVisits) {
    // Sjekk om allerede tildelt (fast tildeling)
    if (fixed?.has(visit.id)) {
      const techId = fixed.get(visit.id)!;
      // Valider at tekniker er tilgjengelig og legg til
      // ...
      continue;
    }
    
    // Finn beste tekniker basert på:
    // 1. Korteste reisetid fra forrige lokasjon
    // 2. Sertifiseringer
    // 3. Kapasitet
    
    let bestTech: Employee | null = null;
    let bestTravelTime = Infinity;
    
    for (const tech of technicians) {
      const schedule = technicianSchedules.get(tech.id)!;
      const lastLocation = schedule[schedule.length - 1].location;
      
      const travelTime = distances.get(
        locationKey(lastLocation),
        locationKey({ street: visit.address, postalCode: visit.postalCode, city: visit.city })
      );
      
      // Sjekk om det er tid igjen
      const availableTime = calculateAvailableTime(schedule, visit.estimatedDuration, travelTime);
      
      if (availableTime && travelTime < bestTravelTime) {
        bestTech = tech;
        bestTravelTime = travelTime;
      }
    }
    
    if (bestTech) {
      assignments.push({
        visitId: visit.id,
        technicianId: bestTech.id,
        estimatedArrival: calculateArrivalTime(
          technicianSchedules.get(bestTech.id)!,
          bestTravelTime
        ),
        travelTimeMinutes: bestTravelTime,
      });
      
      // Oppdater tekniker-schedule
      // ...
    } else {
      unassigned.push(visit.id);
    }
  }
  
  return {
    assignments,
    unassigned,
    totalTravelTime: assignments.reduce((sum, a) => sum + a.travelTimeMinutes, 0),
    metrics: {
      visitsPerTechnician: countPerTechnician(assignments),
      avgTravelTime: assignments.length > 0 
        ? assignments.reduce((sum, a) => sum + a.travelTimeMinutes, 0) / assignments.length
        : 0,
    },
  };
}
```

### 6.2 Optimeringskriterier

Fra kravspesifikasjonen (prioritert rekkefølge):

```typescript
const OPTIMIZATION_WEIGHTS = {
  slaCompliance: 100,        // SLA-forpliktelser (kritiske kunder først)
  minimizeTravelTime: 50,    // Minimer total kjøretid
  technicianMatch: 30,       // Tekniker-kompetanse match
  customerPreferences: 20,   // Kundepreferanser
  minimizeOvertime: 15,      // Minimer overtid
  evenDistribution: 10,      // Jevn arbeidsfordeling
};
```

---

## 7. API-design

### 7.1 Scheduler API-ruter

```typescript
// src/app/api/scheduler/routes.ts

// GET /api/scheduler/daily?date=2026-01-28
// Hent daglig oversikt for alle teknikere
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');
  const schedule = await getDailySchedule(date);
  return NextResponse.json(schedule);
}

// GET /api/scheduler/available?date=2026-01-28&role=technician
// Hent tilgjengelige ressurser
export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');
  const role = request.nextUrl.searchParams.get('role');
  const available = await getAvailableEmployees(date, role);
  return NextResponse.json(available);
}

// POST /api/scheduler/optimize
// Kjør ruteoptimering
export async function POST(request: NextRequest) {
  const { date, visitIds } = await request.json();
  const visits = await getServiceVisitsByIds(visitIds);
  const result = await optimizeRoutes({ date, unassignedVisits: visits });
  return NextResponse.json(result);
}

// POST /api/service-visits
// Opprett nytt servicebesøk
export async function POST(request: NextRequest) {
  const input = await request.json();
  
  // Validering med Zod
  const validated = CreateServiceVisitSchema.parse(input);
  
  // Opprett besøk (inkluderer tilgjengelighetssjekk)
  const visit = await createServiceVisit(validated);
  
  return NextResponse.json({ success: true, data: visit });
}

// PATCH /api/service-visits/[id]
// Oppdater servicebesøk (inkl. omplanlegging)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const updates = await request.json();
  
  // Hvis dato/tekniker endres, sjekk tilgjengelighet
  if (updates.scheduledDate || updates.technicianId) {
    const conflict = await wouldCreateConflict(
      updates.technicianId || existingVisit.technicianId,
      updates.scheduledDate || existingVisit.scheduledDate,
      params.id  // Ekskluder denne bookingen fra konfliktsjekk
    );
    
    if (conflict.hasConflict) {
      return NextResponse.json(
        { success: false, error: 'Tekniker ikke tilgjengelig' },
        { status: 409 }
      );
    }
  }
  
  const updated = await updateServiceVisit(params.id, updates);
  return NextResponse.json({ success: true, data: updated });
}
```

---

## 8. Varsler og notifikasjoner

### 8.1 Konflikt-varsler

Når det oppstår potensielle konflikter, send varsler:

```typescript
// src/lib/services/scheduler-notifications.ts

interface ConflictAlert {
  type: 'resource_conflict' | 'overbooking' | 'sla_breach';
  employeeId: string;
  date: string;
  apps: string[];  // ['ressursplanlegger', 'service-management']
  message: string;
}

export async function checkAndNotifyConflicts(date: string): Promise<void> {
  const technicians = await getEmployeesWhoCanWorkAs('technician');
  
  for (const tech of technicians) {
    // Hent bookinger fra begge apper
    const assignments = await getAssignmentsByDateAndEmployee(date, tech.id);
    const visits = await getServiceVisitsByDateAndEmployee(date, tech.id);
    
    // Sjekk for overlappende bookinger
    const totalHours = 
      assignments.reduce((sum, a) => sum + a.hours, 0) +
      visits.reduce((sum, v) => sum + v.estimatedDuration / 60, 0);
    
    if (totalHours > 8) {
      await sendAlert({
        type: 'overbooking',
        employeeId: tech.id,
        date,
        apps: ['ressursplanlegger', 'service-management'],
        message: `${tech.name} er booket ${totalHours} timer den ${date} (maks 8)`,
      });
    }
  }
}
```

---

## 9. Implementeringsrekkefølge

### Fase 1: Grunnleggende planlegging (Uke 1-2)

1. ✅ Installer `@energismart/shared` fra GitHub
2. ⬜ Opprett ServiceVisit CRUD-operasjoner
3. ⬜ Implementer daglig kalendervisning
4. ⬜ Legg til tilgjengelighetssjekk ved booking

### Fase 2: Avansert planlegging (Uke 3-4)

1. ⬜ Integrer Google Distance Matrix API
2. ⬜ Implementer grunnleggende ruteoptimering
3. ⬜ Legg til drag-and-drop i kalender
4. ⬜ Implementer automatisk re-optimering

### Fase 3: Integrering og varsler (Uke 5-6)

1. ⬜ Synkroniser med Google Calendar
2. ⬜ Implementer konflikt-varsler
3. ⬜ Legg til notifikasjoner til teknikere
4. ⬜ Dashboard med kapasitetsvisning

---

## 10. Testing

### 10.1 Integrasjonstester

```typescript
// src/__tests__/scheduler/availability.test.ts

describe('Cross-app availability', () => {
  it('should block technician booked in Ressursplanlegger', async () => {
    // Setup: Opprett assignment i Ressursplanlegger
    await createAssignment({
      projectId: 'project-1',
      employeeId: 'tech-1',
      date: '2026-01-28',
      role: 'electrician',
      hours: 8,
    });
    
    // Test: Prøv å booke samme tekniker i SMS
    await expect(
      createServiceVisit({
        technicianId: 'tech-1',
        scheduledDate: '2026-01-28',
        // ...
      })
    ).rejects.toThrow('Tekniker ikke tilgjengelig');
  });
  
  it('should block technician with service visit from project assignment', async () => {
    // Setup: Opprett servicebesøk først
    await createServiceVisit({
      technicianId: 'tech-1',
      scheduledDate: '2026-01-28',
      estimatedDuration: 480,  // Hel dag
      // ...
    });
    
    // Test: Prøv å opprette assignment i Ressursplanlegger
    const availability = await isEmployeeAvailable('tech-1', '2026-01-28');
    
    expect(availability.available).toBe(false);
    expect(availability.blockedBy).toBe('service');
    expect(availability.blockingDetails?.app).toBe('service-management');
  });
});
```

---

## 11. Vedlegg

### A. Miljøvariabler for SMS

```env
# ===========================================
# DELT INFRASTRUKTUR (samme som Ressursplanlegger)
# ===========================================
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
AUTH_SECRET=xxx

# ===========================================
# SMS-SPESIFIKK
# ===========================================
DATABASE_URL=postgresql://xxx
GOOGLE_MAPS_API_KEY=xxx
TRIPLETEX_CONSUMER_TOKEN=xxx
```

### B. Referanser

- `@energismart/shared`: https://github.com/PhotonicStack-scs/energismart-shared
- Ressursplanlegger: Eksisterende kodebase
- Kravspesifikasjon: `EnergiSmart_Service_Management_System_Requirements.md`
