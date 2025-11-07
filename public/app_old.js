const API_URL = 'http://localhost:3001/api';
let searchData = null;
let tokenInfo = null;
let searchType = null;

// PASO 1: AUTENTICACIÓN
document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    
    if (!email || !password) {
        showError('Por favor ingresa email y contraseña de Nexcar');
        return;
    }

    showLoading('Autenticando con Nexcar...');
    hideError();
    hideSuccess();

    try {
        const response = await fetch(`${API_URL}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            tokenInfo = data.tokenInfo;
            displayTokenStatus(data);
            showSuccess('Token generado exitosamente');
            showSearchSection();
        } else {
            showError(data.error?.message || data.error || 'Error al autenticar');
        }

    } catch (error) {
        showError('Error de conexión: ' + error.message);
    } finally {
        hideLoading();
    }
});

// LIMPIAR TOKEN
document.getElementById('clearTokenBtn').addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_URL}/clear-token`, { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
            tokenInfo = null;
            hideTokenStatus();
            hideSearchSection();
            hideExtractedData();
            hideAnalysisSection();
            hideSuccess();
            showSuccess('Token limpiado exitosamente');
        } else {
            showError('Error al limpiar token: ' + data.error);
        }
        
    } catch (error) {
        showError('Error al limpiar token: ' + error.message);
    }
});

// PASO 2: BÚSQUEDA POR URL DE NEXCAR
document.getElementById('fetchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
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
            searchData = data;
            searchType = data.searchType;
            displayExpedienteCompleto(data);
            document.getElementById('analysis').style.display = 'block';
        } else {
            showError(data.error || 'Error al consultar expediente');
        }

    } catch (error) {
        showError('Error de conexión: ' + error.message);
    } finally {
        hideLoading();
    }
});

// PASO 3: ANALIZAR SECUENCIA
document.getElementById('analyzeBtn').addEventListener('click', async () => {
    if (!searchData) {
        showError('No hay datos cargados');
        return;
    }

    showLoading('Analizando secuencia de propiedad...');
    hideError();
    hideSuccess();
    hideAnalysisResults();

    try {
        const response = await fetch(`${API_URL}/analyze-sequence`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
            displayAnalysisResults(data);
            showSuccess('Análisis completado exitosamente');
        } else {
            showError(data.error || 'Error al analizar secuencia');
        }

    } catch (error) {
        showError('Error: ' + error.message);
    } finally {
        hideLoading();
    }
});

// LIMPIAR TODO - FUNCIÓN ELIMINADA (elemento clearBtn no existe en nuevo HTML)

// MOSTRAR ESTADO DEL TOKEN
function displayTokenStatus(data) {
    const container = document.getElementById('tokenStatus');
    const tokenInfoDiv = document.getElementById('tokenInfo');
    
    const statusClass = data.tokenInfo.isValid ? 'success' : 'warning';
    const statusText = data.tokenInfo.isValid ? '✅ Token Válido' : '⚠️ Token Inválido';
    
    let html = `
        <div class="token-info ${statusClass}">
            <div class="token-status-item">
                <strong>Estado:</strong> ${statusText}
            </div>
            <div class="token-status-item">
                <strong>Tiempo restante:</strong> ${data.tokenInfo.timeRemaining} segundos
            </div>
            <div class="token-status-item">
                <strong>Expira:</strong> ${new Date(data.tokenInfo.expiresAt).toLocaleString('es-MX')}
            </div>
        </div>
    `;
    
    tokenInfoDiv.innerHTML = html;
    container.style.display = 'block';
}

function hideTokenStatus() {
    document.getElementById('tokenStatus').style.display = 'none';
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

// MOSTRAR EXPEDIENTE COMPLETO
function displayExpedienteCompleto(data) {
    const container = document.getElementById('extractedContent');
    
    let html = `
        <div class="search-badge expediente">🔍 Búsqueda: Expediente completo</div>
        
        <h2>📄 Información del Expediente Completo</h2>
        
        <div class="info-summary">
            <div class="summary-card">
                <h3>Vehicle ID</h3>
                <p style="font-size: 14px; word-break: break-all;">${data.data.vehicle_id}</p>
            </div>
            ${data.data.vin ? `
            <div class="summary-card">
                <h3>VIN</h3>
                <p>${data.data.vin}</p>
            </div>
            ` : ''}
            <div class="summary-card">
                <h3>Total Documentos</h3>
                <p>${data.data.total_files}</p>
            </div>
            <div class="summary-card">
                <h3>Facturas</h3>
                <p>${data.data.invoices.length}</p>
            </div>
            <div class="summary-card">
                <h3>Refacturas</h3>
                <p>${data.data.reinvoices ? data.data.reinvoices.length : 0}</p>
            </div>
            <div class="summary-card">
                <h3>Otros Documentos</h3>
                <p>${data.data.other_documents.length}</p>
            </div>
        </div>

        <div class="document-section">
            <h3>📋 Documentos de Transferencia Encontrados</h3>
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
    } else {
        html += '<p class="no-data">No se encontraron facturas ni refacturas.</p>';
    }

    html += '</div>';

    if (data.data.other_documents.length > 0) {
        html += `
            <div class="document-section">
                <h3>📑 Otros Documentos (${data.data.other_documents.length})</h3>
        `;

        data.data.other_documents.forEach((doc, index) => {
            html += `
                <div class="document-card secondary">
                    <h4>${doc.document_type || 'Documento'} ${index + 1}</h4>
                    <p><strong>Tipo:</strong> ${doc.document_type}</p>
                    <p><strong>Fecha:</strong> ${doc.created_at}</p>
                    <details class="json-details">
                        <summary>Ver JSON Completo</summary>
                        <pre>${JSON.stringify(doc, null, 2)}</pre>
                    </details>
                </div>
            `;
        });

        html += '</div>';
    }

    // ==================== FIN DE SECCIÓN ADICIONAL ====================

    html += `
        <details class="json-details json-full" open>
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
        <div class="search-badge documento">🎯 Búsqueda: Documento específico</div>
        
        <h2>📄 Información del Documento Específico</h2>
        
        <div class="document-card featured">
            <h3>Tipo de Documento: ${data.data.document_type}</h3>
            
            <div class="document-info-grid">
                <div class="info-item">
                    <strong>VIN</strong>
                    <p>${data.data.vin}</p>
                </div>
                <div class="info-item">
                    <strong>File ID</strong>
                    <code>${data.data.file_id}</code>
                </div>
                <div class="info-item">
                    <strong>Tipo</strong>
                    <p>${data.data.document_type}</p>
                </div>
                <div class="info-item">
                    <strong>Fecha de Creación</strong>
                    <p>${new Date(data.data.created_at).toLocaleString('es-MX')}</p>
                </div>
            </div>
            
            <div class="document-url">
                <strong>🔗 URL del Documento:</strong><br>
                <a href="${data.data.url}" target="_blank">${data.data.url}</a>
            </div>
    `;

    if (data.data.ocr && Object.keys(data.data.ocr).length > 0) {
        html += `
            <div class="ocr-section">
                <h4>📋 Información Extraída (OCR)</h4>
                <div class="ocr-grid">
        `;

        // Mostrar campos OCR en grid
        Object.keys(data.data.ocr).forEach(key => {
            const value = data.data.ocr[key];
            html += `
                <div class="ocr-item">
                    <strong>${key}</strong>
                    <p>${value}</p>
                </div>
            `;
        });

        html += `
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
        </div>
    `;

    container.innerHTML = html;
    document.getElementById('extractedData').style.display = 'block';
}

function hideExtractedData() {
    document.getElementById('extractedData').style.display = 'none';
}

// MOSTRAR RESULTADOS DEL ANÁLISIS
function displayAnalysisResults(data) {
    const container = document.getElementById('analysisContent');
    
    const statusClass = data.sequenceAnalysis.isComplete ? 'success' : 'warning';
    const statusText = data.sequenceAnalysis.isComplete ? '✓ Secuencia Completa' : '⚠ Huecos Detectados';
    
    let html = `
        <h2>🔍 Resultados del Análisis de Secuencia</h2>
        <span class="status-badge ${statusClass}">${statusText}</span>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>VIN</h3>
                <p>${data.vin || 'N/A'}</p>
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
                <h3>Total Documentos</h3>
                <p>${data.totalDocuments || 0}</p>
            </div>
            <div class="info-card">
                <h3>Huecos Detectados</h3>
                <p>${data.sequenceAnalysis.totalGaps}</p>
            </div>
            <div class="info-card">
                <h3>Retornos</h3>
                <p>${data.sequenceAnalysis.totalRetornos || 0}</p>
            </div>
        </div>
    `;
    
    if (data.originDocument) {
        html += `
            <div class="vehicle-info">
                <h3>📄 Documento de Origen (Vehículo Nuevo)</h3>
                <p><strong>Tipo:</strong> ${
                    data.originDocument.documentType === 'invoice' ? 'Factura' : 
                    data.originDocument.documentType === 'reinvoice' ? 'Refactura' : 
                    'Endoso'
                }</p>
                <p><strong>Fecha:</strong> ${data.originDocument.fecha || 'N/A'}</p>
                <p><strong>Emisor:</strong> ${data.originDocument.nombreEmisor || 'N/A'} (${data.originDocument.rfcEmisor || 'N/A'})</p>
                <p><strong>Receptor:</strong> ${data.originDocument.nombreReceptor || 'N/A'} (${data.originDocument.rfcReceptor || 'N/A'})</p>
            </div>
        `;
    }
    
    // Mostrar retornos si existen
    if (data.sequenceAnalysis.hasRetornos) {
        html += '<div class="retorno-alert"><h3>🔄 Retornos Válidos Detectados</h3>';
        
        data.sequenceAnalysis.retornos.forEach(retorno => {
            html += `
                <div style="margin-top: 15px; padding: 15px; background: #d1ecf1; border-radius: 8px;">
                    <p><strong>${retorno.position}:</strong></p>
                    <p>${retorno.description}</p>
                    <p style="margin-top: 8px; font-size: 14px;">
                        <strong>Propietario anterior:</strong> ${retorno.previousOwner} (${retorno.previousRFC})<br>
                        <strong>Regresa a:</strong> ${retorno.returnedToName} (${retorno.returnedTo})
                        ${retorno.fecha ? `<br><strong>Fecha:</strong> ${retorno.fecha}` : ''}
                    </p>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    // Mostrar huecos si existen
    if (data.sequenceAnalysis.hasGaps) {
        html += '<div class="gap-alert"><h3>⚠️ Análisis de Huecos en la Secuencia</h3>';
        
        data.sequenceAnalysis.gaps.forEach(gap => {
            if (gap.type === 'orphan_documents') {
                html += `
                    <div style="margin-top: 20px; padding: 20px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 10px;">
                        <h4 style="color: #856404; margin-bottom: 15px;">⚠️ ${gap.gapPosition}</h4>
                        <p style="color: #856404; margin-bottom: 15px; line-height: 1.6;">
                            ${gap.description}
                        </p>
                        
                        <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                            <p style="color: #856404; font-weight: 600; margin-bottom: 10px;">
                                📋 <strong>Acción requerida:</strong>
                            </p>
                            <p style="color: #856404; line-height: 1.6;">
                                Para completar la cadena de propiedad, necesitas proporcionar:
                            </p>
                            <ul style="margin: 10px 0 10px 20px; color: #856404;">
                                <li><strong>Endosos</strong> que conecten los documentos faltantes, o</li>
                                <li><strong>Refacturas</strong> que muestren las transferencias intermedias</li>
                            </ul>
                        </div>
                        
                        <details style="margin-top: 15px;">
                            <summary style="cursor: pointer; color: #856404; font-weight: 600;">
                                Ver documentos sin conexión (${gap.orphanDocuments.length})
                            </summary>
                            <ul style="margin-top: 10px; margin-left: 20px;">
                `;
                gap.orphanDocuments.forEach(orphan => {
                    html += `
                        <li style="margin: 10px 0; padding: 10px; background: white; border-radius: 5px;">
                            <strong>[${orphan.type === 'invoice' ? 'Factura' : 'Endoso'}]</strong>
                            ${orphan.nombreEmisor || 'N/A'} (${orphan.rfcEmisor || 'N/A'}) → 
                            ${orphan.nombreReceptor || 'N/A'} (${orphan.rfcReceptor || 'N/A'})
                            ${orphan.fecha ? ` - Fecha: ${orphan.fecha}` : ''}
                        </li>
                    `;
                });
                html += `
                            </ul>
                        </details>
                    </div>
                `;
            } else {
                html += `
                    <div style="margin-top: 20px; padding: 20px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 10px;">
                        <h4 style="color: #856404; margin-bottom: 10px;">⚠️ ${gap.gapPosition}</h4>
                        <p style="color: #856404; margin-bottom: 15px; line-height: 1.6;">
                            ${gap.description}
                        </p>
                        
                        <div style="background: white; padding: 15px; border-radius: 8px;">
                            <p style="color: #856404; font-weight: 600; margin-bottom: 8px;">
                                📋 <strong>Acción requerida:</strong>
                            </p>
                            <p style="color: #856404; line-height: 1.6;">
                                Hacen falta <strong>endosos</strong> o <strong>refacturas</strong> para continuar con la secuencia de propietarios.
                            </p>
                            ${gap.expectedEmisor ? `
                                <p style="color: #856404; font-size: 14px; margin-top: 10px; padding: 10px; background: #fef9e7; border-radius: 5px;">
                                    💡 <strong>Documento faltante:</strong><br>
                                    Se esperaba un documento donde <strong>${gap.expectedNombreEmisor}</strong> (${gap.expectedEmisor}) 
                                    fuera el emisor.
                                </p>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
        });
        
        html += '</div>';
    }
    
    html += '<div class="chain-container"><h2>🔗 Cadena de Propiedad</h2>';
    
    data.ownershipChain.forEach(item => {
        const isOrphan = item.state === 'RUPTURA';
        const isRetorno = item.state === 'RETORNO';
        const isEndoso = item.state === 'ENDOSO';
        
        let chainClass = '';
        let badgeColor = '#667eea';
        
        if (isOrphan) {
            chainClass = 'orphan';
            badgeColor = '#ffc107';
        } else if (isRetorno) {
            chainClass = 'retorno';
            badgeColor = '#17a2b8';
        } else if (isEndoso) {
            chainClass = 'endoso';
            badgeColor = '#6c757d';
        }
        
        html += `
            <div class="chain-item ${chainClass}">
                ${item.position !== null ? `<div class="chain-number" style="background: ${badgeColor};">${item.position}</div>` : '<div class="chain-number" style="background: #ffc107;">?</div>'}
                
                <div class="state-badge" style="background: ${badgeColor}; color: white; display: inline-block; padding: 5px 12px; border-radius: 15px; font-size: 13px; font-weight: 600; margin-bottom: 10px;">
                    ${item.stateLabel}
                </div>
                
                <p style="color: #999; font-size: 13px; margin-bottom: 5px;">
                    <strong>Tipo:</strong> ${
                        item.type === 'invoice' ? '📄 Factura' : 
                        item.type === 'reinvoice' ? '🔄 Refactura' : 
                        '📋 Endoso'
                    }
                </p>
                
                ${item.fecha ? `<p style="color: #999; font-size: 14px; margin-bottom: 10px;">📅 ${item.fecha}</p>` : ''}
                ${item.numeroDocumento ? `<p style="color: #999; font-size: 14px; margin-bottom: 10px;">📋 Doc: ${item.numeroDocumento}</p>` : ''}
                
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
                
                ${item.vehiculo && (item.vehiculo.marca || item.vehiculo.modelo) ? `
                    <div class="vehicle-info" style="margin-top: 15px;">
                        <p><strong>Vehículo:</strong> ${item.vehiculo.marca || ''} ${item.vehiculo.modelo || ''} ${item.vehiculo.ano || ''}</p>
                        ${item.total ? `<p><strong>Monto:</strong> $${item.total}</p>` : ''}
                    </div>
                ` : ''}
                
                ${isRetorno ? '<p style="color: #17a2b8; margin-top: 10px; font-weight: 600;">🔄 Este propietario ya había aparecido anteriormente en la cadena</p>' : ''}
                ${isOrphan ? `
                    <div style="margin-top: 15px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 5px;">
                        <p style="color: #856404; font-weight: 600; margin-bottom: 8px;">⚠️ Documento sin conexión con la secuencia principal</p>
                        <p style="color: #856404; font-size: 14px; line-height: 1.5;">
                            <strong>Acción requerida:</strong> Hacen falta <strong>endosos</strong> o <strong>refacturas</strong> para continuar con la secuencia de propietarios.
                        </p>
                        <p style="color: #856404; font-size: 13px; margin-top: 8px;">
                            💡 El emisor de este documento debería ser el receptor del documento anterior en la cadena.
                        </p>
                    </div>
                ` : ''}
                ${isEndoso ? '<p style="color: #6c757d; margin-top: 10px; font-weight: 600;">📋 Transferencia mediante endoso</p>' : ''}
                ${item.state === 'REFACTURA' ? '<p style="color: #17a2b8; margin-top: 10px; font-weight: 600;">🔄 Transferencia mediante refactura</p>' : ''}
            </div>
        `;
    });
    
    html += '</div>';
    
    html += `
        <div class="metadata">
            <p><strong>Análisis realizado:</strong> ${new Date(data.metadata.analyzedAt).toLocaleString('es-MX')}</p>
            ${data.metadata.createdAt ? `<p><strong>Expediente creado:</strong> ${new Date(data.metadata.createdAt).toLocaleString('es-MX')}</p>` : ''}
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
}

function hideError() {
    document.getElementById('error').style.display = 'none';
}

function showSuccess(message) {
    // Crear elemento de éxito temporal
    const success = document.createElement('div');
    success.className = 'success';
    success.textContent = message;
    success.style.position = 'fixed';
    success.style.top = '20px';
    success.style.right = '20px';
    success.style.zIndex = '1000';
    success.style.maxWidth = '300px';
    document.body.appendChild(success);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        if (success.parentNode) {
            success.parentNode.removeChild(success);
        }
    }, 3000);
}

function hideSuccess() {
    // No hay elemento permanente de éxito que ocultar
}