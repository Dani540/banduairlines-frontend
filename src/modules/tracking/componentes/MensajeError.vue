<script setup lang="ts">
import { computed } from 'vue'
import { solicitarInicioSesion } from '../sesion'
import type { ApiError } from '../tipos'

const props = defineProps<{ error: ApiError | null; textoSinSesion?: string }>()

const texto = computed(() => {
  const e = props.error
  if (!e) return ''
  switch (e.status) {
    case 0:
      return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'
    case 401:
      // La especificación declara pública la consulta (CU-01, CU-02), pero el backend exige sesión.
      return (
        props.textoSinSesion ??
        'La consulta sin cuenta todavía no está habilitada en el servidor. Inicia sesión para ver el estado de tu vuelo.'
      )
    case 403:
      return 'Tu cuenta no tiene permiso para ver esta información.'
    case 400:
    case 404:
    case 422:
      return e.message
    default:
      return 'Ocurrió un error inesperado. Inténtalo más tarde.'
  }
})
</script>

<template>
  <div v-if="error" class="mensaje-error" role="alert">
    <p class="mensaje-error__texto">{{ texto }}</p>
    <ul v-if="error.details.length" class="mensaje-error__detalles">
      <li v-for="d in error.details" :key="d.campo">{{ d.mensaje }}</li>
    </ul>
    <button v-if="error.status === 401" type="button" class="mensaje-error__accion" @click="solicitarInicioSesion">
      Iniciar sesión
    </button>
  </div>
</template>

<style scoped>
.mensaje-error {
  border: 1px solid #f2bcbc;
  background: #fdf3f3;
  color: #7a1f1f;
  border-radius: 8px;
  padding: 0.75rem 1rem;
}
.mensaje-error__texto {
  margin: 0;
}
.mensaje-error__detalles {
  margin: 0.5rem 0 0;
  padding-left: 1.2rem;
}
.mensaje-error__accion {
  margin-top: 0.6rem;
  border: 0;
  border-radius: 6px;
  padding: 0.4rem 0.9rem;
  background: #7a1f1f;
  color: #fff;
  cursor: pointer;
}
</style>
