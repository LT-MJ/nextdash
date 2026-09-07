# Scheduled jobs

Long-running or periodic work never runs inside a normal page request
(spec §56/§86). This build's mechanism is one endpoint:

```
POST /api/cron
Authorization: Bearer <CRON_SECRET>
```

It runs (wrapped in a `BackgroundJob` row, visible at `/admin/jobs`):

1. `processIndexingQueue()` — submits any `PENDING` `IndexingQueueItem`
   rows to IndexNow.
2. Data-retention pruning: resolved `NotFoundLog` entries older than 90
   days, processed `IndexingQueueItem` rows older than 30 days,
   `ActivityLog` entries older than 365 days, finished `BackgroundJob` rows
   older than 90 days. These windows are constants in
   `src/app/api/cron/route.ts` — there's no admin UI to configure them yet.

## Wiring up a scheduler

Pick whichever your deployment platform supports:

- **Vercel Cron**: add a `crons` entry in `vercel.json` pointing at
  `/api/cron`, and set the `Authorization` header via Vercel's cron secret
  support (or have the cron job read `CRON_SECRET` from the same
  environment and construct the header).
- **GitHub Actions**: a `schedule:` trigger workflow that does
  `curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://yoursite/api/cron`.
- **Self-hosted**: a plain `cron` entry running the same `curl` command.

Never call this endpoint from client-side code or expose `CRON_SECRET` to
the browser.

## Extending it

`runBackgroundJob(type, initiatedBy, task)` in
`src/lib/server/background-jobs.ts` is the pattern for adding more
scheduled work (a full site audit on a schedule, broken-link checking,
stale-content detection, analytics sync once a real GA/GSC client exists) —
wrap the task in it and it shows up in the jobs dashboard automatically,
with failures captured instead of silently swallowed.
