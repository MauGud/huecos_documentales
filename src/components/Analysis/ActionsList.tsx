import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnalysisResult, DocumentGap } from '../../types/documents';
import { DOCUMENT_TYPES } from '../../constants/documentTypes';

interface ActionsListProps {
  analysis: AnalysisResult;
  onGapClick: (gap: DocumentGap) => void;
  className?: string;
}

export const ActionsList: React.FC<ActionsListProps> = ({
  analysis,
  onGapClick,
  className = ''
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'severity' | 'cost' | 'date' | 'type'>('severity');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-blue-500 bg-blue-50';
      case 'low': return 'border-gray-500 bg-gray-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return 'ℹ️';
      case 'low': return '📝';
      default: return '❓';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Crítico';
      case 'high': return 'Alto';
      case 'medium': return 'Medio';
      case 'low': return 'Bajo';
      default: return 'Desconocido';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filtrar gaps por severidad
  const filteredGaps = analysis.gaps.filter(gap => 
    selectedSeverity === 'all' || gap.severity === selectedSeverity
  );

  // Ordenar gaps
  const sortedGaps = [...filteredGaps].sort((a, b) => {
    switch (sortBy) {
      case 'severity':
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      case 'cost':
        return (b.estimatedCost || 0) - (a.estimatedCost || 0);
      case 'date':
        return b.expectedDateRange.from.getTime() - a.expectedDateRange.from.getTime();
      case 'type':
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  // Agrupar gaps por severidad
  const groupedGaps = {
    critical: analysis.priorityActions.critical,
    high: analysis.priorityActions.high,
    medium: analysis.priorityActions.medium,
    low: analysis.priorityActions.low
  };

  const renderGapCard = (gap: DocumentGap, index: number) => {
    const docType = DOCUMENT_TYPES[gap.type];
    
    return (
      <motion.div
        key={gap.id}
        className={`border-l-4 p-4 rounded-lg ${getSeverityColor(gap.severity)}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{docType.icon}</span>
            <div>
              <h4 className="font-semibold text-gray-800">{docType.name}</h4>
              <div className="flex items-center space-x-2">
                <span className="text-sm">{getSeverityIcon(gap.severity)}</span>
                <span className="text-sm font-medium">{getSeverityLabel(gap.severity)}</span>
              </div>
            </div>
          </div>
          {gap.estimatedCost && (
            <div className="text-right">
              <div className="text-lg font-bold text-gray-800">{formatCurrency(gap.estimatedCost)}</div>
              <div className="text-xs text-gray-500">Costo estimado</div>
            </div>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div>
            <span className="text-sm font-medium text-gray-600">Razón:</span>
            <p className="text-sm text-gray-700">{gap.reason}</p>
          </div>
          
          <div>
            <span className="text-sm font-medium text-gray-600">Período esperado:</span>
            <p className="text-sm text-gray-700">
              {formatDate(gap.expectedDateRange.from)} - {formatDate(gap.expectedDateRange.to)}
            </p>
          </div>

          {gap.issuingAuthority && (
            <div>
              <span className="text-sm font-medium text-gray-600">Autoridad:</span>
              <p className="text-sm text-gray-700">{gap.issuingAuthority}</p>
            </div>
          )}
        </div>

        <div className="bg-white/50 p-3 rounded-lg mb-4">
          <div className="text-sm font-medium text-gray-700 mb-1">Acción sugerida:</div>
          <p className="text-sm text-gray-600">{gap.suggestedAction}</p>
        </div>

        {gap.requiredDocuments && gap.requiredDocuments.length > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Documentos requeridos:</div>
            <div className="flex flex-wrap gap-1">
              {gap.requiredDocuments.map((req, reqIndex) => (
                <span
                  key={reqIndex}
                  className="px-2 py-1 bg-white/70 text-gray-700 rounded text-xs"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <button
            onClick={() => onGapClick(gap)}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/80 transition-colors duration-200"
          >
            Ver Detalles
          </button>
          <button className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors duration-200">
            Marcar Resuelto
          </button>
        </div>
      </motion.div>
    );
  };

  const renderSeverityGroup = (severity: string, gaps: DocumentGap[]) => {
    if (gaps.length === 0) return null;

    return (
      <motion.div
        key={severity}
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl">{getSeverityIcon(severity)}</span>
          <h3 className="text-lg font-semibold text-gray-800">
            {getSeverityLabel(severity)} ({gaps.length})
          </h3>
          <div className={`w-4 h-4 rounded-full ${
            severity === 'critical' ? 'bg-red-500' :
            severity === 'high' ? 'bg-orange-500' :
            severity === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
          }`}></div>
        </div>
        
        <div className="space-y-4">
          {gaps.map((gap, index) => renderGapCard(gap, index))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filtros y Controles */}
      <motion.div
        className="glass-card p-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Filtro por severidad */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">Filtrar por:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Todas las severidades</option>
              <option value="critical">Crítico</option>
              <option value="high">Alto</option>
              <option value="medium">Medio</option>
              <option value="low">Bajo</option>
            </select>
          </div>

          {/* Ordenamiento */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-600">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="severity">Severidad</option>
              <option value="cost">Costo</option>
              <option value="date">Fecha</option>
              <option value="type">Tipo</option>
            </select>
          </div>

          {/* Estadísticas rápidas */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Total: {analysis.gaps.length}</span>
            <span>Críticos: {analysis.priorityActions.critical.length}</span>
            <span>Altos: {analysis.priorityActions.high.length}</span>
          </div>
        </div>
      </motion.div>

      {/* Lista de Acciones */}
      <div className="space-y-6">
        {selectedSeverity === 'all' ? (
          // Mostrar agrupado por severidad
          <>
            {renderSeverityGroup('critical', groupedGaps.critical)}
            {renderSeverityGroup('high', groupedGaps.high)}
            {renderSeverityGroup('medium', groupedGaps.medium)}
            {renderSeverityGroup('low', groupedGaps.low)}
          </>
        ) : (
          // Mostrar filtrado
          <div className="space-y-4">
            {sortedGaps.map((gap, index) => renderGapCard(gap, index))}
          </div>
        )}
      </div>

      {/* Resumen de Costos */}
      {analysis.gaps.some(gap => gap.estimatedCost) && (
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de Costos</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(groupedGaps).map(([severity, gaps]) => {
              const totalCost = gaps.reduce((sum, gap) => sum + (gap.estimatedCost || 0), 0);
              return (
                <div key={severity} className="text-center">
                  <div className={`text-2xl font-bold ${
                    severity === 'critical' ? 'text-red-600' :
                    severity === 'high' ? 'text-orange-600' :
                    severity === 'medium' ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {formatCurrency(totalCost)}
                  </div>
                  <div className="text-sm text-gray-600">{getSeverityLabel(severity)}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Acciones Masivas */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Acciones Masivas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-danger text-white rounded-lg hover:bg-danger/80 transition-colors duration-200">
            <div className="text-lg font-semibold mb-1">Resolver Críticos</div>
            <div className="text-sm opacity-90">
              {analysis.priorityActions.critical.length} acciones críticas
            </div>
          </button>
          
          <button className="p-4 bg-warning text-white rounded-lg hover:bg-warning/80 transition-colors duration-200">
            <div className="text-lg font-semibold mb-1">Generar Checklist</div>
            <div className="text-sm opacity-90">Lista de documentos necesarios</div>
          </button>
          
          <button className="p-4 bg-info text-white rounded-lg hover:bg-info/80 transition-colors duration-200">
            <div className="text-lg font-semibold mb-1">Exportar Reporte</div>
            <div className="text-sm opacity-90">PDF con análisis completo</div>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ActionsList;
