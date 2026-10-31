# Project memory

## Product intent & audience

- Spanish-language web app with database integration (Supabase inferred from migration files and RLS policies)
- App designed for use without sign-in/authentication (anonymous/public access)
- Displays country-based data (country list with codes like `SH`)

## Brand personality & voice

- User communicates in Spanish; responses should be in Spanish to match

## Visual design & UX direction

- Must never show a blank/empty screen on errors — surface visible error messages to users
- Error states should be clear and actionable, not silent failures

## Decisions, constraints & rationale

- **Tech stack:** Vite + React + JSX + Tailwind CSS + Lucide React icons (per `.bolt/prompt`)
- **Path alias:** `@/` maps to `src/`
- **Database:** Supabase with RLS policies configured for public access (no auth)
- **Critical issue found:** Project lacks database connection config file (no `.env`), causing all data fetches to fail silently → blank page
- **Fix applied:** Data loader modified to surface errors visibly instead of swallowing them; project compiles successfully
- **Duplicate key:** `SH` country code appears as a duplicate key in the country list — compiler warns but doesn't break functionality; pending fix
- **DB status unconfirmed:** All database query attempts returned "database already set up" error; tables, data, and permissions could not be verified

## Open questions & assumptions

- Database connection configuration (`.env` or equivalent) needs to be created/restored — user must provide credentials or confirm setup
- Once connection is restored, database tables/data/permissions need verification
- Duplicate `SH` key in country list should be corrected (likely one entry should be a different country code)
- Assumption: silent error swallowing was the only cause of the blank screen; may be additional issues once DB is connected