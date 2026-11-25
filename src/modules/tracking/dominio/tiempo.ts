import type { SeguimientoVuelo } from '../tipos'
import { ZONA_CHILE, zonaHoraria } from './aeropuertos'
import { EN_AIRE } from './estados'

// El backend envía LocalDateTime en hora de Chile y sin zona: "2026-10-20T14:10:00".
const PATRON = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/

const formatos = new Map<string, Intl.DateTimeFormat>()

function formato(clave: string, crear: () => Intl.DateTimeFormat): Intl.DateTimeFormat {
  let f = formatos.get(clave)
  if (!f) formatos.set(clave, (f = crear()))
  return f
}

function comoUtc(fecha: string): number {
  const m = PATRON.exec(fecha)
  if (!m) return Number.NaN
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0))
}

function desdeUtc(ms: number): string {
  return Number.isNaN(ms) ? '' : new Date(ms).toISOString().slice(0, 19)
}

function desfaseMinutos(instante: number, zona: string): number {
  const partes = Object.fromEntries(
    formato(`partes|${zona}`, () =>
      new Intl.DateTimeFormat('en-US', {
        timeZone: zona,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    )
      .formatToParts(new Date(instante))
      .map((p) => [p.type, p.value]),
  )
  const local = Date.UTC(+partes.year, +partes.month - 1, +partes.day, +partes.hour, +partes.minute, +partes.second)
  return Math.round((local - instante) / 60000)
}

/** Instante real que representa una fecha del backend. */
export function instanteChile(fecha: string): Date {
  const local = comoUtc(fecha)
  if (Number.isNaN(local)) return new Date(Number.NaN)
  const t1 = local - desfaseMinutos(local, ZONA_CHILE) * 60000
  const t2 = local - desfaseMinutos(t1, ZONA_CHILE) * 60000
  if (local - t2 === desfaseMinutos(t2, ZONA_CHILE) * 60000) return new Date(t2)
  // Hora inexistente por el adelanto de septiembre: se corre hacia adelante, como ZonedDateTime.
  return new Date(Math.max(t1, t2))
}

/** Formato del backend ("YYYY-MM-DDTHH:mm:ss") para un instante. */
export function fechaChile(instante: Date): string {
  const t = instante.getTime()
  if (Number.isNaN(t)) return ''
  return desdeUtc(t + desfaseMinutos(t, ZONA_CHILE) * 60000)
}

/** "YYYY-MM-DD" de hoy en Chile: el valor por defecto del filtro del tablero. */
export function hoyChile(ahora: Date = new Date()): string {
  return fechaChile(ahora).slice(0, 10)
}

// Suma sobre la hora de reloj, igual que LocalDateTime.plusMinutes del backend.
export function sumarMinutos(fecha: string, minutos: number): string {
  return desdeUtc(comoUtc(fecha) + minutos * 60000)
}

// Diferencia en hora de reloj, igual que Duration.between entre dos LocalDateTime.
export function minutosEntre(desde: string, hasta: string): number {
  return Math.trunc((comoUtc(hasta) - comoUtc(desde)) / 60000)
}

/** "14:10" en la hora local del aeropuerto `iata` (hora de Chile si no se conoce). */
export function formatearHora(fecha: string, iata?: string): string {
  const instante = instanteChile(fecha)
  if (Number.isNaN(instante.getTime())) return ''
  const zona = iata ? zonaHoraria(iata) : ZONA_CHILE
  return formato(`hora|${zona}`, () =>
    new Intl.DateTimeFormat('es-CL', { timeZone: zona, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
  ).format(instante)
}

/** "vie 24-10" en la hora local del aeropuerto `iata`. */
export function formatearDia(fecha: string, iata?: string): string {
  const instante = instanteChile(fecha)
  if (Number.isNaN(instante.getTime())) return ''
  const zona = iata ? zonaHoraria(iata) : ZONA_CHILE
  const partes = Object.fromEntries(
    formato(`dia|${zona}`, () =>
      new Intl.DateTimeFormat('es-CL', { timeZone: zona, weekday: 'short', day: '2-digit', month: '2-digit' }),
    )
      .formatToParts(instante)
      .map((p) => [p.type, p.value]),
  )
  return `${partes.weekday.replace('.', '')} ${partes.day}-${partes.month}`
}

/** "hace un momento", "hace 3 min", "hace 2 h", "hace 1 d". */
export function haceCuanto(fecha: string, ahora: Date = new Date()): string {
  const min = Math.floor((ahora.getTime() - instanteChile(fecha).getTime()) / 60000)
  if (Number.isNaN(min)) return ''
  if (min < 1) return 'hace un momento'
  if (min < 60) return `hace ${min} min`
  if (min < 60 * 24) return `hace ${Math.floor(min / 60)} h`
  return `hace ${Math.floor(min / (60 * 24))} d`
}

export interface Horarios {
  salidaEstimada: string
  llegadaEstimada: string
  /** Minutos que la estimada se aleja de la programada (0 si coinciden). */
  desplazamientoMinutos: number
}

// Un retraso de SISTEMA viene de una reprogramación y salidaProgramada ya trae la hora nueva;
// uno MANUAL no la mueve, así que se suma. El DTO no expone la salida original, por lo que un
// MANUAL posterior a una reprogramación se sobreestima.
export function horariosEstimados(seg: SeguimientoVuelo): Horarios {
  const ultimoRetraso = seg.historial.find((e) => e.estadoNuevo === 'RETRASADO')
  const desplazamiento = ultimoRetraso?.origen === 'MANUAL' ? seg.retrasoMinutos : 0
  return {
    salidaEstimada: sumarMinutos(seg.salidaProgramada, desplazamiento),
    llegadaEstimada: sumarMinutos(seg.llegadaProgramada, desplazamiento),
    desplazamientoMinutos: desplazamiento,
  }
}

export interface Progreso {
  porcentaje: number
  minutosRestantes: number
}

/** Avance del trayecto; solo para DESPEGADO y EN_VUELO. */
export function progreso(seg: SeguimientoVuelo, ahora: Date = new Date()): Progreso | null {
  if (!EN_AIRE.includes(seg.estadoActual)) return null
  const { salidaEstimada, llegadaEstimada } = horariosEstimados(seg)
  const inicio = instanteChile(salidaEstimada).getTime()
  const fin = instanteChile(llegadaEstimada).getTime()
  const total = Math.max(fin - inicio, 1)
  const transcurrido = Math.min(Math.max(ahora.getTime() - inicio, 0), total)
  return {
    porcentaje: Math.round((transcurrido / total) * 100),
    minutosRestantes: Math.max(0, Math.ceil((fin - ahora.getTime()) / 60000)),
  }
}

export interface Hito {
  tipo: 'salida' | 'llegada'
  fecha: string
}

export function proximoHito(seg: SeguimientoVuelo): Hito | null {
  const { salidaEstimada, llegadaEstimada } = horariosEstimados(seg)
  switch (seg.estadoActual) {
    case 'PROGRAMADO':
    case 'RETRASADO':
    case 'EMBARCANDO':
      return { tipo: 'salida', fecha: salidaEstimada }
    case 'DESPEGADO':
    case 'EN_VUELO':
      return { tipo: 'llegada', fecha: llegadaEstimada }
    default:
      return null
  }
}
