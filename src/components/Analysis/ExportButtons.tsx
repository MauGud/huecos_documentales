import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AnalysisResult, ExportConfig } from '../../types/documents';

interface ExportButtonsProps {
  analysis: AnalysisResult;
  className?: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  analysis,
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'json'>('pdf');

  const handleExport = async (format: 'pdf' | 'excel' | 'json') => {
    setIsExporting(true);
    setExportFormat(format);

    try {
      // Simular proceso de exportación
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // En producción, aquí se generaría el archivo real
      const fileName = `analisis_vehicular_${new Date().toISOString().split('T')[0]}.${format}`;
      
      // Crear contenido del archivo
      let content = '';
      let mimeType = '';
      
      switch (format) {
        case 'pdf':
          content = generatePDFContent(analysis);
          mimeType = 'application/pdf';
          break;
        case 'excel':
          content = generateExcelContent(analysis);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'json':
          content = JSON.stringify(analysis, null, 2);
          mimeType = 'application/json';
          break;
      }

      // Descargar archivo
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al generar el archivo de exportación');
    } finally {
      setIsExporting(false);
    }
  };

  const generatePDFContent = (analysis: AnalysisResult): string => {
    // En producción, usar una librería como jsPDF
    return `
ANÁLISIS DE COMPLETITUD DOCUMENTAL VEHICULAR
============================================

Fecha de análisis: ${new Date().toLocaleDateString('es-MX')}
Score de completitud: ${analysis.score}/100
Nivel de riesgo: ${analysis.riskLevel.toUpperCase()}
Porcentaje de completitud: ${analysis.completenessPercentage.toFixed(1)}%

RESUMEN EJECUTIVO
================
- Documentos presentes: ${analysis.categoryBreakdown.ownership.present + analysis.categoryBreakdown.fiscal.present + analysis.categoryBreakdown.registration.present + analysis.categoryBreakdown.verification.present}
- Gaps detectados: ${analysis.gaps.length}
- Issues críticos: ${analysis.criticalIssues.length}
- Problemas temporales: ${analysis.temporalIssues.length}

DESGLOSE POR CATEGORÍA
=====================
Propiedad: ${analysis.categoryBreakdown.ownership.present}/${analysis.categoryBreakdown.ownership.expected} (${analysis.categoryBreakdown.ownership.percentage.toFixed(1)}%)
Fiscal: ${analysis.categoryBreakdown.fiscal.present}/${analysis.categoryBreakdown.fiscal.expected} (${analysis.categoryBreakdown.fiscal.percentage.toFixed(1)}%)
Registro: ${analysis.categoryBreakdown.registration.present}/${analysis.categoryBreakdown.registration.expected} (${analysis.categoryBreakdown.registration.percentage.toFixed(1)}%)
Verificación: ${analysis.categoryBreakdown.verification.present}/${analysis.categoryBreakdown.verification.expected} (${analysis.categoryBreakdown.verification.percentage.toFixed(1)}%)

GAPS DETECTADOS
==============
${analysis.gaps.map((gap, index) => `
${index + 1}. ${gap.type.toUpperCase()} - ${gap.severity.toUpperCase()}
   Razón: ${gap.reason}
   Período: ${gap.expectedDateRange.from.toLocaleDateString('es-MX')} - ${gap.expectedDateRange.to.toLocaleDateString('es-MX')}
   Acción: ${gap.suggestedAction}
   ${gap.estimatedCost ? `Costo estimado: $${gap.estimatedCost} MXN` : ''}
`).join('')}

RECOMENDACIONES
==============
${analysis.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

${analysis.criticalIssues.length > 0 ? `
ISSUES CRÍTICOS
==============
${analysis.criticalIssues.map((issue, index) => `${index + 1}. ${issue}`).join('\n')}
` : ''}

${analysis.temporalIssues.length > 0 ? `
PROBLEMAS TEMPORALES
==================
${analysis.temporalIssues.map((issue, index) => `${index + 1}. ${issue.description} - ${issue.suggestedFix}`).join('\n')}
` : ''}

CADENA DE PROPIEDAD
==================
Estado: ${analysis.ownershipValidation.isValid ? 'VÁLIDA' : 'INVÁLIDA'}
${analysis.ownershipValidation.issues.length > 0 ? `
Problemas:
${analysis.ownershipValidation.issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n')}
` : ''}

---
Generado por Huecos Doc - Sistema de Detección de Huecos Documentales Vehiculares
    `;
  };

  const generateExcelContent = (analysis: AnalysisResult): string => {
    // En producción, usar una librería como xlsx
    const csvContent = `
Tipo,Severidad,Razón,Período Desde,Período Hasta,Acción Sugerida,Costo Estimado,Autoridad
${analysis.gaps.map(gap => 
  `${gap.type},${gap.severity},"${gap.reason}",${gap.expectedDateRange.from.toISOString().split('T')[0]},${gap.expectedDateRange.to.toISOString().split('T')[0]},"${gap.suggestedAction}",${gap.estimatedCost || ''},${gap.issuingAuthority || ''}`
).join('\n')}
    `;
    return csvContent;
  };

  const exportOptions = [
    {
      id: 'pdf',
      name: 'PDF Completo',
      description: 'Reporte detallado con análisis completo',
      icon: '📄',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      id: 'excel',
      name: 'Excel (CSV)',
      description: 'Datos tabulares para análisis',
      icon: '📊',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'json',
      name: 'JSON',
      description: 'Datos estructurados para integración',
      icon: '🔧',
      color: 'bg-blue-500 hover:bg-blue-600'
    }
  ];

  return (
    <motion.div
      className={`glass-card p-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Exportar Análisis</h3>
          <p className="text-sm text-gray-600">Descargar reporte en diferentes formatos</p>
        </div>
        <div className="text-sm text-gray-500">
          {isExporting ? 'Generando...' : 'Listo para exportar'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exportOptions.map((option) => (
          <motion.button
            key={option.id}
            onClick={() => handleExport(option.id as any)}
            disabled={isExporting}
            className={`p-4 rounded-lg text-white transition-all duration-200 ${
              isExporting ? 'opacity-50 cursor-not-allowed' : option.color
            }`}
            whileHover={!isExporting ? { scale: 1.02 } : {}}
            whileTap={!isExporting ? { scale: 0.98 } : {}}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{option.icon}</span>
              <div className="text-left">
                <div className="font-semibold">{option.name}</div>
                <div className="text-sm opacity-90">{option.description}</div>
              </div>
            </div>
            
            {isExporting && exportFormat === option.id && (
              <div className="mt-2">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <motion.div
                    className="bg-white h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2 }}
                  />
                </div>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-800 mb-2">Información del Reporte</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Score:</span> {analysis.score}/100
          </div>
          <div>
            <span className="font-medium">Gaps:</span> {analysis.gaps.length}
          </div>
          <div>
            <span className="font-medium">Críticos:</span> {analysis.criticalIssues.length}
          </div>
          <div>
            <span className="font-medium">Fecha:</span> {new Date().toLocaleDateString('es-MX')}
          </div>
        </div>
      </div>

      {/* Acciones adicionales */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors duration-200">
          📧 Enviar por Email
        </button>
        <button className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors duration-200">
          📱 Compartir
        </button>
        <button className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors duration-200">
          🖨️ Imprimir
        </button>
        <button className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors duration-200">
          💾 Guardar en Cloud
        </button>
      </div>
    </motion.div>
  );
};

export default ExportButtons;
