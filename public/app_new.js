// ============================================================================
// ANALIZADOR DE SECUENCIA DE PROPIEDAD VEHICULAR - FRONTEND
// ============================================================================

// Detectar entorno y configurar URL de API
// En producción usa rutas relativas, en desarrollo local usa localhost:3001
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : window.location.origin;
const API_URL = `${API_BASE_URL}/api`;

// Variable global para guardar el expediente cargado
let currentExpediente = null;

// ============================================================================
// FUNCIONES DE UTILIDAD
// ============================================================================

/**
 * Formatea un monto monetario correctamente
 * Maneja strings con comas como separador de miles
 * @param {string|number} amount - Monto a formatear
 * @returns {string} Monto formateado
 */
function formatCurrency(amount) {
    if (!amount) return '0.00';
    
    // Si es string, remover comas y espacios
    let numValue;
    if (typeof amount === 'string') {
        // Remover comas y espacios, luego convertir a número
        const cleaned = amount.replace(/,/g, '').replace(/\s/g, '').trim();
        numValue = parseFloat(cleaned);
    } else {
        numValue = parseFloat(amount);
    }
    
    // Validar que sea un número válido
    if (isNaN(numValue)) {
        return amount.toString(); // Retornar original si no es número válido
    }
    
    // Formatear con separadores de miles y 2 decimales
    return numValue.toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// ============================================================================
// MANEJO DE FORMULARIOS Y EVENTOS
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Formulario de autenticación
    document.getElementById('authForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await authenticateUser();
    });

    // Formulario de búsqueda
    document.getElementById('fetchForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await fetchExpediente();
    });

    // Botón de análisis
    document.getElementById('analyzeBtn').addEventListener('click', async () => {
        await analyzeSequence();
    });

    // Botón de limpiar token
    document.getElementById('clearTokenBtn').addEventListener('click', async () => {
        await clearToken();
    });
});

// ============================================================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================================================

async function authenticateUser() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showError('Por favor completa todos los campos');
        return;
    }

    showLoading('Autenticando...');
    hideError();

    try {
        const response = await fetch(`${API_URL}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Token generado exitosamente');
            displayTokenStatus(data.tokenInfo);
            showSearchSection();
        } else {
            showError(data.message || 'Error en la autenticación');
        }
    } catch (error) {
        showError('Error de conexión: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function clearToken() {
    showLoading('Limpiando token...');
    
    try {
        const response = await fetch(`${API_URL}/clear-token`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Token limpiado exitosamente');
            hideTokenStatus();
            hideSearchSection();
            hideAnalysisSection();
            hideExtractedData();
            hideAnalysisResults();
        } else {
            showError(data.message || 'Error al limpiar token');
        }
    } catch (error) {
        showError('Error de conexión: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ============================================================================
// FUNCIONES DE BÚSQUEDA
// ============================================================================

async function fetchExpediente() {
    const urlInput = document.getElementById('url_input').value.trim();

    if (!urlInput) {
        showError('Por favor ingresa una URL de Nexcar o Vehicle ID');
        return;
    }

    showLoading('Extrayendo Vehicle ID y consultando expediente...');
    hideError();
    document.getElementById('extractedData').style.display = 'none';
    document.getElementById('analysisResults').style.display = 'none';
    document.getElementById('analysis').style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/fetch-expediente`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url_or_id: urlInput })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Expediente obtenido exitosamente');
            
            // ⚠️ CRÍTICO: Guardar el expediente completo en variable global
            // Necesitamos construir el objeto expedienteData con la estructura que espera el backend
            if (data.raw_expediente) {
                currentExpediente = data.raw_expediente;
                console.log('✓ Expediente guardado en currentExpediente');
                console.log('✓ Tipo:', typeof currentExpediente);
                console.log('✓ Tiene files:', currentExpediente.files ? 'Sí' : 'No');
                if (currentExpediente.files) {
                    console.log('✓ Total files:', currentExpediente.files.length);
                }
            } else {
                console.warn('⚠ No se recibió raw_expediente, intentando construir desde data');
                // Construir expediente desde la respuesta
                if (data.data && data.data.vehicle_id) {
                    currentExpediente = {
                        active_vehicle: data.data.active_vehicle || true,
                        created_at: data.data.created_at || new Date().toISOString(),
                        files: [
                            ...(data.data.invoices || []),
                            ...(data.data.reinvoices || []),
                            ...(data.data.other_documents || [])
                        ]
                    };
                    console.log('✓ Expediente construido desde data');
                }
            }
            
            if (data.searchType === 'expediente_completo') {
                displayExpedienteCompleto(data);
            } else if (data.searchType === 'documento_especifico') {
                displayDocumentoEspecifico(data);
            }
            
            showAnalysisSection();
            
            // Ejecutar análisis automáticamente
            console.log('→ Ejecutando análisis automático...');
            setTimeout(() => {
                analyzeSequence();
            }, 500);
        } else {
            showError(data.message || 'Error al obtener el expediente');
        }
    } catch (error) {
        showError('Error de conexión: ' + error.message);
    } finally {
        hideLoading();
    }
}

// ============================================================================
// FUNCIONES DE ANÁLISIS
// ============================================================================

async function analyzeSequence() {
    console.log('═══════════════════════════════════════');
    console.log('analyzeSequence INICIANDO');
    console.log('═══════════════════════════════════════');

    try {
        // Validar que tengamos expediente cargado
        if (!currentExpediente) {
            console.error('❌ ERROR: currentExpediente es null');
            showError('Error: Primero debes cargar un expediente');
            return;
        }
        console.log('✓ currentExpediente existe');
        console.log('✓ Tipo:', typeof currentExpediente);
        console.log('✓ Tiene files:', currentExpediente.files ? 'Sí' : 'No');

        if (currentExpediente.files) {
            console.log('✓ Total files:', currentExpediente.files.length);
        }

        // Mostrar loading
        showLoading('Analizando secuencia de propiedad...');
        hideError();
        
        // Asegurar que el contenedor de resultados esté preparado (oculto mientras carga)
        const resultsDiv = document.getElementById('analysisResults');
        if (resultsDiv) {
            resultsDiv.style.display = 'none';
        }

        console.log('→ Enviando petición a /api/analyze-sequence...');
        const requestBody = {
            expedienteData: currentExpediente
        };
        console.log('→ Body que se enviará:', JSON.stringify(requestBody, null, 2));

        // Enviar petición
        const response = await fetch(`${API_URL}/analyze-sequence`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('✓ Respuesta recibida');
        console.log('✓ Status:', response.status);
        console.log('✓ Status Text:', response.statusText);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Error del servidor:', errorData);
            throw new Error(errorData.error || `Error ${response.status}`);
        }

        const analysis = await response.json();
        console.log('✓ Análisis recibido:', analysis);
        
        // ===== DEBUG: Verificar estructura de respuesta =====
        console.log('🔍 ESTRUCTURA DE RESPUESTA:', {
            hasSequenceAnalysis: analysis.sequenceAnalysis !== undefined,
            hasIsComplete: analysis.isComplete !== undefined,
            keys: Object.keys(analysis),
            sequenceAnalysisKeys: analysis.sequenceAnalysis ? Object.keys(analysis.sequenceAnalysis) : null
        });
        // ===== FIN DEBUG =====

        showSuccess('Análisis completado exitosamente');
        displayAnalysisResults(analysis);

        console.log('═══════════════════════════════════════');
        console.log('analyzeSequence COMPLETADO');
        console.log('═══════════════════════════════════════');
    } catch (error) {
        console.error('═══════════════════════════════════════');
        console.error('❌ ERROR en analyzeSequence');
        console.error('═══════════════════════════════════════');
        console.error('Error:', error);
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);

        showError('Error de conexión: ' + error.message);

        const resultsDiv = document.getElementById('analysisResults');
        if (resultsDiv) {
            resultsDiv.innerHTML = `
                <div class="error-message">
                    <h3>❌ Error al analizar</h3>
                    <p>${error.message}</p>
                    <p style="font-size: 12px; color: #666;">
                        Revisa la consola del navegador para más detalles
                    </p>
                </div>
            `;
            resultsDiv.style.display = 'block';
        }
    } finally {
        hideLoading();
    }
}

// ============================================================================
// FUNCIONES DE VISUALIZACIÓN DE DATOS
// ============================================================================

function displayExpedienteCompleto(data) {
    const container = document.getElementById('extractedData');
    
    let html = `
        <div style="padding: 20px; background: #f8f9fa; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0; color: #2c3e50;">✅ Expediente Cargado</h3>
            <p style="margin: 5px 0; color: #666;">
                <strong>Total de archivos:</strong> ${data.data.total_files || 0}
            </p>
            <p style="margin: 5px 0; color: #666;">
                <strong>VIN:</strong> ${data.data.vin || 'No disponible'}
            </p>
            <p style="margin: 10px 0 0 0; font-size: 14px; color: #28a745;">
                🔄 Analizando secuencia automáticamente...
            </p>
        </div>
    `;
    
    container.innerHTML = html;
    document.getElementById('extractedData').style.display = 'block';
}

// MOSTRAR DOCUMENTO ESPECÍFICO
function displayDocumentoEspecifico(data) {
    const container = document.getElementById('extractedData');
    
    let html = `
        <h2>🎯 Documento Específico</h2>
        
        <div style="margin: 0 32px 24px 32px;">
            <span class="document-type-badge" style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 8px 16px; font-size: 12px;">
                Búsqueda: Documento específico
            </span>
        </div>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>Vehicle ID</h3>
                <p style="font-size: 14px; word-break: break-all;">${data.data.vehicle_id}</p>
            </div>
            <div class="info-card">
                <h3>VIN</h3>
                <p>${data.data.vin}</p>
            </div>
            <div class="info-card">
                <h3>File ID</h3>
                <code>${data.data.file_id}</code>
            </div>
            <div class="info-card">
                <h3>Tipo</h3>
                <p>${data.data.document_type}</p>
            </div>
            <div class="info-card">
                <h3>Fecha de Creación</h3>
                <p>${new Date(data.data.created_at).toLocaleString('es-MX')}</p>
            </div>
        </div>
        
        <div class="document-url">
            <strong>🔗 URL del Documento:</strong><br>
            <a href="${data.data.url}" target="_blank">${data.data.url}</a>
        </div>
    `;

    if (data.data.ocr && typeof data.data.ocr === 'object') {
        html += `
            <div class="document-section">
                <h3>📄 Datos Extraídos (OCR)</h3>
                <div class="document-preview">
                    ${Object.keys(data.data.ocr).map(key => `
                        <p><strong>${key}:</strong> ${data.data.ocr[key] || 'N/A'}</p>
                    `).join('')}
                </div>
            </div>
        `;
    } else {
        html += '<p class="no-data">Sin datos OCR disponibles</p>';
    }

    html += `
        <details class="json-details" open>
            <summary>📦 JSON Completo del Documento</summary>
            <pre>${JSON.stringify(data.raw_document, null, 2)}</pre>
        </details>
    `;

    container.innerHTML = html;
    document.getElementById('extractedData').style.display = 'block';
}

function hideExtractedData() {
    document.getElementById('extractedData').style.display = 'none';
}

// MOSTRAR RESULTADOS DEL ANÁLISIS
function displayAnalysisResults(data) {
    console.log('📊 Datos recibidos del análisis:', data);
    
    const container = document.getElementById('analysisResults');
    container.innerHTML = '';
    container.style.display = 'block';
    
    // ===== ARREGLO CRÍTICO: Validación defensiva =====
    
    // Verificar si tenemos la estructura nueva o antigua
    const hasNewStructure = data.sequenceAnalysis !== undefined;
    const hasOldStructure = data.isComplete !== undefined;
    
    // Normalizar datos para compatibilidad
    const sequenceAnalysis = hasNewStructure 
        ? data.sequenceAnalysis 
        : {
            isComplete: data.isComplete || false,
            hasGaps: data.hasGaps || false,
            hasRetornos: data.hasRetornos || false,
            totalGaps: data.totalGaps || 0,
            totalRetornos: data.totalRetornos || 0,
            gaps: data.gaps || [],
            retornos: data.retornos || []
        };
    
    const ownershipChain = data.ownershipChain || [];
    const originDocument = data.originDocument || null;
    
    console.log('✅ Estructura normalizada:', { 
        hasNewStructure, 
        hasOldStructure, 
        sequenceAnalysis 
    });
    
    const statusClass = sequenceAnalysis.isComplete ? 'success' : 'warning';
    const statusIcon = sequenceAnalysis.isComplete ? '✓' : '⚠';
    const statusText = sequenceAnalysis.isComplete ? 'Secuencia Completa' : 'Huecos Detectados';
    
    let html = `
        <h2>🔍 Análisis de Secuencia de Propiedad</h2>
        <span class="status-badge ${statusClass}">
            <span>${statusIcon}</span>
            <span>${statusText}</span>
        </span>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>VIN</h3>
                <p style="font-size: 16px; word-break: break-all;">${data.vin || 'N/A'}</p>
            </div>
            <div class="info-card">
                <h3>Facturas</h3>
                <p>${data.totalInvoices || 0}</p>
            </div>
            <div class="info-card">
                <h3>Refacturas</h3>
                <p>${data.totalReinvoices || 0}</p>
            </div>
            <div class="info-card">
                <h3>Endosos</h3>
                <p>${data.totalEndorsements || 0}</p>
            </div>
            <div class="info-card">
                <h3>Total Docs</h3>
                <p>${data.totalDocuments || 0}</p>
            </div>
            <div class="info-card">
                <h3>Huecos</h3>
                <p style="color: ${sequenceAnalysis.totalGaps > 0 ? '#f59e0b' : '#10b981'}">${sequenceAnalysis.totalGaps}</p>
            </div>
            <div class="info-card">
                <h3>Retornos</h3>
                <p style="color: #3b82f6">${sequenceAnalysis.totalRetornos || 0}</p>
            </div>
            ${data.totalTarjetasCirculacion ? `
            <div class="info-card">
                <h3>Tarjetas de Circulación</h3>
                <p>${data.totalTarjetasCirculacion}</p>
            </div>
            ` : ''}
        </div>
    `;
    
    // Documento de origen
    if (originDocument) {
        const docTypeIcon = originDocument.documentType === 'invoice' ? '📄' : 
                           originDocument.documentType === 'reinvoice' ? '🔄' : '📋';
        const docTypeName = originDocument.documentType === 'invoice' ? 'Factura' : 
                           originDocument.documentType === 'reinvoice' ? 'Refactura' : 'Endoso';
        
        html += `
            <div class="vehicle-info">
                <h3>🚗 Documento de Origen (Vehículo Nuevo)</h3>
                <p><strong>Tipo:</strong> ${docTypeIcon} ${docTypeName}</p>
                ${originDocument.fecha ? `<p><strong>Fecha:</strong> ${originDocument.fecha}</p>` : ''}
                <p><strong>Emisor:</strong> ${originDocument.nombreEmisor || 'N/A'} 
                   <span style="color: #895ddc; font-family: monospace; font-weight: 600;">(${originDocument.rfcEmisor || 'N/A'})</span>
                </p>
                <p><strong>Receptor:</strong> ${originDocument.nombreReceptor || 'N/A'} 
                   <span style="color: #895ddc; font-family: monospace; font-weight: 600;">(${originDocument.rfcReceptor || 'N/A'})</span>
                </p>
            </div>
        `;
    }
    
    // Retornos - Estilo timeline
    if (sequenceAnalysis.hasRetornos) {
        html += '<div class="timeline-section"><h3>🔄 Retornos Válidos Detectados</h3><div class="timeline-container">';
        
        sequenceAnalysis.retornos.forEach((retorno, index) => {
            html += `
                <div class="timeline-card fiscal retorno">
                    <div class="card-header">
                        <span class="card-icon">🔄</span>
                        <span class="card-type">Retorno</span>
                        <span class="card-date">${retorno.fecha ? formatDateShort(retorno.fecha) : 'N/A'}</span>
                    </div>
                    <div class="card-body-mini">
                        <div class="transfer-mini">
                            <span class="name-mini">${retorno.previousOwner || 'N/A'}</span>
                            <span class="arrow-mini">→</span>
                            <span class="name-mini">${retorno.returnedToName || 'N/A'}</span>
                        </div>
                        <div class="details-mini">
                            <span>${retorno.previousRFC || 'N/A'}</span>
                            <span>→</span>
                            <span>${retorno.returnedTo || 'N/A'}</span>
                        </div>
                        <div class="card-alert" style="color: #3b82f6;">${retorno.description || ''}</div>
                    </div>
                    <div class="card-badge" style="background: #dbeafe; color: #1e40af;">${retorno.position || 'N/A'}</div>
                </div>
            `;
            
            if (index < sequenceAnalysis.retornos.length - 1) {
                html += '<div class="timeline-connector"></div>';
            }
        });
        
        html += '</div></div>';
    }
    
    // Huecos - Estilo timeline
    if (sequenceAnalysis.hasGaps) {
        html += '<div class="timeline-section"><h3>⚠️ Análisis de Huecos en la Secuencia</h3><div class="timeline-container">';
        
        sequenceAnalysis.gaps.forEach((gap, index) => {
            if (gap.type === 'orphan_documents') {
                gap.orphanDocuments.forEach((orphan, orphanIndex) => {
                    const icon = orphan.type === 'invoice' ? '📄' : orphan.type === 'reinvoice' ? '🔄' : '📋';
                    const typeName = orphan.type === 'invoice' ? 'Factura' : orphan.type === 'reinvoice' ? 'Refactura' : 'Endoso';
                    
                    html += `
                        <div class="timeline-card fiscal ruptura">
                            <div class="card-header">
                                <span class="card-icon">${icon}</span>
                                <span class="card-type">${typeName} Sin Conexión</span>
                                <span class="card-date">${orphan.fecha ? formatDateShort(orphan.fecha) : 'N/A'}</span>
                            </div>
                            <div class="card-body-mini">
                                <div class="transfer-mini">
                                    <span class="name-mini">${orphan.nombreEmisor || 'N/A'}</span>
                                    <span class="arrow-mini">→</span>
                                    <span class="name-mini">${orphan.nombreReceptor || 'N/A'}</span>
                                </div>
                                <div class="details-mini">
                                    <span>${orphan.rfcEmisor || 'N/A'}</span>
                                    <span>→</span>
                                    <span>${orphan.rfcReceptor || 'N/A'}</span>
                                </div>
                                <div class="card-alert">⚠️ ${gap.description || 'Documento sin conexión con la secuencia principal'}</div>
                            </div>
                            <div class="card-badge ruptura">${gap.gapPosition || 'Ruptura'}</div>
                        </div>
                    `;
                    
                    if (orphanIndex < gap.orphanDocuments.length - 1 || index < sequenceAnalysis.gaps.length - 1) {
                        html += '<div class="timeline-connector"></div>';
                    }
                });
            } else {
                html += `
                    <div class="timeline-card fiscal ruptura">
                        <div class="card-header">
                            <span class="card-icon">⚠️</span>
                            <span class="card-type">Hueco Detectado</span>
                            <span class="card-date">N/A</span>
                        </div>
                        <div class="card-body-mini">
                            <div class="transfer-mini">
                                <span class="name-mini">${gap.expectedEmisor || 'N/A'}</span>
                                <span class="arrow-mini">→</span>
                                <span class="name-mini">${gap.foundEmisor || 'N/A'}</span>
                            </div>
                            <div class="card-alert">${gap.description || 'Falta un documento que conecte estos dos documentos'}</div>
                        </div>
                        <div class="card-badge ruptura">${gap.gapPosition || 'Hueco'}</div>
                    </div>
                `;
                
                if (index < sequenceAnalysis.gaps.length - 1) {
                    html += '<div class="timeline-connector"></div>';
                }
            }
        });
        
        html += '</div></div>';
    }
    
    // ===== TIMELINE CRONOLÓGICO UNIFICADO (REEMPLAZA CADENA DE PROPIEDAD) =====
    html += createTimelineHTML(ownershipChain, data.propertyValidation, data.tarjetasAnalysis);
    
    // Mantener secciones de alertas existentes (ya están en html)
    
    // CADENA DE PROPIEDAD (COMENTADA - REEMPLAZADA POR TIMELINE)
    /*
    html += '<div class="chain-container"><h2>🔗 Cadena de Propiedad</h2>';
    
    ownershipChain.forEach(item => {
        const isOrphan = item.state === 'RUPTURA';
        const isRetorno = item.state === 'RETORNO';
        const isEndoso = item.state === 'ENDOSO';
        const isRefactura = item.state === 'REFACTURA';
        
        // Determinar icono y nombre del tipo de documento
        let docIcon, docTypeName;
        if (item.type === 'invoice') {
            docIcon = '📄';
            docTypeName = 'Factura';
        } else if (item.type === 'reinvoice') {
            docIcon = '🔄';
            docTypeName = 'Refactura';
        } else { docIcon = '📋';
            docTypeName = 'Endoso';
        }
        
        let chainClass = '';
        if (isOrphan) chainClass = 'orphan';
        if (isRetorno) chainClass = 'retorno';
        
        html += `
            <div class="chain-item ${chainClass}" data-type="${item.type}">
                <div class="chain-number">${item.position !== null ? item.position : '?'}</div>
                
                <div style="margin-bottom: 16px;">
                    <span class="state-badge ${isRefactura ? 'refactura' : ''} ${isEndoso ? 'endoso' : ''}">
                        ${item.stateLabel}
                    </span>
                    <span class="document-type-badge">
                        ${docIcon} ${docTypeName}
                    </span>
                </div>
                
                ${item.fecha || item.numeroDocumento ? `
                    <div class="document-metadata" style="margin-bottom: 20px; border-top: none; padding-top: 0;">
                        ${item.fecha ? `
                            <div class="metadata-item">
                                <span class="metadata-icon">📅</span>
                                <span>${item.fecha}</span>
                            </div>
                        ` : ''}
                        ${item.numeroDocumento ? `
                            <div class="metadata-item">
                                <span class="metadata-icon">📋</span>
                                <span>Doc: ${item.numeroDocumento}</span>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                <div class="rfc-flow">
                    <div class="rfc-box">
                        <h4>${item.type === 'endorsement' ? 'ENDOSANTE' : 'EMISOR'}</h4>
                        <p>${item.nombreEmisor || 'N/A'}</p>
                        <small>${item.rfcEmisor || 'N/A'}</small>
                    </div>
                    
                    <div class="arrow">→</div>
                    
                    <div class="rfc-box">
                        <h4>${item.type === 'endorsement' ? 'ENDOSATARIO' : 'RECEPTOR'}</h4>
                        <p>${item.nombreReceptor || 'N/A'}</p>
                        <small>${item.rfcReceptor || 'N/A'}</small>
                    </div>
                </div>
                
                ${item.vehiculo && (item.vehiculo.marca || item.vehiculo.modelo || item.total) ? `
                    <div class="document-metadata">
                        ${item.vehiculo.marca || item.vehiculo.modelo ? `
                            <div class="metadata-item">
                                <span class="metadata-icon">🚗</span>
                                <strong>Vehículo:</strong> ${item.vehiculo.marca || ''} ${item.vehiculo.modelo || ''} ${item.vehiculo.ano || ''}
                            </div>
                        ` : ''}
                        ${item.total ? `
                            <div class="metadata-item">
                                <span class="metadata-icon">💰</span>
                                <strong>Monto:</strong> $${formatCurrency(item.total)}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                ${isRetorno ? `
                    <div class="status-message retorno">
                        <span style="font-size: 20px;">🔄</span>
                        <span>Este propietario ya había aparecido anteriormente en la cadena. Se trata de un retorno válido del vehículo.</span>
                    </div>
                ` : ''}
                
                ${isOrphan ? `
                    <div class="status-message orphan">
                        <span style="font-size: 20px;">⚠️</span>
                        <div>
                            <p style="margin: 0 0 8px 0; font-weight: 600;">Documento sin conexión con la secuencia principal</p>
                            <p style="margin: 0; font-weight: 500;">Hacen falta <strong>endosos</strong> o <strong>refacturas</strong> para continuar con la secuencia de propietarios.</p>
                            <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.9;">💡 El emisor de este documento debería ser el receptor del documento anterior en la cadena.</p>
                        </div>
                    </div>
                ` : ''}
                
                ${isEndoso ? `
                    <div class="status-message endoso">
                        <span style="font-size: 20px;">📋</span>
                        <span>Transferencia de propiedad mediante endoso legal del documento original.</span>
                    </div>
                ` : ''}
                
                ${isRefactura ? `
                    <div class="status-message refactura">
                        <span style="font-size: 20px;">🔄</span>
                        <span>Refacturación del vehículo. Documento de transferencia posterior a la venta original.</span>
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    html += '</div>';
    */
    
    // ===== NUEVO: VALIDACIÓN CRUZADA =====
    if (data.crossValidation && data.crossValidation.has_inconsistencies) {
        html += createCrossValidationHTML(data.crossValidation);
    }
    
    // ===== NUEVO: VALIDACIÓN DE PROPIEDAD =====
    if (data.propertyValidation && data.propertyValidation.total_propietarios > 0) {
        html += createPropertyValidationHTML(data.propertyValidation);
    }
    
    // ===== NUEVO: ANÁLISIS DE VIGENCIAS =====
    if (data.vigenciaAnalysis && data.vigenciaAnalysis.gaps_detectados > 0) {
        html += createVigenciaAnalysisHTML(data.vigenciaAnalysis);
    }
    
    // Metadata final
    html += `
        <div class="metadata">
            <p><strong>Análisis realizado:</strong> ${new Date(data.metadata?.analyzedAt || new Date()).toLocaleString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
            ${data.metadata?.createdAt ? `
                <p><strong>Expediente creado:</strong> ${new Date(data.metadata.createdAt).toLocaleString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</p>
            ` : ''}
        </div>
        
        <details class="json-details">
            <summary>📄 Ver JSON Completo del Análisis</summary>
            <pre>${JSON.stringify(data, null, 2)}</pre>
        </details>
    `;
    
    container.innerHTML = html;
    document.getElementById('analysisResults').style.display = 'block';
}

// ========== NUEVAS FUNCIONES DE DISPLAY PARA TARJETAS ==========

function createExecutiveSummaryHTML(summary) {
    if (!summary) return '';
    
    const riskClass = summary.nivel_riesgo.toLowerCase();
    
    return `
        <div class="summary-section">
        <h2>📊 Resumen Ejecutivo</h2>
        <div class="risk-level risk-${riskClass}">
            <strong>Nivel de Riesgo:</strong> ${summary.nivel_riesgo}
        </div>
        
        <div class="summary-stats">
            <div class="stat-card">
                <div class="stat-label">Issues Críticos</div>
                <div class="stat-value ${summary.issues_criticos > 0 ? 'text-danger' : ''}">${summary.issues_criticos}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Issues Altos</div>
                <div class="stat-value ${summary.issues_altos > 0 ? 'text-warning' : ''}">${summary.issues_altos}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Issues Medios</div>
                <div class="stat-value">${summary.issues_medios}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Total Issues</div>
                <div class="stat-value">${summary.total_issues}</div>
            </div>
        </div>
        
        <div class="summary-details">
            <h3>Estado de Documentación</h3>
            <div class="detail-row">
                <span>Secuencia de Facturas:</span>
                <span class="${summary.secuencia_facturas.completa ? 'text-success' : 'text-danger'}">
                    ${summary.secuencia_facturas.completa ? '✓ Completa' : '✗ Incompleta'}
                    ${summary.secuencia_facturas.con_huecos ? ` (${summary.secuencia_facturas.total_gaps} hueco(s))` : ''}
                </span>
            </div>
            <div class="detail-row">
                <span>Tarjetas de Circulación:</span>
                <span class="${summary.tarjetas_circulacion.vencidas === 0 ? 'text-success' : 'text-warning'}">
                    ${summary.tarjetas_circulacion.vigentes}/${summary.tarjetas_circulacion.total} vigentes
                    ${summary.tarjetas_circulacion.vencidas > 0 ? ` (${summary.tarjetas_circulacion.vencidas} vencida(s))` : ''}
                </span>
            </div>
            <div class="detail-row">
                <span>Consistencia de Datos:</span>
                <span class="${summary.consistencia_cruzada.tiene_inconsistencias ? 'text-warning' : 'text-success'}">
                    ${summary.consistencia_cruzada.tiene_inconsistencias ? `${summary.consistencia_cruzada.total_inconsistencias} inconsistencia(s)` : '✓ Consistente'}
                </span>
            </div>
        </div>
        
        ${createRecommendationsHTML(summary.recomendaciones)}
        </div>
    `;
}

function createRecommendationsHTML(recomendaciones) {
    if (!recomendaciones || recomendaciones.length === 0) return '';
    
    const recsHTML = recomendaciones.map(rec => `
        <div class="recommendation ${rec.prioridad.toLowerCase()}">
            <div class="rec-header">
                <span class="rec-priority">${rec.prioridad}</span>
                <span class="rec-type">${rec.tipo}</span>
            </div>
            <div class="rec-message">${rec.mensaje}</div>
            <ul class="rec-actions">
                ${rec.acciones.map(accion => `<li>${accion}</li>`).join('')}
            </ul>
        </div>
    `).join('');
    
    return `
        <div class="recommendations-section">
            <h3>💡 Recomendaciones</h3>
            ${recsHTML}
        </div>
    `;
}

function createTarjetasAnalysisHTML(tarjetasAnalysis) {
    if (!tarjetasAnalysis) return '';
    
    return `
        <div class="tarjetas-section">
        <h2>🚗 Análisis de Tarjetas de Circulación</h2>
        
        <div class="tarjetas-summary">
            <div class="info-card">
                <div class="info-label">Total Tarjetas</div>
                <div class="info-value">${tarjetasAnalysis.total_tarjetas}</div>
            </div>
            <div class="info-card">
                <div class="info-label">Vigentes</div>
                <div class="info-value text-success">${tarjetasAnalysis.tarjetas_vigentes}</div>
            </div>
            <div class="info-card">
                <div class="info-label">Vencidas</div>
                <div class="info-value text-danger">${tarjetasAnalysis.tarjetas_vencidas}</div>
            </div>
            <div class="info-card">
                <div class="info-label">Huecos de Cobertura</div>
                <div class="info-value ${tarjetasAnalysis.total_gaps > 0 ? 'text-warning' : 'text-success'}">${tarjetasAnalysis.total_gaps}</div>
            </div>
        </div>
        
        ${tarjetasAnalysis.has_gaps ? createTarjetasGapsHTML(tarjetasAnalysis.gaps) : ''}
        
        ${tarjetasAnalysis.tarjetas_vencidas > 0 ? createTarjetasVencidasHTML(tarjetasAnalysis.tarjetas_vencidas_detalle) : ''}
        
        ${tarjetasAnalysis.bajas_vehiculares.tiene_baja ? createBajasVehicularesHTML(tarjetasAnalysis.bajas_vehiculares) : ''}
        </div>
    `;
}

function createTarjetasGapsHTML(gaps) {
    if (!gaps || gaps.length === 0) return '';
    
    const gapsHTML = gaps.map(gap => `
        <div class="gap-alert ${gap.gravedad.toLowerCase()}">
            <div class="gap-type">${gap.tipo}</div>
            <div class="gap-description">${gap.descripcion}</div>
            <div class="gap-details">
                <strong>Propietario:</strong> ${gap.propietario.nombre} (${gap.propietario.rfc})<br>
                <strong>Período:</strong> ${formatDateString(gap.propietario.fecha_inicio_propiedad)} 
                ${gap.propietario.fecha_fin_propiedad ? ' - ' + formatDateString(gap.propietario.fecha_fin_propiedad) : ' - Actual'}
            </div>
            <div class="gap-recommendation">${gap.recomendacion}</div>
        </div>
    `).join('');
    
    return `
        <div class="tarjetas-gaps">
            <h3>⚠️ Huecos de Cobertura Detectados</h3>
            ${gapsHTML}
        </div>
    `;
}

function createTarjetasDetalleHTML(tarjetas) {
    if (!tarjetas || tarjetas.length === 0) return '';
    
    const tarjetasHTML = tarjetas.map((tarjeta, index) => `
        <div class="timeline-card tarjeta ${tarjeta.vigente ? 'vigente' : 'vencida'}">
            <div class="card-header">
                <span class="card-icon">🚗</span>
                <span class="card-type">Tarjeta Circulación</span>
                <span class="card-date">${tarjeta.fecha_expedicion ? formatDateShort(tarjeta.fecha_expedicion) : 'N/A'}</span>
            </div>
            <div class="card-body-mini">
                <div class="owner-mini">
                    <span class="name-mini">${tarjeta.nombre || 'N/A'}</span>
                    <span class="rfc-mini">${tarjeta.rfc || 'N/A'}</span>
                </div>
                <div class="details-mini">
                    <span>${tarjeta.estado_emisor || 'N/A'}</span>
                    ${tarjeta.placa ? `<span>Placa: ${tarjeta.placa}</span>` : ''}
                    ${tarjeta.folio ? `<span>Folio: ${tarjeta.folio}</span>` : ''}
                </div>
                ${tarjeta.alerta ? `<div class="card-alert">${tarjeta.alerta}</div>` : ''}
                ${tarjeta.hueco_documental ? '<div class="card-alert">⚠️ Estado con hueco documental en reglas de vigencia</div>' : ''}
                ${tarjeta.razon_vigencia ? `<div class="card-alert" style="color: #6b7280; font-size: 0.7rem;">${tarjeta.razon_vigencia}</div>` : ''}
            </div>
            <div class="card-badge ${tarjeta.vigente ? 'vigente' : 'vencida'}">${tarjeta.vigente ? '✓ Vigente' : '✗ Vencida'}</div>
        </div>
        ${index < tarjetas.length - 1 ? '<div class="timeline-connector"></div>' : ''}
    `).join('');
    
    return `
        <div class="tarjetas-detalle">
            <h3>📋 Detalle de Tarjetas</h3>
            <div class="timeline-container">
                ${tarjetasHTML}
            </div>
        </div>
    `;
}

function createTarjetasVencidasHTML(tarjetasVencidas) {
    if (!tarjetasVencidas || tarjetasVencidas.length === 0) return '';
    
    const tarjetasHTML = tarjetasVencidas.map(tarjeta => `
        <tr>
            <td>${tarjeta.nombre || 'N/A'}</td>
            <td>${tarjeta.rfc || 'N/A'}</td>
            <td>${tarjeta.estado_emisor || 'N/A'}</td>
            <td>${formatDateString(tarjeta.fecha_expedicion)}</td>
            <td>${formatDateString(tarjeta.fecha_vencimiento)}</td>
            <td class="text-danger">${tarjeta.dias_vencida || 'N/A'} días</td>
            <td>${tarjeta.razon || 'N/A'}</td>
        </tr>
    `).join('');
    
    return `
        <div class="tarjetas-vencidas">
            <h3>⚠️ Tarjetas Vencidas</h3>
            <table class="tarjetas-table">
                <thead>
                    <tr>
                        <th>Propietario</th>
                        <th>RFC</th>
                        <th>Estado</th>
                        <th>Expedición</th>
                        <th>Vencimiento</th>
                        <th>Días Vencida</th>
                        <th>Razón</th>
                    </tr>
                </thead>
                <tbody>
                    ${tarjetasHTML}
                </tbody>
            </table>
        </div>
    `;
}

function createBajasVehicularesHTML(bajas) {
    if (!bajas || !bajas.tiene_baja) return '';
    
    return `
        <div class="bajas-section">
            <h3>📄 Bajas Vehiculares</h3>
            <div class="baja-info">
                <strong>Total de bajas:</strong> ${bajas.total_bajas}<br>
                <strong>Última baja:</strong> ${formatDateString(bajas.fecha_ultima_baja)}
            </div>
        </div>
    `;
}

function createCrossValidationHTML(crossValidation) {
    if (!crossValidation || !crossValidation.has_inconsistencies) return '';
    
    return `
        <div class="cross-validation-section">
        <h2>🔍 Validación Cruzada de Consistencia</h2>
        
        <div class="cross-summary">
            <div class="info-card">
                <div class="info-label">Total Inconsistencias</div>
                <div class="info-value text-warning">${crossValidation.total_inconsistencies}</div>
            </div>
            <div class="info-card">
                <div class="info-label">Críticas</div>
                <div class="info-value text-danger">${crossValidation.inconsistencias_criticas}</div>
            </div>
            <div class="info-card">
                <div class="info-label">Altas</div>
                <div class="info-value text-warning">${crossValidation.inconsistencias_altas}</div>
            </div>
            <div class="info-card">
                <div class="info-label">Medias</div>
                <div class="info-value">${crossValidation.inconsistencias_medias}</div>
            </div>
        </div>
        
        ${createInconsistenciasHTML(crossValidation.inconsistencias)}
        </div>
    `;
}

function createInconsistenciasHTML(inconsistencias) {
    if (!inconsistencias || inconsistencias.length === 0) return '';
    
    const incsHTML = inconsistencias.map(inc => `
        <div class="inconsistencia ${inc.gravedad.toLowerCase()}">
            <div class="inc-header">
                <span class="inc-gravedad">${inc.gravedad}</span>
                <span class="inc-tipo">${inc.tipo}</span>
            </div>
            <div class="inc-description">${inc.descripcion}</div>
            ${inc.rfc ? `<div class="inc-field"><strong>RFC:</strong> ${inc.rfc}</div>` : ''}
            ${inc.nombre_en_factura ? `<div class="inc-field"><strong>Nombre en factura:</strong> ${inc.nombre_en_factura}</div>` : ''}
            ${inc.nombre_en_tarjeta ? `<div class="inc-field"><strong>Nombre en tarjeta:</strong> ${inc.nombre_en_tarjeta}</div>` : ''}
            ${inc.similitud ? `<div class="inc-field"><strong>Similitud:</strong> ${(inc.similitud * 100).toFixed(1)}%</div>` : ''}
            <div class="inc-recommendation">${inc.recomendacion}</div>
        </div>
    `).join('');
    
    return `
        <div class="inconsistencias-list">
            <h3>⚠️ Inconsistencias Detectadas</h3>
            ${incsHTML}
        </div>
    `;
}

function createPropertyValidationHTML(propertyValidation) {
    if (!propertyValidation || !propertyValidation.detalle || propertyValidation.detalle.length === 0) return '';
    
    const rowsHTML = propertyValidation.detalle.map(item => {
        const tieneTarjetaClass = item.tiene_tarjeta ? 'coverage-ok' : 'coverage-gap';
        const tieneTarjetaIcon = item.tiene_tarjeta ? '✓' : '✗';
        const similitudHTML = item.similitud_nombre !== null 
            ? `${(item.similitud_nombre * 100).toFixed(1)}%`
            : 'N/A';
        const similitudClass = item.similitud_nombre !== null && item.similitud_nombre < 0.7 
            ? 'text-warning' 
            : '';
        
        // Para propietario actual: mostrar badge y vigencia
        const actualBadge = item.es_propietario_actual 
            ? '<span class="propietario-actual-badge">ACTUAL</span>' 
            : '';
        
        // Para propietario actual: mostrar estado de vigencia
        let vigenciaHTML = '';
        if (item.es_propietario_actual) {
            if (item.tiene_tarjeta) {
                if (item.tarjeta_vigente_hoy === true) {
                    vigenciaHTML = '<span class="vigencia-ok">✓ Vigente</span>';
                } else if (item.tarjeta_vigente_hoy === false) {
                    vigenciaHTML = '<span class="vigencia-vencida">✗ Vencida</span>';
                } else {
                    vigenciaHTML = '<span class="text-warning">? No calculable</span>';
                }
            } else {
                vigenciaHTML = '<span class="vigencia-vencida">Sin tarjeta</span>';
            }
        } else {
            // Para históricos: no mostrar vigencia
            vigenciaHTML = '-';
        }
        
        // Resaltar fila si es propietario actual sin vigencia
        const rowClass = item.es_propietario_actual && item.tarjeta_vigente_hoy === false 
            ? 'propietario-actual-sin-vigencia' 
            : '';
        
        return `
            <tr class="${rowClass}">
                <td>
                    ${item.nombre_factura || 'N/A'}
                    ${actualBadge}
                </td>
                <td><code>${item.rfc || 'N/A'}</code></td>
                <td class="${tieneTarjetaClass}">${tieneTarjetaIcon}</td>
                <td class="${similitudClass}">${similitudHTML}</td>
                <td>${vigenciaHTML}</td>
                <td>${item.estado || 'N/A'}</td>
            </tr>
        `;
    }).join('');
    
    // Alerta si propietario actual sin vigencia
    const alertaActual = propertyValidation.propietario_actual_sin_vigencia 
        ? '<div class="alert-propietario-actual">⚠️ El propietario actual tiene una tarjeta vencida. Se requiere renovación.</div>'
        : '';
    
    return `
        <div class="property-validation-section">
            <h2>🔍 Validación de Propiedad (Facturas vs Tarjetas)</h2>
            
            ${alertaActual}
            
            <div class="property-summary">
                <div class="info-card">
                    <div class="info-label">Total Propietarios</div>
                    <div class="info-value">${propertyValidation.total_propietarios}</div>
                </div>
                <div class="info-card">
                    <div class="info-label">Con Tarjeta</div>
                    <div class="info-value text-success">${propertyValidation.propietarios_con_tarjeta}</div>
                </div>
                <div class="info-card">
                    <div class="info-label">Sin Tarjeta</div>
                    <div class="info-value ${propertyValidation.propietarios_sin_tarjeta > 0 ? 'text-warning' : 'text-success'}">${propertyValidation.propietarios_sin_tarjeta}</div>
                </div>
                <div class="info-card">
                    <div class="info-label">Propietario Actual</div>
                    <div class="info-value ${propertyValidation.propietario_actual_sin_vigencia ? 'text-danger' : 'text-success'}">
                        ${propertyValidation.propietario_actual_sin_vigencia ? '✗ Sin Vigencia' : '✓ Vigente'}
                    </div>
                </div>
            </div>
            
            <div class="property-table-container">
                <table class="property-table">
                    <thead>
                        <tr>
                            <th>Propietario</th>
                            <th>RFC</th>
                            <th>Tiene Tarjeta</th>
                            <th>Coincidencia Nombre (%)</th>
                            <th>Vigencia HOY</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHTML}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function createVigenciaAnalysisHTML(vigenciaAnalysis) {
    if (!vigenciaAnalysis || !vigenciaAnalysis.gaps || vigenciaAnalysis.gaps.length === 0) return '';
    
    const gapsHTML = vigenciaAnalysis.gaps.map(gap => {
        const gravedadClass = gap.gravedad ? gap.gravedad.toLowerCase() : 'media';
        return `
            <div class="vigencia-gap ${gravedadClass}">
                <div class="gap-header">
                    <strong>Período sin cobertura: ${formatDateString(gap.fecha_inicio_gap)} - ${formatDateString(gap.fecha_fin_gap)}</strong>
                    <span class="gap-gravedad ${gravedadClass}">${gap.gravedad || 'MEDIA'}</span>
                </div>
                <div class="gap-details">
                    <div class="gap-field">
                        <strong>Días sin cobertura:</strong> ${gap.dias_sin_cobertura} días
                    </div>
                    ${gap.estados_involucrados && gap.estados_involucrados.length > 0 ? `
                        <div class="gap-field">
                            <strong>Estados involucrados:</strong> ${gap.estados_involucrados.join(', ')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    return `
        <div class="vigencia-analysis-section">
            <h2>📅 Huecos de Cobertura Temporal</h2>
            
            <div class="vigencia-summary">
                <div class="info-card">
                    <div class="info-label">Total Tarjetas</div>
                    <div class="info-value">${vigenciaAnalysis.total_tarjetas || 0}</div>
                </div>
                <div class="info-card">
                    <div class="info-label">Gaps Detectados</div>
                    <div class="info-value text-warning">${vigenciaAnalysis.gaps_detectados}</div>
                </div>
            </div>
            
            <div class="vigencia-gaps-list">
                <h3>⚠️ Gaps de Cobertura Detectados</h3>
                ${gapsHTML}
            </div>
        </div>
    `;
}

function formatDateString(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('es-MX', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    } catch (error) {
        return dateStr;
    }
}

function formatDateShort(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('es-MX', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        });
    } catch (e) {
        return dateStr;
    }
}

function parseDate(dateStr) {
    if (!dateStr) return new Date(0);
    if (dateStr instanceof Date) return dateStr;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date(0) : date;
}

function createTimelineHTML(ownershipChain, propertyValidation, tarjetasAnalysis) {
    const allDocuments = [];
    
    // Agregar facturas de ownershipChain
    if (ownershipChain && ownershipChain.length > 0) {
        ownershipChain.forEach(doc => {
            allDocuments.push({
                tipo: 'FISCAL',
                subtipo: doc.type, // invoice, reinvoice, endorsement
                fecha: parseDate(doc.fecha),
                fechaStr: doc.fecha,
                position: doc.position,
                state: doc.state,
                stateLabel: doc.stateLabel,
                emisor: doc.nombreEmisor,
                emisorRFC: doc.rfcEmisor,
                receptor: doc.nombreReceptor,
                receptorRFC: doc.rfcReceptor,
                numeroDoc: doc.numeroDocumento,
                total: doc.total,
                vehiculo: doc.vehiculo,
                usadoNuevo: doc.usadoNuevo,
                fileId: doc.fileId
            });
        });
    }
    
    // Agregar tarjetas de propertyValidation si existen
    if (propertyValidation && propertyValidation.tarjetas_detalle && propertyValidation.tarjetas_detalle.length > 0) {
        propertyValidation.tarjetas_detalle.forEach(tc => {
            allDocuments.push({
                tipo: 'TARJETA',
                subtipo: 'vehicle_certificate',
                fecha: parseDate(tc.fecha_expedicion),
                fechaStr: tc.fecha_expedicion,
                propietario: tc.nombre,
                rfc: tc.rfc,
                estado: tc.estado_emisor,
                placa: tc.placa,
                folio: tc.folio,
                repuve: tc.repuve,
                fechaVigencia: tc.fecha_vigencia,
                vigente: tc.vigente,
                razon_vigencia: tc.razon_vigencia,
                tiene_coincidencia: tc.tiene_coincidencia,
                similitud_nombre: tc.similitud_nombre,
                fileId: tc.file_id
            });
        });
    }
    
    // Agregar tarjetas de tarjetasAnalysis si existen (detalle completo)
    if (tarjetasAnalysis && tarjetasAnalysis.tarjetas_detalle && tarjetasAnalysis.tarjetas_detalle.length > 0) {
        tarjetasAnalysis.tarjetas_detalle.forEach(tarjeta => {
            // Solo agregar si no existe ya en propertyValidation (evitar duplicados)
            const yaExiste = allDocuments.some(doc => 
                doc.tipo === 'TARJETA' && 
                doc.fechaStr === tarjeta.fecha_expedicion &&
                doc.rfc === tarjeta.rfc
            );
            
            if (!yaExiste) {
                allDocuments.push({
                    tipo: 'TARJETA',
                    subtipo: 'vehicle_certificate',
                    fecha: parseDate(tarjeta.fecha_expedicion),
                    fechaStr: tarjeta.fecha_expedicion,
                    propietario: tarjeta.nombre,
                    rfc: tarjeta.rfc,
                    estado: tarjeta.estado_emisor,
                    placa: tarjeta.placa,
                    folio: tarjeta.folio,
                    repuve: tarjeta.repuve,
                    fechaVigencia: tarjeta.fecha_vigencia,
                    vigente: tarjeta.vigente,
                    razon_vigencia: tarjeta.razon_vigencia,
                    tipo_validacion: tarjeta.tipo_validacion,
                    alerta: tarjeta.alerta,
                    hueco_documental: tarjeta.hueco_documental,
                    tiene_coincidencia: true, // Ya viene del análisis
                    fileId: tarjeta.file_id || null
                });
            }
        });
    }
    
    // Ordenar por fecha cronológica
    allDocuments.sort((a, b) => {
        if (!a.fecha || !b.fecha) return 0;
        return a.fecha.getTime() - b.fecha.getTime();
    });
    
    if (allDocuments.length === 0) {
        return '<div class="timeline-section"><h3>📅 Línea de Tiempo Cronológica</h3><p>No hay documentos para mostrar</p></div>';
    }
    
    let timelineHTML = '<div class="timeline-section"><h3>📅 Línea de Tiempo Cronológica</h3><div class="timeline-container">';
    
    allDocuments.forEach((doc, index) => {
        if (doc.tipo === 'FISCAL') {
            const docTypeName = doc.subtipo === 'invoice' ? 'Factura' : doc.subtipo === 'reinvoice' ? 'Refactura' : 'Endoso';
            const isRuptura = doc.position === null;
            
            timelineHTML += `
                <div class="timeline-card fiscal ${isRuptura ? 'ruptura' : ''} ${doc.state ? doc.state.toLowerCase() : ''}">
                    <div class="card-header">
                        <span class="card-icon">📄</span>
                        <span class="card-type">${docTypeName}</span>
                        <span class="card-date">${formatDateShort(doc.fechaStr)}</span>
                    </div>
                    <div class="card-body-mini">
                        <div class="transfer-mini">
                            <span class="name-mini">${doc.emisor || 'N/A'}</span>
                            <span class="arrow-mini">→</span>
                            <span class="name-mini">${doc.receptor || 'N/A'}</span>
                        </div>
                        <div class="details-mini">
                            <span style="color: #895ddc; font-family: monospace; font-weight: 600;">${doc.emisorRFC || 'N/A'}</span>
                            <span>→</span>
                            <span style="color: #895ddc; font-family: monospace; font-weight: 600;">${doc.receptorRFC || 'N/A'}</span>
                        </div>
                        <div class="details-mini">
                            <span>${doc.numeroDoc || 'N/A'}</span>
                            ${doc.total ? `<span>$${formatCurrency(doc.total)}</span>` : ''}
                        </div>
                    </div>
                    ${doc.position !== null ? `<div class="card-position">Pos. ${doc.position}</div>` : '<div class="card-badge ruptura">Ruptura</div>'}
                </div>
            `;
        } else if (doc.tipo === 'TARJETA') {
            timelineHTML += `
                <div class="timeline-card tarjeta ${doc.vigente ? 'vigente' : 'vencida'}">
                    <div class="card-header">
                        <span class="card-icon">🚗</span>
                        <span class="card-type">Tarjeta Circulación</span>
                        <span class="card-date">${formatDateShort(doc.fechaStr)}</span>
                    </div>
                    <div class="card-body-mini">
                        <div class="owner-mini">
                            <span class="name-mini">${doc.propietario || 'N/A'}</span>
                        </div>
                        <div class="details-mini">
                            <span style="color: #895ddc; font-family: monospace; font-weight: 600;">${doc.rfc || 'N/A'}</span>
                        </div>
                        <div class="details-mini">
                            <span>${doc.estado || 'N/A'}</span>
                            ${doc.placa ? `<span>Placa: ${doc.placa}</span>` : ''}
                            ${doc.folio ? `<span>Folio: ${doc.folio}</span>` : ''}
                        </div>
                        ${!doc.tiene_coincidencia ? '<div class="card-alert">⚠️ Sin coincidencia en facturas</div>' : ''}
                        ${doc.alerta ? `<div class="card-alert">${doc.alerta}</div>` : ''}
                        ${doc.hueco_documental ? '<div class="card-alert">⚠️ Estado con hueco documental en reglas de vigencia</div>' : ''}
                        ${doc.razon_vigencia ? `<div class="card-alert" style="color: #6b7280; font-size: 0.7rem;">${doc.razon_vigencia}</div>` : ''}
                    </div>
                    <div class="card-badge ${doc.vigente ? 'vigente' : 'vencida'}">${doc.vigente ? '✓ Vigente' : '✗ Vencida'}</div>
                </div>
            `;
        }
        
        // Agregar conector visual entre cards
        if (index < allDocuments.length - 1) {
            timelineHTML += '<div class="timeline-connector"></div>';
        }
    });
    
    timelineHTML += '</div></div>';
    
    return timelineHTML;
}

function hideAnalysisResults() {
    document.getElementById('analysisResults').style.display = 'none';
}

// ============================================================================
// FUNCIONES DE INTERFAZ DE USUARIO
// ============================================================================

function showLoading(message = 'Procesando...') {
    const loading = document.getElementById('loading');
    loading.textContent = message;
    loading.style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError(message) {
    const error = document.getElementById('error');
    error.textContent = message;
    error.style.display = 'block';
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    document.getElementById('error').style.display = 'none';
}

function showSuccess(message) {
    // Crear elemento temporal para mostrar éxito
    const success = document.createElement('div');
    success.className = 'success';
    success.textContent = message;
    success.style.display = 'block';
    document.body.appendChild(success);
    
    setTimeout(() => {
        success.remove();
    }, 3000);
}

function hideSuccess() {
    // No hay elemento permanente de éxito
}

function showSearchSection() {
    document.getElementById('search').style.display = 'block';
}

function hideSearchSection() {
    document.getElementById('search').style.display = 'none';
}

function showAnalysisSection() {
    document.getElementById('analysis').style.display = 'block';
}

function hideAnalysisSection() {
    document.getElementById('analysis').style.display = 'none';
}

function displayTokenStatus(tokenInfo) {
    const tokenStatus = document.getElementById('tokenStatus');
    const tokenInfoDiv = document.getElementById('tokenInfo');
    
    const statusClass = tokenInfo.isValid ? 'valid' : 'expired';
    const statusText = tokenInfo.isValid ? 'Válido' : 'Expirado';
    
    tokenInfoDiv.innerHTML = `
        <p><strong>Estado:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
        <p><strong>Tiempo restante:</strong> ${tokenInfo.timeRemaining} segundos</p>
        <p><strong>Expira:</strong> ${new Date(tokenInfo.expiresAt).toLocaleString('es-MX')}</p>
    `;
    
    tokenStatus.style.display = 'block';
}

function hideTokenStatus() {
    document.getElementById('tokenStatus').style.display = 'none';
}


