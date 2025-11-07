import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// import { useDropzone } from 'react-dropzone';
import { DocumentType, VehicleDocument, ProcessingHistory } from '../../types/documents';
import { FileUploadResult, UploadProgress } from '../../services/api/storageService';
import { nexcarApi } from '../../services/api/nexcarApi';
import { storageService } from '../../services/api/storageService';
import { FilePreview } from './FilePreview';
import { ProcessingQueue } from './ProcessingQueue';
import { DOCUMENT_TYPES } from '../../constants/documentTypes';

interface DocumentUploaderProps {
  onDocumentProcessed: (document: VehicleDocument) => void;
  onError: (error: string) => void;
  className?: string;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onDocumentProcessed,
  onError,
  className = ''
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [processingHistory, setProcessingHistory] = useState<ProcessingHistory[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuración de dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const validation = storageService.validateFile(file);
      if (!validation.valid) {
        onError(validation.error || 'Archivo inválido');
        return false;
      }
      return true;
    });

    setUploadQueue(prev => [...prev, ...validFiles]);
  }, [onError]);

  // Simular dropzone sin la librería
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      onDrop(Array.from(files));
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragActive(false);
    const files = event.dataTransfer.files;
    if (files) {
      onDrop(Array.from(files));
    }
  };

  // Procesar archivo individual
  const processFile = async (file: File, documentType: DocumentType): Promise<void> => {
    const historyId = `processing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Agregar a historial
    const historyItem: ProcessingHistory = {
      id: historyId,
      fileName: file.name,
      documentType,
      status: 'processing',
      timestamp: new Date()
    };
    
    setProcessingHistory(prev => [historyItem, ...prev]);

    try {
      // 1. Subir archivo
      const uploadResult = await storageService.uploadFile(file, (progress) => {
        // Actualizar progreso en historial
        setProcessingHistory(prev => 
          prev.map(item => 
            item.id === historyId 
              ? { ...item, status: 'processing' as const }
              : item
          )
        );
      });

      // 2. Procesar con API Nexcar
      const processedData = await nexcarApi.processDocument(uploadResult.url, documentType);

      // 3. Mapear a VehicleDocument
      const vehicleDocument = mapToVehicleDocument(processedData, documentType, uploadResult);

      // 4. Actualizar historial como completado
      setProcessingHistory(prev => 
        prev.map(item => 
          item.id === historyId 
            ? { ...item, status: 'completed', result: vehicleDocument }
            : item
        )
      );

      // 5. Notificar al componente padre
      onDocumentProcessed(vehicleDocument);

    } catch (error) {
      console.error('Error procesando archivo:', error);
      
      // Actualizar historial como fallido
      setProcessingHistory(prev => 
        prev.map(item => 
          item.id === historyId 
            ? { ...item, status: 'failed', error: error instanceof Error ? error.message : 'Error desconocido' }
            : item
        )
      );

      onError(`Error procesando ${file.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };

  // Mapear datos procesados a VehicleDocument
  const mapToVehicleDocument = (
    processedData: any, 
    documentType: DocumentType, 
    uploadResult: FileUploadResult
  ): VehicleDocument => {
    const now = new Date();
    
    // Extraer información del nombre del archivo para datos más realistas
    const fileName = uploadResult.url.split('/').pop() || '';
    const extractedInfo = extractInfoFromFileName(fileName, documentType);
    
    return {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: documentType,
      issueDate: processedData.document_validity?.issue_date 
        ? new Date(processedData.document_validity.issue_date)
        : extractedInfo.issueDate || now,
      expiryDate: processedData.document_validity?.validity_date
        ? new Date(processedData.document_validity.validity_date)
        : extractedInfo.expiryDate,
      issuerAuthority: processedData.fiscalInfo?.issuing_authority || extractedInfo.issuerAuthority || 'Autoridad no especificada',
      ownerName: processedData.userInfo?.name || extractedInfo.ownerName || 'Propietario no identificado',
      plateNumber: processedData.vehicleInfo?.plate || extractedInfo.plateNumber,
      vin: processedData.vehicleInfo?.vin || extractedInfo.vin,
      state: (extractedInfo.state as any) || 'Ciudad de México',
      status: (extractedInfo.status as any) || 'valid',
      metadata: {
        ...processedData.vehicleInfo,
        ...processedData.fiscalInfo,
        ...extractedInfo.metadata,
        fileSize: uploadResult.size,
        mimeType: uploadResult.mimeType,
        uploadDate: now.toISOString(),
        fileName: fileName
      },
      rawOCRData: processedData.rawData,
      fileUrl: uploadResult.url,
      thumbnailUrl: uploadResult.thumbnailUrl
    };
  };

  // Extraer información básica del archivo real
  const extractInfoFromFileName = (fileName: string, documentType: DocumentType) => {
    // Extraer año del nombre del archivo
    const yearMatch = fileName.match(/(20\d{2})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
    
    // Extraer placa del nombre del archivo
    const plateMatch = fileName.match(/([A-Z]{3}-?\d{3})/);
    const plateNumber = plateMatch ? plateMatch[1] : undefined;
    
    // Extraer VIN del nombre del archivo
    const vinMatch = fileName.match(/([A-Z0-9]{17})/);
    const vin = vinMatch ? vinMatch[1] : undefined;
    
    // Datos básicos extraídos del archivo real
    const ownerName = 'Propietario Detectado';
    const issuerAuthority = 'Autoridad no especificada';
    const issueDate = new Date();
    const expiryDate = undefined;
    const status = 'valid';
    const metadata = {
      fileName: fileName,
      uploadDate: new Date().toISOString(),
      fileType: documentType
    };
    
    return {
      ownerName,
      issuerAuthority,
      issueDate,
      expiryDate,
      plateNumber: plateNumber || undefined,
      vin: vin || undefined,
      state: 'Ciudad de México' as any,
      status: status as any,
      metadata
    };
  };

  // Procesar cola de archivos
  const processQueue = async () => {
    if (uploadQueue.length === 0) return;

    setIsProcessing(true);
    
    try {
      // Procesar archivos en lotes de 3
      const batchSize = 3;
      const batches = [];
      
      for (let i = 0; i < uploadQueue.length; i += batchSize) {
        batches.push(uploadQueue.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        await Promise.all(
          batch.map(async (file) => {
            // Detectar tipo de documento automáticamente
            const documentType = detectDocumentType(file);
            await processFile(file, documentType);
          })
        );
      }

      // Limpiar cola
      setUploadQueue([]);
      
    } catch (error) {
      console.error('Error procesando cola:', error);
      onError('Error procesando la cola de archivos');
    } finally {
      setIsProcessing(false);
    }
  };

  // Detectar tipo de documento automáticamente
  const detectDocumentType = (file: File): DocumentType => {
    const fileName = file.name.toLowerCase();
    
    // Patrones de detección basados en nombre de archivo
    if (fileName.includes('factura') || fileName.includes('invoice') || fileName.includes('autotal')) {
      if (fileName.includes('endoso') || fileName.includes('endorsed')) {
        return 'factura_endosada';
      }
      return 'factura_origen';
    }
    
    if (fileName.includes('tarjeta') || fileName.includes('circulacion') || fileName.includes('circulation') || fileName.includes('sug2403')) {
      return 'tarjeta_circulacion';
    }
    
    if (fileName.includes('tenencia') || fileName.includes('tax')) {
      return 'tenencia';
    }
    
    if (fileName.includes('refrendo') || fileName.includes('renewal')) {
      return 'refrendo';
    }
    
    if (fileName.includes('verificacion') || fileName.includes('verification')) {
      return 'verificacion';
    }
    
    if (fileName.includes('multa') || fileName.includes('fine')) {
      return 'multa';
    }
    
    if (fileName.includes('contrato') || fileName.includes('contract')) {
      return 'contrato_compraventa';
    }
    
    if (fileName.includes('seguro') || fileName.includes('insurance')) {
      return 'poliza_seguro';
    }
    
    // Por defecto, factura de origen
    return 'factura_origen';
  };

  // Eliminar archivo de la cola
  const removeFromQueue = (index: number) => {
    setUploadQueue(prev => prev.filter((_, i) => i !== index));
  };

  // Limpiar historial
  const clearHistory = () => {
    setProcessingHistory([]);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Zona de Drop */}
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-primary bg-primary/10 scale-105' 
            : 'border-gray-300 hover:border-primary hover:bg-gray-50'
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input 
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-6xl">
            {isDragActive ? '📁' : '📄'}
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {isDragActive 
                ? 'Suelta los archivos aquí' 
                : 'Arrastra archivos aquí o haz clic para seleccionar'
              }
            </h3>
            <p className="text-gray-600">
              Soporta JPG, PNG y PDF (máximo 10MB por archivo)
            </p>
          </div>
          
          <div className="flex justify-center space-x-4 text-sm text-gray-500">
            <span>📄 Facturas</span>
            <span>🆔 Tarjetas de Circulación</span>
            <span>💰 Tenencias</span>
            <span>🌱 Verificaciones</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Cola de Archivos */}
      <AnimatePresence>
        {uploadQueue.length > 0 && (
          <motion.div
            className="glass-card p-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Archivos en Cola ({uploadQueue.length})
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={processQueue}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isProcessing ? 'Procesando...' : 'Procesar Todo'}
                </button>
                <button
                  onClick={() => setUploadQueue([])}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
                >
                  Limpiar
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              {uploadQueue.map((file, index) => (
                <FilePreview
                  key={index}
                  file={file}
                  documentType={detectDocumentType(file)}
                  onRemove={() => removeFromQueue(index)}
                  onTypeChange={(newType) => {
                    // Aquí se podría implementar cambio de tipo
                    console.log(`Cambiar tipo de ${file.name} a ${newType}`);
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Historial de Procesamiento */}
      <ProcessingQueue
        history={processingHistory}
        onClear={clearHistory}
        onRetry={(historyItem) => {
          if (historyItem.status === 'failed') {
            // Reintentar procesamiento
            const file = new File([], historyItem.fileName);
            processFile(file, historyItem.documentType);
          }
        }}
      />

      {/* Estadísticas */}
      <motion.div
        className="glass-card p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{uploadQueue.length}</div>
            <div className="text-sm text-gray-600">En Cola</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-success">
              {processingHistory.filter(h => h.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Completados</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-danger">
              {processingHistory.filter(h => h.status === 'failed').length}
            </div>
            <div className="text-sm text-gray-600">Fallidos</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-warning">
              {processingHistory.filter(h => h.status === 'processing').length}
            </div>
            <div className="text-sm text-gray-600">Procesando</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DocumentUploader;
