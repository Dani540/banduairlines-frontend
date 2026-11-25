import { onBeforeUnmount, onMounted, ref } from 'vue'
import { routes, type RutaTracking } from '../src/modules/tracking/routes'

export interface RutaResuelta {
  ruta: RutaTracking
  props: Record<string, unknown>
}

export const RUTA_INICIAL = '/tracking'

// Reemplazo mínimo de vue-router: "#/tracking/vuelos/101" → ruta de routes.ts y sus props.
export function resolver(path: string): RutaResuelta | null {
  for (const ruta of routes) {
    const nombres: string[] = []
    const patron = new RegExp(
      `^${ruta.path.replace(/:(\w+)/g, (_, nombre: string) => {
        nombres.push(nombre)
        return '([^/]+)'
      })}$`,
    )
    const m = patron.exec(path)
    if (!m) continue
    let params: Record<string, string>
    try {
      params = Object.fromEntries(nombres.map((n, i) => [n, decodeURIComponent(m[i + 1])]))
    } catch {
      return null
    }
    const props = typeof ruta.props === 'function' ? ruta.props({ params }) : ruta.props ? params : {}
    return { ruta, props }
  }
  return null
}

export function usarRutaActual() {
  const leer = () => location.hash.replace(/^#/, '') || RUTA_INICIAL
  const path = ref(leer())
  const actualizar = () => (path.value = leer())
  onMounted(() => window.addEventListener('hashchange', actualizar))
  onBeforeUnmount(() => window.removeEventListener('hashchange', actualizar))
  return path
}
