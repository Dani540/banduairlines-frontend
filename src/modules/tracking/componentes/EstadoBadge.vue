<script setup lang="ts">
import { ETIQUETA_ESTADO } from '../dominio/estados'
import type { EstadoVuelo } from '../tipos'

withDefaults(defineProps<{ estado: EstadoVuelo; tamano?: 'normal' | 'grande' }>(), { tamano: 'normal' })

const ICONO: Record<EstadoVuelo, string> = {
  PROGRAMADO: '○',
  EMBARCANDO: '➜',
  DESPEGADO: '↗',
  EN_VUELO: '✈',
  ATERRIZADO: '✓',
  RETRASADO: '!',
  CANCELADO: '✕',
}
</script>

<template>
  <span class="estado" :class="[`estado--${estado.toLowerCase()}`, `estado--${tamano}`]">
    <span class="estado__icono" aria-hidden="true">{{ ICONO[estado] }}</span>
    {{ ETIQUETA_ESTADO[estado] }}
  </span>
</template>

<style scoped>
.estado {
  display: inline-flex;
  align-items: center;
  gap: 0.35em;
  border-radius: 999px;
  padding: 0.15em 0.7em;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.5;
  white-space: nowrap;
  background: var(--fondo);
  color: var(--texto);
  border: 1px solid var(--borde);
}
.estado--grande {
  font-size: 1rem;
  padding: 0.3em 0.9em;
}
.estado__icono {
  font-size: 0.9em;
}
.estado--programado { --fondo: #eef2f7; --texto: #2c4a6e; --borde: #c9d5e3; }
.estado--embarcando { --fondo: #e4f2fb; --texto: #0b5c8f; --borde: #b4d9f0; }
.estado--despegado  { --fondo: #e5f4f1; --texto: #0f6b5c; --borde: #b3ddd4; }
.estado--en_vuelo   { --fondo: #e8efff; --texto: #1f4fbf; --borde: #bccdf5; }
.estado--aterrizado { --fondo: #e8f5e9; --texto: #2e6b30; --borde: #bfdfc1; }
.estado--retrasado  { --fondo: #fff4e0; --texto: #8a5200; --borde: #f3d39a; }
.estado--cancelado  { --fondo: #fdecec; --texto: #a12727; --borde: #f2bcbc; }
</style>
