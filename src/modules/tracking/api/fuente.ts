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

export const fuente: FuenteTracking = import.meta.env.VITE_TRACKING_FUENTE === 'mock' ? fuenteMock : fuenteHttp
