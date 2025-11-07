class SequenceAnalyzer {
  /**
   * Analiza la secuencia de propiedad vehicular con lógica avanzada
   */
  analyzeOwnershipSequence(expedienteData) {
    if (!expedienteData.files || !Array.isArray(expedienteData.files)) {
      return {
        success: false,
        error: 'No se encontraron archivos en el expediente'
      };
    }

    // 1. Filtrar facturas, refacturas Y endosos
    const documents = expedienteData.files.filter(file => 
      (file.document_type === 'invoice' || 
       file.document_type === 'reinvoice' || 
       file.document_type === 'endorsement') && 
      file.ocr && 
      typeof file.ocr === 'object'
    );

    if (documents.length === 0) {
      return {
        success: false,
        error: 'No se encontraron facturas ni endosos en el expediente'
      };
    }

    // 2. Extraer VIN de referencia
    const referenceVIN = this.extractVIN(expedienteData);
    
    // 3. Validar consistencia de VIN
    const vinValidation = this.validateVINConsistency(documents, referenceVIN);
    if (!vinValidation.isValid) {
      return {
        success: false,
        error: 'VIN inconsistente entre documentos',
        details: vinValidation.details
      };
    }

    // 4. Normalizar documentos (facturas y endosos a estructura común)
    const normalizedDocs = documents.map(doc => this.normalizeDocument(doc));

    // 5. Identificar documento de origen
    const originDocument = this.findOriginDocument(normalizedDocs);
    if (!originDocument) {
      return {
        success: false,
        error: 'No se encontró el documento de origen (usado_nuevo: "NUEVO")'
      };
    }

    // 6. Ordenar documentos por fecha
    const sortedDocs = this.sortDocumentsByDate(normalizedDocs);

    // 7. Construir cadena de propiedad con lógica avanzada
    const ownershipChain = this.buildOwnershipChainAdvanced(sortedDocs, originDocument);

    // 8. Detectar huecos, retornos y anomalías
    const gapAnalysis = this.detectSequenceGapsAdvanced(ownershipChain);

    // ========== EJECUTAR NUEVOS ANÁLISIS (NO ROMPE NADA) ==========
    let integrityAnalysis = null;
    let patternDetection = null;
    let temporalAnalysis = null;
    let duplicateDetection = null;

    try {
      // FASE 1: Validaciones de integridad
      integrityAnalysis = this.validateDocumentIntegrity(sortedDocs, originDocument);

      // FASE 2: Detección de patrones sospechosos
      patternDetection = this.detectSuspiciousPatterns(ownershipChain, sortedDocs);

      // FASE 3: Análisis temporal
      temporalAnalysis = this.analyzeTemporalAnomalies(ownershipChain, sortedDocs);

      // FASE 4: Detección de duplicados
      duplicateDetection = this.detectDuplicates(sortedDocs);
    } catch (error) {
      console.error('Error en análisis avanzado:', error);
      // Si falla el análisis avanzado, continuar con respuesta básica
    }

    // ========== RETURN CON TODA LA INFORMACIÓN ==========
    const response = {
      // MANTENER ESTRUCTURA EXISTENTE (NO MODIFICAR)
      success: true,
      vin: referenceVIN,
      totalDocuments: documents.length,
      totalInvoices: documents.filter(d => d.document_type === 'invoice').length,
      totalReinvoices: documents.filter(d => d.document_type === 'reinvoice').length,
      totalEndorsements: documents.filter(d => d.document_type === 'endorsement').length,
      originDocument: {
        fileId: originDocument.fileId,
        fecha: originDocument.fecha,
        rfcEmisor: originDocument.emisorRFC,
        nombreEmisor: originDocument.emisorNombre,
        rfcReceptor: originDocument.receptorRFC,
        nombreReceptor: originDocument.receptorNombre,
        documentType: originDocument.documentType
      },
      ownershipChain: ownershipChain,
      sequenceAnalysis: {
        hasGaps: gapAnalysis.hasGaps,
        hasReturnos: gapAnalysis.hasRetornos,
        totalGaps: gapAnalysis.gaps.length,
        totalRetornos: gapAnalysis.retornos.length,
        gaps: gapAnalysis.gaps,
        retornos: gapAnalysis.retornos,
        isComplete: !gapAnalysis.hasGaps
      },
      metadata: {
        analyzedAt: new Date().toISOString(),
        vehicleActive: expedienteData.active_vehicle,
        createdAt: expedienteData.created_at
      }
    };

    // AGREGAR NUEVAS SECCIONES (solo si se calcularon)
    if (integrityAnalysis) {
      response.integrityAnalysis = integrityAnalysis;
    }
    if (patternDetection) {
      response.patternDetection = patternDetection;
    }
    if (temporalAnalysis) {
      response.temporalAnalysis = temporalAnalysis;
    }
    if (duplicateDetection) {
      response.duplicateDetection = duplicateDetection;
    }

    return response;
  }

  /**
   * Normaliza facturas y endosos a estructura común
   */
  /**
   * Normaliza facturas, refacturas y endosos a estructura común
   * 
   * Tipos de documentos soportados:
   * - invoice: Factura original (vehículo nuevo)
   * - reinvoice: Refactura (transferencias posteriores)
   * - endorsement: Endoso (transferencia de derechos)
   */
  normalizeDocument(doc) {
    const ocr = doc.ocr;
    const isInvoice = doc.document_type === 'invoice';
    const isReinvoice = doc.document_type === 'reinvoice';
    const isEndorsement = doc.document_type === 'endorsement';

    // ═══════════════════════════════════════════════════════════════
    // FACTURAS (invoice) - Venta original
    // ═══════════════════════════════════════════════════════════════
    if (isInvoice) {
      return {
        fileId: doc.file_id,
        documentType: 'invoice',
        createdAt: doc.created_at,
        url: doc.url,
        fecha: ocr.fecha_factura || ocr.fecha_hora_emision || null,
        numeroDocumento: ocr.numero_factura || ocr.folio_fiscal || null,
        emisorRFC: ocr.rfc_emisor || null,
        emisorNombre: ocr.nombre_emisor || null,
        receptorRFC: ocr.rfc_receptor || null,
        receptorNombre: ocr.nombre_receptor || null,
        total: ocr.total || null,
        usadoNuevo: ocr.usado_nuevo || null,
        vin: ocr.vin || ocr.niv_vin_numero_serie || null,
        vehiculo: {
          marca: ocr.marca_vehiculo || null,
          modelo: ocr.modelo_vehiculo || null,
          ano: ocr.ano_vehiculo || ocr.vehiculo_modelo_ano || null
        }
      };
    } 
    // ═══════════════════════════════════════════════════════════════
    // REFACTURAS (reinvoice) - Transferencias posteriores
    // ═══════════════════════════════════════════════════════════════
    else if (isReinvoice) {
      return {
        fileId: doc.file_id,
        documentType: 'reinvoice',
        createdAt: doc.created_at,
        url: doc.url,
        fecha: ocr.fecha_refactura || ocr.fecha_factura || ocr.fecha_hora_emision || null,
        numeroDocumento: ocr.numero_refactura || ocr.numero_factura || ocr.folio_fiscal || null,
        emisorRFC: ocr.rfc_emisor || null,
        emisorNombre: ocr.nombre_emisor || null,
        receptorRFC: ocr.rfc_receptor || null,
        receptorNombre: ocr.nombre_receptor || null,
        total: ocr.total || null,
        usadoNuevo: ocr.usado_nuevo || 'USADO', // Refacturas típicamente son de vehículos usados
        vin: ocr.vin || ocr.niv_vin_numero_serie || null,
        vehiculo: {
          marca: ocr.marca_vehiculo || null,
          modelo: ocr.modelo_vehiculo || null,
          ano: ocr.ano_vehiculo || ocr.vehiculo_modelo_ano || null
        }
      };
    } 
    // ═══════════════════════════════════════════════════════════════
    // ENDOSOS (endorsement) - Transferencia de derechos
    // ═══════════════════════════════════════════════════════════════
    else if (isEndorsement) {
      return {
        fileId: doc.file_id,
        documentType: 'endorsement',
        createdAt: doc.created_at,
        url: doc.url,
        fecha: ocr.fecha_endoso || ocr.fecha_hora_endoso || null,
        numeroDocumento: ocr.numero_endoso || ocr.folio_endoso || null,
        emisorRFC: ocr.rfc_endosante || null,
        emisorNombre: ocr.nombre_endosante || null,
        receptorRFC: ocr.rfc_endosatario || null,
        receptorNombre: ocr.nombre_endosatario || null,
        total: null,
        usadoNuevo: null,
        vin: ocr.vin || ocr.niv_vin_numero_serie || null,
        vehiculo: {
          marca: ocr.marca_vehiculo || null,
          modelo: ocr.modelo_vehiculo || null,
          ano: ocr.ano_vehiculo || ocr.vehiculo_modelo_ano || null
        }
      };
    }

    return null;
  }

  /**
   * Ordena documentos por fecha
   */
  sortDocumentsByDate(documents) {
    return documents.sort((a, b) => {
      const dateA = this.parseDate(a.fecha);
      const dateB = this.parseDate(b.fecha);
      
      // Sin fechas, mantener orden original
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1; // Documentos sin fecha al final
      if (!dateB) return -1;
      
      return dateA - dateB; // Orden ascendente (más antiguo primero)
    });
  }

  /**
   * Parsea diferentes formatos de fecha
   */
  parseDate(dateStr) {
    if (!dateStr) return null;

    try {
      // Formato: DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/');
        return new Date(year, month - 1, day);
      }
      
      // Formato: YYYY-MM-DD o ISO
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        return new Date(dateStr);
      }
      
      // Intento genérico
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch (error) {
      return null;
    }
  }

  /**
   * Construye cadena de propiedad con lógica avanzada
   * 
   * ⚠️ NOTA CRÍTICA SOBRE ORDEN DE VALIDACIONES:
   * 
   * Escenario real: Agencia A → Persona A → Agencia A → Persona B
   * 
   * En la tercera transferencia (Agencia A → Persona B), se cumplen DOS condiciones:
   * 1. emisorRFC === currentReceptorRFC (es continuación normal)
   * 2. rfcHistory.includes(emisorRFC) (RFC ya apareció antes)
   * 
   * La validación de CONTINUACIÓN NORMAL debe evaluarse PRIMERO porque:
   * - Si el emisor es quien posee actualmente el vehículo, es transferencia válida
   * - Solo es "retorno" si el RFC ya apareció PERO NO es el poseedor actual
   * 
   * ❌ NO INVERTIR EL ORDEN de las validaciones sin revisar este caso
   */
  buildOwnershipChainAdvanced(documents, originDocument) {
    const chain = [];
    const rfcHistory = []; // Historial de RFCs que han aparecido
    const processedDocs = new Set();

    // Agregar documento de origen
    chain.push({
      position: 1,
      state: 'OK',
      stateLabel: '✓ Origen',
      type: originDocument.documentType,
      ...this.extractChainData(originDocument)
    });

    rfcHistory.push(originDocument.emisorRFC);
    rfcHistory.push(originDocument.receptorRFC);
    processedDocs.add(originDocument.fileId);

    let currentReceptorRFC = originDocument.receptorRFC;
    let position = 2;

    // Iterar sobre documentos ordenados
    for (const doc of documents) {
      if (processedDocs.has(doc.fileId)) continue;

      // Variables de estado explícitas para mayor claridad
      const isContinuation = (doc.emisorRFC === currentReceptorRFC);
      const rfcAppearedBefore = rfcHistory.includes(doc.emisorRFC);
      const isPotentialReturn = rfcAppearedBefore && !isContinuation;

      // ═══════════════════════════════════════════════════════════════
      // CASO 1: Continuación normal de secuencia (PRIORIDAD MÁXIMA)
      // ═══════════════════════════════════════════════════════════════
      // Esta validación DEBE ir primero para manejar intermediación:
      // Ejemplo: A→B→A→C donde la última transferencia A→C es NORMAL
      if (isContinuation) {
        // Determinar estado y etiqueta según tipo de documento
        let state, stateLabel;
        if (doc.documentType === 'endorsement') {
          state = 'ENDOSO';
          stateLabel = '📋 Endoso';
        } else if (doc.documentType === 'reinvoice') {
          state = 'REFACTURA';
          stateLabel = '🔄 Refactura';
        } else {
          state = 'OK';
          stateLabel = '✓ OK';
        }

        chain.push({
          position: position++,
          state: state,
          stateLabel: stateLabel,
          type: doc.documentType,
          ...this.extractChainData(doc)
        });

        rfcHistory.push(doc.receptorRFC);
        processedDocs.add(doc.fileId);
        currentReceptorRFC = doc.receptorRFC;
      }
      // ═══════════════════════════════════════════════════════════════
      // CASO 2: Retorno válido (solo si NO es continuación)
      // ═══════════════════════════════════════════════════════════════
      // RFC ya apareció pero NO es el poseedor actual = retorno
      // Ejemplo: A→B→C→B donde la última B recupera el vehículo
      else if (isPotentialReturn) {
        // Validación estricta de retorno
        const isLegitimateReturn = this.validateReturn(doc, chain, rfcHistory, currentReceptorRFC);
        
        if (isLegitimateReturn) {
          chain.push({
            position: position++,
            state: 'RETORNO',
            stateLabel: '🔄 Retorno',
            type: doc.documentType,
            ...this.extractChainData(doc)
          });

          rfcHistory.push(doc.receptorRFC);
          processedDocs.add(doc.fileId);
          currentReceptorRFC = doc.receptorRFC;
        }
      }
      // ═══════════════════════════════════════════════════════════════
      // CASO 3: Implícito - documento no procesado será marcado como RUPTURA
      // ═══════════════════════════════════════════════════════════════
    }

    // Documentos no procesados = rupturas
    for (const doc of documents) {
      if (!processedDocs.has(doc.fileId)) {
        chain.push({
          position: null,
          state: 'RUPTURA',
          stateLabel: '⚠️ Ruptura',
          type: doc.documentType,
          ...this.extractChainData(doc)
        });
      }
    }

    return chain;
  }

  /**
   * Valida si un retorno es legítimo
   * 
   * Un retorno es válido cuando:
   * 1. El RFC emisor apareció anteriormente en la cadena
   * 2. El RFC emisor NO es el poseedor actual (eso sería continuación normal)
   * 3. El VIN coincide con los documentos de la cadena
   * 
   * Casos de uso:
   * - Válido: A→B→C→B (B recupera el vehículo)
   * - Inválido: A→B→A→C donde A→C no es retorno sino continuación normal
   */
  validateReturn(doc, chain, rfcHistory, currentReceptorRFC) {
    // Validación 1: El RFC emisor debe haber aparecido antes
    if (!rfcHistory.includes(doc.emisorRFC)) {
      return false;
    }

    // Validación 2: CRÍTICO - Si el emisor es el poseedor actual, NO es retorno
    // Esto previene marcar incorrectamente casos de intermediación
    // Ejemplo: Agencia→Persona→Agencia→Persona2 (última NO es retorno)
    if (doc.emisorRFC === currentReceptorRFC) {
      return false; // Es continuación normal, no retorno
    }

    // Validación 3: El VIN debe coincidir con documentos de la cadena
    const chainVINs = chain.map(c => c.vin).filter(v => v);
    if (doc.vin && chainVINs.length > 0 && !chainVINs.includes(doc.vin)) {
      return false; // VIN inconsistente = no es retorno válido
    }

    // Validación 4: Opcional - verificar que el receptor actual no sea el mismo
    // (previene ciclos A→B→A→B→A infinitos que podrían ser sospechosos)
    const lastItem = chain[chain.length - 1];
    if (lastItem && lastItem.rfcEmisor === doc.receptorRFC) {
      // Es un ping-pong entre dos RFCs, pero técnicamente válido
      // No bloqueamos, pero podría agregarse lógica de alerta aquí
    }

    return true;
  }

  /**
   * Extrae datos para la cadena
   */
  extractChainData(doc) {
    return {
      fileId: doc.fileId,
      documentUrl: doc.url,
      createdAt: doc.createdAt,
      fecha: doc.fecha,
      numeroDocumento: doc.numeroDocumento,
      rfcEmisor: doc.emisorRFC,
      nombreEmisor: doc.emisorNombre,
      rfcReceptor: doc.receptorRFC,
      nombreReceptor: doc.receptorNombre,
      total: doc.total,
      usadoNuevo: doc.usadoNuevo,
      vin: doc.vin,
      vehiculo: doc.vehiculo
    };
  }

  /**
   * Detecta huecos y retornos en la secuencia
   * 
   * Diferencias importantes:
   * - RETORNO: RFC que ya fue propietario recupera el vehículo (válido)
   * - GAP: Falta un eslabón en la cadena (problema)
   * - ENDOSO: Transferencia válida mediante endoso (normal)
   * 
   * Los retornos NO se consideran gaps porque son transferencias legítimas.
   */
  detectSequenceGapsAdvanced(ownershipChain) {
    const gaps = [];
    const retornos = [];
    const sequential = ownershipChain.filter(inv => inv.position !== null);

    for (let i = 0; i < sequential.length - 1; i++) {
      const current = sequential[i];
      const next = sequential[i + 1];

      // Retorno válido - NO es gap
      if (next.state === 'RETORNO') {
        retornos.push({
          position: `Posición ${next.position}`,
          description: `${next.nombreReceptor} (${next.rfcReceptor}) recuperó el vehículo`,
          previousOwner: current.nombreReceptor,
          previousRFC: current.rfcReceptor,
          returnedTo: next.rfcEmisor,
          returnedToName: next.nombreEmisor,
          fecha: next.fecha
        });
        continue;
      }

      // Endoso - NO es gap, es transferencia válida
      if (next.state === 'ENDOSO') {
        // No agregar a gaps
        continue;
      }

      // Gap real en secuencia
      if (current.rfcReceptor !== next.rfcEmisor && next.state !== 'RUPTURA') {
        gaps.push({
          gapPosition: `Entre posición ${current.position} y ${next.position}`,
          expectedEmisor: current.rfcReceptor,
          expectedNombreEmisor: current.nombreReceptor,
          foundEmisor: next.rfcEmisor,
          foundNombreEmisor: next.nombreEmisor,
          description: `Se esperaba que "${current.nombreReceptor}" (RFC: ${current.rfcReceptor}) fuera el emisor de la siguiente transferencia, pero se encontró "${next.nombreEmisor}" (RFC: ${next.rfcEmisor})`,
          previousDocument: {
            fileId: current.fileId,
            fecha: current.fecha,
            rfcReceptor: current.rfcReceptor,
            nombreReceptor: current.nombreReceptor
          },
          nextDocument: {
            fileId: next.fileId,
            fecha: next.fecha,
            rfcEmisor: next.rfcEmisor,
            nombreEmisor: next.nombreEmisor
          }
        });
      }
    }

    // Documentos con ruptura (sin posición)
    const orphans = ownershipChain.filter(inv => inv.state === 'RUPTURA');
    if (orphans.length > 0) {
      gaps.push({
        gapPosition: 'Documentos sin conexión',
        type: 'orphan_documents',
        description: `Se encontraron ${orphans.length} documento(s) que no forman parte de la secuencia principal`,
        orphanDocuments: orphans.map(orphan => ({
          fileId: orphan.fileId,
          type: orphan.type,
          fecha: orphan.fecha,
          rfcEmisor: orphan.rfcEmisor,
          nombreEmisor: orphan.nombreEmisor,
          rfcReceptor: orphan.rfcReceptor,
          nombreReceptor: orphan.nombreReceptor
        }))
      });
    }

    return {
      hasGaps: gaps.length > 0,
      hasRetornos: retornos.length > 0,
      gaps: gaps,
      retornos: retornos
    };
  }

  /**
   * Extrae VIN del expediente
   */
  extractVIN(expedienteData) {
    for (const file of expedienteData.files) {
      if (file.ocr && file.ocr.vin) {
        return file.ocr.vin;
      }
      if (file.ocr && file.ocr.niv_vin_numero_serie) {
        return file.ocr.niv_vin_numero_serie;
      }
    }
    return null;
  }

  /**
   * Valida consistencia de VIN
   */
  validateVINConsistency(documents, referenceVIN) {
    const inconsistencies = [];

    for (const doc of documents) {
      const docVIN = doc.ocr.vin || doc.ocr.niv_vin_numero_serie;
      
      if (docVIN && docVIN !== referenceVIN) {
        inconsistencies.push({
          fileId: doc.file_id,
          expectedVIN: referenceVIN,
          foundVIN: docVIN
        });
      }
    }

    return {
      isValid: inconsistencies.length === 0,
      details: inconsistencies
    };
  }

  /**
   * Encuentra documento de origen
   */
  findOriginDocument(normalizedDocs) {
    return normalizedDocs.find(doc => 
      doc.usadoNuevo && 
      doc.usadoNuevo.toUpperCase() === 'NUEVO'
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // FASE 1: VALIDACIONES DE INTEGRIDAD (Escenarios 21-27)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Valida la integridad de los documentos
   * @param {Array} documents - Documentos normalizados
   * @param {Object} originDocument - Documento de origen
   * @returns {Object} Resultado de validaciones de integridad
   */
  validateDocumentIntegrity(documents, originDocument) {
    try {
      const result = {
        isValid: true,
        warnings: [],
        errors: [],
        details: {
          invalidRFCs: [],
          rfcNameVariations: [],
          missingRFCs: [],
          invalidDates: [],
          multipleOrigins: null,
          orphanReinvoices: [],
          originNotOldest: null
        }
      };

      // Escenario 21: RFC con formato inválido
      result.details.invalidRFCs = this.detectInvalidRFCs(documents);

      // Escenario 22: Nombres diferentes para mismo RFC
      result.details.rfcNameVariations = this.detectRFCNameVariations(documents);

      // Escenario 23: RFC faltante
      result.details.missingRFCs = this.detectMissingRFCs(documents);

      // Escenario 24: Fechas imposibles
      result.details.invalidDates = this.detectInvalidDates(documents);

      // Escenario 25: Dos documentos marcados como NUEVO
      result.details.multipleOrigins = this.detectMultipleOrigins(documents);

      // Escenario 26: Refactura sin factura previa
      result.details.orphanReinvoices = this.detectOrphanReinvoices(documents);

      // Escenario 27: Origen no es el más antiguo
      if (originDocument) {
        result.details.originNotOldest = this.validateOriginIsOldest(documents, originDocument);
      }

      // Determinar si es válido
      result.isValid = 
        result.details.invalidRFCs.length === 0 &&
        result.details.invalidDates.length === 0 &&
        result.details.multipleOrigins === null;

      // Generar warnings y errors
      if (result.details.invalidRFCs.length > 0) {
        result.warnings.push(`${result.details.invalidRFCs.length} RFC(s) con formato inválido`);
      }
      if (result.details.rfcNameVariations.length > 0) {
        result.warnings.push(`${result.details.rfcNameVariations.length} RFC(s) con variaciones de nombre`);
      }
      if (result.details.missingRFCs.length > 0) {
        result.warnings.push(`${result.details.missingRFCs.length} documento(s) con RFC faltante`);
      }
      if (result.details.invalidDates.length > 0) {
        result.errors.push(`${result.details.invalidDates.length} fecha(s) inválida(s)`);
      }
      if (result.details.multipleOrigins) {
        result.warnings.push(`Múltiples documentos marcados como origen (${result.details.multipleOrigins.count})`);
      }
      if (result.details.orphanReinvoices.length > 0) {
        result.warnings.push(`${result.details.orphanReinvoices.length} refactura(s) sin factura previa`);
      }
      if (result.details.originNotOldest) {
        result.warnings.push('El documento de origen no es el más antiguo');
      }

      return result;
    } catch (error) {
      console.error('Error en validateDocumentIntegrity:', error);
      return {
        isValid: true,
        warnings: [],
        errors: ['Error al validar integridad'],
        details: {
          invalidRFCs: [],
          rfcNameVariations: [],
          missingRFCs: [],
          invalidDates: [],
          multipleOrigins: null,
          orphanReinvoices: [],
          originNotOldest: null
        }
      };
    }
  }

  /**
   * Valida formato de RFC mexicano
   * @param {string} rfc - RFC a validar
   * @returns {boolean} true si es válido
   */
  validateRFCFormat(rfc) {
    if (!rfc || typeof rfc !== 'string') return false;
    
    // Formato: 3-4 letras + 6 dígitos + 3 alfanuméricos
    const rfcPattern = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    return rfcPattern.test(rfc.toUpperCase());
  }

  /**
   * Detecta RFCs inválidos en documentos
   * @param {Array} documents - Documentos a validar
   * @returns {Array} Lista de RFCs inválidos con su posición
   */
  detectInvalidRFCs(documents) {
    try {
      const invalidRFCs = [];
      
      documents.forEach((doc, index) => {
        const fieldsToCheck = [
          { field: 'rfcEmisor', value: doc.emisorRFC },
          { field: 'rfcReceptor', value: doc.receptorRFC }
        ];
        
        fieldsToCheck.forEach(({ field, value }) => {
          if (value && !this.validateRFCFormat(value)) {
            invalidRFCs.push({
              position: index + 1,
              rfc: value,
              field: field,
              reason: 'Invalid RFC format'
            });
          }
        });
      });
      
      return invalidRFCs;
    } catch (error) {
      console.error('Error en detectInvalidRFCs:', error);
      return [];
    }
  }

  /**
   * Detecta variaciones de nombre para mismo RFC
   * @param {Array} documents - Documentos a analizar
   * @returns {Array} RFCs con múltiples nombres
   */
  detectRFCNameVariations(documents) {
    try {
      const rfcNameMap = {};
      
      documents.forEach((doc, index) => {
        const pairs = [
          { rfc: doc.emisorRFC, name: doc.emisorNombre },
          { rfc: doc.receptorRFC, name: doc.receptorNombre }
        ];
        
        pairs.forEach(({ rfc, name }) => {
          if (rfc && name) {
            if (!rfcNameMap[rfc]) {
              rfcNameMap[rfc] = { names: new Set(), positions: [] };
            }
            rfcNameMap[rfc].names.add(name.trim());
            rfcNameMap[rfc].positions.push(index + 1);
          }
        });
      });
      
      // Retornar solo RFCs con múltiples nombres
      return Object.entries(rfcNameMap)
        .filter(([_, data]) => data.names.size > 1)
        .map(([rfc, data]) => ({
          rfc,
          names: Array.from(data.names),
          positions: [...new Set(data.positions)]
        }));
    } catch (error) {
      console.error('Error en detectRFCNameVariations:', error);
      return [];
    }
  }

  /**
   * Detecta RFCs faltantes en documentos
   * @param {Array} documents - Documentos a validar
   * @returns {Array} Documentos con RFCs faltantes
   */
  detectMissingRFCs(documents) {
    try {
      const missing = [];
      
      documents.forEach((doc, index) => {
        const fieldsToCheck = [
          { field: 'rfcEmisor', value: doc.emisorRFC },
          { field: 'rfcReceptor', value: doc.receptorRFC }
        ];
        
        fieldsToCheck.forEach(({ field, value }) => {
          if (!value || (typeof value === 'string' && value.trim() === '')) {
            missing.push({
              position: index + 1,
              field: field,
              documentType: doc.documentType
            });
          }
        });
      });
      
      return missing;
    } catch (error) {
      console.error('Error en detectMissingRFCs:', error);
      return [];
    }
  }

  /**
   * Valida que las fechas sean lógicamente posibles
   * @param {Array} documents - Documentos a validar
   * @returns {Array} Fechas inválidas encontradas
   */
  detectInvalidDates(documents) {
    try {
      const invalid = [];
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Fin del día actual
      
      documents.forEach((doc, index) => {
        if (!doc.fecha) return;
        
        const date = this.parseDate(doc.fecha);
        
        // Validar que la fecha no sea futura (permitir 1 día de margen)
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + 1);
        
        if (date && date > maxDate) {
          invalid.push({
            position: index + 1,
            date: doc.fecha,
            reason: 'Future date not allowed'
          });
        }
        
        // Validar que la fecha sea válida (no NaN)
        if (!date || isNaN(date.getTime())) {
          invalid.push({
            position: index + 1,
            date: doc.fecha,
            reason: 'Invalid date format'
          });
        }
      });
      
      return invalid;
    } catch (error) {
      console.error('Error en detectInvalidDates:', error);
      return [];
    }
  }

  /**
   * Detecta múltiples documentos marcados como origen
   * @param {Array} documents - Documentos a analizar
   * @returns {Object|null} Información de múltiples orígenes o null
   */
  detectMultipleOrigins(documents) {
    try {
      const origins = documents
        .map((doc, index) => ({ doc, index }))
        .filter(({ doc }) => {
          const usadoNuevo = doc.usadoNuevo || '';
          return usadoNuevo.toUpperCase() === 'NUEVO';
        });
      
      if (origins.length > 1) {
        return {
          count: origins.length,
          positions: origins.map(o => o.index + 1),
          dates: origins.map(o => o.doc.fecha).filter(d => d)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error en detectMultipleOrigins:', error);
      return null;
    }
  }

  /**
   * Detecta refacturas sin factura previa
   * @param {Array} documents - Documentos ordenados cronológicamente
   * @returns {Array} Refacturas huérfanas
   */
  detectOrphanReinvoices(documents) {
    try {
      const orphans = [];
      let hasInvoice = false;
      
      documents.forEach((doc, index) => {
        if (doc.documentType === 'invoice') {
          hasInvoice = true;
        }
        
        if (doc.documentType === 'reinvoice' && !hasInvoice) {
          orphans.push({
            position: index + 1,
            reason: 'No invoice found before this reinvoice'
          });
        }
      });
      
      return orphans;
    } catch (error) {
      console.error('Error en detectOrphanReinvoices:', error);
      return [];
    }
  }

  /**
   * Valida que el origen sea el documento más antiguo
   * @param {Array} documents - Documentos ordenados
   * @param {Object} originDoc - Documento de origen
   * @returns {Object|null} Información de discrepancia o null
   */
  validateOriginIsOldest(documents, originDoc) {
    try {
      if (!originDoc || documents.length === 0) return null;
      
      const oldestDoc = documents[0];
      const originIndex = documents.findIndex(d => d.fileId === originDoc.fileId);
      
      if (originIndex > 0) {
        return {
          originPosition: originIndex + 1,
          originDate: originDoc.fecha,
          oldestPosition: 1,
          oldestDate: oldestDoc.fecha
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error en validateOriginIsOldest:', error);
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FASE 2: DETECCIÓN DE PATRONES SOSPECHOSOS (Escenarios 39-43)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Detecta patrones sospechosos en la secuencia
   * @param {Array} chain - Cadena de propiedad construida
   * @param {Array} documents - Documentos originales
   * @returns {Object} Patrones detectados
   */
  detectSuspiciousPatterns(chain, documents) {
    try {
      const patterns = {
        pingPong: this.detectPingPongPattern(chain),
        rapidTriangulation: this.detectRapidTriangulation(chain, documents),
        endorsementChains: this.detectEndorsementChains(chain),
        frequentRFCs: this.detectFrequentRFCs(chain),
        complexCycles: this.detectComplexCycles(chain)
      };

      const suspiciousCount = Object.values(patterns)
        .reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

      return {
        hasSuspiciousPatterns: suspiciousCount > 0,
        suspiciousCount: suspiciousCount,
        patterns: patterns
      };
    } catch (error) {
      console.error('Error en detectSuspiciousPatterns:', error);
      return {
        hasSuspiciousPatterns: false,
        suspiciousCount: 0,
        patterns: {
          pingPong: [],
          rapidTriangulation: [],
          endorsementChains: [],
          frequentRFCs: [],
          complexCycles: []
        }
      };
    }
  }

  /**
   * Detecta patrón de ping-pong entre dos RFCs
   * @param {Array} chain - Cadena de propiedad
   * @returns {Array} Patrones de ping-pong detectados
   */
  detectPingPongPattern(chain) {
    try {
      const patterns = [];
      const pairCounts = {};
      const sequential = chain.filter(item => item.position !== null);
      
      for (let i = 0; i < sequential.length - 1; i++) {
        const current = sequential[i];
        const next = sequential[i + 1];
        
        if (current.state === 'RUPTURA' || next.state === 'RUPTURA') continue;
        
        // Ping-pong: A→B seguido de B→A (el emisor actual recibe en el siguiente)
        // Y el receptor actual emite en el siguiente
        if (current.rfcEmisor === next.rfcReceptor && current.rfcReceptor === next.rfcEmisor) {
          // Crear clave única para el par (ordenada)
          const pairKey = [current.rfcEmisor, current.rfcReceptor].sort().join('↔');
          
          if (!pairCounts[pairKey]) {
            pairCounts[pairKey] = {
              rfcs: [current.rfcEmisor, current.rfcReceptor].sort(),
              positions: []
            };
          }
          
          pairCounts[pairKey].positions.push(current.position, next.position);
        }
      }
      
      // Filtrar pares con 3+ ocurrencias (6+ posiciones = 3+ transferencias ping-pong)
      Object.entries(pairCounts).forEach(([_, data]) => {
        const uniquePositions = [...new Set(data.positions)];
        if (uniquePositions.length >= 6) {
          patterns.push({
            rfcA: data.rfcs[0],
            rfcB: data.rfcs[1],
            occurrences: Math.floor(uniquePositions.length / 2),
            positions: uniquePositions.sort((a, b) => a - b),
            severity: uniquePositions.length >= 8 ? 'high' : 'medium'
          });
        }
      });
      
      return patterns;
    } catch (error) {
      console.error('Error en detectPingPongPattern:', error);
      return [];
    }
  }

  /**
   * Detecta triangulación rápida (A→B→C→A en < 30 días)
   * @param {Array} chain - Cadena de propiedad
   * @param {Array} documents - Documentos con fechas
   * @returns {Array} Triangulaciones detectadas
   */
  detectRapidTriangulation(chain, documents) {
    try {
      const triangulations = [];
      const sequential = chain.filter(item => item.position !== null);
      
      for (let i = 0; i < sequential.length - 2; i++) {
        const first = sequential[i];
        
        // Buscar si el RFC inicial reaparece como receptor
        for (let j = i + 2; j < sequential.length; j++) {
          const last = sequential[j];
          
          if (first.rfcEmisor === last.rfcReceptor) {
            // Encontramos un ciclo
            const startDoc = documents.find(d => d.fileId === first.fileId);
            const endDoc = documents.find(d => d.fileId === last.fileId);
            
            if (startDoc && endDoc && startDoc.fecha && endDoc.fecha) {
              const startDate = this.parseDate(startDoc.fecha);
              const endDate = this.parseDate(endDoc.fecha);
              
              if (startDate && endDate && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                const daysDiff = Math.abs((endDate - startDate) / (1000 * 60 * 60 * 24));
                
                if (daysDiff < 30) {
                  const cycleRFCs = [];
                  for (let k = i; k <= j; k++) {
                    if (sequential[k]) {
                      cycleRFCs.push(sequential[k].rfcEmisor);
                    }
                  }
                  if (last.rfcReceptor) {
                    cycleRFCs.push(last.rfcReceptor);
                  }
                  
                  triangulations.push({
                    cycle: cycleRFCs,
                    positions: sequential.slice(i, j + 1).map(c => c.position).filter(p => p !== null),
                    startDate: startDoc.fecha,
                    endDate: endDoc.fecha,
                    daysDuration: Math.round(daysDiff),
                    severity: daysDiff < 15 ? 'critical' : 'high'
                  });
                }
              }
            }
          }
        }
      }
      
      return triangulations;
    } catch (error) {
      console.error('Error en detectRapidTriangulation:', error);
      return [];
    }
  }

  /**
   * Detecta cadenas largas de endosos consecutivos
   * @param {Array} chain - Cadena de propiedad
   * @returns {Array} Cadenas de endosos detectadas
   */
  detectEndorsementChains(chain) {
    try {
      const chains = [];
      let currentChain = null;
      const sequential = chain.filter(item => item.position !== null);
      
      sequential.forEach((item) => {
        if (item.state === 'ENDOSO') {
          if (!currentChain) {
            currentChain = {
              startPosition: item.position,
              rfcs: [item.rfcEmisor],
              positions: [item.position]
            };
          }
          if (item.rfcReceptor) {
            currentChain.rfcs.push(item.rfcReceptor);
          }
          currentChain.positions.push(item.position);
        } else {
          if (currentChain && currentChain.positions.length >= 4) {
            chains.push({
              ...currentChain,
              endPosition: currentChain.positions[currentChain.positions.length - 1],
              chainLength: currentChain.positions.length,
              severity: currentChain.positions.length >= 6 ? 'high' : 'medium'
            });
          }
          currentChain = null;
        }
      });
      
      // Verificar última cadena
      if (currentChain && currentChain.positions.length >= 4) {
        chains.push({
          ...currentChain,
          endPosition: currentChain.positions[currentChain.positions.length - 1],
          chainLength: currentChain.positions.length,
          severity: currentChain.positions.length >= 6 ? 'high' : 'medium'
        });
      }
      
      return chains;
    } catch (error) {
      console.error('Error en detectEndorsementChains:', error);
      return [];
    }
  }

  /**
   * Detecta RFCs que aparecen con frecuencia alta (5+ veces)
   * @param {Array} chain - Cadena de propiedad
   * @returns {Array} RFCs frecuentes
   */
  detectFrequentRFCs(chain) {
    try {
      const rfcCounts = {};
      const agencyKeywords = ['agencia', 'agenc', 'agency', 'dealer', 'distribui', 'concesion'];
      const sequential = chain.filter(item => item.position !== null);
      
      sequential.forEach(item => {
        [item.rfcEmisor, item.rfcReceptor].forEach((rfc, idx) => {
          const name = idx === 0 ? item.nombreEmisor : item.nombreReceptor;
          
          if (rfc) {
            if (!rfcCounts[rfc]) {
              rfcCounts[rfc] = {
                name: name || '',
                positions: [],
                isAgency: false
              };
            }
            if (item.position) {
              rfcCounts[rfc].positions.push(item.position);
            }
            
            // Detectar si es agencia
            if (name) {
              const nameLower = name.toLowerCase();
              const isAgency = agencyKeywords.some(kw => nameLower.includes(kw));
              rfcCounts[rfc].isAgency = rfcCounts[rfc].isAgency || isAgency;
            }
          }
        });
      });
      
      // Filtrar RFCs con 5+ apariciones (excluyendo agencias)
      return Object.entries(rfcCounts)
        .filter(([_, data]) => {
          const uniquePositions = [...new Set(data.positions)];
          return uniquePositions.length >= 5 && !data.isAgency;
        })
        .map(([rfc, data]) => ({
          rfc,
          name: data.name,
          occurrences: [...new Set(data.positions)].length,
          positions: [...new Set(data.positions)].sort((a, b) => a - b),
          isAgency: data.isAgency,
          severity: data.positions.length >= 7 ? 'high' : 'medium'
        }));
    } catch (error) {
      console.error('Error en detectFrequentRFCs:', error);
      return [];
    }
  }

  /**
   * Detecta ciclos complejos (retorno seguido de continuación)
   * @param {Array} chain - Cadena de propiedad
   * @returns {Array} Ciclos complejos detectados
   */
  detectComplexCycles(chain) {
    try {
      const cycles = [];
      const sequential = chain.filter(item => item.position !== null);
      
      for (let i = 0; i < sequential.length; i++) {
        if (sequential[i].state === 'RETORNO' && i < sequential.length - 1) {
          const returnItem = sequential[i];
          const nextItem = sequential[i + 1];
          
          // Verificar si después del retorno continúa a un RFC diferente
          if (nextItem.state !== 'RUPTURA' && 
              returnItem.rfcReceptor !== nextItem.rfcReceptor) {
            
            const sequence = [];
            for (let j = Math.max(0, i - 2); j <= i + 1 && j < sequential.length; j++) {
              if (sequential[j] && sequential[j].rfcEmisor) {
                sequence.push(sequential[j].rfcEmisor);
              }
            }
            if (nextItem.rfcReceptor) {
              sequence.push(nextItem.rfcReceptor);
            }
            
            cycles.push({
              description: 'Return followed by continuation',
              sequence: sequence.join('→'),
              positions: [returnItem.position, nextItem.position].filter(p => p !== null),
              severity: 'medium'
            });
          }
        }
      }
      
      return cycles;
    } catch (error) {
      console.error('Error en detectComplexCycles:', error);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FASE 3: ANÁLISIS TEMPORAL (Escenarios 28-30)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Analiza anomalías temporales en la secuencia
   * @param {Array} chain - Cadena de propiedad
   * @param {Array} documents - Documentos con fechas
   * @returns {Object} Análisis temporal
   */
  analyzeTemporalAnomalies(chain, documents) {
    try {
      const anomalies = {
        contradictions: this.detectTemporalContradictions(chain, documents),
        sameDayTransfers: this.detectSameDayTransfers(documents),
        largeGaps: this.detectLargeTemporalGaps(chain, documents)
      };

      const anomalyCount = Object.values(anomalies)
        .reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

      return {
        hasTemporalAnomalies: anomalyCount > 0,
        anomalyCount: anomalyCount,
        anomalies: anomalies
      };
    } catch (error) {
      console.error('Error en analyzeTemporalAnomalies:', error);
      return {
        hasTemporalAnomalies: false,
        anomalyCount: 0,
        anomalies: {
          contradictions: [],
          sameDayTransfers: [],
          largeGaps: []
        }
      };
    }
  }

  /**
   * Detecta contradicciones temporales
   * @param {Array} chain - Cadena de propiedad
   * @param {Array} documents - Documentos
   * @returns {Array} Contradicciones encontradas
   */
  detectTemporalContradictions(chain, documents) {
    try {
      const contradictions = [];
      const sequential = chain.filter(item => item.position !== null);
      
      for (let i = 0; i < sequential.length - 1; i++) {
        if (sequential[i].state === 'RUPTURA' || sequential[i + 1].state === 'RUPTURA') continue;
        
        const currentDoc = documents.find(d => d.fileId === sequential[i].fileId);
        const nextDoc = documents.find(d => d.fileId === sequential[i + 1].fileId);
        
        if (currentDoc && nextDoc && currentDoc.fecha && nextDoc.fecha) {
          const currentDate = this.parseDate(currentDoc.fecha);
          const nextDate = this.parseDate(nextDoc.fecha);
          
          if (currentDate && nextDate && !isNaN(currentDate.getTime()) && !isNaN(nextDate.getTime())) {
            const daysDiff = (nextDate - currentDate) / (1000 * 60 * 60 * 24);
            
            // Si la secuencia es correcta pero fecha va hacia atrás más de 30 días
            if (daysDiff < -30) {
              contradictions.push({
                position: sequential[i + 1].position,
                currentDate: nextDoc.fecha,
                previousDate: currentDoc.fecha,
                daysDifference: Math.round(daysDiff),
                severity: Math.abs(daysDiff) > 365 ? 'high' : 'medium'
              });
            }
          }
        }
      }
      
      return contradictions;
    } catch (error) {
      console.error('Error en detectTemporalContradictions:', error);
      return [];
    }
  }

  /**
   * Detecta múltiples transferencias en el mismo día
   * @param {Array} documents - Documentos ordenados
   * @returns {Array} Días con múltiples transferencias
   */
  detectSameDayTransfers(documents) {
    try {
      const sameDayGroups = [];
      const dateGroups = {};
      
      documents.forEach((doc, index) => {
        if (!doc.fecha) return;
        
        const date = this.parseDate(doc.fecha);
        if (!date || isNaN(date.getTime())) return;
        
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!dateGroups[dateKey]) {
          dateGroups[dateKey] = [];
        }
        dateGroups[dateKey].push(index + 1);
      });
      
      // Filtrar días con 3+ transferencias
      Object.entries(dateGroups).forEach(([date, positions]) => {
        if (positions.length >= 3) {
          sameDayGroups.push({
            date: date,
            transferCount: positions.length,
            positions: positions,
            severity: positions.length >= 5 ? 'critical' : positions.length >= 4 ? 'high' : 'medium'
          });
        }
      });
      
      return sameDayGroups;
    } catch (error) {
      console.error('Error en detectSameDayTransfers:', error);
      return [];
    }
  }

  /**
   * Detecta gaps temporales grandes entre documentos consecutivos
   * @param {Array} chain - Cadena de propiedad
   * @param {Array} documents - Documentos
   * @returns {Array} Gaps grandes detectados
   */
  detectLargeTemporalGaps(chain, documents) {
    try {
      const largeGaps = [];
      const sequential = chain.filter(item => item.position !== null);
      
      for (let i = 0; i < sequential.length - 1; i++) {
        if (sequential[i].state === 'RUPTURA') continue;
        
        const currentDoc = documents.find(d => d.fileId === sequential[i].fileId);
        const nextDoc = documents.find(d => d.fileId === sequential[i + 1].fileId);
        
        if (currentDoc && nextDoc && currentDoc.fecha && nextDoc.fecha) {
          const currentDate = this.parseDate(currentDoc.fecha);
          const nextDate = this.parseDate(nextDoc.fecha);
          
          if (currentDate && nextDate && !isNaN(currentDate.getTime()) && !isNaN(nextDate.getTime())) {
            const yearsDiff = (nextDate - currentDate) / (1000 * 60 * 60 * 24 * 365.25);
            
            if (yearsDiff > 3) {
              largeGaps.push({
                fromPosition: sequential[i].position,
                toPosition: sequential[i + 1].position,
                fromDate: currentDoc.fecha,
                toDate: nextDoc.fecha,
                yearsDifference: parseFloat(yearsDiff.toFixed(1)),
                severity: yearsDiff > 5 ? 'high' : 'medium'
              });
            }
          }
        }
      }
      
      return largeGaps;
    } catch (error) {
      console.error('Error en detectLargeTemporalGaps:', error);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // FASE 4: DETECCIÓN DE DUPLICADOS (Escenarios 34-36)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Detecta documentos duplicados
   * @param {Array} documents - Documentos a analizar
   * @returns {Object} Duplicados encontrados
   */
  detectDuplicates(documents) {
    try {
      const duplicates = {
        folios: this.detectDuplicateFolios(documents),
        crossTypeFolios: this.detectCrossTypeFolios(documents),
        rfcPairs: this.detectRepeatedRFCPairs(documents)
      };

      const duplicateCount = Object.values(duplicates)
        .reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

      return {
        hasDuplicates: duplicateCount > 0,
        duplicateCount: duplicateCount,
        duplicates: duplicates
      };
    } catch (error) {
      console.error('Error en detectDuplicates:', error);
      return {
        hasDuplicates: false,
        duplicateCount: 0,
        duplicates: {
          folios: [],
          crossTypeFolios: [],
          rfcPairs: []
        }
      };
    }
  }

  /**
   * Detecta folios fiscales duplicados
   * @param {Array} documents - Documentos
   * @returns {Array} Folios duplicados
   */
  detectDuplicateFolios(documents) {
    try {
      const folioMap = {};
      
      documents.forEach((doc, index) => {
        const folio = doc.numeroDocumento || doc.folioFiscal;
        if (folio) {
          if (!folioMap[folio]) {
            folioMap[folio] = {
              positions: [],
              types: []
            };
          }
          folioMap[folio].positions.push(index + 1);
          folioMap[folio].types.push(doc.documentType);
        }
      });
      
      // Retornar solo folios con 2+ ocurrencias
      return Object.entries(folioMap)
        .filter(([_, data]) => data.positions.length > 1)
        .map(([folio, data]) => ({
          folio,
          positions: data.positions,
          types: data.types
        }));
    } catch (error) {
      console.error('Error en detectDuplicateFolios:', error);
      return [];
    }
  }

  /**
   * Detecta mismo folio en diferentes tipos de documentos
   * @param {Array} documents - Documentos
   * @returns {Array} Folios cross-type
   */
  detectCrossTypeFolios(documents) {
    try {
      const crossType = [];
      const folioMap = {};
      
      documents.forEach((doc, index) => {
        const folio = doc.numeroDocumento || doc.folioFiscal;
        if (folio) {
          if (!folioMap[folio]) {
            folioMap[folio] = [];
          }
          folioMap[folio].push({
            position: index + 1,
            type: doc.documentType
          });
        }
      });
      
      // Filtrar folios con diferentes tipos
      Object.entries(folioMap).forEach(([folio, docs]) => {
        const types = new Set(docs.map(d => d.type));
        if (types.size > 1) {
          crossType.push({
            folio,
            documents: docs
          });
        }
      });
      
      return crossType;
    } catch (error) {
      console.error('Error en detectCrossTypeFolios:', error);
      return [];
    }
  }

  /**
   * Detecta pares de RFCs repetidos
   * @param {Array} documents - Documentos
   * @returns {Array} Pares repetidos
   */
  detectRepeatedRFCPairs(documents) {
    try {
      const pairMap = {};
      
      documents.forEach((doc, index) => {
        if (doc.emisorRFC && doc.receptorRFC) {
          const pairKey = `${doc.emisorRFC}→${doc.receptorRFC}`;
          
          if (!pairMap[pairKey]) {
            pairMap[pairKey] = [];
          }
          pairMap[pairKey].push(index + 1);
        }
      });
      
      // Retornar pares con 3+ ocurrencias
      return Object.entries(pairMap)
        .filter(([_, positions]) => positions.length >= 3)
        .map(([pair, positions]) => ({
          pair,
          occurrences: positions.length,
          positions
        }));
    } catch (error) {
      console.error('Error en detectRepeatedRFCPairs:', error);
      return [];
    }
  }
}

module.exports = SequenceAnalyzer;