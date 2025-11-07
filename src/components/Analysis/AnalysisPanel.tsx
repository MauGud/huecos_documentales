import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AnalysisResult, DocumentGap } from '../../types/documents';
import { MetricsDisplay } from './MetricsDisplay';
import { ActionsList } from './ActionsList';
import { ExportButtons } from './ExportButtons';
import { PieChart, BarChart, LineChart, Pie, XAxis, YAxis, Tooltip, Bar } from 'recharts';

interface AnalysisPanelProps {
  analysis: AnalysisResult;
  onGapClick: (gap: DocumentGap) => void;
  className?: string;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  analysis,
  onGapClick,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'actions' | 'charts'>('overview');

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return 'ℹ️';
      case 'low': return '✅';
      default: return '❓';
    }
  };

  // Datos para gráficos
  const pieChartData = [
    { name: 'Presentes', value: analysis.categoryBreakdown.ownership.present + analysis.categoryBreakdown.fiscal.present + analysis.categoryBreakdown.registration.present + analysis.categoryBreakdown.verification.present, color: '#10B981' },
    { name: 'Faltantes', value: analysis.gaps.length, color: '#EF4444' }
  ];

  const categoryData = [
    { name: 'Propiedad', presente: analysis.categoryBreakdown.ownership.present, faltante: analysis.categoryBreakdown.ownership.expected - analysis.categoryBreakdown.ownership.present, percentage: analysis.categoryBreakdown.ownership.percentage },
    { name: 'Fiscal', presente: analysis.categoryBreakdown.fiscal.present, faltante: analysis.categoryBreakdown.fiscal.expected - analysis.categoryBreakdown.fiscal.present, percentage: analysis.categoryBreakdown.fiscal.percentage },
    { name: 'Registro', presente: analysis.categoryBreakdown.registration.present, faltante: analysis.categoryBreakdown.registration.expected - analysis.categoryBreakdown.registration.present, percentage: analysis.categoryBreakdown.registration.percentage },
    { name: 'Verificación', presente: analysis.categoryBreakdown.verification.present, faltante: analysis.categoryBreakdown.verification.expected - analysis.categoryBreakdown.verification.present, percentage: analysis.categoryBreakdown.verification.percentage }
  ];

  const severityData = [
    { name: 'Crítico', value: analysis.priorityActions.critical.length, color: '#EF4444' },
    { name: 'Alto', value: analysis.priorityActions.high.length, color: '#F59E0B' },
    { name: 'Medio', value: analysis.priorityActions.medium.length, color: '#3B82F6' },
    { name: 'Bajo', value: analysis.priorityActions.low.length, color: '#6B7280' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Score Principal */}
      <motion.div
        className="text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative inline-block">
          <div className="w-48 h-48 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl font-bold">{analysis.score}</div>
              <div className="text-lg">/ 100</div>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-2xl">{getRiskIcon(analysis.riskLevel)}</span>
          </div>
        </div>
        <div className="mt-4">
          <h2 className="text-2xl font-bold text-gray-800">Score de Completitud</h2>
          <p className="text-gray-600">Nivel de riesgo: <span className={`font-semibold ${getRiskColor(analysis.riskLevel)} px-2 py-1 rounded-full`}>
            {analysis.riskLevel.toUpperCase()}
          </span></p>
        </div>
      </motion.div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          className="glass-card p-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-3xl font-bold text-success">{analysis.completenessPercentage.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Completitud</div>
        </motion.div>
        
        <motion.div
          className="glass-card p-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-3xl font-bold text-danger">{analysis.gaps.length}</div>
          <div className="text-sm text-gray-600">Gaps Detectados</div>
        </motion.div>
        
        <motion.div
          className="glass-card p-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-3xl font-bold text-warning">{analysis.criticalIssues.length}</div>
          <div className="text-sm text-gray-600">Críticos</div>
        </motion.div>
        
        <motion.div
          className="glass-card p-4 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-3xl font-bold text-info">{analysis.recommendations.length}</div>
          <div className="text-sm text-gray-600">Recomendaciones</div>
        </motion.div>
      </div>

      {/* Recomendaciones Principales */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recomendaciones Prioritarias</h3>
        <div className="space-y-3">
          {analysis.recommendations.slice(0, 5).map((rec, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>
              <p className="text-gray-700">{rec}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderBreakdown = () => (
    <div className="space-y-6">
      {/* Desglose por Categoría */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Desglose por Categoría</h3>
        <div className="space-y-4">
          {Object.entries(analysis.categoryBreakdown).map(([category, data]) => (
            <div key={category} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700 capitalize">{category}</span>
                <span className="text-sm text-gray-600">{data.present} / {data.expected} ({data.percentage.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  className={`h-3 rounded-full ${
                    data.percentage >= 80 ? 'bg-success' :
                    data.percentage >= 60 ? 'bg-warning' : 'bg-danger'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${data.percentage}%` }}
                  transition={{ duration: 1, delay: 0.2 }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Problemas de Consistencia Temporal */}
      {analysis.temporalIssues.length > 0 && (
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Problemas de Consistencia Temporal</h3>
          <div className="space-y-3">
            {analysis.temporalIssues.map((issue, index) => (
              <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-600">⚠️</span>
                  <div>
                    <div className="font-medium text-yellow-800">{issue.description}</div>
                    <div className="text-sm text-yellow-700 mt-1">{issue.suggestedFix}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Validación de Cadena de Propiedad */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cadena de Propiedad</h3>
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-4 h-4 rounded-full ${analysis.ownershipValidation.isValid ? 'bg-success' : 'bg-danger'}`}></div>
          <span className="font-medium">
            {analysis.ownershipValidation.isValid ? 'Cadena válida' : 'Cadena incompleta'}
          </span>
        </div>
        
        {analysis.ownershipValidation.issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Problemas detectados:</h4>
            {analysis.ownershipValidation.issues.map((issue, index) => (
              <div key={index} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                • {issue}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );

  const renderCharts = () => (
    <div className="space-y-6">
      {/* Gráfico de Completitud General */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución de Documentos</h3>
        <div className="h-64">
          <PieChart width={400} height={200} data={pieChartData}>
            <Pie
              dataKey="value"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              data={pieChartData}
              label={({ name, value }) => `${name}: ${value}`}
            />
            <Tooltip />
          </PieChart>
        </div>
      </motion.div>

      {/* Gráfico de Categorías */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Completitud por Categoría</h3>
        <div className="h-64">
          <BarChart width={400} height={200} data={categoryData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="presente" fill="#10B981" name="Presentes" />
            <Bar dataKey="faltante" fill="#EF4444" name="Faltantes" />
          </BarChart>
        </div>
      </motion.div>

      {/* Gráfico de Severidad */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribución por Severidad</h3>
        <div className="h-64">
          <BarChart width={400} height={200} data={severityData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Análisis de Completitud</h1>
            <p className="text-gray-600">Evaluación detallada del expediente vehicular</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(analysis.riskLevel)}`}>
              {getRiskIcon(analysis.riskLevel)} {analysis.riskLevel.toUpperCase()}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Resumen', icon: '📊' },
          { id: 'breakdown', label: 'Desglose', icon: '📋' },
          { id: 'actions', label: 'Acciones', icon: '🎯' },
          { id: 'charts', label: 'Gráficos', icon: '📈' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'breakdown' && renderBreakdown()}
        {activeTab === 'actions' && <ActionsList analysis={analysis} onGapClick={onGapClick} />}
        {activeTab === 'charts' && renderCharts()}
      </motion.div>

      {/* Export Buttons */}
      <ExportButtons analysis={analysis} />
    </div>
  );
};

export default AnalysisPanel;
