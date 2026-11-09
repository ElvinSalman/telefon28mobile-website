# Production repair checkpoint — 9 November 2026

Baseline: 39ddf3d, backup branch codex/backup-before-production-repair-20261109.

Confirmed live root cause: source_verified_at with +00:00 rejected by z.iso.datetime; same record with Z succeeds. Stable ID and slug matched. No real product fields lost.

Implemented locally: read-only audit separation, ID updates with affected-row/concurrency checks, safe JSON errors, grouped product editor, inline brands, initial photo flow, independent photo actions, durable cleanup, six-column transactional import, actual trade-in counts, honest missing-photo fallback.

Local acceptance: 21 passed, 1 production-only skipped before final template/concurrency coverage additions. Production has NOT been updated yet. Migration 202611090002_simple_import.sql applied locally; hosted application pending local final test and authorized push. User authorized necessary migration work. Preserve all production inventory and accounts.

Next: finish lint/typecheck + local suite; test rollback in a transaction; apply hosted migration; commit/push existing main and deploy existing Vercel project; run scripts/verify-hosted.mjs (ephemeral QA users), including safe Xiaomi name/price edit/restoration; verify deployment SHA; complete acceptance report and AZ owner guide.

Separate owner email confirmed by user: Kamranshohretli@icloud.com. Private terminal provisioning prepared; owner must enter a private password. Existing admin password/account untouched. Do not run any earlier bootstrap/reset helper.

Final local run: 21 passed, 1 intentionally skipped (hosted Xiaomi regression); lint and TypeScript/build pass. Tested rollback disables new RPC grants inside a transaction and ROLLBACK restores them. Authorized migration applied hosted; CLI catalog-cache warning is non-fatal, confirm migration list. Production release/acceptance is next. Owner guide: OWNER_GUIDE_AZ.md.
