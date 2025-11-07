import { VehicleDocument } from '../types/documents';

// Datos de ejemplo basados en las imágenes proporcionadas
export const sampleDocuments: VehicleDocument[] = [
  {
    id: 'doc_1',
    type: 'factura_origen',
    issueDate: new Date('2017-03-17'),
    issuerAuthority: 'AUTOTAL SA DE CV',
    ownerName: 'VIVIANA ELIZABETH REVILLA SALAZAR',
    plateNumber: undefined, // No hay placa en la factura
    vin: '3N1CK3CD1HL255099',
    state: 'Nuevo León',
    status: 'valid',
    metadata: {
      marca: 'NISSAN',
      modelo: 'MARCH',
      año: '2017',
      motor: 'HR16769207N',
      color: 'ROYAL BLUE',
      cilindros: '4',
      combustible: 'GASOLINA',
      precio: 181700.00,
      rfc_comprador: 'RESV860219HW2',
      rfc_vendedor: 'AUT821230F26'
    }
  },
  {
    id: 'doc_2',
    type: 'tarjeta_circulacion',
    issueDate: new Date('2022-03-30'),
    expiryDate: new Date('2023-03-30'),
    issuerAuthority: 'GOBIERNO DEL ESTADO DE NUEVO LEÓN',
    ownerName: 'JOCELYN BERENICE CEDILLO MARTINEZ',
    plateNumber: 'SUG2403',
    vin: '3N1CK3CD1HL255099',
    state: 'Nuevo León',
    status: 'expired',
    metadata: {
      marca: 'NISSAN',
      vehiculo: 'MARCH',
      modelo: '2017',
      num_motor: 'HR16769207N',
      cc_cilindrada: '4',
      uso: 'Particular',
      combustible: 'GASOLINA',
      personas: '5',
      servicio: '1',
      vehiculo_origen: 'NACIONAL',
      numero_registro_entidad: '1900765044',
      vigencia: 'CONDICIONADA',
      oficina_expedidora: 'PLAZA ENCINO'
    }
  },
  {
    id: 'doc_3',
    type: 'verificacion',
    issueDate: new Date('2022-06-15'),
    issuerAuthority: 'SECRETARÍA DEL MEDIO AMBIENTE',
    ownerName: 'JOCELYN BERENICE CEDILLO MARTINEZ',
    plateNumber: 'SUG2403',
    state: 'Nuevo León',
    status: 'valid',
    metadata: {
      tipo_verificacion: 'Semestral',
      resultado: 'Aprobado',
      emisiones: 'Dentro de norma'
    }
  },
  {
    id: 'doc_4',
    type: 'tenencia',
    issueDate: new Date('2022-01-15'),
    issuerAuthority: 'SECRETARÍA DE HACIENDA DE NUEVO LEÓN',
    ownerName: 'JOCELYN BERENICE CEDILLO MARTINEZ',
    plateNumber: 'SUG2403',
    state: 'Nuevo León',
    status: 'valid',
    metadata: {
      año: '2022',
      monto: 2500.00,
      concepto: 'Tenencia vehicular'
    }
  }
];

// Datos de ejemplo para simular un expediente con gaps
export const sampleDocumentsWithGaps: VehicleDocument[] = [
  // Factura origen - 2018
  {
    id: 'doc_origin',
    type: 'factura_origen',
    issueDate: new Date('2018-03-15'),
    issuerAuthority: 'NISSAN MÉXICO',
    ownerName: 'Juan Pérez García',
    vin: '3VWLL7AJ9BM053541',
    state: 'Jalisco',
    status: 'valid',
    metadata: {
      marca: 'NISSAN',
      modelo: 'SENTRA',
      año: '2018',
      precio: 250000.00
    }
  },
  // Tarjeta de circulación Jalisco - 2018
  {
    id: 'doc_circ_jal',
    type: 'tarjeta_circulacion',
    issueDate: new Date('2018-03-20'),
    issuerAuthority: 'SECRETARÍA DE HACIENDA DE JALISCO',
    ownerName: 'Juan Pérez García',
    plateNumber: 'JLS-4521',
    vin: '3VWLL7AJ9BM053541',
    state: 'Jalisco',
    status: 'expired',
    metadata: {
      vigencia: '2018-2020'
    }
  },
  // Tenencia Jalisco 2018-2019
  {
    id: 'doc_ten_2018',
    type: 'tenencia',
    issueDate: new Date('2018-01-15'),
    issuerAuthority: 'SECRETARÍA DE HACIENDA DE JALISCO',
    ownerName: 'Juan Pérez García',
    plateNumber: 'JLS-4521',
    state: 'Jalisco',
    status: 'valid',
    metadata: { año: '2018', monto: 3000.00 }
  },
  {
    id: 'doc_ten_2019',
    type: 'tenencia',
    issueDate: new Date('2019-01-15'),
    issuerAuthority: 'SECRETARÍA DE HACIENDA DE JALISCO',
    ownerName: 'Juan Pérez García',
    plateNumber: 'JLS-4521',
    state: 'Jalisco',
    status: 'valid',
    metadata: { año: '2019', monto: 3200.00 }
  },
  // Cambio de propietario - 2020 (sin documentación completa)
  {
    id: 'doc_circ_cdmx',
    type: 'tarjeta_circulacion',
    issueDate: new Date('2020-07-15'),
    issuerAuthority: 'SECRETARÍA DE MOVILIDAD CDMX',
    ownerName: 'María López Hernández',
    plateNumber: 'ABC-123-CD',
    vin: '3VWLL7AJ9BM053541',
    state: 'Ciudad de México',
    status: 'valid',
    metadata: {
      vigencia: '2020-2022'
    }
  },
  // Tenencias CDMX 2021-2024
  {
    id: 'doc_ten_2021',
    type: 'tenencia',
    issueDate: new Date('2021-01-15'),
    issuerAuthority: 'SECRETARÍA DE FINANZAS CDMX',
    ownerName: 'María López Hernández',
    plateNumber: 'ABC-123-CD',
    state: 'Ciudad de México',
    status: 'valid',
    metadata: { año: '2021', monto: 2800.00 }
  },
  {
    id: 'doc_ten_2022',
    type: 'tenencia',
    issueDate: new Date('2022-01-15'),
    issuerAuthority: 'SECRETARÍA DE FINANZAS CDMX',
    ownerName: 'María López Hernández',
    plateNumber: 'ABC-123-CD',
    state: 'Ciudad de México',
    status: 'valid',
    metadata: { año: '2022', monto: 2900.00 }
  },
  {
    id: 'doc_ten_2023',
    type: 'tenencia',
    issueDate: new Date('2023-01-15'),
    issuerAuthority: 'SECRETARÍA DE FINANZAS CDMX',
    ownerName: 'María López Hernández',
    plateNumber: 'ABC-123-CD',
    state: 'Ciudad de México',
    status: 'valid',
    metadata: { año: '2023', monto: 3000.00 }
  },
  {
    id: 'doc_ten_2024',
    type: 'tenencia',
    issueDate: new Date('2024-01-15'),
    issuerAuthority: 'SECRETARÍA DE FINANZAS CDMX',
    ownerName: 'María López Hernández',
    plateNumber: 'ABC-123-CD',
    state: 'Ciudad de México',
    status: 'valid',
    metadata: { año: '2024', monto: 3100.00 }
  },
  // Verificaciones CDMX (faltan algunas)
  {
    id: 'doc_verif_2021_1',
    type: 'verificacion',
    issueDate: new Date('2021-06-15'),
    issuerAuthority: 'SECRETARÍA DEL MEDIO AMBIENTE CDMX',
    ownerName: 'María López Hernández',
    plateNumber: 'ABC-123-CD',
    state: 'Ciudad de México',
    status: 'valid',
    metadata: { semestre: '1', año: '2021' }
  },
  {
    id: 'doc_verif_2022_1',
    type: 'verificacion',
    issueDate: new Date('2022-06-15'),
    issuerAuthority: 'SECRETARÍA DEL MEDIO AMBIENTE CDMX',
    ownerName: 'María López Hernández',
    plateNumber: 'ABC-123-CD',
    state: 'Ciudad de México',
    status: 'valid',
    metadata: { semestre: '1', año: '2022' }
  }
];

export default sampleDocuments;
