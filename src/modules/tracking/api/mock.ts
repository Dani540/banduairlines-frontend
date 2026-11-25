import { ESTADOS } from '../dominio/estados'
import { requiereMotivo } from '../dominio/transiciones'
import { fechaChile, hoyChile, minutosEntre } from '../dominio/tiempo'
import { rolActual } from '../sesion'
import type { ActualizarEstado, DetalleError, ResumenVuelo, Rol, SeguimientoVuelo } from '../tipos'
import { AEROPUERTOS, crearDatosPrueba, type DatosPrueba, type SeguimientoPrueba } from './datosPrueba'
import { crearError } from './errores'
import type { FuenteTracking } from './fuente'

// Imita al backend (develop@fa04b6f): mismos códigos de error y mismas reglas. Los estados no avanzan solos.
const LATENCIA_MS = 300
const ESTADOS_VALIDOS = new Set<string>(ESTADOS)
const MAL_FORMADA = 'La petición está mal formada o contiene un tipo de dato incorrecto'
const DESTINOS: Record<string, readonly string[]> = {
  PROGRAMADO: ['EMBARCANDO', 'RETRASADO', 'CANCELADO'],
  RETRASADO: ['EMBARCANDO', 'RETRASADO', 'CANCELADO'],
  EMBARCANDO: ['DESPEGADO', 'RETRASADO', 'CANCELADO'],
  DESPEGADO: ['EN_VUELO'],
  EN_VUELO: ['ATERRIZADO'],
}

// Perezoso: sin efectos al importar, para que el build con fuente http descarte el mock.
let datosCreados: DatosPrueba | null = null
const datos = () => (datosCreados ??= crearDatosPrueba())

function exigirId(vueloId: number, ruta: string): void {
  if (!Number.isSafeInteger(vueloId)) throw crearError(400, 'PETICION_MALFORMADA', MAL_FORMADA, ruta)
}

function esFechaValida(fecha: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha)
  if (!m) return false
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3]
}

function responder<T>(ruta: string, roles: Rol[] | null, calcular: () => T): Promise<T> {
  return new Promise((resolver, rechazar) => {
    setTimeout(() => {
      try {
        if (roles) {
          const rol = rolActual()
          if (!rol) throw crearError(401, 'NO_AUTENTICADO', 'Autenticación requerida', ruta)
          if (!roles.includes(rol)) throw crearError(403, 'ACCESO_DENEGADO', 'No tienes permisos para esta acción', ruta)
        }
        resolver(structuredClone(calcular()))
      } catch (e) {
        rechazar(e)
      }
    }, LATENCIA_MS)
  })
}

function aDetalle({ salidaReferencia: _, ...seg }: SeguimientoPrueba): SeguimientoVuelo {
  return seg
}

function aResumen(seg: SeguimientoPrueba): ResumenVuelo {
  return {
    idSeguimiento: seg.idSeguimiento,
    vueloId: seg.vueloId,
    codigoVuelo: seg.codigoVuelo,
    origenIata: seg.origenIata,
    destinoIata: seg.destinoIata,
    salidaProgramada: seg.salidaProgramada,
    estadoActual: seg.estadoActual,
    retrasoMinutos: seg.retrasoMinutos,
    ultimaActualizacion: seg.historial[0].fechaCambio,
  }
}

function buscar(vueloId: number, ruta: string, mensaje: string): SeguimientoPrueba {
  const seg = datos().seguimientos.find((s) => s.vueloId === vueloId)
  if (!seg) throw crearError(404, 'VUELO_NO_ENCONTRADO', mensaje, ruta)
  return seg
}

function porSalida(a: SeguimientoPrueba, b: SeguimientoPrueba): number {
  return a.salidaProgramada.localeCompare(b.salidaProgramada)
}

export const fuenteMock: FuenteTracking = {
  obtenerPorId(vueloId) {
    const ruta = `/api/v1/tracking/vuelos/${vueloId}`
    return responder(ruta, ['PASAJERO', 'ADMINISTRADOR'], () => {
      exigirId(vueloId, ruta)
      return aDetalle(buscar(vueloId, ruta, `No existe seguimiento inicializado para el vuelo con ID: ${vueloId}`))
    })
  },

  obtenerPorCodigo(codigo) {
    const ruta = `/api/v1/tracking/vuelos/codigo/${encodeURIComponent(codigo)}`
    return responder(ruta, ['PASAJERO', 'ADMINISTRADOR'], () => {
      const seg = datos().seguimientos.find((s) => s.codigoVuelo === codigo)
      if (!seg) {
        throw crearError(404, 'VUELO_NO_ENCONTRADO', `No existe seguimiento inicializado para el vuelo con código: ${codigo}`, ruta)
      }
      return aDetalle(seg)
    })
  },

  misVuelos() {
    return responder('/api/v1/tracking/mis-vuelos', ['PASAJERO'], () =>
      datos().seguimientos.filter((s) => datos().misVuelos.includes(s.vueloId)).sort(porSalida).map(aResumen),
    )
  },

  tablero(filtro = {}) {
    const ruta = '/api/v1/admin/tracking/tablero'
    return responder(ruta, ['ADMINISTRADOR'], () => {
      if (filtro.estado && !ESTADOS_VALIDOS.has(filtro.estado)) {
        throw crearError(400, 'PETICION_MALFORMADA', MAL_FORMADA, ruta)
      }
      if (filtro.fecha && !esFechaValida(filtro.fecha)) throw crearError(400, 'PETICION_MALFORMADA', MAL_FORMADA, ruta)
      const fecha = filtro.fecha ?? hoyChile()
      return datos().seguimientos
        .filter((s) => s.salidaProgramada.startsWith(fecha) && (!filtro.estado || s.estadoActual === filtro.estado))
        .sort(porSalida)
        .map(aResumen)
    })
  },

  actualizarEstado(vueloId, cuerpo: ActualizarEstado) {
    const ruta = `/api/v1/admin/tracking/vuelos/${vueloId}/estado`
    return responder(ruta, ['ADMINISTRADOR'], () => {
      exigirId(vueloId, ruta)
      const detalles: DetalleError[] = []
      if (cuerpo.nuevoEstado && !ESTADOS_VALIDOS.has(cuerpo.nuevoEstado)) {
        throw crearError(400, 'PETICION_MALFORMADA', MAL_FORMADA, ruta)
      }
      // Jackson trunca los decimales al leer un Integer; Infinity y NaN viajan como null.
      const retraso =
        cuerpo.retrasoMinutos != null && Number.isFinite(cuerpo.retrasoMinutos) ? Math.trunc(cuerpo.retrasoMinutos) : null
      if (!cuerpo.nuevoEstado) detalles.push({ campo: 'nuevoEstado', mensaje: 'el nuevo estado es obligatorio' })
      if (cuerpo.motivo && cuerpo.motivo.length > 500) {
        detalles.push({ campo: 'motivo', mensaje: 'el motivo no puede superar los 500 caracteres' })
      }
      if (retraso != null && retraso <= 0) {
        detalles.push({ campo: 'retrasoMinutos', mensaje: 'los minutos de retraso deben ser mayores a cero' })
      }
      if (detalles.length) throw crearError(400, 'VALIDACION', 'Los datos enviados no son válidos', ruta, detalles)

      const seg = buscar(vueloId, ruta, `No existe seguimiento para el vuelo: ${vueloId}`)
      const actual = seg.estadoActual
      const nuevo = cuerpo.nuevoEstado
      if (!(DESTINOS[actual] ?? []).includes(nuevo)) {
        throw crearError(422, 'TRANSICION_ESTADO_INVALIDA', `No se permite la transición de ${actual} a ${nuevo}.`, ruta)
      }
      if (nuevo === 'EN_VUELO' || nuevo === 'ATERRIZADO') {
        throw crearError(
          422,
          'TRANSICION_ESTADO_INVALIDA',
          `La transición de ${actual} a ${nuevo} solo la produce el sistema según el horario.`,
          ruta,
        )
      }
      const motivo = requiereMotivo(nuevo) && cuerpo.motivo?.trim() ? cuerpo.motivo.trim() : null
      if (requiereMotivo(nuevo) && !motivo) {
        throw crearError(422, 'MOTIVO_REQUERIDO', `El cambio a ${nuevo} requiere un motivo.`, ruta)
      }

      const ahora = fechaChile(new Date())
      if (nuevo === 'RETRASADO') {
        seg.retrasoMinutos = retraso ?? Math.max(0, minutosEntre(seg.salidaReferencia, seg.salidaProgramada))
      }
      seg.historial.unshift({
        idEvento: datos().siguienteIdEvento++,
        estadoAnterior: actual,
        estadoNuevo: nuevo,
        fechaCambio: ahora,
        origen: 'MANUAL',
        motivo,
      })
      seg.estadoActual = nuevo
      return aDetalle(seg)
    })
  },

  aeropuertos() {
    return responder('/api/v1/busqueda/aeropuertos', null, () => AEROPUERTOS)
  },
}
