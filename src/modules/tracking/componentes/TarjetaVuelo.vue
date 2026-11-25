<script setup lang="ts">
import type { ResumenVuelo } from '../tipos'

// PENDIENTE (Alonso, RF-04): tarjeta de la lista según la guía §5.5.
defineProps<{ vuelo: ResumenVuelo; activo: boolean }>()
</script>

<template>
  <span>{{ vuelo.codigoVuelo }} · {{ vuelo.estadoActual }}{{ activo ? ' ◀' : '' }}</span>
</template>
