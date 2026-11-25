import { obtenerToken } from '../sesion'
import type { ApiError } from '../tipos'
import { crearError, esApiError } from './errores'
import type { FuenteTracking } from './fuente'

const BASE = `${String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}/api/v1`

const MENSAJE_POR_STATUS: Record<number, string> = {
  400: 'La petición no es válida.',
  401: 'Se requiere iniciar sesión.',
  403: 'No tienes permisos para esta acción.',
  404: 'No se encontró el recurso.',
  422: 'La operación no cumple las reglas del negocio.',
}

async function aApiError(respuesta: Response, ruta: string): Promise<ApiError> {
  const cuerpo: unknown = await respuesta.json().catch(() => null)
  if (esApiError(cuerpo)) return { ...cuerpo, details: cuerpo.details ?? [] }
  const mensaje = MENSAJE_POR_STATUS[respuesta.status] ?? 'Error inesperado del servidor.'
  return crearError(respuesta.status, `HTTP_${respuesta.status}`, mensaje, ruta)
}

async function pedir<T>(metodo: 'GET' | 'POST', ruta: string, cuerpo?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = obtenerToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json'

  let respuesta: Response
  try {
    respuesta = await fetch(BASE + ruta, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch {
    throw crearError(0, 'SIN_CONEXION', 'No se pudo conectar con el servidor.', ruta)
  }
  if (!respuesta.ok) throw await aApiError(respuesta, ruta)
  return (await respuesta.json()) as T
}

export const fuenteHttp: FuenteTracking = {
  obtenerPorId: (vueloId) => pedir('GET', `/tracking/vuelos/${vueloId}`),
  obtenerPorCodigo: (codigo) => pedir('GET', `/tracking/vuelos/codigo/${encodeURIComponent(codigo)}`),
  misVuelos: () => pedir('GET', '/tracking/mis-vuelos'),
  tablero: (filtro = {}) => {
    const params = new URLSearchParams()
    if (filtro.fecha) params.set('fecha', filtro.fecha)
    if (filtro.estado) params.set('estado', filtro.estado)
    const consulta = params.toString()
    return pedir('GET', `/admin/tracking/tablero${consulta ? `?${consulta}` : ''}`)
  },
  actualizarEstado: (vueloId, cuerpo) => pedir('POST', `/admin/tracking/vuelos/${vueloId}/estado`, cuerpo),
  aeropuertos: () => pedir('GET', '/busqueda/aeropuertos'),
}
