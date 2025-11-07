import React from 'react';
import { motion } from 'framer-motion';
import { TimelineConfig } from '../../types/documents';

interface TimelineControlsProps {
  config: TimelineConfig;
  onConfigChange: (config: TimelineConfig) => void;
  selectedYear: number | null;
  onYearSelect: (year: number | null) => void;
}

export const TimelineControls: React.FC<TimelineControlsProps> = ({
  config,
  onConfigChange,
  selectedYear,
  onYearSelect
}) => {
  const handleZoomChange = (zoomLevel: number) => {
    onConfigChange({ ...config, zoomLevel });
  };

  const handleYearRangeChange = (startYear: number, endYear: number) => {
    onConfigChange({ ...config, startYear, endYear });
  };

  const handleToggleMarkers = (type: 'year' | 'month') => {
    onConfigChange({
      ...config,
      showYearMarkers: type === 'year' ? !config.showYearMarkers : config.showYearMarkers,
      showMonthMarkers: type === 'month' ? !config.showMonthMarkers : config.showMonthMarkers
    });
  };

  const zoomLevels = [
    { value: 0.25, label: 'Trimestre', icon: '📅' },
    { value: 0.5, label: 'Semestre', icon: '📆' },
    { value: 1, label: 'Año', icon: '🗓️' },
    { value: 2, label: '2 Años', icon: '📊' }
  ];

  const yearRanges = [
    { start: 2010, end: 2025, label: '2010-2025' },
    { start: 2015, end: 2025, label: '2015-2025' },
    { start: 2020, end: 2025, label: '2020-2025' },
    { start: 2022, end: 2025, label: '2022-2025' }
  ];

  return (
    <motion.div
      className="glass-card p-4 mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Zoom Level */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-600">Zoom:</span>
          <div className="flex space-x-1">
            {zoomLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => handleZoomChange(level.value)}
                className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                  config.zoomLevel === level.value
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-white/50 text-gray-600 hover:bg-white/80'
                }`}
                title={level.label}
              >
                <span className="mr-1">{level.icon}</span>
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Year Range */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-600">Período:</span>
          <div className="flex space-x-1">
            {yearRanges.map((range) => (
              <button
                key={`${range.start}-${range.end}`}
                onClick={() => handleYearRangeChange(range.start, range.end)}
                className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                  config.startYear === range.start && config.endYear === range.end
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-white/50 text-gray-600 hover:bg-white/80'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Markers Toggle */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-600">Marcadores:</span>
          <div className="flex space-x-1">
            <button
              onClick={() => handleToggleMarkers('year')}
              className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                config.showYearMarkers
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-white/50 text-gray-600 hover:bg-white/80'
              }`}
            >
              📅 Años
            </button>
            <button
              onClick={() => handleToggleMarkers('month')}
              className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                config.showMonthMarkers
                  ? 'bg-primary text-white shadow-lg'
                  : 'bg-white/50 text-gray-600 hover:bg-white/80'
              }`}
            >
              📆 Meses
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onYearSelect(null)}
            className="px-4 py-2 bg-secondary text-primary rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors duration-200"
          >
            Ver Todo
          </button>
          <button
            onClick={() => {
              const currentYear = new Date().getFullYear();
              onYearSelect(currentYear);
            }}
            className="px-4 py-2 bg-info text-white rounded-lg text-sm font-medium hover:bg-info/80 transition-colors duration-200"
          >
            Año Actual
          </button>
        </div>
      </div>

      {/* Selected Year Info */}
      {selectedYear && (
        <motion.div
          className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary">
              Vista enfocada en: {selectedYear}
            </span>
            <button
              onClick={() => onYearSelect(null)}
              className="text-primary hover:text-primary/80 text-sm"
            >
              ✕ Cerrar
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TimelineControls;
