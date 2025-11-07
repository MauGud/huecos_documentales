import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessingHistory } from '../../types/documents';
import { DOCUMENT_TYPES } from '../../constants/documentTypes';

interface ProcessingQueueProps {
  history: ProcessingHistory[];
  onClear: () => void;
  onRetry: (item: ProcessingHistory) => void;
  className?: string;
}

export const ProcessingQueue: React.FC<ProcessingQueueProps> = ({
  history,
  onClear,
  onRetry,
  className = ''
}) => {
  const [filter, setFilter] = useState<'all' | 'processing' | 'completed' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'timestamp' | 'status' | 'fileName'>('timestamp');

  // Filtrar historial
  const filteredHistory = history
    .filter(item => filter === 'all' || item.status === filter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return b.timestamp.getTime() - a.timestamp.getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'fileName':
          return a.fileName.localeCompare(b.fileName);
        default:
          return 0;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return '⏳';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'processing': return 'Procesando';
      case 'completed': return 'Completado';
      case 'failed': return 'Fallido';
      default: return 'Desconocido';
    }
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'ahora';
  };

  const renderHistoryItem = (item: ProcessingHistory, index: number) => {
    const docTypeConfig = DOCUMENT_TYPES[item.documentType];

    return (
      <motion.div
        key={item.id}
        className="bg-white rounded-lg border border-gray-200 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-start space-x-4">
          {/* Status Icon */}
          <div className="flex-shrink-0">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
              item.status === 'processing' ? 'bg-blue-100' :
              item.status === 'completed' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {getStatusIcon(item.status)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-800 truncate" title={item.fileName}>
                  {item.fileName}
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-lg">{docTypeConfig.icon}</span>
                  <span className="text-sm text-gray-600">{docTypeConfig.name}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{formatTime(item.timestamp)}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {getStatusLabel(item.status)}
                </span>
                
                {item.status === 'failed' && (
                  <button
                    onClick={() => onRetry(item)}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors duration-200"
                  >
                    Reintentar
                  </button>
                )}
              </div>
            </div>

            {/* Error Message */}
            {item.status === 'failed' && item.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>Error:</strong> {item.error}
              </div>
            )}

            {/* Success Message */}
            {item.status === 'completed' && item.result && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                <strong>Procesado exitosamente:</strong> {item.result.ownerName} - {item.result.plateNumber || 'Sin placa'}
              </div>
            )}

            {/* Processing Animation */}
            {item.status === 'processing' && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="loading-dots">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                  <span className="text-sm text-gray-600">Procesando con OCR...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <motion.div
      className={`glass-card p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Historial de Procesamiento</h3>
          <p className="text-sm text-gray-600">{history.length} archivo{history.length !== 1 ? 's' : ''} procesado{history.length !== 1 ? 's' : ''}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onClear}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors duration-200"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Filtrar:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">Todos</option>
            <option value="processing">Procesando</option>
            <option value="completed">Completados</option>
            <option value="failed">Fallidos</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="timestamp">Fecha</option>
            <option value="status">Estado</option>
            <option value="fileName">Nombre</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {history.filter(h => h.status === 'processing').length}
          </div>
          <div className="text-xs text-gray-600">Procesando</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {history.filter(h => h.status === 'completed').length}
          </div>
          <div className="text-xs text-gray-600">Completados</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {history.filter(h => h.status === 'failed').length}
          </div>
          <div className="text-xs text-gray-600">Fallidos</div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredHistory.map((item, index) => renderHistoryItem(item, index))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredHistory.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-gray-500">No hay archivos con el filtro seleccionado</p>
        </div>
      )}
    </motion.div>
  );
};

export default ProcessingQueue;
