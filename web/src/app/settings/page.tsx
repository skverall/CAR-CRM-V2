import { listFxRates } from '@/server/fx'

import { FxRateDialog } from '@/components/settings/fx-rate-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function SettingsPage() {
  const rates = await listFxRates()

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold tracking-tight'>Настройки</h1>
        <FxRateDialog />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Курсы валют</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Валюта</TableHead>
                <TableHead className='text-right'>Курс (AED)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>{new Date(rate.date).toLocaleDateString('ru-RU')}</TableCell>
                  <TableCell>{rate.counter}</TableCell>
                  <TableCell className='text-right'>{rate.rate.toNumber()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
