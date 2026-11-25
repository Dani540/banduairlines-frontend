import { registrarAeropuertos } from '../dominio/aeropuertos'
import type {
  ActualizarEstado,
  Aeropuerto,
  FiltroTablero,
  ResumenVuelo,
  SeguimientoVuelo,
} from '../tipos'
import { fuenteHttp } from './http'
import { fuenteMock } from './mock'

/** Punto único de acceso a datos. Toda promesa rechazada entrega un ApiError. */
export interface FuenteTracking {
  obtenerPorId(vueloId: number): Promise<SeguimientoVuelo>
  obtenerPorCodigo(codigo: string): Promise<SeguimientoVuelo>
  misVuelos(): Promise<ResumenVuelo[]>
  tablero(filtro?: FiltroTablero): Promise<ResumenVuelo[]>
  actualizarEstado(vueloId: number, cuerpo: ActualizarEstado): Promise<SeguimientoVuelo>
  aeropuertos(): Promise<Aeropuerto[]>
}

export const MODO_FUENTE: 'mock' | 'http' = import.meta.env.VITE_TRACKING_FUENTE === 'mock' ? 'mock' : 'http'

export const fuente: FuenteTracking = MODO_FUENTE === 'mock' ? fuenteMock : fuenteHttp

let cargaAeropuertos: Promise<void> | null = null

/** Carga el registro de aeropuertos una sola vez; si falla, el siguiente llamado reintenta. */
export function asegurarAeropuertos(): Promise<void> {
  cargaAeropuertos ??= fuente
    .aeropuertos()
    .then(registrarAeropuertos)
    .catch((e: unknown) => {
      cargaAeropuertos = null
      throw e
    })
  return cargaAeropuertos
}
