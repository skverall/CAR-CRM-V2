import { CarStatus } from '@prisma/client'
import { z } from 'zod'

const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{11,17}$/

export const carCreateSchema = z.object({
  vin: z
    .string()
    .trim()
    .regex(VIN_REGEX, 'VIN must be 11-17 uppercase characters without I/O/Q')
    .transform((value) => value.toUpperCase()),
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  buyDate: z.string().min(1, 'Дата обязательна'),
  buyPrice: z.coerce.number().positive(),
  buyCurrency: z
    .string()
    .trim()
    .min(3, 'Currency code must be 3 characters')
    .max(3, 'Currency code must be 3 characters')
    .transform((value) => value.toUpperCase()),
  buyRate: z.coerce.number().positive(),
  source: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  fundingAccountId: z.string().min(1).optional(),
})

export type CarCreateInput = z.infer<typeof carCreateSchema>

export const carListQuerySchema = z.object({
  query: z.string().trim().optional(),
  status: z.nativeEnum(CarStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type CarListQuery = z.infer<typeof carListQuerySchema>
