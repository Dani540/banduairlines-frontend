<script setup lang="ts">
import { ref } from 'vue'
import { crearError } from '../src/modules/tracking/api/errores'
import EstadoBadge from '../src/modules/tracking/componentes/EstadoBadge.vue'
import MensajeError from '../src/modules/tracking/componentes/MensajeError.vue'
import ModalBase from '../src/modules/tracking/componentes/ModalBase.vue'
import { ESTADOS } from '../src/modules/tracking/dominio/estados'

const ERRORES = [
  crearError(0, 'SIN_CONEXION', '', '/'),
  crearError(401, 'NO_AUTENTICADO', 'Autenticación requerida', '/'),
  crearError(403, 'ACCESO_DENEGADO', 'No tienes permisos para esta acción', '/'),
  crearError(422, 'MOTIVO_REQUERIDO', 'El cambio a RETRASADO requiere un motivo.', '/'),
  crearError(400, 'VALIDACION', 'Los datos enviados no son válidos', '/', [
    { campo: 'retrasoMinutos', mensaje: 'los minutos de retraso deben ser mayores a cero' },
  ]),
]
const modalAbierto = ref(false)
</script>

<template>
  <h1>Catálogo de piezas base</h1>
  <p>Componentes de Dani que el resto usa sin editar. Solo existe en el stub.</p>

  <h2>EstadoBadge</h2>
  <div class="fila">
    <EstadoBadge v-for="e in ESTADOS" :key="e" :estado="e" />
  </div>
  <div class="fila">
    <EstadoBadge v-for="e in ESTADOS" :key="e" :estado="e" tamano="grande" />
  </div>

  <h2>MensajeError</h2>
  <div class="columna">
    <MensajeError v-for="e in ERRORES" :key="e.code" :error="e" />
  </div>

  <h2>ModalBase</h2>
  <button type="button" @click="modalAbierto = true">Abrir modal</button>
  <ModalBase :abierto="modalAbierto" titulo="Título del modal" @cerrar="modalAbierto = false">
    <p>Contenido. Se cierra con Esc, con ✕ o haciendo clic fuera.</p>
    <template #acciones>
      <button type="button" @click="modalAbierto = false">Aceptar</button>
    </template>
  </ModalBase>
</template>

<style scoped>
.fila {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.columna {
  display: grid;
  gap: 0.75rem;
}
</style>
