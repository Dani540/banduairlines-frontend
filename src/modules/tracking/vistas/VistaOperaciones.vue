<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { crearError } from '../api/errores'
import { fuente } from '../api/fuente'
import InspectorVuelo from '../componentes/InspectorVuelo.vue'
import MensajeError from '../componentes/MensajeError.vue'
import ModalBase from '../componentes/ModalBase.vue'
import ModalCambioEstado from '../componentes/ModalCambioEstado.vue'
import ResumenOperaciones from '../componentes/ResumenOperaciones.vue'
import TablaOperaciones from '../componentes/TablaOperaciones.vue'
import { registrarAeropuertos } from '../dominio/aeropuertos'
import { hoyChile } from '../dominio/tiempo'
import { rolActual } from '../sesion'
import type { ApiError, EstadoVuelo, ResumenVuelo } from '../tipos'

const SIN_SESION = 'Inicia sesión con una cuenta de administrador para ver las operaciones del día.'
const rol = rolActual()
const errorAcceso =
  rol === 'ADMINISTRADOR'
    ? null
    : rol
      ? crearError(403, 'ACCESO_DENEGADO', 'No tienes permisos para esta acción', '/admin/tracking')
      : crearError(401, 'NO_AUTENTICADO', 'Autenticación requerida', '/admin/tracking')

const listo = ref(false)
const fecha = ref(hoyChile())
const estado = ref<EstadoVuelo | null>(null)
const vuelosDia = ref<ResumenVuelo[]>([])
const vuelosFiltrados = ref<ResumenVuelo[]>([])
const cargando = ref(false)
const error = ref<ApiError | null>(null)
const vueloCambio = ref<number | null>(null)
const vueloHistorial = ref<number | null>(null)

const vuelosTabla = computed(() => (estado.value ? vuelosFiltrados.value : vuelosDia.value))
const codigoHistorial = computed(
  () => vuelosDia.value.find((v) => v.vueloId === vueloHistorial.value)?.codigoVuelo ?? '',
)

// El resumen muestra el día completo; la tabla, lo que devuelve el backend con el filtro de estado.
async function cargar() {
  cargando.value = true
  try {
    vuelosDia.value = await fuente.tablero({ fecha: fecha.value })
    vuelosFiltrados.value = estado.value ? await fuente.tablero({ fecha: fecha.value, estado: estado.value }) : []
    error.value = null
  } catch (e) {
    error.value = e as ApiError
  } finally {
    cargando.value = false
  }
}

function alActualizar() {
  vueloCambio.value = null
  void cargar()
}

watch([fecha, estado], () => void cargar())

onMounted(async () => {
  if (errorAcceso) return
  await fuente.aeropuertos().then(registrarAeropuertos, () => undefined)
  listo.value = true
  await cargar()
})
</script>

<template>
  <MensajeError v-if="errorAcceso" :error="errorAcceso" :texto-sin-sesion="SIN_SESION" />
  <div v-else-if="listo" class="operaciones">
    <h1>Actualización operacional</h1>
    <MensajeError :error="error" :texto-sin-sesion="SIN_SESION" />
    <ResumenOperaciones :vuelos="vuelosDia" @filtrar="estado = $event" />
    <TablaOperaciones
      v-model:fecha="fecha"
      v-model:estado="estado"
      :vuelos="vuelosTabla"
      :cargando="cargando"
      @refrescar="cargar"
      @actualizar="vueloCambio = $event"
      @ver-historial="vueloHistorial = $event"
    />
    <ModalCambioEstado :vuelo-id="vueloCambio" @cerrar="vueloCambio = null" @actualizado="alActualizar" />
    <ModalBase :abierto="vueloHistorial !== null" :titulo="`Vuelo ${codigoHistorial}`" @cerrar="vueloHistorial = null">
      <InspectorVuelo :vuelo-id="vueloHistorial" />
    </ModalBase>
  </div>
</template>

<style scoped>
.operaciones {
  display: grid;
  gap: 1.5rem;
}
.operaciones h1 {
  margin: 0;
}
</style>
