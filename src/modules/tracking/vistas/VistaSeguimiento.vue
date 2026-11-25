<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { fuente } from '../api/fuente'
import BuscadorVuelo from '../componentes/BuscadorVuelo.vue'
import InspectorVuelo from '../componentes/InspectorVuelo.vue'
import ListaVuelos from '../componentes/ListaVuelos.vue'
import MensajeError from '../componentes/MensajeError.vue'
import { registrarAeropuertos } from '../dominio/aeropuertos'
import { rolActual } from '../sesion'
import type { ApiError, ResumenVuelo, SeguimientoVuelo } from '../tipos'

const props = defineProps<{ vueloId?: number }>()

const rol = rolActual()
const listo = ref(false)
const vuelos = ref<ResumenVuelo[]>([])
const errorLista = ref<ApiError | null>(null)
const errorBusqueda = ref<ApiError | null>(null)
const seleccionado = ref<number | null>(props.vueloId ?? null)
const encontrado = ref<SeguimientoVuelo>()

async function cargarLista() {
  if (!rol) return
  try {
    vuelos.value = rol === 'PASAJERO' ? await fuente.misVuelos() : await fuente.tablero()
    errorLista.value = null
  } catch (e) {
    errorLista.value = e as ApiError
  }
}

function alEncontrar(seg: SeguimientoVuelo) {
  errorBusqueda.value = null
  encontrado.value = seg
  seleccionado.value = seg.vueloId
}

function alSeleccionar(vueloId: number) {
  errorBusqueda.value = null
  encontrado.value = undefined
  seleccionado.value = vueloId
}

watch(
  () => props.vueloId,
  (vueloId) => {
    if (vueloId != null) alSeleccionar(vueloId)
  },
)

onMounted(async () => {
  await fuente.aeropuertos().then(registrarAeropuertos, () => undefined)
  listo.value = true
  await cargarLista()
})
</script>

<template>
  <div v-if="listo" class="seguimiento">
    <header class="seguimiento__cabecera">
      <h1>Seguimiento de vuelos</h1>
      <BuscadorVuelo @encontrado="alEncontrar" @error="errorBusqueda = $event" />
      <MensajeError :error="errorBusqueda" />
    </header>

    <div class="seguimiento__cuerpo" :class="{ 'seguimiento__cuerpo--con-lista': rol }">
      <aside v-if="rol" class="seguimiento__lista">
        <h2>{{ rol === 'PASAJERO' ? 'Mis vuelos' : 'Vuelos de hoy' }}</h2>
        <MensajeError :error="errorLista" />
        <ListaVuelos v-if="!errorLista" :vuelos="vuelos" :seleccionado="seleccionado" @seleccionar="alSeleccionar" />
      </aside>

      <main class="seguimiento__detalle">
        <InspectorVuelo v-if="seleccionado !== null" :vuelo-id="seleccionado" :seguimiento="encontrado" />
        <p v-else class="seguimiento__vacio">
          Escribe el código de tu vuelo para ver su estado{{ rol ? ' o elige uno de la lista' : '' }}.
        </p>
      </main>
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
.seguimiento__vacio {
  color: #64748b;
}
</style>
