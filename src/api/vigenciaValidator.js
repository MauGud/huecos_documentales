const { ESTADOS_REGLAS, MODELOS_VIGENCIA } = require('./estadosReglasVigencia');

/**
 * Normaliza el nombre de un estado para buscar en la tabla de reglas
 * Quita acentos y normaliza a mayúsculas
 */
function normalizarNombreEstado(estado) {
  if (!estado) return '';
  
  return estado
    .toUpperCase()
    .normalize('NFD') // Descompone caracteres con acentos
    .replace(/[\u0300-\u036f]/g, '') // Elimina marcas diacríticas (tildes)
    .trim();
}

/**
 * ALGORITMO MAESTRO DE DETERMINACIÓN DE VIGENCIA
 * Implementa lógica específica para cada modelo de vigencia
 */
function verificarVigenciaTarjeta(tarjetaNormalizada, fechaConsulta) {
  const estado = tarjetaNormalizada.estadoEmisor;
  const fechaExpedicion = parseDate(tarjetaNormalizada.fechaExpedicion);
  const fechaVigenciaExplicita = parseDate(tarjetaNormalizada.fechaVigencia);
  
  if (!estado || !fechaExpedicion) {
    return {
      vigente: null,
      razon: 'Datos insuficientes para validar vigencia',
      estado_evaluado: null,
      tipo_validacion: null
    };
  }
  
  const estadoNormalizado = normalizarNombreEstado(estado);
  const reglas = ESTADOS_REGLAS[estadoNormalizado];
  
  if (!reglas) {
    return {
      vigente: null,
      razon: `Estado "${estado}" no encontrado en tabla de reglas`,
      estado_evaluado: estado,
      tipo_validacion: null
    };
  }
  
  const modeloVigencia = reglas.modelo_vigencia;
  
  // MODELO 1: VIGENCIA ANUAL ESTRICTA
  if (modeloVigencia === MODELOS_VIGENCIA.ANUAL) {
    return validarVigenciaAnual(tarjetaNormalizada, fechaConsulta, reglas);
  }
  
  // MODELO 2: VIGENCIA TRIENAL
  if (modeloVigencia === MODELOS_VIGENCIA.TRIENAL) {
    return validarVigenciaTrienal(tarjetaNormalizada, fechaConsulta, reglas);
  }
  
  // MODELO 3: VIGENCIA INDEFINIDA
  if (modeloVigencia === MODELOS_VIGENCIA.INDEFINIDA) {
    return validarVigenciaIndefinida(tarjetaNormalizada, fechaConsulta, reglas);
  }
  
  // MODELO 4: VIGENCIA BIENAL
  if (modeloVigencia === MODELOS_VIGENCIA.BIENAL) {
    return validarVigenciaBienal(tarjetaNormalizada, fechaConsulta, reglas);
  }
  
  // MODELO 5: CAMBIO TEMPORAL
  if (modeloVigencia === MODELOS_VIGENCIA.CAMBIO_TEMPORAL) {
    return validarVigenciaCambioTemporal(tarjetaNormalizada, fechaConsulta, reglas);
  }
  
  // MODELO 6: SIN VIGENCIA TEMPORAL
  if (modeloVigencia === MODELOS_VIGENCIA.SIN_TEMPORAL) {
    return validarVigenciaSinTemporal(tarjetaNormalizada, fechaConsulta, reglas);
  }
  
  return {
    vigente: null,
    razon: `Modelo de vigencia "${modeloVigencia}" no implementado`,
    estado_evaluado: estado,
    tipo_validacion: null
  };
}

/**
 * MODELO 1: Validación de vigencia anual
 */
function validarVigenciaAnual(tarjeta, fechaConsulta, reglas) {
  const fechaExp = parseDate(tarjeta.fechaExpedicion);
  const añoExp = fechaExp.getFullYear();
  const añoConsulta = fechaConsulta.getFullYear();
  
  // Regla base: vigente solo en el año de expedición
  if (añoExp === añoConsulta) {
    return {
      vigente: true,
      razon: `Tarjeta vigente: expedida en ${añoExp}, año actual ${añoConsulta}`,
      estado_evaluado: tarjeta.estadoEmisor,
      tipo_validacion: 'ANUAL_MISMO_AÑO',
      vencimiento: new Date(añoExp, 11, 31), // 31 diciembre
      renovacion_siguiente: new Date(añoExp + 1, 0, 1) // 1 enero siguiente
    };
  }
  
  // Caso especial: Baja California con diferenciación por antigüedad
  if (tarjeta.estadoEmisor.toUpperCase() === 'BAJA CALIFORNIA' && reglas.plazo_refrendo.diferencia_por_antiguedad) {
    const modeloAño = parseInt(tarjeta.vehiculo?.ano);
    if (modeloAño) {
      const antiguedad = añoConsulta - modeloAño;
      const plazoMes = (antiguedad <= 9) ? reglas.plazo_refrendo.mes : reglas.plazo_refrendo.plazo_mes_alt;
      const fechaLimite = new Date(añoConsulta, plazoMes - 1, getDaysInMonth(añoConsulta, plazoMes));
      
      if (fechaConsulta <= fechaLimite) {
        return {
          vigente: true,
          razon: `Baja California: Vehículo ${antiguedad} años, plazo hasta ${plazoMes}/${añoConsulta}`,
          estado_evaluado: tarjeta.estadoEmisor,
          tipo_validacion: 'ANUAL_BC_ANTIGUEDAD',
          vencimiento: fechaLimite,
          antiguedad_vehiculo: antiguedad
        };
      }
    }
  }
  
  // Caso especial: Morelos con ampliación temporal 2025
  if (tarjeta.estadoEmisor.toUpperCase() === 'MORELOS' && reglas.plazo_refrendo.ampliacion_temporal) {
    const fechaAmpliacion = new Date(reglas.plazo_refrendo.ampliacion_hasta);
    if (fechaConsulta <= fechaAmpliacion) {
      return {
        vigente: true,
        razon: 'Morelos: Ampliación temporal período renovación hasta mayo 2025',
        estado_evaluado: tarjeta.estadoEmisor,
        tipo_validacion: 'ANUAL_MORELOS_AMPLIACION_2025',
        vencimiento: fechaAmpliacion,
        ampliacion_temporal: true
      };
    }
  }
  
  // Tarjeta vencida
  return {
    vigente: false,
    razon: `Tarjeta vencida: expedida ${añoExp}, año actual ${añoConsulta}`,
    estado_evaluado: tarjeta.estadoEmisor,
    tipo_validacion: 'ANUAL_VENCIDA',
    vencimiento: new Date(añoExp, 11, 31),
    dias_vencida: daysBetween(new Date(añoExp, 11, 31), fechaConsulta)
  };
}

/**
 * MODELO 2: Validación de vigencia trienal
 */
function validarVigenciaTrienal(tarjeta, fechaConsulta, reglas) {
  const fechaExp = parseDate(tarjeta.fechaExpedicion);
  const añosDesdExp = yearsBetween(fechaExp, fechaConsulta);
  
  // Caso especial: Colima (tarjeta permanente con calcomanía anual)
  if (tarjeta.estadoEmisor.toUpperCase() === 'COLIMA' && reglas.requiere_calcomanía_anual) {
    return {
      vigente: true,
      razon: 'Colima: Tarjeta permanente (requiere calcomanía fiscal anual)',
      estado_evaluado: tarjeta.estadoEmisor,
      tipo_validacion: 'TRIENAL_COLIMA_PERMANENTE',
      vencimiento: null,
      requiere_calcomanía: true
    };
  }
  
  // Caso especial: Estado de México (sistema dual)
  if (tarjeta.estadoEmisor.toUpperCase() === 'ESTADO DE MEXICO' || tarjeta.estadoEmisor.toUpperCase() === 'MEXICO') {
    const vigenciaTarjeta = reglas.vigencia_años; // 3 años
    const vigenciaPlacas = reglas.vigencia_placas_años; // 5 años
    
    const tarjetaVigente = añosDesdExp < vigenciaTarjeta;
    const placasVigentes = añosDesdExp < vigenciaPlacas; // Simplificado, idealmente validar fecha expedición placas
    
    return {
      vigente: tarjetaVigente && placasVigentes,
      razon: `Estado de México: Tarjeta ${tarjetaVigente ? 'vigente' : 'vencida'} (${vigenciaTarjeta} años), Placas ${placasVigentes ? 'vigentes' : 'vencidas'} (${vigenciaPlacas} años)`,
      estado_evaluado: tarjeta.estadoEmisor,
      tipo_validacion: 'TRIENAL_EDOMEX_DUAL',
      vencimiento_tarjeta: addYears(fechaExp, vigenciaTarjeta),
      vencimiento_placas: addYears(fechaExp, vigenciaPlacas),
      sistema_dual: true
    };
  }
  
  // Validación estándar trienal
  const vigenciaAños = reglas.vigencia_años;
  const vigente = añosDesdExp < vigenciaAños;
  
  return {
    vigente: vigente,
    razon: vigente 
      ? `Tarjeta vigente: ${añosDesdExp.toFixed(1)} años desde expedición, vigencia ${vigenciaAños} años`
      : `Tarjeta vencida: ${añosDesdExp.toFixed(1)} años desde expedición, vigencia ${vigenciaAños} años`,
    estado_evaluado: tarjeta.estadoEmisor,
    tipo_validacion: 'TRIENAL_ESTANDAR',
    vencimiento: addYears(fechaExp, vigenciaAños),
    años_desde_expedicion: añosDesdExp
  };
}

/**
 * MODELO 3: Validación de vigencia indefinida
 */
function validarVigenciaIndefinida(tarjeta, fechaConsulta, reglas) {
  const estado = tarjeta.estadoEmisor.toUpperCase();
  
  // Caso especial: Baja California Sur (sin refrendo desde 2015)
  if (estado === 'BAJA CALIFORNIA SUR' && reglas.elimino_refrendo) {
    return {
      vigente: true,
      razon: 'Baja California Sur: Tarjeta indefinida, sin refrendo anual (solo revista vehicular)',
      estado_evaluado: tarjeta.estadoEmisor,
      tipo_validacion: 'INDEFINIDA_BCS_SIN_REFRENDO',
      vencimiento: null,
      requiere_revista_vehicular: true,
      hueco_documental: reglas.hueco_documental
    };
  }
  
  // Caso especial: Zacatecas (hueco documental)
  if (estado === 'ZACATECAS' && reglas.hueco_documental) {
    return {
      vigente: true, // Asumir vigente por falta de info
      razon: 'Zacatecas: Sistema de registro permanente (HUECO DOCUMENTAL: vigencia temporal no especificada)',
      estado_evaluado: tarjeta.estadoEmisor,
      tipo_validacion: 'INDEFINIDA_ZAC_HUECO',
      vencimiento: null,
      hueco_documental: true,
      alerta: 'Estado sin reglas claras de vigencia temporal'
    };
  }
  
  // Caso especial: Nuevo León (con tarjeta complementaria digital)
  if (estado === 'NUEVO LEON' && reglas.tarjeta_complementaria_digital) {
    const fechaExp = parseDate(tarjeta.fechaExpedicion);
    const evolucionTexto = reglas.evoluciones_texto_tarjeta.find(ev => 
      fechaExp >= new Date(ev.desde) && (!ev.hasta || fechaExp <= new Date(ev.hasta))
    );
    
    return {
      vigente: true, // Tarjeta física indefinida
      razon: `Nuevo León: Tarjeta indefinida (texto: "${evolucionTexto?.texto || 'N/A'}"). Requiere refrendo anual antes del 31-marzo`,
      estado_evaluado: tarjeta.estadoEmisor,
      tipo_validacion: 'INDEFINIDA_NL_COMPLEMENTARIA',
      vencimiento: null,
      requiere_refrendo_anual: true,
      plazo_refrendo: `31 de marzo de ${fechaConsulta.getFullYear()}`,
      tarjeta_complementaria_digital: true,
      url_descarga: reglas.url_descarga,
      texto_tarjeta: evolucionTexto?.texto
    };
  }
  
  // Validación estándar indefinida
  return {
    vigente: true, // Indefinida mientras registrada en padrón
    razon: `${tarjeta.estadoEmisor}: Tarjeta indefinida${reglas.requiere_refrendo_anual ? ', requiere refrendo anual' : ''}`,
    estado_evaluado: tarjeta.estadoEmisor,
    tipo_validacion: 'INDEFINIDA_ESTANDAR',
    vencimiento: null,
    requiere_refrendo_anual: reglas.requiere_refrendo_anual
  };
}

/**
 * MODELO 4: Validación de vigencia bienal
 */
function validarVigenciaBienal(tarjeta, fechaConsulta, reglas) {
  const fechaExp = parseDate(tarjeta.fechaExpedicion);
  const diasDesdExp = daysBetween(fechaExp, fechaConsulta);
  const vigente = diasDesdExp <= 730; // 2 años = 730 días
  
  return {
    vigente: vigente,
    razon: vigente
      ? `Querétaro: Tarjeta vigente, ${diasDesdExp} días desde expedición (vigencia 2 años)`
      : `Querétaro: Tarjeta vencida, ${diasDesdExp} días desde expedición (vigencia 2 años)`,
    estado_evaluado: tarjeta.estadoEmisor,
    tipo_validacion: 'BIENAL_QUERETARO',
    vencimiento: addDays(fechaExp, 730),
    dias_desde_expedicion: diasDesdExp,
    renovacion_aislada_disponible: false,
    opciones_renovacion: reglas.opciones_renovacion
  };
}

/**
 * MODELO 5: Validación de vigencia con cambio temporal
 */
function validarVigenciaCambioTemporal(tarjeta, fechaConsulta, reglas) {
  const estado = tarjeta.estadoEmisor.toUpperCase();
  const fechaExp = parseDate(tarjeta.fechaExpedicion);
  
  // CHIAPAS: Transición 2018 de permanente a anual
  if (estado === 'CHIAPAS') {
    const fechaCambioSistema = new Date(reglas.cambio_sistema_año, 0, 1);
    
    // Tarjetas expedidas ANTES de 2018 (sistema antiguo: permanente)
    if (fechaExp < fechaCambioSistema) {
      return {
        vigente: true, // Asumimos vigente si refrendo al corriente (simplificado)
        razon: 'Chiapas: Tarjeta PERMANENTE antigua (pre-2018). Vigencia indefinida SI refrendo anual al corriente',
        estado_evaluado: tarjeta.estadoEmisor,
        tipo_validacion: 'CAMBIO_TEMPORAL_CHIAPAS_ANTIGUA',
        vencimiento: null,
        sistema: 'PERMANENTE_ANTIGUA',
        requiere_refrendo: true,
        alerta: 'Tarjeta del sistema anterior (pre-2018). Validar refrendo anual'
      };
    }
    
    // Tarjetas expedidas DESPUÉS de 2018 (sistema nuevo: anual)
    const añoExp = fechaExp.getFullYear();
    const añoConsulta = fechaConsulta.getFullYear();
    const vigente = añoExp === añoConsulta;
    
    return {
      vigente: vigente,
      razon: vigente
        ? `Chiapas: Tarjeta ANUAL (post-2018) vigente en año ${añoConsulta}`
        : `Chiapas: Tarjeta ANUAL (post-2018) vencida (expedida ${añoExp}, año actual ${añoConsulta})`,
      estado_evaluado: tarjeta.estadoEmisor,
      tipo_validacion: 'CAMBIO_TEMPORAL_CHIAPAS_NUEVA',
      vencimiento: new Date(añoExp, 11, 31),
      sistema: 'ANUAL_DESDE_2018',
      reforma_legislativa: reglas.reforma_legislativa
    };
  }
  
  // YUCATÁN: Múltiples prórrogas COVID-19 y tarjeta digital
  if (estado === 'YUCATAN') {
    // Verificar si aplica decreto activo de prórroga
    const decretoActivo = reglas.decretos_prorroga.find(decreto => {
      const fechaExtiende = new Date(decreto.extiende_vigencia_hasta);
      return fechaConsulta <= fechaExtiende;
    });
    
    if (decretoActivo) {
      return {
        vigente: true,
        razon: `Yucatán: Vigencia extendida por ${decretoActivo.numero} hasta ${decretoActivo.extiende_vigencia_hasta}. ${decretoActivo.descripcion}`,
        estado_evaluado: tarjeta.estadoEmisor,
        tipo_validacion: 'CAMBIO_TEMPORAL_YUCATAN_PRORROGA',
        vencimiento: new Date(decretoActivo.extiende_vigencia_hasta),
        decreto_aplicable: decretoActivo,
        reemplacamiento_programado: reglas.reemplacamiento_general_programado
      };
    }
    
    // Sin prórroga activa, aplicar regla base (trienal)
    const añosDesdExp = yearsBetween(fechaExp, fechaConsulta);
    const vigente = añosDesdExp < 3;
    
    return {
      vigente: vigente,
      razon: vigente
        ? `Yucatán: Tarjeta vigente (${añosDesdExp.toFixed(1)} años, vigencia base 3 años)`
        : `Yucatán: Tarjeta vencida (${añosDesdExp.toFixed(1)} años, vigencia base 3 años)`,
      estado_evaluado: tarjeta.estadoEmisor,
      tipo_validacion: 'CAMBIO_TEMPORAL_YUCATAN_BASE',
      vencimiento: addYears(fechaExp, 3),
      modelo_base: 'TRIENAL'
    };
  }
  
  return {
    vigente: null,
    razon: `Estado "${estado}" con modelo CAMBIO_TEMPORAL no implementado`,
    estado_evaluado: tarjeta.estadoEmisor,
    tipo_validacion: null
  };
}

/**
 * MODELO 6: Validación sin vigencia temporal
 */
function validarVigenciaSinTemporal(tarjeta, fechaConsulta, reglas) {
  const estado = tarjeta.estadoEmisor.toUpperCase();
  const fechaExp = parseDate(tarjeta.fechaExpedicion);
  
  // PUEBLA: Renovación masiva obligatoria 2018
  if (estado === 'PUEBLA' && reglas.renovacion_masiva_obligatoria) {
    const fechaRenovacionMasiva = new Date(reglas.renovacion_masiva_obligatoria.fecha_fin);
    
    if (fechaExp < new Date(reglas.renovacion_masiva_obligatoria.fecha_inicio)) {
      // Tarjetas anteriores a renovación masiva 2018
      if (fechaConsulta > fechaRenovacionMasiva) {
        return {
          vigente: false,
          razon: 'Puebla: Tarjeta INVALIDADA por renovación masiva obligatoria 2018 (formato papel → PVC)',
          estado_evaluado: tarjeta.estadoEmisor,
          tipo_validacion: 'SIN_TEMPORAL_PUEBLA_INVALIDADA',
          vencimiento: fechaRenovacionMasiva,
          renovacion_masiva: reglas.renovacion_masiva_obligatoria,
          alerta: 'CRÍTICO: Tarjeta pre-2018 sin validez. Renovación obligatoria no completada'
        };
      }
    }
    
    // Tarjetas post-renovación masiva: sin vigencia temporal
    return {
      vigente: true, // Asumimos vigente hasta evento de renovación
      razon: 'Puebla: Tarjeta post-2018 sin vigencia temporal. Renovación solo por eventos específicos',
      estado_evaluado: tarjeta.estadoEmisor,
      tipo_validacion: 'SIN_TEMPORAL_PUEBLA_POST_2018',
      vencimiento: null,
      renovacion_por_eventos: reglas.renovacion_por_eventos
    };
  }
  
  // JALISCO: Sistema diferenciado automóviles vs motocicletas
  if (estado === 'JALISCO') {
    const tipoVehiculo = tarjeta.vehiculo?.clase_tipo || 'DESCONOCIDO';
    
    if (tipoVehiculo.toUpperCase().includes('AUTOMOVIL') || tipoVehiculo.toUpperCase().includes('AUTO')) {
      // Sistema 2021 para automóviles
      if (fechaExp >= new Date(reglas.sistema_2021_automoviles.desde)) {
        const añosDesdExp = yearsBetween(fechaExp, fechaConsulta);
        const vigente = añosDesdExp < 4;
        
        return {
          vigente: vigente,
          razon: vigente
            ? `Jalisco: AUTOMÓVIL con tarjeta plastificada vigente (${añosDesdExp.toFixed(1)} años, vigencia 4 años)`
            : `Jalisco: AUTOMÓVIL con tarjeta plastificada vencida (${añosDesdExp.toFixed(1)} años, vigencia 4 años)`,
          estado_evaluado: tarjeta.estadoEmisor,
          tipo_validacion: 'SIN_TEMPORAL_JALISCO_AUTO_2021',
          vencimiento: addYears(fechaExp, 4),
          tipo_vehiculo: 'AUTOMOVIL',
          elimina_holograma: true
        };
      }
    }
    
    // MOTOCICLETAS: HUECO DOCUMENTAL
    if (tipoVehiculo.toUpperCase().includes('MOTO')) {
      return {
        vigente: null,
        razon: 'Jalisco: MOTOCICLETA - HUECO DOCUMENTAL CRÍTICO. Sistema post-2021 no clarificado para motos',
        estado_evaluado: tarjeta.estadoEmisor,
        tipo_validacion: 'SIN_TEMPORAL_JALISCO_MOTO_HUECO',
        vencimiento: null,
        tipo_vehiculo: 'MOTOCICLETA',
        hueco_documental: true,
        alerta: 'Estado sin sistema claro de vigencia para motocicletas'
      };
    }
    
    // Tipo de vehículo desconocido
    return {
      vigente: null,
      razon: 'Jalisco: Tipo de vehículo no determinado. No se puede validar vigencia',
      estado_evaluado: tarjeta.estadoEmisor,
      tipo_validacion: 'SIN_TEMPORAL_JALISCO_INDETERMINADO',
      vencimiento: null
    };
  }
  
  // Otros estados sin vigencia temporal: validación genérica
  return {
    vigente: true, // Asumimos vigente por renovación por eventos
    razon: `${tarjeta.estadoEmisor}: Sin vigencia temporal especificada. Renovación por eventos específicos`,
    estado_evaluado: tarjeta.estadoEmisor,
    tipo_validacion: 'SIN_TEMPORAL_GENERICA',
    vencimiento: null,
    renovacion_por_eventos: true,
    hueco_documental: reglas.hueco_documental || false
  };
}

// Funciones auxiliares de fecha
function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  // Intentar parsear múltiples formatos
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/ // DD/MM/YYYY
  ];
  
  if (formats[0].test(dateStr)) {
    return new Date(dateStr);
  }
  
  if (formats[1].test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  return new Date(dateStr);
}

function yearsBetween(date1, date2) {
  const diff = date2 - date1;
  return diff / (1000 * 60 * 60 * 24 * 365.25);
}

function daysBetween(date1, date2) {
  const diff = date2 - date1;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function addYears(date, years) {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

module.exports = {
  verificarVigenciaTarjeta
};

