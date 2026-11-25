<script setup lang="ts">
import type { ResumenVuelo } from '../tipos'
import TarjetaVuelo from './TarjetaVuelo.vue'

// PENDIENTE (Alonso, RF-04): lista con filtros y orden según la guía §5.5.
defineProps<{ vuelos: ResumenVuelo[]; seleccionado: number | null }>()
const emit = defineEmits<{ seleccionar: [vueloId: number] }>()
</script>

<template>
  <section class="pendiente">
    <strong>ListaVuelos</strong> · pendiente (Alonso, RF-04) · {{ vuelos.length }} vuelos
    <ul>
      <li v-for="v in vuelos" :key="v.vueloId">
        <button type="button" @click="emit('seleccionar', v.vueloId)">
          <TarjetaVuelo :vuelo="v" :activo="v.vueloId === seleccionado" />
        </button>
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
