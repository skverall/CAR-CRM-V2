import { NextResponse } from 'next/server'

type AppErrorOptions = {
  status?: number
  code?: string
  details?: unknown
  cause?: unknown
}

export class AppError extends Error {
  status: number
  code?: string
  details?: unknown

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause })
    this.name = 'AppError'
    this.status = options.status ?? 400
    this.code = options.code
    this.details = options.details
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function handleError(error: unknown, fallbackStatus = 500) {
  if (isAppError(error)) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.status },
    )
  }

  console.error('[UnhandledError]', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: fallbackStatus },
  )
}

export function assert(condition: unknown, message: string, options?: AppErrorOptions): asserts condition {
  if (!condition) {
    throw new AppError(message, options)
  }
}
