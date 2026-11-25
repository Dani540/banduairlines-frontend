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
  return typeof valor === 'object' && valor !== null && 'status' in valor && 'code' in valor
}
