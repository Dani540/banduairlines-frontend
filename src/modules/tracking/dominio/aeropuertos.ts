import type { Aeropuerto } from '../tipos'

export const ZONA_CHILE = 'America/Santiago'

const registro = new Map<string, Aeropuerto>()

// Las vistas lo llenan con fuente.aeropuertos() antes de mostrar componentes.
export function registrarAeropuertos(lista: Aeropuerto[]): void {
  registro.clear()
  for (const a of lista) registro.set(a.codigoIata.toUpperCase(), a)
}

export function aeropuerto(iata: string): Aeropuerto | undefined {
  return registro.get(iata.toUpperCase())
}

export function ciudad(iata: string): string {
  return aeropuerto(iata)?.ciudad ?? iata
}

export function zonaHoraria(iata: string): string {
  return aeropuerto(iata)?.zonaHoraria || ZONA_CHILE
}

/** "SCL → PUQ" o, si se conocen, "Santiago → Punta Arenas". */
export function ruta(origenIata: string, destinoIata: string): string {
  return `${ciudad(origenIata)} → ${ciudad(destinoIata)}`
}
