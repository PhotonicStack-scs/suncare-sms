# Code Conventions

## Naming
- All code in English (UI text in Norwegian)
- Components: PascalCase (ServiceAgreementCard.tsx)
- Hooks: camelCase with "use" prefix (useServiceAgreements.ts)
- Utils: camelCase (formatCurrency.ts)

## Patterns
- Use server components by default
- Client components only when needed (interactivity)
- All data fetching through tRPC
- Tripletex customer data is READ-ONLY

## File Templates
### API Route
export async function GET(request: Request) { ... }

### tRPC Router
export const agreementRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => { ... }),
});