import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VehicleDocument, DocumentGap } from '../../types/documents';

interface DocumentPreviewProps {
  document?: VehicleDocument;
  gap?: DocumentGap;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  gap,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'metadata' | 'actions'>('details');

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const renderDocumentDetails = () => {
    if (!document) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {document.type.replace('_', ' ').toUpperCase()}
            </h2>
            <p className="text-gray-600">
              Emitido el {formatDate(document.issueDate)}
            </p>
          </div>
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              document.status === 'valid' ? 'bg-success text-white' :
              document.status === 'expired' ? 'bg-danger text-white' :
              'bg-warning text-white'
            }`}>
              {document.status === 'valid' ? 'Vigente' :
               document.status === 'expired' ? 'Vencido' : 'Pendiente'}
            </div>
          </div>
        </div>

        {/* Document Image */}
        {document.fileUrl && (
          <div className="bg-gray-100 rounded-lg p-4">
            <img
              src={document.fileUrl}
              alt="Documento"
              className="w-full max-h-96 object-contain rounded-lg"
            />
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Información Básica</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Propietario</label>
                <p className="text-gray-800">{document.ownerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha de Emisión</label>
                <p className="text-gray-800">{formatDate(document.issueDate)}</p>
              </div>
              {document.expiryDate && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Vencimiento</label>
                  <p className="text-gray-800">{formatDate(document.expiryDate)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">Autoridad Emisora</label>
                <p className="text-gray-800">{document.issuerAuthority}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Estado</label>
                <p className="text-gray-800">{document.state}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Información Vehicular</h3>
            <div className="space-y-3">
              {document.plateNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Número de Placa</label>
                  <p className="text-gray-800 font-mono text-lg">{document.plateNumber}</p>
                </div>
              )}
              {document.vin && (
                <div>
                  <label className="text-sm font-medium text-gray-600">VIN</label>
                  <p className="text-gray-800 font-mono text-sm">{document.vin}</p>
                </div>
              )}
              {document.previousPlateNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Placa Anterior</label>
                  <p className="text-gray-800 font-mono">{document.previousPlateNumber}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGapDetails = () => {
    if (!gap) return null;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-danger mb-2">
              DOCUMENTO FALTANTE
            </h2>
            <p className="text-gray-600">
              {gap.type.replace('_', ' ').toUpperCase()}
            </p>
          </div>
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              gap.severity === 'critical' ? 'bg-danger text-white' :
              gap.severity === 'high' ? 'bg-warning text-white' :
              gap.severity === 'medium' ? 'bg-info text-white' :
              'bg-gray-500 text-white'
            }`}>
              {gap.severity === 'critical' ? 'CRÍTICO' :
               gap.severity === 'high' ? 'ALTO' :
               gap.severity === 'medium' ? 'MEDIO' : 'BAJO'}
            </div>
          </div>
        </div>

        {/* Missing Document Icon */}
        <div className="flex justify-center">
          <div className="w-32 h-32 bg-danger/20 rounded-full flex items-center justify-center">
            <span className="text-6xl">❌</span>
          </div>
        </div>

        {/* Gap Information */}
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Razón del Gap</h3>
            <p className="text-red-700">{gap.reason}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Período Esperado</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Desde</label>
                  <p className="text-gray-800">{formatDate(gap.expectedDateRange.from)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Hasta</label>
                  <p className="text-gray-800">{formatDate(gap.expectedDateRange.to)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Información Adicional</h3>
              <div className="space-y-3">
                {gap.estimatedCost && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Costo Estimado</label>
                    <p className="text-gray-800 font-semibold text-lg">{formatCurrency(gap.estimatedCost)}</p>
                  </div>
                )}
                {gap.issuingAuthority && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Autoridad Emisora</label>
                    <p className="text-gray-800">{gap.issuingAuthority}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Acción Sugerida</h3>
            <p className="text-blue-700">{gap.suggestedAction}</p>
          </div>

          {gap.requiredDocuments && gap.requiredDocuments.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Documentos Requeridos</h3>
              <div className="flex flex-wrap gap-2">
                {gap.requiredDocuments.map((req, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm"
                  >
                    {req}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMetadata = () => {
    const data = document || gap;
    if (!data) return null;

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800">Metadatos Técnicos</h3>
        
        {document?.rawOCRData && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-700 mb-2">Datos OCR</h4>
            <pre className="text-xs text-gray-600 overflow-auto max-h-96">
              {JSON.stringify(document.rawOCRData, null, 2)}
            </pre>
          </div>
        )}

        {document?.metadata && Object.keys(document.metadata).length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-md font-medium text-gray-700 mb-2">Metadatos del Documento</h4>
            <pre className="text-xs text-gray-600 overflow-auto max-h-96">
              {JSON.stringify(document.metadata, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-700 mb-2">Información del Sistema</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ID del Documento:</span>
              <span className="font-mono">{data.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tipo:</span>
              <span>{data.type}</span>
            </div>
            {document && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span>{document.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">URL del Archivo:</span>
                  <span className="font-mono text-xs truncate">{document.fileUrl || 'N/A'}</span>
                </div>
              </>
            )}
            {gap && (
              <div className="flex justify-between">
                <span className="text-gray-600">Severidad:</span>
                <span>{gap.severity}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderActions = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800">Acciones Disponibles</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {document && (
            <>
              <button className="p-4 bg-success text-white rounded-lg hover:bg-success/80 transition-colors duration-200">
                <div className="text-lg font-semibold mb-1">Ver Documento Completo</div>
                <div className="text-sm opacity-90">Abrir en nueva ventana</div>
              </button>
              
              <button className="p-4 bg-info text-white rounded-lg hover:bg-info/80 transition-colors duration-200">
                <div className="text-lg font-semibold mb-1">Descargar</div>
                <div className="text-sm opacity-90">Guardar en dispositivo</div>
              </button>
              
              <button className="p-4 bg-warning text-white rounded-lg hover:bg-warning/80 transition-colors duration-200">
                <div className="text-lg font-semibold mb-1">Re-procesar</div>
                <div className="text-sm opacity-90">Ejecutar OCR nuevamente</div>
              </button>
              
              <button className="p-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200">
                <div className="text-lg font-semibold mb-1">Marcar como Error</div>
                <div className="text-sm opacity-90">Reportar problema</div>
              </button>
            </>
          )}

          {gap && (
            <>
              <button className="p-4 bg-danger text-white rounded-lg hover:bg-danger/80 transition-colors duration-200">
                <div className="text-lg font-semibold mb-1">Obtener Documento</div>
                <div className="text-sm opacity-90">Solicitar en autoridad</div>
              </button>
              
              <button className="p-4 bg-info text-white rounded-lg hover:bg-info/80 transition-colors duration-200">
                <div className="text-lg font-semibold mb-1">Ver Requisitos</div>
                <div className="text-sm opacity-90">Documentos necesarios</div>
              </button>
              
              <button className="p-4 bg-warning text-white rounded-lg hover:bg-warning/80 transition-colors duration-200">
                <div className="text-lg font-semibold mb-1">Calcular Costo</div>
                <div className="text-sm opacity-90">Estimación detallada</div>
              </button>
              
              <button className="p-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200">
                <div className="text-lg font-semibold mb-1">Marcar como Resuelto</div>
                <div className="text-sm opacity-90">Cuando se obtenga</div>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h1 className="text-xl font-semibold text-gray-800">
                {document ? 'Detalles del Documento' : 'Documento Faltante'}
              </h1>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {['details', 'metadata', 'actions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                    activeTab === tab
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab === 'details' ? 'Detalles' :
                   tab === 'metadata' ? 'Metadatos' : 'Acciones'}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {activeTab === 'details' && (document ? renderDocumentDetails() : renderGapDetails())}
              {activeTab === 'metadata' && renderMetadata()}
              {activeTab === 'actions' && renderActions()}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DocumentPreview;
