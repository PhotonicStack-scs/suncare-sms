# Integrasjonsguide for EnergiSmart-apper

Denne guiden beskriver hvordan nye apper (som Suncare) kan integrere med den delte plattformen.

## Oversikt

Alle EnergiSmart-apper deler:
- **Upstash Redis** - Felles database for ansatte, bookinger, brukere
- **Google OAuth** - Samme autentiseringsklient
- **@energismart/shared** - NPM-pakke med typer og database-funksjoner

## Komme i gang

### 1. Installer den delte pakken

```bash
npm install @energismart/shared
```

Eller for lokal utvikling med workspace:

```json
// package.json
{
  "dependencies": {
    "@energismart/shared": "workspace:*"
  }
}
```

### 2. Konfigurer miljøvariabler

```env
# ==========================================
# DELT INFRASTRUKTUR (identisk i alle apper)
# ==========================================

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
AUTH_SECRET=xxx

# ==========================================
# APP-SPESIFIKK
# ==========================================

# Suncare-spesifikk
DATABASE_URL=postgresql://...  # For serviceavtaler, sjekklister, etc.
NEXTAUTH_URL=https://suncare.energismart.no
```

### 3. Legg til redirect URI i Google Cloud Console

Gå til [Google Cloud Console](https://console.cloud.google.com/apis/credentials) og legg til:

```
https://din-app.energismart.no/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

## Autentisering

### Sett opp NextAuth

```typescript
// src/lib/auth.ts
import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getOrCreateSystemUser } from '@energismart/shared';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        // Hent eller opprett bruker i delt database
        const systemUser = await getOrCreateSystemUser({
          id: token.sub || '',
          email: user.email!,
          name: user.name || '',
          image: user.image || undefined,
        });
        
        token.globalRole = systemUser.globalRole;
        token.appAccess = systemUser.appAccess;
        token.employeeId = systemUser.employeeId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.globalRole = token.globalRole;
        session.user.appAccess = token.appAccess;
        session.user.employeeId = token.employeeId;
      }
      return session;
    },
  },
};
```

### Sjekk tilgang

```typescript
import { hasAppAccess, getAppPermissions, hasPermission } from '@energismart/shared';

// I en API-rute eller Server Component
const session = await getServerSession(authOptions);
const user = await getSystemUserByEmail(session?.user?.email);

if (!user || !hasAppAccess(user, 'suncare')) {
  return NextResponse.json({ error: 'Ingen tilgang' }, { status: 403 });
}

// Sjekk spesifikke permissions
if (!hasPermission(user, 'service:write')) {
  return NextResponse.json({ error: 'Mangler skriverettigheter' }, { status: 403 });
}
```

## Tilgjengelighetssjekk

Før du booker en ressurs, **ALLTID** sjekk tilgjengelighet:

```typescript
import { isEmployeeAvailable, wouldCreateConflict } from '@energismart/shared';

// Enkel sjekk
const availability = await isEmployeeAvailable(employeeId, date);
if (!availability.available) {
  throw new Error(`Ressurs ikke tilgjengelig: ${availability.blockingDetails?.description}`);
}

// Sjekk konflikt før opprettelse
const conflict = await wouldCreateConflict(employeeId, date);
if (conflict.hasConflict) {
  throw new Error(`Ville skapt konflikt med: ${conflict.conflictDetails?.app}`);
}
```

## Opprette ServiceVisit (Suncare)

```typescript
import { db, RedisKeys } from '@energismart/shared';
import { v4 as uuidv4 } from 'uuid';

async function createServiceVisit(input: CreateServiceVisitInput): Promise<ServiceVisit> {
  // 1. Sjekk tilgjengelighet først
  const availability = await isEmployeeAvailable(input.technicianId, input.scheduledDate);
  if (!availability.available) {
    throw new Error(`Tekniker ikke tilgjengelig: ${availability.blockingDetails?.description}`);
  }
  
  // 2. Opprett servicebesøk
  const id = uuidv4();
  const visit: ServiceVisit = {
    id,
    ...input,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // 3. Lagre i delt Redis
  await db.set(RedisKeys.serviceVisit(id), visit);
  await db.sadd(RedisKeys.serviceVisitsIndex(), id);
  await db.sadd(RedisKeys.serviceVisitsByDate(input.scheduledDate), id);
  await db.sadd(RedisKeys.serviceVisitsByTechnician(input.technicianId), id);
  
  return visit;
}
```

## Hente ansatte

```typescript
import { 
  getActiveEmployees, 
  getEmployeesWhoCanWorkAs,
  getAvailableEmployees 
} from '@energismart/shared';

// Alle aktive ansatte
const employees = await getActiveEmployees();

// Kun serviceteknikere
const technicians = await getEmployeesWhoCanWorkAs('technician');

// Tilgjengelige teknikere for en dato
const availableTechnicians = await getAvailableEmployees('2026-01-24', 'technician');
```

## Datamodell

### Delte entiteter (i Redis)

| Entitet | Beskrivelse | RedisKey |
|---------|-------------|----------|
| Employee | Ansatt/ressurs | `employee:{id}` |
| Assignment | Prosjekt-booking | `assignment:{id}` |
| ServiceVisit | Servicebesøk | `service_visit:{id}` |
| SystemUser | Innlogget bruker | `system_user:{id}` |
| Absence | Fravær | `absence:{employeeId}:{date}` |
| ResourceBlock | Manuell blokkering | `resource_block:{employeeId}:{date}` |

### App-spesifikk data

Suncare bør bruke PostgreSQL for:
- Serviceavtaler (ServiceAgreement)
- Installasjoner (Installation)
- Sjekklister (Checklist)
- Rapporter (ServiceReport)

## Migrations

Hvis du trenger å migrere eksisterende SystemUser til ny struktur:

```typescript
import { getAllSystemUsers, updateSystemUser } from '@energismart/shared';

async function migrateUsersToMultiApp() {
  const users = await getAllSystemUsers();
  
  for (const user of users) {
    // Sjekk om bruker har gammel struktur
    if (!user.globalRole) {
      await updateSystemUser(user.id, {
        globalRole: 'employee',
        appAccess: {
          suncare: { role: 'viewer' },
        },
      });
    }
  }
}
```

## Feilsøking

### Redis-tilkobling feiler

```typescript
// Sjekk at miljøvariabler er satt
console.log('Redis URL:', process.env.UPSTASH_REDIS_REST_URL ? 'SET' : 'MISSING');
console.log('Redis Token:', process.env.UPSTASH_REDIS_REST_TOKEN ? 'SET' : 'MISSING');
```

### Bruker får ikke tilgang

```typescript
import { getSystemUserByEmail, hasAppAccess } from '@energismart/shared';

const user = await getSystemUserByEmail('user@example.com');
console.log('User:', user);
console.log('Has Suncare access:', hasAppAccess(user, 'suncare'));
console.log('App access:', user?.appAccess);
```

### Tilgjengelighetssjekk gir uventet resultat

```typescript
import { isEmployeeAvailable } from '@energismart/shared';

const result = await isEmployeeAvailable('emp-123', '2026-01-24');
console.log('Availability result:', JSON.stringify(result, null, 2));
```

## Støtte

Kontakt utviklingsteamet for hjelp med integrasjon.
