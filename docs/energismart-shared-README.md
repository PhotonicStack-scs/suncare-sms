# @energismart/shared

Delte typer, database-funksjoner og autentisering for alle EnergiSmart-apper.

## Installasjon

Installer direkte fra GitHub:

```bash
npm install github:DIN-ORG/energismart-shared#main
```

Eller i `package.json`:

```json
{
  "dependencies": {
    "@energismart/shared": "github:DIN-ORG/energismart-shared#main"
  }
}
```

> **Merk:** Bytt ut `DIN-ORG` med ditt GitHub-brukernavn eller organisasjonsnavn.

### For CI/CD (GitHub Actions)

Legg til i workflow:

```yaml
- name: Install dependencies
  run: npm install
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Miljøvariabler

Alle apper som bruker denne pakken må ha følgende miljøvariabler:

```env
# Redis (PÅKREVD)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Google OAuth (for autentisering)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
AUTH_SECRET=xxx
```

## Bruk

### Importere typer

```typescript
import type { 
  Employee, 
  Assignment, 
  SystemUser,
  Permission 
} from '@energismart/shared';
```

### Database-operasjoner

```typescript
import { 
  getEmployee, 
  createAssignment,
  isEmployeeAvailable 
} from '@energismart/shared';

// Hent en ansatt
const employee = await getEmployee('employee-id');

// Sjekk tilgjengelighet (på tvers av alle apper)
const availability = await isEmployeeAvailable('employee-id', '2026-01-24');
if (!availability.available) {
  console.log(`Blokkert av: ${availability.blockedBy}`);
}
```

### Autentisering

```typescript
import { 
  hasPermission, 
  hasAppAccess,
  getAppPermissions 
} from '@energismart/shared';

if (hasPermission(user, 'projects:write')) {
  // Bruker kan skrive til prosjekter
}

if (hasAppAccess(user, 'suncare')) {
  // Bruker har tilgang til Suncare
}
```

## Arkitektur

```
@energismart/shared
├── types/           # TypeScript-typer
│   ├── common.ts    # Adresse, API-respons, Fravær
│   ├── employee.ts  # Ansatt, Team, Roller
│   ├── assignment.ts # Assignments, ServiceVisit
│   └── auth.ts      # SystemUser, Permissions
├── db/              # Database-operasjoner
│   ├── redis.ts     # RedisKeys, RedisDB
│   ├── employees.ts # Ansatt CRUD
│   ├── assignments.ts # Assignment CRUD
│   ├── users.ts     # SystemUser CRUD
│   └── availability.ts # Tilgjengelighetssjekk
└── auth/            # Auth-hjelpere
```

## Utvikling

```bash
# Installer dependencies
npm install

# Bygg pakken
npm run build

# Watch-modus
npm run dev
```

## Oppdatere pakken i andre prosjekter

Etter at du har pushet endringer til GitHub:

```bash
npm update @energismart/shared
```

Eller for å tvinge reinstallasjon:

```bash
npm install github:DIN-ORG/energismart-shared#main --force
```

## Lisens

Proprietær - EnergiSmart Norge AS
