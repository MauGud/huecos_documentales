const { ESTADOS_REGLAS, MODELOS_VIGENCIA } = require('./estadosReglasVigencia');

/**
 * Normaliza un string para comparación (quita acentos, espacios extra, etc.)
 */
function normalizeString(str) {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .toUpperCase()
    .normalize('NFD') // Descompone caracteres con acentos
    .replace(/[\u0300-\u036f]/g, '') // Elimina marcas diacríticas (tildes)
    .replace(/[^A-Z0-9]/g, '') // Solo letras y números
    .trim();
}

/**
 * Calcula la similitud entre dos strings usando Levenshtein distance
 */
function calculateStringSimilarity(str1, str2) {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calcula la distancia de Levenshtein entre dos strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // sustitución
          matrix[i][j - 1] + 1,     // inserción
          matrix[i - 1][j] + 1      // eliminación
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Normaliza el nombre de un estado para buscar en la tabla de reglas
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
 * Parsea una fecha string a objeto Date
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? null : dateStr;
  }
  
  if (typeof dateStr !== 'string') return null;
  
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Calcula la fecha de vencimiento de una tarjeta según las reglas del estado
 */
function calcularFechaVencimiento(tarjeta, estadosReglas) {
  if (!tarjeta || !tarjeta.estadoEmisor || !tarjeta.fechaExpedicion) {
    return null;
  }
  
  try {
    const estadoNormalizado = normalizarNombreEstado(tarjeta.estadoEmisor);
    const reglas = estadosReglas[estadoNormalizado];
    
    if (!reglas) {
      return null; // Estado no encontrado en reglas
    }
    
    const fechaExpedicion = parseDate(tarjeta.fechaExpedicion);
    if (!fechaExpedicion) return null;
    
    const modeloVigencia = reglas.modelo_vigencia;
    const vigenciaAnos = reglas.vigencia_años;
    
    // Si tiene fecha de vigencia explícita, usarla
    if (tarjeta.fechaVigencia) {
      const fechaVigencia = parseDate(tarjeta.fechaVigencia);
      if (fechaVigencia) return fechaVigencia;
    }
    
    // Calcular según modelo de vigencia
    if (modeloVigencia === MODELOS_VIGENCIA.INDEFINIDA) {
      return null; // Vigencia indefinida
    }
    
    if (modeloVigencia === MODELOS_VIGENCIA.SIN_TEMPORAL) {
      return null; // Sin vigencia temporal
    }
    
    if (vigenciaAnos && vigenciaAnos > 0) {
      const fechaVencimiento = new Date(fechaExpedicion);
      fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + vigenciaAnos);
      
      // Ajustar según vencimiento_tipo
      if (reglas.vencimiento_tipo === 'FIN_AÑO' && reglas.plazo_refrendo) {
        fechaVencimiento.setMonth(reglas.plazo_refrendo.mes - 1);
        fechaVencimiento.setDate(reglas.plazo_refrendo.dia);
      }
      
      return fechaVencimiento;
    }
    
    return null;
  } catch (error) {
    console.error('Error calculando fecha de vencimiento:', error);
    return null;
  }
}

/**
 * Calcula si una tarjeta está vigente HOY según las reglas del estado
 */
function calculateVigenciaHoy(tarjeta, estadosReglas) {
  if (!tarjeta || !tarjeta.estadoEmisor || !tarjeta.fechaExpedicion) {
    return {
      vigente: null,
      fecha_vencimiento: null,
      dias_vencida: null,
      modelo_vigencia: null,
      razon: 'Datos insuficientes para calcular vigencia'
    };
  }
  
  try {
    const estadoNormalizado = normalizarNombreEstado(tarjeta.estadoEmisor);
    const reglas = estadosReglas[estadoNormalizado];
    
    if (!reglas) {
      return {
        vigente: null,
        fecha_vencimiento: null,
        dias_vencida: null,
        modelo_vigencia: null,
        razon: `Estado "${tarjeta.estadoEmisor}" no encontrado en tabla de reglas`
      };
    }
    
    const modeloVigencia = reglas.modelo_vigencia;
    const fechaExpedicion = parseDate(tarjeta.fechaExpedicion);
    const fechaHoy = new Date();
    fechaHoy.setHours(0, 0, 0, 0);
    
    if (!fechaExpedicion) {
      return {
        vigente: null,
        fecha_vencimiento: null,
        dias_vencida: null,
        modelo_vigencia: modeloVigencia,
        razon: 'Fecha de expedición inválida'
      };
    }
    
    // Si tiene fecha de vigencia explícita, usarla
    if (tarjeta.fechaVigencia) {
      const fechaVigencia = parseDate(tarjeta.fechaVigencia);
      if (fechaVigencia) {
        const vigente = fechaVigencia >= fechaHoy;
        const diasVencida = vigente ? null : Math.floor((fechaHoy.getTime() - fechaVigencia.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          vigente: vigente,
          fecha_vencimiento: fechaVigencia,
          dias_vencida: diasVencida,
          modelo_vigencia: modeloVigencia,
          razon: vigente ? 'Vigente según fecha explícita' : `Vencida hace ${diasVencida} días`
        };
      }
    }
    
    // Calcular según modelo de vigencia
    if (modeloVigencia === MODELOS_VIGENCIA.INDEFINIDA) {
      return {
        vigente: true,
        fecha_vencimiento: null,
        dias_vencida: null,
        modelo_vigencia: modeloVigencia,
        razon: 'Vigencia indefinida (requiere refrendo anual)'
      };
    }
    
    if (modeloVigencia === MODELOS_VIGENCIA.SIN_TEMPORAL) {
      return {
        vigente: true,
        fecha_vencimiento: null,
        dias_vencida: null,
        modelo_vigencia: modeloVigencia,
        razon: 'Sin vigencia temporal'
      };
    }
    
    const vigenciaAnos = reglas.vigencia_años;
    if (vigenciaAnos && vigenciaAnos > 0) {
      const fechaVencimiento = new Date(fechaExpedicion);
      fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + vigenciaAnos);
      
      // Ajustar según vencimiento_tipo
      if (reglas.vencimiento_tipo === 'FIN_AÑO' && reglas.plazo_refrendo) {
        fechaVencimiento.setMonth(reglas.plazo_refrendo.mes - 1);
        fechaVencimiento.setDate(reglas.plazo_refrendo.dia);
      }
      
      fechaVencimiento.setHours(23, 59, 59, 999);
      
      const vigente = fechaVencimiento >= fechaHoy;
      const diasVencida = vigente ? null : Math.floor((fechaHoy.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        vigente: vigente,
        fecha_vencimiento: fechaVencimiento,
        dias_vencida: diasVencida,
        modelo_vigencia: modeloVigencia,
        razon: vigente 
          ? `Vigente hasta ${fechaVencimiento.toLocaleDateString('es-MX')}` 
          : `Vencida hace ${diasVencida} días (venció ${fechaVencimiento.toLocaleDateString('es-MX')})`
      };
    }
    
    return {
      vigente: null,
      fecha_vencimiento: null,
      dias_vencida: null,
      modelo_vigencia: modeloVigencia,
      razon: 'No se pudo calcular vigencia'
    };
  } catch (error) {
    console.error('Error calculando vigencia hoy:', error);
    return {
      vigente: null,
      fecha_vencimiento: null,
      dias_vencida: null,
      modelo_vigencia: null,
      razon: `Error: ${error.message}`
    };
  }
}

/**
 * VALIDACIÓN 1: Validación de Propiedad
 * Para históricos: solo verifica existencia de tarjeta
 * Para actual: verifica existencia Y vigencia HOY
 */
function validatePropertyOwnership(ownershipChain, tarjetas) {
  if (!ownershipChain || !Array.isArray(ownershipChain)) {
    return {
      total_propietarios: 0,
      propietarios_con_tarjeta: 0,
      propietarios_sin_tarjeta: 0,
      propietario_actual_sin_vigencia: false,
      detalle: []
    };
  }
  
  if (!tarjetas || !Array.isArray(tarjetas)) {
    tarjetas = [];
  }
  
  // Identificar propietario actual: último elemento con position !== null
  let propietarioActualRFC = null;
  for (let i = ownershipChain.length - 1; i >= 0; i--) {
    if (ownershipChain[i].position !== null && ownershipChain[i].rfcReceptor) {
      propietarioActualRFC = ownershipChain[i].rfcReceptor;
      break;
    }
  }
  
  // Extraer propietarios únicos de la cadena de propiedad
  const propietarios = [];
  const rfcSet = new Set();
  
  ownershipChain.forEach(item => {
    if (item.rfcReceptor && !rfcSet.has(item.rfcReceptor)) {
      rfcSet.add(item.rfcReceptor);
      const esActual = item.rfcReceptor === propietarioActualRFC;
      
      propietarios.push({
        rfc: item.rfcReceptor,
        nombre_factura: item.nombreReceptor || null,
        fecha_inicio: item.fecha || null,
        es_propietario_actual: esActual,
        fecha_fin: null // Se calculará si hay siguiente propietario
      });
    }
  });
  
  // Calcular fecha_fin para cada propietario
  for (let i = 0; i < propietarios.length; i++) {
    if (i < propietarios.length - 1) {
      // Buscar siguiente propietario con diferente RFC
      for (let j = i + 1; j < ownershipChain.length; j++) {
        if (ownershipChain[j].rfcReceptor && 
            ownershipChain[j].rfcReceptor !== propietarios[i].rfc) {
          propietarios[i].fecha_fin = ownershipChain[j].fecha;
          break;
        }
      }
    }
  }
  
  // Normalizar RFCs de tarjetas para búsqueda
  const tarjetasPorRFC = new Map();
  tarjetas.forEach(tarjeta => {
    if (tarjeta.rfc) {
      const rfcNormalizado = normalizeString(tarjeta.rfc);
      if (!tarjetasPorRFC.has(rfcNormalizado)) {
        tarjetasPorRFC.set(rfcNormalizado, []);
      }
      tarjetasPorRFC.get(rfcNormalizado).push(tarjeta);
    }
  });
  
  // Validar cada propietario
  const detalle = [];
  let propietariosConTarjeta = 0;
  let propietariosSinTarjeta = 0;
  let propietarioActualSinVigencia = false;
  
  propietarios.forEach(propietario => {
    const rfcNormalizado = normalizeString(propietario.rfc);
    const tarjetasDelPropietario = tarjetasPorRFC.get(rfcNormalizado) || [];
    
    const tieneTarjeta = tarjetasDelPropietario.length > 0;
    
    if (tieneTarjeta) {
      propietariosConTarjeta++;
      
      // Buscar la mejor coincidencia de nombre
      let mejorSimilitud = 0;
      let mejorTarjeta = null;
      
      tarjetasDelPropietario.forEach(tarjeta => {
        if (propietario.nombre_factura && tarjeta.nombre) {
          const similitud = calculateStringSimilarity(
            propietario.nombre_factura,
            tarjeta.nombre
          );
          
          if (similitud > mejorSimilitud) {
            mejorSimilitud = similitud;
            mejorTarjeta = tarjeta;
          }
        }
      });
      
      // Si no hay mejor tarjeta por nombre, usar la primera
      if (!mejorTarjeta && tarjetasDelPropietario.length > 0) {
        mejorTarjeta = tarjetasDelPropietario[0];
      }
      
      // Para propietario ACTUAL: calcular vigencia HOY
      let tarjetaVigenteHoy = null;
      if (propietario.es_propietario_actual && mejorTarjeta) {
        const vigenciaHoy = calculateVigenciaHoy(mejorTarjeta, ESTADOS_REGLAS);
        tarjetaVigenteHoy = vigenciaHoy.vigente;
        
        if (vigenciaHoy.vigente === false) {
          propietarioActualSinVigencia = true;
        }
      }
      
      detalle.push({
        rfc: propietario.rfc,
        nombre_factura: propietario.nombre_factura,
        tiene_tarjeta: true,
        nombre_tarjeta: mejorTarjeta ? mejorTarjeta.nombre : null,
        similitud_nombre: mejorSimilitud,
        es_propietario_actual: propietario.es_propietario_actual,
        tarjeta_vigente_hoy: propietario.es_propietario_actual ? tarjetaVigenteHoy : null, // Solo para actual
        estado: mejorTarjeta ? mejorTarjeta.estadoEmisor : null,
        fecha_inicio: propietario.fecha_inicio,
        fecha_fin: propietario.fecha_fin
      });
    } else {
      propietariosSinTarjeta++;
      
      detalle.push({
        rfc: propietario.rfc,
        nombre_factura: propietario.nombre_factura,
        tiene_tarjeta: false,
        nombre_tarjeta: null,
        similitud_nombre: null,
        es_propietario_actual: propietario.es_propietario_actual,
        tarjeta_vigente_hoy: null,
        estado: null,
        fecha_inicio: propietario.fecha_inicio,
        fecha_fin: propietario.fecha_fin
      });
    }
  });
  
  // Crear array de tarjetas con detalles para el timeline
  const tarjetasDetalle = [];
  tarjetas.forEach(tarjeta => {
    if (tarjeta.rfc && tarjeta.fechaExpedicion) {
      // Buscar si esta tarjeta coincide con algún propietario
      const rfcNormalizado = normalizeString(tarjeta.rfc);
      const propietarioMatch = propietarios.find(p => normalizeString(p.rfc) === rfcNormalizado);
      
      let tieneCoincidencia = false;
      let similitudNombre = null;
      
      if (propietarioMatch && propietarioMatch.nombre_factura && tarjeta.nombre) {
        similitudNombre = calculateStringSimilarity(propietarioMatch.nombre_factura, tarjeta.nombre);
        tieneCoincidencia = similitudNombre >= 0.7;
      }
      
      // ========== VALIDACIÓN DE RFC CON FACTURA MÁS RECIENTE ==========
      // Buscar la factura más reciente antes de la fecha de expedición de la tarjeta
      let rfcFacturaReciente = null;
      let fechaFacturaReciente = null;
      let rupturaRFC = false;
      let razonRupturaRFC = null;
      
      const fechaExpedicionTarjeta = parseDate(tarjeta.fechaExpedicion);
      
      if (fechaExpedicionTarjeta && ownershipChain && ownershipChain.length > 0) {
        // Filtrar facturas válidas (con posición) y ordenar por fecha descendente
        const facturasValidas = ownershipChain
          .filter(item => item.position !== null && item.fecha && item.rfcReceptor)
          .map(item => ({
            ...item,
            fechaParsed: parseDate(item.fecha)
          }))
          .filter(item => item.fechaParsed && item.fechaParsed <= fechaExpedicionTarjeta)
          .sort((a, b) => b.fechaParsed.getTime() - a.fechaParsed.getTime());
        
        if (facturasValidas.length > 0) {
          const facturaReciente = facturasValidas[0];
          rfcFacturaReciente = facturaReciente.rfcReceptor;
          fechaFacturaReciente = facturaReciente.fecha;
          
          // Comparar RFC de tarjeta con RFC del receptor de la factura más reciente
          const rfcTarjetaNormalizado = normalizeString(tarjeta.rfc);
          const rfcFacturaNormalizado = normalizeString(rfcFacturaReciente);
          
          if (rfcTarjetaNormalizado !== rfcFacturaNormalizado) {
            rupturaRFC = true;
            razonRupturaRFC = `RFC de tarjeta (${tarjeta.rfc}) no coincide con RFC de factura más reciente (${rfcFacturaReciente})`;
          }
        }
      }
      
      // Calcular vigencia para esta tarjeta
      const vigenciaHoy = calculateVigenciaHoy(tarjeta, ESTADOS_REGLAS);
      
      tarjetasDetalle.push({
        file_id: tarjeta.fileId || null,
        nombre: tarjeta.nombre || null,
        rfc: tarjeta.rfc || null,
        estado_emisor: tarjeta.estadoEmisor || null,
        placa: tarjeta.vehiculo?.placa || null,
        folio: tarjeta.folioElectronico || null,
        repuve: tarjeta.repuve || null,
        fecha_expedicion: tarjeta.fechaExpedicion || null,
        fecha_vigencia: tarjeta.fechaVigencia || vigenciaHoy.fecha_vencimiento,
        vigente: vigenciaHoy.vigente,
        razon_vigencia: vigenciaHoy.razon || null,
        tiene_coincidencia: tieneCoincidencia,
        similitud_nombre: similitudNombre,
        ruptura_rfc: rupturaRFC,
        razon_ruptura_rfc: razonRupturaRFC,
        rfc_factura_reciente: rfcFacturaReciente,
        fecha_factura_reciente: fechaFacturaReciente
      });
    }
  });
  
  return {
    total_propietarios: propietarios.length,
    propietarios_con_tarjeta: propietariosConTarjeta,
    propietarios_sin_tarjeta: propietariosSinTarjeta,
    propietario_actual_sin_vigencia: propietarioActualSinVigencia,
    detalle: detalle,
    tarjetas_detalle: tarjetasDetalle
  };
}

/**
 * VALIDACIÓN 2: Detección de Gaps de Vigencia
 * Detecta períodos sin cobertura válida de tarjetas
 */
function detectVigenciaGaps(tarjetas, estadosReglas) {
  if (!tarjetas || !Array.isArray(tarjetas) || tarjetas.length === 0) {
    return {
      total_tarjetas: 0,
      cobertura_completa: true,
      gaps_detectados: 0,
      dias_sin_cobertura: 0,
      linea_temporal: [],
      gaps: []
    };
  }
  
  if (!estadosReglas) {
    estadosReglas = ESTADOS_REGLAS;
  }
  
  // Ordenar tarjetas por fecha de expedición
  const tarjetasOrdenadas = [...tarjetas].sort((a, b) => {
    const fechaA = parseDate(a.fechaExpedicion);
    const fechaB = parseDate(b.fechaExpedicion);
    
    if (!fechaA && !fechaB) return 0;
    if (!fechaA) return 1;
    if (!fechaB) return -1;
    
    return fechaA.getTime() - fechaB.getTime();
  });
  
  // Calcular fechas de vencimiento para cada tarjeta
  const lineaTemporal = [];
  const gaps = [];
  let diasSinCobertura = 0;
  
  tarjetasOrdenadas.forEach((tarjeta, index) => {
    const fechaExpedicion = parseDate(tarjeta.fechaExpedicion);
    const fechaVencimiento = calcularFechaVencimiento(tarjeta, estadosReglas);
    
    lineaTemporal.push({
      tarjeta: tarjeta,
      fecha_inicio: fechaExpedicion,
      fecha_vencimiento: fechaVencimiento,
      estado: tarjeta.estadoEmisor,
      vigencia_indefinida: fechaVencimiento === null && 
                          (tarjeta.estadoEmisor ? 
                            estadosReglas[normalizarNombreEstado(tarjeta.estadoEmisor)]?.modelo_vigencia === MODELOS_VIGENCIA.INDEFINIDA : 
                            false)
    });
    
    // Detectar gap con la siguiente tarjeta
    if (index < tarjetasOrdenadas.length - 1) {
      const siguienteTarjeta = tarjetasOrdenadas[index + 1];
      const fechaExpedicionSiguiente = parseDate(siguienteTarjeta.fechaExpedicion);
      
      if (fechaVencimiento && fechaExpedicionSiguiente) {
        const diasDiferencia = Math.floor(
          (fechaExpedicionSiguiente.getTime() - fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Si hay gap > 30 días
        if (diasDiferencia > 30) {
          diasSinCobertura += diasDiferencia;
          
          let gravedad = 'MEDIA';
          if (diasDiferencia > 365) {
            gravedad = 'CRITICA';
          } else if (diasDiferencia > 180) {
            gravedad = 'ALTA';
          }
          
          const estadosInvolucrados = [
            tarjeta.estadoEmisor || 'N/A',
            siguienteTarjeta.estadoEmisor || 'N/A'
          ].filter((estado, index, arr) => arr.indexOf(estado) === index); // Únicos
          
          gaps.push({
            tarjeta_anterior: {
              estado: tarjeta.estadoEmisor,
              fecha_vencimiento: fechaVencimiento
            },
            tarjeta_siguiente: {
              estado: siguienteTarjeta.estadoEmisor,
              fecha_expedicion: fechaExpedicionSiguiente
            },
            fecha_inicio_gap: fechaVencimiento,
            fecha_fin_gap: fechaExpedicionSiguiente,
            dias_sin_cobertura: diasDiferencia,
            estados_involucrados: estadosInvolucrados,
            gravedad: gravedad
          });
        }
      }
    }
  });
  
  return {
    total_tarjetas: tarjetasOrdenadas.length,
    gaps_detectados: gaps.length,
    gaps: gaps
  };
}

module.exports = {
  validatePropertyOwnership,
  detectVigenciaGaps,
  calculateVigenciaHoy
};

