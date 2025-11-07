// Tipos de documentos vehiculares mexicanos
export type DocumentType = 
  | 'factura_origen'      // Primera factura del vehículo
  | 'factura_endosada'    // Factura con endoso de transferencia
  | 'refactura'           // Nueva factura de empresa
  | 'tarjeta_circulacion' // Tarjeta de circulación vigente
  | 'alta_placas'         // Documento de alta de placas
  | 'baja_placas'         // Documento de baja de placas
  | 'tenencia'            // Pago anual de tenencia
  | 'refrendo'            // Pago anual de refrendo
  | 'verificacion'        // Verificación vehicular semestral
  | 'multa'               // Multas de tránsito
  | 'contrato_compraventa'// Contrato de compraventa
  | 'poliza_seguro';      // Póliza de seguro

// Estados de México
export type MexicanState = 
  | 'Aguascalientes' | 'Baja California' | 'Baja California Sur' | 'Campeche'
  | 'Chiapas' | 'Chihuahua' | 'Ciudad de México' | 'Coahuila' | 'Colima'
  | 'Durango' | 'Guanajuato' | 'Guerrero' | 'Hidalgo' | 'Jalisco'
  | 'México' | 'Michoacán' | 'Morelos' | 'Nayarit' | 'Nuevo León'
  | 'Oaxaca' | 'Puebla' | 'Querétaro' | 'Quintana Roo' | 'San Luis Potosí'
  | 'Sinaloa' | 'Sonora' | 'Tabasco' | 'Tamaulipas' | 'Tlaxcala'
  | 'Veracruz' | 'Yucatán' | 'Zacatecas';

// Estado del documento
export type DocumentStatus = 'valid' | 'expired' | 'pending' | 'missing';

// Interfaz principal para documentos vehiculares
export interface VehicleDocument {
  id: string;
  type: DocumentType;
  issueDate: Date;
  expiryDate?: Date;
  issuerAuthority: string;
  ownerName: string;
  plateNumber?: string;
  vin?: string;
  previousPlateNumber?: string;
  state: MexicanState;
  status: DocumentStatus;
  metadata: Record<string, any>;
  rawOCRData?: any; // Respuesta de la API Nexcar
  fileUrl?: string; // URL del archivo subido
  thumbnailUrl?: string; // URL de la miniatura
}

// Interfaz para huecos documentales detectados
export interface DocumentGap {
  id: string;
  type: DocumentType;
  expectedDateRange: { from: Date; to: Date };
  reason: string; // Por qué debería existir este documento
  severity: 'critical' | 'high' | 'medium' | 'low';
  relatedDocuments: string[]; // IDs de documentos relacionados
  suggestedAction: string;
  estimatedCost?: number; // Costo estimado en MXN
  issuingAuthority?: string; // Autoridad que debe emitir el documento
  requiredDocuments?: string[]; // Documentos necesarios para obtener este
}

// Interfaz para problemas de consistencia temporal
export interface TemporalIssue {
  id: string;
  type: 'impossible_date' | 'owner_mismatch' | 'plate_mismatch' | 'state_inconsistency';
  description: string;
  affectedDocuments: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  suggestedFix: string;
}

// Interfaz para resultado de validación de cadena de propiedad
export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  ownershipChain: {
    from: string;
    to: string;
    transferDate: Date;
    documentId: string;
  }[];
  missingTransfers: {
    from: string;
    to: string;
    expectedDate: Date;
    reason: string;
  }[];
}

// Interfaz para resultado del análisis completo
export interface AnalysisResult {
  score: number; // 0-100
  gaps: DocumentGap[];
  completenessPercentage: number;
  criticalIssues: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  temporalIssues: TemporalIssue[];
  ownershipValidation: ValidationResult;
  categoryBreakdown: {
    ownership: { present: number; expected: number; percentage: number };
    fiscal: { present: number; expected: number; percentage: number };
    registration: { present: number; expected: number; percentage: number };
    verification: { present: number; expected: number; percentage: number };
  };
  priorityActions: {
    critical: DocumentGap[];
    high: DocumentGap[];
    medium: DocumentGap[];
    low: DocumentGap[];
  };
}

// Interfaz para configuración de la API
export interface APIConfig {
  baseURL: string;
  credentials: {
    email: string;
    password: string;
  };
}

// Interfaz para respuesta de autenticación
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
}

// Interfaz para respuesta de procesamiento de documento
export interface ProcessedDocument {
  documentType: string;
  userInfo?: {
    name?: string;
    address?: string;
    curp?: string;
    rfc?: string;
  };
  document_validity?: {
    issue_date?: string;
    validity_date?: string;
  };
  vehicleInfo?: {
    vin?: string;
    plate?: string;
    brand?: string;
    model?: string;
    year?: string;
    engine?: string;
    color?: string;
  };
  fiscalInfo?: {
    amount?: number;
    currency?: string;
    concept?: string;
    payment_date?: string;
  };
  rawData: any;
}

// Interfaz para filtros de timeline
export interface TimelineFilters {
  documentTypes: DocumentType[];
  dateRange: { from: Date; to: Date };
  showGaps: boolean;
  showPresent: boolean;
  showMissing: boolean;
}

// Interfaz para configuración de timeline
export interface TimelineConfig {
  startYear: number;
  endYear: number;
  zoomLevel: number; // 1 = año, 0.5 = semestre, 0.25 = trimestre
  showYearMarkers: boolean;
  showMonthMarkers: boolean;
}

// Interfaz para estadísticas de documentos
export interface DocumentStats {
  total: number;
  present: number;
  missing: number;
  partial: number;
  byType: Record<DocumentType, number>;
  byYear: Record<number, number>;
  byState: Record<MexicanState, number>;
}

// Interfaz para configuración de exportación
export interface ExportConfig {
  format: 'pdf' | 'excel' | 'json';
  includeImages: boolean;
  includeRawData: boolean;
  language: 'es' | 'en';
}

// Interfaz para notificaciones del sistema
export interface SystemNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  autoClose?: boolean;
  duration?: number;
}

// Interfaz para historial de procesamiento
export interface ProcessingHistory {
  id: string;
  fileName: string;
  documentType: DocumentType;
  status: 'processing' | 'completed' | 'failed';
  timestamp: Date;
  result?: VehicleDocument;
  error?: string;
}

// Interfaz para configuración de usuario
export interface UserConfig {
  theme: 'light' | 'dark' | 'auto';
  language: 'es' | 'en';
  autoProcess: boolean;
  showTutorials: boolean;
  notifications: {
    email: boolean;
    browser: boolean;
    processing: boolean;
  };
}
