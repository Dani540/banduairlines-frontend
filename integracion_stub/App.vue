<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, type Component } from 'vue'
import { MODO_FUENTE } from '../src/modules/tracking/api/fuente'
import {
  CLAVE_SESION,
  EVENTO_INICIAR_SESION,
  notificarCambioSesion,
  sesionActual,
  type Sesion,
} from '../src/modules/tracking/sesion'
import type { Rol } from '../src/modules/tracking/tipos'
import Catalogo from './Catalogo.vue'
import { resolver, usarRutaActual } from './navegacion'

const FUENTE = MODO_FUENTE
const API_URL = String(import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

const ENLACES = [
  { href: '#/tracking', texto: 'Seguimiento' },
  ...(FUENTE === 'mock' ? [{ href: '#/tracking/vuelos/101', texto: 'Vuelo 101' }] : []),
  { href: '#/admin/tracking', texto: 'Operaciones (admin)' },
  { href: '#/catalogo', texto: 'Catálogo' },
]

const path = usarRutaActual()
const sesion = ref<Sesion | null>(sesionActual())
const panelAbierto = ref(false)
const correo = ref('')
const contrasena = ref('')
const errorLogin = ref('')
const enviando = ref(false)

const resuelta = computed(() => resolver(path.value))
const vistas = new Map<unknown, Component>()
const vistaActual = computed(() => {
  const cargar = resuelta.value?.ruta.component
  if (!cargar) return null
  if (!vistas.has(cargar)) vistas.set(cargar, defineAsyncComponent(cargar))
  return vistas.get(cargar)
})
const accesoDenegado = computed(() => {
  const rol = resuelta.value?.ruta.meta.rol
  return rol !== undefined && sesion.value?.rol !== rol
})

function guardar(nueva: Sesion | null) {
  if (nueva) sessionStorage.setItem(CLAVE_SESION, JSON.stringify(nueva))
  else sessionStorage.removeItem(CLAVE_SESION)
  sesion.value = nueva
  panelAbierto.value = false
  notificarCambioSesion()
}

function elegirRolMock(valor: string) {
  const rol = valor as Rol | ''
  guardar(rol ? { token: `mock-${rol.toLowerCase()}`, rol, nombre: rol === 'PASAJERO' ? 'Pasajera de prueba' : 'Admin de prueba' } : null)
}

async function iniciarSesionHttp() {
  enviando.value = true
  errorLogin.value = ''
  try {
    const r = await fetch(`${API_URL}/api/v1/auth/inicio-sesion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ correo: correo.value, contrasena: contrasena.value }),
    })
    const cuerpo = await r.json().catch(() => null)
    if (!r.ok) {
      errorLogin.value = cuerpo?.message ?? `Error ${r.status}`
      return
    }
    const u = cuerpo?.usuario
    if (typeof cuerpo?.credencialAcceso !== 'string' || !u?.rol) {
      errorLogin.value = 'El servidor respondió con un formato inesperado.'
      return
    }
    guardar({ token: cuerpo.credencialAcceso, rol: u.rol, nombre: `${u.nombres} ${u.apellidos}` })
    contrasena.value = ''
  } catch {
    errorLogin.value = `No se pudo conectar con ${API_URL || 'el servidor'}.`
  } finally {
    enviando.value = false
  }
}

// Si la vista pide iniciar sesión teniendo una, el token ya no sirve (expiró o es inválido).
function abrirPanel() {
  if (FUENTE === 'http' && sesion.value) guardar(null)
  panelAbierto.value = true
}
onMounted(() => window.addEventListener(EVENTO_INICIAR_SESION, abrirPanel))
onBeforeUnmount(() => window.removeEventListener(EVENTO_INICIAR_SESION, abrirPanel))
</script>

<template>
  <header class="stub-barra">
    <strong>BanduAirlines</strong>
    <span class="stub-etiqueta">stub de Integración, fuente {{ FUENTE }}</span>
    <nav>
      <a v-for="e in ENLACES" :key="e.href" :href="e.href" :class="{ activo: `#${path}` === e.href }">{{ e.texto }}</a>
    </nav>
    <div class="stub-sesion">
      <template v-if="FUENTE === 'mock'">
        <label>
          Sesión
          <select :value="sesion?.rol ?? ''" @change="elegirRolMock(($event.target as HTMLSelectElement).value)">
            <option value="">Visitante</option>
            <option value="PASAJERO">Pasajero</option>
            <option value="ADMINISTRADOR">Administrador</option>
          </select>
        </label>
      </template>
      <template v-else>
        <span v-if="sesion">{{ sesion.nombre }} ({{ sesion.rol }})</span>
        <button v-if="sesion" type="button" @click="guardar(null)">Cerrar sesión</button>
        <button v-else type="button" @click="panelAbierto = !panelAbierto">Iniciar sesión</button>
      </template>
    </div>
  </header>

  <form v-if="panelAbierto && FUENTE === 'http' && !sesion" class="stub-login" @submit.prevent="iniciarSesionHttp">
    <input v-model="correo" type="email" placeholder="correo" aria-label="Correo" required autocomplete="username" />
    <input
      v-model="contrasena"
      type="password"
      placeholder="contraseña"
      aria-label="Contraseña"
      required
      autocomplete="current-password"
    />
    <button type="submit" :disabled="enviando">Entrar</button>
    <span v-if="errorLogin" class="stub-error">{{ errorLogin }}</span>
  </form>
  <p v-if="panelAbierto && FUENTE === 'mock'" class="stub-login">
    Elige una sesión en el selector de la barra (Pasajero o Administrador).
    <button type="button" @click="panelAbierto = false">Entendido</button>
  </p>

  <div class="stub-contenido">
    <Catalogo v-if="path === '/catalogo'" />
    <p v-else-if="!resuelta">No hay una vista para <code>{{ path }}</code>.</p>
    <p v-else-if="accesoDenegado" class="stub-aviso">
      Esta ruta requiere el rol {{ resuelta.ruta.meta.rol }}. El router de Integración la bloquearía; el stub la
      muestra igual para probar la vista.
    </p>
    <component :is="vistaActual" v-if="vistaActual" :key="path" v-bind="resuelta?.props" />
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: #0f172a;
  background: #f1f5f9;
}
.stub-barra {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.25rem;
  padding: 0.6rem 1rem;
  background: #0f172a;
  color: #e2e8f0;
}
.stub-barra nav {
  display: flex;
  gap: 0.75rem;
}
.stub-barra a {
  color: #cbd5e1;
}
.stub-barra a.activo {
  color: #fff;
  font-weight: 600;
}
.stub-etiqueta {
  font-size: 0.8rem;
  padding: 0.1rem 0.5rem;
  border: 1px dashed #64748b;
  border-radius: 4px;
}
.stub-sesion {
  margin-left: auto;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.stub-login {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin: 0;
  padding: 0.6rem 1rem;
  background: #e2e8f0;
}
.stub-error {
  color: #a12727;
}
.stub-aviso {
  padding: 0.5rem 0.75rem;
  border-left: 4px solid #f59e0b;
  background: #fffbeb;
}
.stub-contenido {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 1rem 3rem;
}
</style>
