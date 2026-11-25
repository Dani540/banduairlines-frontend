import type { EstadoVuelo } from '../tipos'
import { ETIQUETA_ESTADO } from './estados'

// Copia de MaquinaEstadosVuelo (backend), solo para cambios manuales. El backend vuelve a validar.
const DESTINOS: Record<EstadoVuelo, readonly EstadoVuelo[]> = {
  PROGRAMADO: ['EMBARCANDO', 'RETRASADO', 'CANCELADO'],
  RETRASADO: ['EMBARCANDO', 'RETRASADO', 'CANCELADO'],
  EMBARCANDO: ['DESPEGADO', 'RETRASADO', 'CANCELADO'],
  DESPEGADO: [],
  EN_VUELO: [],
  ATERRIZADO: [],
  CANCELADO: [],
}

const SOLO_SISTEMA: readonly EstadoVuelo[] = ['EN_VUELO', 'ATERRIZADO']

export function destinosManuales(actual: EstadoVuelo): EstadoVuelo[] {
  return [...DESTINOS[actual]]
}

export function esTerminal(estado: EstadoVuelo): boolean {
  return estado === 'ATERRIZADO' || estado === 'CANCELADO'
}

export function requiereMotivo(nuevo: EstadoVuelo): boolean {
  return nuevo === 'RETRASADO' || nuevo === 'CANCELADO'
}

export function razonNoPermitido(actual: EstadoVuelo, destino: EstadoVuelo): string | null {
  if (DESTINOS[actual].includes(destino)) return null
  if (esTerminal(actual)) return `El vuelo está ${ETIQUETA_ESTADO[actual].toLowerCase()}: ya no cambia de estado.`
  if (SOLO_SISTEMA.includes(destino)) return `${ETIQUETA_ESTADO[destino]} lo marca el sistema según el horario.`
  if (actual === 'DESPEGADO' || actual === 'EN_VUELO') return 'El vuelo ya despegó: avanza solo según el horario.'
  if (destino === actual) return `El vuelo ya está ${ETIQUETA_ESTADO[actual].toLowerCase()}.`
  if (destino === 'PROGRAMADO') return 'Un vuelo no vuelve a Programado: una reprogramación es un retraso.'
  if (destino === 'DESPEGADO') return 'Para despegar, el vuelo debe estar embarcando.'
  return `No se permite pasar de ${ETIQUETA_ESTADO[actual]} a ${ETIQUETA_ESTADO[destino]}.`
}
