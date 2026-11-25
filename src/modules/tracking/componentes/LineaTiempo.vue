<script setup lang="ts">
import type { EventoEstado } from '../tipos'

// PENDIENTE (José, RF-03): historial de estados según la guía §5.5.
defineProps<{ historial: EventoEstado[] }>()
</script>

<template>
  <section class="pendiente">
    <strong>LineaTiempo</strong> · pendiente (José, RF-03) · {{ historial.length }} eventos
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
