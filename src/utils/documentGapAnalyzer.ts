import { 
  VehicleDocument, 
  DocumentGap, 
  DocumentType, 
  AnalysisResult, 
  TemporalIssue, 
  ValidationResult,
  MexicanState 
} from '../types/documents';
import { MEXICAN_STATES } from '../constants/documentTypes';

export class DocumentGapAnalyzer {
  
  /**
   * REGLA 1: Detección de gaps por cambio de placas
   * Si detecta placas diferentes en documentos, debe existir:
   * - Documento de baja de placas anteriores
   * - Documento de alta de placas nuevas
   * - Fechas coherentes
   * - Estado emisor debe cambiar apropiadamente
   */
  detectPlateChangeGaps(documents: VehicleDocument[]): DocumentGap[] {
    console.log('🚗 detectPlateChangeGaps: Iniciando análisis de cambios de placas');
    const gaps: DocumentGap[] = [];
    
    if (documents.length < 2) {
      console.log('ℹ️ Se necesitan al menos 2 documentos para detectar cambios de placas');
      return gaps;
    }
    
    const plateChanges = this.identifyPlateChanges(documents);
    console.log('🔄 Cambios de placas detectados:', plateChanges.length);

    for (const change of plateChanges) {
      const { from, to, changeDate, documents: relatedDocs } = change;

      // Verificar si existe baja de placas anteriores
      const bajaExists = documents.some(doc => 
        doc.type === 'baja_placas' &&
        doc.plateNumber === from.plateNumber &&
        doc.state === from.state &&
        Math.abs(doc.issueDate.getTime() - changeDate.getTime()) <= 30 * 24 * 60 * 60 * 1000 // 30 días
      );

      if (!bajaExists) {
        gaps.push({
          id: `baja_placas_${from.plateNumber}_${changeDate.getTime()}`,
          type: 'baja_placas',
          expectedDateRange: {
            from: new Date(changeDate.getTime() - 15 * 24 * 60 * 60 * 1000),
            to: new Date(changeDate.getTime() + 15 * 24 * 60 * 60 * 1000)
          },
          reason: `Cambio de placas de ${from.plateNumber} (${from.state}) a ${to.plateNumber} (${to.state}) sin baja documentada`,
          severity: 'critical',
          relatedDocuments: relatedDocs.map((doc: any) => doc.id),
          suggestedAction: `Obtener constancia de baja de placas ${from.plateNumber} en ${MEXICAN_STATES[from.state as keyof typeof MEXICAN_STATES].issuingAuthority}`,
          estimatedCost: 500,
          issuingAuthority: MEXICAN_STATES[from.state as keyof typeof MEXICAN_STATES].issuingAuthority,
          requiredDocuments: ['tarjeta_circulacion', 'tenencia', 'verificacion']
        });
      }

      // Verificar si existe alta de placas nuevas
      const altaExists = documents.some(doc => 
        doc.type === 'alta_placas' &&
        doc.plateNumber === to.plateNumber &&
        doc.state === to.state &&
        Math.abs(doc.issueDate.getTime() - changeDate.getTime()) <= 30 * 24 * 60 * 60 * 1000
      );

      if (!altaExists) {
        gaps.push({
          id: `alta_placas_${to.plateNumber}_${changeDate.getTime()}`,
          type: 'alta_placas',
          expectedDateRange: {
            from: new Date(changeDate.getTime() - 15 * 24 * 60 * 60 * 1000),
            to: new Date(changeDate.getTime() + 15 * 24 * 60 * 60 * 1000)
          },
          reason: `Cambio de placas a ${to.plateNumber} (${to.state}) sin alta documentada`,
          severity: 'high',
          relatedDocuments: relatedDocs.map((doc: any) => doc.id),
          suggestedAction: `Solicitar copia de alta de placas ${to.plateNumber} en ${MEXICAN_STATES[to.state as keyof typeof MEXICAN_STATES].issuingAuthority}`,
          estimatedCost: 300,
          issuingAuthority: MEXICAN_STATES[to.state as keyof typeof MEXICAN_STATES].issuingAuthority,
          requiredDocuments: ['factura_endosada', 'contrato_compraventa']
        });
      }
    }

    console.log('🚗 Gaps de cambio de placas detectados:', gaps.length);
    return gaps;
  }

  /**
   * REGLA 2: Detección de gaps por cambio de propietario
   * Por cada cambio de nombre detectado:
   * - Debe existir factura endosada O refactura
   * - Nueva tarjeta de circulación dentro de 15-30 días
   * - Si cambió de estado, aplicar regla de placas
   * - Contrato de compraventa debe estar presente
   */
  detectOwnershipGaps(documents: VehicleDocument[]): DocumentGap[] {
    console.log('👤 detectOwnershipGaps: Iniciando análisis de cambios de propietario');
    const gaps: DocumentGap[] = [];
    
    if (documents.length < 2) {
      console.log('ℹ️ Se necesitan al menos 2 documentos para detectar cambios de propietario');
      return gaps;
    }
    
    const ownershipChanges = this.identifyOwnershipChanges(documents);
    console.log('🔄 Cambios de propietario detectados:', ownershipChanges.length);

    for (const change of ownershipChanges) {
      const { from, to, changeDate, documents: relatedDocs } = change;

      // Verificar factura endosada o refactura
      const transferDocExists = documents.some(doc => 
        (doc.type === 'factura_endosada' || doc.type === 'refactura') &&
        doc.ownerName === to.ownerName &&
        Math.abs(doc.issueDate.getTime() - changeDate.getTime()) <= 30 * 24 * 60 * 60 * 1000
      );

      if (!transferDocExists) {
        gaps.push({
          id: `transfer_doc_${to.ownerName}_${changeDate.getTime()}`,
          type: 'factura_endosada',
          expectedDateRange: {
            from: new Date(changeDate.getTime() - 15 * 24 * 60 * 60 * 1000),
            to: new Date(changeDate.getTime() + 15 * 24 * 60 * 60 * 1000)
          },
          reason: `Cambio de propietario de "${from.ownerName}" a "${to.ownerName}" sin documento de transferencia`,
          severity: 'critical',
          relatedDocuments: relatedDocs.map((doc: any) => doc.id),
          suggestedAction: 'Obtener factura endosada o refactura que documente la transferencia',
          estimatedCost: 800,
          requiredDocuments: ['factura_origen', 'contrato_compraventa']
        });
      }

      // Verificar nueva tarjeta de circulación
      const newCirculationCard = documents.find(doc => 
        doc.type === 'tarjeta_circulacion' &&
        doc.ownerName === to.ownerName &&
        Math.abs(doc.issueDate.getTime() - changeDate.getTime()) <= 30 * 24 * 60 * 60 * 1000
      );

      if (!newCirculationCard) {
        gaps.push({
          id: `new_circulation_card_${to.ownerName}_${changeDate.getTime()}`,
          type: 'tarjeta_circulacion',
          expectedDateRange: {
            from: new Date(changeDate.getTime() - 15 * 24 * 60 * 60 * 1000),
            to: new Date(changeDate.getTime() + 15 * 24 * 60 * 60 * 1000)
          },
          reason: `Nuevo propietario "${to.ownerName}" sin tarjeta de circulación actualizada`,
          severity: 'high',
          relatedDocuments: relatedDocs.map((doc: any) => doc.id),
          suggestedAction: 'Actualizar tarjeta de circulación con datos del nuevo propietario',
          estimatedCost: 400,
          requiredDocuments: ['factura_endosada', 'alta_placas']
        });
      }

      // Verificar contrato de compraventa
      const contractExists = documents.some(doc => 
        doc.type === 'contrato_compraventa' &&
        doc.ownerName === to.ownerName &&
        Math.abs(doc.issueDate.getTime() - changeDate.getTime()) <= 30 * 24 * 60 * 60 * 1000
      );

      if (!contractExists) {
        gaps.push({
          id: `contract_${to.ownerName}_${changeDate.getTime()}`,
          type: 'contrato_compraventa',
          expectedDateRange: {
            from: new Date(changeDate.getTime() - 15 * 24 * 60 * 60 * 1000),
            to: new Date(changeDate.getTime() + 15 * 24 * 60 * 60 * 1000)
          },
          reason: `Transferencia de propiedad sin contrato de compraventa documentado`,
          severity: 'medium',
          relatedDocuments: relatedDocs.map((doc: any) => doc.id),
          suggestedAction: 'Obtener contrato de compraventa firmado por ambas partes',
          estimatedCost: 200,
          requiredDocuments: ['identificaciones', 'comprobantes_domicilio']
        });
      }
    }

    console.log('👤 Gaps de cambio de propietario detectados:', gaps.length);
    return gaps;
  }

  /**
   * REGLA 3: Detección de gaps en pagos anuales obligatorios
   * Para cada año desde la compra:
   * - Debe existir tenencia O refrendo pagado
   * - No puede haber años sin pago
   * - Excepción: estados que condonaron el impuesto
   * - Nombre en recibo debe coincidir con propietario del periodo
   */
  detectAnnualPaymentGaps(documents: VehicleDocument[]): DocumentGap[] {
    console.log('💰 detectAnnualPaymentGaps: Iniciando análisis de pagos anuales');
    const gaps: DocumentGap[] = [];
    
    if (documents.length === 0) {
      console.log('❌ No hay documentos para analizar pagos');
      return gaps;
    }
    
    // Obtener información del documento más reciente
    const latestDoc = documents.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime())[0];
    const ownerName = latestDoc.ownerName;
    const state = latestDoc.state;
    const stateConfig = MEXICAN_STATES[state];
    const startYear = latestDoc.issueDate.getFullYear();
    const currentYear = new Date().getFullYear();
    
    console.log('👤 Propietario:', ownerName);
    console.log('🏛️ Estado:', state);
    console.log('📅 Año inicio:', startYear, 'Año actual:', currentYear);
    
    if (!stateConfig.hasTenencia && !stateConfig.hasRefrendo) {
      console.log(`ℹ️ Estado ${state} no requiere pago anual`);
      return gaps;
    }
    
    const paymentType = stateConfig.hasTenencia ? 'tenencia' : 'refrendo';
    const paymentName = stateConfig.hasTenencia ? 'Tenencia' : 'Refrendo';
    
    // Analizar cada año desde el documento hasta hoy
    for (let year = startYear; year <= currentYear; year++) {
      const hasPayment = documents.some(doc => {
        return doc.type === paymentType && 
               doc.issueDate.getFullYear() === year && 
               doc.ownerName === ownerName && 
               doc.state === state;
      });
      
      if (!hasPayment) {
        console.log(`➕ Creando gap para ${paymentType} ${year}`);
        gaps.push({
          id: `${paymentType}_${year}_${ownerName}`,
          type: paymentType,
          expectedDateRange: {
            from: new Date(year, 0, 1),
            to: new Date(year, 11, 31)
          },
          reason: `Falta pago de ${paymentName} ${year} para propietario "${ownerName}" en ${state}`,
          severity: 'high',
          relatedDocuments: [],
          suggestedAction: `Pagar ${paymentName} ${year} en ${stateConfig.issuingAuthority}`,
          estimatedCost: this.estimatePaymentCost(year, state),
          issuingAuthority: stateConfig.issuingAuthority,
          requiredDocuments: ['tarjeta_circulacion', 'verificacion']
        });
      }
    }

    console.log('💰 Gaps de pago detectados:', gaps.length);
    return gaps;
  }

  /**
   * REGLA 4: Detección de gaps en verificaciones vehiculares
   * Según el estado (CDMX, EdoMex, etc):
   * - Semestral: 2 verificaciones por año
   * - Anual: 1 verificación por año
   * - Placas deben coincidir con las del periodo
   * - No gaps mayores a un periodo
   */
  detectVerificationGaps(documents: VehicleDocument[]): DocumentGap[] {
    console.log('🔍 detectVerificationGaps: Iniciando análisis de verificaciones');
    const gaps: DocumentGap[] = [];
    
    if (documents.length === 0) {
      console.log('❌ No hay documentos para analizar verificaciones');
      return gaps;
    }
    
    // Obtener información del documento más reciente
    const latestDoc = documents.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime())[0];
    const ownerName = latestDoc.ownerName;
    const state = latestDoc.state;
    const stateConfig = MEXICAN_STATES[state];
    const startYear = latestDoc.issueDate.getFullYear();
    const currentYear = new Date().getFullYear();
    const requiredVerifications = stateConfig.verificationFrequency === 'semiannual' ? 2 : 1;
    
    console.log('👤 Propietario:', ownerName);
    console.log('🏛️ Estado:', state);
    console.log('📅 Año inicio:', startYear, 'Año actual:', currentYear);
    console.log('🔍 Verificaciones requeridas por año:', requiredVerifications);
    
    // Analizar cada año desde el documento hasta hoy
    for (let year = startYear; year <= currentYear; year++) {
      const verifications = documents.filter(doc => 
        doc.type === 'verificacion' &&
        doc.issueDate.getFullYear() === year &&
        doc.ownerName === ownerName &&
        doc.state === state
      );
      
      if (verifications.length < requiredVerifications) {
        const missing = requiredVerifications - verifications.length;
        const frequency = stateConfig.verificationFrequency === 'semiannual' ? 'semestral' : 'anual';
        
        console.log(`➕ Creando gap para ${missing} verificación(es) ${year}`);
        gaps.push({
          id: `verificacion_${year}_${ownerName}_${missing}`,
          type: 'verificacion',
          expectedDateRange: {
            from: new Date(year, 0, 1),
            to: new Date(year, 11, 31)
          },
          reason: `Faltan ${missing} verificación(es) ${frequency} ${year} para propietario "${ownerName}"`,
          severity: 'medium',
          relatedDocuments: verifications.map(doc => doc.id),
          suggestedAction: `Realizar ${missing} verificación(es) vehicular(es) en ${stateConfig.issuingAuthority}`,
          estimatedCost: missing * 200,
          issuingAuthority: stateConfig.issuingAuthority,
          requiredDocuments: ['tarjeta_circulacion', 'tenencia', 'refrendo']
        });
      }
    }

    console.log('🔍 Gaps de verificación detectados:', gaps.length);
    return gaps;
  }

  /**
   * REGLA 5: Validación de cadena de propiedad completa
   * Desde factura origen hasta propietario actual:
   * - Cada transferencia debe estar documentada
   * - Secuencia: Factura origen → Endoso/Refactura → ... → Dueño actual
   * - No puede haber saltos en la cadena
   * - Fechas deben ser secuenciales
   */
  validateOwnershipChain(documents: VehicleDocument[]): ValidationResult {
    const issues: string[] = [];
    const ownershipChain: any[] = [];
    const missingTransfers: any[] = [];

    // Ordenar documentos por fecha
    const sortedDocs = documents
      .filter(doc => ['factura_origen', 'factura_endosada', 'refactura'].includes(doc.type))
      .sort((a, b) => a.issueDate.getTime() - b.issueDate.getTime());

    if (sortedDocs.length === 0) {
      issues.push('No se encontraron documentos de propiedad');
      return { isValid: false, issues, ownershipChain, missingTransfers };
    }

    // Verificar factura origen
    const facturaOrigen = sortedDocs.find(doc => doc.type === 'factura_origen');
    if (!facturaOrigen) {
      issues.push('Falta factura de origen del vehículo');
    } else {
      ownershipChain.push({
        from: 'Concesionario',
        to: facturaOrigen.ownerName,
        transferDate: facturaOrigen.issueDate,
        documentId: facturaOrigen.id
      });
    }

    // Verificar transferencias secuenciales
    let currentOwner = facturaOrigen?.ownerName;
    for (let i = 1; i < sortedDocs.length; i++) {
      const doc = sortedDocs[i];
      const prevDoc = sortedDocs[i - 1];

      if (doc.ownerName !== currentOwner) {
        // Hay un cambio de propietario
        ownershipChain.push({
          from: currentOwner,
          to: doc.ownerName,
          transferDate: doc.issueDate,
          documentId: doc.id
        });

        // Verificar que la fecha sea posterior a la anterior
        if (doc.issueDate <= prevDoc.issueDate) {
          issues.push(`Fecha de transferencia inválida: ${doc.issueDate.toISOString()} debe ser posterior a ${prevDoc.issueDate.toISOString()}`);
        }

        currentOwner = doc.ownerName;
      }
    }

    // Verificar que no haya saltos en la cadena
    const uniqueOwners = Array.from(new Set(sortedDocs.map(doc => doc.ownerName)));
    if (uniqueOwners.length > 1) {
      for (let i = 1; i < uniqueOwners.length; i++) {
        const prevOwner = uniqueOwners[i - 1];
        const currentOwner = uniqueOwners[i];
        
        const hasTransfer = ownershipChain.some(transfer => 
          transfer.from === prevOwner && transfer.to === currentOwner
        );

        if (!hasTransfer) {
          missingTransfers.push({
            from: prevOwner,
            to: currentOwner,
            expectedDate: new Date(),
            reason: 'Transferencia no documentada en la cadena de propiedad'
          });
          issues.push(`Falta documentación de transferencia de ${prevOwner} a ${currentOwner}`);
        }
      }
    }

    return {
      isValid: issues.length === 0 && missingTransfers.length === 0,
      issues,
      ownershipChain,
      missingTransfers
    };
  }


  /**
   * REGLA 6: Verificación de consistencia temporal
   * Verificar que:
   * - No hay documentos con fechas imposibles
   * - Documentos del mismo period tienen mismo propietario
   * - Multas corresponden al propietario del momento
   * - Tarjeta de circulación vigente durante todo el periodo
   */
  checkTemporalConsistency(documents: VehicleDocument[]): TemporalIssue[] {
    const issues: TemporalIssue[] = [];

    // Verificar fechas imposibles
    const now = new Date();
    const minDate = new Date(1900, 0, 1);
    
    for (const doc of documents) {
      if (doc.issueDate < minDate || doc.issueDate > now) {
        issues.push({
          id: `impossible_date_${doc.id}`,
          type: 'impossible_date',
          description: `Documento ${doc.type} tiene fecha imposible: ${doc.issueDate.toISOString()}`,
          affectedDocuments: [doc.id],
          severity: 'high',
          suggestedFix: 'Verificar fecha de emisión del documento'
        });
      }
    }

    // Verificar consistencia de propietarios por periodo
    const ownerConsistency = this.checkOwnerConsistency(documents);
    issues.push(...ownerConsistency);

    // Verificar tarjeta de circulación vigente
    const circulationIssues = this.checkCirculationCardValidity(documents);
    issues.push(...circulationIssues);

    return issues;
  }

  /**
   * Análisis completo de completitud de documentos
   */
  analyzeDocumentCompleteness(documents: VehicleDocument[]): AnalysisResult {
    console.log('🔍 DocumentGapAnalyzer: Iniciando análisis COMPLETO con', documents.length, 'documentos');
    console.log('📄 Documentos recibidos:', documents.map(d => ({ type: d.type, date: d.issueDate, owner: d.ownerName })));
    
    // Aplicar todas las reglas (ahora arregladas para no fallar)
    const plateGaps = this.detectPlateChangeGaps(documents);
    console.log('🚗 Plate gaps detectados:', plateGaps.length);
    
    const ownershipGaps = this.detectOwnershipGaps(documents);
    console.log('👤 Ownership gaps detectados:', ownershipGaps.length);
    
    const paymentGaps = this.detectAnnualPaymentGaps(documents);
    console.log('💰 Payment gaps detectados:', paymentGaps.length);
    
    const verificationGaps = this.detectVerificationGaps(documents);
    console.log('🔍 Verification gaps detectados:', verificationGaps.length);
    
    const temporalIssues = this.checkTemporalConsistency(documents);
    const ownershipValidation = this.validateOwnershipChain(documents);

    // Combinar todos los gaps
    const allGaps = [...plateGaps, ...ownershipGaps, ...paymentGaps, ...verificationGaps];
    console.log('📊 Total gaps detectados:', allGaps.length);
    console.log('📋 Lista de gaps:', allGaps.map(gap => ({ type: gap.type, reason: gap.reason, severity: gap.severity })));

    // Calcular score de completitud
    const totalExpected = this.calculateExpectedDocuments(documents);
    const presentDocuments = documents.length;
    const completenessPercentage = totalExpected > 0 ? (presentDocuments / totalExpected) * 100 : 0;
    
    // Calcular score (0-100)
    let score = 100;
    score -= plateGaps.filter(gap => gap.severity === 'critical').length * 20;
    score -= plateGaps.filter(gap => gap.severity === 'high').length * 15;
    score -= ownershipGaps.filter(gap => gap.severity === 'critical').length * 25;
    score -= ownershipGaps.filter(gap => gap.severity === 'high').length * 20;
    score -= paymentGaps.filter(gap => gap.severity === 'high').length * 10;
    score -= verificationGaps.filter(gap => gap.severity === 'medium').length * 5;
    score -= temporalIssues.filter(issue => issue.severity === 'critical').length * 15;
    
    score = Math.max(0, Math.min(100, score));

    // Determinar nivel de riesgo
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (score < 30) riskLevel = 'critical';
    else if (score < 50) riskLevel = 'high';
    else if (score < 70) riskLevel = 'medium';

    // Generar recomendaciones
    const recommendations = this.generateRecommendations(allGaps, temporalIssues, ownershipValidation);

    // Agrupar gaps por severidad
    const priorityActions = {
      critical: allGaps.filter(gap => gap.severity === 'critical'),
      high: allGaps.filter(gap => gap.severity === 'high'),
      medium: allGaps.filter(gap => gap.severity === 'medium'),
      low: allGaps.filter(gap => gap.severity === 'low')
    };

    // Calcular desglose por categoría
    const categoryBreakdown = this.calculateCategoryBreakdown(documents, allGaps);

    return {
      score,
      gaps: allGaps,
      completenessPercentage,
      criticalIssues: allGaps.filter(gap => gap.severity === 'critical').map(gap => gap.reason),
      recommendations,
      riskLevel,
      temporalIssues,
      ownershipValidation,
      categoryBreakdown: this.calculateCategoryBreakdown(documents, allGaps),
      priorityActions
    };
  }

  // Métodos auxiliares privados
  
  private generateBasicRecommendations(gaps: DocumentGap[]): string[] {
    const recommendations: string[] = [];
    
    if (gaps.length === 0) {
      recommendations.push('✅ Expediente completo - no se detectaron huecos documentales');
      return recommendations;
    }
    
    const paymentGaps = gaps.filter(gap => gap.type === 'tenencia' || gap.type === 'refrendo');
    const verificationGaps = gaps.filter(gap => gap.type === 'verificacion');
    
    if (paymentGaps.length > 0) {
      recommendations.push(`💰 Pagar ${paymentGaps.length} documento(s) de pago anual pendiente(s)`);
    }
    
    if (verificationGaps.length > 0) {
      recommendations.push(`🔍 Realizar ${verificationGaps.length} verificación(es) vehicular(es) pendiente(s)`);
    }
    
    recommendations.push('📋 Revisar la pestaña "Lista" para ver todos los documentos faltantes');
    recommendations.push('📅 Consultar la línea del tiempo para entender las fechas requeridas');
    
    return recommendations;
  }

  private identifyPlateChanges(documents: VehicleDocument[]): any[] {
    const changes: any[] = [];
    const circulationCards = documents
      .filter(doc => doc.type === 'tarjeta_circulacion' && doc.plateNumber)
      .sort((a, b) => a.issueDate.getTime() - b.issueDate.getTime());

    for (let i = 1; i < circulationCards.length; i++) {
      const prev = circulationCards[i - 1];
      const curr = circulationCards[i];

      if (prev.plateNumber !== curr.plateNumber || prev.state !== curr.state) {
        changes.push({
          from: { plateNumber: prev.plateNumber, state: prev.state },
          to: { plateNumber: curr.plateNumber, state: curr.state },
          changeDate: curr.issueDate,
          documents: [prev, curr]
        });
      }
    }

    return changes;
  }

  private identifyOwnershipChanges(documents: VehicleDocument[]): any[] {
    const changes: any[] = [];
    const allDocs = documents
      .filter(doc => doc.ownerName)
      .sort((a, b) => a.issueDate.getTime() - b.issueDate.getTime());

    for (let i = 1; i < allDocs.length; i++) {
      const prev = allDocs[i - 1];
      const curr = allDocs[i];

      if (prev.ownerName !== curr.ownerName) {
        changes.push({
          from: { ownerName: prev.ownerName },
          to: { ownerName: curr.ownerName },
          changeDate: curr.issueDate,
          documents: [prev, curr]
        });
      }
    }

    return changes;
  }

  private getPaymentYears(documents: VehicleDocument[]): number[] {
    const years = new Set<number>();
    
    if (documents.length === 0) {
      // Si no hay documentos, analizar últimos 5 años
      const currentYear = new Date().getFullYear();
      for (let year = currentYear - 4; year <= currentYear; year++) {
        years.add(year);
      }
    } else {
      // Analizar desde el documento más antiguo hasta el año actual
      const startYear = Math.min(...documents.map(doc => doc.issueDate.getFullYear()));
      const currentYear = new Date().getFullYear();
      
      // Asegurar que analizamos al menos 3 años hacia atrás y 2 hacia adelante
      const minYear = Math.min(startYear, currentYear - 2);
      const maxYear = Math.max(currentYear, startYear + 2);
      
      for (let year = minYear; year <= maxYear; year++) {
        years.add(year);
      }
    }

    return Array.from(years).sort((a, b) => a - b);
  }

  private getVerificationYears(documents: VehicleDocument[]): number[] {
    return this.getPaymentYears(documents);
  }

  private getOwnerForYear(documents: VehicleDocument[], year: number): { ownerName: string; state: MexicanState; plateNumber?: string } | null {
    if (documents.length === 0) return null;
    
    // Estrategia mejorada: usar el propietario del documento más reciente disponible
    // Si hay documentos del año específico, usarlos; si no, usar el más reciente disponible
    const yearDocs = documents.filter(doc => doc.issueDate.getFullYear() === year);
    
    let targetDoc: VehicleDocument;
    
    if (yearDocs.length > 0) {
      // Usar el documento más reciente del año específico
      targetDoc = yearDocs.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime())[0];
    } else {
      // Usar el documento más reciente disponible (para años sin documentos)
      targetDoc = documents.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime())[0];
    }
    
    return {
      ownerName: targetDoc.ownerName,
      state: targetDoc.state,
      plateNumber: targetDoc.plateNumber
    };
  }

  private estimatePaymentCost(year: number, state: MexicanState): number {
    // Estimación básica de costos por año y estado
    const baseCost = 1000;
    const yearMultiplier = Math.max(1, (new Date().getFullYear() - year) * 0.1);
    return Math.round(baseCost * yearMultiplier);
  }

  private checkOwnerConsistency(documents: VehicleDocument[]): TemporalIssue[] {
    const issues: TemporalIssue[] = [];
    const ownerByPeriod = new Map<string, string>();

    for (const doc of documents) {
      const period = `${doc.issueDate.getFullYear()}-${doc.issueDate.getMonth()}`;
      const existingOwner = ownerByPeriod.get(period);
      
      if (existingOwner && existingOwner !== doc.ownerName) {
        issues.push({
          id: `owner_mismatch_${period}`,
          type: 'owner_mismatch',
          description: `Inconsistencia de propietario en ${period}: ${existingOwner} vs ${doc.ownerName}`,
          affectedDocuments: documents
            .filter(d => `${d.issueDate.getFullYear()}-${d.issueDate.getMonth()}` === period)
            .map(d => d.id),
          severity: 'medium',
          suggestedFix: 'Verificar propietario correcto para el periodo'
        });
      } else {
        ownerByPeriod.set(period, doc.ownerName);
      }
    }

    return issues;
  }

  private checkCirculationCardValidity(documents: VehicleDocument[]): TemporalIssue[] {
    const issues: TemporalIssue[] = [];
    const circulationCards = documents
      .filter(doc => doc.type === 'tarjeta_circulacion')
      .sort((a, b) => a.issueDate.getTime() - b.issueDate.getTime());

    for (let i = 1; i < circulationCards.length; i++) {
      const prev = circulationCards[i - 1];
      const curr = circulationCards[i];
      
      const gapDays = (curr.issueDate.getTime() - prev.issueDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (gapDays > 30) {
        issues.push({
          id: `circulation_gap_${prev.id}_${curr.id}`,
          type: 'impossible_date',
          description: `Gap de ${Math.round(gapDays)} días entre tarjetas de circulación`,
          affectedDocuments: [prev.id, curr.id],
          severity: 'medium',
          suggestedFix: 'Verificar si falta documentación intermedia'
        });
      }
    }

    return issues;
  }

  private calculateExpectedDocuments(documents: VehicleDocument[]): number {
    // Cálculo básico de documentos esperados
    const years = this.getPaymentYears(documents);
    let expected = 1; // Factura origen

    // Agregar documentos por año
    years.forEach(year => {
      expected += 1; // Tenencia o refrendo
      expected += 1; // Verificación
    });

    // Agregar documentos de transferencia
    const ownershipChanges = this.identifyOwnershipChanges(documents);
    expected += ownershipChanges.length * 2; // Endoso + nueva tarjeta

    return expected;
  }

  private generateRecommendations(gaps: DocumentGap[], temporalIssues: TemporalIssue[], ownershipValidation: ValidationResult): string[] {
    const recommendations: string[] = [];

    if (gaps.filter(gap => gap.severity === 'critical').length > 0) {
      recommendations.push('1. URGENTE: Resolver gaps críticos de documentación');
    }

    if (ownershipValidation.missingTransfers.length > 0) {
      recommendations.push('2. Completar cadena de propiedad faltante');
    }

    if (gaps.filter(gap => gap.type === 'tenencia' || gap.type === 'refrendo').length > 0) {
      recommendations.push('3. Regularizar pagos anuales pendientes');
    }

    if (gaps.filter(gap => gap.type === 'verificacion').length > 0) {
      recommendations.push('4. Realizar verificaciones vehiculares faltantes');
    }

    if (temporalIssues.length > 0) {
      recommendations.push('5. Corregir inconsistencias temporales');
    }

    return recommendations;
  }

  private calculateCategoryBreakdown(documents: VehicleDocument[], gaps: DocumentGap[]): any {
    const ownership = {
      present: documents.filter(doc => ['factura_origen', 'factura_endosada', 'refactura'].includes(doc.type)).length,
      expected: 1 + gaps.filter(gap => ['factura_endosada', 'refactura'].includes(gap.type)).length,
      percentage: 0
    };

    const fiscal = {
      present: documents.filter(doc => ['tenencia', 'refrendo'].includes(doc.type)).length,
      expected: documents.filter(doc => ['tenencia', 'refrendo'].includes(doc.type)).length + gaps.filter(gap => ['tenencia', 'refrendo'].includes(gap.type)).length,
      percentage: 0
    };

    const registration = {
      present: documents.filter(doc => ['alta_placas', 'baja_placas', 'tarjeta_circulacion'].includes(doc.type)).length,
      expected: documents.filter(doc => ['alta_placas', 'baja_placas', 'tarjeta_circulacion'].includes(doc.type)).length + gaps.filter(gap => ['alta_placas', 'baja_placas', 'tarjeta_circulacion'].includes(gap.type)).length,
      percentage: 0
    };

    const verification = {
      present: documents.filter(doc => doc.type === 'verificacion').length,
      expected: documents.filter(doc => doc.type === 'verificacion').length + gaps.filter(gap => gap.type === 'verificacion').length,
      percentage: 0
    };

    // Calcular porcentajes
    ownership.percentage = ownership.expected > 0 ? (ownership.present / ownership.expected) * 100 : 100;
    fiscal.percentage = fiscal.expected > 0 ? (fiscal.present / fiscal.expected) * 100 : 100;
    registration.percentage = registration.expected > 0 ? (registration.present / registration.expected) * 100 : 100;
    verification.percentage = verification.expected > 0 ? (verification.present / verification.expected) * 100 : 100;

    return { ownership, fiscal, registration, verification };
  }
}

export const documentGapAnalyzer = new DocumentGapAnalyzer();
export default documentGapAnalyzer;
