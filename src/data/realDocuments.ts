import { VehicleDocument } from '../types/documents';

// Datos reales extraídos de los documentos proporcionados
export const realDocuments: VehicleDocument[] = [
  // Factura de origen - AUTOTAL SA DE CV
  {
    id: 'factura_001',
    type: 'factura_origen',
    issueDate: new Date('2017-03-17'),
    issuerAuthority: 'AUTOTAL SA DE CV',
    ownerName: 'VIVIANA ELIZABETH REVILLA SALAZAR',
    plateNumber: undefined, // No hay placa en factura de origen
    vin: '3N1CK3CD1HL255099',
    state: 'Nuevo León',
    status: 'valid',
    metadata: {
      rfc: 'RESV860219HW2',
      clientId: '41429',
      invoiceNumber: 'LA16216',
      folioFiscal: 'a8568c22-00f3-4708-afec-8e0ef5892ddc',
      vehicleBrand: 'NISSAN',
      vehicleModel: 'MARCH SENSE T/AUT',
      vehicleYear: 2017,
      color: 'ROYAL BLUE',
      engineNumber: 'HR16769207N',
      basePrice: 156637.93,
      iva: 25062.07,
      total: 181700.00,
      paymentMethod: 'CREDINISSAN',
      sellerRfc: 'AUT821230F26',
      placeOfIssue: 'MONTERREY, NUEVO LEON'
    }
  },
  
  // Tarjeta de circulación - Nuevo León
  {
    id: 'tarjeta_001',
    type: 'tarjeta_circulacion',
    issueDate: new Date('2022-03-30'), // Fecha de expedición
    expiryDate: new Date('2023-12-31'), // Condicionada al pago de refrendo
    issuerAuthority: 'GOBIERNO DEL ESTADO DE NUEVO LEÓN',
    ownerName: 'JOCELYN BERENICE CEDILLO MARTINEZ',
    plateNumber: 'SUG2403',
    vin: '3N1CK3CD1HL255099',
    state: 'Nuevo León',
    status: 'expired', // Condicionada al pago de refrendo
    metadata: {
      marca: 'NISSAN',
      vehiculo: 'MARCH',
      modelo: 2017,
      claseTipo: '1 5',
      servicio: '1',
      numMotor: 'HR16769207N',
      ccCilindrada: '4',
      vehiculoOrigen: 'NACIONAL',
      personas: '5',
      uso: 'Particular',
      combustible: 'GASOLINA',
      numeroRegistro: '1900765044',
      oficinaExpedidora: 'PLAZA ENCINO',
      tramite: '4',
      vigencia: 'CONDICIONADA',
      autoriza: 'LIC. RUBEN ZARAGOZA BUELNA',
      condicionada: 'AL PAGO DE REFRENDO ANUAL'
    }
  }
];

// Documentos faltantes que deberían detectarse como gaps
export const expectedGaps = [
  {
    id: 'gap_001',
    type: 'refrendo',
    reason: 'Tarjeta de circulación condicionada al pago de refrendo anual - No se detectó pago de refrendo para 2023',
    severity: 'critical' as const,
    expectedDateRange: {
      from: new Date('2023-01-01'),
      to: new Date('2023-12-31')
    },
    suggestedAction: 'Pagar refrendo anual 2023 para mantener vigencia de tarjeta de circulación',
    estimatedCost: 800,
    requiredDocuments: ['refrendo']
  },
  {
    id: 'gap_002',
    type: 'factura_endosada',
    reason: 'Cambio de propietario de VIVIANA ELIZABETH REVILLA SALAZAR a JOCELYN BERENICE CEDILLO MARTINEZ sin documento de transferencia',
    severity: 'critical' as const,
    expectedDateRange: {
      from: new Date('2017-03-17'),
      to: new Date('2022-03-30')
    },
    suggestedAction: 'Obtener factura endosada o refactura que documente la transferencia de propiedad',
    estimatedCost: 1200,
    requiredDocuments: ['factura_endosada', 'contrato_compraventa']
  },
  {
    id: 'gap_003',
    type: 'verificacion',
    reason: 'Falta verificación vehicular semestral para 2023',
    severity: 'high' as const,
    expectedDateRange: {
      from: new Date('2023-01-01'),
      to: new Date('2023-12-31')
    },
    suggestedAction: 'Realizar verificación vehicular semestral en centro autorizado',
    estimatedCost: 400,
    requiredDocuments: ['verificacion']
  }
];
