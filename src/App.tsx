import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VehicleDocument, DocumentGap, AnalysisResult } from './types/documents';
import { documentGapAnalyzer } from './utils/documentGapAnalyzer';
import { nexcarApi } from './services/api/nexcarApi';
import { VehicleTimeline } from './components/Timeline/VehicleTimeline';
import { DocumentCardList } from './components/DocumentCard/DocumentCardList';
import { AnalysisPanel } from './components/Analysis/AnalysisPanel';
import { DocumentUploader } from './components/Upload/DocumentUploader';
import { DocumentPreview } from './components/DocumentCard/DocumentPreview';
import { SystemNotification } from './types/documents';
import { DocumentGapAnalyzer } from './utils/documentGapAnalyzer';

function App() {
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [gaps, setGaps] = useState<DocumentGap[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'timeline' | 'list' | 'analysis'>('upload');
  const [selectedDocument, setSelectedDocument] = useState<VehicleDocument | null>(null);
  const [selectedGap, setSelectedGap] = useState<DocumentGap | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar datos desde localStorage al inicializar
  useEffect(() => {
    // Limpiar localStorage para evitar duplicados
    localStorage.removeItem('huecos_doc_documents');
    setDocuments([]);
    console.log('📄 Iniciando con lista vacía de documentos');
  }, []);

  // Guardar documentos en localStorage cuando cambien
  useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem('huecos_doc_documents', JSON.stringify(documents));
    }
  }, [documents]);

  // Analizar documentos cuando cambien
  useEffect(() => {
    if (documents.length > 0) {
      console.log('🔍 Analizando documentos reales...', documents);
      console.log('📄 Número de documentos a analizar:', documents.length);
      
      const analyzer = new DocumentGapAnalyzer();
      const result = analyzer.analyzeDocumentCompleteness(documents);
      
      console.log('📊 Resultado del análisis completo:', result);
      console.log('🔍 Gaps detectados:', result.gaps.length);
      console.log('📋 Lista de gaps:', result.gaps.map(gap => ({ type: gap.type, reason: gap.reason, severity: gap.severity })));
      
      setGaps(result.gaps);
      setAnalysis(result);
      
      // Mostrar notificación con el resultado
      addNotification('info', 'Análisis completado', `Se detectaron ${result.gaps.length} huecos documentales`);
    } else {
      console.log('📄 No hay documentos para analizar');
      setGaps([]);
      setAnalysis(null);
    }
  }, [documents]);


  // Verificar autenticación con API
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authState = nexcarApi.getAuthState();
        if (!authState.isAuthenticated) {
          await nexcarApi.authenticate();
          addNotification('success', 'Conectado a API Nexcar', 'Autenticación exitosa');
        }
      } catch (error) {
        console.error('Error de autenticación:', error);
        addNotification('error', 'Error de conexión', 'No se pudo conectar a la API');
      }
    };

    checkAuth();
  }, []);

  const addNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const notification: SystemNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date(),
      autoClose: true,
      duration: 5000
    };
    
    setNotifications(prev => [notification, ...prev]);
    
    if (notification.autoClose) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, notification.duration);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const handleDocumentProcessed = (document: VehicleDocument) => {
    console.log('📄 Documento procesado:', document);
    setDocuments(prev => {
      const newDocs = [document, ...prev];
      console.log('📄 Total de documentos:', newDocs.length);
      return newDocs;
    });
    addNotification('success', 'Documento procesado', `${document.type} procesado exitosamente`);
  };

  const handleDocumentClick = (document: VehicleDocument) => {
    setSelectedDocument(document);
    setSelectedGap(null);
    setIsPreviewOpen(true);
  };

  const handleGapClick = (gap: DocumentGap) => {
    setSelectedGap(gap);
    setSelectedDocument(null);
    setIsPreviewOpen(true);
  };

  const handleError = (error: string) => {
    addNotification('error', 'Error de procesamiento', error);
  };

  const clearAllData = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar todos los datos?')) {
      setDocuments([]);
      setGaps([]);
      setAnalysis(null);
      localStorage.removeItem('huecos_doc_documents');
      addNotification('info', 'Datos eliminados', 'Todos los datos han sido eliminados');
    }
  };

  const tabs = [
    { id: 'upload', label: 'Cargar Documentos', icon: '📤' },
    { id: 'timeline', label: 'Timeline', icon: '📅' },
    { id: 'list', label: 'Lista', icon: '📋' },
    { id: 'analysis', label: 'Análisis', icon: '📊' }
  ];

  return (
    <div className="min-h-screen bg-gradient-main">
      {/* Header */}
      <motion.header
        className="glass-card-strong p-6 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              🚗 Huecos Doc
            </h1>
            <p className="text-white/80">
              Sistema de Detección de Huecos Documentales Vehiculares
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {analysis && (
              <div className="text-right text-white">
                <div className="text-2xl font-bold">{analysis.score}/100</div>
                <div className="text-sm opacity-80">Score de Completitud</div>
              </div>
            )}
            
            <button
              onClick={clearAllData}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
            >
              Limpiar Todo
            </button>
          </div>
        </div>
        
      </motion.header>

      {/* Navigation Tabs */}
      <motion.nav
        className="glass-card p-2 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </motion.nav>

      {/* Main Content */}
      <motion.main
        className="container mx-auto px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <DocumentUploader
                onDocumentProcessed={handleDocumentProcessed}
                onError={handleError}
              />
            </motion.div>
          )}

          {activeTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <VehicleTimeline
                documents={documents}
                gaps={gaps}
                onDocumentClick={handleDocumentClick}
                onGapClick={handleGapClick}
              />
            </motion.div>
          )}

          {activeTab === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <DocumentCardList
                documents={documents}
                gaps={gaps}
                onDocumentClick={handleDocumentClick}
                onGapClick={handleGapClick}
              />
            </motion.div>
          )}

          {activeTab === 'analysis' && analysis && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <AnalysisPanel
                analysis={analysis}
                onGapClick={handleGapClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>

      {/* Document Preview Modal */}
      <DocumentPreview
        document={selectedDocument || undefined}
        gap={selectedGap || undefined}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="glass-card p-4 max-w-sm"
            >
              <div className="flex items-start space-x-3">
                <span className="text-xl">
                  {notification.type === 'success' ? '✅' :
                   notification.type === 'error' ? '❌' :
                   notification.type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{notification.title}</h4>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="glass-card p-8 text-center">
            <div className="loading-dots mx-auto mb-4">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
            <p className="text-gray-600">Procesando...</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default App;
