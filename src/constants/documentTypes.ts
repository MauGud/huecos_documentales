import { DocumentType, MexicanState } from '../types/documents';

// Configuración de tipos de documentos
export const DOCUMENT_TYPES: Record<DocumentType, {
  name: string;
  description: string;
  icon: string;
  color: string;
  required: boolean;
  frequency: 'one_time' | 'annual' | 'semiannual' | 'as_needed';
  validityPeriod: number; // en días
}> = {
  factura_origen: {
    name: 'Factura de Origen',
    description: 'Primera factura del vehículo emitida por el concesionario',
    icon: '📄',
    color: 'blue',
    required: true,
    frequency: 'one_time',
    validityPeriod: 0
  },
  factura_endosada: {
    name: 'Factura Endosada',
    description: 'Factura con endoso de transferencia de propiedad',
    icon: '📋',
    color: 'purple',
    required: true,
    frequency: 'as_needed',
    validityPeriod: 0
  },
  refactura: {
    name: 'Refactura',
    description: 'Nueva factura emitida por empresa especializada',
    icon: '📊',
    color: 'indigo',
    required: false,
    frequency: 'as_needed',
    validityPeriod: 0
  },
  tarjeta_circulacion: {
    name: 'Tarjeta de Circulación',
    description: 'Documento oficial de registro vehicular',
    icon: '🆔',
    color: 'green',
    required: true,
    frequency: 'as_needed',
    validityPeriod: 365
  },
  alta_placas: {
    name: 'Alta de Placas',
    description: 'Documento de registro de nuevas placas',
    icon: '🔢',
    color: 'teal',
    required: true,
    frequency: 'as_needed',
    validityPeriod: 0
  },
  baja_placas: {
    name: 'Baja de Placas',
    description: 'Documento de cancelación de placas anteriores',
    icon: '❌',
    color: 'red',
    required: true,
    frequency: 'as_needed',
    validityPeriod: 0
  },
  tenencia: {
    name: 'Tenencia',
    description: 'Pago anual del impuesto vehicular',
    icon: '💰',
    color: 'yellow',
    required: true,
    frequency: 'annual',
    validityPeriod: 365
  },
  refrendo: {
    name: 'Refrendo',
    description: 'Pago anual de refrendo vehicular',
    icon: '💳',
    color: 'orange',
    required: true,
    frequency: 'annual',
    validityPeriod: 365
  },
  verificacion: {
    name: 'Verificación Vehicular',
    description: 'Verificación ambiental del vehículo',
    icon: '🌱',
    color: 'emerald',
    required: true,
    frequency: 'semiannual',
    validityPeriod: 180
  },
  multa: {
    name: 'Multa de Tránsito',
    description: 'Infracciones de tránsito y sus pagos',
    icon: '🚨',
    color: 'red',
    required: false,
    frequency: 'as_needed',
    validityPeriod: 0
  },
  contrato_compraventa: {
    name: 'Contrato de Compraventa',
    description: 'Contrato privado de compraventa del vehículo',
    icon: '📝',
    color: 'gray',
    required: false,
    frequency: 'as_needed',
    validityPeriod: 0
  },
  poliza_seguro: {
    name: 'Póliza de Seguro',
    description: 'Seguro vehicular vigente',
    icon: '🛡️',
    color: 'blue',
    required: false,
    frequency: 'annual',
    validityPeriod: 365
  }
};

// Estados de México con sus códigos y características
export const MEXICAN_STATES: Record<MexicanState, {
  code: string;
  name: string;
  capital: string;
  hasTenencia: boolean;
  hasRefrendo: boolean;
  verificationFrequency: 'annual' | 'semiannual';
  plateFormat: string;
  issuingAuthority: string;
}> = {
  'Aguascalientes': {
    code: 'AGU',
    name: 'Aguascalientes',
    capital: 'Aguascalientes',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Finanzas'
  },
  'Baja California': {
    code: 'BC',
    name: 'Baja California',
    capital: 'Mexicali',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Baja California Sur': {
    code: 'BCS',
    name: 'Baja California Sur',
    capital: 'La Paz',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Campeche': {
    code: 'CAM',
    name: 'Campeche',
    capital: 'San Francisco de Campeche',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Chiapas': {
    code: 'CHP',
    name: 'Chiapas',
    capital: 'Tuxtla Gutiérrez',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Chihuahua': {
    code: 'CHH',
    name: 'Chihuahua',
    capital: 'Chihuahua',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Ciudad de México': {
    code: 'CDMX',
    name: 'Ciudad de México',
    capital: 'Ciudad de México',
    hasTenencia: true,
    hasRefrendo: false,
    verificationFrequency: 'semiannual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Movilidad'
  },
  'Coahuila': {
    code: 'COA',
    name: 'Coahuila',
    capital: 'Saltillo',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Colima': {
    code: 'COL',
    name: 'Colima',
    capital: 'Colima',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Durango': {
    code: 'DUR',
    name: 'Durango',
    capital: 'Victoria de Durango',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Guanajuato': {
    code: 'GUA',
    name: 'Guanajuato',
    capital: 'Guanajuato',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Guerrero': {
    code: 'GRO',
    name: 'Guerrero',
    capital: 'Chilpancingo de los Bravo',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Hidalgo': {
    code: 'HID',
    name: 'Hidalgo',
    capital: 'Pachuca de Soto',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Jalisco': {
    code: 'JAL',
    name: 'Jalisco',
    capital: 'Guadalajara',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'México': {
    code: 'MEX',
    name: 'México',
    capital: 'Toluca de Lerdo',
    hasTenencia: true,
    hasRefrendo: false,
    verificationFrequency: 'semiannual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Finanzas'
  },
  'Michoacán': {
    code: 'MIC',
    name: 'Michoacán',
    capital: 'Morelia',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Morelos': {
    code: 'MOR',
    name: 'Morelos',
    capital: 'Cuernavaca',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Nayarit': {
    code: 'NAY',
    name: 'Nayarit',
    capital: 'Tepic',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Nuevo León': {
    code: 'NL',
    name: 'Nuevo León',
    capital: 'Monterrey',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Oaxaca': {
    code: 'OAX',
    name: 'Oaxaca',
    capital: 'Oaxaca de Juárez',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Puebla': {
    code: 'PUE',
    name: 'Puebla',
    capital: 'Puebla de Zaragoza',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Querétaro': {
    code: 'QUE',
    name: 'Querétaro',
    capital: 'Santiago de Querétaro',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Quintana Roo': {
    code: 'ROO',
    name: 'Quintana Roo',
    capital: 'Chetumal',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'San Luis Potosí': {
    code: 'SLP',
    name: 'San Luis Potosí',
    capital: 'San Luis Potosí',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Sinaloa': {
    code: 'SIN',
    name: 'Sinaloa',
    capital: 'Culiacán',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Sonora': {
    code: 'SON',
    name: 'Sonora',
    capital: 'Hermosillo',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Tabasco': {
    code: 'TAB',
    name: 'Tabasco',
    capital: 'Villahermosa',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Tamaulipas': {
    code: 'TAM',
    name: 'Tamaulipas',
    capital: 'Ciudad Victoria',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Tlaxcala': {
    code: 'TLA',
    name: 'Tlaxcala',
    capital: 'Tlaxcala de Xicohténcatl',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Veracruz': {
    code: 'VER',
    name: 'Veracruz',
    capital: 'Xalapa-Enríquez',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Yucatán': {
    code: 'YUC',
    name: 'Yucatán',
    capital: 'Mérida',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  },
  'Zacatecas': {
    code: 'ZAC',
    name: 'Zacatecas',
    capital: 'Zacatecas',
    hasTenencia: false,
    hasRefrendo: true,
    verificationFrequency: 'annual',
    plateFormat: 'XXX-XXX',
    issuingAuthority: 'Secretaría de Hacienda'
  }
};

// Configuración de validación por tipo de documento
export const VALIDATION_RULES = {
  factura_origen: {
    requiredFields: ['vin', 'ownerName', 'issueDate', 'issuerAuthority'],
    maxAge: 365 * 20, // 20 años
    minAge: 0
  },
  factura_endosada: {
    requiredFields: ['vin', 'ownerName', 'issueDate', 'issuerAuthority'],
    maxAge: 365 * 20,
    minAge: 0
  },
  tarjeta_circulacion: {
    requiredFields: ['vin', 'plateNumber', 'ownerName', 'issueDate', 'state'],
    maxAge: 365 * 2, // 2 años
    minAge: 0
  },
  tenencia: {
    requiredFields: ['plateNumber', 'ownerName', 'issueDate', 'state'],
    maxAge: 365 * 2,
    minAge: 0
  },
  refrendo: {
    requiredFields: ['plateNumber', 'ownerName', 'issueDate', 'state'],
    maxAge: 365 * 2,
    minAge: 0
  },
  verificacion: {
    requiredFields: ['plateNumber', 'issueDate', 'state'],
    maxAge: 365,
    minAge: 0
  }
};

// Mensajes de validación
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'Este campo es obligatorio',
  INVALID_DATE: 'Fecha inválida',
  INVALID_VIN: 'VIN inválido (debe tener 17 caracteres)',
  INVALID_PLATE: 'Formato de placa inválido',
  DOCUMENT_EXPIRED: 'Documento vencido',
  DOCUMENT_TOO_OLD: 'Documento muy antiguo',
  OWNER_MISMATCH: 'El nombre del propietario no coincide',
  PLATE_MISMATCH: 'Las placas no coinciden',
  STATE_MISMATCH: 'El estado no coincide',
  MISSING_DOCUMENT: 'Documento requerido faltante',
  INVALID_DOCUMENT_TYPE: 'Tipo de documento inválido'
};
