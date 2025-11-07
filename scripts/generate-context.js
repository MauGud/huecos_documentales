#!/usr/bin/env node

/**
 * Script para generar automáticamente el contexto completo del proyecto
 * Se ejecuta en GitHub Actions en cada push
 * Genera un documento completo con TODO el contexto para LLMs
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const OUTPUT_FILE = path.join(PROJECT_ROOT, 'CONTEXTO_COMPLETO_PROYECTO.md');

// Leer archivos del proyecto
function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(PROJECT_ROOT, filePath), 'utf8');
  } catch (error) {
    return `// Error leyendo archivo: ${error.message}`;
  }
}

// Extraer métodos principales de sequenceAnalyzer
function extractMethods(sequenceAnalyzerCode) {
  const methods = {};
  const methodRegex = /(\w+)\([^)]*\)\s*\{/g;
  let match;
  
  while ((match = methodRegex.exec(sequenceAnalyzerCode)) !== null) {
    const methodName = match[1];
    if (methodName !== 'module' && methodName !== 'exports') {
      methods[methodName] = true;
    }
  }
  
  return Object.keys(methods);
}

// Generar el contexto completo
function generateContext() {
  const packageJson = JSON.parse(readFile('package.json'));
  const serverJs = readFile('src/server.js');
  const routesJs = readFile('src/api/routes.js');
  const nexcarClientJs = readFile('src/api/nexcarClient.js');
  const sequenceAnalyzerJs = readFile('src/api/sequenceAnalyzer.js');
  const appNewJs = readFile('public/app_new.js');
  const indexHtml = readFile('public/index.html');
  const readmeMd = readFile('README.md');

  // Extraer información de métodos
  const analyzerMethods = extractMethods(sequenceAnalyzerJs);

  const context = `# 📋 CONTEXTO COMPLETO DEL PROYECTO - ANALIZADOR DE SECUENCIA VEHICULAR

> **⚠️ Este archivo se genera automáticamente en cada push a GitHub**
> **Última actualización:** ${new Date().toISOString()}
> **No editar manualmente** - Los cambios se sobrescribirán

## 🎯 ALCANCE Y OBJETIVO DEL PROYECTO

Este es un sistema Node.js/Express que analiza la cadena de propiedad vehicular mediante documentos fiscales (facturas, refacturas, endosos) obtenidos de la API Nexcar. El objetivo principal es detectar huecos, retornos válidos y anomalías en la secuencia de transferencias de propiedad desde el origen (vehículo nuevo) hasta el propietario actual.

El sistema procesa tres tipos de documentos fiscales:
- **invoice**: Factura original de vehículo nuevo (usado_nuevo: "NUEVO")
- **reinvoice**: Refactura de transferencias posteriores (usado_nuevo: "USADO" por defecto)
- **endorsement**: Endoso legal de transferencia de derechos

La lógica crítica está en \`src/api/sequenceAnalyzer.js\`, específicamente en el método \`analyzeOwnershipSequence()\` que construye la cadena de propiedad validando que el RFC receptor de un documento sea el RFC emisor del siguiente documento en la secuencia.

---

## 🏗️ ARQUITECTURA Y ESTRUCTURA

### Estructura de Archivos

\`\`\`
huecos_v3/
├── src/
│   ├── server.js                 # Servidor Express principal (puerto 3000)
│   └── api/
│       ├── nexcarClient.js       # Cliente para API Nexcar (autenticación JWT, obtención de expedientes)
│       ├── sequenceAnalyzer.js   # ⭐ MOTOR PRINCIPAL - Lógica completa de análisis de secuencia
│       └── routes.js              # Rutas de la API REST
├── public/
│   ├── index.html                # Interfaz web con formularios
│   ├── app_new.js                # Lógica frontend (Fetch API)
│   └── styles.css                # Estilos CSS modernos
├── scripts/
│   └── generate-context.js        # Script de generación de contexto
├── .github/
│   └── workflows/
│       └── update-context.yml    # GitHub Action para actualizar contexto
└── package.json
\`\`\`

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
- **Nexcar API** (\`https://nexcar-api-770231222dff.herokuapp.com\`)
  - Autenticación: \`POST /auth/token\` (retorna JWT token)
  - Expedientes: \`GET /expediente/{vehicleId}\` (obtiene expediente completo)

**Credenciales por defecto:** \`facturacion@nexcar.mx\` / \`M4u2025!!\` (hardcodeadas en routes.js líneas 14-15)

---

## 🔄 FLUJO DE TRABAJO COMPLETO

### PASO 1 - Autenticación:
Usuario ingresa email/password → Frontend llama \`POST /api/auth\` → NexcarClient.authenticate() → API Nexcar retorna JWT → Token almacenado en memoria (nexcarClient.accessToken y nexcarClient.tokenExpiry). El token es válido si faltan más de 5 minutos para expirar (margen de seguridad).

### PASO 2 - Obtención de Expediente:
Usuario ingresa URL de Nexcar (ej: \`https://app.nexcar.mx/workspace-analysis/{vehicle_id}/#!\`) o Vehicle ID directo (UUID) → Frontend llama \`POST /api/fetch-expediente\` → Sistema extrae Vehicle ID de URL usando regex \`/workspace-analysis\\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/\` → Si token inválido, autentica automáticamente → NexcarClient.getExpediente(vehicleId) → API Nexcar retorna expediente completo → Expediente almacenado en memoria (currentExpediente en routes.js) → Respuesta estructurada con invoices, reinvoices, endorsements separados.

### PASO 3 - Análisis de Secuencia (LÓGICA PRINCIPAL):
Usuario hace clic en "Analizar Secuencia" → Frontend llama \`POST /api/analyze-sequence\` → SequenceAnalyzer.analyzeOwnershipSequence(expedienteData) ejecuta el algoritmo completo → Retorna cadena de propiedad, huecos detectados, retornos válidos, documentos huérfanos, y nuevas validaciones (integridad, patrones, temporal, duplicados).

---

## 📊 ESTRUCTURA DE DATOS DE ENTRADA (EXPEDIENTE NEXCAR)

El expediente de Nexcar tiene esta estructura JSON:

\`\`\`javascript
{
  active_vehicle: true/false,
  created_at: "2025-09-26T...",
  files: [
    {
      file_id: "uuid-string",
      document_type: "invoice" | "reinvoice" | "endorsement" | "other",
      created_at: "2025-09-26T...",
      url: "https://...",
      ocr: {
        // Para INVOICE (factura):
        fecha_factura: "25/06/2020" o fecha_hora_emision,
        numero_factura: "12345" o folio_fiscal,
        rfc_emisor: "COA030402N59",
        nombre_emisor: "Car One Americana",
        rfc_receptor: "LFC1106205B4",
        nombre_receptor: "Lumo Financiera Del Centro",
        total: "450000.00",
        usado_nuevo: "NUEVO" | "USADO",
        vin: "3GCPY9EH8LG352317" o niv_vin_numero_serie,
        marca_vehiculo: "CHEVROLET",
        modelo_vehiculo: "SILVERADO DOBLE",
        ano_vehiculo: "2020" o vehiculo_modelo_ano,
        
        // Para REINVOICE (refactura):
        fecha_refactura: "15/08/2021" o fecha_factura o fecha_hora_emision,
        numero_refactura: "67890" o numero_factura o folio_fiscal,
        // Mismos campos rfc_emisor, rfc_receptor, etc.
        // usado_nuevo puede ser "USADO" o null (por defecto se asume "USADO"),
        
        // Para ENDORSEMENT (endoso):
        fecha_endoso: "10/09/2021" o fecha_hora_endoso,
        numero_endoso: "END-001" o folio_endoso,
        rfc_endosante: "RFC-A",  // Equivale a emisor
        nombre_endosante: "Nombre A",
        rfc_endosatario: "RFC-B", // Equivale a receptor
        nombre_endosatario: "Nombre B",
        // NO tiene total ni usado_nuevo
      }
    }
  ]
}
\`\`\`

---

## 🧠 ALGORITMO DE ANÁLISIS DE SECUENCIA (sequenceAnalyzer.js) - LÓGICA DETALLADA

El método \`analyzeOwnershipSequence(expedienteData)\` ejecuta estos pasos:

### PASO 1 - FILTRADO DE DOCUMENTOS RELEVANTES:
Filtra \`files[]\` para obtener solo documentos con \`document_type === 'invoice' || 'reinvoice' || 'endorsement'\` Y que tengan \`ocr\` válido (objeto no null). Ignora documentos sin OCR o de otros tipos.

### PASO 2 - EXTRACCIÓN Y VALIDACIÓN DE VIN:
Extrae VIN de referencia buscando en todos los archivos del expediente: \`ocr.vin\` o \`ocr.niv_vin_numero_serie\`. Luego valida que todos los documentos tengan el mismo VIN. Si hay VINs diferentes, retorna error y detiene el análisis.

### PASO 3 - NORMALIZACIÓN DE DOCUMENTOS:
Cada tipo de documento tiene campos OCR diferentes. Se normalizan a una estructura común usando \`normalizeDocument(doc)\`:

**Para INVOICE:**
- \`fecha\`: \`ocr.fecha_factura || ocr.fecha_hora_emision\`
- \`numeroDocumento\`: \`ocr.numero_factura || ocr.folio_fiscal\`
- \`emisorRFC\`: \`ocr.rfc_emisor\`
- \`receptorRFC\`: \`ocr.rfc_receptor\`
- \`usadoNuevo\`: \`ocr.usado_nuevo\` ("NUEVO" o "USADO")

**Para REINVOICE:**
- \`fecha\`: \`ocr.fecha_refactura || ocr.fecha_factura || ocr.fecha_hora_emision\`
- \`numeroDocumento\`: \`ocr.numero_refactura || ocr.numero_factura || ocr.folio_fiscal\`
- \`usadoNuevo\`: Por defecto 'USADO' si no está presente

**Para ENDORSEMENT:**
- \`fecha\`: \`ocr.fecha_endoso || ocr.fecha_hora_endoso\`
- \`numeroDocumento\`: \`ocr.numero_endoso || ocr.folio_endoso\`
- \`emisorRFC\`: \`ocr.rfc_endosante\` (mapeo especial)
- \`receptorRFC\`: \`ocr.rfc_endosatario\` (mapeo especial)
- \`total\`: null (endosos no tienen monto)
- \`usadoNuevo\`: null (endosos no tienen este campo)

### PASO 4 - IDENTIFICACIÓN DEL DOCUMENTO DE ORIGEN:
Busca el primer documento normalizado donde \`usadoNuevo === 'NUEVO'\` (case insensitive). Este es el documento de origen que representa la primera venta: Concesionaria → Primer Propietario. Si no se encuentra, retorna error. Este documento será la posición 1 en la cadena.

### PASO 5 - ORDENAMIENTO POR FECHA:
Ordena todos los documentos normalizados por fecha ascendente (más antiguo primero). \`parseDate()\` soporta formatos DD/MM/YYYY, YYYY-MM-DD, y cualquier formato parseable por \`new Date()\`. Documentos sin fecha van al final.

### PASO 6 - CONSTRUCCIÓN DE CADENA DE PROPIEDAD (LÓGICA CRÍTICA):
Este es el corazón del algoritmo en \`buildOwnershipChainAdvanced(documents, originDocument)\`:

**Inicialización:**
- \`chain = []\` (array de elementos de la cadena)
- \`rfcHistory = []\` (historial de RFCs que han aparecido)
- \`processedDocs = new Set()\` (documentos ya procesados)
- \`currentReceptorRFC = originDocument.receptorRFC\` (RFC del propietario actual)
- \`position = 2\` (el origen es posición 1)

**Agregar documento de origen:**
\`\`\`javascript
chain.push({
  position: 1,
  state: 'OK',
  stateLabel: '✓ Origen',
  type: originDocument.documentType,
  ...extractChainData(originDocument)
})
rfcHistory.push(originDocument.emisorRFC, originDocument.receptorRFC)
processedDocs.add(originDocument.fileId)
\`\`\`

**Iterar sobre documentos ordenados:**
Para cada documento doc en documents (ordenados por fecha):
- Si ya fue procesado, continuar.
- Calcular variables de estado:
  - \`isContinuation = (doc.emisorRFC === currentReceptorRFC)\` // El emisor es quien posee actualmente → continuación normal
  - \`rfcAppearedBefore = rfcHistory.includes(doc.emisorRFC)\` // El RFC emisor ya apareció antes en la cadena
  - \`isPotentialReturn = rfcAppearedBefore && !isContinuation\` // RFC apareció antes PERO no es el poseedor actual → posible retorno

**CASO 1 - CONTINUACIÓN NORMAL (PRIORIDAD MÁXIMA):**
Si \`isContinuation === true\`:
- Determinar estado según tipo:
  - Si \`documentType === 'endorsement'\`: \`state = 'ENDOSO'\`, \`stateLabel = '📋 Endoso'\`
  - Si \`documentType === 'reinvoice'\`: \`state = 'REFACTURA'\`, \`stateLabel = '🔄 Refactura'\`
  - Si no: \`state = 'OK'\`, \`stateLabel = '✓ OK'\`
- Agregar a cadena y actualizar: \`rfcHistory.push(doc.receptorRFC)\`, \`currentReceptorRFC = doc.receptorRFC\`

**CASO 2 - RETORNO VÁLIDO (solo si NO es continuación):**
Si \`isPotentialReturn === true\`:
- Validar retorno con \`validateReturn(doc, chain, rfcHistory, currentReceptorRFC)\`:
  - El RFC emisor debe estar en rfcHistory (ya apareció antes)
  - **CRÍTICO**: Si \`doc.emisorRFC === currentReceptorRFC\`, NO es retorno (es continuación normal)
  - El VIN debe coincidir con VINs de la cadena
- Si es retorno válido, agregar con \`state = 'RETORNO'\`, \`stateLabel = '🔄 Retorno'\`

**CASO 3 - DOCUMENTOS NO PROCESADOS = RUPTURAS:**
Después de iterar, para cada documento que NO está en processedDocs:
- Agregar con \`position: null\`, \`state = 'RUPTURA'\`, \`stateLabel = '⚠️ Ruptura'\`

**Estados posibles en la cadena:**
- \`'OK'\`: Transferencia normal y válida
- \`'ENDOSO'\`: Transferencia mediante endoso legal
- \`'REFACTURA'\`: Refacturación del vehículo
- \`'RETORNO'\`: RFC que recupera un vehículo que ya tuvo (válido)
- \`'RUPTURA'\`: Documento sin conexión con la secuencia principal (problema)

### PASO 7 - VALIDACIÓN DE RETORNOS (validateReturn):
Un retorno es válido cuando:
1. El RFC emisor apareció anteriormente en rfcHistory
2. **CRÍTICO**: El RFC emisor NO es el poseedor actual (currentReceptorRFC). Si lo es, es continuación normal, NO retorno.
3. El VIN coincide con VINs de la cadena (si hay VINs disponibles)

Ejemplo de retorno válido: A→B→C→B (B recupera el vehículo que ya tuvo)
Ejemplo de NO retorno (intermediación): A→B→A→C (A sigue siendo propietario, transfiere a C - es continuación normal)

### PASO 8 - DETECCIÓN DE HUECOS (detectSequenceGapsAdvanced):
Analiza la cadena construida para detectar gaps:
- Filtrar elementos secuenciales (\`position !== null\`)
- Para cada par consecutivo (current, next):
  - Si \`next.state === 'RETORNO'\`: NO es gap, agregar a retornos[], continuar
  - Si \`next.state === 'ENDOSO'\`: NO es gap, continuar (endosos son válidos)
  - Si \`current.rfcReceptor !== next.rfcEmisor\` Y \`next.state !== 'RUPTURA'\`: **GAP DETECTADO**
- Documentos huérfanos (RUPTURA) también se consideran gaps

### PASO 9 - NUEVAS VALIDACIONES (AGREGADAS RECIENTEMENTE):

**FASE 1: Validaciones de Integridad** (\`validateDocumentIntegrity\`):
- Escenario 21: RFC con formato inválido (validación con regex \`/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/\`)
- Escenario 22: Nombres diferentes para mismo RFC
- Escenario 23: RFC faltante
- Escenario 24: Fechas imposibles (futuras o inválidas)
- Escenario 25: Múltiples documentos marcados como NUEVO
- Escenario 26: Refactura sin factura previa
- Escenario 27: Origen no es el más antiguo

**FASE 2: Detección de Patrones Sospechosos** (\`detectSuspiciousPatterns\`):
- Escenario 39: Ciclos complejos (retorno seguido de continuación)
- Escenario 40: Ping-pong entre dos RFCs (3+ veces: A↔B repetido)
- Escenario 41: RFC aparece 5+ veces (excluyendo agencias)
- Escenario 42: Triangulación rápida (A→B→C→A en < 30 días)
- Escenario 43: Cadenas de endosos consecutivos (4+ endosos seguidos)

**FASE 3: Análisis Temporal** (\`analyzeTemporalAnomalies\`):
- Escenario 28: Fechas contradictorias (fecha(n) > fecha(n+1) + 30 días con RFC correcto)
- Escenario 29: Transferencias mismo día (3+ transferencias en mismo día)
- Escenario 30: Gaps temporales grandes (> 3 años entre docs consecutivos)

**FASE 4: Detección de Duplicados** (\`detectDuplicates\`):
- Escenario 34: Folios fiscales duplicados (mismo folio_fiscal en 2+ documentos)
- Escenario 35: Mismo folio en diferentes tipos (invoice y endorsement)
- Escenario 36: Pares RFC repetidos (mismo par RFC_A→RFC_B aparece 3+ veces)

---

## 📊 ESTRUCTURA DE RESPUESTA DEL ANÁLISIS

\`\`\`javascript
{
  success: true,
  vin: "3GCPY9EH8LG352317",
  totalDocuments: 5,
  totalInvoices: 2,
  totalReinvoices: 2,
  totalEndorsements: 1,
  
  originDocument: {
    fileId: "uuid",
    fecha: "25/06/2020",
    rfcEmisor: "COA030402N59",
    nombreEmisor: "Car One Americana",
    rfcReceptor: "LFC1106205B4",
    nombreReceptor: "Lumo Financiera Del Centro",
    documentType: "invoice"
  },
  
  ownershipChain: [
    {
      position: 1, // null si es RUPTURA
      state: "OK" | "ENDOSO" | "REFACTURA" | "RETORNO" | "RUPTURA",
      stateLabel: "✓ Origen" | "📋 Endoso" | "🔄 Refactura" | "🔄 Retorno" | "⚠️ Ruptura",
      type: "invoice" | "reinvoice" | "endorsement",
      fileId: "uuid",
      fecha: "25/06/2020",
      numeroDocumento: "12345",
      rfcEmisor: "COA030402N59",
      nombreEmisor: "Car One Americana",
      rfcReceptor: "LFC1106205B4",
      nombreReceptor: "Lumo Financiera Del Centro",
      total: "450000.00" | null,
      usadoNuevo: "NUEVO" | "USADO" | null,
      vin: "3GCPY9EH8LG352317",
      vehiculo: { marca, modelo, ano }
    }
  ],
  
  sequenceAnalysis: {
    hasGaps: false,
    hasRetornos: true,
    totalGaps: 0,
    totalRetornos: 1,
    gaps: [...],
    retornos: [...],
    isComplete: true
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NUEVAS SECCIONES (AGREGADAS RECIENTEMENTE)
  // ═══════════════════════════════════════════════════════════════
  
  integrityAnalysis: {
    isValid: true,
    warnings: [],
    errors: [],
    details: {
      invalidRFCs: [...],
      rfcNameVariations: [...],
      missingRFCs: [...],
      invalidDates: [...],
      multipleOrigins: null,
      orphanReinvoices: [...],
      originNotOldest: null
    }
  },
  
  patternDetection: {
    hasSuspiciousPatterns: false,
    suspiciousCount: 0,
    patterns: {
      pingPong: [...],
      rapidTriangulation: [...],
      endorsementChains: [...],
      frequentRFCs: [...],
      complexCycles: [...]
    }
  },
  
  temporalAnalysis: {
    hasTemporalAnomalies: false,
    anomalyCount: 0,
    anomalies: {
      contradictions: [...],
      sameDayTransfers: [...],
      largeGaps: [...]
    }
  },
  
  duplicateDetection: {
    hasDuplicates: false,
    duplicateCount: 0,
    duplicates: {
      folios: [...],
      crossTypeFolios: [...],
      rfcPairs: [...]
    }
  },
  
  metadata: {
    analyzedAt: "2025-01-15T10:30:00.000Z",
    vehicleActive: true,
    createdAt: "2025-09-26T..."
  }
}
\`\`\`

---

## ⚠️ NOTAS CRÍTICAS SOBRE LA LÓGICA

### ORDEN DE VALIDACIONES ES CRÍTICO:
En \`buildOwnershipChainAdvanced()\`, el orden de las validaciones DEBE ser:
1. **PRIMERO**: \`if (isContinuation)\` → Continuación normal
2. **SEGUNDO**: \`else if (isPotentialReturn)\` → Retorno válido

**NO invertir este orden.** Si se invierte, casos de intermediación (A→B→A→C) se marcarían incorrectamente como retornos.

**Razón:** En intermediación, la tercera transferencia (A→C) cumple AMBAS condiciones:
- \`isContinuation = true\` (A es el propietario actual)
- \`isPotentialReturn = true\` (A apareció antes)

Pero debe tratarse como continuación normal, por eso se valida primero \`isContinuation\`.

### RETORNOS vs CONTINUACIONES:
- **Retorno válido**: RFC emisor apareció antes Y NO es el propietario actual. Ejemplo: A→B→C→B
- **Continuación normal**: RFC emisor ES el propietario actual. Ejemplo: A→B→A→C (A sigue siendo propietario)

### ENDOSOS Y REFACTURAS:
- **Endosos**: NO se consideran gaps. Son transferencias válidas mediante endoso legal. Campos diferentes: \`rfc_endosante\` / \`rfc_endosatario\`.
- **Refacturas**: NO se consideran gaps. Son transferencias posteriores a la venta original. Por defecto \`usado_nuevo: "USADO"\`.

---

## 🧪 CASOS DE USO Y EJEMPLOS PRÁCTICOS

### Caso 1: Secuencia Completa Sin Huecos
**Expediente:**
- Factura 1: Concesionaria (RFC-A) → Financiera (RFC-B) [NUEVO]
- Factura 2: Financiera (RFC-B) → Persona (RFC-C) [USADO]
- Refactura 3: Persona (RFC-C) → Agencia (RFC-D) [USADO]

**Resultado:**
- ✅ Secuencia completa (\`isComplete: true\`)
- 0 huecos
- 0 retornos
- Cadena: A→B→C→D (todas con state: 'OK' o 'REFACTURA')

### Caso 2: Secuencia con Retorno Válido
**Expediente:**
- Factura 1: Concesionaria (RFC-A) → Financiera (RFC-B) [NUEVO]
- Factura 2: Financiera (RFC-B) → Persona (RFC-C) [USADO]
- Refactura 3: Persona (RFC-C) → Agencia (RFC-D) [USADO]
- Refactura 4: Agencia (RFC-D) → Financiera (RFC-B) [USADO] ← RETORNO

**Resultado:**
- ✅ Secuencia completa
- 0 huecos (retornos NO son gaps)
- 1 retorno: RFC-B recupera el vehículo de RFC-D
- Cadena: A→B→C→D→B (última con state: 'RETORNO')

### Caso 3: Secuencia con Hueco
**Expediente:**
- Factura 1: Concesionaria (RFC-A) → Financiera (RFC-B) [NUEVO]
- Factura 2: Financiera (RFC-B) → Persona (RFC-C) [USADO]
- Refactura 3: Agencia (RFC-D) → Persona2 (RFC-E) [USADO] ← HUECO (falta documento donde RFC-C transfiere a RFC-D)

**Resultado:**
- ⚠️ Secuencia incompleta (\`isComplete: false\`)
- 1 hueco: Entre posición 2 y 3
- 1 documento huérfano: Refactura 3 (state: 'RUPTURA', position: null)
- Cadena: A→B [OK], D→E [RUPTURA]

### Caso 4: Secuencia con Endoso
**Expediente:**
- Factura 1: Concesionaria (RFC-A) → Financiera (RFC-B) [NUEVO]
- Factura 2: Financiera (RFC-B) → Persona (RFC-C) [USADO]
- Endoso 3: Persona (RFC-C) → Persona2 (RFC-D) [ENDOSO]

**Resultado:**
- ✅ Secuencia completa
- 0 huecos (endosos NO son gaps, son transferencias válidas)
- Cadena: A→B→C→D (posición 3 con state: 'ENDOSO')

### Caso 5: Intermediación (Edge Case Crítico)
**Expediente:**
- Factura 1: Concesionaria (RFC-A) → Financiera (RFC-B) [NUEVO]
- Factura 2: Financiera (RFC-B) → Agencia (RFC-A) [USADO] ← Agencia compra
- Refactura 3: Agencia (RFC-A) → Persona (RFC-C) [USADO] ← Agencia vende

**Problema potencial:** La refactura 3 (A→C) podría confundirse con retorno porque RFC-A ya apareció antes.

**Solución:** El algoritmo valida PRIMERO \`isContinuation\` (A === currentReceptorRFC). Como A es el propietario actual, es continuación normal, NO retorno.

**Resultado:**
- ✅ Secuencia completa
- 0 huecos
- 0 retornos (correctamente identificado como continuación)
- Cadena: A→B→A→C (todas con state: 'OK' o 'REFACTURA')

---

## 🔌 API ENDPOINTS

**Base URL:** \`http://localhost:3000/api\`

### POST /api/auth
Autenticación con API Nexcar.
**Request:** \`{ email: string, password: string }\`
**Response:** \`{ success: boolean, message: string, tokenInfo: { isValid, timeRemaining, expiresAt } }\`

### POST /api/fetch-expediente
Obtiene expediente completo por Vehicle ID o URL.
**Request:** \`{ url_or_id: string }\` (URL de Nexcar o Vehicle ID directo)
**Response:** \`{ success: boolean, searchType: "expediente_completo", data: { vehicle_id, vin, total_files, invoices[], reinvoices[], other_documents[] }, raw_expediente: {} }\`

### POST /api/analyze-sequence
Analiza la secuencia de propiedad del expediente cargado.
**Request:** \`{}\` (No requiere parámetros, usa currentExpediente en memoria)
**Response:** Estructura completa de análisis (ver arriba)

### GET /api/token-status
Estado del token actual.
**Response:** \`{ success: boolean, isValid: boolean, timeRemaining: number, hasToken: boolean, expiresAt: string }\`

### DELETE /api/clear-token
Limpia token y fuerza nueva autenticación.
**Response:** \`{ success: boolean, message: string }\`

### DELETE /api/clear
Limpia currentExpediente y currentDocument.
**Response:** \`{ success: boolean, message: string }\`

### GET /api/health
Health check del servicio.
**Response:** \`{ success: boolean, service: string, status: string, hasExpediente: boolean, hasDocument: boolean, tokenValid: boolean, timestamp: string }\`

---

## 📝 MÉTODOS PRINCIPALES DE SequenceAnalyzer

Los métodos principales implementados son:

${analyzerMethods.map(m => \`- \`\${m}()\`\`).join('\\n')}

---

## ⚠️ EDGE CASES Y MANEJO DE ERRORES

1. **Intermediación**: Agencia A → Persona A → Agencia A → Persona B
   - Solución: Validar primero \`isContinuation\` antes de \`isPotentialReturn\`

2. **Documentos Sin Fecha**: Se ordenan al final, se conectan por RFCs únicamente

3. **Múltiples Facturas de Origen**: Solo se usa la primera con \`usado_nuevo: "NUEVO"\`

4. **VIN Inconsistente**: Si hay VINs diferentes → ERROR, se detiene el análisis

5. **Documentos Sin OCR**: Se filtran en el paso 1, no se procesan

6. **Token Expirado**: Se valida automáticamente antes de cada request a API Nexcar. Si expiró, se autentica automáticamente con credenciales por defecto.

---

## 🔧 CONFIGURACIÓN

**Puerto:** 3000 (configurable con \`process.env.PORT\`)
**API Nexcar:** \`https://nexcar-api-770231222dff.herokuapp.com\` (hardcodeada en nexcarClient.js)
**Credenciales:** \`facturacion@nexcar.mx\` / \`M4u2025!!\` (hardcodeadas en routes.js líneas 14-15)

**Dependencias:**
\`\`\`json
${JSON.stringify(packageJson, null, 2)}
\`\`\`

---

## 📄 CÓDIGO FUENTE PRINCIPAL

### src/server.js
\`\`\`javascript
${serverJs}
\`\`\`

### src/api/routes.js (Fragmento - Endpoints principales)
\`\`\`javascript
${routesJs.substring(0, 3000)}...
\`\`\`

### src/api/nexcarClient.js
\`\`\`javascript
${nexcarClientJs}
\`\`\`

### src/api/sequenceAnalyzer.js (Fragmento - Métodos principales)
\`\`\`javascript
${sequenceAnalyzerJs.substring(0, 8000)}...
\`\`\`

### public/app_new.js (Fragmento - Frontend)
\`\`\`javascript
${appNewJs.substring(0, 3000)}...
\`\`\`

---

**Generado automáticamente el:** ${new Date().toISOString()}
**Versión del proyecto:** ${packageJson.version}
**Total de métodos en SequenceAnalyzer:** ${analyzerMethods.length}
`;

  return context;
}

// Escribir el archivo
try {
  const context = generateContext();
  fs.writeFileSync(OUTPUT_FILE, context, 'utf8');
  console.log('✅ Contexto generado exitosamente en:', OUTPUT_FILE);
  process.exit(0);
} catch (error) {
  console.error('❌ Error generando contexto:', error.message);
  process.exit(1);
}
