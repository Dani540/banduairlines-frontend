import { obtenerToken } from '../sesion'
import type { ApiError } from '../tipos'
import { crearError, esApiError } from './errores'
import type { FuenteTracking } from './fuente'

const PREFIJO = '/api/v1'
const BASE = `${String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')}${PREFIJO}`
const TIEMPO_MAXIMO_MS = 15000

const MENSAJE_POR_STATUS: Record<number, string> = {
  400: 'La petición no es válida.',
  401: 'Se requiere iniciar sesión.',
  403: 'No tienes permisos para esta acción.',
  404: 'No se encontró el recurso.',
  409: 'El recurso fue modificado por otra operación; vuelve a intentarlo.',
  422: 'La operación no cumple las reglas del negocio.',
}

async function aApiError(respuesta: Response, path: string): Promise<ApiError> {
  const cuerpo: unknown = await respuesta.json().catch(() => null)
  if (esApiError(cuerpo)) return { ...cuerpo, details: Array.isArray(cuerpo.details) ? cuerpo.details : [] }
  const mensaje = MENSAJE_POR_STATUS[respuesta.status] ?? 'Error inesperado del servidor.'
  return crearError(respuesta.status, `HTTP_${respuesta.status}`, mensaje, path)
}

interface Opciones {
  cuerpo?: unknown
  publica?: boolean
}

async function pedir<T>(metodo: 'GET' | 'POST', ruta: string, { cuerpo, publica = false }: Opciones = {}): Promise<T> {
  const path = PREFIJO + ruta
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = publica ? null : obtenerToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json'

  let respuesta: Response
  try {
    respuesta = await fetch(BASE + ruta, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      throw crearError(0, 'TIEMPO_AGOTADO', 'El servidor no respondió a tiempo.', path)
    }
    throw crearError(0, 'SIN_CONEXION', 'No se pudo conectar con el servidor.', path)
  }
  if (!respuesta.ok) throw await aApiError(respuesta, path)
  try {
    return (await respuesta.json()) as T
  } catch {
    throw crearError(respuesta.status, 'RESPUESTA_INVALIDA', 'La respuesta del servidor no es válida.', path)
  }
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
  actualizarEstado: (vueloId, cuerpo) => pedir('POST', `/admin/tracking/vuelos/${vueloId}/estado`, { cuerpo }),
  aeropuertos: () => pedir('GET', '/busqueda/aeropuertos', { publica: true }),
}
