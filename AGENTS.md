<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Repo Workflow

- Work from `develop` for review/fix cycles.
- Run `pnpm verify` before considering changes complete.
- Run `pnpm test:e2e --project=chromium` for UI, auth, voting, or admin flow changes.
- If `node_modules/next/dist/docs/` is unavailable in this installed Next package, rely on local Next 16 types/build warnings and verify with `pnpm build` before changing framework conventions.
- Keep Supabase schema changes mirrored in `supabase/*.sql` and mention any manual production migration needed.
