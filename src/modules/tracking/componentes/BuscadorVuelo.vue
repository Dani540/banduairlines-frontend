<script setup lang="ts">
import { ref } from 'vue'
import { fuente } from '../api/fuente'
import type { ApiError, SeguimientoVuelo } from '../tipos'

// PENDIENTE (José, RF-01): reemplazar este cableado mínimo.
const emit = defineEmits<{ encontrado: [seg: SeguimientoVuelo]; error: [e: ApiError] }>()
const codigo = ref('')

let consulta = 0
function buscar() {
  const texto = codigo.value.trim()
  if (!texto) return
  const id = ++consulta
  fuente
    .obtenerPorCodigo(texto)
    .then((seg) => id === consulta && emit('encontrado', seg))
    .catch((e: ApiError) => id === consulta && emit('error', e))
}
</script>

<template>
  <form class="pendiente" @submit.prevent="buscar">
    <strong>BuscadorVuelo</strong>: pendiente (José, RF-01)
    <input v-model="codigo" placeholder="CL-1291" aria-label="Código de vuelo" />
    <button type="submit">Buscar</button>
  </form>
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
