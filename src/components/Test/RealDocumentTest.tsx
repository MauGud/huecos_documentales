import React, { useState, useEffect } from 'react';
import { VehicleDocument, DocumentGap, AnalysisResult } from '../../types/documents';
import { DocumentGapAnalyzer } from '../../utils/documentGapAnalyzer';
import { realTestDocuments, expectedGapsAnalysis } from '../../data/realTestDocuments';

interface TestResult {
  passed: boolean;
  message: string;
  details: any;
}

const RealDocumentTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

  const runRealAnalysis = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    console.log('🧪 INICIANDO PRUEBA REAL DE ANÁLISIS DE DOCUMENTOS');
    console.log('📄 Documentos de prueba:', realTestDocuments);
    
    try {
      // Ejecutar análisis real
      const analyzer = new DocumentGapAnalyzer();
      const result = analyzer.analyzeDocumentCompleteness(realTestDocuments);
      
      console.log('📊 Resultado del análisis real:', result);
      setAnalysis(result);
      
      // Ejecutar pruebas de validación
      const tests: TestResult[] = [];
      
      // Test 1: Verificar detección de gaps críticos
      const criticalGaps = result.gaps.filter(gap => gap.severity === 'critical');
      tests.push({
        passed: criticalGaps.length >= 2,
        message: `Detección de gaps críticos: ${criticalGaps.length}/2 esperados`,
        details: {
          expected: 2,
          actual: criticalGaps.length,
          gaps: criticalGaps.map(gap => ({ type: gap.type, reason: gap.reason }))
        }
      });
      
      // Test 2: Verificar detección de gap de refrendo
      const refrendoGap = result.gaps.find(gap => gap.type === 'refrendo');
      tests.push({
        passed: !!refrendoGap,
        message: `Detección de gap de refrendo: ${refrendoGap ? 'DETECTADO' : 'NO DETECTADO'}`,
        details: refrendoGap ? {
          type: refrendoGap.type,
          severity: refrendoGap.severity,
          reason: refrendoGap.reason
        } : null
      });
      
      // Test 3: Verificar detección de gap de transferencia
      const transferGap = result.gaps.find(gap => gap.type === 'factura_endosada');
      tests.push({
        passed: !!transferGap,
        message: `Detección de gap de transferencia: ${transferGap ? 'DETECTADO' : 'NO DETECTADO'}`,
        details: transferGap ? {
          type: transferGap.type,
          severity: transferGap.severity,
          reason: transferGap.reason
        } : null
      });
      
      // Test 4: Verificar score de completitud
      const scoreTest = result.score <= 50; // Score bajo esperado
      tests.push({
        passed: scoreTest,
        message: `Score de completitud: ${result.score}/100 (esperado ≤50)`,
        details: {
          score: result.score,
          expected: '≤50',
          interpretation: result.score <= 50 ? 'CORRECTO - Score bajo por gaps críticos' : 'INCORRECTO - Score demasiado alto'
        }
      });
      
      // Test 5: Verificar detección de cambio de propietario
      const ownerChange = result.gaps.some(gap => 
        gap.reason.includes('VIVIANA') && gap.reason.includes('JOCELYN')
      );
      tests.push({
        passed: ownerChange,
        message: `Detección de cambio de propietario: ${ownerChange ? 'DETECTADO' : 'NO DETECTADO'}`,
        details: {
          expected: 'Cambio de VIVIANA a JOCELYN',
          detected: ownerChange
        }
      });
      
      // Test 6: Verificar detección de VIN consistente
      const vinConsistent = realTestDocuments.every(doc => doc.vin === '3N1CK3CD1HL255099');
      tests.push({
        passed: vinConsistent,
        message: `Consistencia de VIN: ${vinConsistent ? 'CONSISTENTE' : 'INCONSISTENTE'}`,
        details: {
          expected: '3N1CK3CD1HL255099',
          actual: realTestDocuments.map(doc => ({ id: doc.id, vin: doc.vin }))
        }
      });
      
      setTestResults(tests);
      
      console.log('✅ PRUEBAS COMPLETADAS');
      console.log('📋 Resultados:', tests);
      
    } catch (error) {
      console.error('❌ Error en análisis real:', error);
      setTestResults([{
        passed: false,
        message: 'Error en análisis: ' + error,
        details: { error: error instanceof Error ? error.message : String(error) }
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  const getTestIcon = (passed: boolean) => {
    return passed ? '✅' : '❌';
  };

  const getTestColor = (passed: boolean) => {
    return passed ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          🧪 Prueba Real de Análisis de Documentos
        </h2>
        <button
          onClick={runRealAnalysis}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            isRunning
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isRunning ? 'Ejecutando...' : 'Ejecutar Prueba Real'}
        </button>
      </div>

      {analysis && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">📊 Resultado del Análisis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analysis.score}</div>
              <div className="text-sm text-gray-600">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{analysis.gaps.filter(g => g.severity === 'critical').length}</div>
              <div className="text-sm text-gray-600">Gaps Críticos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{analysis.gaps.filter(g => g.severity === 'high').length}</div>
              <div className="text-sm text-gray-600">Gaps Altos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{analysis.gaps.length}</div>
              <div className="text-sm text-gray-600">Total Gaps</div>
            </div>
          </div>
        </div>
      )}

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">🔍 Resultados de las Pruebas</h3>
          {testResults.map((test, index) => (
            <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
              <span className="text-2xl">{getTestIcon(test.passed)}</span>
              <div className="flex-1">
                <div className={`font-semibold ${getTestColor(test.passed)}`}>
                  {test.message}
                </div>
                {test.details && (
                  <div className="mt-2 text-sm text-gray-600">
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(test.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">📋 Resumen de Pruebas</h4>
            <div className="text-sm text-blue-700">
              <div>Total de pruebas: {testResults.length}</div>
              <div>Exitosas: {testResults.filter(t => t.passed).length}</div>
              <div>Fallidas: {testResults.filter(t => !t.passed).length}</div>
              <div className="mt-2 font-semibold">
                Resultado: {testResults.filter(t => t.passed).length === testResults.length ? '✅ TODAS LAS PRUEBAS PASARON' : '❌ ALGUNAS PRUEBAS FALLARON'}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">📄 Documentos de Prueba</h4>
        <div className="text-sm text-yellow-700">
          <div>• Factura de origen (2017) - VIVIANA ELIZABETH REVILLA SALAZAR</div>
          <div>• Tarjeta de circulación (2022) - JOCELYN BERENICE CEDILLO MARTINEZ</div>
          <div>• VIN: 3N1CK3CD1HL255099 (NISSAN MARCH 2017)</div>
          <div>• Placa: SUG2403 (Nuevo León)</div>
        </div>
      </div>
    </div>
  );
};

export default RealDocumentTest;
