import { ReportsClient } from '@/components/reports/reports-client'
import { getReportSummary } from '@/server/reports'

export default async function ReportsPage() {
  const summary = await getReportSummary({})
  return <ReportsClient initialSummary={summary} />
}

