# Project Scaffold

## Directory Structure
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth-required routes
│   ├── (public)/          # Public routes
│   ├── api/               # API routes
│   └── layout.tsx
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── forms/             # Form components
│   └── features/          # Feature-specific components
├── lib/
│   ├── db/                # Prisma client & queries
│   ├── trpc/              # tRPC setup
│   ├── tripletex/         # Tripletex API client
│   └── utils/             # Utilities
├── types/                 # Shared TypeScript types
└── hooks/                 # Custom React hooks

## Key Patterns
- All database queries go through lib/db/
- All external APIs have adapter classes in lib/
- Feature components are self-contained