import type { Component } from 'vue'
import type { Rol } from './tipos'

// Compatible con RouteRecordRaw de vue-router, sin importarlo (todavía no está instalado).
export interface RutaTracking {
  path: string
  name: string
  component: () => Promise<{ default: Component }>
  props?: boolean | ((ruta: { params: Record<string, string | string[]> }) => Record<string, unknown>)
  meta: { titulo: string; rol?: Rol }
}

const VistaSeguimiento = () => import('./vistas/VistaSeguimiento.vue')
const VistaOperaciones = () => import('./vistas/VistaOperaciones.vue')

export const routes: RutaTracking[] = [
  {
    path: '/tracking',
    name: 'tracking-seguimiento',
    component: VistaSeguimiento,
    meta: { titulo: 'Seguimiento de vuelos' },
  },
  {
    path: '/tracking/vuelos/:vueloId',
    name: 'tracking-vuelo',
    component: VistaSeguimiento,
    props: (ruta) => ({ vueloId: Number(ruta.params.vueloId) }),
    meta: { titulo: 'Seguimiento de vuelos' },
  },
  {
    path: '/admin/tracking',
    name: 'tracking-operaciones',
    component: VistaOperaciones,
    meta: { titulo: 'Actualización operacional', rol: 'ADMINISTRADOR' },
  },
]

export default routes
