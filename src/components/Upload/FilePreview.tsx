import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DocumentType } from '../../types/documents';
import { storageService } from '../../services/api/storageService';
import { DOCUMENT_TYPES } from '../../constants/documentTypes';

interface FilePreviewProps {
  file: File;
  documentType: DocumentType;
  onRemove: () => void;
  onTypeChange: (newType: DocumentType) => void;
  className?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  file,
  documentType,
  onRemove,
  onTypeChange,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);

  // Generar miniatura si es imagen
  React.useEffect(() => {
    if (storageService.isImage(file) && !thumbnail) {
      setIsGeneratingThumbnail(true);
      storageService.createThumbnail(file, 150)
        .then(setThumbnail)
        .catch(console.error)
        .finally(() => setIsGeneratingThumbnail(false));
    }
  }, [file, thumbnail]);

  const formatFileSize = (bytes: number): string => {
    return storageService.formatFileSize(bytes);
  };

  const getFileIcon = (): string => {
    if (storageService.isPDF(file)) return '📄';
    if (storageService.isImage(file)) return '🖼️';
    return '📁';
  };

  const getFileExtension = (): string => {
    return storageService.getFileExtension(file.name);
  };

  const docTypeConfig = DOCUMENT_TYPES[documentType];

  return (
    <motion.div
      className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start space-x-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          {isGeneratingThumbnail ? (
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="loading-dots">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          ) : thumbnail ? (
            <img
              src={thumbnail}
              alt="Preview"
              className="w-16 h-16 object-cover rounded-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">{getFileIcon()}</span>
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-800 truncate" title={file.name}>
                {file.name}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500 uppercase">{getFileExtension()}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  ▼
                </motion.div>
              </button>
              <button
                onClick={onRemove}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Document Type */}
          <div className="mt-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{docTypeConfig.icon}</span>
              <span className="text-sm font-medium text-gray-700">{docTypeConfig.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {/* File Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Tamaño:</span>
              <span className="ml-2 font-medium">{formatFileSize(file.size)}</span>
            </div>
            <div>
              <span className="text-gray-600">Tipo MIME:</span>
              <span className="ml-2 font-medium">{file.type}</span>
            </div>
            <div>
              <span className="text-gray-600">Última modificación:</span>
              <span className="ml-2 font-medium">
                {new Date(file.lastModified).toLocaleDateString('es-MX')}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Estado:</span>
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                Pendiente
              </span>
            </div>
          </div>

          {/* Document Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento
            </label>
            <select
              value={documentType}
              onChange={(e) => onTypeChange(e.target.value as DocumentType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {Object.entries(DOCUMENT_TYPES).map(([type, config]) => (
                <option key={type} value={type}>
                  {config.icon} {config.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {docTypeConfig.description}
            </p>
          </div>

          {/* File Preview (for images) */}
          {storageService.isImage(file) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vista Previa
              </label>
              <div className="bg-gray-100 rounded-lg p-4">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="max-w-full max-h-48 object-contain mx-auto rounded"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-2">
            <button className="px-3 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/80 transition-colors duration-200">
              Procesar Ahora
            </button>
            <button className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors duration-200">
              Ver Detalles
            </button>
            <button className="px-3 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors duration-200">
              Renombrar
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FilePreview;
