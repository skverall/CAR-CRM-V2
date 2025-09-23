import { listCapitalAccounts } from '@/server/capital'

import { ManualTxnDialog } from '@/components/capital/manual-txn-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
  }).format(value)
}

export default async function CapitalPage() {
  const accounts = await listCapitalAccounts()

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold tracking-tight'>Капитал</h1>
        <ManualTxnDialog accounts={accounts} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Счета</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Название</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead className='text-right'>Баланс</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>{account.name}</TableCell>
                  <TableCell className='capitalize'>{account.type.toLowerCase()}</TableCell>
                  <TableCell className='text-right'>{formatCurrency(account.balanceAed)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
