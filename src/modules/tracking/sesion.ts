import { computed, shallowRef, type ComputedRef } from 'vue'
import type { Rol } from './tipos'

// Contrato con quien escriba la sesión (core/ de Integración; por ahora integracion_stub/):
// guarda { token, rol, nombre } en sessionStorage y luego dispara EVENTO_SESION_CAMBIADA.
export const CLAVE_SESION = 'banduairlines.sesion'
export const EVENTO_SESION_CAMBIADA = 'banduairlines:sesion-cambiada'
export const EVENTO_INICIAR_SESION = 'banduairlines:iniciar-sesion'

export interface Sesion {
  token: string
  rol: Rol
  nombre: string
}

function esSesion(valor: unknown): valor is Sesion {
  if (typeof valor !== 'object' || valor === null) return false
  const v = valor as Record<string, unknown>
  return (
    typeof v.token === 'string' &&
    v.token.length > 0 &&
    (v.rol === 'PASAJERO' || v.rol === 'ADMINISTRADOR') &&
    typeof v.nombre === 'string'
  )
}

export function sesionActual(): Sesion | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE_SESION)
    const valor: unknown = crudo ? JSON.parse(crudo) : null
    return esSesion(valor) ? valor : null
  } catch {
    return null
  }
}

const sesion = shallowRef<Sesion | null>(null)
const sesionLectura = computed(() => sesion.value)
let escuchando = false

/** Sesión reactiva: cambia cuando se dispara EVENTO_SESION_CAMBIADA. */
export function usarSesion(): ComputedRef<Sesion | null> {
  if (!escuchando) {
    escuchando = true
    const releer = () => (sesion.value = sesionActual())
    window.addEventListener(EVENTO_SESION_CAMBIADA, releer)
    window.addEventListener('storage', releer)
    releer()
  }
  return sesionLectura
}

export function obtenerToken(): string | null {
  return sesionActual()?.token ?? null
}

export function rolActual(): Rol | null {
  return sesionActual()?.rol ?? null
}

export function notificarCambioSesion(): void {
  window.dispatchEvent(new CustomEvent(EVENTO_SESION_CAMBIADA))
}

export function solicitarInicioSesion(): void {
  window.dispatchEvent(new CustomEvent(EVENTO_INICIAR_SESION))
}
