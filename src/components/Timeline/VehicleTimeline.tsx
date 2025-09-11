import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VehicleDocument, DocumentGap, TimelineFilters, TimelineConfig } from '../../types/documents';
import { DocumentCard } from '../DocumentCard/DocumentCard';
import { TimelineControls } from './TimelineControls';
import { TimelineFilters as TimelineFiltersComponent } from './TimelineFilters';
import { DOCUMENT_TYPES } from '../../constants/documentTypes';

interface VehicleTimelineProps {
  documents: VehicleDocument[];
  gaps: DocumentGap[];
  onDocumentClick: (doc: VehicleDocument) => void;
  onGapClick: (gap: DocumentGap) => void;
  className?: string;
}

export const VehicleTimeline: React.FC<VehicleTimelineProps> = ({
  documents,
  gaps,
  onDocumentClick,
  onGapClick,
  className = ''
}) => {
  // Calcular rango de fechas dinámico basado en los documentos
  const calculateDateRange = () => {
    if (documents.length === 0) {
      return {
        from: new Date(2020, 0, 1),
        to: new Date(2025, 11, 31)
      };
    }
    
    const allDates = [
      ...documents.map(doc => doc.issueDate),
      ...gaps.map(gap => gap.expectedDateRange.from),
      ...gaps.map(gap => gap.expectedDateRange.to)
    ];
    
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Agregar margen de 1 año antes y después
    minDate.setFullYear(minDate.getFullYear() - 1);
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    
    return { from: minDate, to: maxDate };
  };

  const [filters, setFilters] = useState<TimelineFilters>({
    documentTypes: Object.keys(DOCUMENT_TYPES) as any[],
    dateRange: calculateDateRange(),
    showGaps: true,
    showPresent: true,
    showMissing: true
  });

  const [config, setConfig] = useState<TimelineConfig>({
    startYear: calculateDateRange().from.getFullYear(),
    endYear: calculateDateRange().to.getFullYear(),
    zoomLevel: 1,
    showYearMarkers: true,
    showMonthMarkers: false
  });

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);

  // Calcular dimensiones del timeline
  useEffect(() => {
    const updateTimelineWidth = () => {
      if (timelineRef.current) {
        setTimelineWidth(timelineRef.current.offsetWidth);
      }
    };

    updateTimelineWidth();
    window.addEventListener('resize', updateTimelineWidth);
    return () => window.removeEventListener('resize', updateTimelineWidth);
  }, []);

  // Filtrar documentos y gaps
  const filteredDocuments = documents.filter(doc => {
    const typeMatch = filters.documentTypes.includes(doc.type);
    const dateMatch = doc.issueDate >= filters.dateRange.from && doc.issueDate <= filters.dateRange.to;
    return typeMatch && dateMatch;
  });

  const filteredGaps = gaps.filter(gap => {
    const typeMatch = filters.documentTypes.includes(gap.type);
    const dateMatch = gap.expectedDateRange.from >= filters.dateRange.from && 
                     gap.expectedDateRange.to <= filters.dateRange.to;
    return typeMatch && dateMatch;
  });

  // Calcular posiciones en el timeline con mejor precisión cronológica
  const getPositionInTimeline = (date: Date): number => {
    const totalDays = (filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24);
    const daysFromStart = (date.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24);
    
    // Asegurar que la posición esté dentro del rango 0-100%
    const position = Math.max(0, Math.min(100, (daysFromStart / totalDays) * 100));
    return position;
  };

  // Generar marcadores de años
  const generateYearMarkers = () => {
    const markers = [];
    for (let year = config.startYear; year <= config.endYear; year++) {
      const yearDate = new Date(year, 0, 1);
      if (yearDate >= filters.dateRange.from && yearDate <= filters.dateRange.to) {
        const position = getPositionInTimeline(yearDate);
        markers.push(
          <div
            key={year}
            className="timeline-year-marker"
            style={{ left: `${position}%` }}
          >
            <div className="timeline-year-label">{year}</div>
          </div>
        );
      }
    }
    return markers;
  };

  // Generar marcadores de meses (si está habilitado)
  const generateMonthMarkers = () => {
    if (!config.showMonthMarkers) return [];
    
    const markers = [];
    const currentDate = new Date(filters.dateRange.from);
    
    while (currentDate <= filters.dateRange.to) {
      const position = getPositionInTimeline(currentDate);
      markers.push(
        <div
          key={currentDate.getTime()}
          className="absolute top-0 h-8 w-px bg-gray-300"
          style={{ left: `${position}%` }}
        />
      );
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return markers;
  };

  // Agrupar documentos por tipo para los carriles
  const documentsByType = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.type]) {
      acc[doc.type] = [];
    }
    acc[doc.type].push(doc);
    return acc;
  }, {} as Record<string, VehicleDocument[]>);

  // Generar carriles de documentos optimizados para timeline
  const generateDocumentLanes = () => {
    const lanes: JSX.Element[] = [];
    const laneTypes = ['factura_origen', 'factura_endosada', 'tarjeta_circulacion', 'tenencia', 'refrendo', 'verificacion'];
    
    laneTypes.forEach((type, index) => {
      const docs = documentsByType[type] || [];
      const typeGaps = filteredGaps.filter(gap => gap.type === type);
      
      // Ordenar documentos por fecha para mejor visualización cronológica
      const sortedDocs = docs.sort((a, b) => a.issueDate.getTime() - b.issueDate.getTime());
      
      lanes.push(
        <div key={type} className="relative h-24 mb-6">
          {/* Etiqueta del carril */}
          <div className="absolute -left-40 top-0 h-full flex items-center w-36">
            <div className="text-sm font-medium text-gray-700 whitespace-nowrap truncate">
              {DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES]?.name || type}
            </div>
          </div>
          
          {/* Línea del carril */}
          <div className="timeline-track ml-10 relative">
            {/* Marcadores de años en este carril */}
            {config.showYearMarkers && generateYearMarkers()}
            {config.showMonthMarkers && generateMonthMarkers()}
            
            {/* Documentos presentes - Cards compactas para timeline */}
            {filters.showPresent && sortedDocs.map((doc, docIndex) => {
              const position = getPositionInTimeline(doc.issueDate);
              return (
                <motion.div
                  key={doc.id}
                  className="absolute top-1 z-10"
                  style={{ left: `${position}%` }}
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: docIndex * 0.1 }}
                  whileHover={{ scale: 1.1, zIndex: 20 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div 
                    className="timeline-document-card bg-green-100 border-2 border-green-500 rounded-lg p-2 shadow-md cursor-pointer hover:shadow-lg transition-all duration-200"
                    onClick={() => onDocumentClick(doc)}
                    style={{ width: '120px', minHeight: '60px' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="text-xs text-green-700 font-medium">
                        {doc.type.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {doc.issueDate.toLocaleDateString('es-MX', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: '2-digit' 
                      })}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {doc.ownerName}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            {/* Gaps (documentos faltantes) - Barras horizontales */}
            {filters.showGaps && typeGaps.map((gap, gapIndex) => {
              const position = getPositionInTimeline(gap.expectedDateRange.from);
              const endPosition = getPositionInTimeline(gap.expectedDateRange.to);
              const width = Math.max(2, endPosition - position);
              
              return (
                <motion.div
                  key={gap.id}
                  className="absolute top-1 z-5"
                  style={{ left: `${position}%`, width: `${width}%` }}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: (sortedDocs.length + gapIndex) * 0.1 }}
                  whileHover={{ scaleY: 1.2, zIndex: 15 }}
                  whileTap={{ scaleY: 0.9 }}
                >
                  <div 
                    className="timeline-gap-bar bg-red-100 border-2 border-dashed border-red-500 rounded-lg p-2 cursor-pointer hover:bg-red-200 transition-all duration-200"
                    onClick={() => onGapClick(gap)}
                    style={{ minHeight: '60px' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div className="text-xs text-red-700 font-medium">
                        {gap.type.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      {gap.expectedDateRange.from.toLocaleDateString('es-MX', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: '2-digit' 
                      })} - {gap.expectedDateRange.to.toLocaleDateString('es-MX', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: '2-digit' 
                      })}
                    </div>
                    <div className="text-xs text-red-600 truncate">
                      FALTANTE
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      );
    });
    
    return lanes;
  };

  // Generar conexiones entre documentos relacionados
  const generateConnections = () => {
    const connections: JSX.Element[] = [];
    
    // Conectar documentos del mismo propietario
    const ownerGroups = filteredDocuments.reduce((acc, doc) => {
      if (!acc[doc.ownerName]) {
        acc[doc.ownerName] = [];
      }
      acc[doc.ownerName].push(doc);
      return acc;
    }, {} as Record<string, VehicleDocument[]>);

    Object.values(ownerGroups).forEach(ownerDocs => {
      const sortedDocs = ownerDocs.sort((a, b) => a.issueDate.getTime() - b.issueDate.getTime());
      
      for (let i = 1; i < sortedDocs.length; i++) {
        const prev = sortedDocs[i - 1];
        const curr = sortedDocs[i];
        
        const prevPos = getPositionInTimeline(prev.issueDate);
        const currPos = getPositionInTimeline(curr.issueDate);
        
        connections.push(
          <motion.div
            key={`connection_${prev.id}_${curr.id}`}
            className="absolute top-10 h-px bg-gradient-to-r from-primary to-secondary opacity-60"
            style={{
              left: `${prevPos}%`,
              width: `${currPos - prevPos}%`
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
        );
      }
    });
    
    return connections;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Controles del timeline */}
      <TimelineControls
        config={config}
        onConfigChange={setConfig}
        selectedYear={selectedYear}
        onYearSelect={setSelectedYear}
      />
      
      {/* Filtros */}
      <TimelineFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        documents={documents}
        gaps={gaps}
      />
      
      {/* Timeline principal */}
      <div className="mt-6">
        {/* Encabezado con años */}
        <div className="relative h-12 mb-6 ml-10 bg-gray-50 rounded-lg p-2">
          <div className="relative h-full">
            {generateYearMarkers()}
          </div>
        </div>
        
        {/* Contenedor del timeline con scroll horizontal */}
        <div 
          ref={timelineRef}
          className="relative overflow-x-auto overflow-y-visible bg-white rounded-lg shadow-inner p-4"
          style={{ minHeight: '500px' }}
        >
          <div className="relative min-w-full" style={{ width: `${Math.max(timelineWidth, 1200)}px` }}>
            {/* Conexiones entre documentos */}
            <div className="absolute inset-0 pointer-events-none">
              {generateConnections()}
            </div>
            
            {/* Carriles de documentos */}
            <div className="space-y-2">
              {generateDocumentLanes()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Leyenda */}
      <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-success rounded"></div>
          <span>Documentos presentes</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-danger rounded border-2 border-dashed"></div>
          <span>Documentos faltantes</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-warning rounded"></div>
          <span>Documentos parciales</span>
        </div>
      </div>
    </div>
  );
};

export default VehicleTimeline;
