<script setup lang="ts">
import type { EstadoVuelo, ResumenVuelo } from '../tipos'

// PENDIENTE (Alonso, RF-07): tabla, filtros, paginación y CSV.
defineProps<{ vuelos: ResumenVuelo[]; fecha: string; estado: EstadoVuelo | null; cargando: boolean }>()
const emit = defineEmits<{
  'update:fecha': [fecha: string]
  'update:estado': [estado: EstadoVuelo | null]
  refrescar: []
  actualizar: [vueloId: number]
  verHistorial: [vueloId: number]
}>()
</script>

<template>
  <section class="pendiente">
    <strong>TablaOperaciones</strong> · pendiente (Alonso, RF-07) · {{ fecha }} · estado: {{ estado ?? 'todos' }}
    · {{ cargando ? 'cargando…' : `${vuelos.length} vuelos` }}
    <button type="button" @click="emit('refrescar')">Refrescar</button>
    <ul>
      <li v-for="v in vuelos" :key="v.vueloId">
        {{ v.codigoVuelo }} · {{ v.estadoActual }}
        <button type="button" @click="emit('actualizar', v.vueloId)">Actualizar</button>
        <button type="button" @click="emit('verHistorial', v.vueloId)">Ver historial</button>
      </li>
    </ul>
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
