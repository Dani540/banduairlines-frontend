<script setup lang="ts">
import { nextTick, onMounted, ref, useId, watch } from 'vue'

const props = defineProps<{ abierto: boolean; titulo: string }>()
const emit = defineEmits<{ cerrar: [] }>()

const dialogo = ref<HTMLDialogElement | null>(null)
const idTitulo = useId()

// <dialog> con showModal() ya atrapa el foco y deja inerte el resto de la página.
function sincronizar(abierto: boolean) {
  const d = dialogo.value
  if (!d) return
  if (abierto && !d.open) d.showModal()
  if (!abierto && d.open) d.close()
}

watch(
  () => props.abierto,
  (abierto) => nextTick(() => sincronizar(abierto)),
)
onMounted(() => sincronizar(props.abierto))

function alHacerClic(evento: MouseEvent) {
  if (evento.target === dialogo.value) emit('cerrar')
}
</script>

<template>
  <dialog
    ref="dialogo"
    class="modal"
    :aria-labelledby="idTitulo"
    @cancel.prevent="emit('cerrar')"
    @click="alHacerClic"
  >
    <div class="modal__contenido">
      <header class="modal__cabecera">
        <h2 :id="idTitulo" class="modal__titulo">{{ titulo }}</h2>
        <button type="button" class="modal__cerrar" aria-label="Cerrar" @click="emit('cerrar')">✕</button>
      </header>
      <div class="modal__cuerpo">
        <slot v-if="abierto" />
      </div>
      <footer v-if="$slots.acciones" class="modal__acciones">
        <slot name="acciones" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.modal {
  border: 0;
  border-radius: 12px;
  padding: 0;
  width: min(640px, calc(100vw - 2rem));
  max-height: calc(100vh - 2rem);
  box-shadow: 0 20px 50px rgb(0 0 0 / 0.25);
}
.modal::backdrop {
  background: rgb(15 23 42 / 0.45);
}
.modal__contenido {
  padding: 1.25rem 1.5rem;
}
.modal__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
.modal__titulo {
  margin: 0;
  font-size: 1.2rem;
}
.modal__cerrar {
  border: 0;
  background: transparent;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
}
.modal__acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}
</style>
