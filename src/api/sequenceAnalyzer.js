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

    // Guardar TODOS los documentos (incluyendo verificaciones)
    const allFiles = expedienteData.files.filter(file => 
      file.ocr && typeof file.ocr === 'object'
    );

    // Normalizar TODOS los documentos
    const allDocumentsNormalized = allFiles.map(doc => this.normalizeDocument(doc));
    console.log(`Total de documentos (incluye verificaciones): ${allDocumentsNormalized.length}`);

    // Ahora filtrar solo facturas/refacturas/endosos para análisis de cadena
    const documents = allFiles.filter(file => 
      file.document_type === 'invoice' || 
      file.document_type === 'reinvoice' || 
      file.document_type === 'endorsement'
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

    // ═══════════════════════════════════════════════════════════════
    // ANÁLISIS AVANZADO - FASE 1: VALIDACIÓN DE INTEGRIDAD
    // ═══════════════════════════════════════════════════════════════
    // Validación adicional con protección completa
    try {
      console.log('→ Ejecutando análisis de integridad...');
      
      if (sortedDocs && Array.isArray(sortedDocs) && sortedDocs.length > 0) {
        if (typeof this.validateDocumentIntegrity === 'function') {
          // Si integrityAnalysis no se calculó antes, calcularlo ahora
          if (!integrityAnalysis) {
            integrityAnalysis = this.validateDocumentIntegrity(sortedDocs, originDocument);
          }
          console.log('✓ Análisis de integridad completado');
        } else {
          console.warn('⚠ validateDocumentIntegrity no está definido');
        }
      }
      
    } catch (error) {
      console.error('❌ Error en análisis de integridad:', error.message);
      // No sobrescribir integrityAnalysis si ya existe
      if (!integrityAnalysis) {
        integrityAnalysis = null;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // FASE 2: DETECCIÓN DE PATRONES SOSPECHOSOS
    // ═══════════════════════════════════════════════════════════════
    try {
      console.log('→ Ejecutando detección de patrones sospechosos...');
      
      if (ownershipChain && Array.isArray(ownershipChain) && 
          ownershipChain.length > 0 && sortedDocs) {
        
        if (typeof this.detectSuspiciousPatterns === 'function') {
          patternDetection = this.detectSuspiciousPatterns(ownershipChain, sortedDocs);
          console.log('✓ Detección de patrones completada');
        } else {
          console.warn('⚠ detectSuspiciousPatterns no está definido');
        }
      }
      
    } catch (error) {
      console.error('❌ Error en detección de patrones:', error.message);
      patternDetection = null;
    }

    // ═══════════════════════════════════════════════════════════════
    // ANÁLISIS DE VERIFICACIONES VEHICULARES
    // ═══════════════════════════════════════════════════════════════
    let verificationAnalysis = null;

    try {
      console.log('→ Ejecutando análisis de verificaciones...');
      
      if (typeof this.analyzeVerifications === 'function') {
        // Pasar todos los documentos normalizados y los documentos de cadena
        verificationAnalysis = this.analyzeVerifications(
          allDocumentsNormalized, 
          sortedDocs
        );
        console.log('✓ Análisis de verificaciones completado');
      } else {
        console.warn('⚠ analyzeVerifications no está definido');
      }
      
    } catch (error) {
      console.error('❌ Error en análisis de verificaciones:', error.message);
      verificationAnalysis = null;
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

    // Agregar análisis avanzado solo si existe
    if (integrityAnalysis) {
      response.integrityAnalysis = integrityAnalysis;
      console.log('✓ integrityAnalysis agregado al response');
    }
    // Agregar detección de patrones solo si existe
    if (patternDetection) {
      response.patternDetection = patternDetection;
      console.log('✓ patternDetection agregado al response');
    }
    // Agregar análisis de verificaciones
    if (verificationAnalysis) {
      response.verificationAnalysis = verificationAnalysis;
      console.log('✓ verificationAnalysis agregado al response');
    }
    if (temporalAnalysis) {
      response.temporalAnalysis = temporalAnalysis;
    }
    if (duplicateDetection) {
      response.duplicateDetection = duplicateDetection;
    }

    console.log('✓ analyzeOwnershipSequence completado exitosamente');
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
    // ═══════════════════════════════════════════════════════════════
    // VERIFICACIONES (verification) - Comprobantes de verificación vehicular
    // ═══════════════════════════════════════════════════════════════
    const isVerification = doc.document_type === 'verification';

    if (isVerification) {
      return {
        fileId: doc.file_id,
        documentType: 'verification',
        createdAt: doc.created_at || null,
        
        // Campos específicos de verificación
        fechaEmision: ocr.fecha_hora_emision || null,
        vigencia: ocr.vigencia || null,
        nombrePropietario: ocr.nombre_propietario || null,
        resultado: ocr.resultado || null,
        periodo: ocr.periodo || null,
        folio: ocr.folio || null,
        
        // Datos del vehículo
        vin: ocr.niv_vin || ocr.vin || null,
        placa: ocr.placa || null,
        marca: ocr.marca || null,
        modelo: ocr.modelo || null,
        ano: ocr.ano || null,
        
        // Compatibilidad con sistema existente
        fecha: ocr.fecha_hora_emision || doc.created_at || null,
        
        // Campos que no aplican (mantener null para compatibilidad)
        rfcEmisor: null,
        rfcReceptor: null,
        nombreEmisor: null,
        nombreReceptor: null,
        total: null,
        usadoNuevo: null,
        pedimento: null,
        detallesVehiculo: null
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
   * @param {Array} documents - Documentos originales normalizados
   * @returns {Object} Patrones detectados
   */
  detectSuspiciousPatterns(chain, documents) {
    console.log('  → detectSuspiciousPatterns iniciando...');
    
    const result = {
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

    if (!chain || !Array.isArray(chain) || chain.length === 0) {
      console.warn('  ⚠ chain inválida');
      return result;
    }

    try {
      // Detectar cada patrón
      result.patterns.pingPong = this.detectPingPongPattern(chain, documents);
      result.patterns.rapidTriangulation = this.detectRapidTriangulation(chain, documents);
      result.patterns.endorsementChains = this.detectEndorsementChains(chain);
      result.patterns.frequentRFCs = this.detectFrequentRFCs(chain);
      result.patterns.complexCycles = this.detectComplexCycles(chain);
      
      // Calcular total de patrones sospechosos
      result.suspiciousCount = 
        result.patterns.pingPong.length +
        result.patterns.rapidTriangulation.length +
        result.patterns.endorsementChains.length +
        result.patterns.frequentRFCs.length +
        result.patterns.complexCycles.length;
      
      result.hasSuspiciousPatterns = result.suspiciousCount > 0;
      
      console.log('  ✓ detectSuspiciousPatterns completado');
      console.log('  → Patrones encontrados:', result.suspiciousCount);
      
    } catch (error) {
      console.error('  ❌ Error en detectSuspiciousPatterns:', error.message);
    }
    
    return result;
  }

  /**
   * Detecta patrón de ping-pong entre dos RFCs con validación anti-duplicados
   * REGLA CRÍTICA: No contar como ping-pong si son duplicados administrativos
   * @param {Array} chain - Cadena de propiedad
   * @param {Array} documents - Documentos originales
   * @returns {Array} Patrones de ping-pong detectados
   */
  detectPingPongPattern(chain, documents) {
    const patterns = [];
    
    try {
      // PASO 1: Filtrar duplicados administrativos
      const uniqueTransfers = this.filterAdministrativeDuplicates(chain, documents);
      
      if (uniqueTransfers.length < 3) {
        return []; // Necesitamos al menos 3 transferencias para ping-pong
      }
      
      // PASO 2: Buscar patrones A↔B en transferencias únicas
      const pairCounts = {};
      
      for (let i = 0; i < uniqueTransfers.length - 1; i++) {
        const current = uniqueTransfers[i];
        const next = uniqueTransfers[i + 1];
        
        if (current.state === 'RUPTURA' || next.state === 'RUPTURA') continue;
        
        // Crear clave del par (ordenada alfabéticamente para detectar A↔B y B↔A)
        const rfcs = [current.rfcEmisor, current.rfcReceptor, next.rfcEmisor, next.rfcReceptor]
          .filter(rfc => rfc);
        const uniqueRFCs = [...new Set(rfcs)];
        
        if (uniqueRFCs.length === 2) {
          const pairKey = uniqueRFCs.sort().join('↔');
          
          if (!pairCounts[pairKey]) {
            pairCounts[pairKey] = {
              rfcs: uniqueRFCs,
              transfers: [],
              positions: []
            };
          }
          
          pairCounts[pairKey].transfers.push(current, next);
          pairCounts[pairKey].positions.push(current.position, next.position);
        }
      }
      
      // PASO 3: Filtrar pares con 3+ transferencias (ping-pong real)
      Object.entries(pairCounts).forEach(([pairKey, data]) => {
        const uniquePositions = [...new Set(data.positions)].sort((a, b) => a - b);
        
        // Necesitamos al menos 6 posiciones (3 transferencias completas A→B→A)
        if (uniquePositions.length >= 6) {
          
          // Buscar los documentos originales para análisis adicional
          const relatedDocs = documents.filter(doc => {
            const docRFCs = [doc.emisorRFC, doc.receptorRFC].filter(r => r);
            return data.rfcs.some(rfc => docRFCs.includes(rfc));
          });
          
          // Calcular estadísticas
          const amounts = relatedDocs.map(d => d.total).filter(a => a);
          const dates = relatedDocs.map(d => d.fecha).filter(f => f);
          const names = [
            ...relatedDocs.map(d => d.emisorNombre),
            ...relatedDocs.map(d => d.receptorNombre)
          ].filter(n => n);
          
          // Detectar si comparten apellido (posible parentesco)
          const uniqueNames = [...new Set(names)];
          const sameLastName = this.detectSharedLastName(uniqueNames);
          
          // Detectar si montos son idénticos o progresivos
          const identicalAmounts = amounts.length > 1 && 
            amounts.every(a => a === amounts[0]);
          
          const progressiveAmounts = this.isProgressiveSequence(amounts);
          
          patterns.push({
            rfcA: data.rfcs[0],
            rfcB: data.rfcs[1],
            occurrences: Math.floor(uniquePositions.length / 2),
            positions: uniquePositions,
            severity: uniquePositions.length >= 8 ? 'critical' : 
                     uniquePositions.length >= 6 ? 'high' : 'medium',
            details: {
              totalTransfers: uniquePositions.length,
              dateRange: dates.length >= 2 ? {
                first: dates[0],
                last: dates[dates.length - 1],
                monthsDuration: this.calculateMonthsDiff(dates[0], dates[dates.length - 1])
              } : null,
              amounts: amounts.length > 0 ? amounts : null,
              identicalAmounts: identicalAmounts,
              progressiveAmounts: progressiveAmounts,
              sameLastName: sameLastName,
              suspiciousSignals: this.buildPingPongSignals({
                occurrences: Math.floor(uniquePositions.length / 2),
                identicalAmounts,
                progressiveAmounts,
                sameLastName,
                monthsDuration: dates.length >= 2 ? 
                  this.calculateMonthsDiff(dates[0], dates[dates.length - 1]) : 0
              })
            }
          });
        }
      });
      
    } catch (error) {
      console.error('Error en detectPingPongPattern:', error);
    }
    
    return patterns;
  }

  /**
   * Filtra duplicados administrativos para evitar falsos positivos en ping-pong
   * CRITERIOS: Mismo detalles_vehiculo O mismo pedimento O misma fecha emisión
   * @param {Array} chain - Cadena de propiedad
   * @param {Array} documents - Documentos normalizados
   * @returns {Array} Transferencias únicas (sin duplicados)
   */
  filterAdministrativeDuplicates(chain, documents) {
    const uniqueTransfers = [];
    
    try {
      for (const transfer of chain) {
        // Buscar el documento normalizado
        const doc = documents.find(d => d.fileId === transfer.fileId);
        if (!doc) {
          uniqueTransfers.push(transfer);
          continue;
        }
        
        // Verificar si ya procesamos un documento similar
        let isDuplicate = false;
        
        for (const processed of uniqueTransfers) {
          const processedDoc = documents.find(d => d.fileId === processed.fileId);
          if (!processedDoc) continue;
          
          // CRITERIO 1: Mismo par de RFCs
          if (doc.emisorRFC !== processedDoc.emisorRFC ||
              doc.receptorRFC !== processedDoc.receptorRFC) {
            continue;
          }
          
          // CRITERIO 2: Mismo detalles_vehiculo (normalizado)
          // Construir detalles del vehículo desde los campos normalizados
          const details1 = doc.vehiculo ? 
            `${doc.vehiculo.marca || ''} ${doc.vehiculo.modelo || ''} ${doc.vehiculo.ano || ''}`.trim() : 
            null;
          const details2 = processedDoc.vehiculo ? 
            `${processedDoc.vehiculo.marca || ''} ${processedDoc.vehiculo.modelo || ''} ${processedDoc.vehiculo.ano || ''}`.trim() : 
            null;
          
          if (details1 && details2 && details1.length > 0 && details2.length > 0) {
            const normalized1 = this.normalizeText(details1);
            const normalized2 = this.normalizeText(details2);
            
            if (normalized1 === normalized2) {
              isDuplicate = true;
              break;
            }
          }
          
          // CRITERIO 3: Mismo número de documento/pedimento (normalizado)
          const docNum1 = doc.numeroDocumento || null;
          const docNum2 = processedDoc.numeroDocumento || null;
          
          if (docNum1 && docNum2) {
            const normalized1 = this.normalizePedimento(docNum1);
            const normalized2 = this.normalizePedimento(docNum2);
            
            if (normalized1 === normalized2) {
              isDuplicate = true;
              break;
            }
          }
          
          // CRITERIO 4: Misma fecha de emisión (diferencia < 1 hora)
          if (doc.fecha && processedDoc.fecha) {
            const date1 = this.parseDate(doc.fecha);
            const date2 = this.parseDate(processedDoc.fecha);
            
            if (date1 && date2 && !isNaN(date1.getTime()) && !isNaN(date2.getTime())) {
              const diffHours = Math.abs(date1 - date2) / (1000 * 60 * 60);
              
              if (diffHours < 1) {
                isDuplicate = true;
                break;
              }
            }
          }
        }
        
        if (!isDuplicate) {
          uniqueTransfers.push(transfer);
        }
      }
      
    } catch (error) {
      console.error('Error en filterAdministrativeDuplicates:', error);
      return chain; // En caso de error, retornar cadena original
    }
    
    return uniqueTransfers;
  }

  /**
   * Normaliza texto para comparación (quitar acentos, espacios extra, puntuación)
   */
  normalizeText(text) {
    if (!text) return '';
    return text
      .toString()
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^\w\s]/g, '') // Quitar puntuación
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  }

  /**
   * Normaliza pedimento para comparación (quitar espacios y guiones)
   */
  normalizePedimento(pedimento) {
    if (!pedimento) return '';
    return pedimento.toString().replace(/[\s-]/g, '').trim();
  }

  /**
   * Detecta si nombres comparten apellido
   */
  detectSharedLastName(names) {
    if (names.length < 2) return false;
    
    try {
      const lastNames = names.map(name => {
        const parts = name.trim().split(/\s+/);
        return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : null;
      }).filter(ln => ln);
      
      if (lastNames.length < 2) return false;
      
      // Verificar si al menos 2 apellidos son iguales
      const lastNameCounts = {};
      lastNames.forEach(ln => {
        lastNameCounts[ln] = (lastNameCounts[ln] || 0) + 1;
      });
      
      return Object.values(lastNameCounts).some(count => count >= 2);
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Detecta si montos siguen una progresión aritmética
   */
  isProgressiveSequence(amounts) {
    if (amounts.length < 3) return false;
    
    try {
      const differences = [];
      for (let i = 1; i < amounts.length; i++) {
        differences.push(amounts[i] - amounts[i - 1]);
      }
      
      // Verificar si todas las diferencias son similares (±10%)
      const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
      const tolerance = Math.abs(avgDiff * 0.1);
      
      return differences.every(diff => 
        Math.abs(diff - avgDiff) <= tolerance && diff > 0
      );
      
    } catch (error) {
      return false;
    }
  }

  /**
   * Calcula diferencia en meses entre dos fechas
   */
  calculateMonthsDiff(date1Str, date2Str) {
    try {
      const date1 = this.parseDate(date1Str);
      const date2 = this.parseDate(date2Str);
      
      if (!date1 || !date2 || isNaN(date1.getTime()) || isNaN(date2.getTime())) {
        return 0;
      }
      
      const yearsDiff = date2.getFullYear() - date1.getFullYear();
      const monthsDiff = date2.getMonth() - date1.getMonth();
      
      return yearsDiff * 12 + monthsDiff;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Construye lista de señales sospechosas para ping-pong
   */
  buildPingPongSignals(data) {
    const signals = [];
    
    if (data.occurrences >= 4) {
      signals.push(`${data.occurrences} transferencias detectadas`);
    }
    
    if (data.identicalAmounts) {
      signals.push('Montos idénticos en todas las transferencias');
    }
    
    if (data.progressiveAmounts) {
      signals.push('Incremento progresivo artificial de precios');
    }
    
    if (data.sameLastName) {
      signals.push('Posible parentesco (mismo apellido)');
    }
    
    if (data.monthsDuration && data.monthsDuration < 12) {
      signals.push(`Patrón en ${data.monthsDuration} meses`);
    }
    
    return signals;
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
        for (let j = i + 2; j < Math.min(sequential.length, i + 10); j++) {
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
                    if (sequential[k] && sequential[k].rfcEmisor) {
                      cycleRFCs.push(sequential[k].rfcEmisor);
                    }
                  }
                  if (last.rfcReceptor) {
                    cycleRFCs.push(last.rfcReceptor);
                  }
                  
                  triangulations.push({
                    cycle: [...new Set(cycleRFCs)],
                    positions: sequential.slice(i, j + 1).map(c => c.position).filter(p => p !== null),
                    startDate: startDoc.fecha,
                    endDate: endDoc.fecha,
                    daysDuration: Math.round(daysDiff),
                    severity: daysDiff < 7 ? 'critical' : daysDiff < 15 ? 'high' : 'medium'
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

  // ═══════════════════════════════════════════════════════════════
  // ANÁLISIS DE VERIFICACIONES VEHICULARES
  // Detecta huecos temporales e inconsistencias de propietario
  // ═══════════════════════════════════════════════════════════════

  /**
   * Analiza todos los comprobantes de verificación del expediente
   * Detecta: huecos temporales, inconsistencias de propietario
   */
  analyzeVerifications(allDocuments, ownershipDocuments) {
    console.log('  → analyzeVerifications iniciando...');
    
    const result = {
      hasVerifications: false,
      totalVerifications: 0,
      hasGaps: false,
      hasInconsistencies: false,
      expectedOwner: null,
      verifications: [],
      gaps: [],
      inconsistencies: []
    };

    if (!allDocuments || !Array.isArray(allDocuments)) {
      return result;
    }

    try {
      // Filtrar solo verificaciones
      const verifications = allDocuments.filter(doc => 
        doc.documentType === 'verification'
      );
      
      if (verifications.length === 0) {
        console.log('  ℹ️ No hay verificaciones en el expediente');
        return result;
      }

      result.hasVerifications = true;
      result.totalVerifications = verifications.length;
      console.log(`  → ${verifications.length} verificaciones encontradas`);

      // PASO 1: Determinar quién es el propietario actual esperado
      // Revisamos facturas/refacturas/endosos para saber a nombre de quién
      // deberían estar las verificaciones
      result.expectedOwner = this.determineExpectedOwner(ownershipDocuments);
      console.log('  → Propietario esperado:', result.expectedOwner);

      // PASO 2: Ordenar verificaciones por fecha (más antigua primero)
      const sortedVerifications = this.sortVerificationsByDate(verifications);
      
      // PASO 3: Procesar cada verificación
      result.verifications = sortedVerifications.map((ver, index) => {
        // Parsear fecha de vigencia para cálculos posteriores
        const vigenciaDate = this.parseDate(ver.vigencia);
        
        // Comparar nombre en verificación vs propietario esperado
        const ownerMatches = this.compareOwnerNames(
          ver.nombrePropietario, 
          result.expectedOwner
        );
        
        return {
          position: index + 1,
          fileId: ver.fileId,
          fechaEmision: ver.fechaEmision,
          vigencia: ver.vigencia,
          vigenciaDate: vigenciaDate ? vigenciaDate.toISOString() : null,
          nombrePropietario: ver.nombrePropietario,
          resultado: ver.resultado,
          periodo: ver.periodo,
          folio: ver.folio,
          ownerMatches: ownerMatches
        };
      });

      // PASO 4: Detectar huecos temporales
      // Un hueco es cuando entre una verificación y la siguiente pasa mucho tiempo
      result.gaps = this.detectVerificationGaps(result.verifications);
      result.hasGaps = result.gaps.length > 0;

      // PASO 5: Detectar inconsistencias de propietario
      // Una inconsistencia es cuando la verificación está a nombre de otra persona
      result.inconsistencies = this.detectOwnerInconsistencies(
        result.verifications, 
        result.expectedOwner
      );
      result.hasInconsistencies = result.inconsistencies.length > 0;

      console.log('  ✓ Análisis completado:');
      console.log(`    - ${result.gaps.length} huecos temporales`);
      console.log(`    - ${result.inconsistencies.length} inconsistencias de propietario`);

    } catch (error) {
      console.error('  ❌ Error en analyzeVerifications:', error.message);
    }

    return result;
  }

  /**
   * Determina el propietario actual del vehículo según la documentación
   * Prioridad: último endoso > última refactura > factura original
   */
  determineExpectedOwner(documents) {
    if (!documents || documents.length === 0) return null;

    try {
      // Ordenar documentos por fecha (más reciente primero)
      const sorted = [...documents].sort((a, b) => {
        const dateA = this.parseDate(a.fecha);
        const dateB = this.parseDate(b.fecha);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB - dateA; // Descendente
      });

      // Buscar en orden de prioridad
      for (const doc of sorted) {
        // Prioridad 1: Si hay endoso, el endosatario es el dueño
        if (doc.documentType === 'endorsement' && doc.receptorNombre) {
          return doc.receptorNombre;
        }

        // Prioridad 2: Si hay refactura, el comprador es el dueño
        if (doc.documentType === 'reinvoice' && doc.receptorNombre) {
          return doc.receptorNombre;
        }

        // Prioridad 3: Si solo hay factura, el comprador original es el dueño
        if (doc.documentType === 'invoice' && doc.receptorNombre) {
          return doc.receptorNombre;
        }
      }

      return null;

    } catch (error) {
      console.error('Error en determineExpectedOwner:', error);
      return null;
    }
  }

  /**
   * Ordena verificaciones por fecha de emisión (más antigua primero)
   */
  sortVerificationsByDate(verifications) {
    try {
      return [...verifications].sort((a, b) => {
        const dateA = this.parseDate(a.fechaEmision || a.fecha);
        const dateB = this.parseDate(b.fechaEmision || b.fecha);
        
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        return dateA - dateB; // Ascendente
      });
    } catch (error) {
      return verifications;
    }
  }

  /**
   * Detecta huecos temporales entre verificaciones
   * Un hueco existe cuando pasa mucho tiempo entre el fin de vigencia
   * de una verificación y la emisión de la siguiente
   */
  detectVerificationGaps(verifications) {
    const gaps = [];
    
    if (verifications.length === 0) return gaps;

    try {
      // Revisar cada par de verificaciones consecutivas
      for (let i = 0; i < verifications.length - 1; i++) {
        const current = verifications[i];
        const next = verifications[i + 1];

        if (!current.vigenciaDate || !next.fechaEmision) continue;

        const vigenciaEnd = new Date(current.vigenciaDate);
        const nextEmision = this.parseDate(next.fechaEmision);

        // Calcular cuántos días pasaron entre fin de vigencia y nueva verificación
        const daysDiff = (nextEmision - vigenciaEnd) / (1000 * 60 * 60 * 24);

        // Si pasaron más de 30 días (1 mes), hay un hueco
        if (daysDiff > 30) {
          const monthsDiff = Math.round(daysDiff / 30);
          
          gaps.push({
            type: 'temporal_gap',
            fromPosition: current.position,
            toPosition: next.position,
            fromVigencia: current.vigencia,
            toEmision: next.fechaEmision,
            daysDifference: Math.round(daysDiff),
            monthsEstimate: monthsDiff,
            severity: monthsDiff >= 6 ? 'high' : monthsDiff >= 3 ? 'medium' : 'low',
            description: `Hueco de ${monthsDiff} meses entre verificaciones`
          });
        }
      }

      // Verificar si la última verificación ya expiró (hueco actual)
      const lastVerification = verifications[verifications.length - 1];
      if (lastVerification.vigenciaDate) {
        const lastVigencia = new Date(lastVerification.vigenciaDate);
        const today = new Date();
        const daysSinceExpired = (today - lastVigencia) / (1000 * 60 * 60 * 24);

        // Si la última verificación ya expiró, hay un hueco hasta hoy
        if (daysSinceExpired > 0) {
          const monthsSinceExpired = Math.round(daysSinceExpired / 30);
          
          gaps.push({
            type: 'current_expired',
            position: lastVerification.position,
            vigencia: lastVerification.vigencia,
            daysExpired: Math.round(daysSinceExpired),
            monthsExpired: monthsSinceExpired,
            severity: monthsSinceExpired >= 6 ? 'high' : monthsSinceExpired >= 3 ? 'medium' : 'low',
            description: `Última verificación vencida hace ${monthsSinceExpired} meses`
          });
        }
      }

    } catch (error) {
      console.error('Error en detectVerificationGaps:', error);
    }

    return gaps;
  }

  /**
   * Detecta inconsistencias de propietario en verificaciones
   * Una inconsistencia es cuando la verificación está a nombre de persona
   * diferente al propietario esperado del vehículo
   */
  detectOwnerInconsistencies(verifications, expectedOwner) {
    const inconsistencies = [];

    if (!expectedOwner) {
      console.warn('  ⚠ No se pudo determinar propietario esperado');
      return inconsistencies;
    }

    try {
      verifications.forEach(ver => {
        // Si falta el nombre del propietario en la verificación
        if (!ver.nombrePropietario) {
          inconsistencies.push({
            position: ver.position,
            type: 'missing_owner',
            fechaEmision: ver.fechaEmision,
            expectedOwner: expectedOwner,
            actualOwner: null,
            severity: 'medium',
            description: 'Verificación sin nombre de propietario'
          });
          return;
        }

        // Si el nombre no coincide
        if (!ver.ownerMatches) {
          const similarity = this.calculateNameSimilarity(
            ver.nombrePropietario, 
            expectedOwner
          );

          inconsistencies.push({
            position: ver.position,
            type: 'owner_mismatch',
            fechaEmision: ver.fechaEmision,
            expectedOwner: expectedOwner,
            actualOwner: ver.nombrePropietario,
            similarity: similarity,
            severity: similarity < 0.5 ? 'high' : 'medium',
            description: `Propietario no coincide (similitud: ${Math.round(similarity * 100)}%)`
          });
        }
      });

    } catch (error) {
      console.error('Error en detectOwnerInconsistencies:', error);
    }

    return inconsistencies;
  }

  /**
   * Compara dos nombres de propietarios
   * Retorna true si son suficientemente similares (80% o más)
   */
  compareOwnerNames(name1, name2) {
    if (!name1 || !name2) return false;

    try {
      // Normalizar ambos nombres (quitar acentos, espacios, mayúsculas)
      const normalized1 = this.normalizeText(name1);
      const normalized2 = this.normalizeText(name2);

      // Si son exactamente iguales después de normalizar
      if (normalized1 === normalized2) return true;

      // Si no son exactos, calcular similitud
      const similarity = this.calculateNameSimilarity(name1, name2);
      
      // Consideramos que coinciden si similitud >= 80%
      return similarity >= 0.8;

    } catch (error) {
      return false;
    }
  }

  /**
   * Calcula qué tan similares son dos nombres (0 = totalmente diferentes, 1 = idénticos)
   * Usa un algoritmo simple de palabras en común
   */
  calculateNameSimilarity(name1, name2) {
    if (!name1 || !name2) return 0;

    try {
      const norm1 = this.normalizeText(name1);
      const norm2 = this.normalizeText(name2);

      if (norm1 === norm2) return 1;

      // Separar en palabras
      const words1 = new Set(norm1.split(' ').filter(w => w.length > 0));
      const words2 = new Set(norm2.split(' ').filter(w => w.length > 0));
      
      // Contar cuántas palabras tienen en común
      let commonWords = 0;
      words1.forEach(word => {
        if (words2.has(word)) commonWords++;
      });

      // Calcular porcentaje de similitud
      const totalWords = Math.max(words1.size, words2.size);
      return totalWords > 0 ? commonWords / totalWords : 0;

    } catch (error) {
      return 0;
    }
  }
}

module.exports = SequenceAnalyzer;