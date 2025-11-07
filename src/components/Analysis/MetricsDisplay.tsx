import React from 'react';
import { motion } from 'framer-motion';
import { AnalysisResult } from '../../types/documents';

interface MetricsDisplayProps {
  analysis: AnalysisResult;
  className?: string;
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({
  analysis,
  className = ''
}) => {
  const metrics = [
    {
      title: 'Score de Completitud',
      value: analysis.score,
      max: 100,
      unit: '/100',
      color: analysis.score >= 80 ? 'text-success' : analysis.score >= 60 ? 'text-warning' : 'text-danger',
      bgColor: analysis.score >= 80 ? 'bg-success/20' : analysis.score >= 60 ? 'bg-warning/20' : 'bg-danger/20',
      icon: '📊'
    },
    {
      title: 'Porcentaje de Completitud',
      value: analysis.completenessPercentage,
      max: 100,
      unit: '%',
      color: analysis.completenessPercentage >= 80 ? 'text-success' : analysis.completenessPercentage >= 60 ? 'text-warning' : 'text-danger',
      bgColor: analysis.completenessPercentage >= 80 ? 'bg-success/20' : analysis.completenessPercentage >= 60 ? 'bg-warning/20' : 'bg-danger/20',
      icon: '✅'
    },
    {
      title: 'Gaps Detectados',
      value: analysis.gaps.length,
      max: null,
      unit: '',
      color: analysis.gaps.length === 0 ? 'text-success' : analysis.gaps.length <= 3 ? 'text-warning' : 'text-danger',
      bgColor: analysis.gaps.length === 0 ? 'bg-success/20' : analysis.gaps.length <= 3 ? 'bg-warning/20' : 'bg-danger/20',
      icon: '❌'
    },
    {
      title: 'Issues Críticos',
      value: analysis.criticalIssues.length,
      max: null,
      unit: '',
      color: analysis.criticalIssues.length === 0 ? 'text-success' : analysis.criticalIssues.length <= 2 ? 'text-warning' : 'text-danger',
      bgColor: analysis.criticalIssues.length === 0 ? 'bg-success/20' : analysis.criticalIssues.length <= 2 ? 'bg-warning/20' : 'bg-danger/20',
      icon: '🚨'
    },
    {
      title: 'Problemas Temporales',
      value: analysis.temporalIssues.length,
      max: null,
      unit: '',
      color: analysis.temporalIssues.length === 0 ? 'text-success' : analysis.temporalIssues.length <= 2 ? 'text-warning' : 'text-danger',
      bgColor: analysis.temporalIssues.length === 0 ? 'bg-success/20' : analysis.temporalIssues.length <= 2 ? 'bg-warning/20' : 'bg-danger/20',
      icon: '⏰'
    },
    {
      title: 'Cadena de Propiedad',
      value: analysis.ownershipValidation.isValid ? 100 : 0,
      max: 100,
      unit: analysis.ownershipValidation.isValid ? '%' : '',
      color: analysis.ownershipValidation.isValid ? 'text-success' : 'text-danger',
      bgColor: analysis.ownershipValidation.isValid ? 'bg-success/20' : 'bg-danger/20',
      icon: analysis.ownershipValidation.isValid ? '✅' : '❌'
    }
  ];

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'Bajo', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (score >= 60) return { level: 'Medio', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (score >= 40) return { level: 'Alto', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { level: 'Crítico', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const riskLevel = getRiskLevel(analysis.score);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Score Principal */}
      <motion.div
        className="text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative inline-block">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-4xl font-bold">{analysis.score}</div>
              <div className="text-sm">/ 100</div>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-xl">📊</span>
          </div>
        </div>
        <div className="mt-4">
          <h2 className="text-xl font-bold text-gray-800">Score de Completitud</h2>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${riskLevel.bgColor} ${riskLevel.color}`}>
            Riesgo {riskLevel.level}
          </div>
        </div>
      </motion.div>

      {/* Métricas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            className={`glass-card p-4 ${metric.bgColor}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{metric.icon}</span>
                <span className="text-sm font-medium text-gray-600">{metric.title}</span>
              </div>
            </div>
            
            <div className="flex items-baseline space-x-1">
              <span className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}
              </span>
              {metric.unit && (
                <span className="text-sm text-gray-500">{metric.unit}</span>
              )}
            </div>

            {metric.max && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className={`h-2 rounded-full ${
                      metric.value >= metric.max * 0.8 ? 'bg-success' :
                      metric.value >= metric.max * 0.6 ? 'bg-warning' : 'bg-danger'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(metric.value / metric.max) * 100}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {metric.value} de {metric.max}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Resumen de Categorías */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Completitud por Categoría</h3>
        <div className="space-y-4">
          {Object.entries(analysis.categoryBreakdown).map(([category, data]) => (
            <div key={category} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700 capitalize">{category}</span>
                <span className="text-sm text-gray-600">
                  {data.present} / {data.expected} ({data.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  className={`h-3 rounded-full ${
                    data.percentage >= 80 ? 'bg-success' :
                    data.percentage >= 60 ? 'bg-warning' : 'bg-danger'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${data.percentage}%` }}
                  transition={{ duration: 1, delay: 0.8 }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Alertas y Recomendaciones */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        {analysis.criticalIssues.length > 0 && (
          <div className="glass-card p-4 border-l-4 border-danger">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-danger text-xl">🚨</span>
              <h4 className="font-semibold text-danger">Issues Críticos</h4>
            </div>
            <ul className="space-y-1">
              {analysis.criticalIssues.slice(0, 3).map((issue, index) => (
                <li key={index} className="text-sm text-gray-700">• {issue}</li>
              ))}
              {analysis.criticalIssues.length > 3 && (
                <li className="text-sm text-gray-500">... y {analysis.criticalIssues.length - 3} más</li>
              )}
            </ul>
          </div>
        )}

        {analysis.recommendations.length > 0 && (
          <div className="glass-card p-4 border-l-4 border-info">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-info text-xl">💡</span>
              <h4 className="font-semibold text-info">Recomendaciones</h4>
            </div>
            <ul className="space-y-1">
              {analysis.recommendations.slice(0, 3).map((rec, index) => (
                <li key={index} className="text-sm text-gray-700">• {rec}</li>
              ))}
              {analysis.recommendations.length > 3 && (
                <li className="text-sm text-gray-500">... y {analysis.recommendations.length - 3} más</li>
              )}
            </ul>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MetricsDisplay;
