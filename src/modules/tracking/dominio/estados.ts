import type { EstadoVuelo } from '../tipos'

export const ESTADOS: readonly EstadoVuelo[] = [
  'PROGRAMADO',
  'EMBARCANDO',
  'DESPEGADO',
  'EN_VUELO',
  'ATERRIZADO',
  'RETRASADO',
  'CANCELADO',
]

export const ETIQUETA_ESTADO: Record<EstadoVuelo, string> = {
  PROGRAMADO: 'Programado',
  EMBARCANDO: 'Embarcando',
  DESPEGADO: 'Despegado',
  EN_VUELO: 'En vuelo',
  ATERRIZADO: 'Aterrizado',
  RETRASADO: 'Retrasado',
  CANCELADO: 'Cancelado',
}

export const EN_AIRE: readonly EstadoVuelo[] = ['DESPEGADO', 'EN_VUELO']
