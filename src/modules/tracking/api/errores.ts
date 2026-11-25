import type { ApiError, DetalleError } from '../tipos'

export function crearError(
  status: number,
  code: string,
  message: string,
  path: string,
  details: DetalleError[] = [],
): ApiError {
  return { timestamp: new Date().toISOString(), status, error: '', code, message, path, details }
}

export function esApiError(valor: unknown): valor is ApiError {
  if (typeof valor !== 'object' || valor === null) return false
  const v = valor as Record<string, unknown>
  return typeof v.status === 'number' && typeof v.code === 'string' && typeof v.message === 'string'
}
