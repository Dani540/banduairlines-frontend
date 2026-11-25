<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { asegurarAeropuertos, fuente } from '../api/fuente'
import BuscadorVuelo from '../componentes/BuscadorVuelo.vue'
import InspectorVuelo from '../componentes/InspectorVuelo.vue'
import ListaVuelos from '../componentes/ListaVuelos.vue'
import MensajeError from '../componentes/MensajeError.vue'
import { usarSesion } from '../sesion'
import type { ApiError, ResumenVuelo, SeguimientoVuelo } from '../tipos'

const props = defineProps<{ vueloId?: number }>()

const sesion = usarSesion()
const rol = computed(() => sesion.value?.rol ?? null)
const listo = ref(false)
const sinAeropuertos = ref(false)
const vuelos = ref<ResumenVuelo[]>([])
const errorLista = ref<ApiError | null>(null)
const errorBusqueda = ref<ApiError | null>(null)
const seleccionado = ref<number | null>(null)
const encontrado = ref<SeguimientoVuelo>()

let consultaLista = 0
async function cargarLista() {
  const id = ++consultaLista
  vuelos.value = []
  errorLista.value = null
  if (!rol.value) return
  try {
    const lista = rol.value === 'PASAJERO' ? await fuente.misVuelos() : await fuente.tablero()
    if (id === consultaLista) vuelos.value = lista
  } catch (e) {
    if (id === consultaLista) errorLista.value = e as ApiError
  }
}

function alEncontrar(seg: SeguimientoVuelo) {
  errorBusqueda.value = null
  encontrado.value = seg
  seleccionado.value = seg.vueloId
}

function alSeleccionar(vueloId: number | null) {
  errorBusqueda.value = null
  encontrado.value = undefined
  seleccionado.value = vueloId
}

watch(
  () => props.vueloId,
  (vueloId) => alSeleccionar(vueloId ?? null),
  { immediate: true },
)
watch(rol, () => {
  errorBusqueda.value = null
  void cargarLista()
})

void Promise.all([
  asegurarAeropuertos().catch(() => (sinAeropuertos.value = true)),
  cargarLista(),
]).then(() => (listo.value = true))
</script>

<template>
  <p v-if="!listo" class="seguimiento__vacio">Cargando…</p>
  <div v-else class="seguimiento">
    <header class="seguimiento__cabecera">
      <h1>Seguimiento de vuelos</h1>
      <BuscadorVuelo @encontrado="alEncontrar" @error="errorBusqueda = $event" />
      <MensajeError :error="errorBusqueda" />
      <p v-if="sinAeropuertos" class="seguimiento__aviso">
        No se pudieron cargar los aeropuertos: las horas se muestran en hora de Chile.
      </p>
    </header>

    <div class="seguimiento__cuerpo" :class="{ 'seguimiento__cuerpo--con-lista': rol }">
      <aside v-if="rol" class="seguimiento__lista">
        <h2>{{ rol === 'PASAJERO' ? 'Mis vuelos' : 'Vuelos de hoy' }}</h2>
        <MensajeError :error="errorLista" />
        <ListaVuelos v-if="!errorLista" :vuelos="vuelos" :seleccionado="seleccionado" @seleccionar="alSeleccionar" />
      </aside>

      <section class="seguimiento__detalle" aria-label="Detalle del vuelo">
        <InspectorVuelo v-if="seleccionado !== null" :vuelo-id="seleccionado" :seguimiento="encontrado" />
        <p v-else class="seguimiento__vacio">
          Escribe el código de tu vuelo para ver su estado{{ rol ? ' o elige uno de la lista' : '' }}.
        </p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.seguimiento {
  display: grid;
  gap: 1.5rem;
}
.seguimiento__cabecera {
  display: grid;
  gap: 0.75rem;
}
.seguimiento__cabecera h1 {
  margin: 0;
}
.seguimiento__cuerpo {
  display: grid;
  gap: 1.5rem;
}
@media (min-width: 900px) {
  .seguimiento__cuerpo--con-lista {
    grid-template-columns: minmax(280px, 1fr) 2fr;
  }
}
.seguimiento__lista h2 {
  margin-top: 0;
  font-size: 1.1rem;
}
.seguimiento__vacio,
.seguimiento__aviso {
  color: #64748b;
}
.seguimiento__aviso {
  margin: 0;
  font-size: 0.9rem;
}
</style>
