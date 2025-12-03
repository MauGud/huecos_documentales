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
  console.log('╔════════════════════════════════════════╗');
  console.log('║  POST /api/analyze-sequence INICIO    ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    const { expedienteData } = req.body;

    // Validación de entrada
    if (!expedienteData) {
      console.error('❌ ERROR: No se recibió expedienteData');
      return res.status(400).json({ 
        error: 'Se requiere expedienteData en el body' 
      });
    }

    if (!expedienteData.files || !Array.isArray(expedienteData.files)) {
      console.error('❌ ERROR: expedienteData.files no es un array');
      return res.status(400).json({ 
        error: 'expedienteData.files debe ser un array' 
      });
    }

    console.log('✓ Datos válidos recibidos');
    console.log('✓ Total de archivos:', expedienteData.files.length);

    // Crear instancia del analizador
    const analyzer = new SequenceAnalyzer();
    console.log('✓ SequenceAnalyzer creado');

    // Ejecutar análisis
    console.log('→ Iniciando analyzeOwnershipSequence...');
    const analysis = analyzer.analyzeOwnershipSequence(expedienteData);
    console.log('✓ analyzeOwnershipSequence completado');

    console.log('╔════════════════════════════════════════╗');
    console.log('║  POST /api/analyze-sequence SUCCESS   ║');
    console.log('╚════════════════════════════════════════╝');

    res.json(analysis);

  } catch (error) {
    console.error('╔════════════════════════════════════════╗');
    console.error('║  POST /api/analyze-sequence ERROR     ║');
    console.error('╚════════════════════════════════════════╝');
    console.error('❌ Error tipo:', error.name);
    console.error('❌ Error mensaje:', error.message);
    console.error('❌ Error stack completo:');
    console.error(error.stack);

    res.status(422).json({ 
      error: error.message,
      stack: error.stack,
      name: error.name
    });
  }
});

/**
 * POST /api/analyze-vehicle
 * Endpoint independiente que recibe vehicle_id o internal_id y devuelve el JSON completo del análisis
 */
router.post('/analyze-vehicle', async (req, res) => {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  POST /api/analyze-vehicle INICIO     ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    const { vehicle_id, internal_id } = req.body;

    // Validar que se proporcione al menos uno de los IDs
    if (!vehicle_id && !internal_id) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_PARAMETER',
        message: 'vehicle_id or internal_id required'
      });
    }

    // Usar vehicle_id si está presente, sino usar internal_id
    const vehicleId = vehicle_id || internal_id;
    console.log(`📋 Vehicle ID recibido: ${vehicleId}`);

    // Autenticar si es necesario
    if (!nexcarClient.isTokenValid()) {
      console.log('🔐 Token inválido, autenticando...');
      const authResult = await nexcarClient.authenticate(NEXCAR_EMAIL, NEXCAR_PASSWORD);
      
      if (!authResult.success) {
        return res.status(401).json({
          success: false,
          error: 'AUTH_ERROR',
          message: 'Error de autenticación con API Nexcar',
          details: authResult.error
        });
      }
      console.log('✅ Autenticación exitosa');
    }

    // Obtener expediente usando el vehicle_id
    console.log(`📡 Obteniendo expediente para vehicle_id: ${vehicleId}`);
    const expedienteResult = await nexcarClient.getExpediente(vehicleId);
    
    if (!expedienteResult.success) {
      // Manejar error 404 específicamente
      if (expedienteResult.error && expedienteResult.error.code === 'RESOURCE_NOT_FOUND') {
        return res.status(404).json({
          success: false,
          error: 'VEHICLE_NOT_FOUND',
          message: `No se encontró expediente para vehicle_id: ${vehicleId}`,
          details: expedienteResult.error
        });
      }
      
      // Otros errores
      return res.status(500).json({
        success: false,
        error: 'EXPEDIENTE_ERROR',
        message: 'Error al obtener expediente',
        details: expedienteResult.error
      });
    }

    const expedienteData = expedienteResult.data;
    console.log(`✅ Expediente obtenido: ${expedienteData.files.length} archivos`);

    // Validar que el expediente tenga archivos
    if (!expedienteData.files || !Array.isArray(expedienteData.files) || expedienteData.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'EMPTY_EXPEDIENTE',
        message: 'El expediente no contiene archivos'
      });
    }

    // Ejecutar análisis usando la lógica existente
    console.log('→ Iniciando analyzeOwnershipSequence...');
    const analysis = analyzer.analyzeOwnershipSequence(expedienteData);
    console.log('✓ analyzeOwnershipSequence completado');

    // Validar que el análisis fue exitoso
    if (!analysis || analysis.success === false) {
      return res.status(422).json({
        success: false,
        error: 'ANALYSIS_ERROR',
        message: analysis?.error || 'Error en el análisis de secuencia',
        details: analysis
      });
    }

    // Agregar vehicle_id al resultado para referencia
    analysis.vehicle_id = vehicleId;

    console.log('╔════════════════════════════════════════╗');
    console.log('║  POST /api/analyze-vehicle SUCCESS    ║');
    console.log('╚════════════════════════════════════════╝');

    // Retornar el JSON completo del análisis (idéntico al que se muestra en el toggle)
    res.json(analysis);

  } catch (error) {
    console.error('╔════════════════════════════════════════╗');
    console.error('║  POST /api/analyze-vehicle ERROR      ║');
    console.error('╚════════════════════════════════════════╝');
    console.error('❌ Error tipo:', error.name);
    console.error('❌ Error mensaje:', error.message);
    console.error('❌ Error stack completo:');
    console.error(error.stack);

    res.status(500).json({
      success: false,
      error: 'ANALYSIS_ERROR',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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