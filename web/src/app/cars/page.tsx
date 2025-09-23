import { listCars } from '@/server/car'

import { CarsClient } from '@/components/cars/cars-client'

export default async function CarsPage() {
  const { items } = await listCars({ page: 1, pageSize: 50 })

  return <CarsClient cars={items} />
}
