# 📋 CONTEXTO COMPLETO DEL PROYECTO - ANALIZADOR DE SECUENCIA VEHICULAR

> **⚠️ Este archivo se genera automáticamente en cada push a GitHub**
> **Última actualización:** 2025-11-06T23:13:24.810Z
> **No editar manualmente** - Los cambios se sobrescribirán

## 🎯 ALCANCE DEL PROYECTO

Este proyecto es un **Sistema de Análisis de Secuencia de Propiedad Vehicular** que:

1. **Se conecta a la API Nexcar** para obtener expedientes vehiculares completos
2. **Analiza documentos fiscales** (facturas, refacturas, endosos) para construir la cadena de propiedad
3. **Detecta huecos y anomalías** en la secuencia de transferencias de propiedad
4. **Visualiza la cadena completa** de propietarios desde el origen hasta el propietario actual
5. **Identifica retornos válidos** (cuando un RFC recupera un vehículo que ya tuvo)
6. **Maneja múltiples tipos de documentos**: facturas originales, refacturas y endosos

### Objetivo Principal
Validar la integridad de la cadena de propiedad vehicular mediante el análisis de documentos fiscales, detectando:
- ✅ Secuencias completas y válidas
- ⚠️ Huecos en la cadena (documentos faltantes)
- 🔄 Retornos válidos (RFCs que recuperan vehículos)
- 📋 Endosos y refacturas como transferencias válidas
- ❌ Documentos huérfanos (sin conexión con la secuencia principal)

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Estructura de Directorios

```
huecos_v3/
├── src/
│   ├── server.js                 # Servidor Express principal
│   └── api/
│       ├── nexcarClient.js       # Cliente para API Nexcar
│       ├── sequenceAnalyzer.js   # ⭐ MOTOR DE ANÁLISIS (LÓGICA PRINCIPAL)
│       └── routes.js              # Rutas de la API REST
├── public/
│   ├── index.html                 # Interfaz web
│   ├── app_new.js                 # Lógica frontend
│   └── styles.css                 # Estilos CSS
├── scripts/
│   └── generate-context.js        # Script de generación de contexto
├── .github/
│   └── workflows/
│       └── update-context.yml    # GitHub Action
└── package.json
```

### Stack Tecnológico

**Backend:**
- **Node.js** + **Express** (servidor HTTP)
- **Axios** (cliente HTTP para API Nexcar)
- **CORS** (habilitación de CORS)

**Frontend:**
- **HTML5** + **CSS3** (interfaz web)
- **JavaScript Vanilla** (sin frameworks)
- **Fetch API** (comunicación con backend)

**API Externa:**
- **Nexcar API** (`https://nexcar-api-770231222dff.herokuapp.com`)
  - Autenticación: `POST /auth/token`
  - Expedientes: `GET /expediente/{vehicleId}`

---

## 📦 DEPENDENCIAS

```json
{
  "name": "vehicle-sequence-analyzer",
  "version": "1.0.0",
  "description": "Analizador de secuencia de propiedad vehicular con API Nexcar",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "generate-context": "node scripts/generate-context.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## 🔄 FLUJO DE TRABAJO COMPLETO

### 1. Autenticación (PASO 1)
Usuario ingresa email/password → Frontend llama `POST /api/auth` → NexcarClient.authenticate() → API Nexcar retorna JWT → Token almacenado en memoria.

### 2. Obtención de Expediente (PASO 2)
Usuario ingresa URL de Nexcar o Vehicle ID → Frontend llama `POST /api/fetch-expediente` → Sistema extrae Vehicle ID de URL → NexcarClient.getExpediente(vehicleId) → Expediente almacenado en memoria.

### 3. Análisis de Secuencia (PASO 3) ⭐ **LÓGICA PRINCIPAL**
Usuario hace clic en "Analizar Secuencia" → Frontend llama `POST /api/analyze-sequence` → SequenceAnalyzer.analyzeOwnershipSequence() ejecuta el algoritmo completo.

---

## 🧠 LÓGICA DE SECUENCIA DE DATOS EN FACTURAS

### Algoritmo de Análisis (sequenceAnalyzer.js)

El método `analyzeOwnershipSequence(expedienteData)` ejecuta estos pasos:

1. **Filtrado de Documentos**: Solo documentos con `document_type === 'invoice' || 'reinvoice' || 'endorsement'` y OCR válido
2. **Extracción y Validación de VIN**: Valida consistencia de VIN entre todos los documentos
3. **Normalización de Documentos**: Normaliza invoice, reinvoice y endorsement a estructura común
4. **Identificación del Documento de Origen**: Busca documento con `usado_nuevo === 'NUEVO'`
5. **Ordenamiento por Fecha**: Ordena documentos por fecha ascendente
6. **Construcción de Cadena de Propiedad**: Valida continuidad de RFCs (receptor de N debe ser emisor de N+1)
7. **Validación de Retornos**: Identifica cuando un RFC recupera un vehículo que ya tuvo
8. **Detección de Huecos**: Detecta gaps cuando la continuidad de RFCs se rompe

### Estados de Documentos

- `OK`: Transferencia normal y válida
- `ENDOSO`: Transferencia mediante endoso legal
- `REFACTURA`: Refacturación del vehículo
- `RETORNO`: RFC que recupera un vehículo que ya tuvo (válido)
- `RUPTURA`: Documento sin conexión con la secuencia principal (problema)

### ⚠️ ORDEN DE VALIDACIONES CRÍTICO

En `buildOwnershipChainAdvanced()`, el orden DEBE ser:
1. **PRIMERO**: `if (isContinuation)` → Continuación normal
2. **SEGUNDO**: `else if (isPotentialReturn)` → Retorno válido

NO invertir este orden. En intermediación (A→B→A→C), la tercera transferencia debe tratarse como continuación normal, NO retorno.

---

## 📄 CÓDIGO FUENTE PRINCIPAL

### src/server.js
```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./api/routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Frontend disponible en http://localhost:${PORT}`);
  console.log(`🔗 API Nexcar: https://nexcar-api-770231222dff.herokuapp.com`);
});
```

### src/api/routes.js
```javascript
const express = require('express');
const router = express.Router();
const NexcarClient = require('./nexcarClient');
const SequenceAnalyzer = require('./sequenceAnalyzer');

const nexcarClient = new NexcarClient();
const analyzer = new SequenceAnalyzer();

// Almacenamiento temporal del expediente y documento cargados
let currentExpediente = null;
let currentDocument = null;

// Credenciales para autenticación automática
const NEXCAR_EMAIL = 'facturacion@nexcar.mx';
const NEXCAR_PASSWORD = 'M4u2025!!';

/**
 * POST /api/auth
 * PASO 1: Autenticar y obtener token
 */
router.post('/auth', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y password son requeridos'
      });
    }

    const authResult = await nexcarClient.authenticate(email, password);
    
    if (!authResult.success) {
      return res.status(401).json(authResult);
    }

    res.json({
      success: true,
      message: 'Autenticación exitosa',
      tokenInfo: {
        isValid: nexcarClient.isTokenValid(),
        timeRemaining: nexcarClient.getTokenTimeRemaining(),
        expiresAt: new Date(nexcarClient.tokenExpiry).toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/fetch-expediente
 * BÚSQUEDA POR URL DE NEXCAR - Extrae automáticamente el vehicle_id
 */
router.post('/fetch-expediente', async (req, res) => {
  try {
    const { url_or_id } = req.body;

    // Validar que se proporcione algo
    if (!url_or_id) {
      return res.status(400).json({
        success: false,
        error: 'URL o Vehicle ID es requerido'
      });
    }

    // Extraer vehicle_id de la URL o usar directamente si es un UUID
    let vehicleId = null;
    const input = url_or_id.trim();

    // Patrón 1: URL completa de Nexcar
    // Ejemplo: https://app.nexcar.mx/workspace-analysis/a8d858eb-70e6-4aba-b940-1473211c2380/#!
    const urlPattern = /workspace-analysis\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
    const urlMatch = input.match(urlPattern);
    
    if (urlMatch) {
      vehicleId = urlMatch[1];
      console.log(`✅ Vehicle ID extraído de URL: ${vehicleId}`);
    } 
    // Patrón 2: UUID directo (por si el usuario solo pega el ID)
    else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input)) {
      vehicleId = input;
      console.log(`✅ Vehicle ID directo: ${vehicleId}`);
    }
    // No se pudo extraer
    else {
      return res.status(400).json({
        success: false,
        error: 'No se pudo extraer el Vehicle ID. Formatos válidos:\n' +
               '1. URL completa: https://app.nexcar.mx/workspace-analysis/{vehicle_id}/#!\n' +
               '2. Vehicle ID directo: a8d858eb-70e6-4aba-b940-1473211c2380'
      });
    }

    // Autenticar si es necesario
    if (!nexcarClient.isTokenValid()) {
      const authResult = await nexcarClient.authenticate(NEXCAR_EMAIL, NEXCAR_PASSWORD);
      
      if (!authResult.success) {
        return res.status(401).json(authResult);
      }
    }

    // Obtener expediente usando el vehicle_id
    console.log(`📡 Obteniendo expediente para vehicle_id: ${vehicleId}`);
    const expedienteResult = await nexcarClient.getExpediente(vehicleId);
    
    if (!expedienteResult.success) {
      return res.status(404).json(expedienteResult);
    }

    // Guardar expediente completo
    currentExpediente = expedienteResult.data;
    currentDocument = null; // Limpiar documento específico

    console.log(`✅ Expediente obtenido: ${expedienteResult.data.files.length} archivos`);

    // Extraer VIN del expediente (si está disponible en los archivos)
    let extractedVIN = null;
    for (const file of expedienteResult.data.files) {
      if (file.ocr && (file.ocr.vin || file.ocr.niv_vin_numero_serie)) {
        extractedVIN = file.ocr.vin || file.ocr.niv_vin_numero_serie;
        break;
      }
    }

    const extractedInfo = {
      searchType: 'expediente_completo',
      vehicle_id: vehicleId,
      vin: extractedVIN,
      active_vehicle: expedienteResult.data.active_vehicle,
      created_at: expedienteResult.data.created_at,
      total_files: expedienteResult.data.files.length,
      invoices: expedienteResult.data.files
        .filter(f => f.document_type === 'invoice')
        .map(f => ({
          file_id: f.file_id,
          document_type: f.document_type,
          created_at: f.created_at,
          url: f.url,
          ocr: f.ocr
        })),
      reinvoices: expedienteResult.data.files
        .filter(f => f.document_type === 'reinvoice')
        .map(f => ({
          file_id: f.file_id,
          document_type: f.document_type,
          created_at: f.created_at,
          url: f.url,
          ocr: f.ocr
        })),
      other_documents: expedient...
```

### src/api/nexcarClient.js
```javascript
const axios = require('axios');

class NexcarClient {
  constructor() {
    this.baseURL = 'https://nexcar-api-770231222dff.herokuapp.com';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Autenticación con API Nexcar
   * POST /auth/token
   */
  async authenticate(email, password) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/token`, {
        email: email,
        password: password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': ''
        }
      });

      if (response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
        
        return {
          success: true,
          data: response.data,
          message: 'Autenticación exitosa'
        };
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Verifica si el token actual es válido
   * Considera token válido si faltan más de 5 minutos para expirar
   */
  isTokenValid() {
    if (!this.accessToken || !this.tokenExpiry) return false;
    return Date.now() < (this.tokenExpiry - 300000); // 5 minutos de margen
  }

  /**
   * Obtiene el tiempo restante del token en segundos
   */
  getTokenTimeRemaining() {
    if (!this.tokenExpiry) return 0;
    return Math.max(0, Math.floor((this.tokenExpiry - Date.now()) / 1000));
  }

  /**
   * Obtener expediente completo por Vehicle ID
   * GET /expediente/{vehicleId}
   */
  async getExpediente(vehicleId) {
    try {
      if (!this.isTokenValid()) {
        throw new Error('Token inválido o expirado. Re-autentique primero.');
      }

      const response = await axios.get(`${this.baseURL}/expediente/${vehicleId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Manejo de errores según documentación Nexcar
   */
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Entrada inválida proporcionada',
              details: data
            }
          };
        
        case 401:
          return {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Token inválido, expirado o faltante',
              details: data
            }
          };
        
        case 404:
          return {
            success: false,
            error: {
              code: 'RESOURCE_NOT_FOUND',
              message: 'El documento no fue encontrado',
              details: data
            }
          };
        
        case 500:
          return {
            success: false,
            error: {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Error interno del servidor Nexcar',
              details: data
            }
          };
        
        default:
          return {
            success: false,
            error: {
              code: 'UNKNOWN_ERROR',
              message: `Error HTTP ${status}`,
              details: data
            }
          };
      }
    }
    
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message
      }
    };
  }
}

module.exports = NexcarClient;
```

### src/api/sequenceAnalyzer.js (LÓGICA PRINCIPAL)
```javascript
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
   * La validación de...
```

### public/app_new.js (Frontend)
```javascript
// ============================================================================
// ANALIZADOR DE SECUENCIA DE PROPIEDAD VEHICULAR - FRONTEND
// ============================================================================

const API_URL = 'http://localhost:3000/api';

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
            method: 'POST'
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
    showLoading('Analizando secuencia de propiedad...');
    hideError();
    document.getEleme...
```

---

## 🔌 API ENDPOINTS

**Base URL:** `http://localhost:3000/api`

- `POST /api/auth` - Autenticación con API Nexcar
- `POST /api/fetch-expediente` - Obtiene expediente completo
- `POST /api/analyze-sequence` - Analiza secuencia de propiedad
- `GET /api/token-status` - Estado del token
- `DELETE /api/clear-token` - Limpia token
- `DELETE /api/clear` - Limpia expediente
- `GET /api/health` - Health check

---

## 🧪 CASOS DE USO

### Caso 1: Secuencia Completa Sin Huecos
A→B→C→D (todas con state: 'OK' o 'REFACTURA')

### Caso 2: Secuencia con Retorno
A→B→C→D→B (última con state: 'RETORNO')

### Caso 3: Secuencia con Hueco
A→B [OK], D→E [RUPTURA] - Falta documento donde B transfiere a D

### Caso 4: Secuencia con Endoso
A→B→C→D (posición 3 con state: 'ENDOSO')

### Caso 5: Intermediación (Edge Case)
A→B→A→C (correctamente identificado como continuación, NO retorno)

---

## ⚠️ EDGE CASES

1. **Intermediación**: Agencia A → Persona A → Agencia A → Persona B
   - Solución: Validar primero `isContinuation` antes de `isPotentialReturn`

2. **Documentos Sin Fecha**: Se ordenan al final, se conectan por RFCs únicamente

3. **Múltiples Facturas de Origen**: Solo se usa la primera con `usado_nuevo: "NUEVO"`

4. **VIN Inconsistente**: Si hay VINs diferentes → ERROR, se detiene el análisis

5. **Documentos Sin OCR**: Se filtran en el paso 1, no se procesan

---

## 🔧 CONFIGURACIÓN

**Puerto:** 3000 (configurable con `process.env.PORT`)
**API Nexcar:** `https://nexcar-api-770231222dff.herokuapp.com`
**Credenciales:** `facturacion@nexcar.mx` / `M4u2025!!` (hardcodeadas en routes.js)

---

## 📚 DOCUMENTACIÓN ADICIONAL

Ver `README.md` para instrucciones de instalación y uso.

---

**Generado automáticamente el:** 2025-11-06T23:13:24.812Z
**Versión del proyecto:** 1.0.0






