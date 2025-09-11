import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VehicleDocument, DocumentGap } from '../../types/documents';
import { DocumentCard } from './DocumentCard';

interface DocumentCardListProps {
  documents: VehicleDocument[];
  gaps: DocumentGap[];
  onDocumentClick: (doc: VehicleDocument) => void;
  onGapClick: (gap: DocumentGap) => void;
  className?: string;
  showFilters?: boolean;
  groupBy?: 'type' | 'year' | 'owner' | 'none';
  sortBy?: 'date' | 'type' | 'severity' | 'name';
}

export const DocumentCardList: React.FC<DocumentCardListProps> = ({
  documents,
  gaps,
  onDocumentClick,
  onGapClick,
  className = '',
  showFilters = true,
  groupBy = 'type',
  sortBy = 'date'
}) => {
  const [filters, setFilters] = useState({
    showPresent: true,
    showMissing: true,
    showPartial: true,
    searchTerm: '',
    selectedTypes: [] as string[],
    selectedSeverities: [] as string[],
    sortBy: 'date' as 'date' | 'type' | 'severity' | 'name',
    groupBy: 'type' as 'type' | 'year' | 'owner' | 'none'
  });

  // Filtrar y ordenar documentos
  const filteredDocuments = documents
    .filter(doc => {
      if (!filters.showPresent) return false;
      if (filters.searchTerm && !doc.ownerName.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
      if (filters.selectedTypes.length > 0 && !filters.selectedTypes.includes(doc.type)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'date':
          return b.issueDate.getTime() - a.issueDate.getTime();
        case 'type':
          return a.type.localeCompare(b.type);
        case 'name':
          return a.ownerName.localeCompare(b.ownerName);
        default:
          return 0;
      }
    });

  // Filtrar y ordenar gaps
  const filteredGaps = gaps
    .filter(gap => {
      if (!filters.showMissing) return false;
      if (filters.searchTerm && !gap.reason.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
      if (filters.selectedTypes.length > 0 && !filters.selectedTypes.includes(gap.type)) return false;
      if (filters.selectedSeverities.length > 0 && !filters.selectedSeverities.includes(gap.severity)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'severity':
          const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return severityOrder[a.severity] - severityOrder[b.severity];
        case 'date':
          return b.expectedDateRange.from.getTime() - a.expectedDateRange.from.getTime();
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

  // Agrupar elementos
  const groupedItems = () => {
    const allItems = [
      ...filteredDocuments.map(doc => ({ type: 'document', data: doc })),
      ...filteredGaps.map(gap => ({ type: 'gap', data: gap }))
    ];

    switch (filters.groupBy) {
      case 'type':
        return groupByType(allItems);
      case 'year':
        return groupByYear(allItems);
      case 'owner':
        return groupByOwner(allItems);
      default:
        return { 'Todos': allItems };
    }
  };

  const groupByType = (items: any[]) => {
    const groups: Record<string, any[]> = {};
    items.forEach(item => {
      const type = item.data.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
    });
    return groups;
  };

  const groupByYear = (items: any[]) => {
    const groups: Record<string, any[]> = {};
    items.forEach(item => {
      const year = item.type === 'document' 
        ? item.data.issueDate.getFullYear()
        : item.data.expectedDateRange.from.getFullYear();
      if (!groups[year]) groups[year] = [];
      groups[year].push(item);
    });
    return groups;
  };

  const groupByOwner = (items: any[]) => {
    const groups: Record<string, any[]> = {};
    items.forEach(item => {
      const owner = item.type === 'document' 
        ? item.data.ownerName
        : 'Documentos Faltantes';
      if (!groups[owner]) groups[owner] = [];
      groups[owner].push(item);
    });
    return groups;
  };

  const renderGroup = (groupName: string, items: any[]) => (
    <motion.div
      key={groupName}
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
        {groupName}
        <span className="ml-2 text-sm text-gray-500">({items.length})</span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={item.type === 'document' ? item.data.id : item.data.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.1 }}
            >
              {item.type === 'document' ? (
                <DocumentCard
                  document={item.data}
                  variant="present"
                  onClick={() => onDocumentClick(item.data)}
                  showDetails={true}
                />
              ) : (
                <DocumentCard
                  gap={item.data}
                  variant="missing"
                  onClick={() => onGapClick(item.data)}
                  showDetails={true}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Estadísticas */}
      <motion.div
        className="glass-card p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-success">{documents.length}</div>
            <div className="text-sm text-gray-600">Documentos Presentes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-danger">{gaps.length}</div>
            <div className="text-sm text-gray-600">Documentos Faltantes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-warning">
              {gaps.filter(gap => gap.severity === 'critical').length}
            </div>
            <div className="text-sm text-gray-600">Críticos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">
              {documents.length + gaps.length > 0 ? Math.round((documents.length / (documents.length + gaps.length)) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-600">Completitud</div>
          </div>
        </div>
      </motion.div>

      {/* Documentos Presentes */}
      {documents.length > 0 && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-2 bg-success rounded-full mr-2"></span>
            Documentos Presentes ({documents.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {documents.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <DocumentCard
                    document={doc}
                    variant="present"
                    onClick={() => onDocumentClick(doc)}
                    showDetails={true}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Documentos Faltantes */}
      {gaps.length > 0 && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-2 h-2 bg-danger rounded-full mr-2"></span>
            Documentos Faltantes ({gaps.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {gaps.map((gap, index) => (
                <motion.div
                  key={gap.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <DocumentCard
                    gap={gap}
                    variant="missing"
                    onClick={() => onGapClick(gap)}
                    showDetails={true}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Mensaje cuando no hay documentos */}
      {documents.length === 0 && gaps.length === 0 && (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay documentos cargados</h3>
          <p className="text-gray-500">Sube documentos en la pestaña "Cargar Documentos" para comenzar el análisis</p>
        </motion.div>
      )}
    </div>
  );
};

export default DocumentCardList;
