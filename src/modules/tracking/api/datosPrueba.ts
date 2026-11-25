import { fechaChile, sumarMinutos } from '../dominio/tiempo'
import type { Aeropuerto, EstadoVuelo, EventoEstado, OrigenEvento, SeguimientoVuelo } from '../tipos'

export const AEROPUERTOS: Aeropuerto[] = [
  { id: 1, codigoIata: 'SCL', nombre: 'Aeropuerto Internacional Arturo Merino Benítez', ciudad: 'Santiago', pais: 'Chile', zonaHoraria: 'America/Santiago' },
  { id: 2, codigoIata: 'PUQ', nombre: 'Aeropuerto Presidente Carlos Ibáñez del Campo', ciudad: 'Punta Arenas', pais: 'Chile', zonaHoraria: 'America/Punta_Arenas' },
  { id: 3, codigoIata: 'ANF', nombre: 'Aeropuerto Andrés Sabella Gálvez', ciudad: 'Antofagasta', pais: 'Chile', zonaHoraria: 'America/Santiago' },
  { id: 4, codigoIata: 'CCP', nombre: 'Aeropuerto Carriel Sur', ciudad: 'Concepción', pais: 'Chile', zonaHoraria: 'America/Santiago' },
  { id: 5, codigoIata: 'PMC', nombre: 'Aeropuerto El Tepual', ciudad: 'Puerto Montt', pais: 'Chile', zonaHoraria: 'America/Santiago' },
  { id: 6, codigoIata: 'CJC', nombre: 'Aeropuerto El Loa', ciudad: 'Calama', pais: 'Chile', zonaHoraria: 'America/Santiago' },
  { id: 7, codigoIata: 'ZCO', nombre: 'Aeropuerto La Araucanía', ciudad: 'Temuco', pais: 'Chile', zonaHoraria: 'America/Santiago' },
  { id: 8, codigoIata: 'IPC', nombre: 'Aeropuerto Mataveri', ciudad: 'Isla de Pascua', pais: 'Chile', zonaHoraria: 'Pacific/Easter' },
]

/** Seguimiento con los datos internos que el backend no expone pero el mock necesita. */
export interface SeguimientoPrueba extends SeguimientoVuelo {
  salidaReferencia: string
}

export interface DatosPrueba {
  seguimientos: SeguimientoPrueba[]
  /** vueloId de los vuelos reservados por el pasajero de prueba. */
  misVuelos: number[]
  siguienteIdEvento: number
}

type Paso = [estado: EstadoVuelo, minuto: number, origen?: OrigenEvento, motivo?: string]

// Horarios relativos al momento de carga, para que siempre haya vuelos en todos los estados.
export function crearDatosPrueba(ahora: Date = new Date()): DatosPrueba {
  const base = `${fechaChile(ahora).slice(0, 16)}:00`
  const en = (min: number) => sumarMinutos(base, min)
  let idEvento = 1
  let idSeguimiento = 1

  function vuelo(
    vueloId: number,
    codigo: string,
    origen: string,
    destino: string,
    salida: number,
    llegada: number,
    pasos: Paso[],
    retraso = 0,
    reprogramacion = 0,
  ): SeguimientoPrueba {
    const historial: EventoEstado[] = []
    let anterior: EstadoVuelo | null = null
    for (const [estado, minuto, origenEvento = 'SISTEMA', motivo = null] of [['PROGRAMADO', -2880] as Paso, ...pasos]) {
      historial.unshift({
        idEvento: idEvento++,
        estadoAnterior: anterior,
        estadoNuevo: estado,
        fechaCambio: en(minuto),
        origen: origenEvento,
        motivo,
      })
      anterior = estado
    }
    return {
      idSeguimiento: idSeguimiento++,
      vueloId,
      codigoVuelo: codigo,
      origenIata: origen,
      destinoIata: destino,
      salidaProgramada: en(salida + reprogramacion),
      llegadaProgramada: en(llegada + reprogramacion),
      salidaReferencia: en(salida),
      estadoActual: anterior ?? 'PROGRAMADO',
      retrasoMinutos: retraso,
      historial,
    }
  }

  const reprogramadoDe = en(200).replace(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}).*/, '$3-$2-$1 $4')
  const reprogramadoA = en(240).replace(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}).*/, '$3-$2-$1 $4')

  const seguimientos = [
    vuelo(101, 'CL-1291', 'SCL', 'PUQ', -120, 105, [
      ['EMBARCANDO', -150],
      ['DESPEGADO', -110],
      ['EN_VUELO', -95],
    ]),
    vuelo(102, 'CL-1304', 'SCL', 'ANF', -15, 105, [
      ['EMBARCANDO', -45],
      ['DESPEGADO', -5],
    ]),
    vuelo(103, 'CL-1410', 'CCP', 'SCL', 20, 85, [['EMBARCANDO', -10]]),
    vuelo(104, 'CL-1522', 'SCL', 'PMC', 180, 285, []),
    vuelo(105, 'CL-1633', 'PMC', 'SCL', -300, -195, [
      ['EMBARCANDO', -330],
      ['DESPEGADO', -290],
      ['EN_VUELO', -275],
      ['ATERRIZADO', -195],
    ]),
    vuelo(
      106,
      'CL-1745',
      'SCL',
      'CJC',
      200,
      335,
      [['RETRASADO', -60, 'SISTEMA', `Reprogramación detectada: la salida pasó de ${reprogramadoDe} a ${reprogramadoA}.`]],
      40,
      40,
    ),
    vuelo(
      107,
      'CL-1856',
      'ANF',
      'SCL',
      60,
      180,
      [['RETRASADO', -20, 'MANUAL', 'Condiciones meteorológicas. Viento fuerte en la pista de Antofagasta']],
      35,
    ),
    vuelo(108, 'CL-1967', 'SCL', 'IPC', 150, 480, [
      ['CANCELADO', -90, 'MANUAL', 'Falla técnica. Aeronave en mantenimiento no programado'],
    ]),
    vuelo(
      109,
      'CL-2078',
      'ZCO',
      'SCL',
      -10,
      70,
      [
        ['RETRASADO', -70, 'MANUAL', 'Tripulación. Llegada tardía de la tripulación de relevo'],
        ['EMBARCANDO', -5],
      ],
      25,
    ),
    vuelo(110, 'CL-2189', 'SCL', 'CCP', 24 * 60 + 60, 24 * 60 + 130, []),
  ]

  return { seguimientos, misVuelos: [101, 105, 107, 108, 110], siguienteIdEvento: idEvento }
}
