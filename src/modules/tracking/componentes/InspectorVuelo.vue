<script setup lang="ts">
import type { SeguimientoVuelo } from '../tipos'

// PENDIENTE (José, RF-01): detalle del vuelo según la guía §5.5.
defineProps<{ vueloId: number | null; seguimiento?: SeguimientoVuelo }>()
</script>

<template>
  <section class="pendiente">
    <strong>InspectorVuelo</strong> · pendiente (José, RF-01)
    <p>vueloId: {{ vueloId ?? '—' }} · seguimiento recibido: {{ seguimiento ? seguimiento.codigoVuelo : 'no (lo pide con obtenerPorId)' }}</p>
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
