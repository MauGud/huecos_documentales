// Tipos específicos para la API de Nexcar

export interface NexcarAuthRequest {
  email: string;
  password: string;
}

export interface NexcarAuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
  token_type: string;
  scope: string;
}

export interface NexcarProcessRequest {
  url: string;
  type: NexcarDocumentType;
}

export type NexcarDocumentType = 
  | 'id_front'           // INE frente
  | 'id_back'            // INE reverso
  | 'invoice'            // Factura
  | 'circulation_card'   // Tarjeta de circulación
  | 'plate_registration' // Registro de placas
  | 'tax_payment'        // Pago de impuestos
  | 'verification'       // Verificación vehicular
  | 'traffic_fine';      // Multa de tránsito

export interface NexcarProcessResponse {
  success: boolean;
  data?: {
    documentType: string;
    userInfo?: {
      name?: string;
      address?: string;
      curp?: string;
      rfc?: string;
      birthDate?: string;
      gender?: string;
    };
    document_validity?: {
      issue_date?: string;
      validity_date?: string;
      expiry_date?: string;
    };
    vehicleInfo?: {
      vin?: string;
      plate?: string;
      brand?: string;
      model?: string;
      year?: string;
      engine?: string;
      color?: string;
      cylinders?: string;
      fuel_type?: string;
      service_type?: string;
    };
    fiscalInfo?: {
      amount?: number;
      currency?: string;
      concept?: string;
      payment_date?: string;
      tax_year?: string;
      issuing_authority?: string;
    };
    rawText?: string;
    confidence?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface NexcarError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// Configuración de la API
export interface NexcarAPIConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  credentials: {
    email: string;
    password: string;
  };
}

// Estado de autenticación
export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
  user: {
    id: string;
    email: string;
  } | null;
  lastRefresh: Date | null;
}

// Configuración de reintentos
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// Configuración de cache
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live en milisegundos
  maxSize: number; // Máximo número de elementos en cache
}

// Métricas de la API
export interface APIMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime: Date | null;
  errorRate: number;
}

// Configuración de logging
export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableFile: boolean;
  maxFileSize: number;
  maxFiles: number;
}
