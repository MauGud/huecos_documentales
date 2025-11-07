// ============================================================================
// ANALIZADOR DE SECUENCIA DE PROPIEDAD VEHICULAR - FRONTEND
// ============================================================================

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
        document.getElementById('analysisResults').style.display = 'none';

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
        <h2>📦 Expediente Completo</h2>
        
        <div style="margin: 0 32px 24px 32px;">
            <span class="document-type-badge" style="background: linear-gradient(135deg, #895ddc 0%, #a78bfa 100%); color: white; padding: 8px 16px; font-size: 12px;">
                Búsqueda: Expediente completo
            </span>
        </div>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>Vehicle ID</h3>
                <p style="font-size: 14px; word-break: break-all;">${data.data.vehicle_id}</p>
            </div>
            ${data.data.vin ? `
                <div class="info-card">
                    <h3>VIN</h3>
                    <p style="font-size: 18px;">${data.data.vin}</p>
                </div>
            ` : ''}
            <div class="info-card">
                <h3>Total Documentos</h3>
                <p>${data.data.total_files}</p>
            </div>
            <div class="info-card">
                <h3>Facturas</h3>
                <p>${data.data.invoices.length}</p>
            </div>
            <div class="info-card">
                <h3>Refacturas</h3>
                <p>${data.data.reinvoices ? data.data.reinvoices.length : 0}</p>
            </div>
            <div class="info-card">
                <h3>Endosos</h3>
                <p>${data.data.other_documents.filter(d => d.document_type === 'endorsement').length}</p>
            </div>
            <div class="info-card">
                <h3>Otros</h3>
                <p>${data.data.other_documents.filter(d => d.document_type !== 'endorsement').length}</p>
            </div>
        </div>
    `;
    
    // Combinar facturas y refacturas para mostrarlas juntas
    const allInvoiceTypes = [
        ...data.data.invoices.map(inv => ({...inv, displayType: 'Factura'})),
        ...(data.data.reinvoices || []).map(reinv => ({...reinv, displayType: 'Refactura'}))
    ];

    // Ordenar por fecha si está disponible
    allInvoiceTypes.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateA - dateB;
    });

    if (allInvoiceTypes.length > 0) {
        html += '<div class="document-section"><h3>📄 Facturas y Refacturas</h3>';
        allInvoiceTypes.forEach((doc, index) => {
            const icon = doc.displayType === 'Factura' ? '📄' : '🔄';
            html += `
                <div class="document-card">
                    <h4>${icon} ${doc.displayType} ${index + 1}</h4>
                    <div class="document-preview">
                        ${doc.ocr && doc.ocr.rfc_emisor ? `
                            <p><strong>RFC Emisor:</strong> ${doc.ocr.rfc_emisor}</p>
                            <p><strong>Nombre Emisor:</strong> ${doc.ocr.nombre_emisor || 'N/A'}</p>
                            <p><strong>RFC Receptor:</strong> ${doc.ocr.rfc_receptor || 'N/A'}</p>
                            <p><strong>Nombre Receptor:</strong> ${doc.ocr.nombre_receptor || 'N/A'}</p>
                            <p><strong>Fecha:</strong> ${doc.ocr.fecha_factura || doc.ocr.fecha_refactura || doc.ocr.fecha_hora_emision || 'N/A'}</p>
                            <p><strong>Total:</strong> $${doc.ocr.total || 'N/A'}</p>
                            ${doc.ocr.usado_nuevo ? `<p><strong>Usado/Nuevo:</strong> ${doc.ocr.usado_nuevo}</p>` : ''}
                        ` : '<p class="no-data">Sin datos OCR</p>'}
                    </div>
                    <details class="json-details">
                        <summary>Ver JSON Completo</summary>
                        <pre>${JSON.stringify(doc, null, 2)}</pre>
                    </details>
                </div>
            `;
        });
        html += '</div>';
    } else {
        html += '<p class="no-data">No se encontraron facturas ni refacturas.</p>';
    }

    // Mostrar endosos si existen
    const endorsements = data.data.other_documents.filter(d => d.document_type === 'endorsement');
    if (endorsements.length > 0) {
        html += '<div class="document-section"><h3>📋 Endosos</h3>';
        endorsements.forEach((doc, index) => {
            html += `
                <div class="document-card">
                    <h4>📋 Endoso ${index + 1}</h4>
                    <div class="document-preview">
                        ${doc.ocr && doc.ocr.rfc_endosante ? `
                            <p><strong>RFC Endosante:</strong> ${doc.ocr.rfc_endosante}</p>
                            <p><strong>Nombre Endosante:</strong> ${doc.ocr.nombre_endosante || 'N/A'}</p>
                            <p><strong>RFC Endosatario:</strong> ${doc.ocr.rfc_endosatario || 'N/A'}</p>
                            <p><strong>Nombre Endosatario:</strong> ${doc.ocr.nombre_endosatario || 'N/A'}</p>
                            <p><strong>Fecha:</strong> ${doc.ocr.fecha_endoso || doc.ocr.fecha_hora_endoso || 'N/A'}</p>
                        ` : '<p class="no-data">Sin datos OCR</p>'}
                    </div>
                    <details class="json-details">
                        <summary>Ver JSON Completo</summary>
                        <pre>${JSON.stringify(doc, null, 2)}</pre>
                    </details>
                </div>
            `;
        });
        html += '</div>';
    }

    // Mostrar otros documentos
    const otherDocs = data.data.other_documents.filter(d => d.document_type !== 'endorsement');
    if (otherDocs.length > 0) {
        html += '<div class="document-section"><h3>📁 Otros Documentos</h3>';
        otherDocs.forEach((doc, index) => {
            html += `
                <div class="document-card">
                    <h4>📁 ${doc.document_type} ${index + 1}</h4>
                    <div class="document-preview">
                        <p><strong>Tipo:</strong> ${doc.document_type}</p>
                        <p><strong>Fecha de creación:</strong> ${new Date(doc.created_at).toLocaleString('es-MX')}</p>
                        ${doc.ocr ? `<p><strong>OCR:</strong> Disponible</p>` : '<p class="no-data">Sin datos OCR</p>'}
                    </div>
                    <details class="json-details">
                        <summary>Ver JSON Completo</summary>
                        <pre>${JSON.stringify(doc, null, 2)}</pre>
                    </details>
                </div>
            `;
        });
        html += '</div>';
    }

    // JSON completo del expediente
    html += `
        <details class="json-details">
            <summary>📦 Expediente Completo (JSON RAW)</summary>
            <pre>${JSON.stringify(data.raw_expediente, null, 2)}</pre>
        </details>
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
    const container = document.getElementById('analysisResults');
    
    const statusClass = data.sequenceAnalysis.isComplete ? 'success' : 'warning';
    const statusIcon = data.sequenceAnalysis.isComplete ? '✓' : '⚠';
    const statusText = data.sequenceAnalysis.isComplete ? 'Secuencia Completa' : 'Huecos Detectados';
    
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
                <p style="color: ${data.sequenceAnalysis.totalGaps > 0 ? '#f59e0b' : '#10b981'}">${data.sequenceAnalysis.totalGaps}</p>
            </div>
            <div class="info-card">
                <h3>Retornos</h3>
                <p style="color: #3b82f6">${data.sequenceAnalysis.totalRetornos || 0}</p>
            </div>
        </div>
    `;
    
    // Documento de origen
    if (data.originDocument) {
        const docTypeIcon = data.originDocument.documentType === 'invoice' ? '📄' : 
                           data.originDocument.documentType === 'reinvoice' ? '🔄' : '📋';
        const docTypeName = data.originDocument.documentType === 'invoice' ? 'Factura' : 
                           data.originDocument.documentType === 'reinvoice' ? 'Refactura' : 'Endoso';
        
        html += `
            <div class="vehicle-info">
                <h3>🚗 Documento de Origen (Vehículo Nuevo)</h3>
                <p><strong>Tipo:</strong> ${docTypeIcon} ${docTypeName}</p>
                ${data.originDocument.fecha ? `<p><strong>Fecha:</strong> ${data.originDocument.fecha}</p>` : ''}
                <p><strong>Emisor:</strong> ${data.originDocument.nombreEmisor || 'N/A'} 
                   <span style="color: #895ddc; font-family: monospace; font-weight: 600;">(${data.originDocument.rfcEmisor || 'N/A'})</span>
                </p>
                <p><strong>Receptor:</strong> ${data.originDocument.nombreReceptor || 'N/A'} 
                   <span style="color: #895ddc; font-family: monospace; font-weight: 600;">(${data.originDocument.rfcReceptor || 'N/A'})</span>
                </p>
            </div>
        `;
    }
    
    // Retornos
    if (data.sequenceAnalysis.hasRetornos) {
        html += '<div class="retorno-alert"><h3>🔄 Retornos Válidos Detectados</h3>';
        
        data.sequenceAnalysis.retornos.forEach(retorno => {
            html += `
                <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 8px; border-left: 3px solid #3b82f6;">
                    <p style="font-weight: 600; color: #1e40af; margin-bottom: 8px;">${retorno.position}</p>
                    <p style="color: #1e3a8a; line-height: 1.6;">${retorno.description}</p>
                    <div style="margin-top: 12px; padding: 12px; background: #eff6ff; border-radius: 6px; font-size: 14px;">
                        <p style="margin: 4px 0; color: #1e40af;">
                            <strong>Propietario anterior:</strong> ${retorno.previousOwner} 
                            <span style="font-family: monospace;">(${retorno.previousRFC})</span>
                        </p>
                        <p style="margin: 4px 0; color: #1e40af;">
                            <strong>Regresa a:</strong> ${retorno.returnedToName} 
                            <span style="font-family: monospace;">(${retorno.returnedTo})</span>
                        </p>
                        ${retorno.fecha ? `<p style="margin: 4px 0; color: #1e40af;"><strong>Fecha:</strong> ${retorno.fecha}</p>` : ''}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    // Huecos
    if (data.sequenceAnalysis.hasGaps) {
        html += '<div class="gap-alert"><h3>⚠️ Análisis de Huecos en la Secuencia</h3>';
        
        data.sequenceAnalysis.gaps.forEach(gap => {
            if (gap.type === 'orphan_documents') {
                html += `
                    <div style="margin-top: 20px; padding: 20px; background: white; border-radius: 12px; border-left: 4px solid #f59e0b;">
                        <h4 style="color: #92400e; margin-bottom: 12px; font-size: 16px;">⚠️ ${gap.gapPosition}</h4>
                        <p style="color: #92400e; margin-bottom: 16px; line-height: 1.6;">${gap.description}</p>
                        
                        <div style="background: #fef9e6; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                            <p style="color: #92400e; font-weight: 600; margin-bottom: 10px;">📋 Acción requerida:</p>
                            <p style="color: #92400e; line-height: 1.6; margin-bottom: 10px;">
                                Para completar la cadena de propiedad, necesitas proporcionar:
                            </p>
                            <ul style="margin: 10px 0 10px 24px; color: #92400e; line-height: 1.8;">
                                <li><strong>Endosos</strong> que conecten los documentos faltantes, o</li>
                                <li><strong>Refacturas</strong> que muestren las transferencias intermedias</li>
                            </ul>
                        </div>
                        
                        <details>
                            <summary style="cursor: pointer; color: #92400e; font-weight: 600; padding: 12px; background: #fef3c7; border-radius: 6px;">
                                📂 Ver documentos sin conexión (${gap.orphanDocuments.length})
                            </summary>
                            <div style="margin-top: 12px; padding: 12px; background: #fffbeb; border-radius: 6px;">
                `;
                gap.orphanDocuments.forEach(orphan => {
                    const icon = orphan.type === 'invoice' ? '📄' : orphan.type === 'reinvoice' ? '🔄' : '📋';
                    const typeName = orphan.type === 'invoice' ? 'Factura' : orphan.type === 'reinvoice' ? 'Refactura' : 'Endoso';
                    html += `
                        <div style="margin: 10px 0; padding: 12px; background: white; border-radius: 6px; border-left: 3px solid #f59e0b;">
                            <p style="margin: 0; color: #92400e;"><strong>${icon} ${typeName}</strong></p>
                            <p style="margin: 6px 0 0 0; font-size: 14px; color: #78350f;">
                                ${orphan.nombreEmisor || 'N/A'} <span style="font-family: monospace;">(${orphan.rfcEmisor || 'N/A'})</span> 
                                <span style="color: #895ddc;">→</span> 
                                ${orphan.nombreReceptor || 'N/A'} <span style="font-family: monospace;">(${orphan.rfcReceptor || 'N/A'})</span>
                                ${orphan.fecha ? ` • ${orphan.fecha}` : ''}
                            </p>
                        </div>
                    `;
                });
                html += `
                            </div>
                        </details>
                    </div>
                `;
            } else {
                html += `
                    <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 8px; border-left: 3px solid #f59e0b;">
                        <p style="font-weight: 600; color: #92400e; margin-bottom: 8px;">${gap.gapPosition}</p>
                        <p style="color: #78350f; line-height: 1.6;">${gap.description}</p>
                    </div>
                `;
            }
        });
        
        html += '</div>';
    }
    
    // CADENA DE PROPIEDAD
    html += '<div class="chain-container"><h2>🔗 Cadena de Propiedad</h2>';
    
    data.ownershipChain.forEach(item => {
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
    
    // Metadata final
    html += `
        <div class="metadata">
            <p><strong>Análisis realizado:</strong> ${new Date(data.metadata.analyzedAt).toLocaleString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
            ${data.metadata.createdAt ? `
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


