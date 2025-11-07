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
  const [filters, setFilters] = useState<TimelineFilters>({
    documentTypes: Object.keys(DOCUMENT_TYPES) as any[],
    dateRange: {
      from: new Date(2015, 0, 1),
      to: new Date(2025, 11, 31)
    },
    showGaps: true,
    showPresent: true,
    showMissing: true
  });

  const [config, setConfig] = useState<TimelineConfig>({
    startYear: 2015,
    endYear: 2025,
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

  // Calcular posiciones en el timeline
  const getPositionInTimeline = (date: Date): number => {
    const totalDays = (filters.dateRange.to.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24);
    const daysFromStart = (date.getTime() - filters.dateRange.from.getTime()) / (1000 * 60 * 60 * 24);
    return (daysFromStart / totalDays) * 100;
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

  // Generar carriles de documentos
  const generateDocumentLanes = () => {
    const lanes: JSX.Element[] = [];
    const laneTypes = ['factura_origen', 'factura_endosada', 'tarjeta_circulacion', 'tenencia', 'refrendo', 'verificacion'];
    
    laneTypes.forEach((type, index) => {
      const docs = documentsByType[type] || [];
      const typeGaps = filteredGaps.filter(gap => gap.type === type);
      
      lanes.push(
        <div key={type} className="relative h-20 mb-4">
          {/* Etiqueta del carril */}
          <div className="absolute -left-32 top-0 h-full flex items-center">
            <div className="text-sm font-medium text-gray-600 whitespace-nowrap">
              {DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES]?.name || type}
            </div>
          </div>
          
          {/* Línea del carril */}
          <div className="timeline-track ml-8">
            {/* Marcadores de años en este carril */}
            {config.showYearMarkers && generateYearMarkers()}
            {config.showMonthMarkers && generateMonthMarkers()}
            
            {/* Documentos presentes */}
            {filters.showPresent && docs.map((doc, docIndex) => {
              const position = getPositionInTimeline(doc.issueDate);
              return (
                <motion.div
                  key={doc.id}
                  className="absolute top-2"
                  style={{ left: `${position}%` }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: docIndex * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <DocumentCard
                    document={doc}
                    variant="present"
                    onClick={() => onDocumentClick(doc)}
                    className="w-48"
                  />
                </motion.div>
              );
            })}
            
            {/* Gaps (documentos faltantes) */}
            {filters.showGaps && typeGaps.map((gap, gapIndex) => {
              const position = getPositionInTimeline(gap.expectedDateRange.from);
              const width = getPositionInTimeline(gap.expectedDateRange.to) - position;
              
              return (
                <motion.div
                  key={gap.id}
                  className="absolute top-2"
                  style={{ left: `${position}%`, width: `${width}%` }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (docs.length + gapIndex) * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <DocumentCard
                    gap={gap}
                    variant="missing"
                    onClick={() => onGapClick(gap)}
                    className="w-full"
                  />
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
        <div className="relative h-8 mb-4 ml-8">
          {generateYearMarkers()}
        </div>
        
        {/* Contenedor del timeline con scroll horizontal */}
        <div 
          ref={timelineRef}
          className="relative overflow-x-auto overflow-y-visible"
          style={{ minHeight: '400px' }}
        >
          <div className="relative min-w-full" style={{ width: `${timelineWidth}px` }}>
            {/* Conexiones entre documentos */}
            <div className="absolute inset-0 pointer-events-none">
              {generateConnections()}
            </div>
            
            {/* Carriles de documentos */}
            <div className="space-y-4">
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
