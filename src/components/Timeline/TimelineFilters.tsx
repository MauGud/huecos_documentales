import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineFilters as TimelineFiltersType, VehicleDocument, DocumentGap, DocumentType } from '../../types/documents';
import { DOCUMENT_TYPES } from '../../constants/documentTypes';

interface TimelineFiltersProps {
  filters: TimelineFiltersType;
  onFiltersChange: (filters: TimelineFiltersType) => void;
  documents: VehicleDocument[];
  gaps: DocumentGap[];
}

export const TimelineFilters: React.FC<TimelineFiltersProps> = ({
  filters,
  onFiltersChange,
  documents,
  gaps
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDocumentTypeToggle = (type: DocumentType) => {
    const newTypes = filters.documentTypes.includes(type)
      ? filters.documentTypes.filter(t => t !== type)
      : [...filters.documentTypes, type];
    
    onFiltersChange({ ...filters, documentTypes: newTypes });
  };

  const handleDateRangeChange = (field: 'from' | 'to', date: Date) => {
    onFiltersChange({
      ...filters,
      dateRange: { ...filters.dateRange, [field]: date }
    });
  };

  const handleToggleShow = (type: 'gaps' | 'present' | 'missing') => {
    onFiltersChange({
      ...filters,
      [type === 'gaps' ? 'showGaps' : type === 'present' ? 'showPresent' : 'showMissing']: !filters[type === 'gaps' ? 'showGaps' : type === 'present' ? 'showPresent' : 'showMissing']
    });
  };

  const handleSelectAll = () => {
    onFiltersChange({
      ...filters,
      documentTypes: Object.keys(DOCUMENT_TYPES) as DocumentType[]
    });
  };

  const handleSelectNone = () => {
    onFiltersChange({
      ...filters,
      documentTypes: []
    });
  };

  const handleQuickFilter = (type: 'critical' | 'high' | 'medium' | 'low') => {
    const filteredTypes = gaps
      .filter(gap => gap.severity === type)
      .map(gap => gap.type);
    
    onFiltersChange({
      ...filters,
      documentTypes: Array.from(new Set(filteredTypes))
    });
  };

  // Calcular estadísticas
  const stats = {
    total: documents.length + gaps.length,
    present: documents.length,
    missing: gaps.length,
    byType: Object.keys(DOCUMENT_TYPES).reduce((acc, type) => {
      acc[type] = {
        present: documents.filter(doc => doc.type === type).length,
        missing: gaps.filter(gap => gap.type === type).length
      };
      return acc;
    }, {} as Record<string, { present: number; missing: number }>),
    bySeverity: {
      critical: gaps.filter(gap => gap.severity === 'critical').length,
      high: gaps.filter(gap => gap.severity === 'high').length,
      medium: gaps.filter(gap => gap.severity === 'medium').length,
      low: gaps.filter(gap => gap.severity === 'low').length
    }
  };

  return (
    <div className="glass-card p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="px-2 py-1 bg-success/20 text-success rounded-full">
              {stats.present} presentes
            </span>
            <span className="px-2 py-1 bg-danger/20 text-danger rounded-full">
              {stats.missing} faltantes
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.div>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={handleSelectAll}
          className="px-3 py-1 bg-primary text-white rounded-lg text-sm hover:bg-primary/80 transition-colors duration-200"
        >
          Seleccionar Todo
        </button>
        <button
          onClick={handleSelectNone}
          className="px-3 py-1 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors duration-200"
        >
          Limpiar Todo
        </button>
        <div className="h-6 w-px bg-gray-300"></div>
        <button
          onClick={() => handleQuickFilter('critical')}
          className="px-3 py-1 bg-danger text-white rounded-lg text-sm hover:bg-danger/80 transition-colors duration-200"
        >
          Críticos ({stats.bySeverity.critical})
        </button>
        <button
          onClick={() => handleQuickFilter('high')}
          className="px-3 py-1 bg-warning text-white rounded-lg text-sm hover:bg-warning/80 transition-colors duration-200"
        >
          Altos ({stats.bySeverity.high})
        </button>
        <button
          onClick={() => handleQuickFilter('medium')}
          className="px-3 py-1 bg-info text-white rounded-lg text-sm hover:bg-info/80 transition-colors duration-200"
        >
          Medios ({stats.bySeverity.medium})
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Document Types */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Tipos de Documentos</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(DOCUMENT_TYPES).map(([type, config]) => {
                  const isSelected = filters.documentTypes.includes(type as DocumentType);
                  const typeStats = stats.byType[type];
                  
                  return (
                    <motion.button
                      key={type}
                      onClick={() => handleDocumentTypeToggle(type as DocumentType)}
                      className={`p-3 rounded-lg text-left transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary text-white shadow-lg'
                          : 'bg-white/50 text-gray-700 hover:bg-white/80'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{config.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{config.name}</div>
                          <div className="text-xs opacity-75">
                            {typeStats.present}✓ {typeStats.missing}✗
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Rango de Fechas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Desde</label>
                  <input
                    type="date"
                    value={filters.dateRange.from.toISOString().split('T')[0]}
                    onChange={(e) => handleDateRangeChange('from', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={filters.dateRange.to.toISOString().split('T')[0]}
                    onChange={(e) => handleDateRangeChange('to', new Date(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Show/Hide Options */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Mostrar</h4>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.showPresent}
                    onChange={() => handleToggleShow('present')}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Documentos Presentes</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.showGaps}
                    onChange={() => handleToggleShow('gaps')}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Documentos Faltantes</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.showMissing}
                    onChange={() => handleToggleShow('missing')}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">Documentos Parciales</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimelineFilters;
