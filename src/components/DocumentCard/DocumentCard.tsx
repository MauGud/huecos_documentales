import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { VehicleDocument, DocumentGap, DocumentType } from '../../types/documents';
import { DOCUMENT_TYPES } from '../../constants/documentTypes';

interface DocumentCardProps {
  document?: VehicleDocument;
  gap?: DocumentGap;
  variant: 'present' | 'missing' | 'partial';
  onClick?: () => void;
  className?: string;
  showDetails?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  gap,
  variant,
  onClick,
  className = '',
  showDetails = false
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'valid': return 'text-success';
      case 'expired': return 'text-danger';
      case 'pending': return 'text-warning';
      case 'missing': return 'text-danger';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'valid': return '✅';
      case 'expired': return '❌';
      case 'pending': return '⏳';
      case 'missing': return '❌';
      default: return '❓';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'bg-danger text-white';
      case 'high': return 'bg-warning text-white';
      case 'medium': return 'bg-info text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return 'ℹ️';
      case 'low': return '📝';
      default: return '❓';
    }
  };

  // Card para documento presente
  const renderPresentCard = () => {
    if (!document) return null;

    const docType = DOCUMENT_TYPES[document.type];
    const isExpired = document.expiryDate && document.expiryDate < new Date();

    return (
      <motion.div
        className={`document-card document-card-present ${className}`}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{docType.icon}</span>
            <span className="text-sm font-medium text-gray-800">{docType.name}</span>
          </div>
          <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(document.status)}`}>
            {getStatusIcon(document.status)}
          </div>
        </div>

        {/* Thumbnail */}
        {document.thumbnailUrl && (
          <div className="mb-3">
            <img
              src={document.thumbnailUrl}
              alt="Documento"
              className="w-full h-20 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Content */}
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Fecha:</span>
            <span className="font-medium">{formatDate(document.issueDate)}</span>
          </div>
          
          {document.expiryDate && (
            <div className="flex justify-between">
              <span>Vencimiento:</span>
              <span className={`font-medium ${isExpired ? 'text-danger' : ''}`}>
                {formatDate(document.expiryDate)}
              </span>
            </div>
          )}

          {/* Vigencia para tarjetas de circulación */}
          {document.type === 'tarjeta_circulacion' && (
            (() => {
              const fechaVigencia = document.metadata?.fecha_vigencia || document.metadata?.fechaVigencia;
              if (fechaVigencia) {
                const vigenciaDate = typeof fechaVigencia === 'string' ? new Date(fechaVigencia) : fechaVigencia;
                const isVigente = !isNaN(vigenciaDate.getTime()) && vigenciaDate >= new Date();
                return (
                  <div className="flex justify-between">
                    <span>Vigencia:</span>
                    <span className={`font-medium ${isVigente ? 'text-success' : 'text-danger'}`}>
                      {formatDate(vigenciaDate)}
                    </span>
                  </div>
                );
              }
              return null;
            })()
          )}

          <div className="flex justify-between">
            <span>Propietario:</span>
            <span className="font-medium truncate ml-2" title={document.ownerName}>
              {document.ownerName}
            </span>
          </div>

          {document.plateNumber && (
            <div className="flex justify-between">
              <span>Placa:</span>
              <span className="font-medium">{document.plateNumber}</span>
            </div>
          )}

          {document.vin && (
            <div className="flex justify-between">
              <span>VIN:</span>
              <span className="font-medium text-xs">{document.vin.slice(0, 8)}...</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Estado:</span>
            <span className="font-medium">{document.state}</span>
          </div>
        </div>

        {/* Action Button */}
        <motion.button
          className="w-full mt-3 px-3 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/80 transition-colors duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Ver Documento
        </motion.button>

        {/* Hover Details */}
        {isHovered && showDetails && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-lg shadow-xl border border-gray-200 z-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-xs space-y-1">
              <div><strong>Autoridad:</strong> {document.issuerAuthority}</div>
              {document.metadata && Object.keys(document.metadata).length > 0 && (
                <div>
                  <strong>Metadatos:</strong>
                  <pre className="text-xs mt-1 bg-gray-50 p-2 rounded">
                    {JSON.stringify(document.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  // Card para documento faltante
  const renderMissingCard = () => {
    if (!gap) return null;

    const docType = DOCUMENT_TYPES[gap.type];

    return (
      <motion.div
        className={`document-card document-card-missing ${className}`}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{docType.icon}</span>
            <span className="text-sm font-medium text-gray-800">{docType.name}</span>
          </div>
          <div className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(gap.severity)}`}>
            {getSeverityIcon(gap.severity)}
          </div>
        </div>

        {/* Missing Icon */}
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">❌</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 text-xs text-gray-600">
          <div className="text-center">
            <div className="font-medium text-danger mb-1">FALTA DOCUMENTO</div>
            <div className="text-gray-500">{docType.name}</div>
          </div>

          <div className="flex justify-between">
            <span>Período esperado:</span>
            <span className="font-medium">
              {formatDate(gap.expectedDateRange.from)} - {formatDate(gap.expectedDateRange.to)}
            </span>
          </div>

          <div className="bg-yellow-50 p-2 rounded-lg">
            <div className="text-xs font-medium text-yellow-800 mb-1">Razón:</div>
            <div className="text-xs text-yellow-700">{gap.reason}</div>
          </div>

          {gap.estimatedCost && (
            <div className="flex justify-between">
              <span>Costo estimado:</span>
              <span className="font-medium text-danger">{formatCurrency(gap.estimatedCost)}</span>
            </div>
          )}

          {gap.issuingAuthority && (
            <div className="flex justify-between">
              <span>Autoridad:</span>
              <span className="font-medium text-xs">{gap.issuingAuthority}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <motion.button
          className="w-full mt-3 px-3 py-2 bg-danger text-white rounded-lg text-sm font-medium hover:bg-danger/80 transition-colors duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Obtener Documento
        </motion.button>

        {/* Hover Details */}
        {isHovered && showDetails && (
          <motion.div
            className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-lg shadow-xl border border-gray-200 z-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-xs space-y-2">
              <div>
                <strong>Acción sugerida:</strong>
                <div className="mt-1 text-gray-600">{gap.suggestedAction}</div>
              </div>
              
              {gap.requiredDocuments && gap.requiredDocuments.length > 0 && (
                <div>
                  <strong>Documentos requeridos:</strong>
                  <div className="mt-1">
                    {gap.requiredDocuments.map((req, index) => (
                      <span key={index} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs mr-1 mb-1">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {gap.relatedDocuments && gap.relatedDocuments.length > 0 && (
                <div>
                  <strong>Documentos relacionados:</strong>
                  <div className="mt-1 text-gray-600">
                    {gap.relatedDocuments.length} documento(s)
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  // Card para documento parcial
  const renderPartialCard = () => {
    if (!document) return null;

    const docType = DOCUMENT_TYPES[document.type];

    return (
      <motion.div
        className={`document-card document-card-partial ${className}`}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{docType.icon}</span>
            <span className="text-sm font-medium text-gray-800">{docType.name}</span>
          </div>
          <div className="text-xs px-2 py-1 rounded-full bg-warning text-white">
            ⚠️ Parcial
          </div>
        </div>

        {/* Warning Icon */}
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 bg-warning/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2 text-xs text-gray-600">
          <div className="text-center">
            <div className="font-medium text-warning mb-1">INFORMACIÓN INCOMPLETA</div>
            <div className="text-gray-500">Algunos campos faltan</div>
          </div>

          <div className="flex justify-between">
            <span>Fecha:</span>
            <span className="font-medium">{formatDate(document.issueDate)}</span>
          </div>

          <div className="flex justify-between">
            <span>Propietario:</span>
            <span className="font-medium truncate ml-2" title={document.ownerName}>
              {document.ownerName || 'No disponible'}
            </span>
          </div>

          <div className="bg-yellow-50 p-2 rounded-lg">
            <div className="text-xs font-medium text-yellow-800 mb-1">Campos faltantes:</div>
            <div className="text-xs text-yellow-700">
              {!document.plateNumber && 'Placa, '}
              {!document.vin && 'VIN, '}
              {!document.expiryDate && 'Vencimiento'}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <motion.button
          className="w-full mt-3 px-3 py-2 bg-warning text-white rounded-lg text-sm font-medium hover:bg-warning/80 transition-colors duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Re-procesar
        </motion.button>
      </motion.div>
    );
  };

  return (
    <div className="relative">
      {variant === 'present' && renderPresentCard()}
      {variant === 'missing' && renderMissingCard()}
      {variant === 'partial' && renderPartialCard()}
    </div>
  );
};

export default DocumentCard;
