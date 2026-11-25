import type { Rol } from './tipos'

// Mientras no exista el core/ de Integración, la sesión la deja integracion_stub/ en sessionStorage.
export const CLAVE_SESION = 'banduairlines.sesion'
export const EVENTO_INICIAR_SESION = 'banduairlines:iniciar-sesion'

export interface Sesion {
  token: string
  rol: Rol
  nombre: string
}

export function sesionActual(): Sesion | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE_SESION)
    return crudo ? (JSON.parse(crudo) as Sesion) : null
  } catch {
    return null
  }
}

export function obtenerToken(): string | null {
  return sesionActual()?.token ?? null
}

export function rolActual(): Rol | null {
  return sesionActual()?.rol ?? null
}

export function solicitarInicioSesion(): void {
  window.dispatchEvent(new CustomEvent(EVENTO_INICIAR_SESION))
}
