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
      other_documents: expedienteResult.data.files
        .filter(f => f.document_type !== 'invoice' && f.document_type !== 'reinvoice')
        .map(f => ({
          file_id: f.file_id,
          document_type: f.document_type,
          created_at: f.created_at,
          url: f.url,
          ocr: f.ocr
        }))
    };

    return res.json({
      success: true,
      message: 'Expediente completo obtenido',
      searchType: 'expediente_completo',
      data: extractedInfo,
      raw_expediente: expedienteResult.data
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
 * POST /api/analyze-sequence
 * PASO 3: Analizar según el tipo de datos cargados
 */
router.post('/analyze-sequence', async (req, res) => {
  try {
    // Verificar si hay documento específico cargado
    if (currentDocument) {
      if (currentDocument.document_type !== 'invoice') {
        return res.status(422).json({
          success: false,
          error: `Este documento es de tipo "${currentDocument.document_type}". Solo se pueden analizar facturas (invoice).`
        });
      }

      console.log('🔍 Analizando documento específico...');
      
      // Crear estructura mínima para el análisis
      const mockExpediente = {
        active_vehicle: true,
        created_at: currentDocument.created_at,
        files: [currentDocument]
      };

      const analysisResult = analyzer.analyzeOwnershipSequence(mockExpediente);

      if (!analysisResult.success) {
        return res.status(422).json(analysisResult);
      }

      console.log(`✅ Análisis de documento específico completado`);

      res.json({
        ...analysisResult,
        analysisType: 'documento_individual'
      });
    }
    // Verificar si hay expediente completo cargado
    else if (currentExpediente) {
      console.log('🔍 Analizando expediente completo...');
      const analysisResult = analyzer.analyzeOwnershipSequence(currentExpediente);

      if (!analysisResult.success) {
        return res.status(422).json(analysisResult);
      }

      console.log(`✅ Análisis de expediente completo completado: ${analysisResult.totalInvoices} facturas, ${analysisResult.sequenceAnalysis.totalGaps} huecos`);

      res.json({
        ...analysisResult,
        analysisType: 'expediente_completo'
      });
    }
    // No hay datos cargados
    else {
      return res.status(400).json({
        success: false,
        error: 'No hay datos cargados. Primero consulta un VIN o VIN+FILE_ID.'
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/clear
 * Limpia tanto expediente como documento cargados
 */
router.delete('/clear', (req, res) => {
  currentExpediente = null;
  currentDocument = null;
  res.json({
    success: true,
    message: 'Datos limpiados'
  });
});

/**
 * DELETE /api/clear-token
 * Limpia el token actual y fuerza nueva autenticación
 */
router.delete('/clear-token', (req, res) => {
  nexcarClient.accessToken = null;
  nexcarClient.tokenExpiry = null;
  console.log('🗑️ Token limpiado - próxima consulta requerirá nueva autenticación');
  res.json({
    success: true,
    message: 'Token limpiado exitosamente'
  });
});

/**
 * GET /api/token-status
 */
router.get('/token-status', (req, res) => {
  res.json({
    success: true,
    isValid: nexcarClient.isTokenValid(),
    timeRemaining: nexcarClient.getTokenTimeRemaining(),
    hasToken: !!nexcarClient.accessToken,
    expiresAt: nexcarClient.tokenExpiry ? new Date(nexcarClient.tokenExpiry).toISOString() : null
  });
});

/**
 * GET /api/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Vehicle Ownership Sequence Analyzer',
    status: 'operational',
    hasExpediente: !!currentExpediente,
    hasDocument: !!currentDocument,
    tokenValid: nexcarClient.isTokenValid(),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;