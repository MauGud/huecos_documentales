
const API_URL = 'http://localhost:3001/api';

document.getElementById('analysisForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const vin = document.getElementById('vin').value;
    
    const loading = document.getElementById('loading');
    const results = document.getElementById('results');
    const errorMessage = document.getElementById('errorMessage');
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    loading.classList.add('active');
    results.classList.remove('active');
    errorMessage.classList.remove('active');
    analyzeBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, vin })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayResults(data);
        } else {
            showError(data.error || 'Error al analizar la secuencia');
        }
        
    } catch (error) {
        showError('Error de conexión: ' + error.message);
    } finally {
        loading.classList.remove('active');
        analyzeBtn.disabled = false;
    }
});

function displayResults(data) {
    const results = document.getElementById('results');
    
    const statusClass = data.sequenceAnalysis.isComplete ? 'success' : 'warning';
    const statusText = data.sequenceAnalysis.isComplete ? '✓ Secuencia Completa' : '⚠ Huecos Detectados';
    
    let html = `
        <span class="status-badge ${statusClass}">${statusText}</span>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>VIN</h3>
                <p>${data.vin}</p>
            </div>
            <div class="info-card">
                <h3>Facturas Analizadas</h3>
                <p>${data.totalInvoices}</p>
            </div>
            <div class="info-card">
                <h3>Huecos Detectados</h3>
                <p>${data.sequenceAnalysis.totalGaps}</p>
            </div>
            <div class="info-card">
                <h3>Estado del Vehículo</h3>
                <p>${data.metadata.vehicleActive ? 'Activo' : 'Inactivo'}</p>
            </div>
        </div>
    `;
    
    if (data.originInvoice) {
        html += `
            <div class="vehicle-info">
                <h3>📄 Factura de Origen (Vehículo Nuevo)</h3>
                <p><strong>Fecha:</strong> ${data.originInvoice.fecha || 'N/A'}</p>
                <p><strong>Emisor:</strong> ${data.originInvoice.nombreEmisor} (${data.originInvoice.rfcEmisor})</p>
                <p><strong>Receptor:</strong> ${data.originInvoice.nombreReceptor} (${data.originInvoice.rfcReceptor})</p>
            </div>
        `;
    }
    
    if (data.sequenceAnalysis.hasGaps) {
        html += '<div class="gap-alert"><h3>⚠️ Análisis de Huecos en la Secuencia</h3>';
        
        data.sequenceAnalysis.gaps.forEach(gap => {
            if (gap.type === 'orphan_invoices') {
                html += `
                    <div style="margin-top: 15px;">
                        <p><strong>${gap.gapPosition}:</strong> ${gap.description}</p>
                        <ul style="margin-top: 10px; margin-left: 20px;">
                `;
                gap.orphanInvoices.forEach(orphan => {
                    html += `
                        <li>
                            ${orphan.nombreEmisor} (${orphan.rfcEmisor}) → 
                            ${orphan.nombreReceptor} (${orphan.rfcReceptor})
                            ${orphan.fecha ? ` - Fecha: ${orphan.fecha}` : ''}
                        </li>
                    `;
                });
                html += '</ul></div>';
            } else {
                html += `
                    <div style="margin-top: 15px;">
                        <p><strong>${gap.gapPosition}:</strong></p>
                        <p>${gap.description}</p>
                    </div>
                `;
            }
        });
        
        html += '</div>';
    }
    
    html += '<div class="chain-container"><h2>🔗 Cadena de Propiedad</h2>';
    
    data.ownershipChain.forEach(item => {
        const isOrphan = item.type === 'orphan';
        const chainClass = isOrphan ? 'orphan' : '';
        
        html += `
            <div class="chain-item ${chainClass}">
                ${item.position !== null ? `<div class="chain-number">${item.position}</div>` : '<div class="chain-number">?</div>'}
                
                ${item.fecha ? `<p style="color: #999; font-size: 14px; margin-bottom: 10px;">📅 ${item.fecha}</p>` : ''}
                ${item.numeroFactura ? `<p style="color: #999; font-size: 14px; margin-bottom: 10px;">📋 Factura: ${item.numeroFactura}</p>` : ''}
                
                <div class="rfc-flow">
                    <div class="rfc-box">
                        <h4>EMISOR</h4>
                        <p>${item.nombreEmisor || 'N/A'}</p>
                        <small>${item.rfcEmisor || 'N/A'}</small>
                    </div>
                    
                    <div class="arrow">→</div>
                    
                    <div class="rfc-box">
                        <h4>RECEPTOR</h4>
                        <p>${item.nombreReceptor || 'N/A'}</p>
                        <small>${item.rfcReceptor || 'N/A'}</small>
                    </div>
                </div>
                
                ${item.vehiculo ? `
                    <div class="vehicle-info" style="margin-top: 15px;">
                        <p><strong>Vehículo:</strong> ${item.vehiculo.marca || ''} ${item.vehiculo.modelo || ''} ${item.vehiculo.ano || ''}</p>
                        ${item.total ? `<p><strong>Monto:</strong> $${item.total}</p>` : ''}
                    </div>
                ` : ''}
                
                ${isOrphan ? '<p style="color: #856404; margin-top: 10px; font-weight: 600;">⚠️ Factura sin conexión con la secuencia principal</p>' : ''}
            </div>
        `;
    });
    
    html += '</div>';
    
    html += `
        <div class="metadata">
            <p><strong>Análisis realizado:</strong> ${new Date(data.metadata.analyzedAt).toLocaleString('es-MX')}</p>
            <p><strong>Expediente creado:</strong> ${new Date(data.metadata.createdAt).toLocaleString('es-MX')}</p>
        </div>
    `;
    
    results.innerHTML = html;
    results.classList.add('active');
}

function showError(error) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = typeof error === 'string' ? error : JSON.stringify(error, null, 2);
    errorMessage.classList.add('active');
}
