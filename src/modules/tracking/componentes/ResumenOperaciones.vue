<script setup lang="ts">
import type { EstadoVuelo, ResumenVuelo } from '../tipos'

// PENDIENTE (Javier, RF-07): cuatro indicadores del día según la guía §5.5.
defineProps<{ vuelos: ResumenVuelo[] }>()
const emit = defineEmits<{ filtrar: [estado: EstadoVuelo | null] }>()
</script>

<template>
  <section class="pendiente">
    <strong>ResumenOperaciones</strong> · pendiente (Javier, RF-07) · {{ vuelos.length }} vuelos del día
    <button type="button" @click="emit('filtrar', null)">Ver todos</button>
  </section>
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
