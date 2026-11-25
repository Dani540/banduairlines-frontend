<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { crearError } from '../api/errores'
import { asegurarAeropuertos, fuente } from '../api/fuente'
import InspectorVuelo from '../componentes/InspectorVuelo.vue'
import MensajeError from '../componentes/MensajeError.vue'
import ModalBase from '../componentes/ModalBase.vue'
import ModalCambioEstado from '../componentes/ModalCambioEstado.vue'
import ResumenOperaciones from '../componentes/ResumenOperaciones.vue'
import TablaOperaciones from '../componentes/TablaOperaciones.vue'
import { hoyChile } from '../dominio/tiempo'
import { usarSesion } from '../sesion'
import type { ApiError, EstadoVuelo, ResumenVuelo } from '../tipos'

const SIN_SESION = 'Inicia sesión con una cuenta de administrador para ver las operaciones del día.'
const sesion = usarSesion()
const errorAcceso = computed(() => {
  const rol = sesion.value?.rol
  if (rol === 'ADMINISTRADOR') return null
  return rol
    ? crearError(403, 'ACCESO_DENEGADO', 'No tienes permisos para esta acción', '/admin/tracking')
    : crearError(401, 'NO_AUTENTICADO', 'Autenticación requerida', '/admin/tracking')
})

const listo = ref(false)
const sinAeropuertos = ref(false)
const fecha = ref(hoyChile())
const estado = ref<EstadoVuelo | null>(null)
const vuelosDia = ref<ResumenVuelo[]>([])
const fechaDia = ref<string | null>(null)
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
let consulta = 0
async function cargar(refrescarDia = true) {
  const id = ++consulta
  const f = fecha.value
  const e = estado.value
  const pedirDia = refrescarDia || fechaDia.value !== f
  cargando.value = true
  vuelosFiltrados.value = []
  try {
    const [dia, filtrados] = await Promise.all([
      pedirDia ? fuente.tablero({ fecha: f }) : vuelosDia.value,
      e ? fuente.tablero({ fecha: f, estado: e }) : [],
    ])
    if (id !== consulta) return
    vuelosDia.value = dia
    fechaDia.value = f
    vuelosFiltrados.value = filtrados
    error.value = null
  } catch (err) {
    if (id === consulta) error.value = err as ApiError
  } finally {
    if (id === consulta) cargando.value = false
  }
}

function alActualizar() {
  vueloCambio.value = null
  void cargar()
}

watch(fecha, () => void cargar())
watch(estado, () => void cargar(false))

watch(
  () => errorAcceso.value === null,
  (esAdmin) => {
    if (!esAdmin) return
    if (listo.value) return void cargar()
    void Promise.all([asegurarAeropuertos().catch(() => (sinAeropuertos.value = true)), cargar()]).then(
      () => (listo.value = true),
    )
  },
  { immediate: true },
)
</script>

<template>
  <MensajeError v-if="errorAcceso" :error="errorAcceso" :texto-sin-sesion="SIN_SESION" />
  <p v-else-if="!listo" class="operaciones__aviso">Cargando…</p>
  <div v-else class="operaciones">
    <h1>Actualización operacional</h1>
    <MensajeError :error="error" :texto-sin-sesion="SIN_SESION" />
    <p v-if="sinAeropuertos" class="operaciones__aviso">
      No se pudieron cargar los aeropuertos: las horas se muestran en hora de Chile.
    </p>
    <ResumenOperaciones :vuelos="vuelosDia" @filtrar="estado = $event" />
    <TablaOperaciones
      v-model:fecha="fecha"
      v-model:estado="estado"
      :vuelos="vuelosTabla"
      :cargando="cargando"
      @refrescar="cargar()"
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
.operaciones__aviso {
  margin: 0;
  color: #64748b;
}
</style>
