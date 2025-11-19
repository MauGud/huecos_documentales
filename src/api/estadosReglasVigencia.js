/**
 * CONFIGURACIÓN DE REGLAS DE VIGENCIA POR ESTADO
 * 32 entidades federativas con 6 modelos de vigencia
 * Basado en investigación 2015-2025
 */

const MODELOS_VIGENCIA = {
  ANUAL: 'ANUAL',
  BIENAL: 'BIENAL',
  TRIENAL: 'TRIENAL',
  INDEFINIDA: 'INDEFINIDA',
  SIN_TEMPORAL: 'SIN_TEMPORAL',
  CAMBIO_TEMPORAL: 'CAMBIO_TEMPORAL'
};

const ESTADOS_REGLAS = {
  
  // MODELO 1: VIGENCIA ANUAL ESTRICTA (10 estados)
  'BAJA CALIFORNIA': {
    modelo_vigencia: MODELOS_VIGENCIA.ANUAL,
    vigencia_años: 1,
    requiere_refrendo_anual: true,
    plazo_refrendo: {
      mes: 3, // Marzo
      dia: 31,
      diferencia_por_antiguedad: true,
      regla_antiguedad: {
        antiguedad_menor_igual: 9,
        plazo_mes: 3, // Enero-marzo
        plazo_mes_alt: 6 // 10+ años: hasta junio
      }
    },
    vencimiento_tipo: 'FIN_AÑO', // 31 diciembre del año de expedición
    implementa_digital: false,
    notas: 'Plazos diferenciados por antigüedad del vehículo'
  },
  
  'SONORA': {
    modelo_vigencia: MODELOS_VIGENCIA.ANUAL,
    vigencia_años: 1,
    requiere_refrendo_anual: true,
    plazo_refrendo: { mes: 3, dia: 31 },
    vencimiento_tipo: 'FIN_AÑO',
    implementa_digital: false,
    costo_relativo_moto: 0.51, // 51% menos que autos
    notas: 'Recargos trimestrales: 14%, 28%, 42%'
  },
  
  'SINALOA': {
    modelo_vigencia: MODELOS_VIGENCIA.ANUAL,
    vigencia_años: 1,
    requiere_refrendo_anual: true,
    plazo_refrendo: { mes: 3, dia: 31 },
    vencimiento_tipo: 'FIN_AÑO',
    implementa_digital: false
  },
  
  'CHIHUAHUA': {
    modelo_vigencia: MODELOS_VIGENCIA.ANUAL,
    vigencia_años: 1,
    requiere_refrendo_anual: true,
    plazo_refrendo: { mes: 3, dia: 31 },
    vencimiento_tipo: 'FIN_AÑO',
    implementa_digital: false
  },
  
  'OAXACA': {
    modelo_vigencia: MODELOS_VIGENCIA.ANUAL,
    vigencia_años: 1,
    requiere_refrendo_anual: true,
    plazo_refrendo: { mes: 12, dia: 31 },
    vencimiento_tipo: 'FIN_AÑO',
    implementa_digital: false
  },
  
  'MORELOS': {
    modelo_vigencia: MODELOS_VIGENCIA.ANUAL,
    vigencia_años: 1,
    requiere_refrendo_anual: true,
    plazo_refrendo: { 
      mes: 5, // Ampliado a mayo en 2025
      dia: 31,
      ampliacion_temporal: true,
      ampliacion_hasta: '2025-05-31'
    },
    vencimiento_tipo: 'FIN_AÑO',
    implementa_digital: false,
    notas: 'Período renovación ampliado a 5 meses (enero-mayo) en 2025'
  },
  
  'CAMPECHE': {
    modelo_vigencia: MODELOS_VIGENCIA.ANUAL,
    vigencia_años: 1,
    requiere_refrendo_anual: true,
    plazo_refrendo: { mes: 12, dia: 31 },
    vencimiento_tipo: 'FIN_AÑO',
    implementa_digital: false
  },
  
  'QUINTANA ROO': {
    modelo_vigencia: MODELOS_VIGENCIA.ANUAL,
    vigencia_años: 1,
    requiere_refrendo_anual: true,
    plazo_refrendo: { mes: 12, dia: 31 },
    vencimiento_tipo: 'FIN_AÑO',
    implementa_digital: false
  },
  
  'TABASCO': {
    modelo_vigencia: MODELOS_VIGENCIA.ANUAL,
    vigencia_años: 1,
    requiere_refrendo_anual: true,
    plazo_refrendo: { mes: 4, dia: 30 },
    vencimiento_tipo: 'FIN_AÑO',
    implementa_digital: false,
    costo_refrendo_UMA: {
      automovil: 10,
      motocicleta: 3
    }
  },
  
  'AGUASCALIENTES': {
    modelo_vigencia: MODELOS_VIGENCIA.ANUAL,
    vigencia_años: 1,
    requiere_refrendo_anual: true,
    plazo_refrendo: { mes: 3, dia: 31 },
    vencimiento_tipo: 'FIN_AÑO',
    implementa_digital: true,
    fecha_implementacion_digital: '2025-01-01',
    notas: 'Tarjeta digital obligatoria desde enero 2025, sin entrega física'
  },
  
  // MODELO 2: VIGENCIA TRIENAL CON CANJE OBLIGATORIO (6 estados)
  'HIDALGO': {
    modelo_vigencia: MODELOS_VIGENCIA.TRIENAL,
    vigencia_años: 3,
    requiere_refrendo_anual: false,
    periodicidad_canje: 3,
    vencimiento_tipo: 'FECHA_EXPEDICION',
    implementa_digital: false,
    canjes_programados: [
      { año: 2018, cancela_elementos: 2013, acuerdo: 'Acuerdo_2017' },
      { año: 2023, cancela_elementos: 2018, acuerdo: 'Acuerdo_17_nov_2022' }
    ],
    notas: 'Canjes masivos programados, publicación en Periódico Oficial 1 año previo'
  },
  
  'ESTADO DE MEXICO': {
    modelo_vigencia: MODELOS_VIGENCIA.TRIENAL,
    vigencia_años: 3,
    vigencia_placas_años: 5, // Sistema dual único
    requiere_refrendo_anual: false,
    periodicidad_canje: 3,
    vencimiento_tipo: 'FECHA_EXPEDICION',
    implementa_digital: true,
    fecha_implementacion_digital: '2024-09-01',
    costo_tarjeta_digital: 484,
    costo_tarjeta_fisica: 629,
    validacion_QR: true,
    notas: 'Sistema dual: tarjetas 3 años, placas 5 años. Código QR para validación en tiempo real'
  },
  
  'SAN LUIS POTOSI': {
    modelo_vigencia: MODELOS_VIGENCIA.TRIENAL,
    vigencia_años: 3,
    requiere_refrendo_anual: false,
    periodicidad_canje: 3,
    vencimiento_tipo: 'FECHA_EXPEDICION',
    implementa_digital: false,
    ciclos_renovacion: [2022, 2025, 2028, 2031],
    cambio_formato_2025: true,
    formato_anterior: 'PVC',
    formato_actual: 'papel_seguridad', // Hologramas, microtextos, códigos bidimensionales
    notas: 'Cambio de PVC a papel de seguridad enero 2025, conforme NOM-001-SCT-2-2016'
  },
  
  'COLIMA': {
    modelo_vigencia: MODELOS_VIGENCIA.TRIENAL,
    vigencia_años: null, // Tarjeta permanente
    requiere_refrendo_anual: false,
    requiere_calcomanía_anual: true,
    vencimiento_tipo: 'PERMANENTE',
    implementa_digital: false,
    notas: 'Tarjeta permanente pero requiere renovación anual de calcomanía fiscal (sistema dual)'
  },
  
  'GUERRERO': {
    modelo_vigencia: MODELOS_VIGENCIA.TRIENAL,
    vigencia_años: 3,
    requiere_refrendo_anual: false,
    periodicidad_canje: 3,
    vencimiento_tipo: 'FECHA_EXPEDICION',
    implementa_digital: false
  },
  
  'COAHUILA': {
    modelo_vigencia: MODELOS_VIGENCIA.TRIENAL,
    vigencia_años: 3,
    requiere_refrendo_anual: false,
    periodicidad_canje: 3,
    vencimiento_tipo: 'FECHA_EXPEDICION',
    implementa_digital: false,
    notas: 'Canje de placas cada 3 años con tarjeta incluida'
  },
  
  // MODELO 3: VIGENCIA INDEFINIDA CON REFRENDO ANUAL (7 estados)
  'NUEVO LEON': {
    modelo_vigencia: MODELOS_VIGENCIA.INDEFINIDA,
    vigencia_años: null,
    requiere_refrendo_anual: true,
    plazo_refrendo: { mes: 3, dia: 31 },
    vencimiento_tipo: 'INDEFINIDA',
    implementa_digital: true,
    fecha_implementacion_digital: '2016-01-01',
    tarjeta_complementaria_digital: true,
    url_descarga: 'icvnl.gob.mx',
    elimino_calcomanías: true,
    fecha_eliminacion_calcomanías: '2018-01-01',
    evoluciones_texto_tarjeta: [
      { desde: '2016-01-01', hasta: '2020-03-31', texto: 'VIGENCIA INDEFINIDA' },
      { desde: '2020-04-01', hasta: null, texto: 'VIGENCIA CONDICIONADA AL PAGO DEL REFRENDO ANUAL' }
    ],
    notas: 'Primer sistema de vigencia indefinida del país (2016). Tarjeta Complementaria Digital acredita pago de refrendo'
  },
  
  'GUANAJUATO': {
    modelo_vigencia: MODELOS_VIGENCIA.INDEFINIDA,
    vigencia_años: null,
    requiere_refrendo_anual: true,
    vencimiento_tipo: 'INDEFINIDA',
    implementa_digital: false,
    exencion_vehiculos_electricos: true,
    notas: 'Tarjeta indefinida mientras registrada en padrón'
  },
  
  'ZACATECAS': {
    modelo_vigencia: MODELOS_VIGENCIA.INDEFINIDA,
    vigencia_años: null,
    requiere_refrendo_anual: false, // HUECO DOCUMENTAL
    vencimiento_tipo: 'INDEFINIDA',
    implementa_digital: false,
    hueco_documental: true,
    notas: 'CRÍTICO: No especifica vigencia temporal en legislación. Sistema de registro permanente sin renovación periódica clara'
  },
  
  'DURANGO': {
    modelo_vigencia: MODELOS_VIGENCIA.INDEFINIDA,
    vigencia_años: null,
    requiere_refrendo_anual: true,
    periodicidad_reemplacamiento: 6, // Cambio 2022: antes 8 años
    vencimiento_tipo: 'INDEFINIDA',
    implementa_digital: false,
    cambio_reglamentario_2022: true,
    notas: 'Reemplacamiento cada 6 años desde reforma 2022 (anteriormente 8 años)'
  },
  
  'VERACRUZ': {
    modelo_vigencia: MODELOS_VIGENCIA.INDEFINIDA,
    vigencia_años: null,
    requiere_refrendo_anual: true,
    vencimiento_tipo: 'INDEFINIDA',
    implementa_digital: false,
    requiere_seguro_RC_obligatorio: true, // Desde 2019
    notas: 'Seguro Responsabilidad Civil obligatorio desde 2019 según Ley de Caminos'
  },
  
  'TLAXCALA': {
    modelo_vigencia: MODELOS_VIGENCIA.INDEFINIDA,
    vigencia_años: null,
    requiere_refrendo_anual: true,
    vencimiento_tipo: 'INDEFINIDA',
    implementa_digital: false
  },
  
  'BAJA CALIFORNIA SUR': {
    modelo_vigencia: MODELOS_VIGENCIA.INDEFINIDA,
    vigencia_años: null,
    requiere_refrendo_anual: false,
    elimino_refrendo: true,
    fecha_eliminacion_refrendo: '2015-01-01',
    requiere_revista_vehicular_anual: true,
    vencimiento_tipo: 'INDEFINIDA',
    implementa_digital: false,
    hueco_documental: true,
    notas: 'ÚNICO: Eliminó refrendo en 2015. Solo requiere pago anual de "revista vehicular" (verificación). Sistema sin refrendo NO claramente documentado en legislación'
  },
  
  // MODELO 4: VIGENCIA BIENAL (1 estado)
  'QUERETARO': {
    modelo_vigencia: MODELOS_VIGENCIA.BIENAL,
    vigencia_años: 2,
    requiere_refrendo_anual: false,
    vencimiento_tipo: 'FECHA_EXPEDICION',
    implementa_digital: false,
    renovacion_aislada_disponible: false,
    opciones_renovacion: ['Cambio_propietario', 'Alta_placas', 'Reemplacamiento'],
    tarjetas_previas_invalidadas: true,
    fecha_invalidacion_tarjetas_antiguas: '2018-03-31', // Decreto Ley UMA 2017
    tarjeta_minima_requerida: '2013',
    notas: 'Vigencia 2 años desde expedición. NO hay renovación aislada de tarjeta. Tarjetas pre-2013 sin vigencia'
  },
  
  // MODELO 5: CAMBIO TEMPORAL DE VIGENCIA (2 estados)
  'CHIAPAS': {
    modelo_vigencia: MODELOS_VIGENCIA.CAMBIO_TEMPORAL,
    cambio_sistema_año: 2018,
    sistema_anterior: {
      hasta: '2017-12-31',
      modelo: 'PERMANENTE',
      requiere_refrendo: true
    },
    sistema_actual: {
      desde: '2018-01-01',
      modelo: 'ANUAL',
      vigencia_años: 1,
      requiere_refrendo: true,
      plazo_refrendo: { mes: 12, dia: 31 }
    },
    reforma_legislativa: {
      fecha: '2016-12-31',
      documento: 'Código de la Hacienda Pública Art. 36',
      publicacion: 'Periódico Oficial 31-dic-2016'
    },
    vencimiento_tipo: 'CAMBIO_TEMPORAL',
    implementa_digital: false,
    programa_canje_2025: {
      desde: '2025-02-01',
      hasta: '2025-06-30',
      descuentos: [
        { mes: 2, descuento: 0.15 },
        { mes: 3, descuento: 0.10 },
        { mes: 4, descuento: 0.05 }
      ],
      condonacion_multas: true
    },
    notas: 'CAMBIO CRÍTICO: Tarjetas permanentes hasta 2017 → anuales desde 2018. Tarjetas pre-2018 mantienen vigencia indefinida SI refrendo al corriente'
  },
  
  'YUCATAN': {
    modelo_vigencia: MODELOS_VIGENCIA.CAMBIO_TEMPORAL,
    modelo_base: 'TRIENAL',
    vigencia_años: 3,
    requiere_refrendo_anual: true,
    implementa_digital: true,
    fecha_implementacion_digital: '2020-01-01',
    vencimiento_tipo: 'CAMBIO_TEMPORAL',
    
    // MÚLTIPLES PRÓRROGAS COVID-19 Y POLÍTICAS SOCIALES
    decretos_prorroga: [
      {
        numero: '338/2020',
        fecha: '2020-12-31',
        descripcion: 'Suspende reemplacamiento 2020 → enero 2022',
        extiende_vigencia_hasta: '2021-12-31',
        condona_refrendo_2021: true
      },
      {
        numero: '597/2022',
        fecha: '2022-08-01',
        descripcion: 'Autoriza refrendo tarjetas emitidas 2020',
        extiende_vigencia_hasta: '2022-08-30'
      },
      {
        numero: '598/2022',
        fecha: '2022-08-01',
        descripcion: 'Segunda prórroga reemplacamiento',
        extiende_vigencia_hasta: '2022-09-30'
      },
      {
        numero: '718/2023',
        fecha: '2023-12-01',
        descripcion: 'Refrendo digital sin costo para tarjetas venciendo 31-dic-2023',
        extiende_vigencia_hasta: '2023-12-31',
        tarjeta_digital_gratuita: true
      },
      {
        numero: '44/2024',
        fecha: '2024-01-01',
        descripcion: 'Ampliación vigencia todas las tarjetas hasta 31-mayo-2025 (apoyo economía familiar)',
        extiende_vigencia_hasta: '2025-05-31',
        reemplacamiento_programado: '2025-06-01',
        razon: 'Apoyo economía familiar en cuesta de enero'
      }
    ],
    
    vigencia_extendida_hasta: '2025-05-31', // Decreto 44/2024 activo
    reemplacamiento_general_programado: '2025-06-01',
    
    notas: 'ESTADO MÁS AFECTADO POR DISRUPCIONES: 5 decretos de prórroga (2020-2024). Pionero en tarjeta digital sureste. Reemplacamiento 2020 pospuesto hasta junio 2025'
  },
  
  // MODELO 6: SISTEMAS SIN VIGENCIA TEMPORAL DOCUMENTADA (6 estados)
  'PUEBLA': {
    modelo_vigencia: MODELOS_VIGENCIA.SIN_TEMPORAL,
    vigencia_años: null,
    requiere_refrendo_anual: false,
    vencimiento_tipo: 'POR_EVENTOS',
    implementa_digital: false,
    
    renovacion_masiva_obligatoria: {
      fecha_inicio: '2018-02-06',
      fecha_fin: '2018-06-29',
      descripcion: 'Cambio obligatorio formato papel enmicado → PVC',
      costo_gratuito_si_al_corriente: true,
      costo_con_adeudos: 430,
      todas_tarjetas_anteriores_invalidadas: true
    },
    
    renovacion_por_eventos: [
      'Cambio de propietario',
      'Cambio características vehículo',
      'Pérdida o robo',
      'Deterioro'
    ],
    
    hueco_documental: true,
    notas: 'RENOVACIÓN MASIVA OBLIGATORIA 2018: Todas las tarjetas papel pre-2018 quedaron sin validez. Post-2018: sin vigencia temporal clara, renovación solo por eventos'
  },
  
  'JALISCO': {
    modelo_vigencia: MODELOS_VIGENCIA.SIN_TEMPORAL,
    vigencia_años: 4, // Solo para automóviles
    requiere_refrendo_anual: false,
    vencimiento_tipo: 'POR_EVENTOS',
    implementa_digital: false,
    
    sistema_2021_automoviles: {
      desde: '2021-01-01',
      vigencia_años: 4,
      tipo_vehiculo: 'AUTOMOVIL',
      formato: 'plastificada',
      elimina_holograma_anual: true
    },
    
    sistema_motocicletas: null, // HUECO DOCUMENTAL CRÍTICO
    
    hueco_documental: true,
    notas: 'HUECO CRÍTICO: Tarjetas plastificadas 4 años "únicamente para automóviles" (comunicados 2021). Sistema para MOTOCICLETAS no clarificado'
  },
  
  'NAYARIT': {
    modelo_vigencia: MODELOS_VIGENCIA.SIN_TEMPORAL,
    vigencia_años: null,
    requiere_refrendo_anual: false,
    vencimiento_tipo: 'POR_EVENTOS',
    implementa_digital: false,
    hueco_documental: true,
    notas: 'Vigencia temporal no especificada. Programas "Borrón y Placas Nuevas" con información incompleta'
  },
  
  'MICHOACAN': {
    modelo_vigencia: MODELOS_VIGENCIA.SIN_TEMPORAL,
    vigencia_años: null,
    requiere_refrendo_anual: false,
    vencimiento_tipo: 'POR_EVENTOS',
    implementa_digital: false,
    hueco_documental: true,
    ultima_reforma_reglamento: 2007,
    notas: 'HUECO DOCUMENTAL SEVERO: Última reforma Reglamento 2007. Información 2015-2020 escasa'
  },
  
  'TAMAULIPAS': {
    modelo_vigencia: MODELOS_VIGENCIA.SIN_TEMPORAL,
    vigencia_años: null,
    requiere_refrendo_anual: true,
    vencimiento_tipo: 'POR_EVENTOS',
    implementa_digital: false,
    
    requiere_seguro_RC_obligatorio: true,
    seguro_RC_desde: '2016-07-01', // Decreto LXII-981
    implementacion_efectiva_seguro: '2018-02-01',
    multa_sin_seguro_UMA: { min: 40, max: 60 },
    multa_no_condonable: true,
    
    notas: 'ÚNICO noreste con seguro RC obligatorio desde 2016 (efectivo 2018). Multas 40-60 UMA no condonables. Vigencia tarjeta física no especificada claramente'
  },
  
  // ESTADO ADICIONAL: CIUDAD DE MÉXICO
  'CIUDAD DE MEXICO': {
    modelo_vigencia: MODELOS_VIGENCIA.INDEFINIDA,
    vigencia_años: null,
    requiere_refrendo_anual: true,
    vencimiento_tipo: 'INDEFINIDA',
    implementa_digital: true,
    fecha_implementacion_digital: '2019-04-24',
    reforma_legal: 'Reglamento Ley de Movilidad Art. XIX BIS',
    url_descarga: 'App CDMX',
    validez_digital_equivalente_fisica: true,
    notas: 'Tarjeta digital desde abril 2019 con validez legal equivalente a física. Descargable desde App CDMX'
  }
};

module.exports = {
  ESTADOS_REGLAS,
  MODELOS_VIGENCIA
};

