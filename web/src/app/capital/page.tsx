import { CapitalClient } from '@/components/capital/capital-client'
import { listCapitalAccounts, listCapitalTransactions } from '@/server/capital'

export default async function CapitalPage() {
  const [accounts, transactions] = await Promise.all([
    listCapitalAccounts(),
    listCapitalTransactions(200),
  ])

  return <CapitalClient accounts={accounts} transactions={transactions} />
}

