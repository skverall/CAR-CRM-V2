import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Uzbek only, no i18n routing needed
const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
  silent: true,
});
