# Suncare - EnergiSmart Service Management System

A comprehensive service management system for EnergiSmart Norge AS, handling the entire lifecycle of service agreements for solar panel installations and battery systems (BESS).

## Features

- **Service Agreements** - Create, manage, and track service agreements with flexible pricing models and add-on products
- **Service Planning** - Schedule and assign service visits with calendar views and technician management
- **Digital Checklists** - Complete inspections with customizable templates, photo documentation, and offline support
- **AI Reports** - Generate professional service reports automatically using Google Gemini AI
- **Tripletex Integration** - Sync customers and create invoices directly in Tripletex
- **PWA Support** - Install as a native app on mobile devices with offline capabilities
- **Dark/Light Mode** - Full theme support with system preference detection

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **API**: [tRPC](https://trpc.io/) for type-safe APIs
- **Auth**: [@energismart/shared](https://github.com/PhotonicStack-scs/energismart-shared) (Google OAuth)
- **AI**: Google Gemini API
- **Integrations**: Tripletex API

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/suncare.git
cd suncare
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment file and configure:
```bash
cp .env.example .env
```

4. Set up the database:
```bash
npx prisma db push
npx prisma generate
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/suncare"

# @energismart/shared - Authentication
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxx"
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxx"
AUTH_SECRET="your-auth-secret"

# Tripletex API
TRIPLETEX_CONSUMER_TOKEN="your-consumer-token"
TRIPLETEX_EMPLOYEE_TOKEN="your-employee-token"
TRIPLETEX_API_BASE_URL="https://tripletex.no/v2"

# Google Gemini AI (optional)
GEMINI_API_KEY="your-gemini-api-key"
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:generate` | Generate Prisma client |

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Protected routes (dashboard, agreements, etc.)
│   ├── (public)/            # Public routes (login)
│   ├── api/                 # API routes
│   └── layout.tsx           # Root layout with providers
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # Shell components (AppShell, Sidebar, Header)
│   └── features/            # Feature-specific components
│       ├── dashboard/       # Dashboard widgets
│       ├── agreements/      # Agreement management
│       ├── planning/        # Service planning
│       ├── checklists/      # Digital checklists
│       └── reports/         # Report generation
├── lib/
│   ├── tripletex/           # Tripletex API adapter
│   ├── gemini/              # Google Gemini AI adapter
│   ├── theme.ts             # Theme context and hooks
│   └── utils.ts             # Utility functions
├── server/
│   ├── api/routers/         # tRPC routers
│   ├── services/            # Business logic services
│   ├── auth.ts              # Auth utilities
│   └── db.ts                # Prisma client
├── types/                   # TypeScript type definitions
├── data/                    # Sample data and templates
└── hooks/                   # Custom React hooks
```

## Key Modules

### Service Agreements
- Create agreements with wizard interface
- Configure add-on products from catalog
- Automatic price calculation based on system size and SLA level
- Track agreement status and renewals

### Service Planning
- Calendar view for scheduling visits
- Technician availability checking via @energismart/shared
- Visit status tracking (Scheduled, In Progress, Completed, etc.)

### Digital Checklists
- Pre-built templates for solar panel and BESS inspections
- Multiple input types (Yes/No, Numeric, Text, Photos, Signatures)
- Severity classification for findings
- Offline support via PWA

### AI Reports
- Generate professional reports from checklist data
- Norwegian language support
- Structured findings and recommendations
- PDF generation ready

### Tripletex Integration
- Customer data sync (read-only from Tripletex)
- Invoice creation for completed service visits
- Product catalog sync for pricing

## Code Conventions

- **Language**: All code in English (UI text in Norwegian)
- **Components**: PascalCase (`ServiceAgreementCard.tsx`)
- **Hooks**: camelCase with "use" prefix (`useServiceAgreements.ts`)
- **Utils**: camelCase (`formatCurrency.ts`)
- **Server Components**: Default for all pages
- **Client Components**: Only when needed for interactivity

## Git Workflow

We follow a feature branch strategy:

```
main (always deployable)
  ├── feature/new-feature
  ├── fix/bug-fix
  └── experiment/try-new-approach
```

1. Create feature branch from `main`
2. Make changes and commit frequently
3. Merge to `main` when complete and tested

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting and type checking
5. Submit a pull request

## License

Proprietary - EnergiSmart Norge AS

---

Built with ⚡ by EnergiSmart
