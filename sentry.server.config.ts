import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || undefined,
  tracesSampleRate: 0.1,
  enabled: Boolean(process.env.SENTRY_DSN),
});

