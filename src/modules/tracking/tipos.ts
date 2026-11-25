export type EstadoVuelo =
  | 'PROGRAMADO'
  | 'EMBARCANDO'
  | 'DESPEGADO'
  | 'EN_VUELO'
  | 'ATERRIZADO'
  | 'RETRASADO'
  | 'CANCELADO'

export type OrigenEvento = 'SISTEMA' | 'MANUAL'

export type Rol = 'PASAJERO' | 'ADMINISTRADOR'

export interface ResumenVuelo {
  idSeguimiento: number
  vueloId: number
  codigoVuelo: string
  origenIata: string
  destinoIata: string
  salidaProgramada: string
  estadoActual: EstadoVuelo
  retrasoMinutos: number
  ultimaActualizacion: string
}

export interface EventoEstado {
  idEvento: number
  estadoAnterior: EstadoVuelo | null
  estadoNuevo: EstadoVuelo
  fechaCambio: string
  origen: OrigenEvento
  motivo: string | null
}

export interface SeguimientoVuelo {
  idSeguimiento: number
  vueloId: number
  codigoVuelo: string
  origenIata: string
  destinoIata: string
  salidaProgramada: string
  llegadaProgramada: string
  estadoActual: EstadoVuelo
  retrasoMinutos: number
  /** Del evento más reciente al más antiguo. */
  historial: EventoEstado[]
}

export interface ActualizarEstado {
  nuevoEstado: EstadoVuelo
  motivo?: string
  retrasoMinutos?: number
}

export interface FiltroTablero {
  /** `YYYY-MM-DD`; sin valor, el backend usa el día de hoy. */
  fecha?: string
  estado?: EstadoVuelo
}

export interface Aeropuerto {
  id: number
  codigoIata: string
  nombre: string
  ciudad: string
  pais: string
  zonaHoraria: string
}

export interface DetalleError {
  campo: string
  mensaje: string
}

export interface ApiError {
  timestamp: string
  /** 0 cuando no hubo respuesta del servidor. */
  status: number
  error: string
  code: string
  message: string
  path: string
  details: DetalleError[]
}
