Implement a modern dashboard UI with a left navigation sidebar and a main content area. The main area contains a header (page title, utility icons, global search), a row of three KPI cards, a mid section with two large cards (left: recommendation/progress + featured agreement preview; right: key metric + segmented view toggle + actions + monthly chart), and a data table card with a toolbar (search + filters + import/export) and rows with status pills and pagination. Provide both dark and light themes using the same layout and hierarchy; only neutrals change between modes while the primary highlight color remains consistent. Use the primary color strictly for the main CTA, key chart highlight, and small emphasis indicators; rely on neutral surfaces and restrained secondary semantic colors for statuses.

Token rules + usage:

- Use the primary token for emphasis sparingly; never for large backgrounds except small accents/glows.
- Use neutral surface tokens for all containers and separators; maintain subtle borders and soft elevation.
- Use semantic status tokens (success/info/warning/danger) only for pills/chips and small indicators.
- Keep typography hierarchy consistent: small labels, bold values, muted helper text.
- Ensure responsive behavior: sidebar collapses on small screens; KPI cards and mid cards stack; table becomes row-cards on mobile.
