<script setup lang="ts">
import type { SeguimientoVuelo } from '../tipos'
import ModalBase from './ModalBase.vue'

// PENDIENTE (Javier, RF-08 / RF-02): formulario de cambio manual según la guía §5.5.
defineProps<{ vueloId: number | null }>()
const emit = defineEmits<{ cerrar: []; actualizado: [seg: SeguimientoVuelo] }>()
</script>

<template>
  <ModalBase :abierto="vueloId !== null" titulo="Actualizar estado" @cerrar="emit('cerrar')">
    <p class="pendiente"><strong>ModalCambioEstado</strong> · pendiente (Javier, RF-08) · vuelo {{ vueloId }}</p>
  </ModalBase>
</template>

<style scoped>
.pendiente {
  border: 2px dashed #9aa8b8;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #475569;
  background: #f8fafc;
}
.pendiente strong {
  color: #1e293b;
}
</style>
